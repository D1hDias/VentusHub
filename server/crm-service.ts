/**
 * CRM Service - Serviços especializados para o sistema CRM
 * Inclui auditoria automática, notificações e processamento de lembretes
 */

import { db } from "./db.js";
import { 
  clientNotes, 
  clientNoteAuditLogs, 
  scheduledNotifications,
  notifications 
} from "../shared/schema.js";
import { eq, and, lte, gte } from "drizzle-orm";

interface AuditLogData {
  noteId: number;
  userId: string;
  action: 'created' | 'updated' | 'status_changed' | 'completed' | 'cancelled';
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

interface NotificationData {
  userId: string;
  relatedType: 'client_note' | 'reminder' | 'meeting';
  relatedId: number;
  title: string;
  message: string;
  scheduledFor: Date;
  notificationType?: 'email' | 'push' | 'sms' | 'in_app';
  metadata?: Record<string, any>;
}

/**
 * Serviço de Auditoria
 */
export class AuditService {
  /**
   * Criar log de auditoria para uma nota
   */
  static async createAuditLog(data: AuditLogData): Promise<void> {
    try {
      await db.insert(clientNoteAuditLogs).values({
        ...data,
        createdAt: new Date()
      });
      console.log(`Audit log created for note ${data.noteId}: ${data.action}`);
    } catch (error: any) {
      console.error("Error creating audit log:", error);
      throw error;
    }
  }

  /**
   * Comparar valores e criar auditoria automática de mudanças
   */
  static async auditNoteChanges(
    noteId: number,
    userId: string,
    oldNote: any,
    newNote: any,
    reason?: string
  ): Promise<void> {
    const changes: Array<Omit<AuditLogData, 'noteId' | 'userId'>> = [];

    // Campos para monitorar mudanças
    const fieldsToAudit = [
      'title', 'content', 'type', 'priority', 'status', 
      'isCompleted', 'reminderDate', 'location', 'participants',
      'duration', 'callResult', 'nextSteps'
    ];

    for (const field of fieldsToAudit) {
      if (oldNote[field] !== newNote[field]) {
        changes.push({
          action: 'updated',
          field,
          oldValue: String(oldNote[field] || ''),
          newValue: String(newNote[field] || ''),
          reason: reason || 'Atualização automática'
        });
      }
    }

    // Status específicos
    if (oldNote.isCompleted !== newNote.isCompleted && newNote.isCompleted) {
      changes.push({
        action: 'completed',
        field: 'isCompleted',
        oldValue: 'false',
        newValue: 'true',
        reason: reason || 'Marcado como completo'
      });
    }

    // Criar logs de auditoria em batch
    for (const change of changes) {
      await this.createAuditLog({
        noteId,
        userId,
        ...change
      });
    }
  }
}

/**
 * Serviço de Notificações
 */
export class NotificationService {
  /**
   * Agendar notificação
   */
  static async scheduleNotification(data: NotificationData): Promise<number> {
    try {
      const notification = await db.insert(scheduledNotifications).values({
        ...data,
        notificationType: data.notificationType || 'in_app',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`Notification scheduled for ${data.scheduledFor}: ${data.title}`);
      return notification[0].id;
    } catch (error: any) {
      console.error("Error scheduling notification:", error);
      throw error;
    }
  }

  /**
   * Processar notificações pendentes
   * Este método deve ser chamado por um cron job
   */
  static async processPendingNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      // Buscar notificações pendentes que já devem ser enviadas
      const pendingNotifications = await db.select()
        .from(scheduledNotifications)
        .where(and(
          eq(scheduledNotifications.status, 'pending'),
          lte(scheduledNotifications.scheduledFor, now)
        ));

      console.log(`Processing ${pendingNotifications.length} pending notifications`);

      for (const notification of pendingNotifications) {
        try {
          // Criar notificação in-app
          await db.insert(notifications).values({
            userId: String(notification.userId), // Fixed: convert to string
            type: 'info', // Required field
            title: notification.title,
            message: notification.message,
            category: 'crm',
            // relatedEntityId: notification.relatedId?.toString(), // Commented out due to schema mismatch
            relatedEntityType: notification.relatedType,
            isRead: false,
            createdAt: new Date()
          });

          // Marcar como enviada
          await db.update(scheduledNotifications)
            .set({
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(scheduledNotifications.id, notification.id));

          console.log(`Notification sent: ${notification.title}`);
        } catch (error: any) {
          // Marcar como falha e incrementar retry count
          await db.update(scheduledNotifications)
            .set({
              status: 'failed',
              failureReason: error instanceof Error ? error.message : String(error),
              retryCount: (notification.retryCount || 0) + 1,
              updatedAt: new Date()
            })
            .where(eq(scheduledNotifications.id, notification.id));

          console.error(`Failed to send notification ${notification.id}:`, error);
        }
      }
    } catch (error: any) {
      console.error("Error processing pending notifications:", error);
    }
  }

  /**
   * Cancelar notificação agendada
   */
  static async cancelNotification(notificationId: number, userId: string): Promise<void> {
    try {
      await db.update(scheduledNotifications)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(and(
          eq(scheduledNotifications.id, notificationId),
          eq(scheduledNotifications.userId, userId)
        ));

      console.log(`Notification ${notificationId} cancelled`);
    } catch (error: any) {
      console.error("Error cancelling notification:", error);
      throw error;
    }
  }
}

/**
 * Serviço CRM Principal
 */
export class CRMService {
  /**
   * Criar nota com auditoria automática
   */
  static async createNoteWithAudit(
    noteData: any,
    userId: string,
    reason?: string
  ): Promise<any> {
    try {
      // Criar nota
      const note = await db.insert(clientNotes)
        .values({
          ...noteData,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Criar log de auditoria
      await AuditService.createAuditLog({
        noteId: note[0].id,
        userId,
        action: 'created',
        reason: reason || 'Nota criada',
        metadata: {
          type: noteData.type,
          priority: noteData.priority
        }
      });

      // Se tem lembrete, agendar notificação
      if (noteData.reminderDate) {
        await NotificationService.scheduleNotification({
          userId,
          relatedType: 'client_note',
          relatedId: note[0].id,
          title: `Lembrete: ${noteData.title}`,
          message: noteData.content,
          scheduledFor: new Date(noteData.reminderDate),
          notificationType: 'in_app',
          metadata: {
            type: noteData.type,
            priority: noteData.priority
          }
        });
      }

      return note[0];
    } catch (error: any) {
      console.error("Error creating note with audit:", error);
      throw error;
    }
  }

  /**
   * Atualizar nota com auditoria automática
   */
  static async updateNoteWithAudit(
    noteId: number,
    userId: string,
    updateData: any,
    reason?: string
  ): Promise<any> {
    try {
      // Buscar nota atual
      const currentNote = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .limit(1);

      if (currentNote.length === 0) {
        throw new Error("Nota não encontrada");
      }

      // Atualizar nota
      const updatedNote = await db.update(clientNotes)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(and(eq(clientNotes.id, noteId), eq(clientNotes.userId, userId)))
        .returning();

      // Criar auditoria das mudanças
      await AuditService.auditNoteChanges(
        noteId,
        userId,
        currentNote[0],
        updatedNote[0],
        reason
      );

      return updatedNote[0];
    } catch (error: any) {
      console.error("Error updating note with audit:", error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas avançadas do cliente
   */
  static async getClientCRMStats(clientId: number, userId: string): Promise<any> {
    try {
      // Buscar todas as notas do cliente
      const notes = await db.select()
        .from(clientNotes)
        .where(and(eq(clientNotes.clientId, clientId), eq(clientNotes.userId, userId)));

      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return {
        total: notes.length,
        pending: notes.filter((n: any) => !n.isCompleted && n.status === 'pending').length,
        inProgress: notes.filter((n: any) => !n.isCompleted && n.status === 'in_progress').length,
        completed: notes.filter((n: any) => n.isCompleted).length,
        cancelled: notes.filter((n: any) => n.status === 'cancelled').length,
        
        // Por tipo
        byType: {
          notes: notes.filter((n: any) => n.type === 'note').length,
          reminders: notes.filter((n: any) => n.type === 'reminder').length,
          meetings: notes.filter((n: any) => n.type === 'meeting').length,
          calls: notes.filter((n: any) => n.type === 'call').length,
          followUps: notes.filter((n: any) => n.type === 'follow_up').length
        },
        
        // Por prioridade
        byPriority: {
          low: notes.filter((n: any) => n.priority === 'low').length,
          normal: notes.filter((n: any) => n.priority === 'normal').length,
          high: notes.filter((n: any) => n.priority === 'high').length,
          urgent: notes.filter((n: any) => n.priority === 'urgent').length
        },
        
        // Atividade recente
        recentActivity: {
          lastWeek: notes.filter((n: any) => new Date(n.createdAt) >= lastWeek).length,
          lastMonth: notes.filter((n: any) => new Date(n.createdAt) >= lastMonth).length
        },
        
        // Lembretes próximos
        upcomingReminders: notes.filter((n: any) => 
          !n.isCompleted && 
          n.reminderDate && 
          new Date(n.reminderDate) > now
        ).length,
        
        // Ligações
        callMetrics: {
          totalCalls: notes.filter((n: any) => n.type === 'call').length,
          successfulCalls: notes.filter((n: any) => n.type === 'call' && n.callResult === 'success').length,
          averageDuration: this.calculateAverageCallDuration(notes.filter((n: any) => n.type === 'call'))
        }
      };
    } catch (error: any) {
      console.error("Error getting client CRM stats:", error);
      throw error;
    }
  }

  /**
   * Calcular duração média das ligações
   */
  private static calculateAverageCallDuration(calls: any[]): number {
    const callsWithDuration = calls.filter((c: any) => c.duration && c.duration > 0);
    if (callsWithDuration.length === 0) return 0;
    
    const totalDuration = callsWithDuration.reduce((sum, call) => sum + call.duration, 0);
    return Math.round(totalDuration / callsWithDuration.length);
  }
}

/**
 * Inicializar processamento de notificações
 * Este deve ser chamado quando o servidor iniciar
 */
export function initCRMServices(): void {
  // Processar notificações pendentes a cada 5 minutos
  setInterval(async () => {
    await NotificationService.processPendingNotifications();
  }, 5 * 60 * 1000); // 5 minutos

  console.log("CRM Services initialized - notification processing started");
}
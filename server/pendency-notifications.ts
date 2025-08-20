/**
 * PENDENCY NOTIFICATION SYSTEM
 * 
 * Real-time notification system for pendency updates,
 * stage advancement alerts, and deadline reminders.
 */

import { db } from "./db.js";
import { 
  pendencyNotifications,
  notifications,
  stageCompletionMetrics,
  properties,
  stageRequirements,
  propertyRequirements
} from "../shared/schema.js";
import { eq, and, sql, lt, gte } from "drizzle-orm";

// ======================================
// NOTIFICATION TYPES
// ======================================

export type PendencyNotificationType = 
  | 'MISSING_DOCUMENT' 
  | 'VALIDATION_FAILED' 
  | 'STAGE_BLOCKED' 
  | 'STAGE_ADVANCED'
  | 'CRITICAL_PENDENCY'
  | 'DEADLINE_WARNING'
  | 'REQUIREMENTS_UPDATED';

export type NotificationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PendencyNotificationData {
  propertyId: number;
  requirementId?: number;
  userId: string;
  type: PendencyNotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  autoResolveAt?: Date;
}

// ======================================
// NOTIFICATION TRIGGERS
// ======================================

export class PendencyNotificationService {
  /**
   * Create a new pendency notification
   */
  static async createNotification(data: PendencyNotificationData): Promise<void> {
    try {
      // Avoid duplicate notifications
      if (data.requirementId) {
        const existing = await db.select()
          .from(pendencyNotifications)
          .where(
            and(
              eq(pendencyNotifications.propertyId, data.propertyId),
              eq(pendencyNotifications.requirementId, data.requirementId),
              eq(pendencyNotifications.notificationType, data.type),
              eq(pendencyNotifications.isResolved, false)
            )
          )
          .limit(1);
        
        if (existing.length > 0) {
          // Update existing notification instead of creating duplicate
          await db.update(pendencyNotifications)
            .set({
              title: data.title,
              message: data.message,
              severity: data.severity,
              metadata: data.metadata,
              updatedAt: new Date()
            })
            .where(eq(pendencyNotifications.id, existing[0].id));
          return;
        }
      }

      // Create pendency notification
      await db.insert(pendencyNotifications).values({
        propertyId: data.propertyId,
        requirementId: data.requirementId || null,
        userId: data.userId,
        notificationType: data.type,
        severity: data.severity,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl || null,
        metadata: data.metadata || {},
        autoResolveAt: data.autoResolveAt || null,
        isRead: false,
        isResolved: false
      });

      // Create general notification for user
      await db.insert(notifications).values({
        userId: data.userId,
        type: this.getSeverityType(data.severity),
        title: data.title,
        message: data.message,
        category: 'property',
        relatedId: data.propertyId,
        actionUrl: data.actionUrl || null,
        isRead: false
      });

    } catch (error) {
      console.error('Error creating pendency notification:', error);
    }
  }

  /**
   * Convert severity to notification type
   */
  private static getSeverityType(severity: NotificationSeverity): string {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'info';
    }
  }

  /**
   * Trigger notifications for missing critical requirements
   */
  static async notifyMissingCriticalRequirements(propertyId: number, userId: string): Promise<void> {
    try {
      // Get property details
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) return;

      const currentStage = property[0].currentStage;
      const sequenceNumber = property[0].sequenceNumber;

      // Get missing critical requirements for current stage
      const missingCritical = await db.select({
        requirement: stageRequirements,
        propertyRequirement: propertyRequirements
      })
      .from(stageRequirements)
      .leftJoin(
        propertyRequirements,
        and(
          eq(propertyRequirements.requirementId, stageRequirements.id),
          eq(propertyRequirements.propertyId, propertyId)
        )
      )
      .where(
        and(
          eq(stageRequirements.stageId, currentStage),
          eq(stageRequirements.isCritical, true),
          sql`(${propertyRequirements.status} != 'COMPLETED' OR ${propertyRequirements.status} IS NULL)`
        )
      );

      // Create notifications for each missing critical requirement
      for (const missing of missingCritical) {
        await this.createNotification({
          propertyId,
          requirementId: missing.requirement.id,
          userId,
          type: 'CRITICAL_PENDENCY',
          severity: 'HIGH',
          title: `Pendência Crítica - ${sequenceNumber}`,
          message: `Requisito crítico pendente: ${missing.requirement.requirementName}`,
          actionUrl: `/property/${propertyId}/stage/${currentStage}`,
          metadata: {
            stageId: currentStage,
            requirementKey: missing.requirement.requirementKey,
            category: missing.requirement.category
          }
        });
      }

    } catch (error) {
      console.error('Error notifying missing critical requirements:', error);
    }
  }

  /**
   * Trigger notification for stage blocked due to pendencies
   */
  static async notifyStageBlocked(propertyId: number, userId: string, stageId: number, blockingCount: number): Promise<void> {
    try {
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) return;

      const stageNames = [
        '', 'Captação', 'Due Diligence', 'Mercado', 'Propostas', 
        'Contratos', 'Financiamento', 'Instrumento', 'Concluído'
      ];

      await this.createNotification({
        propertyId,
        userId,
        type: 'STAGE_BLOCKED',
        severity: 'HIGH',
        title: `Estágio Bloqueado - ${property[0].sequenceNumber}`,
        message: `Estágio ${stageNames[stageId]} bloqueado por ${blockingCount} pendência(s) crítica(s)`,
        actionUrl: `/property/${propertyId}/stage/${stageId}`,
        metadata: {
          stageId,
          blockingCount,
          stageName: stageNames[stageId]
        }
      });

    } catch (error) {
      console.error('Error notifying stage blocked:', error);
    }
  }

  /**
   * Trigger notification for successful stage advancement
   */
  static async notifyStageAdvanced(
    propertyId: number, 
    userId: string, 
    fromStage: number, 
    toStage: number,
    advancementType: string
  ): Promise<void> {
    try {
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) return;

      const stageNames = [
        '', 'Captação', 'Due Diligence', 'Mercado', 'Propostas', 
        'Contratos', 'Financiamento', 'Instrumento', 'Concluído'
      ];

      const severity: NotificationSeverity = advancementType === 'OVERRIDE' ? 'MEDIUM' : 'LOW';
      const message = advancementType === 'OVERRIDE' 
        ? `Propriedade avançada com override de ${stageNames[fromStage]} para ${stageNames[toStage]}`
        : `Propriedade avançada de ${stageNames[fromStage]} para ${stageNames[toStage]}`;

      await this.createNotification({
        propertyId,
        userId,
        type: 'STAGE_ADVANCED',
        severity,
        title: `Estágio Avançado - ${property[0].sequenceNumber}`,
        message,
        actionUrl: `/property/${propertyId}`,
        metadata: {
          fromStage,
          toStage,
          fromStageName: stageNames[fromStage],
          toStageName: stageNames[toStage],
          advancementType
        },
        autoResolveAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Auto-resolve in 24h
      });

    } catch (error) {
      console.error('Error notifying stage advanced:', error);
    }
  }

  /**
   * Trigger notification when validation fails
   */
  static async notifyValidationFailed(
    propertyId: number, 
    userId: string, 
    requirementId: number,
    reason: string
  ): Promise<void> {
    try {
      const [property, requirement] = await Promise.all([
        db.select().from(properties).where(eq(properties.id, propertyId)).limit(1),
        db.select().from(stageRequirements).where(eq(stageRequirements.id, requirementId)).limit(1)
      ]);

      if (!property.length || !requirement.length) return;

      await this.createNotification({
        propertyId,
        requirementId,
        userId,
        type: 'VALIDATION_FAILED',
        severity: requirement[0].isCritical ? 'HIGH' : 'MEDIUM',
        title: `Validação Falhou - ${property[0].sequenceNumber}`,
        message: `Falha na validação: ${requirement[0].requirementName}. ${reason}`,
        actionUrl: `/property/${propertyId}/stage/${requirement[0].stageId}`,
        metadata: {
          requirementKey: requirement[0].requirementKey,
          reason,
          isCritical: requirement[0].isCritical
        }
      });

    } catch (error) {
      console.error('Error notifying validation failed:', error);
    }
  }

  /**
   * Trigger notification for missing documents
   */
  static async notifyMissingDocument(
    propertyId: number, 
    userId: string, 
    documentType: string,
    isRequired: boolean = true
  ): Promise<void> {
    try {
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      if (!property.length) return;

      const severity: NotificationSeverity = isRequired ? 'HIGH' : 'MEDIUM';
      const title = isRequired ? 'Documento Obrigatório Pendente' : 'Documento Recomendado Pendente';

      await this.createNotification({
        propertyId,
        userId,
        type: 'MISSING_DOCUMENT',
        severity,
        title: `${title} - ${property[0].sequenceNumber}`,
        message: `Documento pendente: ${documentType}`,
        actionUrl: `/property/${propertyId}/documents`,
        metadata: {
          documentType,
          isRequired
        }
      });

    } catch (error) {
      console.error('Error notifying missing document:', error);
    }
  }

  /**
   * Auto-resolve expired notifications
   */
  static async resolveExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      await db.update(pendencyNotifications)
        .set({
          isResolved: true,
          resolvedAt: now,
          updatedAt: now
        })
        .where(
          and(
            eq(pendencyNotifications.isResolved, false),
            lt(pendencyNotifications.autoResolveAt, now)
          )
        );

    } catch (error) {
      console.error('Error resolving expired notifications:', error);
    }
  }

  /**
   * Mark notification as resolved
   */
  static async resolveNotification(notificationId: number, userId: string): Promise<void> {
    try {
      await db.update(pendencyNotifications)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(pendencyNotifications.id, notificationId),
            eq(pendencyNotifications.userId, userId)
          )
        );

    } catch (error) {
      console.error('Error resolving notification:', error);
    }
  }

  /**
   * Get active pendency notifications for a user
   */
  static async getUserPendencyNotifications(
    userId: string, 
    limit: number = 50
  ): Promise<any[]> {
    try {
      const userNotifications = await db.select({
        notification: pendencyNotifications,
        property: properties
      })
      .from(pendencyNotifications)
      .leftJoin(properties, eq(properties.id, pendencyNotifications.propertyId))
      .where(
        and(
          eq(pendencyNotifications.userId, userId),
          eq(pendencyNotifications.isResolved, false)
        )
      )
      .orderBy(sql`${pendencyNotifications.severity} DESC, ${pendencyNotifications.createdAt} DESC`)
      .limit(limit);

      return userNotifications.map(n => ({
        ...n.notification,
        property: {
          sequenceNumber: n.property?.sequenceNumber,
          address: n.property ? `${n.property.street}, ${n.property.number} - ${n.property.neighborhood}` : null
        }
      }));

    } catch (error) {
      console.error('Error getting user pendency notifications:', error);
      return [];
    }
  }

  /**
   * Get pendency notifications for a specific property
   */
  static async getPropertyPendencyNotifications(
    propertyId: number, 
    userId: string
  ): Promise<any[]> {
    try {
      const propertyNotifications = await db.select({
        notification: pendencyNotifications,
        requirement: stageRequirements
      })
      .from(pendencyNotifications)
      .leftJoin(stageRequirements, eq(stageRequirements.id, pendencyNotifications.requirementId))
      .where(
        and(
          eq(pendencyNotifications.propertyId, propertyId),
          eq(pendencyNotifications.userId, userId),
          eq(pendencyNotifications.isResolved, false)
        )
      )
      .orderBy(sql`${pendencyNotifications.severity} DESC, ${pendencyNotifications.createdAt} DESC`);

      return propertyNotifications.map(n => ({
        ...n.notification,
        requirement: n.requirement ? {
          requirementName: n.requirement.requirementName,
          category: n.requirement.category,
          isCritical: n.requirement.isCritical
        } : null
      }));

    } catch (error) {
      console.error('Error getting property pendency notifications:', error);
      return [];
    }
  }

  /**
   * Trigger comprehensive pendency review for a property
   */
  static async triggerPendencyReview(propertyId: number, userId: string): Promise<void> {
    try {
      // Get current stage metrics
      const metrics = await db.select()
        .from(stageCompletionMetrics)
        .where(eq(stageCompletionMetrics.propertyId, propertyId));

      // Check for stage blocks
      for (const metric of metrics) {
        if (!metric.canAdvance && metric.blockingRequirements > 0) {
          await this.notifyStageBlocked(propertyId, userId, metric.stageId, metric.blockingRequirements);
        }
      }

      // Check for missing critical requirements
      await this.notifyMissingCriticalRequirements(propertyId, userId);

    } catch (error) {
      console.error('Error triggering pendency review:', error);
    }
  }
}

// ======================================
// REAL-TIME TRACKING SYSTEM
// ======================================

export class RealTimePendencyTracker {
  /**
   * Track requirement status change
   */
  static async trackRequirementUpdate(
    propertyId: number,
    requirementId: number,
    oldStatus: string,
    newStatus: string,
    userId: string
  ): Promise<void> {
    try {
      // If requirement was completed, resolve related notifications
      if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
        await db.update(pendencyNotifications)
          .set({
            isResolved: true,
            resolvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(pendencyNotifications.propertyId, propertyId),
              eq(pendencyNotifications.requirementId, requirementId),
              eq(pendencyNotifications.isResolved, false)
            )
          );
      }

      // If requirement failed validation, create notification
      if (newStatus === 'FAILED') {
        await PendencyNotificationService.notifyValidationFailed(
          propertyId, 
          userId, 
          requirementId, 
          'Requisito marcado como falhado'
        );
      }

      // Trigger comprehensive review
      await PendencyNotificationService.triggerPendencyReview(propertyId, userId);

    } catch (error) {
      console.error('Error tracking requirement update:', error);
    }
  }

  /**
   * Track property stage advancement
   */
  static async trackStageAdvancement(
    propertyId: number,
    fromStage: number,
    toStage: number,
    advancementType: string,
    userId: string
  ): Promise<void> {
    try {
      // Create advancement notification
      await PendencyNotificationService.notifyStageAdvanced(
        propertyId, 
        userId, 
        fromStage, 
        toStage, 
        advancementType
      );

      // Resolve stage-specific notifications for previous stage
      await db.update(pendencyNotifications)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(pendencyNotifications.propertyId, propertyId),
            eq(pendencyNotifications.isResolved, false),
            sql`${pendencyNotifications.metadata}->>'stageId' = ${fromStage.toString()}`
          )
        );

    } catch (error) {
      console.error('Error tracking stage advancement:', error);
    }
  }

  /**
   * Track document upload
   */
  static async trackDocumentUpload(
    propertyId: number,
    documentType: string,
    userId: string
  ): Promise<void> {
    try {
      // Resolve missing document notifications
      await db.update(pendencyNotifications)
        .set({
          isResolved: true,
          resolvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(pendencyNotifications.propertyId, propertyId),
            eq(pendencyNotifications.notificationType, 'MISSING_DOCUMENT'),
            eq(pendencyNotifications.isResolved, false),
            sql`${pendencyNotifications.metadata}->>'documentType' = ${documentType}`
          )
        );

    } catch (error) {
      console.error('Error tracking document upload:', error);
    }
  }
}

// ======================================
// CLEANUP AND MAINTENANCE
// ======================================

/**
 * Daily cleanup job for pendency notifications
 */
export async function runDailyPendencyCleanup(): Promise<void> {
  try {
    console.log('Running daily pendency cleanup...');

    // Resolve expired notifications
    await PendencyNotificationService.resolveExpiredNotifications();

    // Clean up old resolved notifications (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    await db.delete(pendencyNotifications)
      .where(
        and(
          eq(pendencyNotifications.isResolved, true),
          lt(pendencyNotifications.resolvedAt, thirtyDaysAgo)
        )
      );

    console.log('Daily pendency cleanup completed');

  } catch (error) {
    console.error('Error in daily pendency cleanup:', error);
  }
}

/**
 * Initialize notification tracking for existing properties
 */
export async function initializePendencyNotifications(): Promise<void> {
  try {
    console.log('Initializing pendency notifications for existing properties...');

    // Get all properties with their owners
    const allProperties = await db.select().from(properties);

    for (const property of allProperties) {
      // Trigger initial pendency review
      await PendencyNotificationService.triggerPendencyReview(property.id, property.userId);
    }

    console.log(`Initialized pendency notifications for ${allProperties.length} properties`);

  } catch (error) {
    console.error('Error initializing pendency notifications:', error);
  }
}
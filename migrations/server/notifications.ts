import type { Express } from "express";
import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";
import { notifications, users } from "@shared/schema";

export function setupNotifications(app: Express) {
  
  // Get user notifications
  app.get("/api/notifications", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.session.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      // Buscar notificações
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      // Contar total não lidas
      const [{ unreadCount }] = await db
        .select({ unreadCount: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      res.json({
        notifications: userNotifications,
        unreadCount: unreadCount || 0,
        pagination: {
          page,
          limit,
          hasMore: userNotifications.length === limit
        }
      });

    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session.user.id;

      const [notification] = await db
        .update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();

      if (!notification) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }

      res.json(notification);

    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.session.user.id;

      await db
        .update(notifications)
        .set({ 
          isRead: true, 
          readAt: new Date() 
        })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));

      res.json({ message: "Todas as notificações foram marcadas como lidas" });

    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Create notification (internal function)
  app.post("/api/notifications", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const { type, title, message, category, relatedId, actionUrl } = req.body;
      const userId = req.session.user.id;

      const [notification] = await db
        .insert(notifications)
        .values({
          userId,
          type,
          title,
          message,
          category,
          relatedId,
          actionUrl
        })
        .returning();

      res.json(notification);

    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}

// Helper function to create notifications
export async function createNotification(data: {
  userId: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  category: 'property' | 'contract' | 'document' | 'system';
  relatedId?: number;
  actionUrl?: string;
}) {
  try {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}
/**
 * NOTIFICATION API ROUTES
 * 
 * RESTful API endpoints for notification management
 * Supports CRUD operations, real-time updates, and user preferences
 */

import { Router } from 'express';
import { z } from 'zod';
import { db, isDBHealthy, reconnectDB } from './db';
import { 
  notifications, 
  notificationTemplates,
  notificationRules,
  notificationSubscriptions,
  notificationAnalytics,
  userSettings
} from '../shared/schema';
import { eq, and, desc, count, sql, gte, lte, inArray, or, isNull, asc } from 'drizzle-orm';
import { getNotificationService } from './notification-service';
import { isAuthenticated } from './auth';

const router = Router();

// ======================================
// MIDDLEWARE
// ======================================

// Database health check middleware
const dbHealthCheck = async (req: any, res: any, next: any) => {
  try {
    const isHealthy = await isDBHealthy();
    if (!isHealthy) {
      console.warn('⚠️ Database unhealthy, attempting reconnection...');
      const reconnected = await reconnectDB();
      if (!reconnected) {
        return res.status(503).json({ 
          error: 'Database temporarily unavailable',
          code: 'DB_UNAVAILABLE',
          retry: true
        });
      }
    }
    next();
  } catch (error: any) {
    console.error('❌ Database health check failed:', error.message);
    return res.status(503).json({ 
      error: 'Database connection error',
      code: 'DB_CONNECTION_ERROR',
      retry: true
    });
  }
};

// ======================================
// VALIDATION SCHEMAS
// ======================================

const createNotificationSchema = z.object({
  type: z.enum(['info', 'warning', 'error', 'success', 'urgent']),
  category: z.enum(['property', 'client', 'document', 'system', 'reminder', 'pendency']),
  subcategory: z.string().optional(),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  shortMessage: z.string().max(100).optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.number().optional(),
  actionUrl: z.string().max(500).optional(),
  actionLabel: z.string().max(50).optional(),
  priority: z.number().min(1).max(5).default(3),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  iconType: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
  deliveryChannels: z.array(z.enum(['in_app', 'email', 'push', 'sms'])).default(['in_app'])
});

const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  status: z.enum(['unread', 'read', 'dismissed', 'archived']).optional()
});

const notificationFiltersSchema = z.object({
  category: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  isRead: z.boolean().optional(),
  priority: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'priority', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const subscriptionSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.number().optional(),
  enableInApp: z.boolean().default(true),
  enableEmail: z.boolean().default(false),
  enablePush: z.boolean().default(false),
  enableSms: z.boolean().default(false),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).default('immediate'),
  minPriority: z.number().min(1).max(5).default(1)
});

// ======================================
// MIDDLEWARE
// ======================================

// Ensure user is authenticated for all notification routes
router.use(isAuthenticated);

// Initialize notification service if not already done
router.use(async (req, res, next) => {
  try {
    const service = getNotificationService();
    if (!service.initialized) {
      await service.initialize();
    }
    next();
  } catch (error) {
    console.error('Failed to initialize notification service:', error);
    res.status(500).json({ error: 'Notification service unavailable' });
  }
});

// ======================================
// NOTIFICATION CRUD ENDPOINTS
// ======================================

/**
 * GET /api/notifications
 * Get user's notifications with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filters = notificationFiltersSchema.parse(req.query);
    const userIdString = String(userId);
    
    let query = db.select().from(notifications)
      .where(eq(notifications.userId, userIdString));

    // Apply filters
    const conditions = [eq(notifications.userId, userIdString)];

    if (filters.category) {
      conditions.push(eq(notifications.category, filters.category));
    }

    if (filters.type) {
      conditions.push(eq(notifications.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(notifications.status, filters.status));
    }

    if (filters.isRead !== undefined) {
      conditions.push(eq(notifications.isRead, filters.isRead));
    }

    if (filters.priority) {
      conditions.push(eq(notifications.priority, filters.priority));
    }

    if (filters.startDate) {
      conditions.push(gte(notifications.createdAt, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(notifications.createdAt, new Date(filters.endDate)));
    }

    // Apply all conditions
    query = query.where(and(...conditions));

    // Apply sorting
    const sortColumn = notifications[filters.sortBy as keyof typeof notifications] as any;
    query = filters.sortOrder === 'desc' 
      ? query.orderBy(desc(sortColumn))
      : query.orderBy(asc(sortColumn));

    // Apply pagination
    query = query.limit(filters.limit).offset(filters.offset);

    const results = await query;

    // Get total count for pagination
    const [{ totalCount }] = await db.select({ totalCount: count() })
      .from(notifications)
      .where(and(...conditions));

    res.json({
      notifications: results,
      pagination: {
        total: totalCount,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: totalCount > filters.offset + filters.limit
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

/**
 * GET /api/notifications/debug
 * Debug route to check notification data
 */
router.get('/debug', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userIdString = String(userId);
    
    const notificationsData = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userIdString))
      .limit(5);

    res.json({
      userId,
      userIdType: typeof userId,
      userIdString,
      notifications: notificationsData.map(n => ({
        id: n.id,
        userId: n.userId,
        userIdType: typeof n.userId,
        title: n.title,
        isRead: n.isRead
      }))
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

/**
 * GET /api/notifications/summary
 * Get notification summary and counts
 */
router.get('/summary', dbHealthCheck, async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    console.log('📊 Summary request:', { 
      hasReqUser: !!req.user,
      userId, 
      userIdType: typeof userId,
      sessionUser: (req.session as any)?.user?.id,
      sessionUserType: typeof (req.session as any)?.user?.id
    });
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Convert userId to string to match database schema
    const userIdString = String(userId);
    
    // Get counts by status
    const summary = await db.select({
      status: notifications.status,
      priority: notifications.priority,
      category: notifications.category,
      count: count()
    })
    .from(notifications)
    .where(eq(notifications.userId, userIdString))
    .groupBy(notifications.status, notifications.priority, notifications.category);

    // Calculate totals
    const unreadCount = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userIdString),
        eq(notifications.isRead, false),
        or(isNull(notifications.expiresAt), gte(notifications.expiresAt, new Date()))
      ));

    const urgentCount = await db.select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userIdString),
        eq(notifications.priority, 1),
        eq(notifications.isRead, false)
      ));

    res.json({
      summary,
      totals: {
        unread: unreadCount[0].count,
        urgent: urgentCount[0].count
      }
    });

  } catch (error) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({ error: 'Failed to fetch notification summary' });
  }
});

/**
 * GET /api/notifications/:id
 * Get specific notification
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const notificationId = parseInt(req.params.id);

    if (!userId || isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const userIdString = String(userId);

    const notification = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userIdString)
      ))
      .limit(1);

    if (!notification.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification[0]);

  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

/**
 * POST /api/notifications
 * Create new notification (admin/system use)
 */
router.post('/', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = createNotificationSchema.parse(req.body);
    
    const notificationId = await getNotificationService().createNotification({
      userId,
      type: payload.type || 'info',
      title: payload.title || '',
      message: payload.message || '',
      category: payload.category || 'system',
      priority: payload.priority || 'normal',
      ...payload,
      scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : undefined,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined
    });

    res.status(201).json({ 
      id: notificationId,
      message: 'Notification created successfully' 
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to create notification' });
  }
});

/**
 * PATCH /api/notifications/:id
 * Update notification status
 */
router.patch('/:id', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const notificationId = parseInt(req.params.id);

    if (!userId || isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const userIdString = String(userId);
    
    console.log('🔍 PATCH notification request:', { 
      notificationId, 
      userId,
      userIdString,
      userIdType: typeof userId,
      body: req.body 
    });

    const updates = updateNotificationSchema.parse(req.body);

    // Check if notification belongs to user
    const notification = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userIdString)
      ))
      .limit(1);

    if (!notification.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Prepare update data
    const updateData: any = { updatedAt: new Date() };

    if (updates.isRead !== undefined) {
      updateData.isRead = updates.isRead;
      updateData.readAt = updates.isRead ? new Date() : null;
      updateData.lastInteractionAt = new Date();
    }

    if (updates.isPinned !== undefined) {
      updateData.isPinned = updates.isPinned;
    }

    if (updates.isArchived !== undefined) {
      updateData.isArchived = updates.isArchived;
    }

    if (updates.status) {
      updateData.status = updates.status;
      updateData.lastInteractionAt = new Date();

      if (updates.status === 'dismissed') {
        updateData.dismissedAt = new Date();
      }
    }

    await db.update(notifications)
      .set(updateData)
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification updated successfully' });

  } catch (error) {
    console.error('❌ Error updating notification:', error);
    
    if (error instanceof z.ZodError) {
      console.error('🚫 Validation error details:', error.errors);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors,
        receivedBody: req.body 
      });
    }

    res.status(500).json({ error: 'Failed to update notification' });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userIdString = String(userId);
    const now = new Date();

    const result = await db.update(notifications)
      .set({
        isRead: true,
        readAt: now,
        lastInteractionAt: now,
        updatedAt: now
      })
      .where(and(
        eq(notifications.userId, userIdString),
        eq(notifications.isRead, false)
      ));

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification (soft delete by archiving)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    const notificationId = parseInt(req.params.id);

    if (!userId || isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const userIdString = String(userId);

    // Check if notification belongs to user
    const notification = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userIdString)
      ))
      .limit(1);

    if (!notification.length) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Soft delete by archiving
    await db.update(notifications)
      .set({
        isArchived: true,
        status: 'archived',
        updatedAt: new Date()
      })
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification deleted successfully' });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ======================================
// SUBSCRIPTION MANAGEMENT
// ======================================

/**
 * GET /api/notifications/subscriptions
 * Get user's notification subscriptions
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptions = await db.select()
      .from(notificationSubscriptions)
      .where(eq(notificationSubscriptions.userId, userId))
      .orderBy(asc(notificationSubscriptions.category));

    res.json(subscriptions);

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * POST /api/notifications/subscriptions
 * Create or update notification subscription
 */
router.post('/subscriptions', async (req, res) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = subscriptionSchema.parse(req.body);

    // Check if subscription already exists
    const existing = await db.select()
      .from(notificationSubscriptions)
      .where(and(
        eq(notificationSubscriptions.userId, userId),
        eq(notificationSubscriptions.category, subscription.category),
        subscription.subcategory 
          ? eq(notificationSubscriptions.subcategory, subscription.subcategory)
          : isNull(notificationSubscriptions.subcategory)
      ))
      .limit(1);

    if (existing.length) {
      // Update existing subscription
      await db.update(notificationSubscriptions)
        .set({
          ...subscription,
          updatedAt: new Date()
        })
        .where(eq(notificationSubscriptions.id, existing[0].id));
    } else {
      // Create new subscription
      await db.insert(notificationSubscriptions).values({
        userId,
        ...subscription
      });
    }

    res.json({ message: 'Subscription updated successfully' });

  } catch (error) {
    console.error('Error updating subscription:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }

    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ======================================
// ANALYTICS ENDPOINTS
// ======================================

/**
 * GET /api/notifications/analytics
 * Get notification analytics (admin only)
 */
router.get('/analytics', async (req, res) => {
  try {
    // TODO: Add admin role check
    
    const { startDate, endDate, category } = req.query;

    let query = db.select().from(notificationAnalytics);

    const conditions = [];

    if (startDate) {
      conditions.push(gte(notificationAnalytics.date, startDate as string));
    }

    if (endDate) {
      conditions.push(lte(notificationAnalytics.date, endDate as string));
    }

    if (category) {
      conditions.push(eq(notificationAnalytics.category, category as string));
    }

    if (conditions.length) {
      query = query.where(and(...conditions));
    }

    const analytics = await query.orderBy(desc(notificationAnalytics.date));

    res.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ======================================
// WEBHOOK ENDPOINTS FOR SYSTEM EVENTS
// ======================================

/**
 * POST /api/notifications/webhooks/property-stage-advanced
 * Handle property stage advancement
 */
router.post('/webhooks/property-stage-advanced', async (req, res) => {
  try {
    const { propertyId, fromStage, toStage, userId } = req.body;

    if (!propertyId || !toStage || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await getNotificationService().onPropertyStageAdvanced(
      parseInt(propertyId),
      parseInt(fromStage),
      parseInt(toStage),
      userId
    );

    res.json({ message: 'Event processed successfully' });

  } catch (error) {
    console.error('Error processing property stage advancement:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

/**
 * POST /api/notifications/webhooks/pendency-created
 * Handle new pendency creation
 */
router.post('/webhooks/pendency-created', async (req, res) => {
  try {
    const { propertyId, requirementId, userId, severity } = req.body;

    if (!propertyId || !requirementId || !userId || !severity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await getNotificationService().onPendencyCreated(
      parseInt(propertyId),
      parseInt(requirementId),
      userId,
      severity
    );

    res.json({ message: 'Event processed successfully' });

  } catch (error) {
    console.error('Error processing pendency creation:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

/**
 * POST /api/notifications/webhooks/client-note-reminder
 * Handle client note with reminder
 */
router.post('/webhooks/client-note-reminder', async (req, res) => {
  try {
    const { noteId, clientId, userId, reminderDate } = req.body;

    if (!noteId || !clientId || !userId || !reminderDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await getNotificationService().onClientNoteWithReminder(
      parseInt(noteId),
      parseInt(clientId),
      userId,
      new Date(reminderDate)
    );

    res.json({ message: 'Event processed successfully' });

  } catch (error) {
    console.error('Error processing client note reminder:', error);
    res.status(500).json({ error: 'Failed to process event' });
  }
});

export default router;
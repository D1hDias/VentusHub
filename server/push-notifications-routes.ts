/**
 * PUSH NOTIFICATIONS ROUTES
 * 
 * API endpoints for managing push notification subscriptions
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { 
  pushSubscriptions,
  userSettings
} from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAuthenticated } from './auth';

const router = Router();

// Apply authentication to all routes
router.use(isAuthenticated);

// ======================================
// VALIDATION SCHEMAS
// ======================================

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.number().nullable().optional(),
});

const testNotificationSchema = z.object({
  type: z.enum(['push', 'email', 'sms']),
  message: z.string().optional(),
});

// ======================================
// ROUTES
// ======================================

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = pushSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid subscription data',
        details: validation.error.issues 
      });
    }

    const subscription = validation.data;

    // Check if subscription already exists for this user and endpoint
    const [existingSubscription] = await db.select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, subscription.endpoint)
        )
      )
      .limit(1);

    const subscriptionData = {
      userId,
      endpoint: subscription.endpoint,
      p256dhKey: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
      expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
      isActive: true,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || 'Unknown',
      updatedAt: new Date()
    };

    if (existingSubscription) {
      // Update existing subscription
      await db.update(pushSubscriptions)
        .set(subscriptionData)
        .where(eq(pushSubscriptions.id, existingSubscription.id));
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        ...subscriptionData,
        createdAt: new Date()
      });
    }

    // Update user settings to enable push notifications
    await db.update(userSettings)
      .set({ 
        pushNotifications: true,
        updatedAt: new Date()
      })
      .where(eq(userSettings.userId, userId));

    res.json({ 
      success: true, 
      message: 'Push subscription created successfully' 
    });

  } catch (error) {
    console.error('Error creating push subscription:', error);
    res.status(500).json({ error: 'Failed to create push subscription' });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { endpoint } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // Find and deactivate the subscription
    await db.update(pushSubscriptions)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    res.json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    });

  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to remove push subscription' });
  }
});

/**
 * GET /api/push/subscriptions
 * Get user's push subscriptions
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const subscriptions = await db.select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      userAgent: pushSubscriptions.userAgent,
      isActive: pushSubscriptions.isActive,
      createdAt: pushSubscriptions.createdAt,
      lastUsed: pushSubscriptions.lastUsed
    })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    res.json({ subscriptions });

  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch push subscriptions' });
  }
});

/**
 * POST /api/push/test
 * Send a test push notification
 */
router.post('/test', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = testNotificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid test data',
        details: validation.error.issues 
      });
    }

    const { type, message } = validation.data;

    if (type === 'push') {
      // Get user's active push subscriptions
      const subscriptions = await db.select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.isActive, true)
          )
        );

      if (subscriptions.length === 0) {
        return res.status(400).json({ 
          error: 'No active push subscriptions found',
          message: 'Please enable push notifications first'
        });
      }

      // Here you would integrate with a push notification service like:
      // - Web Push Protocol
      // - Firebase Cloud Messaging (FCM)
      // - Azure Notification Hubs
      // 
      // For now, we'll simulate the notification
      console.log(`Sending test push notification to ${subscriptions.length} devices for user ${userId}`);
      console.log('Notification content:', {
        title: 'Teste de Notificação',
        body: message || 'Esta é uma notificação de teste do VentusHub',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          url: '/dashboard',
          timestamp: new Date().toISOString()
        }
      });

      // Update last used timestamp for subscriptions
      await db.update(pushSubscriptions)
        .set({ lastUsed: new Date() })
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.isActive, true)
          )
        );

      res.json({ 
        success: true, 
        message: `Test push notification sent to ${subscriptions.length} device(s)`,
        devicesNotified: subscriptions.length
      });

    } else if (type === 'email') {
      // Simulate email test notification
      console.log(`Sending test email notification to user ${userId}`);
      res.json({ 
        success: true, 
        message: 'Test email notification sent successfully' 
      });

    } else if (type === 'sms') {
      // Simulate SMS test notification
      console.log(`Sending test SMS notification to user ${userId}`);
      res.json({ 
        success: true, 
        message: 'Test SMS notification sent successfully' 
      });
    }

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

/**
 * GET /api/push/vapid-key
 * Get VAPID public key for push subscriptions
 */
router.get('/vapid-key', async (req, res) => {
  try {
    // In a real implementation, you would store this securely
    // For now, we'll use a placeholder
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'default-vapid-public-key';

    res.json({ 
      publicKey: vapidPublicKey,
      message: 'Use this key to subscribe to push notifications'
    });

  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    res.status(500).json({ error: 'Failed to fetch VAPID key' });
  }
});

export default router;
/**
 * USER NOTIFICATION PREFERENCES ROUTES
 * 
 * API endpoints for managing user notification preferences
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { 
  notificationSubscriptions,
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

const updatePreferencesSchema = z.object({
  // Global notification settings
  enableInAppNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  enablePushNotifications: z.boolean().optional(),
  enableSmsNotifications: z.boolean().optional(),
  
  // Frequency preferences
  emailFrequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
  pushFrequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
  smsFrequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
  
  // Priority thresholds
  minInAppPriority: z.number().min(1).max(5).optional(),
  minEmailPriority: z.number().min(1).max(5).optional(),
  minPushPriority: z.number().min(1).max(5).optional(),
  minSmsPriority: z.number().min(1).max(5).optional(),
  
  // Quiet hours
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  quietHoursEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  
  // Weekend settings
  enableWeekendsNotifications: z.boolean().optional(),
});

const categorySubscriptionSchema = z.object({
  category: z.string(),
  subcategory: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.number().optional(),
  enableInApp: z.boolean(),
  enableEmail: z.boolean(),
  enablePush: z.boolean(),
  enableSms: z.boolean(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'never']),
  minPriority: z.number().min(1).max(5),
  isActive: z.boolean().default(true)
});

// ======================================
// ROUTES
// ======================================

/**
 * GET /api/user-preferences/notifications
 * Get user's notification preferences
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user settings
    const [userPrefs] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    // Get category subscriptions
    const subscriptions = await db.select()
      .from(notificationSubscriptions)
      .where(eq(notificationSubscriptions.userId, userId));

    // Default preferences if none exist
    const defaultPrefs = {
      enableInAppNotifications: true,
      enableEmailNotifications: true,
      enablePushNotifications: true,
      enableSmsNotifications: false,
      emailFrequency: 'immediate' as const,
      pushFrequency: 'immediate' as const,
      smsFrequency: 'never' as const,
      minInAppPriority: 1,
      minEmailPriority: 2,
      minPushPriority: 2,
      minSmsPriority: 1,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      enableWeekendsNotifications: true
    };

    const preferences = userPrefs ? {
      enableInAppNotifications: userPrefs.pushNotifications ?? defaultPrefs.enableInAppNotifications,
      enableEmailNotifications: userPrefs.emailNotifications ?? defaultPrefs.enableEmailNotifications,
      enablePushNotifications: userPrefs.pushNotifications ?? defaultPrefs.enablePushNotifications,
      enableSmsNotifications: userPrefs.smsNotifications ?? defaultPrefs.enableSmsNotifications,
      emailFrequency: userPrefs.emailFrequency ?? defaultPrefs.emailFrequency,
      pushFrequency: userPrefs.pushFrequency ?? defaultPrefs.pushFrequency,
      smsFrequency: userPrefs.smsFrequency ?? defaultPrefs.smsFrequency,
      minInAppPriority: userPrefs.minInAppPriority ?? defaultPrefs.minInAppPriority,
      minEmailPriority: userPrefs.minEmailPriority ?? defaultPrefs.minEmailPriority,
      minPushPriority: userPrefs.minPushPriority ?? defaultPrefs.minPushPriority,
      minSmsPriority: userPrefs.minSmsPriority ?? defaultPrefs.minSmsPriority,
      quietHoursEnabled: userPrefs.quietHoursEnabled ?? defaultPrefs.quietHoursEnabled,
      quietHoursStart: userPrefs.quietHoursStart ?? defaultPrefs.quietHoursStart,
      quietHoursEnd: userPrefs.quietHoursEnd ?? defaultPrefs.quietHoursEnd,
      enableWeekendsNotifications: userPrefs.enableWeekendsNotifications ?? defaultPrefs.enableWeekendsNotifications
    } : defaultPrefs;

    res.json({
      preferences,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        category: sub.category,
        subcategory: sub.subcategory,
        entityType: sub.entityType,
        entityId: sub.entityId,
        enableInApp: sub.enableInApp,
        enableEmail: sub.enableEmail,
        enablePush: sub.enablePush,
        enableSms: sub.enableSms,
        frequency: sub.frequency,
        minPriority: sub.minPriority,
        isActive: sub.isActive
      }))
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/user-preferences/notifications
 * Update user's notification preferences
 */
router.put('/notifications', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = updatePreferencesSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid preferences data',
        details: validation.error.issues 
      });
    }

    const preferences = validation.data;

    // Check if user settings exist
    const [existingSettings] = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const settingsData = {
      userId,
      emailNotifications: preferences.enableEmailNotifications,
      pushNotifications: preferences.enablePushNotifications,
      smsNotifications: preferences.enableSmsNotifications,
      emailFrequency: preferences.emailFrequency,
      pushFrequency: preferences.pushFrequency,
      smsFrequency: preferences.smsFrequency,
      minInAppPriority: preferences.minInAppPriority,
      minEmailPriority: preferences.minEmailPriority,
      minPushPriority: preferences.minPushPriority,
      minSmsPriority: preferences.minSmsPriority,
      quietHoursEnabled: preferences.quietHoursEnabled,
      quietHoursStart: preferences.quietHoursStart,
      quietHoursEnd: preferences.quietHoursEnd,
      enableWeekendsNotifications: preferences.enableWeekendsNotifications,
      updatedAt: new Date()
    };

    if (existingSettings) {
      // Update existing settings
      await db.update(userSettings)
        .set(settingsData)
        .where(eq(userSettings.userId, userId));
    } else {
      // Create new settings
      await db.insert(userSettings).values({
        ...settingsData,
        createdAt: new Date()
      });
    }

    res.json({ 
      success: true, 
      message: 'Notification preferences updated successfully' 
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * POST /api/user-preferences/subscriptions
 * Create or update category subscription
 */
router.post('/subscriptions', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = categorySubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid subscription data',
        details: validation.error.issues 
      });
    }

    const subscription = validation.data;

    // Check if subscription already exists
    const existingQuery = db.select()
      .from(notificationSubscriptions)
      .where(
        and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.category, subscription.category)
        )
      );

    if (subscription.subcategory) {
      existingQuery.where(eq(notificationSubscriptions.subcategory, subscription.subcategory));
    }

    const [existing] = await existingQuery.limit(1);

    const subscriptionData = {
      userId,
      category: subscription.category,
      subcategory: subscription.subcategory,
      entityType: subscription.entityType,
      entityId: subscription.entityId,
      enableInApp: subscription.enableInApp,
      enableEmail: subscription.enableEmail,
      enablePush: subscription.enablePush,
      enableSms: subscription.enableSms,
      frequency: subscription.frequency,
      minPriority: subscription.minPriority,
      isActive: subscription.isActive,
      updatedAt: new Date()
    };

    let result;

    if (existing) {
      // Update existing subscription
      result = await db.update(notificationSubscriptions)
        .set(subscriptionData)
        .where(eq(notificationSubscriptions.id, existing.id))
        .returning();
    } else {
      // Create new subscription
      result = await db.insert(notificationSubscriptions)
        .values({
          ...subscriptionData,
          createdAt: new Date()
        })
        .returning();
    }

    res.json({ 
      success: true, 
      subscription: result[0],
      message: existing ? 'Subscription updated successfully' : 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Error managing subscription:', error);
    res.status(500).json({ error: 'Failed to manage subscription' });
  }
});

/**
 * DELETE /api/user-preferences/subscriptions/:id
 * Delete category subscription
 */
router.delete('/subscriptions/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const subscriptionId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(subscriptionId)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    // Verify ownership
    const [subscription] = await db.select()
      .from(notificationSubscriptions)
      .where(
        and(
          eq(notificationSubscriptions.id, subscriptionId),
          eq(notificationSubscriptions.userId, userId)
        )
      )
      .limit(1);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await db.delete(notificationSubscriptions)
      .where(eq(notificationSubscriptions.id, subscriptionId));

    res.json({ 
      success: true, 
      message: 'Subscription deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

/**
 * GET /api/user-preferences/categories
 * Get available notification categories for subscription management
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      {
        category: 'property',
        name: 'Propriedades',
        description: 'Notificações sobre avanços de etapas, pendências e atualizações de propriedades',
        subcategories: [
          { key: 'stage_advance', name: 'Avanço de Etapas', description: 'Quando uma propriedade avança para próxima etapa' },
          { key: 'pendency', name: 'Pendências', description: 'Novas pendências criadas ou resolvidas' },
          { key: 'document', name: 'Documentos', description: 'Upload, aprovação ou rejeição de documentos' }
        ]
      },
      {
        category: 'client',
        name: 'Clientes',
        description: 'Notificações sobre novos clientes, reuniões e ligações',
        subcategories: [
          { key: 'new_client', name: 'Novos Clientes', description: 'Quando um novo cliente é cadastrado' },
          { key: 'meeting', name: 'Reuniões', description: 'Reuniões agendadas com clientes' },
          { key: 'call', name: 'Ligações', description: 'Ligações registradas no sistema' }
        ]
      },
      {
        category: 'contract',
        name: 'Contratos',
        description: 'Notificações sobre geração e assinatura de contratos',
        subcategories: [
          { key: 'generated', name: 'Contratos Gerados', description: 'Quando um contrato é gerado' },
          { key: 'signed', name: 'Contratos Assinados', description: 'Quando um contrato é assinado' }
        ]
      },
      {
        category: 'reminder',
        name: 'Lembretes',
        description: 'Notificações de lembretes e tarefas agendadas',
        subcategories: [
          { key: 'client_note', name: 'Notas de Clientes', description: 'Lembretes de notas de clientes' },
          { key: 'task', name: 'Tarefas', description: 'Tarefas e pendências agendadas' }
        ]
      },
      {
        category: 'system',
        name: 'Sistema',
        description: 'Notificações sobre manutenção, backups e atualizações do sistema',
        subcategories: [
          { key: 'maintenance', name: 'Manutenção', description: 'Manutenções programadas do sistema' },
          { key: 'backup', name: 'Backups', description: 'Status dos backups do sistema' }
        ]
      }
    ];

    res.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
/**
 * COMPREHENSIVE NOTIFICATION SERVICE
 * 
 * Handles all notification generation, delivery, and management for VentusHub
 * Supports multiple delivery channels, templates, rules, and real-time updates
 */

import { db } from './db.js';
import { 
  notifications, 
  notificationTemplates, 
  notificationRules,
  notificationSubscriptions,
  notificationDeliveryLog,
  notificationAnalytics,
  properties,
  clients,
  clientNotes,
  scheduledNotifications
} from '../shared/schema.js';
// Legacy userSettings and users tables removed - using Better Auth
import { user } from '../shared/better-auth-schema.js';
import { eq, and, desc, count, sql, gte, lte, inArray } from 'drizzle-orm';
import { notificationProviderManager, type NotificationPayload as ProviderPayload } from './notification-providers.js';

// ======================================
// TYPES AND INTERFACES
// ======================================

export interface NotificationPayload {
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'urgent';
  category: 'property' | 'client' | 'document' | 'system' | 'reminder' | 'pendency';
  subcategory?: string;
  title: string;
  message: string;
  shortMessage?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  secondaryEntityType?: string;
  secondaryEntityId?: number;
  actionUrl?: string;
  actionLabel?: string;
  secondaryActionUrl?: string;
  secondaryActionLabel?: string;
  priority?: number;
  scheduledFor?: Date;
  expiresAt?: Date;
  imageUrl?: string;
  iconType?: string;
  metadata?: Record<string, any>;
  deliveryChannels?: string[];
}

export interface NotificationTemplate {
  templateKey: string;
  titleTemplate: string;
  messageTemplate: string;
  shortMessageTemplate?: string;
  placeholders: Record<string, any>;
}

export interface NotificationEvent {
  event: string;
  entityType: string;
  entityId: number;
  userId: string;
  data?: Record<string, any>;
  timestamp?: Date;
}

export interface DeliveryResult {
  success: boolean;
  channel: string;
  deliveredAt?: Date;
  failureReason?: string;
  externalId?: string;
}

// ======================================
// NOTIFICATION SERVICE CLASS
// ======================================

export class NotificationService {
  private static instance: NotificationService;
  private templates: Map<string, any> = new Map();
  private rules: Map<string, any> = new Map();
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public get initialized(): boolean {
    return this.isInitialized;
  }

  // ======================================
  // INITIALIZATION
  // ======================================

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔔 Initializing Notification Service...');

    try {
      // Simplified initialization - no complex templates/rules needed
      this.isInitialized = true;
      console.log('✅ Notification Service initialized successfully (simplified)');
    } catch (error: any) {
      console.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  private async loadTemplates(): Promise<void> {
    const templates = await db.select().from(notificationTemplates).where(eq(notificationTemplates.isActive, true));
    
    templates.forEach((template: any) => {
      this.templates.set(template.templateKey, template);
    });

    console.log(`📄 Loaded ${templates.length} notification templates`);
  }

  private async loadRules(): Promise<void> {
    const rules = await db.select().from(notificationRules).where(eq(notificationRules.isActive, true));
    
    rules.forEach((rule: any) => {
      this.rules.set(rule.ruleKey, rule);
    });

    console.log(`📋 Loaded ${rules.length} notification rules`);
  }

  // ======================================
  // CORE NOTIFICATION METHODS
  // ======================================

  /**
   * Create and send a notification
   */
  public async createNotification(payload: NotificationPayload): Promise<number> {
    try {
      // Validate user preferences and subscriptions
      const canSend = await this.checkUserSubscriptions(payload.userId, payload.category, payload.subcategory);
      if (!canSend) {
        console.log(`🚫 Notification blocked by user preferences: ${payload.userId}`);
        return 0;
      }

      // Create notification record
      const [notification] = await db.insert(notifications).values({
        userId: payload.userId,
        type: payload.type,
        category: payload.category,
        subcategory: payload.subcategory,
        title: payload.title,
        message: payload.message,
        shortMessage: payload.shortMessage || payload.title.substring(0, 100),
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        secondaryEntityType: payload.secondaryEntityType,
        secondaryEntityId: payload.secondaryEntityId,
        actionUrl: payload.actionUrl,
        actionLabel: payload.actionLabel,
        secondaryActionUrl: payload.secondaryActionUrl,
        secondaryActionLabel: payload.secondaryActionLabel,
        priority: payload.priority || 3,
        scheduledFor: payload.scheduledFor,
        expiresAt: payload.expiresAt,
        imageUrl: payload.imageUrl,
        iconType: payload.iconType,
        metadata: payload.metadata,
        deliveryChannels: payload.deliveryChannels?.join(',') || 'in_app',
        deliveryStatus: payload.scheduledFor ? 'pending' : 'delivered',
        deliveredAt: payload.scheduledFor ? undefined : new Date()
      }).returning({ id: notifications.id });

      const notificationId = notification.id;

      // Notification created successfully (no real-time events needed)

      // Schedule delivery if not immediate
      if (payload.scheduledFor) {
        await this.scheduleDelivery(notificationId, payload.scheduledFor);
      } else {
        // Deliver immediately
        await this.deliverNotification(notificationId);
      }

      // Update analytics
      await this.updateAnalytics(payload.category, payload.subcategory, payload.type, 'in_app');

      console.log(`📢 Notification created: ${notificationId} for user ${payload.userId}`);
      return notificationId;

    } catch (error: any) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification from template
   */
  public async createFromTemplate(
    templateKey: string, 
    userId: string, 
    placeholders: Record<string, any>,
    overrides?: Partial<NotificationPayload>
  ): Promise<number> {
    const template = this.templates.get(templateKey);
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Replace placeholders in template content
    const title = this.replacePlaceholders(template.titleTemplate, placeholders);
    const message = this.replacePlaceholders(template.messageTemplate, placeholders);
    const shortMessage = template.shortMessageTemplate 
      ? this.replacePlaceholders(template.shortMessageTemplate, placeholders)
      : undefined;

    const payload: NotificationPayload = {
      userId,
      type: template.defaultType,
      category: template.category,
      title,
      message,
      shortMessage,
      priority: template.defaultPriority,
      iconType: template.defaultIconType,
      ...overrides
    };

    return this.createNotification(payload);
  }

  /**
   * Process notification events and trigger rules
   */
  public async processEvent(event: NotificationEvent): Promise<void> {
    console.log(`🎯 Processing event: ${event.event} for ${event.entityType}:${event.entityId}`);

    // Find matching rules
    const matchingRules = Array.from(this.rules.values()).filter((rule: any) => {
      const triggerEvents = rule.triggerEvents.split(',').map((e: string) => e.trim());
      const entityTypes = rule.entityTypes ? rule.entityTypes.split(',').map((e: string) => e.trim()) : ['*'];
      
      return triggerEvents.includes(event.event) && 
             (entityTypes.includes('*') || entityTypes.includes(event.entityType));
    });

    for (const rule of matchingRules) {
      try {
        await this.executeRule(rule, event);
      } catch (error: any) {
        console.error(`❌ Error executing rule ${rule.ruleKey}:`, error);
      }
    }
  }

  // ======================================
  // EVENT HANDLERS FOR SYSTEM ACTIONS
  // ======================================

  /**
   * Handle property stage advancement
   */
  public async onPropertyStageAdvanced(propertyId: number, fromStage: number, toStage: number, userId: string): Promise<void> {
    await this.processEvent({
      event: 'property:stage_advanced',
      entityType: 'property',
      entityId: propertyId,
      userId,
      data: { fromStage, toStage }
    });
  }

  /**
   * Handle new pendency created
   */
  public async onPendencyCreated(propertyId: number, requirementId: number, userId: string, severity: string): Promise<void> {
    await this.processEvent({
      event: 'pendency:created',
      entityType: 'property',
      entityId: propertyId,
      userId,
      data: { requirementId, severity }
    });
  }

  /**
   * Handle client note created with reminder
   */
  public async onClientNoteWithReminder(noteId: number, clientId: number, userId: string, reminderDate: Date): Promise<void> {
    await this.processEvent({
      event: 'client_note:reminder_created',
      entityType: 'client_note',
      entityId: noteId,
      userId,
      data: { clientId, reminderDate }
    });
  }

  /**
   * Handle document upload
   */
  public async onDocumentUploaded(documentId: number, propertyId: number, userId: string, documentType: string): Promise<void> {
    await this.processEvent({
      event: 'document:uploaded',
      entityType: 'document',
      entityId: documentId,
      userId,
      data: { propertyId, documentType }
    });
  }

  /**
   * Handle contract signed
   */
  public async onContractSigned(contractId: number, propertyId: number, userId: string): Promise<void> {
    await this.processEvent({
      event: 'contract:signed',
      entityType: 'contract',
      entityId: contractId,
      userId,
      data: { propertyId }
    });
  }

  // ======================================
  // DELIVERY AND CHANNELS
  // ======================================

  private async deliverNotification(notificationId: number): Promise<void> {
    const notification = await db.select().from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification.length) return;

    const notif = notification[0];
    const channels = notif.deliveryChannels?.split(',') || ['in_app'];

    for (const channel of channels) {
      try {
        await this.deliverToChannel(notificationId, channel.trim(), notif.userId);
      } catch (error: any) {
        console.error(`❌ Delivery failed for channel ${channel}:`, error);
      }
    }
  }

  private async deliverToChannel(notificationId: number, channel: string, userId: string): Promise<DeliveryResult> {
    const deliveryLog = {
      notificationId,
      channel,
      recipientId: userId,
      status: 'pending' as const,
      attemptNumber: 1
    };

    try {
      let result: DeliveryResult;

      switch (channel) {
        case 'in_app':
          result = await this.deliverInApp(notificationId, userId);
          break;
        case 'email':
          result = await this.deliverEmail(notificationId, userId);
          break;
        case 'push':
          result = await this.deliverPush(notificationId, userId);
          break;
        case 'sms':
          result = await this.deliverSMS(notificationId, userId);
          break;
        default:
          throw new Error(`Unknown delivery channel: ${channel}`);
      }

      // Log delivery result
      await db.insert(notificationDeliveryLog).values({
        ...deliveryLog,
        status: result.success ? 'delivered' : 'failed',
        deliveredAt: result.deliveredAt,
        failureReason: result.failureReason,
        externalId: result.externalId
      });

      return result;

    } catch (error: any) {
      await db.insert(notificationDeliveryLog).values({
        ...deliveryLog,
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  private async deliverInApp(notificationId: number, userId: string): Promise<DeliveryResult> {
    // In-app delivery is just marking as delivered
    return {
      success: true,
      channel: 'in_app',
      deliveredAt: new Date()
    };
  }

  private async deliverEmail(notificationId: number, userId: string): Promise<DeliveryResult> {
    try {
      // Get notification details
      const [notification] = await db.select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      const emailResult = await this.sendEmailNotification(userId, notification);
      
      return {
        success: emailResult.success,
        channel: 'email',
        deliveredAt: emailResult.success ? new Date() : undefined,
        externalId: emailResult.providerId ? `${emailResult.providerId}_${notificationId}_${Date.now()}` : undefined,
        failureReason: emailResult.error
      };
    } catch (error: any) {
      console.error(`Email delivery failed for notification ${notificationId}:`, error);
      return {
        success: false,
        channel: 'email',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async deliverPush(notificationId: number, userId: string): Promise<DeliveryResult> {
    // TODO: Implement push notification delivery
    console.log(`📱 Push delivery simulated for notification ${notificationId} to user ${userId}`);
    
    return {
      success: true,
      channel: 'push',
      deliveredAt: new Date(),
      externalId: `push_${notificationId}_${Date.now()}`
    };
  }

  private async deliverSMS(notificationId: number, userId: string): Promise<DeliveryResult> {
    try {
      // Get notification details
      const [notification] = await db.select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notification) {
        throw new Error(`Notification ${notificationId} not found`);
      }

      const smsResult = await this.sendSMSNotification(userId, notification);
      
      return {
        success: smsResult.success,
        channel: 'sms',
        deliveredAt: smsResult.success ? new Date() : undefined,
        externalId: smsResult.providerId ? `${smsResult.providerId}_${notificationId}_${Date.now()}` : undefined,
        failureReason: smsResult.error
      };
    } catch (error: any) {
      console.error(`SMS delivery failed for notification ${notificationId}:`, error);
      return {
        success: false,
        channel: 'sms',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ======================================
  // UTILITY METHODS
  // ======================================

  private async checkUserSubscriptions(userId: string, category: string, subcategory?: string): Promise<boolean> {
    const subscriptions = await db.select().from(notificationSubscriptions)
      .where(
        and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.category, category),
          eq(notificationSubscriptions.isActive, true)
        )
      );

    // If no specific subscription found, default to allowing notifications
    if (!subscriptions.length) {
      // Legacy userSettings removed - default to true for all notifications
      return true;
    }

    // Check if any subscription allows this notification
    return subscriptions.some((sub: any) => {
      if (subcategory && sub.subcategory && sub.subcategory !== subcategory) {
        return false;
      }
      return sub.enableInApp; // For now, just check in-app notifications
    });
  }

  private replacePlaceholders(template: string, placeholders: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(placeholders)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    
    return result;
  }

  private async executeRule(rule: any, event: NotificationEvent): Promise<void> {
    // Check throttling
    if (rule.throttleMinutes && rule.lastTriggeredAt) {
      const timeSinceLastTrigger = Date.now() - new Date(rule.lastTriggeredAt).getTime();
      if (timeSinceLastTrigger < rule.throttleMinutes * 60 * 1000) {
        console.log(`⏳ Rule ${rule.ruleKey} throttled`);
        return;
      }
    }

    // Check daily limit
    if (rule.maxNotificationsPerDay) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = await db.select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, event.userId),
            eq(notifications.category, rule.category || event.entityType),
            gte(notifications.createdAt, today)
          )
        );

      if (todayCount[0].count >= rule.maxNotificationsPerDay) {
        console.log(`📊 Daily notification limit reached for rule ${rule.ruleKey}`);
        return;
      }
    }

    // Execute the rule
    if (rule.templateId) {
      const template = await db.select().from(notificationTemplates)
        .where(eq(notificationTemplates.id, rule.templateId))
        .limit(1);

      if (template.length) {
        const placeholders = await this.buildPlaceholders(event);
        
        await this.createFromTemplate(
          template[0].templateKey,
          event.userId,
          placeholders,
          {
            scheduledFor: rule.delayMinutes ? new Date(Date.now() + rule.delayMinutes * 60 * 1000) : undefined
          }
        );
      }
    }

    // Update rule statistics
    await db.update(notificationRules)
      .set({
        lastTriggeredAt: new Date(),
        triggerCount: sql`${notificationRules.triggerCount} + 1`
      })
      .where(eq(notificationRules.id, rule.id));
  }

  private async buildPlaceholders(event: NotificationEvent): Promise<Record<string, any>> {
    const placeholders: Record<string, any> = {
      ...event.data,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.userId,
      timestamp: event.timestamp || new Date()
    };

    // Fetch additional data based on entity type
    switch (event.entityType) {
      case 'property':
        const property = await db.select().from(properties)
          .where(eq(properties.id, event.entityId))
          .limit(1);
        if (property.length) {
          placeholders.property = property[0];
          placeholders.propertyAddress = `${property[0].street}, ${property[0].number}`;
          placeholders.propertyType = property[0].type;
        }
        break;

      case 'client':
        const client = await db.select().from(clients)
          .where(eq(clients.id, event.entityId))
          .limit(1);
        if (client.length) {
          placeholders.client = client[0];
          placeholders.clientName = client[0].fullName;
        }
        break;

      case 'client_note':
        const note = await db.select().from(clientNotes)
          .where(eq(clientNotes.id, event.entityId))
          .limit(1);
        if (note.length) {
          placeholders.note = note[0];
          placeholders.noteTitle = note[0].title;
          placeholders.noteType = note[0].type;
        }
        break;
    }

    return placeholders;
  }

  private async updateAnalytics(category: string, subcategory: string | undefined, type: string, channel: string): Promise<void> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    try {
      await db.insert(notificationAnalytics).values({
        date: dateStr,
        category,
        subcategory,
        type,
        channel,
        totalSent: 1,
        totalDelivered: 1,
        uniqueUsers: 1
      }).onConflictDoUpdate({
        target: [notificationAnalytics.date, notificationAnalytics.category, notificationAnalytics.type, notificationAnalytics.channel],
        set: {
          totalSent: sql`${notificationAnalytics.totalSent} + 1`,
          totalDelivered: sql`${notificationAnalytics.totalDelivered} + 1`,
          updatedAt: new Date()
        }
      });
    } catch (error: any) {
      console.error('Error updating analytics:', error);
    }
  }

  private async scheduleDelivery(notificationId: number, scheduledFor: Date): Promise<void> {
    // TODO: Implement proper job queue scheduling
    console.log(`⏰ Scheduled notification ${notificationId} for ${scheduledFor.toISOString()}`);
  }

  /**
   * Send email notification using configured providers
   */
  private async sendEmailNotification(
    userId: string, 
    notification: any
  ): Promise<{ success: boolean; error?: string; providerId?: string }> {
    try {
      // Get user email from Better Auth user table
      const [userRecord] = await db.select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord?.email) {
        return { success: false, error: 'User email not found' };
      }

      const emailPayload: ProviderPayload = {
        to: userRecord.email,
        subject: notification.title,
        message: notification.message,
        priority: this.mapPriorityToProvider(notification.priority),
        metadata: {
          notificationId: notification.id,
          userId: userId,
          category: notification.category,
          type: notification.type
        }
      };

      const result = await notificationProviderManager.sendEmail(emailPayload);
      
      if (result.success) {
        console.log(`📧 Email sent successfully via ${result.providerId} for notification ${notification.id}`);
      }

      return result;
    } catch (error: any) {
      console.error('Error sending email notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send SMS notification using configured providers
   */
  private async sendSMSNotification(
    userId: string, 
    notification: any
  ): Promise<{ success: boolean; error?: string; providerId?: string }> {
    try {
      // SMS notifications currently not available - Better Auth user table doesn't include phone
      // TODO: Add phone field to user profile or use separate phone storage
      return { success: false, error: 'SMS notifications not available - phone number not stored in user profile' };
    } catch (error: any) {
      console.error('Error sending SMS notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Map internal priority to provider priority format
   */
  private mapPriorityToProvider(priority: number): 'low' | 'normal' | 'high' | 'urgent' {
    if (priority >= 5) return 'urgent';
    if (priority >= 4) return 'high';
    if (priority >= 3) return 'normal';
    return 'low';
  }

  /**
   * Test notification providers
   */
  public async testProviders(testEmail?: string, testPhone?: string) {
    console.log('🧪 Testing notification providers...');
    
    const results = await notificationProviderManager.testProviders(testEmail || '', testPhone || '');
    
    console.log('📊 Provider test results:', results);
    
    return {
      success: Object.values(results).some(r => r.success),
      results,
      providers: notificationProviderManager.getAvailableProviders()
    };
  }

  private async startScheduledNotificationProcessor(): Promise<void> {
    // Process scheduled notifications every minute
    setInterval(async () => {
      try {
        const now = new Date();
        const pendingNotifications = await db.select()
          .from(notifications)
          .where(
            and(
              eq(notifications.deliveryStatus, 'pending'),
              lte(notifications.scheduledFor, now)
            )
          )
          .limit(100);

        for (const notification of pendingNotifications) {
          await this.deliverNotification(notification.id);
          
          await db.update(notifications)
            .set({ 
              deliveryStatus: 'delivered',
              deliveredAt: new Date()
            })
            .where(eq(notifications.id, notification.id));
        }

        if (pendingNotifications.length > 0) {
          console.log(`📤 Processed ${pendingNotifications.length} scheduled notifications`);
        }
      } catch (error: any) {
        console.error('Error processing scheduled notifications:', error);
      }
    }, 60000); // Every minute
  }

  private async setupDefaultTemplatesAndRules(): Promise<void> {
    const { setupDefaultNotificationSystem } = await import('./notification-templates.js');
    await setupDefaultNotificationSystem();
  }
}

// ======================================
// LAZY SINGLETON EXPORT
// ======================================

let notificationServiceInstance: NotificationService | null = null;

export const getNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = NotificationService.getInstance();
  }
  return notificationServiceInstance;
};
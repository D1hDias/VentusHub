import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  time,
  inet,
  interval,
  check,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enhanced notifications table with comprehensive metadata
export const enhancedNotifications = pgTable("enhanced_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Core notification data
  type: varchar("type", { length: 20 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("normal"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Categorization and organization
  category: varchar("category", { length: 50 }).notNull(),
  subcategory: varchar("subcategory", { length: 50 }),
  sourceSystem: varchar("source_system", { length: 50 }).notNull().default("ventushub"),
  
  // Relationship tracking
  relatedEntity: varchar("related_entity", { length: 50 }),
  relatedId: integer("related_id"),
  parentNotificationId: integer("parent_notification_id").references(() => enhancedNotifications.id),
  
  // Action and navigation
  actionUrl: varchar("action_url", { length: 500 }),
  actionData: jsonb("action_data"),
  deepLinkParams: jsonb("deep_link_params"),
  
  // Delivery and interaction
  deliveryChannels: text("delivery_channels").array().default(["in_app"]),
  deliveryStatus: jsonb("delivery_status").default({}),
  interactionData: jsonb("interaction_data").default({}),
  
  // State management
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  isPinned: boolean("is_pinned").default(false),
  readAt: timestamp("read_at"),
  archivedAt: timestamp("archived_at"),
  
  // Scheduling and expiration
  scheduledFor: timestamp("scheduled_for"),
  expiresAt: timestamp("expires_at"),
  
  // Rich content support
  richContent: jsonb("rich_content"),
  metadata: jsonb("metadata").default({}),
  
  // Audit trail
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_enhanced_notifications_user_unread").on(table.userId, table.isRead, table.createdAt),
  index("idx_enhanced_notifications_category").on(table.category, table.createdAt),
  index("idx_enhanced_notifications_related").on(table.relatedEntity, table.relatedId),
  index("idx_enhanced_notifications_scheduled").on(table.scheduledFor),
  index("idx_enhanced_notifications_expires").on(table.expiresAt),
  index("idx_enhanced_notifications_severity").on(table.severity),
  check("valid_type", `type IN ('info', 'success', 'warning', 'error', 'reminder')`),
  check("valid_severity", `severity IN ('low', 'normal', 'high', 'critical')`),
]);

// Notification templates for consistent messaging
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  templateKey: varchar("template_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Template content
  titleTemplate: text("title_template").notNull(),
  messageTemplate: text("message_template").notNull(),
  
  // Default settings
  defaultType: varchar("default_type", { length: 20 }).notNull().default("info"),
  defaultSeverity: varchar("default_severity", { length: 20 }).notNull().default("normal"),
  defaultCategory: varchar("default_category", { length: 50 }).notNull(),
  defaultDeliveryChannels: text("default_delivery_channels").array().default(["in_app"]),
  
  // Rich content template
  richContentTemplate: jsonb("rich_content_template"),
  
  // Conditional logic for template selection
  conditions: jsonb("conditions"),
  
  // Localization support
  locale: varchar("locale", { length: 10 }).default("pt-BR"),
  
  // Template versioning
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_templates_key").on(table.templateKey),
  index("idx_notification_templates_category").on(table.defaultCategory),
  index("idx_notification_templates_active").on(table.isActive),
]);

// Event triggers and automation rules
export const notificationTriggers = pgTable("notification_triggers", {
  id: serial("id").primaryKey(),
  triggerKey: varchar("trigger_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Trigger conditions
  eventType: varchar("event_type", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  conditions: jsonb("conditions"),
  
  // Template and delivery settings
  templateId: integer("template_id").references(() => notificationTemplates.id),
  overrideSettings: jsonb("override_settings"),
  
  // Timing and frequency
  delayMinutes: integer("delay_minutes").default(0),
  frequencyLimit: jsonb("frequency_limit"),
  
  // Target audience
  targetRoles: text("target_roles").array(),
  targetConditions: jsonb("target_conditions"),
  
  // Control flags
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher numbers = higher priority
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_triggers_event").on(table.eventType),
  index("idx_notification_triggers_entity").on(table.entityType),
  index("idx_notification_triggers_active").on(table.isActive),
  index("idx_notification_triggers_priority").on(table.priority),
]);

// Enhanced user notification preferences
export const enhancedNotificationPreferences = pgTable("enhanced_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Global preferences
  globalEnabled: boolean("global_enabled").default(true),
  quietHoursStart: time("quiet_hours_start"),
  quietHoursEnd: time("quiet_hours_end"),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo"),
  
  // Channel preferences
  emailEnabled: boolean("email_enabled").default(true),
  pushEnabled: boolean("push_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  
  // Category-specific preferences
  categoryPreferences: jsonb("category_preferences").default({}),
  
  // Frequency controls
  digestFrequency: varchar("digest_frequency", { length: 20 }).default("instant"),
  maxNotificationsPerDay: integer("max_notifications_per_day").default(50),
  
  // Advanced settings
  groupingEnabled: boolean("grouping_enabled").default(true),
  autoArchiveDays: integer("auto_archive_days").default(30),
  soundEnabled: boolean("sound_enabled").default(true),
  vibrationEnabled: boolean("vibration_enabled").default(true),
  
  // Smart features
  smartDeliveryEnabled: boolean("smart_delivery_enabled").default(true), // AI-powered timing
  priorityFiltering: boolean("priority_filtering").default(false),
  duplicateDetection: boolean("duplicate_detection").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_user_preferences").on(table.userId),
  index("idx_notification_preferences_user").on(table.userId),
  check("valid_digest_frequency", `digest_frequency IN ('instant', 'hourly', 'daily', 'weekly')`),
]);

// Notification delivery log for analytics and debugging
export const notificationDeliveryLog = pgTable("notification_delivery_log", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => enhancedNotifications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  
  // Delivery details
  channel: varchar("channel", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  provider: varchar("provider", { length: 50 }),
  
  // Delivery metadata
  externalId: varchar("external_id", { length: 255 }),
  deliveryData: jsonb("delivery_data"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  // Timing
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  
  // Engagement tracking
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  interactionCount: integer("interaction_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_delivery_log_notification").on(table.notificationId),
  index("idx_delivery_log_user").on(table.userId),
  index("idx_delivery_log_channel").on(table.channel),
  index("idx_delivery_log_status").on(table.status),
  index("idx_delivery_log_date").on(table.createdAt),
  check("valid_channel", `channel IN ('in_app', 'email', 'push', 'sms', 'whatsapp')`),
  check("valid_status", `status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')`),
]);

// Enhanced activity tracking for comprehensive notification triggers
export const enhancedUserActivityLog = pgTable("enhanced_user_activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id"),
  
  // Activity details
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  
  // Context and metadata
  context: jsonb("context").default({}),
  changes: jsonb("changes"),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  
  // Environment
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }),
  
  // Performance and debugging
  processingTimeMs: integer("processing_time_ms"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  
  // Notification trigger flags
  triggeredNotifications: boolean("triggered_notifications").default(false),
  notificationCount: integer("notification_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activity_log_user").on(table.userId, table.createdAt),
  index("idx_activity_log_action").on(table.action, table.createdAt),
  index("idx_activity_log_entity").on(table.entityType, table.entityId),
  index("idx_activity_log_session").on(table.sessionId),
  check("valid_device_type", `device_type IN ('desktop', 'mobile', 'tablet', 'unknown')`),
]);

// Notification analytics and metrics
export const notificationMetrics = pgTable("notification_metrics", {
  id: serial("id").primaryKey(),
  datePartition: date("date_partition").notNull(),
  
  // Aggregated metrics
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalFailed: integer("total_failed").default(0),
  
  // Breakdown by category
  categoryMetrics: jsonb("category_metrics").default({}),
  
  // Channel performance
  channelMetrics: jsonb("channel_metrics").default({}),
  
  // User engagement
  activeUsers: integer("active_users").default(0),
  avgTimeToRead: interval("avg_time_to_read"),
  
  // Performance metrics
  avgDeliveryTime: interval("avg_delivery_time"),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0.00"),
  clickThroughRate: decimal("click_through_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_date_partition").on(table.datePartition),
  index("idx_notification_metrics_date").on(table.datePartition),
]);

// Notification groups for batch operations and organization
export const notificationGroups = pgTable("notification_groups", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Group details
  groupKey: varchar("group_key", { length: 100 }).notNull(), // e.g., "property_123_stage_update"
  groupType: varchar("group_type", { length: 50 }).notNull(), // e.g., "property_updates", "reminders"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Group state
  totalNotifications: integer("total_notifications").default(0),
  unreadNotifications: integer("unread_notifications").default(0),
  isCollapsed: boolean("is_collapsed").default(false),
  
  // Group metadata
  metadata: jsonb("metadata").default({}),
  relatedEntity: varchar("related_entity", { length: 50 }),
  relatedId: integer("related_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
}, (table) => [
  unique("unique_user_group_key").on(table.userId, table.groupKey),
  index("idx_notification_groups_user").on(table.userId),
  index("idx_notification_groups_type").on(table.groupType),
  index("idx_notification_groups_activity").on(table.lastActivityAt),
]);

// Notification queue for background processing
export const notificationQueue = pgTable("notification_queue", {
  id: serial("id").primaryKey(),
  
  // Queue job details
  jobType: varchar("job_type", { length: 50 }).notNull(),
  priority: integer("priority").default(0),
  data: jsonb("data").notNull(),
  
  // Processing state
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  
  // Error handling
  lastError: text("last_error"),
  failureReason: text("failure_reason"),
  
  // Timing
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_notification_queue_status").on(table.status),
  index("idx_notification_queue_scheduled").on(table.scheduledFor),
  index("idx_notification_queue_priority").on(table.priority),
  index("idx_notification_queue_job_type").on(table.jobType),
  check("valid_status", `status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')`),
  check("valid_job_type", `job_type IN ('send_notification', 'process_digest', 'cleanup_expired', 'send_reminder')`),
]);

// Relations
export const enhancedNotificationsRelations = relations(enhancedNotifications, ({ one, many }) => ({
  parent: one(enhancedNotifications, {
    fields: [enhancedNotifications.parentNotificationId],
    references: [enhancedNotifications.id],
  }),
  children: many(enhancedNotifications),
  deliveryLogs: many(notificationDeliveryLog),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({ many }) => ({
  triggers: many(notificationTriggers),
}));

export const notificationTriggersRelations = relations(notificationTriggers, ({ one }) => ({
  template: one(notificationTemplates, {
    fields: [notificationTriggers.templateId],
    references: [notificationTemplates.id],
  }),
}));

export const notificationDeliveryLogRelations = relations(notificationDeliveryLog, ({ one }) => ({
  notification: one(enhancedNotifications, {
    fields: [notificationDeliveryLog.notificationId],
    references: [enhancedNotifications.id],
  }),
}));

export const notificationGroupsRelations = relations(notificationGroups, ({ many }) => ({
  notifications: many(enhancedNotifications),
}));

// Validation schemas
export const insertEnhancedNotificationSchema = createInsertSchema(enhancedNotifications);
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates);
export const insertNotificationTriggerSchema = createInsertSchema(notificationTriggers);
export const insertNotificationPreferencesSchema = createInsertSchema(enhancedNotificationPreferences);

// Custom validation schemas
export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID é obrigatório"),
  type: z.enum(["info", "success", "warning", "error", "reminder"]),
  severity: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  title: z.string().min(1, "Título é obrigatório").max(255),
  message: z.string().min(1, "Mensagem é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória").max(50),
  subcategory: z.string().max(50).optional(),
  relatedEntity: z.string().max(50).optional(),
  relatedId: z.number().optional(),
  actionUrl: z.string().url().optional().or(z.literal("")),
  actionData: z.record(z.any()).optional(),
  deliveryChannels: z.array(z.enum(["in_app", "email", "push", "sms", "whatsapp"])).default(["in_app"]),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
  richContent: z.record(z.any()).optional(),
  metadata: z.record(z.any()).default({}),
});

export const updateNotificationPreferencesSchema = z.object({
  globalEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().max(50).optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  categoryPreferences: z.record(z.any()).optional(),
  digestFrequency: z.enum(["instant", "hourly", "daily", "weekly"]).optional(),
  maxNotificationsPerDay: z.number().min(1).max(200).optional(),
  groupingEnabled: z.boolean().optional(),
  autoArchiveDays: z.number().min(1).max(365).optional(),
  smartDeliveryEnabled: z.boolean().optional(),
  priorityFiltering: z.boolean().optional(),
});

export const createNotificationTemplateSchema = z.object({
  templateKey: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  titleTemplate: z.string().min(1),
  messageTemplate: z.string().min(1),
  defaultType: z.enum(["info", "success", "warning", "error", "reminder"]).default("info"),
  defaultSeverity: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  defaultCategory: z.string().min(1).max(50),
  defaultDeliveryChannels: z.array(z.enum(["in_app", "email", "push", "sms", "whatsapp"])).default(["in_app"]),
  richContentTemplate: z.record(z.any()).optional(),
  conditions: z.record(z.any()).optional(),
  locale: z.string().max(10).default("pt-BR"),
});

// Types
export type InsertEnhancedNotification = z.infer<typeof insertEnhancedNotificationSchema>;
export type CreateNotification = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
export type CreateNotificationTemplate = z.infer<typeof createNotificationTemplateSchema>;

// Event type definitions
export const EventTypes = {
  // Property events
  PROPERTY_CREATED: 'property.created',
  PROPERTY_UPDATED: 'property.updated',
  PROPERTY_DELETED: 'property.deleted',
  STAGE_ADVANCED: 'property.stage.advanced',
  STAGE_BLOCKED: 'property.stage.blocked',
  DOCUMENT_UPLOADED: 'property.document.uploaded',
  DOCUMENT_MISSING: 'property.document.missing',
  DOCUMENT_APPROVED: 'property.document.approved',
  DOCUMENT_REJECTED: 'property.document.rejected',
  
  // Client events
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_NOTE_SAVED: 'client.note.saved',
  CLIENT_REMINDER_DUE: 'client.reminder.due',
  CLIENT_FOLLOWUP_REQUIRED: 'client.followup.required',
  CLIENT_MEETING_SCHEDULED: 'client.meeting.scheduled',
  CLIENT_CALL_COMPLETED: 'client.call.completed',
  
  // Contract events
  PROPOSAL_RECEIVED: 'contract.proposal.received',
  PROPOSAL_ACCEPTED: 'contract.proposal.accepted',
  PROPOSAL_REJECTED: 'contract.proposal.rejected',
  CONTRACT_SIGNED: 'contract.signed',
  CONTRACT_EXPIRES: 'contract.expires',
  CONTRACT_RENEWED: 'contract.renewed',
  
  // System events
  USER_LOGIN: 'user.login',
  USER_INACTIVE: 'user.inactive',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  SYSTEM_MAINTENANCE: 'system.maintenance',
  SYSTEM_UPDATE: 'system.update',
  BACKUP_COMPLETED: 'system.backup.completed',
  
  // Financial events
  PAYMENT_DUE: 'financial.payment.due',
  PAYMENT_OVERDUE: 'financial.payment.overdue',
  COMMISSION_CALCULATED: 'financial.commission.calculated',
  COMMISSION_PAID: 'financial.commission.paid',
  
  // Workflow events
  APPROVAL_REQUIRED: 'workflow.approval.required',
  APPROVAL_GRANTED: 'workflow.approval.granted',
  DEADLINE_APPROACHING: 'workflow.deadline.approaching',
  TASK_COMPLETED: 'workflow.task.completed',
  TASK_OVERDUE: 'workflow.task.overdue',
  
  // Registry events
  REGISTRY_SUBMITTED: 'registry.submitted',
  REGISTRY_APPROVED: 'registry.approved',
  REGISTRY_REJECTED: 'registry.rejected',
  REGISTRY_COMPLETED: 'registry.completed',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
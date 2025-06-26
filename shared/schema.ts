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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  avatarUrl: varchar("avatar_url"),
  bio: text("bio"),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  cpf: varchar("cpf").unique(),
  creci: varchar("creci").unique(),
  phone: varchar("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table - ATUALIZADA
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // apartamento, casa, cobertura, terreno
  
  // Endereço separado
  street: varchar("street").notNull(),
  number: varchar("number").notNull(),
  complement: varchar("complement"),
  neighborhood: varchar("neighborhood").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  cep: varchar("cep").notNull(),
  
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  
  // Documentação
  registrationNumber: varchar("registration_number").notNull(), // Ex-IPTU
  municipalRegistration: varchar("municipal_registration").notNull(),
  
  // Campos legados (manter compatibilidade temporária)
  address: text("address"), // DEPRECATED
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  area: decimal("area", { precision: 10, scale: 2 }),
  ownerName: varchar("owner_name"), // DEPRECATED
  ownerCpf: varchar("owner_cpf"), // DEPRECATED
  ownerRg: varchar("owner_rg"), // DEPRECATED
  ownerPhone: varchar("owner_phone"), // DEPRECATED
  iptuNumber: varchar("iptu_number"), // DEPRECATED
  
  status: varchar("status").notNull().default("captacao"), // captacao, diligence, mercado, proposta, contrato, instrumento, concluido
  currentStage: integer("current_stage").notNull().default(1), // 1-7
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NOVA TABELA: Property Owners
export const propertyOwners = pgTable("property_owners", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fullName: varchar("full_name").notNull(),
  cpf: varchar("cpf").notNull(),
  rg: varchar("rg").notNull(),
  birthDate: date("birth_date").notNull(),
  maritalStatus: varchar("marital_status").notNull(),
  fatherName: varchar("father_name").notNull(),
  motherName: varchar("mother_name").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  name: varchar("name").notNull(),          // ← Corrigido
  type: varchar("type").notNull(),          // ← Corrigido  
  url: text("url").notNull(),               // ← Corrigido
  status: varchar("status").notNull().default("pending"),  // ← Campo existente
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Proposals table
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  buyerName: varchar("buyer_name").notNull(),
  buyerCpf: varchar("buyer_cpf").notNull(),
  buyerPhone: varchar("buyer_phone").notNull(),
  proposedValue: decimal("proposed_value", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(),
  terms: text("terms"),
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected, negotiating
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id),
  contractData: jsonb("contract_data").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, active, completed, cancelled
  signedAt: timestamp("signed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Timeline entries table
export const timelineEntries = pgTable("timeline_entries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  stage: integer("stage").notNull(), // 1-7
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull(), // pending, active, completed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RELATIONS
export const propertiesRelations = relations(properties, ({ many }) => ({
  owners: many(propertyOwners),
  documents: many(documents),
  proposals: many(proposals),
  contracts: many(contracts),
  timelineEntries: many(timelineEntries),
}));

export const propertyOwnersRelations = relations(propertyOwners, ({ one }) => ({
  property: one(properties, {
    fields: [propertyOwners.propertyId],
    references: [properties.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  property: one(properties, {
    fields: [proposals.propertyId],
    references: [properties.id],
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  property: one(properties, {
    fields: [contracts.propertyId],
    references: [properties.id],
  }),
  proposal: one(proposals, {
    fields: [contracts.proposalId],
    references: [proposals.id],
  }),
}));

export const timelineEntriesRelations = relations(timelineEntries, ({ one }) => ({
  property: one(properties, {
    fields: [timelineEntries.propertyId],
    references: [properties.id],
  }),
}));

// SCHEMAS DE VALIDAÇÃO ATUALIZADOS
export const insertPropertySchema = createInsertSchema(properties);
export const insertPropertyOwnerSchema = createInsertSchema(propertyOwners);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertProposalSchema = createInsertSchema(proposals);
export const insertContractSchema = createInsertSchema(contracts);
export const insertTimelineEntrySchema = createInsertSchema(timelineEntries);

// TIPOS
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertPropertyOwner = z.infer<typeof insertPropertyOwnerSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type InsertTimelineEntry = z.infer<typeof insertTimelineEntrySchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'info', 'warning', 'error', 'success'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  category: varchar("category").notNull(), // 'property', 'contract', 'document', 'system'
  relatedId: integer("related_id"), // ID relacionado (property, contract, etc)
  actionUrl: varchar("action_url"), // URL para ação (se aplicável)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  theme: varchar("theme").default("light"), // 'light', 'dark', 'system'
  language: varchar("language").default("pt-BR"),
  timezone: varchar("timezone").default("America/Sao_Paulo"),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  marketingEmails: boolean("marketing_emails").default(false),
  weeklyReports: boolean("weekly_reports").default(true),
  reminderDeadlines: boolean("reminder_deadlines").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // 'created', 'updated', 'deleted', 'viewed'
  entity: varchar("entity").notNull(), // 'property', 'contract', 'document'
  entityId: integer("entity_id"),
  description: text("description"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
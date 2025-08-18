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

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").$defaultFn(() => false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

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
  userId: text("user_id").notNull(), // Temporarily remove FK constraint for migration
  sequenceNumber: varchar("sequence_number").notNull(), // #00001, #00002, etc
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
  
  status: varchar("status").notNull().default("captacao"), // captacao, diligence, mercado, proposta, contrato, financiamento, instrumento, concluido
  currentStage: integer("current_stage").notNull().default(1), // 1-8
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NOVA TABELA: Property Owners
export const propertyOwners = pgTable("property_owners", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fullName: varchar("full_name").notNull(),
  cpf: varchar("cpf").notNull(),
  rg: varchar("rg"),
  birthDate: date("birth_date"),
  maritalStatus: varchar("marital_status"),
  fatherName: varchar("father_name"),
  motherName: varchar("mother_name"),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
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
  stage: integer("stage").notNull(), // 1-8
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

// NOVA TABELA: Registros de Cartório
export const registros = pgTable("registros", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Temporarily remove FK constraint for migration
  
  // Dados do Registro
  protocolo: varchar("protocolo"), // Protocolo do cartório
  cartorioId: integer("cartorio_id").notNull().references(() => cartorios.id),
  dataEnvio: timestamp("data_envio"),
  
  // Status do registro: pronto_para_registro, em_analise, em_registro, exigencia, registrado
  status: varchar("status").notNull().default("pronto_para_registro"),
  
  // Dados adicionais
  observacoes: text("observacoes"),
  valorTaxas: decimal("valor_taxas", { precision: 10, scale: 2 }),
  prazoEstimado: integer("prazo_estimado"), // Em dias úteis
  
  // Mock integration data (simula APIs externas)
  mockStatus: jsonb("mock_status"), // Para simular dados de APIs de cartórios
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TABELA: Cartórios/RGIs - Registros de Imóveis
export const cartorios = pgTable("cartorios", {
  id: serial("id").primaryKey(),
  
  // Identificação
  numero: varchar("numero").notNull(), // "1º", "2º", etc.
  nome: varchar("nome").notNull(), // "1º SRI-RJ", "2º RGI-RJ", etc.
  nomeCompleto: varchar("nome_completo"), // Nome oficial completo
  
  // Localização
  cidade: varchar("cidade").notNull().default("Rio de Janeiro"),
  estado: varchar("estado").notNull().default("RJ"),
  endereco: text("endereco"),
  cep: varchar("cep"),
  
  // Contato
  telefone: varchar("telefone"),
  email: varchar("email"),
  site: varchar("site"), // URL do site oficial
  
  // Configurações
  ativo: boolean("ativo").notNull().default(true),
  permiteConsultaOnline: boolean("permite_consulta_online").default(true),
  
  // Horários de funcionamento
  horarioFuncionamento: jsonb("horario_funcionamento"),
  
  // Observações
  observacoes: text("observacoes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const registrosRelations = relations(registros, ({ one }) => ({
  property: one(properties, {
    fields: [registros.propertyId],
    references: [properties.id],
  }),
  user: one(user, {
    fields: [registros.userId],
    references: [user.id],
  }),
  cartorio: one(cartorios, {
    fields: [registros.cartorioId],
    references: [cartorios.id],
  }),
}));

// Adicionar relação inversa de properties para registros
export const propertiesRegistrosRelations = relations(properties, ({ many }) => ({
  registros: many(registros),
}));

// Relações da tabela cartórios
export const cartoriosRelations = relations(cartorios, ({ many }) => ({
  registros: many(registros),
}));


// SCHEMAS DE VALIDAÇÃO ATUALIZADOS
export const insertPropertySchema = createInsertSchema(properties);
export const insertPropertyOwnerSchema = createInsertSchema(propertyOwners);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertProposalSchema = createInsertSchema(proposals);
export const insertContractSchema = createInsertSchema(contracts);
export const insertTimelineEntrySchema = createInsertSchema(timelineEntries);
export const insertRegistroSchema = createInsertSchema(registros);
export const insertCartorioSchema = createInsertSchema(cartorios);

// Schema customizado para validação de registro com regras específicas
export const createRegistroSchema = z.object({
  propertyId: z.number().min(1, "Propriedade é obrigatória"),
  protocolo: z.string().optional(),
  cartorioId: z.number().min(1, "Cartório é obrigatório"),
  status: z.enum(["pronto_para_registro", "em_analise", "em_registro", "exigencia", "registrado"]).default("pronto_para_registro"),
  valorTaxas: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  prazoEstimado: z.number().min(1, "Prazo deve ser pelo menos 1 dia").max(365, "Prazo não pode exceder 365 dias").optional(),
  dataEnvio: z.date().optional(),
  observacoes: z.string().optional(),
});

export const updateRegistroSchema = createRegistroSchema.partial();

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se não são todos iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const firstDigit = remainder >= 10 ? 0 : remainder;
  
  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const secondDigit = remainder >= 10 ? 0 : remainder;
  
  // Verifica se os dígitos calculados conferem
  return firstDigit === parseInt(cleanCPF.charAt(9)) && 
         secondDigit === parseInt(cleanCPF.charAt(10));
};


// TIPOS
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertPropertyOwner = z.infer<typeof insertPropertyOwnerSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type InsertTimelineEntry = z.infer<typeof insertTimelineEntrySchema>;
export type InsertRegistro = z.infer<typeof insertRegistroSchema>;
export type CreateRegistro = z.infer<typeof createRegistroSchema>;
export type UpdateRegistro = z.infer<typeof updateRegistroSchema>;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Temporarily remove FK constraint
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
  userId: text("user_id").notNull(), // Temporarily remove FK constraint
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
  userId: text("user_id").notNull(), // Temporarily remove FK constraint
  action: varchar("action").notNull(), // 'created', 'updated', 'deleted', 'viewed'
  entity: varchar("entity").notNull(), // 'property', 'contract', 'document'
  entityId: integer("entity_id"),
  description: text("description"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table - Sistema de Clientes
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Temporarily remove FK constraint
  fullName: varchar("full_name").notNull(),
  cpf: varchar("cpf").unique().notNull(),
  birthDate: date("birth_date"),
  email: varchar("email").unique().notNull(),
  phonePrimary: varchar("phone_primary").notNull(),
  phoneSecondary: varchar("phone_secondary"),
  addressStreet: varchar("address_street").notNull(),
  addressNumber: varchar("address_number").notNull(),
  addressComplement: varchar("address_complement"),
  addressNeighborhood: varchar("address_neighborhood").notNull(),
  addressCity: varchar("address_city").notNull(),
  addressState: varchar("address_state").notNull(),
  addressZip: varchar("address_zip").notNull(),
  maritalStatus: varchar("marital_status"), // 'Solteiro', 'Casado', 'Divorciado', 'Viúvo'
  profession: varchar("profession"),
  monthlyIncome: decimal("monthly_income", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("clients_cpf_idx").on(table.cpf),
  index("clients_email_idx").on(table.email),
  index("clients_created_at_idx").on(table.createdAt),
  index("clients_user_id_idx").on(table.userId),
]);

// Client Notes table - Sistema de Notas de Clientes
export const clientNotes = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Temporarily remove FK constraint
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("note"), // 'note', 'reminder', 'follow_up', 'meeting', 'call'
  priority: varchar("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  
  // Campos para lembretes e reuniões
  reminderDate: timestamp("reminder_date"),
  location: varchar("location"), // Para reuniões: endereço ou link
  participants: text("participants"), // Lista de participantes (JSON ou texto)
  
  // Campos específicos para ligações
  duration: integer("duration"), // Duração em minutos
  callResult: varchar("call_result"), // 'success', 'no_answer', 'busy', 'callback_requested'
  nextSteps: text("next_steps"), // Próximos passos acordados
  
  // Campos de controle e metadata
  metadata: jsonb("metadata"), // Dados estruturados específicos por tipo
  status: varchar("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'cancelled'
  
  // Auditoria e tracking
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: text("completed_by"), // Usuário que marcou como completo
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("client_notes_client_id_idx").on(table.clientId),
  index("client_notes_user_id_idx").on(table.userId),
  index("client_notes_type_idx").on(table.type),
  index("client_notes_status_idx").on(table.status),
  index("client_notes_priority_idx").on(table.priority),
  index("client_notes_created_at_idx").on(table.createdAt),
  index("client_notes_reminder_date_idx").on(table.reminderDate),
  index("client_notes_completed_idx").on(table.isCompleted),
]);

// RELAÇÕES DOS CLIENTES
export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(user, {
    fields: [clients.userId],
    references: [user.id],
  }),
  notes: many(clientNotes),
}));

export const clientNotesRelations = relations(clientNotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [clientNotes.clientId],
    references: [clients.id],
  }),
  user: one(user, {
    fields: [clientNotes.userId],
    references: [user.id],
  }),
  auditLogs: many(clientNoteAuditLogs),
}));

// Client Note Audit Logs - Rastreamento de mudanças
export const clientNoteAuditLogs = pgTable("client_note_audit_logs", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => clientNotes.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  action: varchar("action").notNull(), // 'created', 'updated', 'status_changed', 'completed', 'cancelled'
  field: varchar("field"), // Campo que foi alterado
  oldValue: text("old_value"), // Valor anterior
  newValue: text("new_value"), // Novo valor
  reason: text("reason"), // Motivo da alteração (opcional)
  metadata: jsonb("metadata"), // Dados adicionais
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("client_note_audit_note_id_idx").on(table.noteId),
  index("client_note_audit_action_idx").on(table.action),
  index("client_note_audit_created_at_idx").on(table.createdAt),
]);

export const clientNoteAuditLogsRelations = relations(clientNoteAuditLogs, ({ one }) => ({
  note: one(clientNotes, {
    fields: [clientNoteAuditLogs.noteId],
    references: [clientNotes.id],
  }),
  user: one(user, {
    fields: [clientNoteAuditLogs.userId],
    references: [user.id],
  }),
}));

// Better Auth table relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  properties: many(properties),
  registros: many(registros),
  notifications: many(notifications),
  userSettings: many(userSettings),
  activityLogs: many(activityLogs),
  clients: many(clients),
  clientNotes: many(clientNotes),
  scheduledNotifications: many(scheduledNotifications),
}));

// Scheduled Notifications - Sistema de lembretes automáticos
export const scheduledNotifications = pgTable("scheduled_notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  relatedType: varchar("related_type").notNull(), // 'client_note', 'reminder', 'meeting'
  relatedId: integer("related_id").notNull(), // ID da nota/lembrete/reunião
  
  // Configuração da notificação
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  notificationType: varchar("notification_type").notNull(), // 'email', 'push', 'sms', 'in_app'
  
  // Status e controle
  status: varchar("status").notNull().default("pending"), // 'pending', 'sent', 'failed', 'cancelled'
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("scheduled_notifications_user_id_idx").on(table.userId),
  index("scheduled_notifications_scheduled_for_idx").on(table.scheduledFor),
  index("scheduled_notifications_status_idx").on(table.status),
  index("scheduled_notifications_related_idx").on(table.relatedType, table.relatedId),
]);

export const scheduledNotificationsRelations = relations(scheduledNotifications, ({ one }) => ({
  user: one(user, {
    fields: [scheduledNotifications.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// SCHEMAS DE VALIDAÇÃO DOS CLIENTES
export const insertClientSchema = createInsertSchema(clients);

// Schema para criação de cliente
export const createClientSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255, "Nome muito longo"),
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(14, "CPF inválido")
    .refine((cpf) => validateCPF(cpf), "CPF inválido"),
  email: z.string().email("Email inválido").max(255, "Email muito longo"),
  phonePrimary: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(15, "Telefone muito longo"),
  phoneSecondary: z.string().optional().refine(
    (val) => !val || val.length === 0 || val.length >= 10, 
    "Telefone deve ter pelo menos 10 dígitos"
  ).refine(
    (val) => !val || val.length === 0 || val.length <= 15, 
    "Telefone muito longo"
  ),
  addressStreet: z.string().min(5, "Logradouro deve ter pelo menos 5 caracteres").max(255, "Logradouro muito longo"),
  addressNumber: z.string().min(1, "Número é obrigatório").max(10, "Número muito longo"),
  addressComplement: z.string().max(100, "Complemento muito longo").optional(),
  addressNeighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres").max(100, "Bairro muito longo"),
  addressCity: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").max(100, "Cidade muito longa"),
  addressState: z.string().length(2, "Estado deve ter 2 caracteres (UF)"),
  addressZip: z.string().min(8, "CEP deve ter 8 dígitos").max(9, "CEP inválido"),
  maritalStatus: z.enum(["Solteiro", "Casado", "Divorciado", "Viúvo"]),
  profession: z.string().max(100, "Profissão muito longa").optional(),
  monthlyIncome: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  notes: z.string().max(1000, "Observações muito longas").optional(),
  birthDate: z.string().optional().transform(val => val && val.length > 0 ? new Date(val) : undefined),
});

// Schema para atualização de cliente
export const updateClientSchema = createClientSchema.partial();

// SCHEMAS DE VALIDAÇÃO DAS NOTAS DE CLIENTES
export const insertClientNoteSchema = createInsertSchema(clientNotes);

// Schema para criação de nota de cliente
export const createClientNoteSchema = z.object({
  clientId: z.number().min(1, "Cliente é obrigatório"),
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  content: z.string().min(1, "Conteúdo é obrigatório").max(5000, "Conteúdo muito longo"),
  type: z.enum(["note", "reminder", "follow_up", "meeting", "call"]).default("note"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  
  // Campos opcionais para diferentes tipos
  reminderDate: z.string().optional().transform(val => val && val.length > 0 ? new Date(val) : undefined),
  location: z.string().max(255, "Local muito longo").optional(),
  participants: z.string().max(1000, "Lista de participantes muito longa").optional(),
  
  // Campos específicos para ligações
  duration: z.number().min(0, "Duração não pode ser negativa").max(480, "Duração não pode exceder 8 horas").optional(),
  callResult: z.enum(["success", "no_answer", "busy", "callback_requested", "voicemail", "disconnected"]).optional(),
  nextSteps: z.string().max(1000, "Próximos passos muito longos").optional(),
  
  // Metadata estruturada para extensibilidade
  metadata: z.record(z.any()).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
});

// Schema para atualização de nota de cliente
export const updateClientNoteSchema = createClientNoteSchema.partial().extend({
  isCompleted: z.boolean().optional(),
  completedAt: z.string().optional().transform(val => val && val.length > 0 ? new Date(val) : undefined),
  completedBy: z.string().optional(),
});

// TIPOS DOS CLIENTES
export type InsertClient = z.infer<typeof insertClientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;

// TIPOS DAS NOTAS DE CLIENTES
export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;
export type CreateClientNote = z.infer<typeof createClientNoteSchema>;
export type UpdateClientNote = z.infer<typeof updateClientNoteSchema>;

// ======================================
// PENDENCY CONTROL SYSTEM TABLES
// ======================================

// Stage Requirements - Define what's needed for each stage
export const stageRequirements = pgTable("stage_requirements", {
  id: serial("id").primaryKey(),
  stageId: integer("stage_id").notNull(),
  requirementKey: varchar("requirement_key", { length: 100 }).notNull(),
  requirementName: varchar("requirement_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // DOCUMENT, DATA, VALIDATION, APPROVAL
  isCritical: boolean("is_critical").notNull().default(true),
  validationRules: jsonb("validation_rules"), // JSON validation rules
  propertyTypes: varchar("property_types", { length: 255 }), // 'apartamento,casa' or '*'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stage_requirements_stage").on(table.stageId),
  index("idx_stage_requirements_critical").on(table.isCritical),
]);

// Property Requirements Status - Track completion per property
export const propertyRequirements = pgTable("property_requirements", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  requirementId: integer("requirement_id").notNull().references(() => stageRequirements.id, { onDelete: "cascade" }),
  stageId: integer("stage_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"), // PENDING, COMPLETED, NOT_APPLICABLE, FAILED
  completionPercentage: integer("completion_percentage").default(0),
  validationData: jsonb("validation_data"), // Store validation results
  notes: text("notes"),
  completedBy: text("completed_by"), // User ID
  completedAt: timestamp("completed_at"),
  lastCheckedAt: timestamp("last_checked_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_property_requirements_property").on(table.propertyId),
  index("idx_property_requirements_stage").on(table.stageId),
  index("idx_property_requirements_status").on(table.status),
  index("idx_property_requirements_critical").on(table.propertyId, table.stageId),
]);

// Stage Advancement Log - Audit trail for stage changes
export const stageAdvancementLog = pgTable("stage_advancement_log", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  fromStage: integer("from_stage"),
  toStage: integer("to_stage").notNull(),
  userId: text("user_id").notNull(),
  advancementType: varchar("advancement_type", { length: 20 }).notNull(), // AUTOMATIC, MANUAL, OVERRIDE
  validationStatus: varchar("validation_status", { length: 20 }).notNull(), // PASSED, FAILED, OVERRIDDEN
  pendingCriticalCount: integer("pending_critical_count").default(0),
  pendingNonCriticalCount: integer("pending_non_critical_count").default(0),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0.00"),
  validationResults: jsonb("validation_results"), // Detailed validation results
  overrideReason: text("override_reason"), // Required for OVERRIDE type
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_stage_advancement_property").on(table.propertyId),
  index("idx_stage_advancement_date").on(table.createdAt),
  index("idx_stage_advancement_user").on(table.userId),
]);

// Pendency Notifications - Track notifications for pending requirements
export const pendencyNotifications = pgTable("pendency_notifications", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  requirementId: integer("requirement_id").notNull().references(() => stageRequirements.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // MISSING_DOCUMENT, VALIDATION_FAILED, STAGE_BLOCKED
  severity: varchar("severity", { length: 20 }).notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url", { length: 500 }), // Deep link to resolve
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  autoResolveAt: timestamp("auto_resolve_at"), // For automatic resolution
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pendency_notifications_property").on(table.propertyId),
  index("idx_pendency_notifications_user").on(table.userId),
  index("idx_pendency_notifications_unread").on(table.userId, table.isRead),
  index("idx_pendency_notifications_severity").on(table.severity),
]);

// Stage Completion Metrics - Cached metrics for performance
export const stageCompletionMetrics = pgTable("stage_completion_metrics", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  stageId: integer("stage_id").notNull(),
  totalRequirements: integer("total_requirements").notNull().default(0),
  completedRequirements: integer("completed_requirements").notNull().default(0),
  criticalRequirements: integer("critical_requirements").notNull().default(0),
  completedCritical: integer("completed_critical").notNull().default(0),
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("0.00"),
  criticalCompletionPercentage: decimal("critical_completion_percentage", { precision: 5, scale: 2 }).default("0.00"),
  canAdvance: boolean("can_advance").default(false),
  blockingRequirements: integer("blocking_requirements").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
}, (table) => [
  index("idx_stage_completion_property").on(table.propertyId),
  index("idx_stage_completion_stage").on(table.stageId),
  index("idx_stage_completion_can_advance").on(table.canAdvance),
]);

// ======================================
// PENDENCY SYSTEM RELATIONS
// ======================================

export const stageRequirementsRelations = relations(stageRequirements, ({ many }) => ({
  propertyRequirements: many(propertyRequirements),
  pendencyNotifications: many(pendencyNotifications),
}));

export const propertyRequirementsRelations = relations(propertyRequirements, ({ one }) => ({
  property: one(properties, {
    fields: [propertyRequirements.propertyId],
    references: [properties.id],
  }),
  requirement: one(stageRequirements, {
    fields: [propertyRequirements.requirementId],
    references: [stageRequirements.id],
  }),
}));

export const stageAdvancementLogRelations = relations(stageAdvancementLog, ({ one }) => ({
  property: one(properties, {
    fields: [stageAdvancementLog.propertyId],
    references: [properties.id],
  }),
}));

export const pendencyNotificationsRelations = relations(pendencyNotifications, ({ one }) => ({
  property: one(properties, {
    fields: [pendencyNotifications.propertyId],
    references: [properties.id],
  }),
  requirement: one(stageRequirements, {
    fields: [pendencyNotifications.requirementId],
    references: [stageRequirements.id],
  }),
}));

export const stageCompletionMetricsRelations = relations(stageCompletionMetrics, ({ one }) => ({
  property: one(properties, {
    fields: [stageCompletionMetrics.propertyId],
    references: [properties.id],
  }),
}));

// ======================================
// PENDENCY SYSTEM SCHEMAS
// ======================================

export const insertStageRequirementSchema = createInsertSchema(stageRequirements);
export const insertPropertyRequirementSchema = createInsertSchema(propertyRequirements);
export const insertStageAdvancementLogSchema = createInsertSchema(stageAdvancementLog);
export const insertPendencyNotificationSchema = createInsertSchema(pendencyNotifications);

// Create Stage Requirement Schema
export const createStageRequirementSchema = z.object({
  stageId: z.number().min(1).max(8),
  requirementKey: z.string().min(1).max(100),
  requirementName: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(["DOCUMENT", "DATA", "VALIDATION", "APPROVAL"]),
  isCritical: z.boolean().default(true),
  validationRules: z.record(z.any()).optional(),
  propertyTypes: z.string().default("*"), // "*" for all, or "apartamento,casa"
});

// Update Property Requirement Schema
export const updatePropertyRequirementSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "NOT_APPLICABLE", "FAILED"]).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  validationData: z.record(z.any()).optional(),
  notes: z.string().optional(),
  completedBy: z.string().optional(),
});

// Stage Advancement Schema
export const stageAdvancementSchema = z.object({
  toStage: z.number().min(1).max(8),
  advancementType: z.enum(["AUTOMATIC", "MANUAL", "OVERRIDE"]).default("MANUAL"),
  overrideReason: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Pendency Validation Result Schema
export const pendencyValidationResultSchema = z.object({
  canAdvance: z.boolean(),
  totalRequirements: z.number(),
  completedRequirements: z.number(),
  criticalRequirements: z.number(),
  completedCritical: z.number(),
  completionPercentage: z.number(),
  criticalCompletionPercentage: z.number(),
  blockingRequirements: z.array(z.object({
    id: z.number(),
    requirementKey: z.string(),
    requirementName: z.string(),
    category: z.string(),
    status: z.string(),
    notes: z.string().optional(),
  })),
  warnings: z.array(z.string()).optional(),
});

// ======================================
// PENDENCY SYSTEM TYPES
// ======================================

export type InsertStageRequirement = z.infer<typeof insertStageRequirementSchema>;
export type CreateStageRequirement = z.infer<typeof createStageRequirementSchema>;
export type UpdatePropertyRequirement = z.infer<typeof updatePropertyRequirementSchema>;
export type StageAdvancement = z.infer<typeof stageAdvancementSchema>;
export type PendencyValidationResult = z.infer<typeof pendencyValidationResultSchema>;

// SCHEMAS DE VALIDAÇÃO PARA AUDITORIA E NOTIFICAÇÕES
export const insertClientNoteAuditLogSchema = createInsertSchema(clientNoteAuditLogs);
export const insertScheduledNotificationSchema = createInsertSchema(scheduledNotifications);

// Schema para criar log de auditoria
export const createAuditLogSchema = z.object({
  noteId: z.number().min(1, "ID da nota é obrigatório"),
  action: z.enum(["created", "updated", "status_changed", "completed", "cancelled"]),
  field: z.string().max(100, "Nome do campo muito longo").optional(),
  oldValue: z.string().max(1000, "Valor anterior muito longo").optional(),
  newValue: z.string().max(1000, "Novo valor muito longo").optional(),
  reason: z.string().max(500, "Motivo muito longo").optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema para agendar notificação
export const createScheduledNotificationSchema = z.object({
  relatedType: z.enum(["client_note", "reminder", "meeting"]),
  relatedId: z.number().min(1, "ID relacionado é obrigatório"),
  title: z.string().min(1, "Título é obrigatório").max(255, "Título muito longo"),
  message: z.string().min(1, "Mensagem é obrigatória").max(1000, "Mensagem muito longa"),
  scheduledFor: z.date(),
  notificationType: z.enum(["email", "push", "sms", "in_app"]).default("in_app"),
  metadata: z.record(z.any()).optional(),
});

// TIPOS PARA AUDITORIA E NOTIFICAÇÕES
export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;
export type CreateScheduledNotification = z.infer<typeof createScheduledNotificationSchema>;
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
  userId: integer("user_id").notNull().references(() => users.id),
  
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
  user: one(users, {
    fields: [registros.userId],
    references: [users.id],
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

// Clients table - Sistema de Clientes
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // Associado ao corretor
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

// RELAÇÕES DOS CLIENTES
export const clientsRelations = relations(clients, ({ one }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
}));

// Adicionar relação inversa de users para clients
export const usersClientsRelations = relations(users, ({ many }) => ({
  clients: many(clients),
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
  phoneSecondary: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(15, "Telefone muito longo").optional(),
  addressStreet: z.string().min(5, "Logradouro deve ter pelo menos 5 caracteres").max(255, "Logradouro muito longo"),
  addressNumber: z.string().min(1, "Número é obrigatório").max(10, "Número muito longo"),
  addressComplement: z.string().max(100, "Complemento muito longo").optional(),
  addressNeighborhood: z.string().min(2, "Bairro deve ter pelo menos 2 caracteres").max(100, "Bairro muito longo"),
  addressCity: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres").max(100, "Cidade muito longa"),
  addressState: z.string().length(2, "Estado deve ter 2 caracteres (UF)"),
  addressZip: z.string().min(8, "CEP deve ter 8 dígitos").max(9, "CEP inválido"),
  maritalStatus: z.enum(["Solteiro", "Casado", "Divorciado", "Viúvo"]).optional(),
  profession: z.string().max(100, "Profissão muito longa").optional(),
  monthlyIncome: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  notes: z.string().max(1000, "Observações muito longas").optional(),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

// Schema para atualização de cliente
export const updateClientSchema = createClientSchema.partial();

// TIPOS DOS CLIENTES
export type InsertClient = z.infer<typeof insertClientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
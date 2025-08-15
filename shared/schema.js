import { pgTable, text, varchar, timestamp, jsonb, index, serial, integer, decimal, boolean, date, } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
export const sessions = pgTable("sessions", {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);
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
export const properties = pgTable("properties", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    sequenceNumber: varchar("sequence_number").notNull(),
    type: varchar("type").notNull(),
    street: varchar("street").notNull(),
    number: varchar("number").notNull(),
    complement: varchar("complement"),
    neighborhood: varchar("neighborhood").notNull(),
    city: varchar("city").notNull(),
    state: varchar("state").notNull(),
    cep: varchar("cep").notNull(),
    value: decimal("value", { precision: 15, scale: 2 }).notNull(),
    registrationNumber: varchar("registration_number").notNull(),
    municipalRegistration: varchar("municipal_registration").notNull(),
    address: text("address"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    area: decimal("area", { precision: 10, scale: 2 }),
    ownerName: varchar("owner_name"),
    ownerCpf: varchar("owner_cpf"),
    ownerRg: varchar("owner_rg"),
    ownerPhone: varchar("owner_phone"),
    iptuNumber: varchar("iptu_number"),
    status: varchar("status").notNull().default("captacao"),
    currentStage: integer("current_stage").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
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
export const documents = pgTable("documents", {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull().references(() => properties.id),
    name: varchar("name").notNull(),
    type: varchar("type").notNull(),
    url: text("url").notNull(),
    status: varchar("status").notNull().default("pending"),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
});
export const proposals = pgTable("proposals", {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull().references(() => properties.id),
    buyerName: varchar("buyer_name").notNull(),
    buyerCpf: varchar("buyer_cpf").notNull(),
    buyerPhone: varchar("buyer_phone").notNull(),
    proposedValue: decimal("proposed_value", { precision: 15, scale: 2 }).notNull(),
    paymentMethod: varchar("payment_method").notNull(),
    terms: text("terms"),
    status: varchar("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const contracts = pgTable("contracts", {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull().references(() => properties.id),
    proposalId: integer("proposal_id").notNull().references(() => proposals.id),
    contractData: jsonb("contract_data").notNull(),
    status: varchar("status").notNull().default("draft"),
    signedAt: timestamp("signed_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const timelineEntries = pgTable("timeline_entries", {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull().references(() => properties.id),
    stage: integer("stage").notNull(),
    title: varchar("title").notNull(),
    description: text("description"),
    status: varchar("status").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
});
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
export const registros = pgTable("registros", {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id),
    protocolo: varchar("protocolo"),
    cartorioId: integer("cartorio_id").notNull().references(() => cartorios.id),
    dataEnvio: timestamp("data_envio"),
    status: varchar("status").notNull().default("pronto_para_registro"),
    observacoes: text("observacoes"),
    valorTaxas: decimal("valor_taxas", { precision: 10, scale: 2 }),
    prazoEstimado: integer("prazo_estimado"),
    mockStatus: jsonb("mock_status"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export const cartorios = pgTable("cartorios", {
    id: serial("id").primaryKey(),
    numero: varchar("numero").notNull(),
    nome: varchar("nome").notNull(),
    nomeCompleto: varchar("nome_completo"),
    cidade: varchar("cidade").notNull().default("Rio de Janeiro"),
    estado: varchar("estado").notNull().default("RJ"),
    endereco: text("endereco"),
    cep: varchar("cep"),
    telefone: varchar("telefone"),
    email: varchar("email"),
    site: varchar("site"),
    ativo: boolean("ativo").notNull().default(true),
    permiteConsultaOnline: boolean("permite_consulta_online").default(true),
    horarioFuncionamento: jsonb("horario_funcionamento"),
    observacoes: text("observacoes"),
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
export const propertiesRegistrosRelations = relations(properties, ({ many }) => ({
    registros: many(registros),
}));
export const cartoriosRelations = relations(cartorios, ({ many }) => ({
    registros: many(registros),
}));
export const insertPropertySchema = createInsertSchema(properties);
export const insertPropertyOwnerSchema = createInsertSchema(propertyOwners);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertProposalSchema = createInsertSchema(proposals);
export const insertContractSchema = createInsertSchema(contracts);
export const insertTimelineEntrySchema = createInsertSchema(timelineEntries);
export const insertRegistroSchema = createInsertSchema(registros);
export const insertCartorioSchema = createInsertSchema(cartorios);
export const createRegistroSchema = insertRegistroSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    mockStatus: true,
}).extend({
    cartorioId: z.number().min(1, "Cartório é obrigatório"),
    status: z.enum(["pronto_para_registro", "em_analise", "em_registro", "exigencia", "registrado"]).default("pronto_para_registro"),
    valorTaxas: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    prazoEstimado: z.number().min(1, "Prazo deve ser pelo menos 1 dia").max(365, "Prazo não pode exceder 365 dias").optional(),
});
export const updateRegistroSchema = createRegistroSchema.partial();
const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11)
        return false;
    if (/^(\d)\1{10}$/.test(cleanCPF))
        return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const firstDigit = remainder >= 10 ? 0 : remainder;
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const secondDigit = remainder >= 10 ? 0 : remainder;
    return firstDigit === parseInt(cleanCPF.charAt(9)) &&
        secondDigit === parseInt(cleanCPF.charAt(10));
};
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    type: varchar("type").notNull(),
    title: varchar("title").notNull(),
    message: text("message").notNull(),
    category: varchar("category").notNull(),
    relatedId: integer("related_id"),
    actionUrl: varchar("action_url"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    readAt: timestamp("read_at"),
});
export const userSettings = pgTable("user_settings", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    theme: varchar("theme").default("light"),
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
export const activityLogs = pgTable("activity_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    action: varchar("action").notNull(),
    entity: varchar("entity").notNull(),
    entityId: integer("entity_id"),
    description: text("description"),
    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const clients = pgTable("clients", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
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
    maritalStatus: varchar("marital_status"),
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
export const clientsRelations = relations(clients, ({ one }) => ({
    user: one(users, {
        fields: [clients.userId],
        references: [users.id],
    }),
}));
export const usersClientsRelations = relations(users, ({ many }) => ({
    clients: many(clients),
}));
export const insertClientSchema = createInsertSchema(clients);
export const createClientSchema = insertClientSchema.omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
}).extend({
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
export const updateClientSchema = createClientSchema.partial();

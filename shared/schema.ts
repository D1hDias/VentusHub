import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";

// Better Auth tables (using snake_case to match existing database)
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
  expiresAt: timestamp("expires_at"),
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

// B2B User Profiles - Separate table for business data
export const b2bUserProfiles = pgTable("b2b_user_profiles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Business Type
  userType: text("user_type").notNull(), // CORRETOR_AUTONOMO, IMOBILIARIA
  
  // Organization Info
  organizationName: text("organization_name"), // Nome da imobiliária/empresa
  organizationId: text("organization_id"),
  
  // Professional Data
  creci: text("creci"), // CRECI para corretores
  cnpj: text("cnpj"), // CNPJ para imobiliárias
  cpf: text("cpf"), // CPF para corretores autônomos
  
  // Contact Info
  phone: text("phone"), // Telefone de contato
  address: text("address"), // Endereço completo
  
  // System Data
  permissions: text("permissions").default('[]'), // JSON array as text
  isActive: boolean("is_active").default(true),
  createdBy: text("created_by"), // ID do admin que criou o usuário
  notes: text("notes"), // Observações administrativas
  
  // Timestamps
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
}, (table) => [
  index("idx_b2b_user_profiles_user_id").on(table.userId),
  index("idx_b2b_user_profiles_user_type").on(table.userType),
  index("idx_b2b_user_profiles_active").on(table.isActive),
]);


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

// ==========================================
// MULTI-TENANT TABLES - VENTUS SaaS
// ==========================================

// Organizações (Multi-tenant root)
export const organization = pgTable("organization", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  nome: varchar("nome").notNull(),
  tipo: varchar("tipo").notNull(), // AUTONOMO, IMOBILIARIA, CONSTRUTORA, EQUIPE_VENTUS
  ownerUserId: text("owner_user_id").notNull().references(() => user.id),
  
  // Configurações da organização
  settings: jsonb("settings").$type<{
    // Configurações de negócio
    comissaoDefault?: number;
    metaMensal?: number;
    
    // Configurações de marca
    logo?: string;
    cores?: {
      primary: string;
      secondary: string;
    };
    
    // Configurações de integração
    portais?: {
      vivaReal?: { token?: string; ativo: boolean };
      zapimoveis?: { token?: string; ativo: boolean };
      olx?: { token?: string; ativo: boolean };
    };
    
    // Configurações de IA
    ia?: {
      gerarAnuncio: boolean;
      buscarSemantica: boolean;
      assistenteVirtual: boolean;
    };
  }>(),
  
  // Dados administrativos
  documento: varchar("documento"), // CNPJ ou CPF
  endereco: jsonb("endereco").$type<{
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  }>(),
  
  // Status
  ativo: boolean("ativo").notNull().default(true),
  plano: varchar("plano").notNull().default("FREE"), // FREE, BASIC, PRO, ENTERPRISE
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Membros da organização (RBAC)
export const membership = pgTable("membership", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organizationId").notNull().references(() => organization.id, { onDelete: "cascade" }),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // RBAC - Roles
  role: varchar("role").notNull(), // ORG_ADMIN, GERENTE, CORRETOR, AUTONOMO, EQUIPE_VENTUS, CLIENTE_FINAL, CONSTRUTORA
  
  // Permissões específicas (override do role)
  permissions: jsonb("permissions").$type<{
    clientes?: { read: boolean; write: boolean; delete: boolean };
    imoveis?: { read: boolean; write: boolean; delete: boolean };
    propostas?: { read: boolean; write: boolean; delete: boolean };
    financeiro?: { read: boolean; write: boolean; delete: boolean };
    relatorios?: { read: boolean; write: boolean };
    configuracoes?: { read: boolean; write: boolean };
  }>(),
  
  // Status
  ativo: boolean("ativo").notNull().default(true),
  
  // Hierarquia (para imobiliárias)
  supervisorId: text("supervisorId").references(() => user.id),
  
  // Auditoria
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  // Índices para performance
  index("idx_membership_org").on(table.organizationId),
  index("idx_membership_user").on(table.userId),
]);

// Pessoas (Clientes, Proprietários, Compradores) - Multi-tenant
export const pessoa = pgTable("pessoa", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Identificação (com criptografia)
  cpfHash: text("cpf_hash").notNull(), // SHA256(CPF normalizado) para busca
  cpfEnc: text("cpf_enc"), // PGP_SYM_ENCRYPT(CPF) para descriptografia
  rg: varchar("rg"),
  
  // Dados pessoais
  nome: varchar("nome").notNull(),
  nascimento: date("nascimento"),
  
  // Contatos (LGPD-friendly)
  contatos: jsonb("contatos").$type<{
    telefones: Array<{
      numero: string;
      tipo: 'CELULAR' | 'FIXO' | 'COMERCIAL';
      principal: boolean;
    }>;
    emails: Array<{
      email: string;
      tipo: 'PESSOAL' | 'COMERCIAL';
      principal: boolean;
    }>;
  }>(),
  
  // Endereço
  endereco: jsonb("endereco").$type<{
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    referencia?: string;
  }>(),
  
  // Dados complementares
  estadoCivil: varchar("estado_civil"), // SOLTEIRO, CASADO, DIVORCIADO, VIUVO, UNIAO_ESTAVEL
  profissao: varchar("profissao"),
  rendaMensal: decimal("renda_mensal", { precision: 15, scale: 2 }),
  
  // Relacionamentos familiares
  nomePai: varchar("nome_pai"),
  nomeMae: varchar("nome_mae"),
  
  // Observações e notas
  observacoes: text("observacoes"),
  
  // Tags para segmentação
  tags: jsonb("tags").$type<string[]>(),
  
  // Status
  ativo: boolean("ativo").notNull().default(true),
  
  // Auditoria
  createdBy: text("created_by").references(() => user.id),
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // CONSTRAINT: Unique CPF por organização
  uniqueIndex("idx_pessoa_cpf_org").on(table.organizationId, table.cpfHash),
  index("idx_pessoa_org").on(table.organizationId),
  index("idx_pessoa_nome").on(table.nome),
]);

// Papéis da pessoa (Cliente pode ser Comprador E Proprietário)
export const pessoaPapel = pgTable("pessoa_papel", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  pessoaId: text("pessoa_id").notNull().references(() => pessoa.id, { onDelete: "cascade" }),
  
  tipo: varchar("tipo").notNull(), // COMPRADOR, PROPRIETARIO, INQUILINO, LOCADOR, FIADOR
  
  // Dados específicos do papel
  dadosEspecificos: jsonb("dados_especificos").$type<{
    // Para COMPRADOR
    preAprovacao?: {
      valor: number;
      banco: string;
      validade: string;
    };
    
    // Para PROPRIETARIO
    percentualPropriedade?: number;
    tipoPropriedade?: 'UNICO' | 'COMPARTILHADO' | 'INVENTARIO';
    
    // Para INQUILINO/LOCADOR
    historicoLocacao?: Array<{
      endereco: string;
      valor: number;
      periodo: { inicio: string; fim: string };
    }>;
  }>(),
  
  // Status
  ativo: boolean("ativo").notNull().default(true),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pessoa_papel_org").on(table.organizationId),
  index("idx_pessoa_papel_pessoa").on(table.pessoaId),
]);

// Imóveis - Multi-tenant (melhoria das properties existentes)
export const imovel = pgTable("imovel", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Proprietário(s)
  proprietarioPrincipalId: text("proprietario_principal_id").references(() => pessoa.id),
  
  // Localização
  endereco: jsonb("endereco").$type<{
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    referencia?: string;
  }>().notNull(),
  
  // Geolocalização
  geo: jsonb("geo").$type<{
    lat: number;
    lng: number;
    precisao?: 'EXATA' | 'APROXIMADA';
  }>(),
  
  // Tipologia
  tipologia: jsonb("tipologia").$type<{
    tipo: 'APARTAMENTO' | 'CASA' | 'COBERTURA' | 'STUDIO' | 'LOFT' | 'TERRENO' | 'SALA_COMERCIAL' | 'LOJA' | 'GALPAO';
    subtipo?: string; // Ex: "Apartamento Garden", "Casa de Condomínio"
    
    // Características
    quartos?: number;
    suites?: number;
    banheiros?: number;
    salas?: number;
    cozinhas?: number;
    varandas?: number;
    garagem?: number;
    
    // Metragens
    areaTotal?: number; // m²
    areaPrivativa?: number; // m²
    areaTerreno?: number; // m² (para casas/terrenos)
    
    // Características especiais
    mobiliado?: boolean;
    petFriendly?: boolean;
    acessibilidade?: boolean;
  }>().notNull(),
  
  // Valores
  preco: decimal("preco", { precision: 15, scale: 2 }).notNull(),
  precoCondominio: decimal("preco_condominio", { precision: 10, scale: 2 }),
  precoIPTU: decimal("preco_iptu", { precision: 10, scale: 2 }),
  
  // Disponibilidade
  finalidade: varchar("finalidade").notNull(), // VENDA, LOCACAO, VENDA_LOCACAO
  disponivel: boolean("disponivel").notNull().default(true),
  motivoIndisponivel: varchar("motivo_indisponivel"), // VENDIDO, ALUGADO, RETIRADO, MANUTENCAO
  
  // Descrição e Marketing
  titulo: varchar("titulo"),
  descricao: text("descricao"),
  descricaoIA: text("descricao_ia"), // Gerada por IA
  pontosFortes: jsonb("pontos_fortes").$type<string[]>(), // ["Localização privilegiada", "Vista para o mar"]
  
  // Mídia
  fotos: jsonb("fotos").$type<Array<{
    url: string;
    descricao?: string;
    ordem: number;
    principal: boolean;
  }>>(),
  videos: jsonb("videos").$type<Array<{
    url: string;
    tipo: 'TOUR_VIRTUAL' | 'VIDEO_PROMOCIONAL';
    descricao?: string;
  }>>(),
  
  // Documentação
  documentos: jsonb("documentos").$type<{
    escritura?: string; // URL
    iptu?: string; // URL
    condominio?: string; // URL
    planta?: string; // URL
    memorial?: string; // URL
    outros?: Array<{ nome: string; url: string }>;
  }>(),
  
  // Status do Pipeline (8 estágios)
  statusCaptacao: varchar("status_captacao").notNull().default('CAPTACAO'), // CAPTACAO, DILIGENCIA, MERCADO, PROPOSTA, CONTRATO, FINANCIAMENTO, INSTRUMENTO, CONCLUIDO
  estagioAtual: integer("estagio_atual").notNull().default(1), // 1-8
  
  // Exclusividade
  exclusividade: jsonb("exclusividade").$type<{
    ativa: boolean;
    dataInicio?: string;
    dataFim?: string;
    condicoesEspeciais?: string;
  }>(),
  
  // Métricas e Analytics
  visualizacoes: integer("visualizacoes").default(0),
  interessados: integer("interessados").default(0),
  visitas: integer("visitas").default(0),
  
  // Auditoria
  createdBy: text("created_by").references(() => user.id),
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_imovel_org").on(table.organizationId),
  index("idx_imovel_status").on(table.statusCaptacao),
  index("idx_imovel_disponivel").on(table.disponivel),
  index("idx_imovel_finalidade").on(table.finalidade),
]);

// Propostas - Multi-tenant (melhoria das proposals existentes)
export const proposta = pgTable("proposta", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Relacionamentos
  imovelId: text("imovel_id").references(() => imovel.id),
  compradorPessoaId: text("comprador_pessoa_id").references(() => pessoa.id),
  proprietarioPessoaId: text("proprietario_pessoa_id").references(() => pessoa.id),
  
  // Termos da proposta
  termos: jsonb("termos").$type<{
    // Valores
    valorProposto: number;
    valorVenal: number;
    valorFinanciamento?: number;
    valorEntrada?: number;
    
    // Prazo e condições
    prazoPagamento?: number; // dias
    condicoesPagamento?: string;
    
    // Financiamento
    financiamento?: {
      banco?: string;
      preAprovado: boolean;
      valorAprovado?: number;
      taxa?: number;
      prazo?: number; // meses
    };
    
    // Condições especiais
    condicoesEspeciais?: string[];
    observacoes?: string;
    
    // Documentação necessária
    documentosNecessarios?: string[];
  }>().notNull(),
  
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  
  // Status e Workflow
  status: varchar("status").notNull().default('PENDENTE'), // PENDENTE, ACEITA, REJEITADA, NEGOCIANDO, CONTRAPROPOSTA, EXPIRADA
  
  // Histórico de negociação
  historicoNegociacao: jsonb("historico_negociacao").$type<Array<{
    data: string;
    tipo: 'PROPOSTA_INICIAL' | 'CONTRAPROPOSTA' | 'ACEITE' | 'REJEICAO' | 'OBSERVACAO';
    valor?: number;
    observacao?: string;
    autor: string; // user.id
  }>>(),
  
  // Documentação
  documentoPdfId: text("documento_pdf_id"), // Referência ao PDF gerado
  documentosAnexos: jsonb("documentos_anexos").$type<Array<{
    nome: string;
    url: string;
    tipo: string;
    uploadedAt: string;
  }>>(),
  
  // Prazos
  prazoValidade: timestamp("prazo_validade"),
  prazoResposta: timestamp("prazo_resposta"),
  
  // Auditoria
  createdBy: text("created_by").references(() => user.id),
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_proposta_org").on(table.organizationId),
  index("idx_proposta_imovel").on(table.imovelId),
  index("idx_proposta_status").on(table.status),
]);

// Acompanhamento de Eventos - Multi-tenant (Timeline Universal)
export const acompanhamentoEvento = pgTable("acompanhamento_evento", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Subject genérico (Polimórfico)
  subjectType: varchar("subject_type").notNull(), // IMOVEL, PROPOSTA, CLIENTE, CONTRATO
  subjectId: text("subject_id").notNull(),
  
  // Etapa e Status
  etapa: varchar("etapa").notNull(), // CAPTACAO, DILIGENCIA, MERCADO, etc.
  status: varchar("status").notNull(), // PENDENTE, EM_ANDAMENTO, CONCLUIDO, BLOQUEADO
  
  // Detalhes do evento
  titulo: varchar("titulo").notNull(),
  descricao: text("descricao"),
  
  // Metadados específicos por tipo
  metadata: jsonb("metadata").$type<{
    // Para IMOVEL
    documentosEnviados?: string[];
    valorAtualizado?: number;
    statusAnterior?: string;
    
    // Para PROPOSTA
    valorProposta?: number;
    contraPropostaValor?: number;
    documentosPendentes?: string[];
    
    // Para CLIENTE
    contatoRealizado?: boolean;
    proximoAgendamento?: string;
    observacoesContato?: string;
    
    // Para CONTRATO
    clausulasAlteradas?: string[];
    assinaturasColetadas?: string[];
    vencimentosPendentes?: string[];
  }>(),
  
  // Quem fez a ação
  actorUserId: text("actor_user_id").references(() => user.id),
  
  // Prazo e lembretes
  prazoLimite: timestamp("prazo_limite"),
  lembrete: jsonb("lembrete").$type<{
    ativo: boolean;
    dataLembrete: string;
    tipoLembrete: 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP';
    mensagem?: string;
  }>(),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_evento_org").on(table.organizationId),
  index("idx_evento_subject").on(table.subjectType, table.subjectId),
  index("idx_evento_status").on(table.status),
  index("idx_evento_etapa").on(table.etapa),
]);

// Embeddings para RAG/Busca Semântica - Multi-tenant
export const embedding = pgTable("embedding", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  
  // Subject do embedding
  subjectType: varchar("subject_type").notNull(), // IMOVEL, PROPOSTA, CLIENTE, ANUNCIO
  subjectId: text("subject_id").notNull(),
  chunkId: varchar("chunk_id"), // Para documentos grandes divididos em chunks
  
  // Conteúdo (SEM PII)
  content: text("content").notNull(), // Conteúdo mascarado/anonimizado
  contentType: varchar("content_type").notNull(), // DESCRICAO, TITULO, CARACTERISTICAS, OBSERVACOES
  
  // Vector embedding (OpenAI text-embedding-3-small = 1536 dimensões)
  // embedding: vector("embedding", { dimensions: 1536 }).notNull(), // Uncomment when pgvector is available
  embedding: text("embedding").notNull(), // Temporário: armazenar como JSON string
  
  // Metadados para filtragem
  metadata: jsonb("metadata").$type<{
    // Para IMOVEL
    tipo?: string;
    bairro?: string;
    cidade?: string;
    faixaPreco?: string; // "0-500k", "500k-1M", etc.
    finalidade?: string; // VENDA, LOCACAO
    
    // Para PROPOSTA
    statusProposta?: string;
    faixaValor?: string;
    
    // Para busca
    tags?: string[];
    categoria?: string;
  }>(),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_embedding_org").on(table.organizationId),
  index("idx_embedding_subject").on(table.subjectType, table.subjectId),
  index("idx_embedding_type").on(table.contentType),
  // Índice para busca por similaridade de vetor
  index("idx_embedding_vector").using("ivfflat", table.embedding),
]);

// Relations para as novas tabelas
export const organizationRelations = relations(organization, ({ one, many }) => ({
  owner: one(user, {
    fields: [organization.ownerUserId],
    references: [user.id],
  }),
  memberships: many(membership),
  pessoas: many(pessoa),
  imoveis: many(imovel),
  propostas: many(proposta),
  eventos: many(acompanhamentoEvento),
  embeddings: many(embedding),
}));

export const membershipRelations = relations(membership, ({ one }) => ({
  organization: one(organization, {
    fields: [membership.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [membership.userId],
    references: [user.id],
  }),
  supervisor: one(user, {
    fields: [membership.supervisorId],
    references: [user.id],
  }),
}));

export const pessoaRelations = relations(pessoa, ({ one, many }) => ({
  organization: one(organization, {
    fields: [pessoa.organizationId],
    references: [organization.id],
  }),
  papeis: many(pessoaPapel),
  imoveisProprietario: many(imovel, {
    relationName: "proprietario",
  }),
  propostasComprador: many(proposta, {
    relationName: "comprador",
  }),
  propostasProprietario: many(proposta, {
    relationName: "proprietario",
  }),
}));

export const imovelRelations = relations(imovel, ({ one, many }) => ({
  organization: one(organization, {
    fields: [imovel.organizationId],
    references: [organization.id],
  }),
  proprietarioPrincipal: one(pessoa, {
    fields: [imovel.proprietarioPrincipalId],
    references: [pessoa.id],
    relationName: "proprietario",
  }),
  propostas: many(proposta),
  eventos: many(acompanhamentoEvento),
}));

export const propostaRelations = relations(proposta, ({ one, many }) => ({
  organization: one(organization, {
    fields: [proposta.organizationId],
    references: [organization.id],
  }),
  imovel: one(imovel, {
    fields: [proposta.imovelId],
    references: [imovel.id],
  }),
  comprador: one(pessoa, {
    fields: [proposta.compradorPessoaId],
    references: [pessoa.id],
    relationName: "comprador",
  }),
  proprietario: one(pessoa, {
    fields: [proposta.proprietarioPessoaId],
    references: [pessoa.id],
    relationName: "proprietario",
  }),
  eventos: many(acompanhamentoEvento),
}));

// Schema validation para as novas tabelas
export const insertOrganizationSchema = createInsertSchema(organization);
export const insertMembershipSchema = createInsertSchema(membership);
export const insertPessoaSchema = createInsertSchema(pessoa);
export const insertImovelSchema = createInsertSchema(imovel);
export const insertPropostaSchema = createInsertSchema(proposta);
export const insertEventoSchema = createInsertSchema(acompanhamentoEvento);
export const insertEmbeddingSchema = createInsertSchema(embedding);

export type Organization = typeof organization.$inferSelect;
export type Membership = typeof membership.$inferSelect;
export type Pessoa = typeof pessoa.$inferSelect;
export type Imovel = typeof imovel.$inferSelect;
export type Proposta = typeof proposta.$inferSelect;
export type AcompanhamentoEvento = typeof acompanhamentoEvento.$inferSelect;

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

// Validação de CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se não são todos iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Calcula primeiro dígito verificador
  let sum = 0;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Calcula segundo dígito verificador
  sum = 0;
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica se os dígitos calculados conferem
  return firstDigit === parseInt(cleanCNPJ.charAt(12)) && 
         secondDigit === parseInt(cleanCNPJ.charAt(13));
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

// ======================================
// COMPREHENSIVE NOTIFICATION SYSTEM
// ======================================

// Enhanced Notifications table - Core notification system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // User receiving the notification
  
  // Classification
  type: varchar("type").notNull(), // 'info', 'warning', 'error', 'success', 'urgent'
  category: varchar("category").notNull(), // 'property', 'client', 'document', 'system', 'reminder', 'pendency'
  subcategory: varchar("subcategory"), // More specific categorization
  
  // Content
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  shortMessage: varchar("short_message", { length: 100 }), // For mobile/compact views
  
  // Associations
  relatedEntityType: varchar("related_entity_type"), // 'property', 'client', 'note', 'document'
  relatedEntityId: integer("related_id"), // ID of the related entity
  secondaryEntityType: varchar("secondary_entity_type"), // For complex relationships
  secondaryEntityId: integer("secondary_entity_id"),
  
  // Actions
  actionUrl: varchar("action_url", { length: 500 }), // Deep link to resolve/view
  actionLabel: varchar("action_label", { length: 50 }), // "View Property", "Complete Task"
  secondaryActionUrl: varchar("secondary_action_url", { length: 500 }),
  secondaryActionLabel: varchar("secondary_action_label", { length: 50 }),
  
  // Status and Priority
  priority: integer("priority").notNull().default(3), // 1=Critical, 2=High, 3=Normal, 4=Low, 5=Info
  status: varchar("status").notNull().default("unread"), // 'unread', 'read', 'dismissed', 'archived'
  isRead: boolean("is_read").default(false),
  isPinned: boolean("is_pinned").default(false),
  isArchived: boolean("is_archived").default(false),
  
  // Scheduling and Expiry
  scheduledFor: timestamp("scheduled_for"), // For delayed notifications
  expiresAt: timestamp("expires_at"), // Auto-expire notifications
  
  // Rich content and metadata
  imageUrl: varchar("image_url", { length: 500 }), // Optional image
  iconType: varchar("icon_type", { length: 50 }), // Icon identifier for frontend
  metadata: jsonb("metadata"), // Extensible data (properties, settings, etc.)
  
  // Delivery tracking
  deliveryChannels: varchar("delivery_channels", { length: 100 }), // 'in_app,email,push'
  deliveredAt: timestamp("delivered_at"),
  deliveryStatus: varchar("delivery_status").default("pending"), // 'pending', 'delivered', 'failed'
  
  // User interaction
  readAt: timestamp("read_at"),
  dismissedAt: timestamp("dismissed_at"),
  lastInteractionAt: timestamp("last_interaction_at"),
  
  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_status_idx").on(table.status),
  index("notifications_category_idx").on(table.category),
  index("notifications_priority_idx").on(table.priority),
  index("notifications_created_at_idx").on(table.createdAt),
  index("notifications_unread_idx").on(table.userId, table.isRead),
  index("notifications_entity_idx").on(table.relatedEntityType, table.relatedEntityId),
  index("notifications_scheduled_idx").on(table.scheduledFor),
  index("notifications_expires_idx").on(table.expiresAt),
]);

// Notification Templates - Reusable notification templates
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  templateKey: varchar("template_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category").notNull(),
  
  // Template content with placeholders
  titleTemplate: varchar("title_template", { length: 255 }).notNull(),
  messageTemplate: text("message_template").notNull(),
  shortMessageTemplate: varchar("short_message_template", { length: 100 }),
  
  // Default properties
  defaultType: varchar("default_type").notNull().default("info"),
  defaultPriority: integer("default_priority").notNull().default(3),
  defaultIconType: varchar("default_icon_type", { length: 50 }),
  
  // Behavior
  isActive: boolean("is_active").notNull().default(true),
  autoExpireDays: integer("auto_expire_days"), // Auto-expire after X days
  allowDuplicates: boolean("allow_duplicates").default(true),
  
  // Metadata and configuration
  triggerConditions: jsonb("trigger_conditions"), // When to trigger this template
  placeholderDefinitions: jsonb("placeholder_definitions"), // Definition of placeholders
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_templates_key_idx").on(table.templateKey),
  index("notification_templates_category_idx").on(table.category),
  index("notification_templates_active_idx").on(table.isActive),
]);

// Notification Rules - Automated notification generation rules
export const notificationRules = pgTable("notification_rules", {
  id: serial("id").primaryKey(),
  ruleKey: varchar("rule_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Rule configuration
  triggerEvents: varchar("trigger_events", { length: 500 }).notNull(), // Comma-separated events
  entityTypes: varchar("entity_types", { length: 200 }), // Which entities trigger this rule
  conditions: jsonb("conditions"), // Complex conditions for triggering
  
  // Template and target
  templateId: integer("template_id").references(() => notificationTemplates.id),
  targetUsers: varchar("target_users", { length: 100 }), // 'owner', 'assigned', 'all_users', 'specific'
  specificUserIds: text("specific_user_ids"), // Comma-separated user IDs for 'specific'
  
  // Scheduling and throttling
  delayMinutes: integer("delay_minutes").default(0), // Delay before sending
  throttleMinutes: integer("throttle_minutes"), // Minimum time between same notifications
  maxNotificationsPerDay: integer("max_notifications_per_day"), // Rate limiting
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_rules_key_idx").on(table.ruleKey),
  index("notification_rules_active_idx").on(table.isActive),
  index("notification_rules_events_idx").on(table.triggerEvents),
]);

// Notification Subscriptions - User preferences for notification types
export const notificationSubscriptions = pgTable("notification_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Subscription details
  category: varchar("category").notNull(),
  subcategory: varchar("subcategory"),
  entityType: varchar("entity_type"), // Subscribe to specific entity types
  entityId: integer("entity_id"), // Subscribe to specific entity instances
  
  // Channel preferences
  enableInApp: boolean("enable_in_app").default(true),
  enableEmail: boolean("enable_email").default(false),
  enablePush: boolean("enable_push").default(false),
  enableSms: boolean("enable_sms").default(false),
  
  // Frequency and timing
  frequency: varchar("frequency").default("immediate"), // 'immediate', 'daily', 'weekly', 'never'
  quietHoursStart: varchar("quiet_hours_start"), // "22:00"
  quietHoursEnd: varchar("quiet_hours_end"), // "08:00"
  timezone: varchar("timezone").default("America/Sao_Paulo"),
  
  // Priority filtering
  minPriority: integer("min_priority").default(1), // Only notifications >= this priority
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_subscriptions_user_idx").on(table.userId),
  index("notification_subscriptions_category_idx").on(table.category),
  index("notification_subscriptions_entity_idx").on(table.entityType, table.entityId),
]);

// Notification Delivery Log - Track delivery attempts and results
export const notificationDeliveryLog = pgTable("notification_delivery_log", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  
  // Delivery details
  channel: varchar("channel").notNull(), // 'in_app', 'email', 'push', 'sms'
  recipientId: text("recipient_id").notNull(), // User ID or email/phone for external channels
  
  // Status and timing
  status: varchar("status").notNull(), // 'pending', 'sent', 'delivered', 'failed', 'bounced'
  attemptNumber: integer("attempt_number").default(1),
  deliveredAt: timestamp("delivered_at"),
  failureReason: text("failure_reason"),
  
  // External service tracking
  externalId: varchar("external_id", { length: 255 }), // ID from email/SMS service
  externalStatus: varchar("external_status", { length: 100 }),
  externalResponse: jsonb("external_response"),
  
  // Retry configuration
  nextRetryAt: timestamp("next_retry_at"),
  maxRetries: integer("max_retries").default(3),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_delivery_notification_idx").on(table.notificationId),
  index("notification_delivery_channel_idx").on(table.channel),
  index("notification_delivery_status_idx").on(table.status),
  index("notification_delivery_retry_idx").on(table.nextRetryAt),
]);

// Notification Analytics - Track notification effectiveness
export const notificationAnalytics = pgTable("notification_analytics", {
  id: serial("id").primaryKey(),
  
  // Time period
  date: date("date").notNull(),
  hour: integer("hour"), // For hourly breakdowns
  
  // Categorization
  category: varchar("category").notNull(),
  subcategory: varchar("subcategory"),
  type: varchar("type").notNull(),
  channel: varchar("channel"), // Specific channel analytics
  
  // Metrics
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalRead: integer("total_read").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalDismissed: integer("total_dismissed").default(0),
  
  // Performance metrics
  avgDeliveryTime: integer("avg_delivery_time"), // Average delivery time in seconds
  avgReadTime: integer("avg_read_time"), // Average time to read in seconds
  
  // User engagement
  uniqueUsers: integer("unique_users").default(0),
  returningUsers: integer("returning_users").default(0),
  
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("notification_analytics_date_idx").on(table.date),
  index("notification_analytics_category_idx").on(table.category),
  index("notification_analytics_channel_idx").on(table.channel),
]);

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

// ======================================
// PUSH NOTIFICATIONS TABLES
// ======================================

// Push Subscriptions - Store user push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  expirationTime: timestamp("expiration_time"),
  isActive: boolean("is_active").notNull().default(true),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_push_subscriptions_user").on(table.userId),
  index("idx_push_subscriptions_active").on(table.isActive),
  index("idx_push_subscriptions_endpoint").on(table.endpoint),
]);

// ======================================
// CLIENT DOCUMENTS TABLE
// ======================================

// Client Documents - Store client document files
export const clientDocuments = pgTable("client_documents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(), // Generated filename for storage
  originalName: varchar("original_name").notNull(), // Original filename from user
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: varchar("mime_type").notNull(), // MIME type of the file
  storageUrl: text("storage_url").notNull(), // URL to the stored file (Supabase Storage)
  uploadedBy: text("uploaded_by").notNull(), // User ID who uploaded
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_client_documents_client").on(table.clientId),
  index("idx_client_documents_uploaded_by").on(table.uploadedBy),
  index("idx_client_documents_uploaded_at").on(table.uploadedAt),
]);

// ======================================
// MASTER ADMIN SYSTEM
// ======================================

// Master Admin Sessions - Separate authentication for super admins
export const masterAdminSessions = pgTable("master_admin_sessions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: text("admin_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("idx_master_session_admin").on(table.adminId),
  index("idx_master_session_token").on(table.token),
  index("idx_master_session_expires").on(table.expiresAt),
]);

// Admin Activity Logs - Audit trail for administrative actions
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: serial("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  action: varchar("action").notNull(), // CREATE_USER, UPDATE_USER, DELETE_USER, LOGIN, LOGOUT
  targetType: varchar("target_type"), // USER, ORGANIZATION, SYSTEM
  targetId: text("target_id"), // ID of the affected resource
  targetDetails: jsonb("target_details").$type<{
    email?: string;
    name?: string;
    userType?: string;
    organizationName?: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  metadata: jsonb("metadata").$type<{
    reason?: string; // Reason for the action
    duration?: number; // For session-related actions
    errorDetails?: string; // If action failed
    additionalData?: Record<string, any>;
  }>(),
  status: varchar("status").default('SUCCESS'), // SUCCESS, FAILED, PARTIAL
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_admin_logs_admin").on(table.adminId),
  index("idx_admin_logs_action").on(table.action),
  index("idx_admin_logs_target").on(table.targetType, table.targetId),
  index("idx_admin_logs_created").on(table.createdAt),
  index("idx_admin_logs_status").on(table.status),
]);

// User Creation Requests - Track B2B user creation process
export const userCreationRequests = pgTable("user_creation_requests", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: text("admin_id").notNull(),
  requestData: jsonb("request_data").$type<{
    name: string;
    email: string;
    userType: 'CORRETOR_AUTONOMO' | 'IMOBILIARIA';
    organizationName?: string;
    creci?: string;
    cnpj?: string;
    cpf?: string;
    phone?: string;
    address?: string;
    notes?: string;
  }>().notNull(),
  status: varchar("status").default('PENDING'), // PENDING, APPROVED, REJECTED, COMPLETED, FAILED
  createdUserId: text("created_user_id"), // ID of the created user (when completed)
  approvedBy: text("approved_by"), // Admin who approved (if applicable)
  rejectedBy: text("rejected_by"), // Admin who rejected (if applicable)
  rejectionReason: text("rejection_reason"),
  processingNotes: text("processing_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_requests_admin").on(table.adminId),
  index("idx_user_requests_status").on(table.status),
  index("idx_user_requests_created").on(table.createdAt),
  index("idx_user_requests_user").on(table.createdUserId),
]);

// Master Admin Configuration - System settings and configurations
export const masterAdminConfig = pgTable("master_admin_config", {
  id: serial("id").primaryKey(),
  configKey: varchar("config_key").notNull().unique(),
  configValue: jsonb("config_value").$type<{
    // User Creation Settings
    requireApproval?: boolean;
    defaultPermissions?: string[];
    maxUsersPerOrganization?: number;
    
    // Security Settings
    sessionTimeout?: number; // minutes
    requireTwoFactor?: boolean;
    allowedIpRanges?: string[];
    
    // Notification Settings
    emailNotifications?: boolean;
    notificationChannels?: string[];
    
    // System Settings
    maintenanceMode?: boolean;
    maxLoginAttempts?: number;
    lockoutDuration?: number; // minutes
    
    // Feature Flags
    enableFeatures?: string[];
    disableFeatures?: string[];
    
    // Custom settings
    [key: string]: any;
  }>().notNull(),
  description: text("description"),
  category: varchar("category").default('GENERAL'), // GENERAL, SECURITY, USERS, NOTIFICATIONS, FEATURES
  isEditable: boolean("is_editable").default(true),
  lastModifiedBy: text("last_modified_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_admin_config_key").on(table.configKey),
  index("idx_admin_config_category").on(table.category),
]);

// ======================================
// MASTER ADMIN VALIDATION SCHEMAS
// ======================================

// Master Admin Login Schema
export const masterAdminLoginSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

// B2B User Creation Schema
export const createB2BUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  userType: z.enum(['CORRETOR_AUTONOMO', 'IMOBILIARIA'], {
    required_error: "Tipo de usuário é obrigatório",
  }),
  organizationName: z.string().optional(),
  creci: z.string().optional(),
  cnpj: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCNPJ(val);
  }, "CNPJ inválido"),
  cpf: z.string().optional().refine((val) => {
    if (!val) return true;
    return validateCPF(val);
  }, "CPF inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Validate required fields based on user type
  if (data.userType === 'CORRETOR_AUTONOMO') {
    return data.creci && data.cpf;
  }
  if (data.userType === 'IMOBILIARIA') {
    return data.organizationName && data.cnpj;
  }
  return true;
}, {
  message: "Campos obrigatórios não preenchidos conforme tipo de usuário",
  path: ["userType"],
});

// Admin Activity Log Schema
export const createAdminLogSchema = z.object({
  adminId: z.string(),
  action: z.string(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  targetDetails: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'PARTIAL']).default('SUCCESS'),
});

// ======================================
// MASTER ADMIN TYPES
// ======================================

export type MasterAdminSession = typeof masterAdminSessions.$inferSelect;
export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type UserCreationRequest = typeof userCreationRequests.$inferSelect;
export type MasterAdminConfig = typeof masterAdminConfig.$inferSelect;

export type CreateB2BUser = z.infer<typeof createB2BUserSchema>;
export type MasterAdminLogin = z.infer<typeof masterAdminLoginSchema>;
export type CreateAdminLog = z.infer<typeof createAdminLogSchema>;

// TIPOS PARA AUDITORIA E NOTIFICAÇÕES
export type CreateAuditLog = z.infer<typeof createAuditLogSchema>;
export type CreateScheduledNotification = z.infer<typeof createScheduledNotificationSchema>;
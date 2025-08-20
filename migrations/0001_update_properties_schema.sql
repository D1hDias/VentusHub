-- Migration: 0001_update_properties_schema.sql
-- Atualiza a estrutura para suportar múltiplos proprietários e campos de endereço separados

-- 1. Criar tabela para múltiplos proprietários
CREATE TABLE IF NOT EXISTS "property_owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"full_name" varchar NOT NULL,
	"cpf" varchar NOT NULL,
	"rg" varchar NOT NULL,
	"birth_date" date NOT NULL,
	"marital_status" varchar NOT NULL,
	"father_name" varchar NOT NULL,
	"mother_name" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"email" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 2. Adicionar campos de endereço separados na tabela properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "street" varchar;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "number" varchar;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "complement" varchar;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "neighborhood" varchar;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "city" varchar;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "state" varchar;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "cep" varchar;

-- 3. Renomear campo IPTU para matrícula
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "registration_number" varchar;

-- 4. Adicionar foreign key para property_owners
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_property_id_properties_id_fk" 
FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE cascade ON UPDATE no action;

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS "idx_property_owners_property_id" ON "property_owners" ("property_id");
CREATE INDEX IF NOT EXISTS "idx_property_owners_cpf" ON "property_owners" ("cpf");

-- 6. Migrar dados existentes (se houver)
-- Mover proprietários existentes para a nova tabela
INSERT INTO "property_owners" ("property_id", "full_name", "cpf", "rg", "birth_date", "marital_status", "father_name", "mother_name", "phone", "email")
SELECT 
    id as property_id,
    COALESCE("owner_name", 'Nome não informado') as full_name,
    COALESCE("owner_cpf", '000.000.000-00') as cpf,
    COALESCE("owner_rg", 'RG não informado') as rg,
    COALESCE(CURRENT_DATE) as birth_date,
    'Não informado' as marital_status,
    'Não informado' as father_name,
    'Não informado' as mother_name,
    COALESCE("owner_phone", '(11) 00000-0000') as phone,
    'nao-informado@email.com' as email
FROM "properties" 
WHERE "owner_name" IS NOT NULL AND "owner_name" != '';

-- 7. Migrar endereços existentes
-- Separar endereço existente nos novos campos (básico)
UPDATE "properties" SET 
    "street" = COALESCE(split_part("address", ',', 1), "address"),
    "number" = 'S/N',
    "complement" = '',
    "neighborhood" = 'Não informado',
    "city" = 'Não informado',
    "state" = 'SP',
    "cep" = '00000-000'
WHERE "address" IS NOT NULL;

-- 8. Migrar número da matrícula
UPDATE "properties" SET "registration_number" = COALESCE("iptu_number", 'Não informado')
WHERE "iptu_number" IS NOT NULL;
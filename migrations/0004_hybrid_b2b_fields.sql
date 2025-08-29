-- Migration: Refactor B2B User Profiles para campos híbridos
-- Data: 2025-08-26
-- Descrição: Unifica campos nome/razão social e CPF/CNPJ para simplificar interface

-- Adicionar novos campos híbridos
ALTER TABLE b2b_user_profiles 
ADD COLUMN business_name text,
ADD COLUMN document text,
ADD COLUMN trade_name text;

-- Migrar dados existentes
UPDATE b2b_user_profiles SET 
  business_name = COALESCE(organization_name, (SELECT name FROM "user" WHERE "user".id = b2b_user_profiles.user_id)),
  document = COALESCE(cnpj, cpf),
  trade_name = CASE 
    WHEN user_type = 'IMOBILIARIA' THEN organization_name 
    ELSE NULL 
  END
WHERE business_name IS NULL;

-- Tornar campos híbridos obrigatórios após migração
ALTER TABLE b2b_user_profiles 
ALTER COLUMN business_name SET NOT NULL,
ALTER COLUMN document SET NOT NULL;

-- Remover campos antigos (comentado para segurança - descomentar após validação)
-- ALTER TABLE b2b_user_profiles 
-- DROP COLUMN organization_name,
-- DROP COLUMN organization_id,
-- DROP COLUMN cpf,
-- DROP COLUMN cnpj;

-- Adicionar índices para otimização
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_document ON b2b_user_profiles(document);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_business_name ON b2b_user_profiles(business_name);

-- Comentário sobre a estrutura híbrida
COMMENT ON COLUMN b2b_user_profiles.business_name IS 'Campo híbrido: Nome Completo (PF) ou Razão Social (PJ)';
COMMENT ON COLUMN b2b_user_profiles.document IS 'Campo híbrido: CPF (PF) ou CNPJ (PJ) - sem máscara';
COMMENT ON COLUMN b2b_user_profiles.creci IS 'CRECI - Universal para PF e PJ';
COMMENT ON COLUMN b2b_user_profiles.trade_name IS 'Nome Fantasia - Opcional, apenas para PJ';
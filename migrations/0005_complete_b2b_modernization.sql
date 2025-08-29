-- Migration: Modernizar completamente tabela B2B User Profiles
-- Data: 2025-08-26
-- Descrição: Adiciona campos híbridos e endereço modernos

-- Adicionar campos híbridos (businessName, document)
ALTER TABLE b2b_user_profiles 
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS document text,
ADD COLUMN IF NOT EXISTS trade_name text;

-- Adicionar campos de endereço modernos
ALTER TABLE b2b_user_profiles 
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Migrar dados existentes dos campos antigos para os novos (se existirem dados)
UPDATE b2b_user_profiles SET 
  business_name = COALESCE(organization_name, cpf, cnpj),
  document = COALESCE(cnpj, cpf),
  trade_name = CASE 
    WHEN user_type = 'IMOBILIARIA' THEN organization_name 
    ELSE NULL 
  END
WHERE business_name IS NULL AND (organization_name IS NOT NULL OR cpf IS NOT NULL OR cnpj IS NOT NULL);

-- Adicionar índices para otimização
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_business_name ON b2b_user_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_document ON b2b_user_profiles(document);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_cep ON b2b_user_profiles(cep);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_city ON b2b_user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_state ON b2b_user_profiles(state);

-- Comentários sobre as colunas
COMMENT ON COLUMN b2b_user_profiles.business_name IS 'Campo híbrido: Nome Completo (PF) ou Razão Social (PJ)';
COMMENT ON COLUMN b2b_user_profiles.document IS 'Campo híbrido: CPF (PF) ou CNPJ (PJ) - sem máscara';
COMMENT ON COLUMN b2b_user_profiles.trade_name IS 'Nome Fantasia - Opcional, apenas para PJ';
COMMENT ON COLUMN b2b_user_profiles.cep IS 'CEP - Código de Endereçamento Postal (formato: 00000-000)';
COMMENT ON COLUMN b2b_user_profiles.street IS 'Logradouro - Nome da rua, avenida, estrada, etc.';
COMMENT ON COLUMN b2b_user_profiles.number IS 'Número do endereço';
COMMENT ON COLUMN b2b_user_profiles.complement IS 'Complemento - Apartamento, sala, bloco, etc. (opcional)';
COMMENT ON COLUMN b2b_user_profiles.neighborhood IS 'Bairro';
COMMENT ON COLUMN b2b_user_profiles.city IS 'Cidade';
COMMENT ON COLUMN b2b_user_profiles.state IS 'UF - Unidade Federativa (2 caracteres)';

-- Manter campos antigos por compatibilidade (podem ser removidos futuramente)
COMMENT ON COLUMN b2b_user_profiles.organization_name IS 'DEPRECATED - Usar business_name';
COMMENT ON COLUMN b2b_user_profiles.cpf IS 'DEPRECATED - Usar document';
COMMENT ON COLUMN b2b_user_profiles.cnpj IS 'DEPRECATED - Usar document';
COMMENT ON COLUMN b2b_user_profiles.address IS 'DEPRECATED - Usar campos de endereço específicos';
-- Migration Manual - Apenas campos B2B necessários
-- Aplicar via SQL para evitar conflitos com Drizzle

-- Adicionar apenas os campos necessários para B2B User Profiles
ALTER TABLE b2b_user_profiles 
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS document text,
ADD COLUMN IF NOT EXISTS trade_name text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Adicionar índices básicos
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_business_name ON b2b_user_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_document ON b2b_user_profiles(document);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_cep ON b2b_user_profiles(cep);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_city ON b2b_user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_b2b_user_profiles_state ON b2b_user_profiles(state);

-- Comentários explicativos
COMMENT ON COLUMN b2b_user_profiles.business_name IS 'Campo híbrido: Nome Completo (PF) ou Razão Social (PJ)';
COMMENT ON COLUMN b2b_user_profiles.document IS 'Campo híbrido: CPF (PF) ou CNPJ (PJ) - sem máscara';
COMMENT ON COLUMN b2b_user_profiles.trade_name IS 'Nome Fantasia - Opcional, apenas para PJ';
COMMENT ON COLUMN b2b_user_profiles.cep IS 'CEP - Código de Endereçamento Postal';
COMMENT ON COLUMN b2b_user_profiles.street IS 'Logradouro';
COMMENT ON COLUMN b2b_user_profiles.number IS 'Número do endereço';
COMMENT ON COLUMN b2b_user_profiles.complement IS 'Complemento - Opcional';
COMMENT ON COLUMN b2b_user_profiles.neighborhood IS 'Bairro';
COMMENT ON COLUMN b2b_user_profiles.city IS 'Cidade';
COMMENT ON COLUMN b2b_user_profiles.state IS 'UF - Unidade Federativa';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'b2b_user_profiles' 
AND column_name IN ('business_name', 'document', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'trade_name')
ORDER BY column_name;
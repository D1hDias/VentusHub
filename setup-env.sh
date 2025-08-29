#!/bin/bash

# ==================================================
# VentusHub - Configuração de Variáveis de Ambiente
# Execute este script no servidor para configurar o .env
# ==================================================

echo "🔧 Configurando variáveis de ambiente..."

# Criar arquivo .env com suas configurações
cat > .env << 'EOF'
# VentusHub - Produção
NODE_ENV=production
PORT=3000

# Banco de dados Neon
DATABASE_URL=postgresql://neondb_owner:npg_lR1EdPFtIHp3@ep-winter-frog-acjwvno9-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Segurança - Sessões & JWT
SESSION_SECRET=042d81233780d9acd6b8f6f04577e0b5
JWT_SECRET=9271e28169900e8c0246937d9a7ffd6d

# Supabase (Armazenamento de arquivos)
VITE_SUPABASE_URL=https://hocaexectpwpapnrmhxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvY2FleGVjdHB3cGFwbnJtaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDg4NjksImV4cCI6MjA2NjI4NDg2OX0.ereGpycsNRxhhK1Pq4a6x5E0VAIzKSjQfTMfWU_Y-iU

# APIs de IA
OPENROUTER_API_KEY=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
GEMINI_API_KEY=AIzaSyBZ9scOwZoUBejV_V-bhSNgKd0wQT17fNw

# API Externa
VITE_REGISTRO_IMOVEIS_API_KEY=87|KtbDAR2FtvLIHtVc0LVi8YPIXsDxz882T1HJNEA2
EOF

echo "✅ Arquivo .env criado com sucesso!"
echo "🔒 Definindo permissões seguras..."

chmod 600 .env
chown $USER:$USER .env

echo "✅ Variáveis de ambiente configuradas!"
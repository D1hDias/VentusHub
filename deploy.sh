#!/bin/bash

# Script de Deploy Automático VentusHub
# Uso: ./deploy.sh "mensagem do commit"

set -e

echo "🚀 Iniciando deploy do VentusHub..."

# Verificar se mensagem foi fornecida
if [ -z "$1" ]; then
    echo "❌ Erro: Forneça uma mensagem de commit"
    echo "Uso: ./deploy.sh \"sua mensagem aqui\""
    exit 1
fi

COMMIT_MSG="$1"
VPS_HOST="root@31.97.245.82"
VPS_PATH="/var/www/VentusHub"

echo "📝 Commit: $COMMIT_MSG"

# 1. Adicionar todas as mudanças
echo "📦 Adicionando arquivos ao Git..."
git add .

# 2. Verificar se há mudanças
if git diff --cached --quiet; then
    echo "ℹ️  Nenhuma mudança para commitar"
else
    # 3. Fazer commit
    echo "💾 Fazendo commit..."
    git commit -m "$COMMIT_MSG"
fi

# 4. Push para GitHub
echo "⬆️  Enviando para GitHub..."
git push origin main

# 5. Deploy no VPS
echo "🌐 Fazendo deploy no VPS..."
ssh $VPS_HOST "cd $VPS_PATH && \
    echo '📥 Puxando mudanças do GitHub...' && \
    git pull origin main && \
    echo '🐳 Rebuilding containers...' && \
    docker-compose build --no-cache ventushub && \
    echo '🔄 Reiniciando aplicação...' && \
    docker-compose up -d && \
    echo '✅ Deploy concluído!' && \
    docker ps --format 'table {{.Names}}\t{{.Status}}' | grep ventushub"

echo ""
echo "🎉 Deploy completo!"
echo "🌐 Acesse: https://ventushub.com.br"
echo "📊 IP: http://31.97.245.82"
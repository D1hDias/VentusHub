#!/bin/bash

echo "🚀 Iniciando deploy do VentusHub..."

# Verificar se está na branch main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Você deve estar na branch main para fazer deploy"
    exit 1
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Há mudanças não commitadas. Commit antes do deploy."
    exit 1
fi

echo "✅ Verificações iniciais passaram"

# Build da aplicação
echo "🔨 Executando build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falhou"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# Verificar se .env.production existe
if [ ! -f ".env.production" ]; then
    echo "❌ Arquivo .env.production não encontrado"
    exit 1
fi

echo "✅ Configurações de produção verificadas"

# Build do Docker
echo "🐳 Construindo imagem Docker..."
npm run docker:build

if [ $? -ne 0 ]; then
    echo "❌ Build do Docker falhou"
    exit 1
fi

echo "✅ Imagem Docker criada com sucesso"

echo "🎉 Deploy preparado! Execute 'npm run docker:run' para iniciar o container"
echo "📝 Para deploy em produção, use a imagem 'ventushub' criada"
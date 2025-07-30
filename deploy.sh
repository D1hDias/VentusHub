#!/bin/bash

echo "🚀 Iniciando deploy do VentusHub..."

# Verificar se há mudanças para commitar
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Commitando mudanças locais..."
    git add .
    read -p "Digite a mensagem do commit: " commit_message
    git commit -m "$commit_message"
fi

# Push para GitHub
echo "📤 Enviando para GitHub..."
git push origin main

# Deploy no servidor
echo "🌐 Fazendo deploy no servidor..."
ssh root@31.97.245.82 << 'EOF'
    cd /var/www/VentusHub
    echo "📥 Baixando atualizações..."
    git pull origin main
    echo "🔄 Reconstruindo containers..."
    docker-compose down
    docker-compose up -d --build
    echo "✅ Deploy concluído!"
    docker-compose ps
EOF

echo "🎉 Deploy finalizado com sucesso!"
echo "🌐 Aplicação disponível em: http://31.97.245.82:3000"
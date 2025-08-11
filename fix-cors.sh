#!/bin/bash

echo "🔧 Aplicando correção de CORS..."

# Reconstruir e reiniciar a aplicação
docker-compose -f docker-compose.production.yml up --build -d

echo "⏳ Aguardando aplicação iniciar..."
sleep 15

echo "🧪 Testando API de autenticação..."
curl -X POST http://ventushub.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://ventushub.com.br" \
  -d '{"email":"test@example.com","password":"test"}' \
  -v

echo ""
echo "✅ Correção aplicada!"
echo "🌐 Teste agora no navegador: https://ventushub.com.br"
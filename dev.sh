#!/bin/bash

  # Script de desenvolvimento local VentusHub
  # Desenvolvedor: D1hDias (diego_dias@live.com)
  # Uso: ./dev.sh

  echo "� Iniciando ambiente de desenvolvimento VentusHub..."

  # Instalar dependências se necessário
  if [ ! -d "node_modules" ]; then
      echo "� Instalando dependências..."
      npm install
  fi

  # Verificar se .env existe
  if [ ! -f ".env" ]; then
      echo "⚠️  Arquivo .env não encontrado!"
      echo "� Copie .env.example para .env e configure as variáveis"
      cp .env.example .env
      echo "✅ .env criado a partir do .env.example"
  fi

  # Iniciar servidor de desenvolvimento
  echo "� Iniciando servidor de desenvolvimento..."
  npm run dev

#!/bin/bash

  # Script de desenvolvimento local VentusHub
  # Desenvolvedor: D1hDias (diego_dias@live.com)
  # Uso: ./dev.sh

  echo "Ì¥ß Iniciando ambiente de desenvolvimento VentusHub..."

  # Instalar depend√™ncias se necess√°rio
  if [ ! -d "node_modules" ]; then
      echo "Ì≥¶ Instalando depend√™ncias..."
      npm install
  fi

  # Verificar se .env existe
  if [ ! -f ".env" ]; then
      echo "‚ö†Ô∏è  Arquivo .env n√£o encontrado!"
      echo "Ì≥ã Copie .env.example para .env e configure as vari√°veis"
      cp .env.example .env
      echo "‚úÖ .env criado a partir do .env.example"
  fi

  # Iniciar servidor de desenvolvimento
  echo "Ì∫Ä Iniciando servidor de desenvolvimento..."
  npm run dev

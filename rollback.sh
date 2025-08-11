#!/bin/bash

# ==================================================
# VentusHub - Rollback em Caso de Problema
# Execute este script para voltar ao estado anterior
# ==================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PROJECT_DIR="/var/www/ventushub"
BACKUP_DIR="/var/backups/ventushub"

# Funções auxiliares
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCESSO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error() { echo -e "${RED}[ERRO]${NC} $1"; }

echo "🔄 VentusHub - Rollback"
echo "======================"

# 1. Listar backups disponíveis
log_info "Backups disponíveis:"
sudo ls -lt $BACKUP_DIR/ | head -5

echo
read -p "Digite o nome do backup para restaurar (ex: ventushub_pre_deploy_20250808_123000): " BACKUP_NAME

if [[ ! -d "$BACKUP_DIR/$BACKUP_NAME" ]]; then
    log_error "Backup não encontrado: $BACKUP_DIR/$BACKUP_NAME"
    exit 1
fi

# 2. Parar aplicação atual
log_info "Parando aplicação atual..."
cd $PROJECT_DIR
docker-compose -f docker-compose.production.yml down

# 3. Fazer backup do estado atual (antes do rollback)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
log_info "Fazendo backup do estado atual antes do rollback..."
sudo cp -r $PROJECT_DIR $BACKUP_DIR/ventushub_before_rollback_$TIMESTAMP

# 4. Restaurar backup
log_info "Restaurando backup: $BACKUP_NAME"
sudo rm -rf $PROJECT_DIR.tmp
sudo cp -r $BACKUP_DIR/$BACKUP_NAME $PROJECT_DIR.tmp
sudo rm -rf $PROJECT_DIR
sudo mv $PROJECT_DIR.tmp $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# 5. Reiniciar aplicação
log_info "Reiniciando aplicação..."
cd $PROJECT_DIR
docker-compose -f docker-compose.production.yml up -d

# 6. Aguardar e testar
log_info "Aguardando aplicação iniciar..."
sleep 15

if curl -f -s https://ventushub.com.br/health > /dev/null; then
    log_success "✅ Rollback concluído com sucesso!"
    log_info "🌐 Site: https://ventushub.com.br"
else
    log_error "❌ Problema após rollback!"
    docker-compose -f docker-compose.production.yml logs --tail=10
fi
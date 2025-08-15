#!/bin/bash

# ==================================================
# VentusHub - Deploy de Atualizações
# Execute este script no SERVIDOR para atualizar
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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Funções auxiliares
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCESSO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
log_error() { echo -e "${RED}[ERRO]${NC} $1"; }

echo "🚀 VentusHub - Deploy de Atualização"
echo "======================================"

# 1. Backup do estado atual
log_info "1. Fazendo backup do estado atual..."
sudo mkdir -p $BACKUP_DIR
sudo cp -r $PROJECT_DIR $BACKUP_DIR/ventushub_pre_deploy_$TIMESTAMP
log_success "Backup criado: $BACKUP_DIR/ventushub_pre_deploy_$TIMESTAMP"

# 2. Navegar para o diretório
cd $PROJECT_DIR

# 3. Verificar se há mudanças locais não commitadas
if [[ -n $(git status --porcelain) ]]; then
    log_warning "Há mudanças não commitadas. Fazendo stash..."
    git stash push -m "Auto-stash before deploy $TIMESTAMP"
fi

# 4. Buscar atualizações do Git
log_info "2. Buscando atualizações do repositório..."
git fetch origin

# 5. Mostrar o que será atualizado
echo
log_info "Mudanças que serão aplicadas:"
git log --oneline HEAD..origin/main | head -5

# 6. Aplicar atualizações
log_info "3. Aplicando atualizações..."
git reset --hard origin/main
git pull origin main
log_success "Código atualizado!"

# 7. Reconstruir e reiniciar aplicação
log_info "4. Reconstruindo aplicação..."
docker-compose -f docker-compose.production.yml up --build -d

# 8. Aguardar aplicação iniciar
log_info "5. Aguardando aplicação iniciar..."
sleep 15

# 9. Verificar se está funcionando
log_info "6. Verificando saúde da aplicação..."

# Teste HTTP
if curl -f -s https://ventushub.com.br/health > /dev/null; then
    log_success "✅ HTTPS funcionando!"
else
    log_error "❌ HTTPS com problema!"
    echo "Verificando logs..."
    docker-compose -f docker-compose.production.yml logs --tail=10 ventushub
    exit 1
fi

# Teste da aplicação principal
if curl -f -s https://ventushub.com.br/ > /dev/null; then
    log_success "✅ Aplicação respondendo!"
else
    log_error "❌ Aplicação com problema!"
    echo "Verificando logs..."
    docker-compose -f docker-compose.production.yml logs --tail=10 ventushub
    exit 1
fi

echo
log_success "======================================"
log_success "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
log_success "======================================"
echo
log_info "🌐 Site: https://ventushub.com.br"
log_info "📊 Health: https://ventushub.com.br/health"
log_info "📁 Backup: $BACKUP_DIR/ventushub_pre_deploy_$TIMESTAMP"
echo
log_info "📋 Comandos úteis:"
echo "   • Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   • Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "   • Status: docker-compose -f docker-compose.production.yml ps"
echo
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
log_info "6. Verificando saúde da aplicação multi-tenant..."

# Teste API Health
if curl -f -s https://ventushub.com.br/api/health > /dev/null; then
    log_success "✅ API Health funcionando!"
else
    log_error "❌ API Health com problema!"
    echo "Verificando logs..."
    docker-compose -f docker-compose.production.yml logs --tail=10 ventushub
    exit 1
fi

# Teste B2C (www.ventushub.com.br)
if curl -f -s https://www.ventushub.com.br/ > /dev/null; then
    log_success "✅ B2C (www.ventushub.com.br) funcionando!"
else
    log_error "❌ B2C com problema!"
    echo "Verificando logs..."
    docker-compose -f docker-compose.production.yml logs --tail=10 ventushub
    exit 1
fi

# Teste B2B (app.ventushub.com.br)
if curl -f -s https://app.ventushub.com.br/ > /dev/null; then
    log_success "✅ B2B (app.ventushub.com.br) funcionando!"
else
    log_error "❌ B2B com problema!"
    echo "Verificando logs..."
    docker-compose -f docker-compose.production.yml logs --tail=10 ventushub
    exit 1
fi

# Teste Master Admin
if curl -f -s https://www.ventushub.com.br/master-admin-login > /dev/null; then
    log_success "✅ Master Admin funcionando!"
else
    log_error "❌ Master Admin com problema!"
    echo "Verificando logs..."
    docker-compose -f docker-compose.production.yml logs --tail=10 ventushub
    exit 1
fi

# Teste tenant detection
log_info "7. Testando detecção de tenant..."

# Teste tenant B2C
B2C_TENANT=$(curl -s https://www.ventushub.com.br/api/tenant-info | grep -o '"tenantType":"[^"]*"' | cut -d'"' -f4)
if [ "$B2C_TENANT" = "b2c" ]; then
    log_success "✅ Detecção tenant B2C funcionando!"
else
    log_error "❌ Detecção tenant B2C com problema! Retornou: $B2C_TENANT"
fi

# Teste tenant B2B
B2B_TENANT=$(curl -s https://app.ventushub.com.br/api/tenant-info | grep -o '"tenantType":"[^"]*"' | cut -d'"' -f4)
if [ "$B2B_TENANT" = "b2b" ]; then
    log_success "✅ Detecção tenant B2B funcionando!"
else
    log_error "❌ Detecção tenant B2B com problema! Retornou: $B2B_TENANT"
fi

# Teste sistema de email Resend
log_info "8. Verificando configuração de email..."

# Verificar se as variáveis de ambiente do Resend estão configuradas
if curl -s https://ventushub.com.br/api/health | grep -q "email.*configured"; then
    log_success "✅ Configuração de email Resend OK!"
else
    log_warning "⚠️  Verificar configuração RESEND_API_KEY no .env"
fi

# Teste de migração do banco (se houver)
log_info "9. Verificando schema do banco de dados..."
if curl -s https://ventushub.com.br/api/health | grep -q "database.*connected"; then
    log_success "✅ Conexão com banco de dados OK!"
else
    log_error "❌ Problema na conexão com banco de dados!"
fi

echo
log_success "======================================"
log_success "🎉 DEPLOY MULTI-TENANT CONCLUÍDO!"
log_success "======================================"
echo
log_info "🌐 APLICAÇÃO MULTI-TENANT:"
log_info "   📱 B2C: https://www.ventushub.com.br"
log_info "   🏢 B2B: https://app.ventushub.com.br" 
log_info "   👨‍💼 Master Admin: https://www.ventushub.com.br/master-admin-login"
log_info "   📊 API Health: https://ventushub.com.br/api/health"
echo
log_info "📧 SISTEMA DE EMAIL:"
log_info "   ✉️  Domínio: app.ventushub.com.br (Resend)"
log_info "   📬 From: noreply@app.ventushub.com.br"
log_info "   📞 Suporte: contato@ventushub.com.br"
echo
log_info "🔧 TENANT DETECTION:"
log_info "   🌐 B2C: Detectado por www.ventushub.com.br"
log_info "   🏢 B2B: Detectado por app.ventushub.com.br"
log_info "   📊 Teste: curl https://www.ventushub.com.br/api/tenant-info"
echo
log_info "📁 Backup: $BACKUP_DIR/ventushub_pre_deploy_$TIMESTAMP"
echo
log_info "📋 Comandos úteis:"
echo "   • Ver logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   • Reiniciar: docker-compose -f docker-compose.production.yml restart"
echo "   • Status: docker-compose -f docker-compose.production.yml ps"
echo "   • Testar email: curl -X POST https://ventushub.com.br/api/test-email \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'X-Tenant-Type: b2b' \\"
echo "     -d '{\"email\":\"seu@email.com\",\"name\":\"Teste\"}'"
echo
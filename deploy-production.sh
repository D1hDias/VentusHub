#!/bin/bash

# ==================================================
# VentusHub - Script de Deploy Automatizado
# Ubuntu 22.04 + Docker + Nginx + Let's Encrypt
# ==================================================

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DOMAIN="ventushub.com.br"
EMAIL="admin@ventushub.com.br"  # Troque pelo seu email
PROJECT_DIR="/var/www/ventushub"
REPO_URL="https://github.com/D1hDias/VentusHub.git"
BACKUP_DIR="/var/backups/ventushub"

# Funções auxiliares
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se está sendo executado como root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "Este script não deve ser executado como root!"
        log_info "Execute com: sudo ./deploy-production.sh"
        exit 1
    fi
}

# Verificar dependências do sistema
check_dependencies() {
    log_info "Verificando dependências do sistema..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker não encontrado. Instalando..."
        sudo apt update
        sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io
        sudo usermod -aG docker $USER
    fi
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose não encontrado. Instalando..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Git
    if ! command -v git &> /dev/null; then
        log_warning "Git não encontrado. Instalando..."
        sudo apt update
        sudo apt install -y git
    fi
    
    # Certbot
    if ! command -v certbot &> /dev/null; then
        log_warning "Certbot não encontrado. Instalando..."
        sudo apt update
        sudo apt install -y certbot
    fi
    
    log_success "Dependências verificadas e instaladas!"
}

# Preparar diretórios
prepare_directories() {
    log_info "Preparando diretórios..."
    
    sudo mkdir -p $PROJECT_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p /var/www/certbot
    sudo mkdir -p /etc/letsencrypt
    
    # Definir permissões
    sudo chown -R $USER:$USER $PROJECT_DIR
    sudo chown -R $USER:$USER $BACKUP_DIR
    
    log_success "Diretórios preparados!"
}

# Fazer backup se existir deployment anterior
backup_current() {
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "Fazendo backup do deployment atual..."
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        sudo cp -r $PROJECT_DIR $BACKUP_DIR/ventushub_backup_$TIMESTAMP
        log_success "Backup criado em $BACKUP_DIR/ventushub_backup_$TIMESTAMP"
    fi
}

# Clonar ou atualizar repositório
deploy_code() {
    log_info "Fazendo deploy do código..."
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "Atualizando código existente..."
        cd $PROJECT_DIR
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    else
        log_info "Clonando repositório..."
        sudo rm -rf $PROJECT_DIR
        git clone $REPO_URL $PROJECT_DIR
        cd $PROJECT_DIR
    fi
    
    log_success "Código atualizado!"
}

# Configurar ambiente
setup_environment() {
    log_info "Configurando ambiente de produção..."
    
    cd $PROJECT_DIR
    
    # Copiar arquivo de ambiente de produção
    if [ -f ".env.production" ]; then
        cp .env.production .env
        log_success "Arquivo .env configurado!"
    else
        log_error "Arquivo .env.production não encontrado!"
        exit 1
    fi
    
    # Criar diretórios necessários
    mkdir -p uploads logs nginx/logs
    sudo chown -R $USER:$USER uploads logs
    
    log_success "Ambiente configurado!"
}

# Parar containers existentes
stop_containers() {
    log_info "Parando containers existentes..."
    cd $PROJECT_DIR
    
    if [ -f "docker-compose.production.yml" ]; then
        docker-compose -f docker-compose.production.yml down --remove-orphans || true
    fi
    
    # Limpar containers órfãos
    docker system prune -f
    
    log_success "Containers parados e limpos!"
}

# Obter certificado SSL
setup_ssl() {
    log_info "Configurando certificado SSL..."
    
    # Verificar se certificado já existe
    if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        log_info "Obtendo certificado SSL do Let's Encrypt..."
        
        # Parar nginx temporariamente
        sudo systemctl stop nginx 2>/dev/null || true
        
        # Obter certificado
        sudo certbot certonly \
            --standalone \
            --non-interactive \
            --agree-tos \
            --email $EMAIL \
            -d $DOMAIN \
            -d www.$DOMAIN
        
        if [ $? -eq 0 ]; then
            log_success "Certificado SSL obtido com sucesso!"
        else
            log_error "Falha ao obter certificado SSL!"
            exit 1
        fi
    else
        log_info "Certificado SSL já existe. Renovando se necessário..."
        sudo certbot renew --quiet || true
    fi
}

# Iniciar aplicação
start_application() {
    log_info "Iniciando aplicação..."
    
    cd $PROJECT_DIR
    
    # Construir e iniciar containers
    docker-compose -f docker-compose.production.yml up --build -d
    
    # Aguardar containers iniciarem
    sleep 10
    
    # Verificar se containers estão rodando
    if docker-compose -f docker-compose.production.yml ps | grep -q "Up"; then
        log_success "Containers iniciados com sucesso!"
    else
        log_error "Falha ao iniciar containers!"
        docker-compose -f docker-compose.production.yml logs
        exit 1
    fi
}

# Verificar saúde da aplicação
health_check() {
    log_info "Verificando saúde da aplicação..."
    
    # Aguardar alguns segundos para aplicação inicializar
    sleep 15
    
    # Teste de conectividade local
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "Aplicação respondendo corretamente!"
    else
        log_warning "Aplicação não respondeu ao health check. Verificando logs..."
        docker-compose -f docker-compose.production.yml logs --tail=20
    fi
    
    # Teste HTTPS
    if curl -f -s https://$DOMAIN/health > /dev/null; then
        log_success "HTTPS funcionando corretamente!"
    else
        log_warning "HTTPS não está respondendo. Verifique o certificado SSL."
    fi
}

# Configurar renovação automática do SSL
setup_ssl_renewal() {
    log_info "Configurando renovação automática do SSL..."
    
    # Criar script de renovação
    cat > /tmp/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
docker-compose -f /var/www/ventushub/docker-compose.production.yml restart nginx
EOF
    
    sudo mv /tmp/renew-ssl.sh /usr/local/bin/renew-ssl.sh
    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Adicionar ao crontab (executa todo dia às 2:30 AM)
    (crontab -l 2>/dev/null; echo "30 2 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
    
    log_success "Renovação automática do SSL configurada!"
}

# Mostrar informações do deploy
show_deploy_info() {
    log_success "======================================"
    log_success "       DEPLOY FINALIZADO!"
    log_success "======================================"
    echo
    log_info "🌐 Site: https://$DOMAIN"
    log_info "🌐 Alternativo: https://www.$DOMAIN"
    log_info "📁 Diretório: $PROJECT_DIR"
    log_info "🔄 Logs: docker-compose -f $PROJECT_DIR/docker-compose.production.yml logs"
    echo
    log_info "📋 Comandos úteis:"
    echo "   • Ver logs: cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml logs -f"
    echo "   • Reiniciar: cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml restart"
    echo "   • Parar: cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml down"
    echo "   • Status: cd $PROJECT_DIR && docker-compose -f docker-compose.production.yml ps"
    echo
    log_success "✅ VentusHub está online e funcionando!"
}

# Função principal
main() {
    log_info "======================================"
    log_info "  VentusHub - Deploy Automatizado"
    log_info "======================================"
    echo
    
    check_root
    check_dependencies
    prepare_directories
    backup_current
    deploy_code
    setup_environment
    stop_containers
    setup_ssl
    start_application
    health_check
    setup_ssl_renewal
    show_deploy_info
}

# Executar função principal
main "$@"
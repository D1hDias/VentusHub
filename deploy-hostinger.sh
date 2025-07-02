#!/bin/bash

# Deploy Script para Hostinger VPS - Ubuntu 24.04
# VentusHub - www.ventushub.com.br

set -e

echo "🚀 Iniciando deploy no Hostinger VPS..."

# Configurações
APP_NAME="ventushub"
DOMAIN="ventushub.com.br"
APP_DIR="/var/www/$DOMAIN"
USER="root"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está executando como root
if [ "$EUID" -ne 0 ]; then
    print_error "Este script deve ser executado como root"
    exit 1
fi

print_status "Verificações iniciais passaram"

# Atualizar sistema
print_status "Atualizando sistema..."
apt update && apt upgrade -y

# Instalar dependências necessárias
print_status "Instalando dependências..."
apt install -y curl wget git build-essential

# Verificar Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    print_status "Node.js já instalado: $NODE_VERSION"
else
    print_error "Node.js não encontrado"
    exit 1
fi

# Instalar PM2 globalmente se não existir
if ! command -v pm2 >/dev/null 2>&1; then
    print_status "Instalando PM2..."
    npm install -g pm2
else
    print_status "PM2 já instalado"
fi

# Criar diretório da aplicação
print_status "Criando diretório da aplicação..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clonar/atualizar repositório (assumindo que você vai usar git)
if [ -d ".git" ]; then
    print_status "Atualizando repositório..."
    git pull origin main
else
    print_warning "Repositório não encontrado. Configure git clone manual"
fi

# Instalar dependências Node.js
if [ -f "package.json" ]; then
    print_status "Instalando dependências Node.js..."
    npm ci --only=production
else
    print_error "package.json não encontrado"
    exit 1
fi

# Build da aplicação
print_status "Executando build..."
npm run build

# Verificar conflitos de porta
print_status "Verificando conflitos de porta..."
if systemctl is-active --quiet apache2; then
    print_warning "Apache2 detectado. Parando para evitar conflitos com OpenLiteSpeed..."
    systemctl stop apache2
    systemctl disable apache2
fi

if systemctl is-active --quiet nginx; then
    print_warning "Nginx detectado. Parando para evitar conflitos com OpenLiteSpeed..."
    systemctl stop nginx
    systemctl disable nginx
fi

# Verificar se porta 5000 está livre
if netstat -tlnp | grep -q :5000; then
    print_warning "Porta 5000 já está em uso:"
    netstat -tlnp | grep :5000
    print_warning "Parando processo na porta 5000..."
    fuser -k 5000/tcp 2>/dev/null || true
fi

# Configurar variáveis de ambiente
print_status "Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cp .env.production .env
    print_warning "Configure as variáveis de ambiente em $APP_DIR/.env"
fi

# Firewall já configurado - verificar status
print_status "Verificando firewall..."
ufw status | grep -E "(22|80|443|7080)" || print_warning "Verifique se as portas estão abertas no firewall"

# Criar diretórios necessários
print_status "Criando diretórios necessários..."
mkdir -p uploads/avatars
mkdir -p /var/log/pm2

# Configurar permissões
print_status "Configurando permissões..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Parar aplicação se estiver rodando
if pm2 list | grep -q $APP_NAME; then
    print_status "Parando aplicação existente..."
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
fi

# Iniciar aplicação com PM2
print_status "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save
pm2 startup

print_status "Aplicação iniciada com sucesso!"

# Verificar status
pm2 status

echo ""
print_status "Deploy concluído!"
print_warning "Próximos passos:"
echo "1. Configure o OpenLiteSpeed para proxy reverso na porta 5000"
echo "2. Configure SSL com Let's Encrypt"
echo "3. Configure o domínio www.ventushub.com.br"
echo ""
echo "Aplicação rodando em: http://localhost:5000"
echo "Logs: pm2 logs $APP_NAME"
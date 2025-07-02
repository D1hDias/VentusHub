#!/bin/bash

# Deploy Script específico para Hostinger One-Click OpenLiteSpeed Node.js
# VentusHub - www.ventushub.com.br

set -e

echo "🚀 Iniciando deploy no Hostinger One-Click OpenLiteSpeed..."

# Configurações
APP_NAME="ventushub"
DOMAIN="ventushub.com.br"
APP_DIR="/usr/local/lsws/Example/html/$DOMAIN"
SAMPLE_DIR="/usr/local/lsws/Example"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Verificar se OpenLiteSpeed está rodando
if ! systemctl is-active --quiet lsws; then
    print_error "OpenLiteSpeed não está rodando"
    exit 1
fi

print_status "OpenLiteSpeed está ativo"

# Obter senha do admin
if [ -f "/home/ubuntu/.litespeed_password" ]; then
    ADMIN_PASS=$(cat /home/ubuntu/.litespeed_password)
    print_status "Senha do admin encontrada: $ADMIN_PASS"
else
    print_warning "Senha do admin não encontrada em /home/ubuntu/.litespeed_password"
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

# Verificar se há arquivos da aplicação
if [ ! -f "package.json" ]; then
    print_error "Arquivos da aplicação não encontrados. Execute o upload primeiro:"
    print_error "scp ventushub-deploy.zip root@31.97.245.82:/tmp/"
    print_error "cd $APP_DIR && unzip /tmp/ventushub-deploy.zip"
    exit 1
fi

# Instalar dependências Node.js
print_status "Instalando dependências Node.js..."
npm ci --only=production

# Build da aplicação
print_status "Executando build..."
npm run build

# Configurar variáveis de ambiente
print_status "Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cp .env.production .env
    print_warning "Configure as variáveis de ambiente em $APP_DIR/.env"
fi

# Criar diretórios necessários
print_status "Criando diretórios necessários..."
mkdir -p uploads/avatars
mkdir -p /var/log/pm2

# Configurar permissões
print_status "Configurando permissões..."
chown -R nobody:nogroup $APP_DIR
chmod -R 755 $APP_DIR

# Parar aplicação se estiver rodando
if pm2 list | grep -q $APP_NAME; then
    print_status "Parando aplicação existente..."
    pm2 stop $APP_NAME
    pm2 delete $APP_NAME
fi

# Iniciar aplicação com PM2
print_status "Iniciando aplicação com PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js --env production

# Salvar configuração PM2
pm2 save
pm2 startup

print_status "Aplicação iniciada com sucesso!"

# Configurar Virtual Host no OpenLiteSpeed
print_status "Configurando Virtual Host..."

# Criar configuração do Virtual Host
cat > /usr/local/lsws/conf/vhosts/$DOMAIN/vhconf.conf << EOF
docRoot                   $APP_DIR/dist/public
vhDomain                  $DOMAIN, www.$DOMAIN
adminEmails               admin@$DOMAIN
enableGzip                Yes

index  {
  useServer               0
  indexFiles              index.html
}

context / {
  type                    proxy
  uri                     http://127.0.0.1:80/
  extraHeaders            Host \$host
}

context /api/ {
  type                    proxy
  uri                     http://127.0.0.1:80/api/
  extraHeaders            Host \$host
}

context /uploads/ {
  type                    proxy
  uri                     http://127.0.0.1:80/uploads/
  extraHeaders            Host \$host
}
EOF

# Criar diretório do Virtual Host se não existir
mkdir -p /usr/local/lsws/conf/vhosts/$DOMAIN

# Restart OpenLiteSpeed
print_status "Reiniciando OpenLiteSpeed..."
systemctl restart lsws

# Verificar status
pm2 status

echo ""
print_status "Deploy concluído!"
print_warning "Próximos passos:"
echo "1. Acesse https://31.97.245.82:7080 (Admin: admin, Senha: $ADMIN_PASS)"
echo "2. Configure o Virtual Host para $DOMAIN"
echo "3. Configure SSL com Let's Encrypt"
echo "4. Configure DNS para apontar www.$DOMAIN para 31.97.245.82"
echo ""
echo "Aplicação rodando em: http://31.97.245.82"
echo "Site sample: http://31.97.245.82/"
echo "Logs: pm2 logs $APP_NAME"
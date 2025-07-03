#!/bin/bash

# Script para configurar SSL Let's Encrypt no Hostinger VPS
# VentusHub - www.ventushub.com.br

set -e

DOMAIN="ventushub.com.br"
EMAIL="admin@ventushub.com.br"  # Substitua pelo seu email

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

print_status "Iniciando configuração SSL para $DOMAIN"

# Instalar Certbot
print_status "Instalando Certbot..."
apt update
apt install -y snapd
snap install core; snap refresh core
snap install --classic certbot

# Criar link simbólico
ln -sf /snap/bin/certbot /usr/bin/certbot

# Parar temporariamente o OpenLiteSpeed para liberar a porta 80
print_status "Parando OpenLiteSpeed temporariamente..."
systemctl stop lsws

# Obter certificado SSL
print_status "Obtendo certificado SSL..."
certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Verificar se o certificado foi criado
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_status "Certificado SSL criado com sucesso!"
else
    print_error "Falha ao criar certificado SSL"
    exit 1
fi

# Configurar renovação automática
print_status "Configurando renovação automática..."
cat > /etc/cron.d/certbot << EOF
# Renovar certificados Let's Encrypt automaticamente
0 12 * * * root test -x /usr/bin/certbot -a \! -d /run/systemd/system && perl -e 'sleep int(rand(43200))' && certbot -q renew --pre-hook "systemctl stop lsws" --post-hook "systemctl start lsws"
EOF

# Configurar permissões para o OpenLiteSpeed
print_status "Configurando permissões..."
chown -R lsadm:lsadm /etc/letsencrypt/live/$DOMAIN/
chmod -R 750 /etc/letsencrypt/live/$DOMAIN/

# Criar script de renovação customizado
cat > /usr/local/bin/renew-ssl.sh << 'EOF'
#!/bin/bash
systemctl stop lsws
certbot renew --quiet
systemctl start lsws
/usr/local/lsws/bin/lshttpd -t
if [ $? -eq 0 ]; then
    systemctl reload lsws
fi
EOF

chmod +x /usr/local/bin/renew-ssl.sh

# Reiniciar OpenLiteSpeed
print_status "Reiniciando OpenLiteSpeed..."
systemctl start lsws

print_status "Configuração SSL concluída!"
print_warning "Próximos passos:"
echo "1. Configure o OpenLiteSpeed para usar os certificados:"
echo "   - Key File: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "   - Cert File: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "2. Configure redirecionamento HTTP para HTTPS"
echo "3. Teste a renovação: /usr/local/bin/renew-ssl.sh"
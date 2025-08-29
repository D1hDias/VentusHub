#!/bin/bash

# =================================================================
# Script de Configuração do Subdomínio app.ventushub.com.br
# =================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Configuração do Subdomínio VentusHub        ${NC}"
echo -e "${GREEN}================================================${NC}\n"

# Variáveis
DOMAIN="app.ventushub.com.br"
APP_DIR="/var/www/app.ventushub.com.br"
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
EMAIL="contato@ventushub.com.br"  # Para o Let's Encrypt

# 1. Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ Por favor, execute como root (use sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}📦 Passo 1: Instalando dependências...${NC}"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# 2. Criar diretório da aplicação
echo -e "${YELLOW}📁 Passo 2: Criando diretório da aplicação...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/dist

# 3. Configurar permissões
echo -e "${YELLOW}🔐 Passo 3: Configurando permissões...${NC}"
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# 4. Copiar configuração do Nginx
echo -e "${YELLOW}⚙️  Passo 4: Configurando Nginx...${NC}"
cat > $NGINX_SITE << 'EOF'
# Configuração temporária para obter certificado SSL
server {
    listen 80;
    listen [::]:80;
    server_name app.ventushub.com.br;

    root /var/www/app.ventushub.com.br;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Para validação do Let's Encrypt
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/app.ventushub.com.br;
    }
}
EOF

# 5. Ativar o site
echo -e "${YELLOW}🔗 Passo 5: Ativando site no Nginx...${NC}"
ln -sf $NGINX_SITE $NGINX_ENABLED

# 6. Testar configuração do Nginx
echo -e "${YELLOW}🧪 Passo 6: Testando configuração...${NC}"
nginx -t

# 7. Recarregar Nginx
echo -e "${YELLOW}🔄 Passo 7: Recarregando Nginx...${NC}"
systemctl reload nginx

# 8. Obter certificado SSL
echo -e "${YELLOW}🔒 Passo 8: Obtendo certificado SSL...${NC}"
echo -e "${YELLOW}   Certifique-se de que o DNS já está propagado!${NC}"
read -p "Pressione ENTER quando o DNS estiver configurado..."

certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email --redirect

# 9. Configurar o Nginx para proxy do Node.js
echo -e "${YELLOW}🚀 Passo 9: Configurando proxy para Node.js...${NC}"
cat > $NGINX_SITE << 'EOF'
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name app.ventushub.com.br;
    return 301 https://$server_name$request_uri;
}

# Configuração HTTPS com proxy para Node.js
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.ventushub.com.br;

    # Certificados SSL gerenciados pelo Certbot
    ssl_certificate /etc/letsencrypt/live/app.ventushub.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.ventushub.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/app.ventushub.com.br.access.log;
    error_log /var/log/nginx/app.ventushub.com.br.error.log;

    # Proxy para Node.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Upload de arquivos grandes
    client_max_body_size 10M;

    # Compressão gzip
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript;
}
EOF

# 10. Testar e recarregar Nginx
echo -e "${YELLOW}🔄 Passo 10: Aplicando configuração final...${NC}"
nginx -t && systemctl reload nginx

# 11. Configurar renovação automática do SSL
echo -e "${YELLOW}⏰ Passo 11: Configurando renovação automática do SSL...${NC}"
(crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --no-self-upgrade --post-hook 'systemctl reload nginx'") | crontab -

# 12. Criar script de deploy
echo -e "${YELLOW}📝 Passo 12: Criando script de deploy...${NC}"
cat > /home/deploy-ventushub.sh << 'EOF'
#!/bin/bash
# Script de deploy do VentusHub

APP_DIR="/var/www/app.ventushub.com.br"
REPO_URL="https://github.com/seu-usuario/ventushub.git"  # Ajuste conforme necessário

cd $APP_DIR

# Pull das mudanças
git pull origin main

# Instalar dependências
npm install

# Build da aplicação
npm run build

# Reiniciar PM2 (se estiver usando)
pm2 restart ventushub || pm2 start npm --name "ventushub" -- run start

echo "✅ Deploy concluído!"
EOF

chmod +x /home/deploy-ventushub.sh

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Configuração Concluída com Sucesso!         ${NC}"
echo -e "${GREEN}================================================${NC}\n"

echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo -e "1. Configure o DNS no Hostinger:"
echo -e "   - Tipo: A"
echo -e "   - Nome: app"
echo -e "   - Valor: $(curl -s ifconfig.me)"
echo -e ""
echo -e "2. Faça o deploy da aplicação:"
echo -e "   - cd $APP_DIR"
echo -e "   - git clone [seu-repositorio]"
echo -e "   - npm install"
echo -e "   - npm run build"
echo -e "   - pm2 start npm --name 'ventushub' -- run start"
echo -e ""
echo -e "3. Teste o acesso:"
echo -e "   - https://app.ventushub.com.br"
echo -e ""
echo -e "${GREEN}🎉 Tudo pronto!${NC}"
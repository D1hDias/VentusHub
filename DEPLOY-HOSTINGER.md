# 🚀 Deploy VentusHub no Hostinger VPS

Guia completo para deploy do VentusHub no Hostinger VPS com Ubuntu 24.04, OpenLiteSpeed e Node.js v22.17.0.

## 📋 Pré-requisitos

- VPS Hostinger com Ubuntu 24.04
- Node.js v22.17.0 (✅ já instalado)
- OpenLiteSpeed (✅ já configurado)
- Acesso SSH como root
- Domínio: www.ventushub.com.br

## 🚀 Processo de Deploy

### 1. Preparar Ambiente Local

```bash
# Build da aplicação
npm run build

# Criar arquivo ZIP para upload
zip -r ventushub.zip . -x "node_modules/*" ".git/*" "dist/*"
```

### 2. Upload para VPS

```bash
# Via SCP (substitua SEU_IP pelo IP do VPS)
scp ventushub.zip root@SEU_IP:/tmp/

# Ou use FileZilla/WinSCP para upload manual
```

### 3. Configurar no VPS

```bash
# Conectar via SSH
ssh root@SEU_IP

# Extrair aplicação
cd /var/www
mkdir -p ventushub.com.br
cd ventushub.com.br
unzip /tmp/ventushub.zip
rm /tmp/ventushub.zip

# Executar script de deploy
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh
```

### 4. Configurar OpenLiteSpeed

#### 4.1 Acessar Painel Admin
```
https://SEU_IP:7080
```

#### 4.2 Criar Virtual Host
1. **Virtual Hosts** → **Add** → **Type: General**
2. **Virtual Host Name**: `ventushub.com.br`
3. **Virtual Host Root**: `/var/www/ventushub.com.br`
4. **Config File**: `$VH_ROOT/vhconf.conf`
5. **Enable Scripts/ExtApps**: Yes

#### 4.3 Configurar Context (Proxy Reverso)
1. **Script Handler** → **Add**
   - **Suffixes**: `*`
   - **Type**: `Proxy`
   - **Address**: `http://127.0.0.1:5000`

#### 4.4 Configurar Listener
1. **Listeners** → **Add**
   - **Listener Name**: `HTTP`
   - **IP**: `*`
   - **Port**: `80`
   - **Secure**: No

2. **Listeners** → **Add**
   - **Listener Name**: `HTTPS`
   - **IP**: `*`
   - **Port**: `443`
   - **Secure**: Yes

#### 4.5 Mapear Virtual Host
1. **Listeners** → **HTTP** → **Virtual Host Mappings** → **Add**
   - **Virtual Host**: `ventushub.com.br`
   - **Domain**: `ventushub.com.br, www.ventushub.com.br`

2. **Listeners** → **HTTPS** → **Virtual Host Mappings** → **Add**
   - **Virtual Host**: `ventushub.com.br`
   - **Domain**: `ventushub.com.br, www.ventushub.com.br`

### 5. Configurar SSL

```bash
# Executar script SSL
chmod +x ssl-setup.sh
./ssl-setup.sh
```

#### 5.1 Configurar SSL no OpenLiteSpeed
1. **Virtual Hosts** → **ventushub.com.br** → **SSL**
2. **Private Key File**: `/etc/letsencrypt/live/ventushub.com.br/privkey.pem`
3. **Certificate File**: `/etc/letsencrypt/live/ventushub.com.br/fullchain.pem`
4. **Chained Certificate**: Yes
5. **Protocol Version**: TLSv1.1 TLSv1.2 TLSv1.3

### 6. Configurar Firewall

```bash
# Permitir portas necessárias
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 7080  # OpenLiteSpeed Admin
ufw enable
```

### 7. Configurar PM2

```bash
# Verificar status
pm2 status

# Ver logs
pm2 logs ventushub

# Restart aplicação
pm2 restart ventushub

# Reload aplicação
pm2 reload ventushub
```

## 🔧 Comandos Úteis

### Monitoramento
```bash
# Status da aplicação
pm2 status

# Logs em tempo real
pm2 logs ventushub --lines 50

# Monitor PM2
pm2 monit

# Status OpenLiteSpeed
systemctl status lsws
```

### Manutenção
```bash
# Restart completo
pm2 restart ventushub
systemctl restart lsws

# Update da aplicação
cd /var/www/ventushub.com.br
git pull origin main
npm ci --only=production
npm run build
pm2 restart ventushub
```

### Logs
```bash
# Logs da aplicação
tail -f /var/log/pm2/ventushub.log

# Logs OpenLiteSpeed
tail -f /usr/local/lsws/logs/error.log
tail -f /usr/local/lsws/logs/access.log
```

## 🗂️ Estrutura de Arquivos

```
/var/www/ventushub.com.br/
├── dist/                 # Build da aplicação
├── uploads/              # Uploads de arquivos
├── ecosystem.config.js   # Configuração PM2
├── .env                  # Variáveis de ambiente
└── package.json          # Dependências Node.js
```

## 🔐 Variáveis de Ambiente

Configurar em `/var/www/ventushub.com.br/.env`:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
SESSION_SECRET=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 🚨 Solução de Problemas

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs ventushub

# Verificar permissões
chown -R www-data:www-data /var/www/ventushub.com.br

# Reinstalar dependências
cd /var/www/ventushub.com.br
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart ventushub
```

### SSL não funciona
```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew --dry-run

# Verificar permissões OpenLiteSpeed
chown -R lsadm:lsadm /etc/letsencrypt/live/ventushub.com.br/
```

### Erro 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar porta
netstat -tlnp | grep :5000

# Restart completo
pm2 restart ventushub
systemctl restart lsws
```

## 📈 Performance

### Otimizações PM2
```bash
# Cluster mode (se necessário)
pm2 start ecosystem.config.js --env production -i max
```

### Cache OpenLiteSpeed
1. **Cache** → **Cache Storage Settings**
2. **Cache Policy** → **Add Rule**
   - **URI**: `/static/*`
   - **Cache TTL**: `86400`

## 🔄 Atualizações

### Deploy de Atualizações
```bash
cd /var/www/ventushub.com.br
git pull origin main
npm ci --only=production
npm run build
pm2 restart ventushub
```

## 📞 Suporte

- **Logs**: `/var/log/pm2/ventushub.log`
- **Status**: `pm2 status`
- **Monitor**: `pm2 monit`
- **SSL**: `certbot certificates`
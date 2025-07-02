# 🚀 Deploy VentusHub - Hostinger One-Click OpenLiteSpeed

Guia específico para deploy no **Hostinger One-Click OpenLiteSpeed Node.js Server**.

## 📋 Configuração Detectada

✅ **OpenLiteSpeed** pré-instalado e ativo  
✅ **Node.js v22.17.0** pré-instalado  
✅ **Firewall** configurado (22, 80, 443)  
✅ **Sample Node.js site** em `http://31.97.245.82/`  
🔑 **Admin Password** em `/home/ubuntu/.litespeed_password`

## 🚀 Processo de Deploy Otimizado

### 1. Preparar Localmente

```bash
# Build e criar pacote
npm run build
npm run package:upload
```

### 2. Upload para o Servidor

```bash
# Upload via SCP
scp ventushub-deploy.zip root@31.97.245.82:/tmp/

# Ou usar comando rápido
npm run upload
```

### 3. Deploy no Servidor

```bash
# Conectar via SSH
ssh root@31.97.245.82

# Ir para o diretório correto do OpenLiteSpeed
mkdir -p /usr/local/lsws/Example/html/ventushub.com.br
cd /usr/local/lsws/Example/html/ventushub.com.br

# Extrair aplicação
unzip /tmp/ventushub-deploy.zip

# Executar deploy otimizado
chmod +x deploy-hostinger-oneclick.sh
./deploy-hostinger-oneclick.sh
```

## ⚙️ Configuração OpenLiteSpeed Admin

### 1. Acessar Painel Admin

```bash
# Obter senha do admin
sudo cat /home/ubuntu/.litespeed_password

# Acessar painel
https://31.97.245.82:7080
User: admin
Password: [senha obtida acima]
```

### 2. Configurar Virtual Host

1. **Virtual Hosts** → **Add**
   - **Type**: General
   - **Virtual Host Name**: `ventushub.com.br`
   - **Virtual Host Root**: `/usr/local/lsws/Example/html/ventushub.com.br`
   - **Config File**: `$VH_ROOT/vhconf.conf`
   - **Enable Scripts/ExtApps**: Yes

2. **Script Handler** → **Add**
   - **Suffixes**: `*`
   - **Type**: `Proxy`
   - **Address**: `http://127.0.0.1:5000`

### 3. Mapear Domínio

1. **Listeners** → **Default** → **Virtual Host Mappings**
2. **Add Mapping**:
   - **Virtual Host**: `ventushub.com.br`
   - **Domain**: `ventushub.com.br, www.ventushub.com.br, 31.97.245.82`

### 4. Aplicar Configurações

1. **Actions** → **Graceful Restart**

## 🔒 Configurar SSL

### 1. Instalar Certbot

```bash
# Instalar Certbot
sudo snap install certbot --classic

# Parar OpenLiteSpeed temporariamente
sudo systemctl stop lsws

# Obter certificado
sudo certbot certonly --standalone \
    --email admin@ventushub.com.br \
    --agree-tos \
    --no-eff-email \
    -d ventushub.com.br \
    -d www.ventushub.com.br

# Reiniciar OpenLiteSpeed
sudo systemctl start lsws
```

### 2. Configurar SSL no OpenLiteSpeed

1. **Listeners** → **Add** (SSL)
   - **Listener Name**: `SSL`
   - **IP**: `*`
   - **Port**: `443`
   - **Secure**: Yes

2. **SSL** → **SSL Private Key & Certificate**
   - **Private Key File**: `/etc/letsencrypt/live/ventushub.com.br/privkey.pem`
   - **Certificate File**: `/etc/letsencrypt/live/ventushub.com.br/fullchain.pem`

3. **SSL Listeners** → **SSL** → **Virtual Host Mappings**
   - Mapear o mesmo Virtual Host

## 📊 Monitoramento

### Comandos Essenciais

```bash
# Status da aplicação
pm2 status
pm2 logs ventushub

# Status OpenLiteSpeed
sudo systemctl status lsws

# Verificar portas
netstat -tlnp | grep :5000  # Node.js
netstat -tlnp | grep :80    # HTTP
netstat -tlnp | grep :443   # HTTPS

# Logs OpenLiteSpeed
sudo tail -f /usr/local/lsws/logs/error.log
sudo tail -f /usr/local/lsws/logs/access.log
```

### URLs de Teste

- **Aplicação Direct**: `http://31.97.245.82:5000`
- **Sample Site**: `http://31.97.245.82/`
- **Seu Site**: `http://31.97.245.82/` (após configurar)
- **Admin Panel**: `https://31.97.245.82:7080`
- **Site Final**: `https://www.ventushub.com.br`

## 🔧 Troubleshooting

### Aplicação não inicia

```bash
# Verificar PM2
pm2 status
pm2 logs ventushub

# Verificar dependências
cd /usr/local/lsws/Example/html/ventushub.com.br
npm ci --only=production
npm run build

# Restart
pm2 restart ventushub
```

### Site não carrega

```bash
# Verificar Virtual Host
sudo /usr/local/lsws/bin/lshttpd -t

# Restart OpenLiteSpeed
sudo systemctl restart lsws

# Verificar logs
sudo tail -f /usr/local/lsws/logs/error.log
```

### Erro 502

```bash
# Verificar se Node.js está rodando
pm2 status

# Testar aplicação diretamente
curl http://localhost:5000

# Restart completo
pm2 restart ventushub
sudo systemctl restart lsws
```

## 📋 Checklist Final

- [ ] PM2 rodando aplicação na porta 5000
- [ ] OpenLiteSpeed ativo e configurado
- [ ] Virtual Host criado para ventushub.com.br
- [ ] Proxy reverso configurado para localhost:5000
- [ ] SSL configurado (opcional)
- [ ] DNS apontando para 31.97.245.82
- [ ] Site acessível em www.ventushub.com.br

## 🎯 Estrutura de Diretórios

```
/usr/local/lsws/Example/html/ventushub.com.br/
├── dist/                    # Build da aplicação
├── uploads/                 # Uploads de arquivos
├── ecosystem.config.js      # Configuração PM2
├── .env                     # Variáveis de ambiente
└── package.json             # Dependências
```

O ambiente One-Click do Hostinger está otimizado e pronto para receber sua aplicação!
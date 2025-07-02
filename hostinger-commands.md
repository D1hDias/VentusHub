# 📋 Comandos Rápidos - Hostinger VPS

**IP do Servidor:** 31.97.245.82  
**Domínio:** www.ventushub.com.br

## 🔌 Conexão SSH

```bash
# Conectar via SSH
ssh root@31.97.245.82

# Ou usar script rápido
./quick-connect.sh
```

## 📤 Upload de Arquivos

```bash
# Via SCP
scp ventushub-deploy.zip root@31.97.245.82:/tmp/

# Ou usar script rápido
./quick-connect.sh upload ventushub-deploy.zip
```

## 🎛️ Painel OpenLiteSpeed

```
URL: https://31.97.245.82:7080
User: admin
```

## 🔧 Comandos no Servidor

### PM2 (Gerenciamento da Aplicação)
```bash
# Status
pm2 status

# Logs
pm2 logs ventushub

# Restart
pm2 restart ventushub

# Monitor
pm2 monit
```

### OpenLiteSpeed
```bash
# Status
systemctl status lsws

# Restart
systemctl restart lsws

# Reload config
/usr/local/lsws/bin/lshttpd -t && systemctl reload lsws
```

### SSL/Certificados
```bash
# Verificar certificados
certbot certificates

# Renovar manualmente
certbot renew

# Teste de renovação
certbot renew --dry-run
```

### Logs
```bash
# Logs da aplicação
tail -f /var/log/pm2/ventushub.log

# Logs OpenLiteSpeed
tail -f /usr/local/lsws/logs/error.log
tail -f /usr/local/lsws/logs/access.log

# Baixar logs (local)
./quick-connect.sh logs
```

### Sistema
```bash
# Status geral
htop

# Espaço em disco
df -h

# Uso de RAM
free -h

# Processos Node.js
ps aux | grep node

# Verificar portas específicas
netstat -tlnp | grep :5000    # Aplicação Node.js
netstat -tlnp | grep :80      # HTTP
netstat -tlnp | grep :443     # HTTPS
netstat -tlnp | grep :7080    # OpenLiteSpeed Admin

# Todas as portas abertas
netstat -tlnp

# Firewall status
ufw status

# Verificar conflitos Apache/Nginx
systemctl status apache2
systemctl status nginx
systemctl status lsws
```

## 🚀 Deploy Rápido

```bash
# 1. Preparar localmente
npm run build
npm run package:upload

# 2. Upload
./quick-connect.sh upload ventushub-deploy.zip

# 3. No servidor
ssh root@31.97.245.82
cd /var/www/ventushub.com.br
unzip -o /tmp/ventushub-deploy.zip
npm ci --only=production
npm run build
pm2 restart ventushub
```

## 🔍 Troubleshooting

### Site não carrega
```bash
# Verificar aplicação
pm2 status
pm2 logs ventushub

# Verificar OpenLiteSpeed
systemctl status lsws
tail -f /usr/local/lsws/logs/error.log

# Verificar porta
netstat -tlnp | grep :5000
```

### SSL não funciona
```bash
# Verificar certificados
certbot certificates

# Testar renovação
certbot renew --dry-run

# Verificar config OpenLiteSpeed
cat /usr/local/lsws/conf/vhosts/ventushub.com.br/vhconf.conf
```

### Erro 502
```bash
# Restart completo
pm2 restart ventushub
systemctl restart lsws

# Verificar conectividade
curl -I http://localhost:5000
```

## 📊 Monitoramento

### URLs de Teste
- **HTTP:** http://31.97.245.82
- **HTTPS:** https://31.97.245.82
- **Domínio:** https://www.ventushub.com.br
- **API:** https://www.ventushub.com.br/api/health

### Comando de Teste Completo
```bash
# Testar toda a stack
curl -I https://www.ventushub.com.br && \
pm2 status && \
systemctl status lsws && \
certbot certificates
```
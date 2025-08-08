# 🚀 VentusHub - Guia de Deploy para Produção

## 📋 Resumo

Este guia mostra como fazer deploy do VentusHub na sua VPS Ubuntu 22.04 com Docker, Nginx e certificado SSL Let's Encrypt.

## 🎯 Arquitetura de Deploy

```
Internet → Nginx (SSL/HTTPS) → Docker Container (VentusHub) → Neon Database + Supabase
```

**Tecnologias:**
- 🐧 Ubuntu 22.04
- 🐳 Docker + Docker Compose  
- ⚡ Nginx (reverse proxy + SSL)
- 🔒 Let's Encrypt (certificado SSL gratuito)
- 🗄️ Neon (PostgreSQL) + Supabase (storage)

## 🔧 Pré-requisitos

- ✅ VPS Ubuntu 22.04 com acesso sudo
- ✅ Domínio `ventushub.com.br` apontando para IP `31.97.245.82`
- ✅ Portas 80 e 443 abertas no firewall
- ✅ Todas as variáveis de ambiente configuradas

## 🚀 Deploy Automático (Recomendado)

### 1. Conectar no servidor

```bash
ssh usuario@31.97.245.82
```

### 2. Fazer upload dos arquivos

Execute no seu computador local:

```bash
# Fazer upload do script e arquivos necessários
scp deploy-production.sh usuario@31.97.245.82:~/
scp docker-compose.production.yml usuario@31.97.245.82:~/
scp .env.production usuario@31.97.245.82:~/
scp -r nginx usuario@31.97.245.82:~/
```

### 3. Executar o script

```bash
# No servidor
chmod +x deploy-production.sh
sudo ./deploy-production.sh
```

**O script irá automaticamente:**
1. ✅ Instalar Docker, Docker Compose, Git, Certbot
2. ✅ Criar diretórios necessários
3. ✅ Fazer backup se existir deploy anterior
4. ✅ Clonar/atualizar código do GitHub
5. ✅ Configurar ambiente de produção
6. ✅ Obter certificado SSL Let's Encrypt
7. ✅ Construir e iniciar containers Docker
8. ✅ Configurar renovação automática do SSL
9. ✅ Fazer health check da aplicação

### 4. Verificar se está funcionando

```bash
# Verificar containers
docker-compose -f /var/www/ventushub/docker-compose.production.yml ps

# Ver logs
docker-compose -f /var/www/ventushub/docker-compose.production.yml logs -f

# Testar endpoints
curl http://localhost/health
curl https://ventushub.com.br/health
```

## 🔄 Atualizações e Manutenção

### Atualizar aplicação

```bash
cd /var/www/ventushub
git pull origin main
docker-compose -f docker-compose.production.yml up --build -d
```

### Comandos úteis

```bash
# Ver status dos containers
docker-compose -f docker-compose.production.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.production.yml logs -f

# Reiniciar aplicação
docker-compose -f docker-compose.production.yml restart

# Parar aplicação
docker-compose -f docker-compose.production.yml down

# Reiniciar com rebuild
docker-compose -f docker-compose.production.yml up --build -d

# Limpar containers e imagens não utilizadas
docker system prune -f
```

### Monitorar logs

```bash
# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs da aplicação
docker-compose -f /var/www/ventushub/docker-compose.production.yml logs -f ventushub

# Logs específicos do container
docker logs ventushub-app -f
```

### Backup e recuperação

```bash
# Fazer backup manual
sudo cp -r /var/www/ventushub /var/backups/ventushub_$(date +%Y%m%d_%H%M%S)

# Restaurar backup
sudo cp -r /var/backups/ventushub_20240108_143000 /var/www/ventushub
```

## 🔐 Certificado SSL

### Renovação manual

```bash
# Renovar certificado
sudo certbot renew

# Reiniciar nginx após renovação
docker-compose -f /var/www/ventushub/docker-compose.production.yml restart nginx
```

### Verificar certificado

```bash
# Verificar validade do certificado
sudo certbot certificates

# Testar renovação
sudo certbot renew --dry-run
```

## 🐛 Solução de Problemas

### Container não inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.production.yml logs ventushub

# Verificar configurações de rede
docker network ls
docker network inspect ventushub_ventushub-network
```

### Aplicação não responde

```bash
# Verificar se porta está sendo usada
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Verificar firewall
sudo ufw status

# Reiniciar containers
docker-compose -f docker-compose.production.yml restart
```

### Problemas de SSL

```bash
# Verificar certificado
sudo certbot certificates

# Testar conectividade SSL
openssl s_client -connect ventushub.com.br:443 -servername ventushub.com.br

# Verificar configuração nginx
sudo nginx -t
```

### Problemas de banco de dados

```bash
# Testar conexão com Neon
docker exec ventushub-app node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()').then(res => console.log(res.rows[0])).catch(err => console.error(err));
"
```

## 📊 Monitoramento

### Health checks

- **HTTP**: `http://31.97.245.82/health`
- **HTTPS**: `https://ventushub.com.br/health`

### Métricas importantes

```bash
# Uso de CPU e memória
docker stats

# Espaço em disco
df -h

# Logs de acesso (últimas 100 linhas)
sudo tail -100 /var/log/nginx/access.log
```

## 🔧 Configurações Avançadas

### Variáveis de ambiente

Edite `/var/www/ventushub/.env` conforme necessário:

```bash
sudo nano /var/www/ventushub/.env
# Reiniciar após mudanças
docker-compose -f /var/www/ventushub/docker-compose.production.yml restart
```

### Configuração do Nginx

Edite `/var/www/ventushub/nginx/sites-available/ventushub.production.conf` para ajustes avançados.

### Backup automatizado

Adicione ao crontab para backup diário:

```bash
crontab -e
# Adicionar linha:
0 2 * * * /usr/local/bin/backup-ventushub.sh
```

## 📞 Suporte

**URLs importantes:**
- 🌐 Site: https://ventushub.com.br  
- 📊 Health check: https://ventushub.com.br/health
- 📁 Código: https://github.com/D1hDias/VentusHub

**Arquivos de configuração:**
- Docker: `/var/www/ventushub/docker-compose.production.yml`
- Nginx: `/var/www/ventushub/nginx/sites-available/ventushub.production.conf`
- Ambiente: `/var/www/ventushub/.env`

---

✅ **VentusHub está pronto para produção!**
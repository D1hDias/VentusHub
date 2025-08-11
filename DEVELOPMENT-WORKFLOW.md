# 🚀 VentusHub - Workflow de Deploy

## 📋 Processo Completo de Deploy

### 🔄 Fluxo de Trabalho

```
Desenvolvimento Local → Git Push → Deploy no Servidor → Teste
```

## 🛠️ 1. Desenvolvimento Local

### Fazer suas alterações
```bash
# No seu ambiente local
cd "C:\Users\diego\OneDrive\Desktop\Projeto Imobiliário\VentusHub"

# Fazer suas alterações nos arquivos
# Testar localmente se necessário
npm run dev  # Para testar frontend
```

### Commit e Push
```bash
# Adicionar arquivos modificados
git add .

# Fazer commit com mensagem descritiva
git commit -m "Adicionar funcionalidade X: descrição das mudanças"

# Enviar para GitHub
git push origin main
```

## 🚀 2. Deploy no Servidor

### Fazer upload dos scripts (apenas primeira vez)
```bash
# Upload dos scripts de deploy
scp deploy-update.sh root@31.97.245.82:/var/www/ventushub/
scp rollback.sh root@31.97.245.82:/var/www/ventushub/
scp DEPLOY-WORKFLOW.md root@31.97.245.82:/var/www/ventushub/

# SSH no servidor
ssh root@31.97.245.82

# Tornar scripts executáveis
cd /var/www/ventushub
chmod +x deploy-update.sh rollback.sh
```

### Deploy das Atualizações
```bash
# No servidor
cd /var/www/ventushub
./deploy-update.sh
```

**O script automaticamente:**
✅ Faz backup do estado atual  
✅ Busca atualizações do Git  
✅ Aplica mudanças  
✅ Reconstrói containers Docker  
✅ Testa se aplicação está funcionando  
✅ Mostra resultado final  

## 🔧 3. Se Algo Der Errado

### Rollback Rápido
```bash
# No servidor
./rollback.sh

# Selecionar backup da lista
# Ex: ventushub_pre_deploy_20250808_123000
```

### Debug Manual
```bash
# Ver logs da aplicação
docker-compose -f docker-compose.production.yml logs -f ventushub

# Ver logs do nginx
docker-compose -f docker-compose.production.yml logs -f nginx

# Reiniciar serviços específicos
docker-compose -f docker-compose.production.yml restart ventushub
docker-compose -f docker-compose.production.yml restart nginx

# Ver status dos containers
docker-compose -f docker-compose.production.yml ps
```

## ⚡ 4. Deploy Rápido (Resumo)

### Workflow Diário
```bash
# 1. LOCAL: Desenvolver
git add .
git commit -m "Suas mudanças"
git push origin main

# 2. SERVIDOR: Deploy
ssh root@31.97.245.82
cd /var/www/ventushub
./deploy-update.sh

# 3. TESTE: Verificar
# Abrir https://ventushub.com.br
```

## 📊 5. Monitoramento

### URLs de Teste
- **Site Principal**: https://ventushub.com.br
- **Health Check**: https://ventushub.com.br/health
- **API Test**: https://ventushub.com.br/api/dashboard/stats

### Comandos de Monitoramento
```bash
# Status dos serviços
docker-compose -f docker-compose.production.yml ps

# Uso de recursos
docker stats

# Espaço em disco
df -h

# Logs em tempo real
docker-compose -f docker-compose.production.yml logs -f
```

## 🔒 6. Backup e Segurança

### Backups Automáticos
- **Localização**: `/var/backups/ventushub/`
- **Formato**: `ventushub_pre_deploy_YYYYMMDD_HHMMSS`
- **Retenção**: Manual (limpar periodicamente)

### Listar Backups
```bash
sudo ls -lt /var/backups/ventushub/ | head -10
```

### Limpeza de Backups Antigos
```bash
# Manter apenas últimos 5 backups
sudo ls -t /var/backups/ventushub/ | tail -n +6 | xargs -I {} sudo rm -rf /var/backups/ventushub/{}
```

## 🚨 7. Troubleshooting

### Problemas Comuns

**1. Deploy falha na construção**
```bash
# Ver logs detalhados
docker-compose -f docker-compose.production.yml logs --tail=50 ventushub

# Limpar cache Docker
docker system prune -f
./deploy-update.sh
```

**2. Site não carrega após deploy**
```bash
# Verificar nginx
docker-compose -f docker-compose.production.yml logs nginx

# Reiniciar nginx
docker-compose -f docker-compose.production.yml restart nginx
```

**3. Problemas de sessão/login**
```bash
# Ver logs de autenticação
docker-compose -f docker-compose.production.yml logs ventushub | grep -i "auth\|session"

# Verificar variáveis de ambiente
docker exec ventushub-app env | grep -E "(SESSION|JWT|DATABASE)"
```

**4. Problemas de SSL/HTTPS**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados se necessário
sudo certbot renew
docker-compose -f docker-compose.production.yml restart nginx
```

### Recovery de Emergência
```bash
# Se tudo falhar, deploy do zero
cd /var/www/ventushub
docker-compose -f docker-compose.production.yml down
git reset --hard origin/main
docker-compose -f docker-compose.production.yml up --build -d
```

## ⏱️ 8. Estimativas de Tempo

- **Deploy Normal**: 2-3 minutos
- **Deploy com Build**: 3-5 minutos  
- **Rollback**: 1-2 minutos
- **Debug**: 5-10 minutos

## 📝 9. Checklist de Deploy

- [ ] ✅ Mudanças testadas localmente
- [ ] ✅ Commit feito com mensagem clara  
- [ ] ✅ Push para GitHub realizado
- [ ] ✅ Script deploy-update.sh executado
- [ ] ✅ Site funcionando: https://ventushub.com.br
- [ ] ✅ Health check OK: /health
- [ ] ✅ Login funcionando
- [ ] ✅ Funcionalidades principais testadas

---

🎉 **Com este workflow, você terá deploys rápidos, seguros e com rollback automático!**
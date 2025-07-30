# Guia de Desenvolvimento e Deploy - VentusHub

## 🏗️ Ambiente de Desenvolvimento Local

### Configuração Inicial:
```bash
# 1. Subir banco de dados de desenvolvimento
npm run dev:db

# 2. Aplicar schema do banco
npm run db:push

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

### Comandos Úteis:
```bash
# Parar banco de desenvolvimento
npm run dev:stop

# Ver logs do banco
docker logs ventushub-postgres-dev

# Acessar banco diretamente
docker exec -it ventushub-postgres-dev psql -U ventushub_user -d ventushub_dev
```

## 🚀 Deploy para Produção

### Método Rápido (Script Automatizado):
```bash
# No Windows (PowerShell)
bash deploy.sh

# No Linux/Mac
./deploy.sh
```

### Método Manual:
```bash
# 1. Commit e push das mudanças
git add .
git commit -m "Sua mensagem"
git push origin main

# 2. Deploy no servidor
ssh root@31.97.245.82
cd /var/www/VentusHub
git pull origin main
docker-compose down
docker-compose up -d --build
```

## 🔧 Configurações de Ambiente

### Desenvolvimento Local:
- **Porta da aplicação**: 5000
- **Porta do banco**: 5433
- **Banco**: `ventushub_dev`
- **URL**: http://localhost:5000

### Produção (Servidor VPS):
- **Porta da aplicação**: 3000 (mapeada do container)
- **Porta do banco**: 5432
- **Banco**: `ventushub`
- **URL**: http://31.97.245.82:3000

## 📁 Estrutura de Arquivos

```
├── .env                     # Copiado automaticamente do .env.development
├── .env.development         # Configurações de desenvolvimento
├── docker-compose.yml       # Configuração para produção
├── docker-compose.dev.yml   # Configuração para desenvolvimento
├── deploy.sh               # Script de deploy automatizado
└── DESENVOLVIMENTO.md      # Este arquivo
```

## 🔄 Workflow Recomendado

1. **Desenvolvimento**:
   - `npm run dev:db` (uma vez)
   - `npm run dev` (sempre que desenvolver)
   - Teste local em http://localhost:5000

2. **Deploy**:
   - `bash deploy.sh` (publica automaticamente)
   - Ou seguir processo manual

3. **Manutenção**:
   - `npm run dev:stop` para parar ambiente local
   - No servidor: `docker-compose logs -f app` para ver logs

## ⚠️ Notas Importantes

- O banco de desenvolvimento é isolado e não afeta produção
- Sempre teste localmente antes do deploy
- O script de deploy faz commit automático se houver mudanças
- Produção usa PostgreSQL em container Docker
- Desenvolvimento usa PostgreSQL em container separado
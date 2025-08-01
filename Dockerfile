# Multi-stage build para VentusHub
# Estágio 1: Builder
FROM node:20-alpine AS builder

# Instalar dependências do sistema necessárias
RUN apk add --no-cache python3 make g++

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ventushub -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

# Instalar dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY migrations/ ./migrations/

# Build da aplicação
RUN npm run build

# Estágio 2: Runtime
FROM node:20-alpine AS runner

# Instalar dependências mínimas
RUN apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ventushub -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos necessários do builder
COPY --from=builder --chown=ventushub:nodejs /app/dist ./dist
COPY --from=builder --chown=ventushub:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=ventushub:nodejs /app/package.json ./package.json

# Criar diretórios necessários
RUN mkdir -p /app/uploads /app/logs && \
    chown -R ventushub:nodejs /app/uploads /app/logs

# Mudar para usuário não-root
USER ventushub

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/api/health || exit 1

# Usar tini como init system
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar aplicação
CMD ["npm", "start"]
# Estágio 1: Instalar dependências
FROM node:20-alpine AS base
WORKDIR /app
# Copiar arquivos de pacote e instalar dependências
COPY package.json package-lock.json* ./
# Instalar dependências e fixar versão do Neon para produção
RUN npm ci && npm install @neondatabase/serverless@0.10.1

# Estágio 2: Construir a aplicação
FROM node:20-alpine AS builder
WORKDIR /app
# Copiar dependências do estágio base
COPY --from=base /app/node_modules ./node_modules
# Copiar o resto do código-fonte da aplicação
COPY . .

# Declarar os argumentos de build que serão recebidos do docker-compose
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_REGISTRO_IMOVEIS_API_KEY

# Executar o script de build do package.json, passando os argumentos como variáveis de ambiente
RUN VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_REGISTRO_IMOVEIS_API_KEY=$VITE_REGISTRO_IMOVEIS_API_KEY \
    npm run build

# Estágio 3: Imagem de produção (runner)
# Este é o estágio 'runner' que o docker-compose.yml usa como alvo
FROM node:20-alpine AS runner
WORKDIR /app

# Definir NODE_ENV como produção
ENV NODE_ENV production

# Copiar a aplicação construída, código fonte TypeScript e dependências
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Criar um usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Criar diretórios para uploads e logs e definir permissões
RUN mkdir -p uploads logs && chown -R appuser:appgroup uploads logs

# Mudar para o usuário não-root
USER appuser

# Expor a porta em que a aplicação será executada (definida como 80 no docker-compose)
EXPOSE 80

# Comando para iniciar a aplicação usando TSX (interpretação direta do TypeScript)
CMD ["npx", "tsx", "server/index.ts"]

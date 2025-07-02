# Usar Node.js 18 como base
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar todo o código fonte
COPY . .

# Criar diretório para uploads
RUN mkdir -p uploads/avatars

# Build da aplicação
RUN npm run build

# Expor porta
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
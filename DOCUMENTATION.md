# VentusHub - Documentação Técnica Completa

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Banco de Dados](#banco-de-dados)
5. [Sistema de Autenticação](#sistema-de-autenticação)
6. [Pipeline de Propriedades](#pipeline-de-propriedades)
7. [Simuladores Financeiros](#simuladores-financeiros)
8. [Sistema de Upload/Storage](#sistema-de-uploadstorage)
9. [APIs e Integrações](#apis-e-integrações)
10. [Migração para Google Cloud](#migração-para-google-cloud)
11. [Deployment](#deployment)
12. [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## 📖 Visão Geral do Projeto

**VentusHub** é uma plataforma completa de gestão imobiliária com ecossistema financeiro integrado. É uma aplicação full-stack React/TypeScript com backend Express.js, apresentando gestão de propriedades, simuladores financeiros, ferramentas de análise de crédito e um pipeline de vendas multi-estágio.

### Tecnologias Principais
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL (atualmente Neon Database)
- **Storage**: Supabase Storage (para upload de documentos)
- **Autenticação**: Session-based com express-session
- **State Management**: TanStack Query para estado do servidor
- **Routing**: Wouter (router React leve)
- **Styling**: Tailwind CSS + Framer Motion para animações
- **Ícones**: Lucide React
- **PDF**: jsPDF para geração de relatórios

---

## 🏗️ Arquitetura Técnica

### Arquitetura de Alto Nível
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Databases     │
│   React/Vite    │◄──►│   Express.js    │◄──►│   PostgreSQL    │
│   Port 5173     │    │   Port 5000     │    │   (Neon)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   Supabase      │◄─────────────┘
                        │   Storage       │
                        └─────────────────┘
```

### Stack de Desenvolvimento
- **Development**: Vite dev server (5173) + Express API (5000)
- **Production**: Static files + Express API (3000/80/443)
- **Database**: PostgreSQL via Drizzle ORM
- **Session Storage**: PostgreSQL sessions table
- **File Storage**: Supabase Storage com autenticação server-side

---

## 📁 Estrutura de Pastas

```
VentusHub/
├── 📁 client/                     # Frontend React
│   ├── 📁 public/                 # Assets públicos
│   │   ├── favicon.ico
│   │   ├── manifest.json
│   │   └── sw.js                  # Service Worker
│   └── 📁 src/
│       ├── 📁 pages/              # Páginas principais da aplicação
│       │   ├── Dashboard.tsx      # Dashboard principal
│       │   ├── Clientes.tsx       # Gestão de clientes
│       │   ├── ClientDetails.tsx  # Detalhes do cliente
│       │   ├── Timeline.tsx       # Pipeline de 8 estágios
│       │   └── Simulador*.tsx     # 15+ simuladores financeiros
│       ├── 📁 components/         # Componentes reutilizáveis
│       │   ├── 📁 ui/             # Componentes shadcn/ui
│       │   ├── 📁 responsive/     # Componentes responsivos
│       │   ├── ClientModal.tsx
│       │   ├── PropertyModal.tsx
│       │   └── ...
│       ├── 📁 hooks/              # Custom React hooks
│       │   ├── useAuth.ts
│       │   ├── useNotifications.ts
│       │   └── ...
│       ├── 📁 lib/                # Utilitários e configurações
│       │   ├── supabase.ts        # Cliente Supabase
│       │   ├── formatUtils.ts     # Formatação universal
│       │   └── utils.ts
│       ├── 📁 types/              # Definições TypeScript
│       └── 📁 assets/             # Imagens e recursos
├── 📁 server/                     # Backend Express.js
│   ├── index.ts                   # Entrada principal do servidor
│   ├── auth.ts                    # Middleware de autenticação
│   ├── routes.ts                  # Definições de rotas da API
│   ├── db.ts                      # Conexão database + Drizzle
│   ├── supabase-client.ts         # Cliente Supabase server-side
│   └── ...
├── 📁 shared/                     # Código compartilhado
│   ├── schema.ts                  # Schema Drizzle do database
│   ├── liquidity.ts               # Cálculos de liquidez
│   └── ...
├── 📁 migrations/                 # Migrações do banco de dados
├── 📁 nginx/                      # Configuração Nginx
├── 📄 package.json               # Dependências e scripts
├── 📄 docker-compose.yml         # Container de desenvolvimento
├── 📄 docker-compose.production.yml  # Container de produção
├── 📄 Dockerfile                 # Imagem Docker
├── 📄 deploy-production.sh       # Script de deploy automatizado
└── 📄 .env.*                     # Variáveis de ambiente
```

---

## 🗃️ Banco de Dados

### Schema Principal (PostgreSQL)

#### 1. Tabela `users` - Autenticação
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR,
  phone VARCHAR,
  role VARCHAR DEFAULT 'user',
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 2. Tabela `properties` - Propriedades (Core)
```sql
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  sequenceNumber VARCHAR UNIQUE,          -- #00001, #00002 (numeração oficial)
  registrationNumber VARCHAR,              -- Número de registro legal
  title VARCHAR NOT NULL,
  description TEXT,
  address VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  zipCode VARCHAR,
  price DECIMAL(12,2),
  area DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  parkingSpaces INTEGER,
  propertyType VARCHAR,                    -- residential, commercial, etc.
  status VARCHAR DEFAULT 'captacao',       -- 8 estágios do pipeline
  stage INTEGER DEFAULT 1,                 -- 1-8 (estágio atual)
  clientId INTEGER REFERENCES users(id),
  assignedTo INTEGER REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 3. Tabela `propertyOwners` - Proprietários
```sql
CREATE TABLE propertyOwners (
  id SERIAL PRIMARY KEY,
  propertyId INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  document VARCHAR,                        -- CPF/CNPJ
  ownershipPercentage DECIMAL(5,2) DEFAULT 100.00,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 4. Tabela `client_documents` - Documentos dos Clientes
```sql
CREATE TABLE client_documents (
  id SERIAL PRIMARY KEY,
  clientId INTEGER REFERENCES users(id) ON DELETE CASCADE,
  fileName VARCHAR NOT NULL,               -- Nome do arquivo no storage
  originalName VARCHAR NOT NULL,           -- Nome original do upload
  fileSize INTEGER NOT NULL,               -- Tamanho em bytes
  mimeType VARCHAR NOT NULL,               -- Tipo do arquivo
  storageUrl TEXT NOT NULL,                -- URL no Supabase Storage
  uploadedBy TEXT NOT NULL,                -- ID do usuário que fez upload
  uploadedAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 5. Tabela `notifications` - Sistema de Notificações
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  userId INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR DEFAULT 'info',             -- info, warning, error, success
  priority VARCHAR DEFAULT 'medium',       -- low, medium, high, urgent
  category VARCHAR DEFAULT 'system',       -- system, property, client, etc.
  isRead BOOLEAN DEFAULT false,
  actionUrl VARCHAR,                       -- URL para ação (opcional)
  actionLabel VARCHAR,                     -- Texto do botão de ação
  metadata JSONB,                          -- Dados extras em JSON
  expiresAt TIMESTAMP,                     -- Data de expiração (opcional)
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### 6. Tabela `sessions` - Sessões de Autenticação
```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
```

### Pipeline de 8 Estágios
As propriedades seguem um pipeline rigoroso de 8 estágios:

1. **Captação** (`captacao`) - Captura inicial e dados básicos
2. **Due Diligence** (`due_diligence`) - Verificação de documentos e checks legais
3. **Mercado** (`mercado`) - Listagem no mercado e precificação
4. **Propostas** (`propostas`) - Gestão de propostas de compradores
5. **Contratos** (`contratos`) - Geração e gestão de contratos
6. **Financiamento** (`financiamento`) - Processamento de financiamento e crédito
7. **Instrumento** (`instrumento`) - Instrumentos legais finais
8. **Concluído** (`concluido`) - Transações finalizadas

---

## 🔐 Sistema de Autenticação

### Implementação
- **Session-based authentication** com `express-session`
- **Armazenamento**: Sessões persistidas na tabela PostgreSQL `sessions`
- **Middleware**: `isAuthenticated` protege todas as rotas da API
- **Frontend**: Hook `useAuth` gerencia estado de autenticação
- **Proteção**: Componente `ProtectedRoute` protege páginas

### Fluxo de Autenticação
```
1. Login → POST /api/auth/login
2. Servidor valida credenciais
3. Cria sessão no PostgreSQL
4. Retorna cookie de sessão
5. Frontend usa cookie para requisições autenticadas
6. Middleware verifica sessão em cada request
```

### Arquivos Relacionados
- `server/auth.ts` - Middleware de autenticação
- `client/src/hooks/useAuth.ts` - Hook de autenticação
- `client/src/pages/Login.tsx` - Interface de login
- `shared/schema.ts` - Schema de users e sessions

---

## 🏭 Pipeline de Propriedades

### Gestão de Estágios
Cada propriedade progride através de 8 estágios bem definidos:

#### 1. Captação
- **Propósito**: Captura inicial da propriedade
- **Dados**: Informações básicas, fotos, documentação inicial
- **Componentes**: `PropertyModal.tsx`, `PropertyCapture.tsx`

#### 2. Due Diligence
- **Propósito**: Verificação legal e documental
- **Dados**: Validação de documentos, checks legais
- **Componentes**: `DueDiligence.tsx`, `DocumentsPendingModal.tsx`

#### 3. Mercado
- **Propósito**: Listagem e precificação de mercado
- **Dados**: Preço final, marketing materials
- **Componentes**: `MarketListing.tsx`

#### 4. Propostas
- **Propósito**: Gestão de propostas de compradores
- **Dados**: Ofertas, negociações, aprovações
- **Componentes**: `Proposals.tsx`

#### 5. Contratos
- **Propósito**: Geração e gestão de contratos
- **Dados**: Contratos legais, termos e condições
- **Componentes**: `Contracts.tsx`

#### 6. Financiamento
- **Propósito**: Processamento de crédito e financiamento
- **Dados**: Análise de crédito, aprovações bancárias
- **Componentes**: `Financiamento.tsx`, simuladores de crédito

#### 7. Instrumento
- **Propósito**: Instrumentos legais finais
- **Dados**: Documentação final, transferências
- **Componentes**: `FinalInstrument.tsx`

#### 8. Concluído
- **Propósito**: Transação finalizada
- **Dados**: Arquivos finais, métricas, histórico

### Visualização
- **Timeline**: `Timeline.tsx` mostra progresso visual
- **Dashboard**: Métricas por estágio
- **Status Badges**: Indicadores visuais de estágio

---

## 💰 Simuladores Financeiros

### 15+ Simuladores Implementados

#### 1. Financiamento e Crédito
- `SimuladorFinanciamento.tsx` - Simulação de financiamento habitacional
- `SimuladorCreditoPJ.tsx` - Crédito para pessoa jurídica
- `SimuladorCGI.tsx` - Crédito com garantia imobiliária
- `SimuladorConsorcioXFinanciamento.tsx` - Comparação consórcio vs financiamento

#### 2. Sistemas de Amortização
- `SimuladorSacXPrice.tsx` - Comparação SAC vs PRICE

#### 3. Análise de Investimento
- `SimuladorPoderDeCompra.tsx` - Poder de compra do cliente
- `SimuladorRoiFlipping.tsx` - ROI para flipping imobiliário
- `SimuladorRendaPassiva.tsx` - Análise de renda passiva
- `SimuladorPotencialDeValorizacao.tsx` - Potencial de valorização

#### 4. Avaliação e Precificação
- `SimuladorValorImovel.tsx` - Avaliação de imóveis
- `SimuladorMetroQuadrado.tsx` - Análise por metro quadrado
- `SimuladorLiquidezImovel.tsx` - Análise de liquidez

#### 5. Custos e Taxas
- `SimuladorValorRegistro.tsx` - Custos de registro
- `SimuladorComissaoEMetas.tsx` - Comissões e metas

#### 6. Comparações
- `SimuladorAluguelXCompra.tsx` - Aluguel vs compra

### Funcionalidades Comuns
- **Validação**: Inputs validados em tempo real
- **Formatação**: Valores monetários formatados
- **PDF Export**: Geração de relatórios em PDF
- **Responsivo**: Interface mobile-first
- **Persistência**: Dados salvos na sessão

---

## 📎 Sistema de Upload/Storage

### Arquitetura de Storage
```
Frontend (React) → Backend (Express) → Supabase Storage
                 ↓
              PostgreSQL (metadata)
```

### Implementação

#### Frontend (`ClientDetails.tsx`)
```typescript
// Interface de documento
interface ClientDocument {
  id: number;
  clientId: number;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Upload de arquivo
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('clientId', clientId);
  
  const response = await fetch('/api/clients/documents/upload', {
    method: 'POST',
    body: formData
  });
};
```

#### Backend (`server/routes.ts`)
```typescript
// Upload endpoint
app.post("/api/clients/documents/upload", isAuthenticated, multer().single('file'), async (req, res) => {
  // 1. Recebe arquivo via multer
  // 2. Faz upload para Supabase Storage
  // 3. Salva metadata no PostgreSQL
  // 4. Retorna informações do documento
});

// Listagem de documentos
app.get("/api/clients/:id/documents", isAuthenticated, async (req, res) => {
  // Busca documentos do cliente no PostgreSQL
});

// Exclusão de documento
app.delete("/api/clients/documents/:id", isAuthenticated, async (req, res) => {
  // 1. Remove arquivo do Supabase Storage
  // 2. Remove metadata do PostgreSQL
});
```

#### Supabase Client (`server/supabase-client.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

### Fluxo de Upload
1. **Seleção**: Usuário seleciona arquivo na interface
2. **Validação**: Tipo e tamanho validados no frontend
3. **Upload**: Arquivo enviado via FormData para API
4. **Storage**: Backend faz upload para Supabase Storage
5. **Metadata**: Informações salvas no PostgreSQL
6. **Response**: Frontend atualiza lista de documentos

### Visualização de Documentos
- **Modal Viewer**: Documentos abertos em modal
- **Navegação**: Setas para navegar entre documentos
- **Suporte**: PDFs, imagens, documentos de texto
- **Download**: Link direto para download

---

## 🔗 APIs e Integrações

### APIs Internas

#### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário atual

#### Propriedades
- `GET /api/properties` - Lista propriedades
- `POST /api/properties` - Cria propriedade
- `PUT /api/properties/:id` - Atualiza propriedade
- `DELETE /api/properties/:id` - Remove propriedade
- `PUT /api/properties/:id/stage` - Atualiza estágio

#### Clientes
- `GET /api/clients` - Lista clientes
- `POST /api/clients` - Cria cliente
- `PUT /api/clients/:id` - Atualiza cliente
- `GET /api/clients/:id/documents` - Lista documentos do cliente

#### Documentos
- `POST /api/clients/documents/upload` - Upload de documento
- `DELETE /api/clients/documents/:id` - Remove documento

#### Notificações
- `GET /api/notifications` - Lista notificações
- `PUT /api/notifications/:id/read` - Marca como lida
- `DELETE /api/notifications/:id` - Remove notificação

### APIs Externas

#### Indicadores de Mercado
- **IPCA**: Índice de preços ao consumidor
- **CDI**: Certificado de Depósito Interbancário
- **IGPM**: Índice Geral de Preços do Mercado
- **Cache**: Dados cached para performance

#### Cartórios (Registro de Imóveis)
- **API**: `VITE_REGISTRO_IMOVEIS_API_KEY`
- **Função**: Consulta de registros imobiliários
- **Endpoint**: Sistema de terceiros para validação

#### IAs (Opcional)
- **OpenRouter**: `OPENROUTER_API_KEY`
- **Gemini**: `GEMINI_API_KEY`
- **Uso**: Análises auxiliares e automações

---

## ☁️ Migração para Google Cloud

### Análise da Migração Atual → Google Cloud

#### 1. Database Migration (Neon → Google Cloud SQL)

**Estado Atual (Neon Database)**:
```env
DATABASE_URL=postgresql://neondb_owner:npg_lR1EdPFtIHp3@ep-winter-frog-acjwvno9-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

**Novo Google Cloud SQL**:
```env
DATABASE_URL=postgresql://usuario:senha@IP_PRIVADO:5432/ventushub?sslmode=require
```

**Passos da Migração**:
1. **Backup Completo**: `pg_dump` do banco Neon
2. **Cloud SQL Setup**: Criar instância PostgreSQL no Google Cloud
3. **Restore**: `pg_restore` no novo banco
4. **Validação**: Verificar integridade dos dados
5. **DNS Update**: Atualizar string de conexão

#### 2. Storage Migration (Supabase → Google Cloud Storage)

**Estado Atual (Supabase Storage)**:
```env
SUPABASE_URL=https://hocaexectpwpapnrmhxp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Novo Google Cloud Storage**:
```env
GOOGLE_CLOUD_PROJECT_ID=ventushub-project
GOOGLE_CLOUD_STORAGE_BUCKET=ventushub-documents
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Mudanças Necessárias no Código**:

**Arquivo**: `server/storage-client.ts` (NOVO)
```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

export { storage, bucket };
```

**Arquivo**: `server/routes.ts` (MODIFICAR)
```typescript
// ANTES (Supabase)
import { supabaseAdmin } from './supabase-client';

// DEPOIS (Google Cloud)
import { bucket } from './storage-client';

// Upload para Google Cloud Storage
const file = bucket.file(`documents/${clientId}/${fileName}`);
const stream = file.createWriteStream({
  metadata: {
    contentType: req.file.mimetype,
  },
});
```

#### 3. Dependências a Atualizar

**Remover**:
```json
{
  "@supabase/supabase-js": "^2.38.4"
}
```

**Adicionar**:
```json
{
  "@google-cloud/storage": "^7.0.0",
  "@google-cloud/secret-manager": "^5.0.0"
}
```

#### 4. Configuração de Ambiente

**Desenvolvimento (Local)**:
```env
# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=ventushub-dev
GOOGLE_CLOUD_STORAGE_BUCKET=ventushub-dev-documents
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account-dev.json

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ventushub_dev?sslmode=disable
```

**Produção (Google Cloud)**:
```env
# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=ventushub-prod
GOOGLE_CLOUD_STORAGE_BUCKET=ventushub-prod-documents
# Service account automaticamente detectada no GCP

# Database (Cloud SQL)
DATABASE_URL=postgresql://user:pass@10.x.x.x:5432/ventushub?sslmode=require
```

#### 5. Checklist de Migração

**Preparação**:
- [ ] Criar projeto no Google Cloud Platform
- [ ] Configurar Cloud SQL (PostgreSQL)
- [ ] Configurar Cloud Storage bucket
- [ ] Gerar service account keys
- [ ] Configurar IAM permissions

**Migration Database**:
- [ ] Fazer backup completo do Neon Database
- [ ] Criar dump com `pg_dump`
- [ ] Setup Cloud SQL instance
- [ ] Restore dados com `pg_restore`
- [ ] Validar integridade dos dados
- [ ] Testar todas as queries

**Migration Storage**:
- [ ] Baixar todos os arquivos do Supabase Storage
- [ ] Upload para Google Cloud Storage
- [ ] Atualizar URLs no banco de dados
- [ ] Modificar código para usar GCS
- [ ] Testar upload/download/delete

**Código**:
- [ ] Remover dependências Supabase
- [ ] Adicionar dependências Google Cloud
- [ ] Atualizar `server/routes.ts`
- [ ] Criar novo `storage-client.ts`
- [ ] Atualizar variáveis de ambiente
- [ ] Testar todas as funcionalidades

**Deploy**:
- [ ] Atualizar `.env.production`
- [ ] Deploy no Google Cloud Run/Compute Engine
- [ ] Configurar Load Balancer
- [ ] Setup SSL certificates
- [ ] Configurar monitoring

---

## 🚀 Deployment

### Ambiente Atual (Docker + Nginx)

#### Produção via Docker
```bash
# Deploy automatizado
./deploy-production.sh

# Manual
docker-compose -f docker-compose.production.yml up --build -d
```

#### Configuração Nginx (`nginx/nginx.conf`)
```nginx
upstream ventushub_backend {
    server app:3000;
}

server {
    listen 80;
    server_name ventushub.com.br www.ventushub.com.br;
    
    # Static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
    
    # API routes
    location /api {
        proxy_pass http://ventushub_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Migração para Google Cloud Platform

#### Opção 1: Google Cloud Run (Recomendado)
```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/ventushub:$COMMIT_SHA', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/ventushub:$COMMIT_SHA']
- name: 'gcr.io/cloud-builders/gcloud'
  args: ['run', 'deploy', 'ventushub', '--image', 'gcr.io/$PROJECT_ID/ventushub:$COMMIT_SHA', '--region', 'us-central1']
```

#### Opção 2: Google Kubernetes Engine (GKE)
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ventushub
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ventushub
  template:
    metadata:
      labels:
        app: ventushub
    spec:
      containers:
      - name: ventushub
        image: gcr.io/PROJECT_ID/ventushub:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ventushub-secrets
              key: database-url
```

#### Opção 3: Compute Engine + Load Balancer
```bash
# Setup VM
gcloud compute instances create ventushub-vm \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --machine-type=e2-standard-2 \
    --zone=us-central1-a

# Deploy via SSH
gcloud compute ssh ventushub-vm --command="cd /opt/ventushub && docker-compose up -d"
```

---

## 🔧 Variáveis de Ambiente

### Estrutura de Arquivos
- `.env.example` - Template com exemplos
- `.env.local` - Desenvolvimento local (não commitado)
- `.env.production` - Produção (não commitado)
- `.env` - Arquivo ativo (copiado de .env.local ou .env.production)

### Configurações Atuais

#### `.env.production` (Estado Atual)
```env
# VentusHub - Produção
NODE_ENV=production
PORT=3000

# Banco de dados Neon
DATABASE_URL=postgresql://neondb_owner:npg_lR1EdPFtIHp3@ep-winter-frog-acjwvno9-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Segurança - Sessões & JWT
SESSION_SECRET=042d81233780d9acd6b8f6f04577e0b5
JWT_SECRET=9271e28169900e8c0246937d9a7ffd6d

# Supabase (Armazenamento de arquivos)
VITE_SUPABASE_URL=https://hocaexectpwpapnrmhxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase - Servidor (para upload de documentos)
SUPABASE_URL=https://hocaexectpwpapnrmhxp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# APIs de IA
OPENROUTER_API_KEY=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
GEMINI_API_KEY=AIzaSyBZ9scOwZoUBejV_V-bhSNgKd0wQT17fNw

# API Externa
VITE_REGISTRO_IMOVEIS_API_KEY=87|KtbDAR2FtvLIHtVc0LVi8YPIXsDxz882T1HJNEA2
```

#### Configuração Pós-Migração Google Cloud
```env
# VentusHub - Produção Google Cloud
NODE_ENV=production
PORT=8080

# Google Cloud SQL
DATABASE_URL=postgresql://ventushub_user:SECURE_PASSWORD@10.x.x.x:5432/ventushub?sslmode=require

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=ventushub-prod
GOOGLE_CLOUD_STORAGE_BUCKET=ventushub-prod-documents
# GOOGLE_APPLICATION_CREDENTIALS não necessário no GCP (service account automática)

# Segurança - Sessões & JWT (GERAR NOVAS)
SESSION_SECRET=NOVA_CHAVE_256_BITS_AQUI
JWT_SECRET=NOVA_CHAVE_JWT_AQUI

# APIs de IA (manter)
OPENROUTER_API_KEY=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
GEMINI_API_KEY=AIzaSyBZ9scOwZoUBejV_V-bhSNgKd0wQT17fNw

# API Externa (manter)
VITE_REGISTRO_IMOVEIS_API_KEY=87|KtbDAR2FtvLIHtVc0LVi8YPIXsDxz882T1HJNEA2
```

---

## 📊 Scripts e Comandos

### Desenvolvimento
```bash
npm run dev          # Vite dev server + Express API
npm run dev:no-vite  # Apenas backend (modo produção)
npm run check        # TypeScript type checking
```

### Database
```bash
npm run db:push      # Aplicar mudanças no schema
```

### Build & Deploy
```bash
npm run build        # Build frontend + bundle backend
npm run start        # Servidor de produção
./deploy-production.sh  # Deploy automatizado
```

### Docker
```bash
# Desenvolvimento
docker-compose up --build

# Produção
docker-compose -f docker-compose.production.yml up --build -d

# Logs
docker-compose logs -f
```

---

## ⚠️ Considerações Importantes

### Segurança
- **Secrets**: Todas as chaves devem ser rotacionadas na migração
- **CORS**: Configurar origins permitidas no Google Cloud
- **HTTPS**: Certificados SSL obrigatórios
- **Service Accounts**: Permissions mínimas necessárias

### Performance
- **CDN**: Configurar Google Cloud CDN para assets estáticos
- **Database**: Connection pooling e otimizações de query
- **Storage**: Caching de arquivos frequentemente acessados
- **Monitoring**: Google Cloud Monitoring e alertas

### Backup & Recovery
- **Database**: Backups automáticos no Cloud SQL
- **Storage**: Versionamento no Cloud Storage
- **Application**: Snapshots regulares
- **Disaster Recovery**: Plano de recuperação documentado

### Escalabilidade
- **Auto-scaling**: Configurar no Cloud Run/GKE
- **Load Balancing**: Distribuição de tráfego
- **Database Scaling**: Read replicas se necessário
- **Monitoring**: Métricas de performance e usage

---

## 🧪 Testes e Validação

### Pré-Deploy Checklist
- [ ] Todos os endpoints da API funcionando
- [ ] Upload/download de documentos operacional
- [ ] Autenticação e sessões funcionando
- [ ] Pipeline de propriedades completo
- [ ] Simuladores financeiros calculando corretamente
- [ ] Notificações sendo entregues
- [ ] Responsividade em todos os dispositivos

### Pós-Migration Checklist
- [ ] Database migrado 100% sem perda de dados
- [ ] Todos os arquivos migrados para Google Cloud Storage
- [ ] URLs de documentos atualizadas
- [ ] Performance igual ou melhor que antes
- [ ] Backup e recovery testados
- [ ] Monitoring configurado e alertas funcionando

---

## 🆘 Suporte e Manutenção

### Logs Importantes
```bash
# Application logs
docker-compose logs ventushub-app

# Nginx logs
docker-compose logs ventushub-nginx

# Database logs (no Google Cloud Console)

# Storage logs (no Google Cloud Console)
```

### Troubleshooting Comum
1. **Database Connection**: Verificar string de conexão e firewall
2. **File Upload**: Verificar permissions do service account
3. **Session Issues**: Validar configuração do express-session
4. **CORS Problems**: Verificar origins permitidas
5. **SSL Certificate**: Validar certificados e domínios

---

## 📞 Contatos Técnicos

### Informações do Projeto
- **Nome**: VentusHub
- **Domínio**: ventushub.com.br
- **Repositório**: GitHub (URL definir)
- **Ambiente Atual**: Neon Database + Supabase Storage
- **Ambiente Alvo**: Google Cloud Platform

### Dados Importantes para Migração
- **Database Size**: Consultar via `SELECT pg_size_pretty(pg_database_size('neondb'));`
- **Storage Usage**: Verificar no dashboard Supabase
- **Monthly Traffic**: Analisar logs de acesso
- **Peak Usage**: Identificar horários de maior uso

---

*Esta documentação deve ser atualizada conforme o projeto evolui e após a migração para Google Cloud Platform.*
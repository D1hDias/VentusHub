# API de Clientes - VentusHub

## Visão Geral

Sistema completo de gestão de clientes para corretores imobiliários, integrado ao VentusHub. Inclui validação robusta, paginação, filtros avançados e funcionalidades para futuras integrações com propostas e contratos.

## Arquitetura Implementada

### 🗄️ Schema de Banco de Dados

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  full_name VARCHAR NOT NULL,
  cpf VARCHAR UNIQUE NOT NULL,
  birth_date DATE,
  email VARCHAR UNIQUE NOT NULL,
  phone_primary VARCHAR NOT NULL,
  phone_secondary VARCHAR,
  address_street VARCHAR NOT NULL,
  address_number VARCHAR NOT NULL,
  address_complement VARCHAR,
  address_neighborhood VARCHAR NOT NULL,
  address_city VARCHAR NOT NULL,
  address_state VARCHAR NOT NULL,
  address_zip VARCHAR NOT NULL,
  marital_status VARCHAR, -- 'Solteiro', 'Casado', 'Divorciado', 'Viúvo'
  profession VARCHAR,
  monthly_income DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices otimizados
CREATE INDEX clients_cpf_idx ON clients(cpf);
CREATE INDEX clients_email_idx ON clients(email);
CREATE INDEX clients_created_at_idx ON clients(created_at);
CREATE INDEX clients_user_id_idx ON clients(user_id);
```

### 📊 Interface TypeScript

```typescript
interface Client {
  id?: number;
  userId?: number;
  fullName: string;
  cpf: string;
  birthDate?: string;
  email: string;
  phonePrimary: string;
  phoneSecondary?: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  maritalStatus?: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo';
  profession?: string;
  monthlyIncome?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

## 🔗 Endpoints da API

### 1. Listar Clientes

**`GET /api/clients`**

Lista clientes do usuário autenticado com paginação e filtros avançados.

**Query Parameters:**
- `page` (number, opcional): Página atual (default: 1)
- `limit` (number, opcional): Itens por página (default: 50, máx: 100)
- `search` (string, opcional): Busca por nome, email, CPF ou telefone
- `maritalStatus` (string, opcional): Filtrar por estado civil
- `city` (string, opcional): Filtrar por cidade
- `state` (string, opcional): Filtrar por estado (UF)
- `orderBy` (string, opcional): Campo de ordenação ('name' | 'created_at')
- `orderDirection` (string, opcional): Direção da ordenação ('asc' | 'desc')

**Resposta de Sucesso (200):**
```json
{
  "clients": [
    {
      "id": 1,
      "fullName": "João Silva Santos",
      "cpf": "12345678901",
      "email": "joao@email.com",
      "phonePrimary": "11999999999",
      "addressCity": "São Paulo",
      "addressState": "SP",
      "maritalStatus": "Casado",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### 2. Buscar Cliente por ID

**`GET /api/clients/:id`**

Busca cliente específico com validação de ownership.

**Parâmetros:**
- `id` (number): ID do cliente

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "fullName": "João Silva Santos",
  "cpf": "12345678901",
  "birthDate": "1985-03-15",
  "email": "joao@email.com",
  "phonePrimary": "11999999999",
  "phoneSecondary": "1133334444",
  "addressStreet": "Rua das Flores",
  "addressNumber": "123",
  "addressComplement": "Apto 45",
  "addressNeighborhood": "Centro",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "addressZip": "01234567",
  "maritalStatus": "Casado",
  "profession": "Engenheiro",
  "monthlyIncome": 15000.00,
  "notes": "Cliente interessado em imóveis comerciais",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### 3. Criar Cliente

**`POST /api/clients`**

Cria novo cliente com validação completa.

**Body (JSON):**
```json
{
  "fullName": "Maria Santos Silva",
  "cpf": "98765432100",
  "birthDate": "1990-07-20",
  "email": "maria@email.com",
  "phonePrimary": "11888888888",
  "phoneSecondary": "1122223333",
  "addressStreet": "Avenida Paulista",
  "addressNumber": "1000",
  "addressComplement": "Conjunto 101",
  "addressNeighborhood": "Bela Vista",
  "addressCity": "São Paulo",
  "addressState": "SP",
  "addressZip": "01310100",
  "maritalStatus": "Solteiro",
  "profession": "Médica",
  "monthlyIncome": 20000,
  "notes": "Interessada em apartamentos de alto padrão"
}
```

**Validações Aplicadas:**
- ✅ CPF único e válido (dígitos verificadores)
- ✅ Email único e formato válido
- ✅ Todos os campos obrigatórios preenchidos
- ✅ Estado civil em lista válida
- ✅ CEP com 8 dígitos
- ✅ UF com 2 caracteres

**Resposta de Sucesso (201):**
```json
{
  "id": 2,
  "fullName": "Maria Santos Silva",
  "cpf": "98765432100",
  "email": "maria@email.com",
  "createdAt": "2025-01-15T11:00:00Z"
}
```

**Erros Possíveis:**
- `409`: CPF ou email já cadastrado
- `400`: Dados inválidos (com detalhes dos erros)

### 4. Atualizar Cliente

**`PUT /api/clients/:id`**

Atualiza cliente existente com validação de ownership e unicidade.

**Parâmetros:**
- `id` (number): ID do cliente

**Body (JSON - todos os campos opcionais):**
```json
{
  "fullName": "Maria Santos Silva Oliveira",
  "email": "maria.oliveira@email.com",
  "phonePrimary": "11777777777",
  "maritalStatus": "Casado",
  "monthlyIncome": 25000
}
```

**Validações:**
- ✅ Cliente pertence ao usuário autenticado
- ✅ CPF único (se alterado)
- ✅ Email único (se alterado)
- ✅ Todos os campos seguem regras de validação

**Resposta de Sucesso (200):**
```json
{
  "id": 2,
  "fullName": "Maria Santos Silva Oliveira",
  "email": "maria.oliveira@email.com",
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### 5. Deletar Cliente

**`DELETE /api/clients/:id`**

Remove cliente com validação de ownership.

**Parâmetros:**
- `id` (number): ID do cliente

**Resposta de Sucesso (200):**
```json
{
  "message": "Cliente deletado com sucesso"
}
```

### 6. Estatísticas de Clientes

**`GET /api/clients/stats`**

Retorna estatísticas dos clientes do usuário autenticado.

**Resposta de Sucesso (200):**
```json
{
  "total": 150,
  "byMaritalStatus": [
    { "maritalStatus": "Casado", "count": 60 },
    { "maritalStatus": "Solteiro", "count": 45 },
    { "maritalStatus": "Divorciado", "count": 30 },
    { "maritalStatus": "Viúvo", "count": 15 }
  ],
  "byCity": [
    { "city": "São Paulo", "count": 80 },
    { "city": "Rio de Janeiro", "count": 40 },
    { "city": "Belo Horizonte", "count": 20 },
    { "city": "Brasília", "count": 10 }
  ]
}
```

### 7. Clientes Recentes

**`GET /api/clients/recent`**

Lista clientes recentes do usuário.

**Query Parameters:**
- `limit` (number, opcional): Número máximo de clientes (default: 10, máx: 50)

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 5,
    "fullName": "Carlos Mendes",
    "email": "carlos@email.com",
    "phonePrimary": "11666666666",
    "addressCity": "São Paulo",
    "createdAt": "2025-01-15T14:30:00Z"
  }
]
```

### 8. Validar CPF

**`POST /api/clients/validate-cpf`**

Valida CPF em tempo real (para formulários).

**Body (JSON):**
```json
{
  "cpf": "12345678901",
  "excludeId": 5  // Opcional: excluir cliente da validação
}
```

**Resposta de Sucesso (200):**
```json
{
  "isValid": false,
  "message": "CPF já cadastrado"
}
```

### 9. Validar Email

**`POST /api/clients/validate-email`**

Valida email em tempo real (para formulários).

**Body (JSON):**
```json
{
  "email": "teste@email.com",
  "excludeId": 5  // Opcional: excluir cliente da validação
}
```

**Resposta de Sucesso (200):**
```json
{
  "isValid": true,
  "message": "Email disponível"
}
```

## 🔒 Segurança

### Autenticação
- ✅ Todas as rotas protegidas com middleware `isAuthenticated`
- ✅ Session-based authentication
- ✅ Validação de ownership em todas as operações

### Validação de Dados
- ✅ Validação robusta com Zod schemas
- ✅ Sanitização de CPF (remove formatação)
- ✅ Normalização de email (lowercase)
- ✅ Validação de dígitos verificadores do CPF
- ✅ Prevenção de SQL injection (Drizzle ORM)

### Rate Limiting & Performance
- ✅ Limits por página (máx 100 itens)
- ✅ Timeout de operações de banco (8s)
- ✅ Índices otimizados para consultas
- ✅ Queries eficientes com paginação

## 📈 Performance

### Otimizações Implementadas
- **Índices estratégicos**: CPF, email, created_at, user_id
- **Paginação eficiente**: LIMIT/OFFSET com contagem total
- **Busca otimizada**: ILIKE para busca textual case-insensitive
- **Queries preparadas**: Drizzle ORM com prepared statements
- **Timeout management**: Wrapper para operações de banco

### Métricas Esperadas
- **Busca simples**: < 100ms
- **Busca com filtros**: < 200ms
- **Criação de cliente**: < 150ms
- **Listagem paginada**: < 250ms

## 🚀 Escalabilidade

### Preparação para Futuro
- **Foreign keys prontas**: Para integração com proposals e contracts
- **Schema extensível**: Campos opcionais permitem evolução
- **API versioning ready**: Estrutura permite versionamento
- **Audit trail**: created_at/updated_at para rastreamento

### Relacionamentos Futuros
```sql
-- Preparado para:
ALTER TABLE proposals ADD COLUMN client_id INTEGER REFERENCES clients(id);
ALTER TABLE contracts ADD COLUMN buyer_client_id INTEGER REFERENCES clients(id);
ALTER TABLE property_interests ADD COLUMN client_id INTEGER REFERENCES clients(id);
```

## 🧪 Exemplos de Uso

### Busca Avançada
```bash
# Buscar clientes casados em São Paulo, ordenados por nome
GET /api/clients?maritalStatus=Casado&city=São Paulo&orderBy=name&orderDirection=asc

# Buscar por CPF específico
GET /api/clients?search=12345678901

# Paginação
GET /api/clients?page=2&limit=25
```

### Workflow Completo
```bash
# 1. Validar CPF antes de criar
POST /api/clients/validate-cpf
Body: {"cpf": "12345678901"}

# 2. Criar cliente
POST /api/clients
Body: {dados completos do cliente}

# 3. Buscar clientes com filtros
GET /api/clients?city=São Paulo

# 4. Atualizar cliente
PUT /api/clients/123
Body: {campos a atualizar}

# 5. Ver estatísticas
GET /api/clients/stats
```

## 📋 Checklist de Implementação

### ✅ Backend Completo
- [x] Schema de banco de dados
- [x] Tabela clients com índices otimizados
- [x] Validação de CPF com dígitos verificadores
- [x] API endpoints completos (CRUD + estatísticas)
- [x] Paginação e filtros avançados
- [x] Validação em tempo real (CPF/email)
- [x] Error handling específico
- [x] Logs de auditoria
- [x] Performance otimizada
- [x] Segurança (autenticação + ownership)

### 📝 Próximos Passos (Frontend)
- [ ] Página de listagem de clientes
- [ ] Formulário de cadastro/edição
- [ ] Busca e filtros
- [ ] Dashboard de estatísticas
- [ ] Integração com proposals/contracts

## 🛠️ Comandos para Deploy

```bash
# 1. Aplicar schema ao banco
npm run db:push

# 2. Verificar tipos
npm run check

# 3. Build para produção
npm run build

# 4. Deploy
npm run start
```

## 🐛 Troubleshooting

### Erros Comuns

**CPF inválido:**
- Verificar formato (11 dígitos)
- Validar dígitos verificadores
- Não aceitar CPFs conhecidos inválidos (000.000.000-00)

**Email duplicado:**
- Verificar unicidade na base
- Normalizar para lowercase antes de comparar

**Performance lenta:**
- Verificar se índices foram criados
- Limitar resultados com paginação
- Usar filtros específicos

### Logs de Debug
```bash
# Habilitar logs detalhados
DEBUG=ventushub:clients npm run dev
```

---

**VentusHub - Sistema de Clientes v1.0**  
Implementação completa seguindo padrões arquiteturais estabelecidos.
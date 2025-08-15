# API de Registros - VentusHub

Documentação completa da API de registros imobiliários implementada no VentusHub.

## Visão Geral

A API de Registros gerencia a etapa final do fluxo imobiliário: o registro dos imóveis em cartórios. Esta implementação inclui:

- ✅ CRUD completo de registros
- ✅ Integração mock com cartórios (simulação de APIs externas)
- ✅ Sistema de status e protocolo
- ✅ Validação com Zod schemas
- ✅ Autenticação e autorização
- ✅ Error handling consistente
- ✅ Logs detalhados

## Estrutura de Dados

### Tabela `registros`

```sql
registros {
  id: SERIAL PRIMARY KEY
  property_id: INTEGER REFERENCES properties(id) ON DELETE CASCADE
  user_id: INTEGER REFERENCES users(id)
  
  -- Dados do Registro
  protocolo: VARCHAR              # Protocolo gerado pelo cartório
  cartorio_nome: VARCHAR NOT NULL # Nome do cartório selecionado
  cartorio_url: VARCHAR           # URL de consulta do cartório
  data_envio: TIMESTAMP           # Data de envio dos documentos
  
  -- Status: pendente_envio | em_analise | aguardando_pagamento | registrado | indeferido
  status: VARCHAR NOT NULL DEFAULT 'pendente_envio'
  
  -- Dados adicionais
  observacoes: TEXT               # Observações do processo
  valor_taxas: DECIMAL(10,2)      # Valor das taxas calculadas
  prazo_estimado: INTEGER         # Prazo em dias úteis
  
  -- Mock integration (simula dados de APIs externas)
  mock_status: JSONB              # Dados simulados de consultas
  
  -- Timestamps
  created_at: TIMESTAMP DEFAULT NOW()
  updated_at: TIMESTAMP DEFAULT NOW()
}
```

### Status Possíveis

| Status | Descrição |
|--------|-----------|
| `pendente_envio` | Documentação ainda não enviada |
| `em_analise` | Documentos em análise pelo registrador |
| `aguardando_pagamento` | Análise concluída, aguardando pagamento |
| `registrado` | Registro concluído com sucesso |
| `indeferido` | Registro indeferido, necessária correção |

## Endpoints Implementados

### 1. Listar Registros do Usuário

```http
GET /api/registros
Authorization: Session-based
```

**Resposta:**
```json
[
  {
    "id": 1,
    "propertyId": 15,
    "userId": 1,
    "protocolo": "2024123456789",
    "cartorioNome": "1º Cartório de Registro de Imóveis de São Paulo",
    "cartorioUrl": "https://www.1crispdr.sp.gov.br",
    "dataEnvio": "2024-08-15T10:30:00Z",
    "status": "em_analise",
    "observacoes": "Documentação completa enviada",
    "valorTaxas": "1250.50",
    "prazoEstimado": 15,
    "mockStatus": { ... },
    "createdAt": "2024-08-15T10:00:00Z",
    "updatedAt": "2024-08-15T10:30:00Z",
    "property": {
      "id": 15,
      "sequenceNumber": "#00015",
      "address": "Rua das Flores, 123 - Jardim América, São Paulo/SP",
      "value": "850000.00"
    }
  }
]
```

### 2. Buscar Registro Específico

```http
GET /api/registros/:id
Authorization: Session-based
```

**Resposta:** Objeto registro completo com dados da propriedade.

### 3. Criar Novo Registro

```http
POST /api/registros
Content-Type: application/json
Authorization: Session-based
```

**Body:**
```json
{
  "propertyId": 15,
  "cartorioNome": "1º Cartório de Registro de Imóveis de São Paulo",
  "cartorioUrl": "https://www.1crispdr.sp.gov.br",
  "status": "em_analise",
  "observacoes": "Registro iniciado com documentação completa",
  "prazoEstimado": 15
}
```

**Validações:**
- `propertyId`: Obrigatório, propriedade deve existir e pertencer ao usuário
- `cartorioNome`: Mínimo 3 caracteres
- `status`: Enum válido
- `prazoEstimado`: 1-365 dias (opcional)

### 4. Atualizar Registro

```http
PUT /api/registros/:id
Content-Type: application/json
Authorization: Session-based
```

**Body:** Dados parciais para atualização (schema `updateRegistroSchema`).

### 5. Remover Registro

```http
DELETE /api/registros/:id
Authorization: Session-based
```

### 6. Consultar Status Mock

```http
GET /api/registros/:id/status
Authorization: Session-based
```

Simula consulta externa ao cartório e retorna:

```json
{
  "registro": {
    "id": 1,
    "protocolo": "2024123456789",
    "cartorioNome": "1º Cartório..."
  },
  "statusAtual": "em_analise",
  "statusConsultado": {
    "protocolo": "2024123456789",
    "status": "em_analise",
    "dataConsulta": "2024-08-15T14:30:00Z",
    "observacoes": "Documentação em análise pelo registrador",
    "prazoEstimado": 12,
    "proximaEtapa": "Análise documental em andamento",
    "cartorioResponse": {
      "timestamp": 1692111000000,
      "servidor": "cartorio-api-2",
      "versaoApi": "2.1.0"
    }
  }
}
```

### 7. Atualizar Status Mock

```http
POST /api/registros/:id/update-status
Content-Type: application/json
Authorization: Session-based
```

**Body:**
```json
{
  "novoStatus": "registrado"
}
```

Simula webhook do cartório atualizando status automaticamente.

### 8. Listar Registros por Propriedade

```http
GET /api/properties/:id/registros
Authorization: Session-based
```

### 9. Listar Cartórios Disponíveis

```http
GET /api/cartorios
Authorization: Session-based
```

**Resposta:**
```json
[
  {
    "id": 1,
    "nome": "1º Cartório de Registro de Imóveis de São Paulo",
    "url": "https://www.1crispdr.sp.gov.br",
    "regiao": "São Paulo - Centro",
    "taxaBase": 850.00
  }
]
```

### 10. Consultar Taxas de Cartório

```http
POST /api/cartorios/consultar-taxas
Content-Type: application/json
Authorization: Session-based
```

**Body:**
```json
{
  "cartorioNome": "1º Cartório de Registro de Imóveis de São Paulo",
  "valorImovel": 850000
}
```

**Resposta:**
```json
{
  "cartorio": "1º Cartório...",
  "valorImovel": 850000,
  "detalhamento": {
    "itbi": 17000.00,
    "registro": 3400.00,
    "certidoes": 150.00,
    "emolumentos": 280.00
  },
  "totalTaxas": 20830.00,
  "validadeConsulta": "2024-08-22T14:30:00Z",
  "observacoes": "Valores calculados com base na tabela vigente..."
}
```

## Integração Mock

### Funções de Simulação

1. **`consultarStatusCartorio(protocolo)`**
   - Simula consulta externa de status
   - Retorna dados baseados em seed do protocolo
   - Inclui delay realístico (500-2000ms)

2. **`enviarDocumentosCartorio(dados)`**
   - Simula envio de documentação
   - Gera protocolo automático
   - Calcula taxas baseadas no valor do imóvel

3. **`forcarAtualizacaoStatus(protocolo, novoStatus)`**
   - Simula webhook do cartório
   - Permite testes de mudança de status

4. **`consultarTaxasCartorio(cartorio, valor)`**
   - Simula cálculo de taxas
   - Detalhamento realístico (ITBI, registro, etc.)

### Cartórios Simulados

- 1º Cartório de Registro de Imóveis de São Paulo
- 2º Cartório de Registro de Imóveis de São Paulo  
- Cartório de Registro de Imóveis de Guarulhos
- Cartório de Registro de Imóveis de Santos

## Segurança

### Validações Implementadas

- ✅ Autenticação obrigatória em todas as rotas
- ✅ Verificação de ownership (usuário pode acessar apenas seus registros)
- ✅ Validação de schema com Zod
- ✅ Sanitização de inputs
- ✅ Prevenção de SQL injection (via Drizzle ORM)

### Error Handling

- ✅ Tratamento de erros de validação (400)
- ✅ Verificação de permissões (403)
- ✅ Recursos não encontrados (404)
- ✅ Erros internos (500)
- ✅ Logs detalhados para debug

## Integração com Timeline

Quando um registro é criado, automaticamente:

```javascript
await storage.createTimelineEntry({
  propertyId: validatedData.propertyId,
  stage: 8, // Estágio de Registro
  status: "active",
  title: "Registro no Cartório",
  description: `Registro iniciado no ${validatedData.cartorioNome}`,
});
```

## Próximos Passos

### Para Produção

1. **Integração Real com Cartórios**
   - Substituir funções mock por APIs reais
   - Implementar autenticação com cartórios
   - Configurar webhooks reais

2. **Notificações**
   - Email/SMS para mudanças de status
   - Lembretes de prazos
   - Alertas de pendências

3. **Relatórios**
   - Dashboard de registros
   - Relatórios de tempo médio
   - Análise de cartórios

4. **Automatização**
   - Upload automático de documentos
   - Integração com sistemas bancários
   - Workflow automatizado

## Comandos de Teste

Para aplicar as mudanças no banco:

```bash
npm run db:push
```

Para testar as APIs:

```bash
# Listar registros
curl -X GET http://localhost:5000/api/registros \
  -H "Cookie: connect.sid=SESSION_ID"

# Criar registro
curl -X POST http://localhost:5000/api/registros \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=SESSION_ID" \
  -d '{
    "propertyId": 1,
    "cartorioNome": "1º Cartório de Registro de Imóveis de São Paulo",
    "status": "em_analise"
  }'
```

---

## Arquivos Implementados

1. **`/shared/schema.ts`** - Tabela e validações
2. **`/server/storage.ts`** - Métodos de banco de dados  
3. **`/server/routes.ts`** - Rotas da API
4. **`/server/registro-mock.ts`** - Funções de simulação
5. **`/REGISTRO-API-DOCS.md`** - Esta documentação

A implementação está pronta para uso e testes, seguindo todos os padrões estabelecidos no VentusHub.
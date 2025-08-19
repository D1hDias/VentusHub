# DocumentsPendingModal - Componente Universal

## 📋 Visão Geral

O `DocumentsPendingModal` é um componente React universal e altamente configurável para gerenciar pendências de documentos e campos em qualquer tipo de entidade do sistema VentusHub (propriedades, clientes, contratos, etc.).

## ✨ Características Principais

- **Universal**: Funciona com qualquer tipo de entidade
- **Configurável**: Documentos e campos totalmente personalizáveis
- **Responsivo**: Interface adaptável para mobile e desktop
- **Upload Integrado**: Sistema de upload direto para Supabase
- **Validação Flexível**: Validação customizada por entidade
- **Notificações**: Integração com sistema de notificações
- **TypeScript**: Tipagem completa e segura

## 🏗️ Arquitetura

### Interfaces Principais

```typescript
interface Entity {
  id?: string | number;
  sequenceNumber?: string;
  stage?: number;
  type?: string;
  [key: string]: any;
}

interface DocumentDefinition {
  key: string;
  name: string;
  icon: string;
  description: string;
  category?: string;
  required?: boolean;
  stages?: number[];
  propertyTypes?: string[];
  acceptedFormats?: string[];
  maxSize?: number;
}

interface FieldDefinition {
  key: string;
  name: string;
  required?: boolean;
  stages?: number[];
  validator?: (value: any) => boolean;
}

interface PendencyConfig {
  entityType: 'property' | 'client' | 'contract' | 'generic';
  stage?: number;
  documents?: DocumentDefinition[];
  fields?: FieldDefinition[];
  customValidation?: (entity: Entity) => {
    pendingDocs: DocumentDefinition[];
    pendingFields: FieldDefinition[];
  };
}
```

## 🚀 Como Usar

### 1. Uso Básico - Propriedade

```typescript
import { DocumentsPendingModal, createPropertyDocumentConfig } from '@/components/DocumentsPendingModal';

function PropertyPage() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const property = {
    id: 123,
    sequenceNumber: '00123',
    stage: 2,
    type: 'apartamento'
  };

  const config = createPropertyDocumentConfig(2); // Etapa Due Diligence

  return (
    <DocumentsPendingModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      entity={property}
      config={config}
      onDocumentUploaded={(docKey) => {
        console.log(`Documento ${docKey} enviado`);
      }}
    />
  );
}
```

### 2. Cliente com Documentos Personalizados

```typescript
const customDocs: DocumentDefinition[] = [
  {
    key: 'CNPJ',
    name: 'CNPJ',
    icon: '🏢',
    description: 'Cartão CNPJ atualizado',
    required: true,
    acceptedFormats: ['.pdf'],
    maxSize: 3
  }
];

const config = createClientDocumentConfig(customDocs);
```

### 3. Validação Customizada

```typescript
const customValidation = (entity: Entity) => {
  const pendingDocs: DocumentDefinition[] = [];
  const pendingFields: FieldDefinition[] = [];

  // Lógica condicional baseada no estado da entidade
  if (!entity.isPaid) {
    pendingDocs.push({
      key: 'COMPROVANTE_PAGAMENTO',
      name: 'Comprovante de Pagamento',
      icon: '💳',
      description: 'Comprovante de pagamento',
      required: true
    });
  }

  return { pendingDocs, pendingFields };
};

const config = createGenericDocumentConfig('generic', documents, fields, customValidation);
```

## 📁 Estrutura de Arquivos

```
client/src/components/
├── DocumentsPendingModal.tsx           # Componente principal
├── DocumentsPendingModal.example.tsx   # Exemplos de uso
└── ui/                                 # Componentes base do shadcn/ui
    ├── dialog.tsx
    ├── button.tsx
    ├── badge.tsx
    └── ...
```

## 🔧 Configurações Padrão

### Documentos de Propriedade

- **Ônus Reais**: Etapas 1, 2, 3
- **Espelho de IPTU**: Etapas 1, 2
- **RG/CNH dos Proprietários**: Etapas 1, 2, 6
- **Certidão de Estado Civil**: Etapas 2, 6
- **Comprovante de Residência**: Etapas 1, 2
- **Escritura/Registro**: Etapas 2, 7
- **Contrato de Compra e Venda**: Etapas 5, 6, 7

### Campos de Propriedade

- **Básicos**: Tipo, endereço, número, bairro, cidade
- **Financeiros**: Valor do imóvel
- **Legais**: Dados dos proprietários, número de matrícula

## 📤 Sistema de Upload

### Configuração Automática

O sistema automaticamente:
- Detecta o tipo de entidade (`property`, `client`, `contract`)
- Cria buckets no Supabase: `{entityType}-documents`
- Define endpoints da API: `/api/{entityType}-documents`
- Organiza arquivos por ID da entidade

### Formatos Suportados

- **PDF**: Documentos oficiais
- **JPG/JPEG/PNG**: Fotos de documentos
- **Tamanho máximo**: Configurável por documento (padrão: 10MB)

## 🔄 Integração com Notificações

```typescript
// Callback automático para notificações
onDocumentUploaded={(docKey) => {
  // Integração automática com sistema de notificações
  notificationService.onDocumentUploaded(
    documentId, 
    entityId, 
    userId, 
    docKey
  );
}}
```

## 🎨 Personalização Visual

### Temas por Tipo de Entidade

- **Documentos Pendentes**: Bordas vermelhas, fundo vermelho claro
- **Campos Vazios**: Bordas laranjas, fundo laranja claro
- **Completo**: Bordas verdes, fundo verde claro

### Responsividade

- **Mobile**: Layout vertical, botões grandes
- **Desktop**: Layout otimizado, preview de arquivos
- **Max-height**: 80vh com scroll automático

## 📊 Estatísticas e Analytics

O modal automaticamente exibe:
- Progresso de documentos: `X/Y documentos`
- Progresso de campos: `X/Y campos preenchidos`
- Status geral da entidade

## 🔍 Exemplos Avançados

### Modal com Múltiplas Etapas

```typescript
// Documentos específicos para diferentes etapas
const config = createPropertyDocumentConfig(currentStage);

// Validação dinâmica baseada na etapa
const stageValidation = (entity: Entity) => {
  const stage = entity.stage || 1;
  
  return {
    pendingDocs: ALL_DOCUMENTS.filter(doc => 
      doc.stages?.includes(stage) && !isDocumentUploaded(doc.key)
    ),
    pendingFields: ALL_FIELDS.filter(field => 
      field.stages?.includes(stage) && !isFieldFilled(field.key)
    )
  };
};
```

### Integração com Listas

```typescript
// Em uma página de lista de propriedades
function PropertyList() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCheckPendencies = (entity: Entity) => {
    setSelectedEntity(entity);
    setModalOpen(true);
  };

  return (
    <div>
      {properties.map(property => (
        <PropertyCard 
          key={property.id}
          property={property}
          onCheckPendencies={() => handleCheckPendencies(property)}
        />
      ))}
      
      {selectedEntity && (
        <DocumentsPendingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          entity={selectedEntity}
          config={createPropertyDocumentConfig(selectedEntity.stage)}
        />
      )}
    </div>
  );
}
```

## 🚀 Benefícios da Arquitetura Universal

### Para Desenvolvedores

1. **Reutilização**: Um componente para todos os tipos de entidade
2. **Manutenibilidade**: Mudanças centralizadas
3. **Consistência**: Interface uniforme em todo o sistema
4. **Flexibilidade**: Facilmente extensível para novos tipos

### Para Usuários

1. **Experiência Consistente**: Mesmo padrão em todo o sistema
2. **Interface Intuitiva**: Upload drag-and-drop, validação em tempo real
3. **Feedback Visual**: Progresso claro e status de cada item
4. **Mobile-Friendly**: Funciona perfeitamente em dispositivos móveis

## 🔧 Manutenção e Extensão

### Adicionando Novo Tipo de Entidade

1. **Criar configuração padrão**:
```typescript
export function createNewEntityConfig(): PendencyConfig {
  return {
    entityType: 'new_entity',
    documents: [...],
    fields: [...]
  };
}
```

2. **Atualizar tipos TypeScript**:
```typescript
interface PendencyConfig {
  entityType: 'property' | 'client' | 'contract' | 'new_entity' | 'generic';
  // ...
}
```

3. **Configurar API endpoints**: Criar rotas `/api/new_entity-documents`

4. **Configurar Supabase**: Criar bucket `new_entity-documents`

### Adicionando Novos Tipos de Documento

```typescript
const NEW_DOCUMENT: DocumentDefinition = {
  key: 'NEW_DOC_TYPE',
  name: 'Novo Documento',
  icon: '📄',
  description: 'Descrição do novo documento',
  required: true,
  stages: [1, 2],
  acceptedFormats: ['.pdf'],
  maxSize: 10
};
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Upload falha**: Verificar configuração do Supabase e buckets
2. **Documentos não aparecem**: Verificar configuração de etapas
3. **Validação não funciona**: Verificar função customValidation
4. **Interface quebrada**: Verificar dependências do shadcn/ui

### Debug

```typescript
// Adicionar logs para debug
console.log('Entity:', entity);
console.log('Config:', config);
console.log('Required docs:', requiredDocuments);
console.log('Pending docs:', pendingDocs);
```

## 📈 Próximos Passos

1. **Integração com Workflow**: Automatizar transições de etapa
2. **Aprovação de Documentos**: Sistema de aprovação por supervisores
3. **OCR**: Extração automática de dados dos documentos
4. **Assinatura Digital**: Integração com sistemas de assinatura
5. **Audit Trail**: Histórico completo de mudanças
6. **Bulk Upload**: Upload múltiplo de documentos
7. **Templates**: Templates de documentos por tipo de transação

---

**Criado por**: VentusHub Development Team  
**Última atualização**: Janeiro 2024  
**Versão**: 1.0.0
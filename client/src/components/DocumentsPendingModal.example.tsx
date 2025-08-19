/**
 * EXEMPLOS DE USO DO DOCUMENTSPENDINGMODAL UNIVERSAL
 * 
 * Este arquivo demonstra como usar o DocumentsPendingModal 
 * para diferentes tipos de entidades e situações
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DocumentsPendingModal, 
  createPropertyDocumentConfig,
  createClientDocumentConfig,
  createContractDocumentConfig,
  createGenericDocumentConfig,
  type Entity,
  type DocumentDefinition,
  type FieldDefinition
} from './DocumentsPendingModal';

// ======================================
// EXEMPLO 1: PROPRIEDADE EM ETAPA ESPECÍFICA
// ======================================

export function PropertyDocumentExample() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const property: Entity = {
    id: 123,
    sequenceNumber: '00123',
    stage: 2, // Due Diligence
    type: 'apartamento',
    street: 'Rua das Flores',
    number: '100'
  };

  const config = createPropertyDocumentConfig(2); // Documentos para etapa Due Diligence

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>
        Ver Pendências do Imóvel
      </Button>
      
      <DocumentsPendingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entity={property}
        config={config}
        onDocumentUploaded={(docKey) => {
          console.log(`Documento ${docKey} enviado para propriedade ${property.id}`);
        }}
        onComplete={() => {
          console.log('Todos os documentos da propriedade foram enviados!');
        }}
      />
    </div>
  );
}

// ======================================
// EXEMPLO 2: CLIENTE COM DOCUMENTOS PERSONALIZADOS
// ======================================

export function ClientDocumentExample() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const client: Entity = {
    id: 456,
    fullName: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999'
  };

  // Documentos específicos para clientes PJ
  const customClientDocs: DocumentDefinition[] = [
    {
      key: 'CNPJ',
      name: 'CNPJ',
      icon: '🏢',
      description: 'Cartão CNPJ atualizado',
      required: true,
      acceptedFormats: ['.pdf'],
      maxSize: 3
    },
    {
      key: 'CONTRATO_SOCIAL',
      name: 'Contrato Social',
      icon: '📄',
      description: 'Contrato social da empresa',
      required: true,
      acceptedFormats: ['.pdf'],
      maxSize: 10
    },
    {
      key: 'PROCURACAO',
      name: 'Procuração',
      icon: '📋',
      description: 'Procuração do representante legal',
      required: true,
      acceptedFormats: ['.pdf'],
      maxSize: 5
    }
  ];

  const config = createClientDocumentConfig(customClientDocs);

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>
        Ver Pendências do Cliente PJ
      </Button>
      
      <DocumentsPendingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entity={client}
        config={config}
        title="Documentos Pendentes - Cliente Pessoa Jurídica"
        onDocumentUploaded={(docKey) => {
          console.log(`Documento ${docKey} enviado para cliente ${client.id}`);
        }}
      />
    </div>
  );
}

// ======================================
// EXEMPLO 3: CONTRATO COM VALIDAÇÃO CUSTOMIZADA
// ======================================

export function ContractDocumentExample() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const contract: Entity = {
    id: 789,
    contractNumber: 'CONT-2024-001',
    signedDate: '2024-01-15',
    value: 500000,
    type: 'compra_venda'
  };

  const config = createContractDocumentConfig();

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>
        Ver Pendências do Contrato
      </Button>
      
      <DocumentsPendingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entity={contract}
        config={config}
        onComplete={() => {
          console.log('Contrato completo, pode prosseguir para próxima etapa');
        }}
      />
    </div>
  );
}

// ======================================
// EXEMPLO 4: ENTIDADE GENÉRICA COM VALIDAÇÃO CUSTOMIZADA
// ======================================

export function GenericEntityExample() {
  const [modalOpen, setModalOpen] = useState(false);
  
  const invoice: Entity = {
    id: 999,
    invoiceNumber: 'INV-2024-001',
    amount: 15000,
    dueDate: '2024-02-01',
    isPaid: false
  };

  // Validação customizada baseada no status da entidade
  const customValidation = (entity: Entity) => {
    const pendingDocs: DocumentDefinition[] = [];
    const pendingFields: FieldDefinition[] = [];

    // Se não foi pago, exigir comprovante
    if (!entity.isPaid) {
      pendingDocs.push({
        key: 'COMPROVANTE_PAGAMENTO',
        name: 'Comprovante de Pagamento',
        icon: '💳',
        description: 'Comprovante de pagamento da fatura',
        required: true,
        acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSize: 5
      });
    }

    // Se não tem data de vencimento, exigir campo
    if (!entity.dueDate) {
      pendingFields.push({
        key: 'dueDate',
        name: 'Data de Vencimento',
        required: true
      });
    }

    return { pendingDocs, pendingFields };
  };

  const invoiceDocs: DocumentDefinition[] = [
    {
      key: 'FATURA_ORIGINAL',
      name: 'Fatura Original',
      icon: '📄',
      description: 'Fatura original emitida',
      required: true,
      acceptedFormats: ['.pdf'],
      maxSize: 10
    }
  ];

  const invoiceFields: FieldDefinition[] = [
    { key: 'invoiceNumber', name: 'Número da Fatura', required: true },
    { key: 'amount', name: 'Valor', required: true }
  ];

  const config = createGenericDocumentConfig('generic', invoiceDocs, invoiceFields, customValidation);

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>
        Ver Pendências da Fatura
      </Button>
      
      <DocumentsPendingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entity={invoice}
        config={config}
        title="Documentos Pendentes - Fatura"
        onDocumentUploaded={(docKey) => {
          console.log(`Documento ${docKey} enviado para fatura ${invoice.id}`);
          // Integrar com serviço de notificações
          // notificationService.onDocumentUploaded(...)
        }}
      />
    </div>
  );
}

// ======================================
// EXEMPLO 5: USO EM PÁGINAS DE LISTA
// ======================================

export function PropertyListExample() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Entity | null>(null);

  const properties: Entity[] = [
    { id: 1, sequenceNumber: '00001', stage: 1, type: 'casa' },
    { id: 2, sequenceNumber: '00002', stage: 2, type: 'apartamento' },
    { id: 3, sequenceNumber: '00003', stage: 3, type: 'terreno' }
  ];

  const handleViewPendencies = (property: Entity) => {
    setSelectedProperty(property);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <h2>Lista de Propriedades</h2>
      
      {properties.map(property => (
        <div key={property.id} className="flex justify-between items-center p-4 border rounded">
          <span>Imóvel {property.sequenceNumber} - Etapa {property.stage}</span>
          <Button onClick={() => handleViewPendencies(property)}>
            Ver Pendências
          </Button>
        </div>
      ))}

      {selectedProperty && (
        <DocumentsPendingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          entity={selectedProperty}
          config={createPropertyDocumentConfig(selectedProperty.stage)}
          onDocumentUploaded={(docKey) => {
            console.log(`Documento ${docKey} enviado para ${selectedProperty.sequenceNumber}`);
            // Atualizar lista ou recarregar dados
          }}
        />
      )}
    </div>
  );
}
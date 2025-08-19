import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, AlertCircle, X, CloudUpload, Upload, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiRequestLegacy as apiRequest } from "@/lib/queryClient";

// ======================================
// INTERFACES GENÉRICAS
// ======================================

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
  stages?: number[]; // Em quais etapas este documento é obrigatório
  propertyTypes?: string[]; // Para quais tipos de propriedade
  acceptedFormats?: string[];
  maxSize?: number; // em MB
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

interface DocumentsPendingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity;
  config: PendencyConfig;
  title?: string;
  onDocumentUploaded?: (docKey: string) => void;
  onComplete?: () => void;
}

// ======================================
// CONFIGURAÇÕES PADRÃO DE DOCUMENTOS
// ======================================

const DEFAULT_PROPERTY_DOCUMENTS: DocumentDefinition[] = [
  { 
    key: 'ONUS_REAIS', 
    name: 'Ônus Reais', 
    icon: '⚖️', 
    description: 'Certidão de ônus reais do imóvel',
    stages: [1, 2, 3], // Captação, Due Diligence, Mercado
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 10
  },
  { 
    key: 'ESPELHO_IPTU', 
    name: 'Espelho de IPTU', 
    icon: '🏠', 
    description: 'Carnê ou espelho do IPTU atual',
    stages: [1, 2],
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 5
  },
  { 
    key: 'RG_CNH', 
    name: 'RG/CNH dos Proprietários', 
    icon: '📄', 
    description: 'Documentos de identidade dos proprietários',
    stages: [1, 2, 6], // Captação, Due Diligence, Financiamento
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 5
  },
  { 
    key: 'CERTIDAO_ESTADO_CIVIL', 
    name: 'Certidão de Estado Civil', 
    icon: '💍', 
    description: 'Certidão de casamento ou nascimento',
    stages: [2, 6],
    acceptedFormats: ['.pdf'],
    maxSize: 5
  },
  { 
    key: 'COMPROVANTE_RESIDENCIA', 
    name: 'Comprovante de Residência', 
    icon: '📮', 
    description: 'Conta de luz, água ou telefone',
    stages: [1, 2],
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 3
  },
  { 
    key: 'ESCRITURA_REGISTRO', 
    name: 'Escritura/Registro', 
    icon: '📋', 
    description: 'Escritura pública ou certidão de registro',
    stages: [2, 7], // Due Diligence, Instrumento
    acceptedFormats: ['.pdf'],
    maxSize: 10
  },
  { 
    key: 'CONTRATO_COMPRA_VENDA', 
    name: 'Contrato de Compra e Venda', 
    icon: '📄', 
    description: 'Contrato assinado entre as partes',
    stages: [5, 6, 7], // Contratos, Financiamento, Instrumento
    acceptedFormats: ['.pdf'],
    maxSize: 10
  }
];

const DEFAULT_PROPERTY_FIELDS: FieldDefinition[] = [
  { key: 'type', name: 'Tipo de Imóvel', stages: [1] },
  { key: 'street', name: 'Endereço', stages: [1] },
  { key: 'number', name: 'Número', stages: [1] },
  { key: 'neighborhood', name: 'Bairro', stages: [1] },
  { key: 'city', name: 'Cidade', stages: [1] },
  { key: 'value', name: 'Valor do Imóvel', stages: [1, 4] }, // Captação, Propostas
  { key: 'owners', name: 'Dados dos Proprietários', stages: [1, 2] },
  { key: 'registrationNumber', name: 'Número de Matrícula', stages: [2] }
];

// Estender File para incluir categoria
interface FileWithCategory extends File {
  category?: string;
}

export function DocumentsPendingModal({ 
  open, 
  onOpenChange, 
  entity, 
  config, 
  title,
  onDocumentUploaded,
  onComplete 
}: DocumentsPendingModalProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: FileWithCategory}>({});
  const [uploadedDocsState, setUploadedDocsState] = useState<string[]>([]);
  const { toast } = useToast();

  // Inicializar estado dos documentos ao abrir o modal
  useEffect(() => {
    if (open && entity) {
      loadUploadedDocuments();
    }
  }, [open, entity?.id]);

  // Carregar documentos já enviados
  const loadUploadedDocuments = async () => {
    try {
      if (!entity?.id) return;
      
      const endpoint = config.entityType === 'property' 
        ? `/api/property-documents?propertyId=${entity.id}`
        : `/api/${config.entityType}-documents?${config.entityType}Id=${entity.id}`;
        
      const response = await apiRequest('GET', endpoint);
      const documents = await response.json();
      
      const uploadedTypes = documents.map((doc: any) => doc.fileType || doc.category);
      setUploadedDocsState(uploadedTypes);
    } catch (error) {
      console.error('Error loading uploaded documents:', error);
    }
  };

  // Obter configurações de documentos e campos baseadas no contexto
  const getRequiredDocuments = (): DocumentDefinition[] => {
    if (!config) {
      console.warn('Config is undefined in DocumentsPendingModal');
      return [];
    }
    
    if (config.customValidation) {
      return config.customValidation(entity).pendingDocs;
    }
    
    if (config.documents) {
      return config.documents.filter(doc => 
        !config.stage || !doc.stages || doc.stages.includes(config.stage)
      );
    }
    
    // Fallback para configuração padrão de propriedades
    if (config.entityType === 'property') {
      return DEFAULT_PROPERTY_DOCUMENTS.filter(doc => 
        !config.stage || !doc.stages || doc.stages.includes(config.stage)
      );
    }
    
    return [];
  };

  const getRequiredFields = (): FieldDefinition[] => {
    if (!config) {
      console.warn('Config is undefined in DocumentsPendingModal getRequiredFields');
      return [];
    }
    
    if (config.customValidation) {
      return config.customValidation(entity).pendingFields;
    }
    
    if (config.fields) {
      return config.fields.filter(field => 
        !config.stage || !field.stages || field.stages.includes(config.stage)
      );
    }
    
    // Fallback para configuração padrão de propriedades
    if (config.entityType === 'property') {
      return DEFAULT_PROPERTY_FIELDS.filter(field => 
        !config.stage || !field.stages || field.stages.includes(config.stage)
      );
    }
    
    return [];
  };

  // Verificar quais campos estão preenchidos
  const getFieldStatus = (field: FieldDefinition) => {
    const value = entity[field.key];
    
    if (field.validator) {
      return field.validator(value);
    }
    
    // Validação padrão baseada no tipo de campo
    if (field.key === 'owners') {
      return value && Array.isArray(value) && value.length > 0 && value[0]?.fullName;
    }
    
    return value && value !== '';
  };

  // Estado real dos documentos - baseado no estado sincronizado
  const getDocumentStatus = (docKey: string) => {
    return uploadedDocsState.includes(docKey);
  };

  const requiredDocuments = getRequiredDocuments();
  const requiredFields = getRequiredFields();
  const pendingDocs = requiredDocuments.filter(doc => !getDocumentStatus(doc.key));
  const pendingFields = requiredFields.filter(field => !getFieldStatus(field));

  // Função para selecionar arquivo
  const handleFileSelect = (docKey: string, file: File) => {
    const fileWithCategory = Object.assign(file, { category: docKey }) as FileWithCategory;
    setSelectedFiles(prev => ({
      ...prev,
      [docKey]: fileWithCategory
    }));
  };

  // Função para upload do documento - genérica
  const handleUploadDocument = async (docKey: string) => {
    const file = selectedFiles[docKey];
    if (!file || !entity?.id) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo primeiro.",
        variant: "destructive",
      });
      return;
    }

    setUploading(docKey);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const entityId = String(entity.id);
      const filePath = `${entityId}/${fileName}`;

      // Determinar bucket baseado no tipo de entidade
      const bucketName = `${config.entityType}-documents`;

      // Upload para Supabase
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // Construir dados do documento baseado no tipo de entidade
      const documentData = {
        [`${config.entityType}Id`]: parseInt(entityId),
        fileName: file.name,
        fileUrl: publicUrl,
        fileType: docKey,
        fileSize: file.size,
        category: docKey
      };

      // Determinar endpoint da API baseado no tipo de entidade
      const apiEndpoint = config.entityType === 'property' 
        ? '/api/property-documents'
        : `/api/${config.entityType}-documents`;

      await apiRequest('POST', apiEndpoint, documentData);

      // Atualizar estado local dos documentos enviados
      setUploadedDocsState(prev => [...prev, docKey]);

      toast({
        title: "Documento enviado!",
        description: `${requiredDocuments.find(d => d.key === docKey)?.name} foi enviado com sucesso.`,
      });

      // Remover arquivo selecionado
      setSelectedFiles(prev => {
        const updated = { ...prev };
        delete updated[docKey];
        return updated;
      });

      // Callback para notificar upload
      onDocumentUploaded?.(docKey);

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Erro ao enviar documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  // Calcular estatísticas de completude
  const totalRequiredDocs = requiredDocuments.length;
  const uploadedDocsCount = requiredDocuments.filter(doc => getDocumentStatus(doc.key)).length;
  const totalRequiredFields = requiredFields.length;
  const filledFieldsCount = requiredFields.filter(field => getFieldStatus(field)).length;

  // Gerar título dinâmico baseado no tipo de entidade e configuração
  const getEntityDisplayName = (): string => {
    switch (config.entityType) {
      case 'property':
        return `Imóvel ${entity.sequenceNumber || entity.id || '00000'}`;
      case 'client':
        return `Cliente ${entity.fullName || entity.name || entity.id}`;
      case 'contract':
        return `Contrato ${entity.contractNumber || entity.id}`;
      default:
        return `${config.entityType} ${entity.id}`;
    }
  };

  const modalTitle = title || `Documentos e Campos Pendentes - ${getEntityDisplayName()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Status Atual</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <div>📋 Documentos: {uploadedDocsCount}/{totalRequiredDocs}</div>
              <div>📝 Campos: {filledFieldsCount}/{totalRequiredFields}</div>
            </div>
          </div>

          {/* Documentos Pendentes - CLICÁVEIS COM UPLOAD */}
          {pendingDocs.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Pendentes ({pendingDocs.length})
              </h4>
              <div className="space-y-3">
                {pendingDocs.map((doc) => (
                  <div key={doc.key} className="border border-red-200 rounded-lg bg-red-50 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{doc.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-red-700">{doc.name}</h5>
                        <p className="text-xs text-red-600">{doc.description}</p>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        Pendente
                      </Badge>
                    </div>

                    {/* Área de Upload */}
                    <div className="space-y-3">
                      {!selectedFiles[doc.key] ? (
                        <div className="border-2 border-dashed border-red-300 rounded-lg p-4 text-center">
                          <label htmlFor={`upload-${doc.key}`} className="cursor-pointer block">
                            <CloudUpload className="mx-auto h-8 w-8 text-red-400 mb-2" />
                            <div className="text-sm font-medium text-red-600">
                              Clique para selecionar arquivo
                            </div>
                            <div className="text-xs text-red-500 mt-1">
                              PDF, JPG, PNG até 10MB
                            </div>
                            <input
                              id={`upload-${doc.key}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileSelect(doc.key, file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-blue-700">
                                {selectedFiles[doc.key].name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFiles(prev => {
                                  const updated = { ...prev };
                                  delete updated[doc.key];
                                  return updated;
                                });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            onClick={() => handleUploadDocument(doc.key)}
                            disabled={uploading === doc.key}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {uploading === doc.key ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Enviar {doc.name}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos Pendentes */}
          {pendingFields.length > 0 && (
            <div>
              <h4 className="font-medium text-orange-600 mb-3">
                Campos Não Preenchidos ({pendingFields.length})
              </h4>
              <div className="space-y-2">
                {pendingFields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between p-3 border border-orange-200 rounded bg-orange-50">
                    <span className="text-sm text-orange-700">{field.name}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Vazio
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-xs text-orange-600">
                  💡 Para preencher os campos, acesse a seção de edição da entidade
                </p>
              </div>
            </div>
          )}

          {/* Tudo completo */}
          {pendingDocs.length === 0 && pendingFields.length === 0 && (
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium text-green-800">Tudo Completo!</h4>
              <p className="text-sm text-green-600 mt-1">
                Todos os documentos e campos foram preenchidos
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {pendingDocs.length === 0 && pendingFields.length === 0 && onComplete && (
            <Button onClick={() => {
              onComplete();
              onOpenChange(false);
            }}>
              Continuar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ======================================
// HELPER FUNCTIONS FOR EASY USAGE
// ======================================

/**
 * Criar configuração para modal de documentos de propriedade
 */
export function createPropertyDocumentConfig(stage?: number): PendencyConfig {
  return {
    entityType: 'property',
    stage,
    documents: DEFAULT_PROPERTY_DOCUMENTS,
    fields: DEFAULT_PROPERTY_FIELDS
  };
}

/**
 * Criar configuração para modal de documentos de cliente
 */
export function createClientDocumentConfig(customDocs?: DocumentDefinition[], customFields?: FieldDefinition[]): PendencyConfig {
  return {
    entityType: 'client',
    documents: customDocs || [
      {
        key: 'RG_CNH',
        name: 'RG/CNH',
        icon: '📄',
        description: 'Documento de identidade oficial',
        required: true,
        acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSize: 5
      },
      {
        key: 'CPF',
        name: 'CPF',
        icon: '📋',
        description: 'Cadastro de Pessoa Física',
        required: true,
        acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSize: 3
      },
      {
        key: 'COMPROVANTE_RENDA',
        name: 'Comprovante de Renda',
        icon: '💰',
        description: 'Holerite, declaração de IR ou extrato bancário',
        required: true,
        acceptedFormats: ['.pdf'],
        maxSize: 10
      }
    ],
    fields: customFields || [
      { key: 'fullName', name: 'Nome Completo', required: true },
      { key: 'email', name: 'Email', required: true },
      { key: 'phone', name: 'Telefone', required: true },
      { key: 'address', name: 'Endereço', required: true }
    ]
  };
}

/**
 * Criar configuração para modal de documentos de contrato
 */
export function createContractDocumentConfig(customDocs?: DocumentDefinition[]): PendencyConfig {
  return {
    entityType: 'contract',
    documents: customDocs || [
      {
        key: 'CONTRATO_ASSINADO',
        name: 'Contrato Assinado',
        icon: '📄',
        description: 'Contrato assinado por todas as partes',
        required: true,
        acceptedFormats: ['.pdf'],
        maxSize: 10
      },
      {
        key: 'PROCURACAO',
        name: 'Procuração',
        icon: '📋',
        description: 'Procuração quando aplicável',
        required: false,
        acceptedFormats: ['.pdf'],
        maxSize: 5
      }
    ],
    fields: [
      { key: 'contractNumber', name: 'Número do Contrato', required: true },
      { key: 'signedDate', name: 'Data de Assinatura', required: true },
      { key: 'value', name: 'Valor do Contrato', required: true }
    ]
  };
}

/**
 * Criar configuração genérica para qualquer tipo de entidade
 */
export function createGenericDocumentConfig(
  entityType: 'property' | 'client' | 'contract' | 'generic',
  documents: DocumentDefinition[],
  fields?: FieldDefinition[],
  customValidation?: (entity: Entity) => { pendingDocs: DocumentDefinition[]; pendingFields: FieldDefinition[] }
): PendencyConfig {
  return {
    entityType,
    documents,
    fields: fields || [],
    customValidation
  };
}
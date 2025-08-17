import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, AlertCircle, X, CloudUpload, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { apiRequestLegacy as apiRequest } from "@/lib/queryClient";

interface Property {
  id?: string;
  sequenceNumber?: string;
  [key: string]: any;
}

interface DocumentsPendingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  docData: {
    uploadedCount: number;
    totalRequired: number;
    filledFieldsCount: number;
    totalFields: number;
  };
}

// Estender File para incluir categoria
interface FileWithCategory extends File {
  category?: string;
}

export function DocumentsPendingModal({ open, onOpenChange, property, docData }: DocumentsPendingModalProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: FileWithCategory}>({});
  const { toast } = useToast();

  // Lista de documentos obrigatórios atualizados
  const requiredDocuments = [
    { key: 'ONUS_REAIS', name: 'Ônus Reais', icon: '⚖️', description: 'Certidão de ônus reais do imóvel' },
    { key: 'ESPELHO_IPTU', name: 'Espelho de IPTU', icon: '🏠', description: 'Carnê ou espelho do IPTU atual' },
    { key: 'RG_CNH', name: 'RG/CNH dos Proprietários', icon: '📄', description: 'Documentos de identidade dos proprietários' },
    { key: 'CERTIDAO_ESTADO_CIVIL', name: 'Certidão de Estado Civil', icon: '💍', description: 'Certidão de casamento ou nascimento' },
    { key: 'COMPROVANTE_RESIDENCIA', name: 'Comprovante de Residência', icon: '📮', description: 'Conta de luz, água ou telefone' }
  ];

  // Campos obrigatórios
  const requiredFields = [
    { key: 'type', name: 'Tipo de Imóvel' },
    { key: 'street', name: 'Endereço' },
    { key: 'number', name: 'Número' },
    { key: 'neighborhood', name: 'Bairro' },
    { key: 'city', name: 'Cidade' },
    { key: 'value', name: 'Valor do Imóvel' },
    { key: 'owners', name: 'Dados dos Proprietários' },
    { key: 'registrationNumber', name: 'Número de Matrícula' }
  ];

  // Verificar quais campos estão preenchidos
  const getFieldStatus = (fieldKey: string) => {
    const value = property[fieldKey as keyof Property];
    if (fieldKey === 'owners') {
      return value && Array.isArray(value) && value.length > 0 && value[0]?.fullName;
    }
    return value && value !== '';
  };

  // Mock - verificar quais documentos foram enviados (você precisa adaptar para sua API)
  const [uploadedDocs] = useState(['ESPELHO_IPTU']); // Exemplo: apenas IPTU foi enviado

  const getDocumentStatus = (docKey: string) => {
    return uploadedDocs.includes(docKey);
  };

  const pendingDocs = requiredDocuments.filter(doc => !getDocumentStatus(doc.key));
  const pendingFields = requiredFields.filter(field => !getFieldStatus(field.key));

  // Função para selecionar arquivo
  const handleFileSelect = (docKey: string, file: File) => {
    const fileWithCategory = Object.assign(file, { category: docKey }) as FileWithCategory;
    setSelectedFiles(prev => ({
      ...prev,
      [docKey]: fileWithCategory
    }));
  };

  // Função para upload do documento
  const handleUploadDocument = async (docKey: string) => {
    const file = selectedFiles[docKey];
    if (!file || !property?.id) {
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
      const filePath = `${property.id}/${fileName}`;

      // Upload para Supabase
      const { data, error } = await supabase.storage
        .from('property-documents')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(filePath);

      // Salvar metadata no banco
      const documentData = {
        propertyId: parseInt(property.id),
        fileName: file.name,
        fileUrl: publicUrl,
        fileType: file.type,
        category: docKey
      };

      await apiRequest('POST', '/api/property-documents', documentData);

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

      // Fechar modal após 1 segundo para mostrar sucesso
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Documentos e Campos Pendentes - Imóvel {property?.sequenceNumber || '00000'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Status Atual</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <div>📋 Documentos: {docData.uploadedCount}/{docData.totalRequired}</div>
              <div>📝 Campos: {docData.filledFieldsCount}/{docData.totalFields}</div>
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
                  💡 Para preencher os campos, clique em "Ver Detalhes" na linha do imóvel
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

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
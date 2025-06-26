import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, AlertCircle, X } from "lucide-react";

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

export function DocumentsPendingModal({ open, onOpenChange, property, docData }: DocumentsPendingModalProps) {
  // Lista de documentos obrigatórios atualizados
  const requiredDocuments = [
    { key: 'ONUS_REAIS', name: 'Ônus Reais', icon: '⚖️' },
    { key: 'ESPELHO_IPTU', name: 'Espelho de IPTU', icon: '🏠' },
    { key: 'RG_CNH', name: 'RG/CNH dos Proprietários', icon: '📄' },
    { key: 'CERTIDAO_ESTADO_CIVIL', name: 'Certidão de Estado Civil', icon: '💍' },
    { key: 'COMPROVANTE_RESIDENCIA', name: 'Comprovante de Residência', icon: '📮' }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Documentos e Campos Pendentes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Status Atual</h4>
            <div className="text-sm text-amber-700 space-y-1">
              <div>📋 Documentos: {docData.uploadedCount}/{docData.totalRequired}</div>
              <div>📝 Campos: {docData.filledFieldsCount}/{docData.totalFields}</div>
            </div>
          </div>

          {/* Documentos Pendentes */}
          {pendingDocs.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Pendentes ({pendingDocs.length})
              </h4>
              <div className="space-y-2">
                {pendingDocs.map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{doc.icon}</span>
                      <span className="text-sm font-medium text-red-700">{doc.name}</span>
                    </div>
                    <Badge variant="outline" className="text-red-600 border-red-300">
                      Pendente
                    </Badge>
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
                  <div key={field.key} className="flex items-center justify-between p-2 border border-orange-200 rounded bg-orange-50">
                    <span className="text-sm text-orange-700">{field.name}</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Vazio
                    </Badge>
                  </div>
                ))}
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

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
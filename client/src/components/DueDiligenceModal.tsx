import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Clock, ExternalLink, FileText, User, Building, Video, RotateCcw, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CondominiumEmailModal } from "./CondominiumEmailModal";

interface DueDiligenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: {
    id: string;
    sequenceNumber?: string;
    street: string;
    number: string;
    type: string;
    owners?: Array<{ 
      fullName: string; 
      phone?: string;
      email?: string;
      cpf?: string;
    }>;
  };
}

interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'requested' | 'completed';
  requestedAt?: string;
  completedAt?: string;
  url?: string;
  tutorialUrl?: string;
  requiresModal?: boolean;
  documentFile?: File;
  documentUrl?: string;
}

export function DueDiligenceModal({ open, onOpenChange, property }: DueDiligenceModalProps) {
  const { toast } = useToast();
  const [showCondominiumModal, setShowCondominiumModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    itemId: string;
    category: 'property' | 'personal';
    itemName: string;
  } | null>(null);

  // Estado inicial dos itens do checklist
  const [propertyItems, setPropertyItems] = useState<ChecklistItem[]>([
    { 
      id: 'onus_reais', 
      name: 'ÔNUS REAIS', 
      status: 'pending',
      url: 'https://ridigital.org.br/CertidaoDigital/frmPedidosCertidao.aspx?from=menu&digital=1',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder1'
    },
    { 
      id: 'certidao_fazendaria', 
      name: 'Certidão Fazendária', 
      status: 'pending',
      url: 'https://www3.tjrj.jus.br/CJE/certidao/Judicial/CadastrarequerenteCapital',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder2'
    },
    { 
      id: 'quitacao_condominial', 
      name: 'Quitação condominial', 
      status: 'pending',
      requiresModal: true,
      tutorialUrl: 'https://youtube.com/watch?v=placeholder3'
    },
    { 
      id: 'situacao_fiscal', 
      name: 'Situação fiscal e enfitêutica', 
      status: 'pending',
      url: 'https://www2.rio.rj.gov.br/smf/iptucertfiscal/',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder4'
    },
    { 
      id: 'taxa_incendio', 
      name: 'Taxa de incêndio (FUNESBOM)', 
      status: 'pending',
      url: 'https://www.funesbom.rj.gov.br/emissao-de-2-via-da-taxa/',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder5'
    },
  ]);

  const [personalItems, setPersonalItems] = useState<ChecklistItem[]>([
    { 
      id: 'segundo_distribuidor', 
      name: '2º Distribuidor', 
      status: 'pending',
      url: 'https://www3.tjrj.jus.br/CJE/certidao/Judicial/CadastrarequerenteCapital',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder6'
    },
    { 
      id: 'certidao_fazendaria_pessoal', 
      name: 'Certidão Fazendária', 
      status: 'pending',
      url: 'https://www3.tjrj.jus.br/CJE/certidao/Judicial/CadastrarequerenteCapital',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder7'
    },
    { 
      id: 'primeiro_interdicoes', 
      name: '1º Interdições e Tutelas', 
      status: 'pending',
      url: 'https://e-cartoriodobrasil.com/pedido/interdicoes-e-tutelas/certidao-de-interdicoes-certidao-negativa',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder8'
    },
    { 
      id: 'segundo_interdicoes', 
      name: '2º Interdições e Tutelas', 
      status: 'pending',
      url: 'https://e-cartoriodobrasil.com/pedido/interdicoes-e-tutelas/certidao-de-interdicoes-certidao-negativa',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder9'
    },
    { 
      id: 'trabalhistas_eletronico', 
      name: 'Trabalhistas 1ª e 2ª instâncias feitos eletrônico', 
      status: 'pending',
      url: 'https://pje.trt1.jus.br/certidoes/trabalhista/emissao',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder10'
    },
    { 
      id: 'trabalhistas_fisicos', 
      name: 'Trabalhistas 1ª e 2ª instâncias feitos físicos', 
      status: 'pending',
      url: 'https://ceat.trt1.jus.br/certidao/feitosTrabalhistas/aba1.emissao.htm',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder11'
    },
    { 
      id: 'debitos_trabalhistas', 
      name: 'Débitos Trabalhistas', 
      status: 'pending',
      url: 'https://cndt-certidao.tst.jus.br/inicio.faces',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder12'
    },
    { 
      id: 'receita_federal', 
      name: 'Receita Federal', 
      status: 'pending',
      url: 'https://solucoes.receita.fazenda.gov.br/servicos/certidaointernet/pf/emitir',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder13'
    },
    { 
      id: 'justica_federal', 
      name: 'Justiça Federal', 
      status: 'pending',
      url: 'https://certidoes.trf2.jus.br/certidoes/#/principal/solicitar',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder14'
    },
    { 
      id: 'sefaz', 
      name: 'Certidão negativa de tributos estaduais inscritos em dívida ativa, emitida pela Procuradoria Geral do Estado - SEFAZ', 
      status: 'pending',
      url: 'http://www.consultadividaativa.rj.gov.br/RDGWEBLNX/servlet/StartCISPage?PAGEURL=/cisnatural/NatLogon.html&xciParameters.natsession=Solicitar_Certidao',
      tutorialUrl: 'https://youtube.com/watch?v=placeholder15'
    },
  ]);

  // Carregar dados salvos do localStorage quando o modal abrir
  useEffect(() => {
    if (open && property?.id) {
      const savedData = localStorage.getItem(`diligence_${property.id}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.propertyItems) setPropertyItems(data.propertyItems);
          if (data.personalItems) setPersonalItems(data.personalItems);
        } catch (error) {
          console.error('Erro ao carregar dados do localStorage:', error);
        }
      }
    }
  }, [open, property?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'requested':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'requested':
        return <Badge variant="secondary">Solicitado</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const handleRequestDocument = (itemId: string, category: 'property' | 'personal') => {
    const allItems = [...propertyItems, ...personalItems];
    const item = allItems.find(item => item.id === itemId);
    
    if (!item) return;

    // Se for quitação condominial, abrir modal específico
    if (item.requiresModal) {
      setPendingConfirmation({
        itemId,
        category,
        itemName: item.name
      });
      setShowCondominiumModal(true);
      return;
    }

    // Se tiver URL, abrir em nova aba e configurar confirmação
    if (item.url) {
      window.open(item.url, '_blank');
      
      // Configurar para mostrar confirmação quando o usuário retornar
      setPendingConfirmation({
        itemId,
        category,
        itemName: item.name
      });

      // Detectar quando o usuário retorna para a aba
      const handleFocus = () => {
        // Aguardar um pouco para garantir que o usuário realmente voltou
        setTimeout(() => {
          setShowConfirmationModal(true);
          window.removeEventListener('focus', handleFocus);
        }, 1000);
      };

      window.addEventListener('focus', handleFocus);
    }
  };

  const handleConfirmRequest = (confirmed: boolean) => {
    if (!pendingConfirmation) return;

    const { itemId, category, itemName } = pendingConfirmation;

    if (confirmed) {
      const now = new Date().toISOString();
      
      if (category === 'property') {
        setPropertyItems(prev => {
          const updatedItems = prev.map(item => 
            item.id === itemId 
              ? { ...item, status: 'requested', requestedAt: now }
              : item
          );
          // Salvar no localStorage
          localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
            propertyItems: updatedItems,
            personalItems
          }));
          return updatedItems;
        });
      } else {
        setPersonalItems(prev => {
          const updatedItems = prev.map(item => 
            item.id === itemId 
              ? { ...item, status: 'requested', requestedAt: now }
              : item
          );
          // Salvar no localStorage
          localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
            propertyItems,
            personalItems: updatedItems
          }));
          return updatedItems;
        });
      }
      
      toast({
        title: "Certidão confirmada!",
        description: `${itemName} foi marcada como solicitada.`,
      });
    } else {
      toast({
        title: "Solicitação cancelada",
        description: `Você pode tentar solicitar ${itemName} novamente.`,
      });
    }

    setShowConfirmationModal(false);
    setPendingConfirmation(null);
  };

  const handleCondominiumEmailSent = () => {
    if (!pendingConfirmation) return;

    const { itemId, category, itemName } = pendingConfirmation;
    const now = new Date().toISOString();
    
    if (category === 'property') {
      setPropertyItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { ...item, status: 'requested', requestedAt: now }
            : item
        );
        // Salvar no localStorage
        localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
          propertyItems: updatedItems,
          personalItems
        }));
        return updatedItems;
      });
    } else {
      setPersonalItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { ...item, status: 'requested', requestedAt: now }
            : item
        );
        // Salvar no localStorage
        localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
          propertyItems,
          personalItems: updatedItems
        }));
        return updatedItems;
      });
    }
    
    toast({
      title: "E-mail de quitação enviado!",
      description: `${itemName} foi marcada como solicitada.`,
    });

    setPendingConfirmation(null);
  };

  const handleFileUpload = (itemId: string, category: 'property' | 'personal', file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos PDF são aceitos.",
        variant: "destructive"
      });
      return;
    }

    const now = new Date().toISOString();
    
    if (category === 'property') {
      setPropertyItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                status: 'completed' as const, 
                completedAt: now,
                documentFile: file,
                documentUrl: URL.createObjectURL(file)
              }
            : item
        );
        // Salvar no localStorage
        const itemsToSave = updatedItems.map(item => ({
          ...item,
          documentFile: undefined // Não salvar File no localStorage
        }));
        localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
          propertyItems: itemsToSave,
          personalItems: personalItems.map(item => ({
            ...item,
            documentFile: undefined
          }))
        }));
        return updatedItems;
      });
    } else {
      setPersonalItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                status: 'completed' as const, 
                completedAt: now,
                documentFile: file,
                documentUrl: URL.createObjectURL(file)
              }
            : item
        );
        // Salvar no localStorage
        const itemsToSave = updatedItems.map(item => ({
          ...item,
          documentFile: undefined // Não salvar File no localStorage
        }));
        localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
          propertyItems: propertyItems.map(item => ({
            ...item,
            documentFile: undefined
          })),
          personalItems: itemsToSave
        }));
        return updatedItems;
      });
    }
    
    const item = [...propertyItems, ...personalItems].find(i => i.id === itemId);
    toast({
      title: "Documento validado!",
      description: `${item?.name} foi marcado como concluído.`,
    });
  };

  const handleRevertRequest = (itemId: string, category: 'property' | 'personal') => {
    const allItems = [...propertyItems, ...personalItems];
    const item = allItems.find(item => item.id === itemId);
    
    if (!item) return;

    if (category === 'property') {
      setPropertyItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { ...item, status: 'pending', requestedAt: undefined }
            : item
        );
        // Salvar no localStorage
        localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
          propertyItems: updatedItems,
          personalItems
        }));
        return updatedItems;
      });
    } else {
      setPersonalItems(prev => {
        const updatedItems = prev.map(item => 
          item.id === itemId 
            ? { ...item, status: 'pending', requestedAt: undefined }
            : item
        );
        // Salvar no localStorage
        localStorage.setItem(`diligence_${property.id}`, JSON.stringify({
          propertyItems,
          personalItems: updatedItems
        }));
        return updatedItems;
      });
    }
    
    toast({
      title: "Status revertido",
      description: `${item.name} voltou para status pendente.`,
    });
  };

  const calculateProgress = () => {
    const allItems = [...propertyItems, ...personalItems];
    const completedItems = allItems.filter(item => item.status === 'completed').length;
    return Math.round((completedItems / allItems.length) * 100);
  };

  const getProgressCount = (items: ChecklistItem[]) => {
    return items.filter(item => item.status === 'completed').length;
  };

  const isAllCompleted = () => {
    const allItems = [...propertyItems, ...personalItems];
    return allItems.length > 0 && allItems.every(item => item.status === 'completed');
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Due Diligence - Imóvel {property.sequenceNumber || '00000'}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {property.type} - {property.street}, {property.number}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Progresso Geral</h3>
                <Badge variant="secondary" className="text-sm">
                  {calculateProgress()}% validado
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>Imóvel: {getProgressCount(propertyItems)}/{propertyItems.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span>Pessoais: {getProgressCount(personalItems)}/{personalItems.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                IMÓVEL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {propertyItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.requestedAt && (
                          <p className="text-xs text-muted-foreground">
                            Solicitado em {new Date(item.requestedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="cursor-pointer bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded px-2 py-1 inline-flex items-center"
                            onClick={() => window.open(item.tutorialUrl, '_blank')}
                          >
                            <Video className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clique para ver uma demonstração de como fazer.</p>
                        </TooltipContent>
                      </Tooltip>
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestDocument(item.id, 'property')}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Solicitar
                        </Button>
                      )}
                      {item.status === 'requested' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(item.id, 'property', file);
                            }}
                            className="hidden"
                            id={`upload-${item.id}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`upload-${item.id}`)?.click()}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload PDF
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevertRequest(item.id, 'property')}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reverter para pendente</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500 text-white">Validado</Badge>
                          {item.documentUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(item.documentUrl, '_blank')}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Ver PDF
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personal Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                PESSOAIS (VENDEDOR)
              </CardTitle>
              {property.owners && property.owners.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Proprietário: {property.owners[0].fullName}
                  {property.owners.length > 1 && ` +${property.owners.length - 1} outros`}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {personalItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        {item.requestedAt && (
                          <p className="text-xs text-muted-foreground">
                            Solicitado em {new Date(item.requestedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="cursor-pointer bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded px-2 py-1 inline-flex items-center"
                            onClick={() => window.open(item.tutorialUrl, '_blank')}
                          >
                            <Video className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Clique para ver uma demonstração de como fazer.</p>
                        </TooltipContent>
                      </Tooltip>
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestDocument(item.id, 'personal')}
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Solicitar
                        </Button>
                      )}
                      {item.status === 'requested' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(item.id, 'personal', file);
                            }}
                            className="hidden"
                            id={`upload-personal-${item.id}`}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`upload-personal-${item.id}`)?.click()}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload PDF
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevertRequest(item.id, 'personal')}
                                className="text-orange-600 border-orange-600 hover:bg-orange-50"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reverter para pendente</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500 text-white">Validado</Badge>
                          {item.documentUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(item.documentUrl, '_blank')}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Ver PDF
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Resumo do Due Diligence</h3>
              </div>
              <p className="text-sm text-blue-700">
                Acompanhe o progresso das solicitações de certidões. Quando todas as certidões 
                forem recebidas e aprovadas, o imóvel estará pronto para ir ao mercado.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {isAllCompleted() ? (
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                toast({
                  title: "Due Diligence concluída!",
                  description: "Todos os documentos foram validados. Redirecionando para o mercado...",
                });
                onOpenChange(false);
                // TODO: Navegar para página do mercado
                window.location.href = '/mercado';
              }}
            >
              Anunciar o Imóvel
            </Button>
          ) : (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                toast({
                  title: "Due Diligence em andamento",
                  description: "Continue validando os documentos necessários.",
                });
                onOpenChange(false);
              }}
            >
              Continuar Acompanhamento
            </Button>
          )}
        </DialogFooter>

        {/* Condominium Email Modal */}
        <CondominiumEmailModal
          open={showCondominiumModal}
          onOpenChange={setShowCondominiumModal}
          propertyAddress={`${property.street}, ${property.number}`}
          ownerData={property.owners?.[0]}
          onEmailSent={handleCondominiumEmailSent}
        />

        {/* Confirmation Modal */}
        <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Confirmar Solicitação
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-center text-gray-700">
                Você conseguiu solicitar a certidão <strong>{pendingConfirmation?.itemName}</strong> corretamente?
              </p>
            </div>

            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleConfirmRequest(false)}
                className="flex-1"
              >
                Não
              </Button>
              <Button 
                onClick={() => handleConfirmRequest(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex-1"
              >
                Sim
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
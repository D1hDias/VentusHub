import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Camera, 
  Edit3,
  Download,
  Eye,
  Trash2,
  Circle,
  Clock,
  CheckCircle,
  Pen,
  FileCheck,
  Award,
  Home,
  DollarSign,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PropertyModal } from "@/components/PropertyModal";
import { DueDiligenceModal } from "@/components/DueDiligenceModal";

interface Property {
  id?: string;
  sequenceNumber?: string;
  type: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state?: string;
  cep?: string;
  value: string | number;
  currentStage: number;
  status: string;
  owners?: Array<{
    fullName: string;
    phone: string;
    email?: string;
  }>;
  registrationNumber?: string;
  municipalRegistration?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StageInfo {
  id: number;
  label: string;
  description: string;
  icon: any;
  color: string;
  completed: boolean;
}

export default function PropertyDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/property/:id");
  const propertyId = params?.id;
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showDueDiligenceModal, setShowDueDiligenceModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: property, isLoading, error } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      console.log(`=== FETCHING PROPERTY DETAILS ===`);
      console.log(`Property ID from URL: ${propertyId}`);
      console.log(`API URL: /api/properties/${propertyId}`);
      
      const response = await fetch(`/api/properties/${propertyId}`);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch property: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Property data received:", data);
      return data;
    },
    enabled: !!propertyId,
  });

  // Buscar lista de propriedades para obter o sequenceNumber correto
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  // Buscar documentos da propriedade
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}/documents`],
    queryFn: async () => {
      console.log(`=== FETCHING PROPERTY DOCUMENTS ===`);
      console.log(`Property ID: ${propertyId}`);
      
      const response = await fetch(`/api/properties/${propertyId}/documents`);
      console.log(`Documents response status: ${response.status}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch documents: ${response.status}`);
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Documents received:", data);
      return data;
    },
    enabled: !!propertyId,
  });

  // Obter o sequenceNumber da propriedade
  const getSequenceNumber = () => {
    return property?.sequenceNumber || '00000';
  };

  const getStageInfo = (currentStage: number): StageInfo[] => {
    const stages = [
      {
        id: 1,
        label: "Captação",
        description: "Cadastro inicial e coleta de informações",
        icon: Circle,
        color: "#f97316",
        completed: currentStage >= 1
      },
      {
        id: 2,
        label: "Due Diligence",
        description: "Verificação de documentos e análise jurídica",
        icon: Clock,
        color: "#3b82f6",
        completed: currentStage >= 2
      },
      {
        id: 3,
        label: "No Mercado",
        description: "Imóvel disponível para visualização",
        icon: Home,
        color: "#10b981",
        completed: currentStage >= 3
      },
      {
        id: 4,
        label: "Com Proposta",
        description: "Negociação em andamento",
        icon: FileText,
        color: "#8b5cf6",
        completed: currentStage >= 4
      },
      {
        id: 5,
        label: "Em Contrato",
        description: "Contrato assinado, aguardando financiamento",
        icon: Pen,
        color: "#6366f1",
        completed: currentStage >= 5
      },
      {
        id: 6,
        label: "Financiamento",
        description: "Processo de financiamento bancário",
        icon: Banknote,
        color: "#f59e0b",
        completed: currentStage >= 6
      },
      {
        id: 7,
        label: "Instrumento",
        description: "Escritura e transferência de propriedade",
        icon: FileCheck,
        color: "#14b8a6",
        completed: currentStage >= 7
      },
      {
        id: 8,
        label: "Concluído",
        description: "Venda finalizada com sucesso",
        icon: Award,
        color: "#059669",
        completed: currentStage >= 8
      }
    ];

    return stages;
  };

  const calculateProgress = (currentStage: number): number => {
    return Math.min(((currentStage - 1) / 7) * 100, 100);
  };

  const getDueDiligenceStatus = () => {
    if (!property?.id) return 'pending';
    
    // refreshKey força reavaliação
    const _ = refreshKey;
    
    const diligenceData = localStorage.getItem(`diligence_${property.id}`);
    if (!diligenceData) return 'pending';
    
    try {
      const data = JSON.parse(diligenceData);
      const allItems = [
        ...(data.propertyItems || []),
        ...(data.personalItems || [])
      ];
      
      if (allItems.length === 0) return 'pending';
      
      const completedItems = allItems.filter((item: any) => item.status === 'completed');
      const requestedItems = allItems.filter((item: any) => item.status === 'requested' || item.status === 'completed');
      
      if (completedItems.length === allItems.length) return 'completed';
      if (requestedItems.length > 0) return 'in_progress';
      return 'pending';
    } catch {
      return 'pending';
    }
  };

  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      : value || 0;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const deleteDocument = async (documentId: number, documentName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o documento "${documentName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/property-documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Revalidar a query de documentos para atualizar a lista
        queryClient.invalidateQueries({ 
          queryKey: [`/api/properties/${propertyId}/documents`] 
        });
        
        toast({
          title: "Documento deletado!",
          description: `${documentName} foi removido com sucesso.`,
        });
      } else {
        throw new Error(`Erro ao deletar: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o documento.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Erro ao carregar imóvel</h2>
          <p className="text-gray-600 mb-4">Erro: {error.message}</p>
          <p className="text-sm text-gray-500 mb-4">Property ID: {propertyId}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!property && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Imóvel não encontrado</h2>
          <p className="text-gray-600 mb-4">O imóvel solicitado não existe ou foi removido.</p>
          <p className="text-sm text-gray-500 mb-4">Property ID: {propertyId}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const stages = getStageInfo(property.currentStage || 1);
  const progress = calculateProgress(property.currentStage || 1);

  return (
    <div className="min-h-screen bg-gray-50 card-desktop-compact">
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-gray-300 btn-desktop-compact"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded">
                  {getSequenceNumber()}
                </span>
                <h1 className="text-2xl font-bold text-gray-900">
                  {property.type} - {property.street}, {property.number}
                </h1>
              </div>
              <p className="text-gray-600 mt-1">
                {property.neighborhood}, {property.city}
              </p>
            </div>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowPropertyModal(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar Imóvel
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Progresso do Processo</CardTitle>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDueDiligenceModal(true)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Due Diligence
                </Button>
                <Badge variant="secondary" className="text-sm">
                  Etapa {property.currentStage || 1} de 8
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progresso Geral</span>
                  <span className="text-gray-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
                {stages.map((stage, index) => {
                  const IconComponent = stage.icon;
                  const isActive = property.currentStage === stage.id;
                  const dueDiligenceStatus = getDueDiligenceStatus();
                  
                  // Lógica especial para Due Diligence (stage 2)
                  let stageStatus = 'pending';
                  if (stage.id === 2) {
                    stageStatus = dueDiligenceStatus;
                  } else if (stage.completed) {
                    stageStatus = 'completed';
                  } else if (isActive) {
                    stageStatus = 'active';
                  }
                  
                  return (
                    <div
                      key={stage.id}
                      className={`text-center p-2 lg:p-3 rounded-lg border-2 transition-all ${
                        stageStatus === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : stageStatus === 'in_progress'
                          ? 'border-blue-200 bg-blue-50'
                          : stageStatus === 'active'
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 lg:w-10 lg:h-10 mx-auto mb-1 lg:mb-2 rounded-full flex items-center justify-center ${
                        stageStatus === 'completed'
                          ? 'bg-green-500 text-white'
                          : stageStatus === 'in_progress'
                          ? 'bg-blue-500 text-white'
                          : stageStatus === 'active'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        <IconComponent className="h-4 w-4 lg:h-5 lg:w-5" />
                      </div>
                      <h3 className={`text-xs font-medium mb-1 ${
                        stageStatus !== 'pending' ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </h3>
                      <p className="text-xs text-gray-500 leading-tight hidden lg:block">
                        {stage.id === 2 && stageStatus === 'in_progress' 
                          ? 'Documentos em validação'
                          : stage.id === 2 && stageStatus === 'completed'
                          ? 'Todos documentos validados'
                          : stage.description
                        }
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Informações do Imóvel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Imóvel
                    </label>
                    <p className="text-gray-900">{property.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor
                    </label>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(property.value)}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo
                  </label>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">
                        {property.street}, {property.number}
                        {property.complement && `, ${property.complement}`}
                      </p>
                      <p className="text-gray-600">
                        {property.neighborhood}, {property.city}
                        {property.state && `, ${property.state}`}
                      </p>
                      {property.cep && (
                        <p className="text-gray-600">CEP: {property.cep}</p>
                      )}
                    </div>
                  </div>
                </div>

                {(property.registrationNumber || property.municipalRegistration) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.registrationNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Matrícula
                          </label>
                          <p className="text-gray-900">{property.registrationNumber}</p>
                        </div>
                      )}
                      {property.municipalRegistration && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Inscrição Municipal
                          </label>
                          <p className="text-gray-900">{property.municipalRegistration}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Owners Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Proprietários
                </CardTitle>
              </CardHeader>
              <CardContent>
                {property.owners && property.owners.length > 0 ? (
                  <div className="space-y-4">
                    {property.owners.map((owner, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium text-gray-900">{owner.fullName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {owner.phone}
                            </div>
                            {owner.email && (
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {owner.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum proprietário cadastrado</p>
                )}
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documentação
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPropertyModal(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerenciar Documentos
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Carregando documentos...</span>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-green-50">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <span className="text-sm font-medium text-green-700">{doc.name}</span>
                            <div className="text-xs text-green-600">
                              Enviado em {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString('pt-BR')}
                              {doc.category && ` • ${doc.category}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(doc.fileUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                            title="Visualizar documento"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.fileUrl;
                              link.download = doc.name;
                              link.click();
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="Baixar documento"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDocument(doc.id, doc.name)}
                            className="text-red-600 hover:text-red-800"
                            title="Deletar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum documento foi enviado ainda</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowPropertyModal(true)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Adicionar Documentos
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Adicionar Fotos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Informações
                </Button>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Imóvel cadastrado</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(property.createdAt)}
                      </p>
                    </div>
                  </div>
                  {property.updatedAt && property.updatedAt !== property.createdAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Última atualização</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(property.updatedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Dias no processo</span>
                  <span className="font-medium">
                    {property.createdAt 
                      ? Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                      : 0
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Etapa atual</span>
                  <span className="font-medium">{property.currentStage || 1}/7</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progresso</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Property Edit Modal */}
      <PropertyModal
        open={showPropertyModal}
        onOpenChange={(open) => {
          setShowPropertyModal(open);
          if (!open) {
            // Revalidar documentos quando o modal fechar
            queryClient.invalidateQueries({ 
              queryKey: [`/api/properties/${propertyId}/documents`] 
            });
          }
        }}
        property={property ? {
          ...property,
          sequenceNumber: getSequenceNumber()
        } : null}
      />

      {/* Due Diligence Modal */}
      {property && (
        <DueDiligenceModal
          open={showDueDiligenceModal}
          onOpenChange={(open) => {
            setShowDueDiligenceModal(open);
            if (!open) {
              // Forçar atualização quando modal fechar
              setRefreshKey(prev => prev + 1);
            }
          }}
          property={{
            id: property.id?.toString() || '',
            sequenceNumber: getSequenceNumber(),
            street: property.street,
            number: property.number,
            type: property.type,
            owners: property.owners
          }}
        />
      )}
    </div>
  );
}
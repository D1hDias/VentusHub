import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  Circle,
  Clock,
  CheckCircle,
  Pen,
  FileCheck,
  Award,
  Home,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarContent, AvatarFallback } from "@/components/ui/avatar";

interface Property {
  id?: string;
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

  const { data: property, isLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) throw new Error("Failed to fetch property");
      return response.json();
    },
    enabled: !!propertyId,
  });

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
        label: "Instrumento",
        description: "Escritura e transferência de propriedade",
        icon: FileCheck,
        color: "#14b8a6",
        completed: currentStage >= 6
      },
      {
        id: 7,
        label: "Concluído",
        description: "Venda finalizada com sucesso",
        icon: Award,
        color: "#059669",
        completed: currentStage >= 7
      }
    ];

    return stages;
  };

  const calculateProgress = (currentStage: number): number => {
    return Math.min(((currentStage - 1) / 6) * 100, 100);
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

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Imóvel não encontrado</h2>
          <p className="text-gray-600 mb-4">O imóvel solicitado não existe ou foi removido.</p>
          <Button onClick={() => setLocation("/property-capture")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Captação
          </Button>
        </div>
      </div>
    );
  }

  const stages = getStageInfo(property.currentStage || 1);
  const progress = calculateProgress(property.currentStage || 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/property-capture")}
              className="border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {property.type} - {property.street}, {property.number}
              </h1>
              <p className="text-gray-600 mt-1">
                {property.neighborhood}, {property.city}
              </p>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Edit3 className="h-4 w-4 mr-2" />
            Editar Imóvel
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Progresso do Processo</CardTitle>
              <Badge variant="secondary" className="text-sm">
                Etapa {property.currentStage || 1} de 7
              </Badge>
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
              
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {stages.map((stage, index) => {
                  const IconComponent = stage.icon;
                  const isActive = property.currentStage === stage.id;
                  
                  return (
                    <div
                      key={stage.id}
                      className={`text-center p-3 rounded-lg border-2 transition-all ${
                        stage.completed
                          ? 'border-green-200 bg-green-50'
                          : isActive
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        stage.completed
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <h3 className={`text-xs font-medium mb-1 ${
                        stage.completed || isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {stage.label}
                      </h3>
                      <p className="text-xs text-gray-500 leading-tight">
                        {stage.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                    <p className="text-2xl font-bold text-green-600">
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
                        <Avatar>
                          <AvatarFallback>
                            {owner.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
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
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documentação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Documentos serão listados aqui</p>
                  <Button variant="outline" className="mt-4">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerenciar Documentos
                  </Button>
                </div>
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
    </div>
  );
}
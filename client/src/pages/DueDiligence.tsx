import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  X, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Download,
  Eye,
  Bot,
  TrendingUp,
  Calendar,
  Building,
  Users,
  ArrowRight,
  RefreshCw,
  Send,
  Share,
  FileCheck
} from "lucide-react";

interface Property {
  id: string;
  type: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  value: string | number;
  currentStage: number;
  status: string;
  owners?: Array<{
    fullName: string;
    phone: string;
    email?: string;
  }>;
  diligenceProgress?: number;
  diligenceStatus?: 'pending' | 'in_progress' | 'completed' | 'with_issues';
  certificates?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    requestedAt?: string;
    completedAt?: string;
    url?: string;
    type: 'immediate' | 'on_demand';
  }>;
  aiAnalysis?: {
    status: 'pending' | 'analyzing' | 'completed';
    riskLevel: 'low' | 'medium' | 'high';
    issues: string[];
    recommendations: string[];
  };
}

const mockCertificates = [
  { id: '1', name: 'Certidão de Ônus Reais', type: 'immediate', icon: '🏠' },
  { id: '2', name: 'Certidão Negativa de Débitos', type: 'immediate', icon: '💳' },
  { id: '3', name: 'IPTU Atualizado', type: 'immediate', icon: '🧾' },
  { id: '4', name: 'Matrícula do Imóvel', type: 'on_demand', icon: '📋' },
  { id: '5', name: 'Certidão de Inteiro Teor', type: 'on_demand', icon: '📄' },
  { id: '6', name: 'Certidão de Casamento', type: 'on_demand', icon: '💒' },
  { id: '7', name: 'Certidão de Óbito (se aplicável)', type: 'on_demand', icon: '🕊️' },
  { id: '8', name: 'CPF dos Proprietários', type: 'immediate', icon: '🆔' }
];

const mockProperties: Property[] = [
  {
    id: '1',
    type: 'Apartamento',
    street: 'Rua Franz Weissman',
    number: '410',
    neighborhood: 'Barra Olímpica',
    city: 'Rio de Janeiro',
    value: 'R$ 620.000,00',
    currentStage: 2,
    status: 'diligence',
    diligenceProgress: 15, // Início da Due Diligence
    diligenceStatus: 'in_progress',
    owners: [{ fullName: 'Diego Henrique da Silva Dias', phone: '(21) 99806-0863' }],
    certificates: [
      { id: '1', name: 'Certidão de Ônus Reais', status: 'pending', type: 'immediate' },
      { id: '2', name: 'Certidão Negativa de Débitos', status: 'pending', type: 'immediate' },
      { id: '3', name: 'IPTU Atualizado', status: 'completed', requestedAt: '2024-01-14', completedAt: '2024-01-14', type: 'immediate', url: '/docs/iptu.pdf' },
      { id: '4', name: 'Matrícula do Imóvel', status: 'pending', type: 'on_demand' },
      { id: '5', name: 'Certidão de Inteiro Teor', status: 'pending', type: 'on_demand' },
      { id: '6', name: 'CPF dos Proprietários', status: 'in_progress', requestedAt: '2024-01-20', type: 'immediate' }
    ],
    aiAnalysis: {
      status: 'pending',
      riskLevel: 'medium',
      issues: ['Aguardando coleta de documentos'],
      recommendations: ['Iniciar coleta das certidões pendentes']
    }
  }
];

export default function DueDiligence() {
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    riskLevel: [] as string[],
    progress: "all"
  });

  // Simulando carregamento inicial
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setProperties(mockProperties);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Calculando estatísticas
  const stats = {
    completed: properties.filter(p => p.diligenceStatus === 'completed').length,
    inProgress: properties.filter(p => p.diligenceStatus === 'in_progress').length,
    pending: properties.filter(p => p.diligenceStatus === 'pending').length,
    total: properties.length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Concluída</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white">Em Andamento</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
      case 'with_issues':
        return <Badge variant="destructive">Com Pendências</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baixo Risco</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Médio Risco</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Alto Risco</Badge>;
      default:
        return <Badge variant="outline">Não Avaliado</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleStartDiligence = (propertyId: string) => {
    console.log('Iniciando Due Diligence para propriedade:', propertyId);
    // Aqui você implementaria a lógica para iniciar a coleta automática
  };

  const handleViewReport = (propertyId: string) => {
    console.log('Visualizando relatório para propriedade:', propertyId);
    // Abrir modal ou navegar para página de relatório
  };

  const handlePlaceInMarket = (propertyId: string) => {
    console.log('Colocando no mercado:', propertyId);
    // Navegar para próxima etapa ou atualizar status
  };

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = searchTerm === "" || 
      property.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owners?.some(owner => 
        owner.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatusFilter = filters.status.length === 0 || 
      filters.status.includes(property.diligenceStatus || 'pending');

    const matchesRiskFilter = filters.riskLevel.length === 0 || 
      filters.riskLevel.includes(property.aiAnalysis?.riskLevel || 'low');

    return matchesSearch && matchesStatusFilter && matchesRiskFilter;
  });

  const clearFilters = () => {
    setFilters({ status: [], riskLevel: [], progress: "all" });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.riskLevel.length > 0 || filters.progress !== "all";

  return (
    <div className="min-h-screen">
      <div className="mx-auto px-6 py-4 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Due Diligence Automatizada</h1>
            <p className="text-base text-gray-600">
              Emissão de certidões e pré-análise jurídica com IA
            </p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
            <Bot className="h-4 w-4 mr-2" />
            Análise IA
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-600">Concluídas</p>
                  <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Docs</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.total * 8}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por endereço, proprietário ou tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                          {filters.status.length + filters.riskLevel.length + (filters.progress !== "all" ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    <div className="p-4 space-y-4">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                          <X className="h-4 w-4 mr-2" />
                          Limpar Filtros
                        </Button>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Imóveis em Due Diligence ({filteredProperties.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {filteredProperties.map((property: Property) => (
                  <Card key={property.id} className="border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      
                      {/* Property Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {property.type} - {property.street}, {property.number}
                            </h3>
                            {getStatusBadge(property.diligenceStatus || 'pending')}
                          </div>
                          <p className="text-sm text-gray-500">
                            {property.neighborhood} • {property.city}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Proprietário: {property.owners?.[0]?.fullName || 'Não informado'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{property.value}</p>
                          {property.aiAnalysis && getRiskBadge(property.aiAnalysis.riskLevel)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progresso da Documentação</span>
                          <span className="font-medium">{property.diligenceProgress || 0}%</span>
                        </div>
                        <Progress 
                          value={property.diligenceProgress || 0} 
                          className="h-2"
                        />
                      </div>

                      {/* Certificates Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {property.certificates?.slice(0, 6).map((cert, index) => (
                          <div key={cert.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700">{cert.name}</span>
                              {cert.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {cert.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-500" />}
                              {cert.status === 'pending' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <div className="text-xs text-gray-500">
                              {cert.status === 'completed' && cert.completedAt && 
                                `Coletado em ${new Date(cert.completedAt).toLocaleDateString('pt-BR')}`}
                              {cert.status === 'in_progress' && "Coleta em andamento..."}
                              {cert.status === 'pending' && "Aguardando coleta"}
                            </div>
                            {cert.status === 'completed' && cert.url && (
                              <Button variant="ghost" size="sm" className="mt-2 h-6 w-full p-0 text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Visualizar
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        {property.diligenceStatus === 'completed' && (
                          <>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-green-800">Due Diligence Concluída</span>
                              </div>
                              <p className="text-sm text-green-700 mb-3">
                                Todos os documentos foram coletados e validados. Imóvel aprovado para comercialização.
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleViewReport(property.id)}
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Relatório Completo
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handlePlaceInMarket(property.id)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Colocar no Mercado
                                </Button>
                              </div>
                            </div>
                          </>
                        )}

                        {property.diligenceStatus === 'in_progress' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-blue-800">Coleta em Andamento</span>
                            </div>
                            <p className="text-sm text-blue-700 mb-3">
                              Alguns documentos ainda estão sendo coletados. O sistema notificará quando estiver completo.
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Atualizar Status
                            </Button>
                          </div>
                        )}

                        {property.diligenceStatus === 'pending' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                              <span className="font-medium text-yellow-800">Aguardando Início</span>
                            </div>
                            <p className="text-sm text-yellow-700 mb-3">
                              Due Diligence ainda não foi iniciada para este imóvel.
                            </p>
                            <Button 
                              size="sm"
                              onClick={() => handleStartDiligence(property.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Iniciar Due Diligence
                            </Button>
                          </div>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
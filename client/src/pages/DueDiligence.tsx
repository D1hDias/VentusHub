import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DueDiligenceModal } from "@/components/DueDiligenceModal";
import { SimpleKPICard } from "@/components/SimpleKPICard";
import { useResponsive } from "@/hooks/useMediaQuery";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";

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
  Eye,
  Bot,
  Users,
  Send,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Property {
  id: string;
  sequenceNumber: string;
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
    cpf?: string;
  }>;
  diligenceProgress: number;
  diligenceStatus: 'pending' | 'in_progress' | 'completed' | 'with_issues';
  createdAt: string;
}

// Dados serão carregados da API

export default function DueDiligence() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: [] as string[],
    progress: "all"
  });
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isMobile } = useResponsive();
  const { getListItemVariants } = useSmoothtTransitions();

  const propertiesPerPage = 10;

  // Carregar propriedades da API
  const { data: allProperties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      return response.json();
    },
  });

  // Filtrar apenas propriedades para Due Diligence
  const properties = allProperties
    .filter((prop: any) => prop.status === 'diligence' || prop.currentStage === 2)
    .map((prop: any, index: number) => {
      // Simular progresso baseado em localStorage ou outros dados
      const diligenceData = localStorage.getItem(`diligence_${prop.id}`);
      let diligenceStatus: 'pending' | 'in_progress' | 'completed' | 'with_issues' = 'pending';
      let diligenceProgress = 0;
      
      if (diligenceData) {
        const data = JSON.parse(diligenceData);
        const allItems = [
          ...(data.propertyItems || []),
          ...(data.personalItems || [])
        ];
        const totalItems = allItems.length;
        const completedItems = allItems.filter((item: any) => item.status === 'completed').length;
        const requestedItems = allItems.filter((item: any) => item.status === 'requested' || item.status === 'completed').length;
        
        if (totalItems > 0) {
          diligenceProgress = Math.round((completedItems / totalItems) * 100);
          
          if (completedItems === totalItems) {
            diligenceStatus = 'completed';
          } else if (requestedItems > 0) {
            diligenceStatus = 'in_progress';
          }
        }
      }

      return {
        id: prop.id.toString(),
        sequenceNumber: prop.sequenceNumber || '00000',
        type: prop.type,
        street: prop.street,
        number: prop.number,
        neighborhood: prop.neighborhood,
        city: prop.city,
        value: (() => {
          const numValue = typeof prop.value === 'number' ? prop.value : parseFloat(prop.value);
          if (isNaN(numValue)) return prop.value;
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numValue);
        })(),
        currentStage: prop.currentStage,
        status: prop.status,
        owners: prop.owners || [],
        diligenceProgress,
        diligenceStatus,
        createdAt: prop.createdAt
      };
    });

  // Calculando estatísticas
  const stats = {
    completed: properties.filter(p => p.diligenceStatus === 'completed').length,
    inProgress: properties.filter(p => p.diligenceStatus === 'in_progress').length,
    pending: properties.filter(p => p.diligenceStatus === 'pending').length,
    total: properties.length
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          badge: <Badge className="bg-green-500 text-white">Concluída</Badge>,
          box: {
            title: 'Due Diligence Concluída',
            message: 'Todos os documentos foram coletados e validados',
            icon: CheckCircle
          }
        };
      case 'in_progress':
        return { 
          badge: <Badge className="bg-blue-500 text-white">Em Andamento</Badge>,
          box: {
            title: 'Due Diligence em andamento',
            message: 'Documentos estão sendo coletados',
            icon: Clock
          }
        };
      case 'pending':
        return { 
          badge: <Badge variant="outline" className="text-orange-600 border-orange-600">Aguardando Início</Badge>,
          box: {
            title: 'Aguardando Início',
            message: 'Due Diligence ainda não foi iniciada para este imóvel',
            icon: AlertTriangle
          }
        };
      case 'with_issues':
        return { 
          badge: <Badge variant="destructive">Com Pendências</Badge>,
          box: {
            title: 'Pendências Encontradas',
            message: 'Foram encontrados problemas que precisam de atenção',
            icon: AlertTriangle
          }
        };
      default:
        return { 
          badge: <Badge variant="outline">Desconhecido</Badge>,
          box: {
            title: 'Status Indefinido',
            message: 'Status não definido',
            icon: AlertTriangle
          }
        };
    }
  };

  const handleStartDiligence = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
      setIsModalOpen(true);
    }
  };

  // Função para navegar para detalhes da propriedade
  const handleViewProperty = (property: Property) => {
    console.log('Navegando para propriedade:', property.id);
    setLocation(`/property/${property.id}`);
  };

  const handleConfirmStartDiligence = () => {
    // TODO: Implementar atualização via API se necessário
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = searchTerm === "" || 
      property.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.sequenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owners?.some(owner => 
        owner.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatusFilter = filters.status.length === 0 || 
      filters.status.includes(property.diligenceStatus || 'pending');

    return matchesSearch && matchesStatusFilter;
  });

  // Paginação
  const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
  const startIndex = (currentPage - 1) * propertiesPerPage;
  const endIndex = startIndex + propertiesPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const clearFilters = () => {
    setFilters({ status: [], progress: "all" });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.progress !== "all";

  return (
    <div className="p-6 space-y-6">
        
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Emissão de certidões e pré-análise jurídica com IA
          </p>
        </div>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm">
            <Bot className="h-4 w-4 mr-2" />
            Análise IA
          </Button>
        </div>

        {/* KPI Cards - Responsivo */}
        {isMobile ? (
          // Layout em grid 2x2 para mobile - otimizado para espaço
          <div className="grid grid-cols-2 gap-2">
            <motion.div variants={getListItemVariants()} className="w-full">
              <SimpleKPICard 
                title="Em Andamento"
                value={stats.inProgress}
                icon={Clock}
                iconBgColor="#001f3f"
                subtitle="Processos ativos"
              />
            </motion.div>
            <motion.div variants={getListItemVariants()} className="w-full">
              <SimpleKPICard 
                title="Pendentes"
                value={stats.pending}
                icon={AlertTriangle}
                iconBgColor="#d47c16"
                subtitle="Aguardando início"
              />
            </motion.div>
            <motion.div variants={getListItemVariants()} className="w-full">
              <SimpleKPICard 
                title="Concluídas"
                value={stats.completed}
                icon={CheckCircle}
                iconBgColor="#1ea475"
                subtitle="Documentação completa"
              />
            </motion.div>
            <motion.div variants={getListItemVariants()} className="w-full">
              <SimpleKPICard 
                title="Total"
                value={stats.total}
                icon={Users}
                iconBgColor="#001f3f"
                subtitle="Imóveis cadastrados"
              />
            </motion.div>
          </div>
        ) : (
          // Layout desktop mantém o design atual
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="button-interactive border rounded-md m-1 transition-shadow" style={{
              '--hover-shadow': `0 4px 12px rgba(0, 31, 63, 0.15)`
            }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#001f3f'}}>
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                      <p className="text-2xl font-bold" style={{color: '#001f3f'}}>{stats.inProgress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="button-interactive border rounded-md m-1 transition-shadow" style={{
              '--hover-shadow': `0 4px 12px rgba(212, 124, 22, 0.15)`
            }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#d47c16'}}>
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                      <p className="text-2xl font-bold" style={{color: '#d47c16'}}>{stats.pending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="button-interactive border rounded-md m-1 transition-shadow" style={{
              '--hover-shadow': `0 4px 12px rgba(30, 164, 117, 0.15)`
            }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#1ea475'}}>
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                      <p className="text-2xl font-bold" style={{color: '#1ea475'}}>{stats.completed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="button-interactive border rounded-md m-1 transition-shadow" style={{
              '--hover-shadow': `0 4px 12px rgba(0, 31, 63, 0.15)`
            }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#001f3f'}}>
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold" style={{color: '#001f3f'}}>{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, endereço ou proprietário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtros
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                          {filters.status.length + (filters.progress !== "all" ? 1 : 0)}
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
        <Card>
          <CardHeader>
            <CardTitle>
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
            ) : currentProperties.length > 0 ? (
              <div className="space-y-6 p-6">
                {currentProperties.map((property: Property) => {
                  const statusInfo = getStatusInfo(property.diligenceStatus);
                  const StatusIcon = statusInfo.box.icon;
                  
                  return (
                    <div 
                      key={property.id} 
                      className="button-interactive border rounded-md m-1 transition-shadow"
                      onClick={() => handleViewProperty(property)}
                      style={{
                        '--hover-shadow': `0 4px 12px rgba(0, 31, 63, 0.08)`
                      }}
                    >
                      <Card>
                      <CardContent className="p-6">
                        
                        {/* Property Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {property.sequenceNumber}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {property.type} - {property.street}, {property.number}
                              </h3>
                              {statusInfo.badge}
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
                          </div>
                        </div>

                        {/* Progress Bar - só aparece se tiver progresso */}
                        {property.diligenceStatus !== 'pending' && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-gray-600">
                                {property.diligenceStatus === 'completed' 
                                  ? 'Documentação Concluída' 
                                  : 'Progresso da Validação'
                                }
                              </span>
                              <span className="font-medium">{property.diligenceProgress}% validado</span>
                            </div>
                            <Progress 
                              value={property.diligenceProgress} 
                              className={`h-2 ${property.diligenceStatus === 'completed' ? 'bg-green-100' : ''}`}
                            />
                          </div>
                        )}

                        {/* Status Box */}
                        <div className={
                          property.diligenceStatus === 'completed' ? 'bg-green-50 border border-green-200 rounded-lg p-4 flex-1' :
                          property.diligenceStatus === 'in_progress' ? 'bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1' :
                          property.diligenceStatus === 'pending' ? 'bg-orange-50 border border-orange-200 rounded-lg p-4 flex-1' :
                          property.diligenceStatus === 'with_issues' ? 'bg-red-50 border border-red-200 rounded-lg p-4 flex-1' :
                          'bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1'
                        }>
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={
                              property.diligenceStatus === 'completed' ? 'h-5 w-5 text-green-600' :
                              property.diligenceStatus === 'in_progress' ? 'h-5 w-5 text-blue-600' :
                              property.diligenceStatus === 'pending' ? 'h-5 w-5 text-orange-600' :
                              property.diligenceStatus === 'with_issues' ? 'h-5 w-5 text-red-600' :
                              'h-5 w-5 text-gray-600'
                            } />
                            <span className={
                              property.diligenceStatus === 'completed' ? 'font-medium text-green-800' :
                              property.diligenceStatus === 'in_progress' ? 'font-medium text-blue-800' :
                              property.diligenceStatus === 'pending' ? 'font-medium text-orange-800' :
                              property.diligenceStatus === 'with_issues' ? 'font-medium text-red-800' :
                              'font-medium text-gray-800'
                            }>
                              {statusInfo.box.title}
                            </span>
                          </div>
                          <p className={
                            property.diligenceStatus === 'completed' ? 'text-sm text-green-700 mb-3' :
                            property.diligenceStatus === 'in_progress' ? 'text-sm text-blue-700 mb-3' :
                            property.diligenceStatus === 'pending' ? 'text-sm text-orange-700 mb-3' :
                            property.diligenceStatus === 'with_issues' ? 'text-sm text-red-700 mb-3' :
                            'text-sm text-gray-700 mb-3'
                          }>
                            {statusInfo.box.message}
                          </p>
                          
                          {/* Action Button */}
                          {property.diligenceStatus === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDiligence(property.id);
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Iniciar Due Diligence
                            </Button>
                          )}
                          
                          {property.diligenceStatus === 'in_progress' && (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartDiligence(property.id);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Continuar Due Diligence
                            </Button>
                          )}
                          
                          {property.diligenceStatus === 'completed' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-green-600 text-green-600 hover:bg-green-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Relatório
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = '/mercado';
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Anunciar o Imóvel
                              </Button>
                            </div>
                          )}
                        </div>

                      </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum imóvel encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProperties.length)} de {filteredProperties.length} imóveis
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Due Diligence Modal */}
        {selectedProperty && (
          <DueDiligenceModal 
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            property={{
              id: selectedProperty.id,
              sequenceNumber: selectedProperty.sequenceNumber,
              street: selectedProperty.street,
              number: selectedProperty.number,
              type: selectedProperty.type,
              owners: selectedProperty.owners
            }}
          />
        )}

    </div>
  );
}
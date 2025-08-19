import { useLocation } from "wouter";
import { Plus, Search, Filter, X, Circle, Clock, CheckCircle, FileText, Pen, FileCheck, Award, ArrowRight, ArrowLeft, Eye, Edit, MoreHorizontal, Share, Trash2, Home, Building, CheckSquare, XSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyModal } from "@/components/PropertyModal";
import { DocumentsPendingModal } from "@/components/DocumentsPendingModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";

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
}

interface DocumentationProgressProps {
  property: Property;
}

interface PropertyActionsProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}

const DocumentationProgress = ({ property }: DocumentationProgressProps) => {
  const [docData, setDocData] = useState({
    progress: 0,
    uploadedCount: 0,
    totalRequired: 6,
    filledFieldsCount: 0,
    totalFields: 8
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    const getDocumentationProgress = async (prop: Property) => {
      // Lista de documentos obrigatórios ATUALIZADOS
      const requiredDocuments = [
        { name: 'ONUS_REAIS', label: 'Ônus Reais' },
        { name: 'ESPELHO_IPTU', label: 'Espelho de IPTU' },
        { name: 'RG_CNH', label: 'RG/CNH dos Proprietários' },
        { name: 'CERTIDAO_ESTADO_CIVIL', label: 'Certidão de Estado Civil' },
        { name: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de Residência' }
      ];

      // Campos obrigatórios para verificar preenchimento
      const requiredFields = [
        'type', 'street', 'number', 'neighborhood',
        'city', 'value', 'owners', 'registrationNumber'
      ];

      let uploadedCount = 0;
      let filledFieldsCount = 0;

      try {
        // Buscar documentos enviados
        if (prop.id) {
          const response = await fetch(`/api/properties/${prop.id}/documents`);
          if (response.ok) {
            const documents = await response.json();
            uploadedCount = documents.length;
          } else if (response.status === 404) {
            // Propriedade não encontrada ou sem documentos - isso é normal
            console.log(`Property ${prop.id}: No documents found or access denied`);
            uploadedCount = 0;
          } else {
            console.log(`Erro ao buscar documentos: ${response.status} - ${response.statusText}`);
            uploadedCount = 0;
          }
        }
      } catch (error) {
        console.log('Erro de rede ao buscar documentos:', error);
        uploadedCount = 0;
      }

      // Contar campos preenchidos
      filledFieldsCount = requiredFields.filter(field => {
        const value = prop[field as keyof Property];
        if (field === 'owners') {
          return value && Array.isArray(value) && value.length > 0 && value[0]?.fullName;
        }
        return value && value !== '';
      }).length;

      // Calcular progresso combinado (50% docs + 50% campos)
      const docProgress = (uploadedCount / requiredDocuments.length) * 50;
      const fieldsProgress = (filledFieldsCount / requiredFields.length) * 50;
      const totalProgress = Math.min(Math.round(docProgress + fieldsProgress), 100);

      return {
        progress: totalProgress,
        uploadedCount,
        totalRequired: requiredDocuments.length,
        filledFieldsCount,
        totalFields: requiredFields.length,
        requiredDocuments
      };
    };

    getDocumentationProgress(property).then(setDocData);
  }, [property.id, property.currentStage, property]);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressText = (progress: number) => {
    if (progress >= 100) return "Completo";
    if (progress >= 75) return "Quase completo";
    if (progress >= 50) return "Em andamento";
    return "Pendente";
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {docData.uploadedCount}/{docData.totalRequired} docs • {docData.filledFieldsCount}/{docData.totalFields} campos
          </span>
          <span className="font-medium">{docData.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(docData.progress)}`}
            style={{ width: `${docData.progress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {getProgressText(docData.progress)}
        </div>
        {docData.progress < 100 && (
          <div
            className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
            title="Clique para ver detalhes dos pendentes"
            onClick={() => setShowPendingModal(true)}
          >
            📋 {docData.uploadedCount < docData.totalRequired ? 'Documentos pendentes' : 'Campos pendentes'}
          </div>
        )}
      </div>
      {/* Modal de Documentos Pendentes */}
      <DocumentsPendingModal
        open={showPendingModal}
        onOpenChange={setShowPendingModal}
        entity={property}
        config={{
          entityType: 'property',
          stage: property.currentStage
        }}
      />
    </>
  );
};

const PropertyActions = ({ property, onEdit, onDelete }: PropertyActionsProps) => {
  const [, setLocation] = useLocation(); // Correção: usar destructuring correto

  const handleViewDetails = () => {
    setLocation(`/property/${property.id}`);
  };

  const handleEdit = () => {
    onEdit(property);
  };

  const handleDelete = () => {
    onDelete(property);
  };

  const handleAdvanceStage = async (property: Property, newStage: number) => {
    try {
      const stageStatusMap: { [key: number]: string } = {
        1: 'captacao',
        2: 'diligence',
        3: 'mercado',
        4: 'proposta',
        5: 'contrato',
        6: 'instrumento',
        7: 'concluido'
      };

      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentStage: newStage,
          status: stageStatusMap[newStage]
        }),
      });

      if (response.ok) {
        // Recarregar a página para mostrar as mudanças
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao alterar estágio:', error);
    }
  };

  const getStageButtons = (property: Property) => {
    const currentStage = property.currentStage || 1;
    const buttons = [];

    // Botão de retroceder (se não estiver no primeiro estágio)
    if (currentStage > 1) {
      const prevStageLabels: { [key: number]: string } = {
        2: 'Captação',
        3: 'Due Diligence',
        4: 'Mercado',
        5: 'Propostas',
        6: 'Contratos',
        7: 'Instrumento'
      };

      buttons.push(
        <Button
          key="prev"
          variant="outline"
          size="sm"
          onClick={() => handleAdvanceStage(property, currentStage - 1)}
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-gray-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {prevStageLabels[currentStage]}
        </Button>
      );
    }

    // Botão de avançar (se não estiver no último estágio)
    if (currentStage < 7) {
      const nextStageLabels: { [key: number]: string } = {
        1: 'Due Diligence',
        2: 'Mercado',
        3: 'Propostas',
        4: 'Contratos',
        5: 'Instrumento',
        6: 'Concluído'
      };

      buttons.push(
        <Button
          key="next"
          variant="default"
          size="sm"
          onClick={() => handleAdvanceStage(property, currentStage + 1)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          {nextStageLabels[currentStage]}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleViewDetails}
        className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
        title="Ver Detalhes"
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleEdit}
        className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
        title="Editar Propriedade"
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
        title="Excluir Propriedade"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {getStageButtons(property)}
    </div>
  );
};

export default function PropertyCapture() {
  const queryClient = useQueryClient();
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: [] as string[],
    type: [] as string[],
    city: [] as string[],
    priceRange: "all"
  });
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  const getStatusBadge = (property: Property) => {
    const status = property.status || 'captacao';
    const currentStage = property.currentStage || 1;

    const getStageStatus = () => {
      switch (currentStage) {
        case 1:
          return {
            key: 'captacao',
            label: 'Em Captação',
            color: 'orange',
            icon: Circle
          };
        case 2:
          return {
            key: 'diligence',
            label: 'Due Diligence',
            color: 'blue',
            icon: Clock
          };
        case 3:
          return {
            key: 'mercado',
            label: 'No Mercado',
            color: 'green',
            icon: CheckCircle
          };
        case 4:
          return {
            key: 'proposta',
            label: 'Com Proposta',
            color: 'purple',
            icon: FileText
          };
        case 5:
          return {
            key: 'contrato',
            label: 'Em Contrato',
            color: 'indigo',
            icon: Pen
          };
        case 6:
          return {
            key: 'instrumento',
            label: 'Instrumento',
            color: 'teal',
            icon: FileCheck
          };
        case 7:
          return {
            key: 'concluido',
            label: 'Concluído',
            color: 'green',
            icon: Award
          };
        default:
          return {
            key: 'captacao',
            label: 'Em Captação',
            color: 'orange',
            icon: Circle
          };
      }
    };

    const stageInfo = getStageStatus();
    const IconComponent = stageInfo.icon;

    return (
      <Badge
        variant={stageInfo.key === 'concluido' ? 'default' : 'outline'}
        className={`text-${stageInfo.color}-600 border-${stageInfo.color}-600 ${stageInfo.key === 'concluido' ? 'bg-green-600 text-white' : ''
          }`}
      >
        <IconComponent className="h-3 w-3 mr-1" />
        {stageInfo.label}
      </Badge>
    );
  };

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = searchTerm === "" ||
      property.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owners?.some(owner =>
        owner.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatusFilter = filters.status.length === 0 ||
      filters.status.includes(property.status || 'captacao');

    const matchesTypeFilter = filters.type.length === 0 ||
      filters.type.includes(property.type);

    const matchesCityFilter = filters.city.length === 0 ||
      filters.city.includes(property.city);

    const matchesPriceFilter = (() => {
      if (filters.priceRange === "all") return true;
      const value = typeof property.value === 'string'
        ? parseFloat(property.value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        : property.value || 0;
      switch (filters.priceRange) {
        case "0-300k": return value <= 300000;
        case "300k-500k": return value > 300000 && value <= 500000;
        case "500k-1m": return value > 500000 && value <= 1000000;
        case "1m+": return value > 1000000;
        default: return true;
      }
    })();

    return matchesSearch && matchesStatusFilter && matchesTypeFilter &&
      matchesCityFilter && matchesPriceFilter;
  });

  const uniqueStatuses = [...new Set((properties || []).map((p: Property) => p.status || 'captacao'))];
  const uniqueTypes = [...new Set((properties || []).map((p: Property) => p.type || 'Apartamento'))];
  const uniqueCities = [...new Set((properties || []).map((p: Property) => p.city || 'São Paulo'))];

  // Calculate property capture statistics
  const captureStats = {
    total: properties.length,
    pending: properties.filter((p: Property) => p.currentStage === 1 || !p.currentStage).length,
    approved: properties.filter((p: Property) => p.currentStage && p.currentStage > 1).length,
    rejected: 0, // Mock data - this would come from a real status field
  };

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType as keyof typeof prev] as string[], value]
        : (prev[filterType as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      type: [],
      city: [],
      priceRange: "all"
    });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.type.length > 0 ||
    filters.city.length > 0 || filters.priceRange !== "all";

  const handleDeleteProperty = async (property: Property) => {
    const propertyAddress = `${property.street}, ${property.number} - ${property.neighborhood}, ${property.city}`;

    if (window.confirm(`Tem certeza que deseja excluir a propriedade:\n\n${property.type} - ${propertyAddress}\n\nEsta ação não pode ser desfeita.`)) {
      try {
        const response = await fetch(`/api/properties/${property.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Revalidar a lista de propriedades
          queryClient.invalidateQueries({ queryKey: ["/api/properties"] });

          // Mostrar mensagem de sucesso (opcional)
          console.log('Propriedade excluída com sucesso');
        } else {
          const errorData = await response.json();
          alert(`Erro ao excluir propriedade: ${errorData.message || 'Erro desconhecido'}`);
        }
      } catch (error) {
        console.error('Erro ao excluir propriedade:', error);
        alert('Erro ao excluir propriedade. Tente novamente.');
      }
    }
  };

  return (
    <div className="p-6 space-y-6 card-desktop-compact">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-desktop-base">
            Gerencie e acompanhe o processo de captação dos seus imóveis
          </p>
        </div>
        <Button
          onClick={() => setShowPropertyModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm btn-desktop-compact"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Captação
        </Button>
      </div>

      {/* KPI Cards - Property Capture Statistics */}
      <motion.div 
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        {/* Data for KPI cards */}
        {(() => {
          const kpiData = [
            {
              title: "Total Captados",
              value: captureStats.total,
              icon: Home,
              color: "hsl(211, 100%, 50%)", // blue
              subtitle: "Imóveis cadastrados"
            },
            {
              title: "Pendentes",
              value: captureStats.pending,
              icon: Clock,
              color: "hsl(32, 81%, 46%)", // orange
              subtitle: "Aguardando análise"
            },
            {
              title: "Aprovados",
              value: captureStats.approved,
              icon: CheckSquare,
              color: "hsl(159, 69%, 38%)", // green
              subtitle: "Em processamento"
            },
            {
              title: "Rejeitados",
              value: captureStats.rejected,
              icon: XSquare,
              color: "hsl(0, 84%, 60%)", // red
              subtitle: "Não aprovados"
            }
          ];
          
          return isMobile ? (
            // Mobile Layout (2x2 grid)
            <div className="grid grid-cols-2 gap-3">
              {kpiData.map((kpi, index) => (
                <motion.div
                  key={index}
                  variants={getListItemVariants()}
                  className="w-full"
                >
                  <motion.div
                    className="cursor-pointer group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: kpi.color }}
                      />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200"
                            style={{ backgroundColor: kpi.color }}
                          >
                            <kpi.icon className="h-5 w-5 text-white" />
                          </div>
                          <motion.div
                            className="text-right"
                            key={kpi.value}
                            initial={{ scale: 1.1, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <div 
                              className="text-2xl font-bold tabular-nums leading-none"
                              style={{ color: kpi.color }}
                            >
                              {kpi.value}
                            </div>
                          </motion.div>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-none">{kpi.title}</h3>
                          <p className="text-xs text-gray-500 leading-tight">{kpi.subtitle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          ) : (
            // Desktop Layout (1x4 grid)
            <div className="grid grid-cols-4 gap-4">
              {kpiData.map((kpi, index) => (
                <motion.div
                  key={index}
                  variants={getListItemVariants()}
                  className="h-full"
                >
                  <motion.div
                    className="cursor-pointer group h-full"
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col overflow-hidden relative hover:border-gray-300">
                      {/* Subtle gradient background */}
                      <div 
                        className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity"
                        style={{ 
                          background: `linear-gradient(135deg, ${kpi.color} 0%, transparent 100%)` 
                        }}
                      />
                      
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                            style={{ backgroundColor: kpi.color }}
                          >
                            <kpi.icon className="h-6 w-6 text-white" />
                          </div>
                          <motion.div
                            className="text-right"
                            key={kpi.value}
                            initial={{ scale: 1.1, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.1 }}
                          >
                            <div 
                              className="text-3xl font-bold tabular-nums leading-none"
                              style={{ color: kpi.color }}
                            >
                              {kpi.value}
                            </div>
                          </motion.div>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-end">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{kpi.title}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed">{kpi.subtitle}</p>
                        </div>
                        
                        {/* Bottom accent line */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300" 
                             style={{ color: kpi.color }} />
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          );
        })()}
      </motion.div>

      {/* Search and Filters com padding balanceado */}
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
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                        {filters.status.length + filters.type.length + filters.city.length +
                          (filters.priceRange !== "all" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <div className="p-4 space-y-4">
                    {/* Status Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Status</h4>
                      <div className="space-y-2">
                        {uniqueStatuses.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`status-${status}`}
                              checked={filters.status.includes(status)}
                              onChange={(e) => handleFilterChange('status', status, e.target.checked)}
                              className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`status-${status}`} className="text-sm text-gray-700">
                              {status === 'captacao' ? 'Em Captação' :
                                status === 'diligence' ? 'Due Diligence' :
                                  status === 'mercado' ? 'No Mercado' :
                                    status === 'proposta' ? 'Com Proposta' :
                                      status === 'contrato' ? 'Em Contrato' :
                                        status === 'instrumento' ? 'Instrumento' :
                                          status === 'concluido' ? 'Concluído' : status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Tipo</h4>
                      <div className="space-y-2">
                        {uniqueTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`type-${type}`}
                              checked={filters.type.includes(type)}
                              onChange={(e) => handleFilterChange('type', type, e.target.checked)}
                              className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`type-${type}`} className="text-sm text-gray-700">{type}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* City Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Cidade</h4>
                      <div className="space-y-2">
                        {uniqueCities.map((city) => (
                          <div key={city} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`city-${city}`}
                              checked={filters.city.includes(city)}
                              onChange={(e) => handleFilterChange('city', city, e.target.checked)}
                              className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`city-${city}`} className="text-sm text-gray-700">{city}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Faixa de Preço</h4>
                      <select
                        value={filters.priceRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">Todas as faixas</option>
                        <option value="0-300k">Até R$ 300.000</option>
                        <option value="300k-500k">R$ 300.000 - R$ 500.000</option>
                        <option value="500k-1m">R$ 500.000 - R$ 1.000.000</option>
                        <option value="1m+">Acima de R$ 1.000.000</option>
                      </select>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
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

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Imóveis em Captação ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-desktop-compact">
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="px-4 py-3 text-gray-900 font-medium w-20">#</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Imóvel</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Proprietário</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Status</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Documentação</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property: Property, index: number) => (
                    <TableRow key={property.id || Math.random()} className="border-gray-200 row-hover">
                      <TableCell className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {property.sequenceNumber || String(index + 1).padStart(5, '0')}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {property.type} - {property.street}, {property.number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.neighborhood} • {property.city}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(typeof property.value === 'string'
                              ? parseFloat(property.value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
                              : property.value || 0)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {property.owners?.[0]?.fullName || 'Não informado'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {property.owners?.[0]?.phone || 'Telefone não informado'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getStatusBadge(property)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <DocumentationProgress property={property} />
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <PropertyActions
                          property={property}
                          onEdit={(prop) => {
                            setSelectedProperty({
                              ...prop,
                              sequenceNumber: prop.sequenceNumber || String(index + 1).padStart(5, '0')
                            });
                            setShowPropertyModal(true);
                          }}
                          onDelete={handleDeleteProperty}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Modal */}
      <PropertyModal
        open={showPropertyModal}
        onOpenChange={(open) => {
          setShowPropertyModal(open);
          if (!open) {
            setSelectedProperty(null);
          }
        }}
        property={selectedProperty}
      />
    </div>
  );
}
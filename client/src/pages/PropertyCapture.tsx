import { DocumentsPendingModal } from "@/components/DocumentsPendingModal";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter, X, Circle, Clock, CheckCircle, FileText, Pen, FileCheck, Award, Eye, Edit, MoreHorizontal, Share} from "lucide-react";
import { PropertyModal } from "@/components/PropertyModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator,} from "@/components/ui/dropdown-menu";

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
}

interface DocumentationProgressProps {
  property: Property;
}

interface PropertyActionsProps {
  property: Property;
  onEdit: (property: Property) => void;
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
          }
        }
      } catch (error) {
        console.log('Erro ao buscar documentos:', error);
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
        property={property}
        docData={docData}
      />
    </>
  );
};

const PropertyActions = ({ property, onEdit }: PropertyActionsProps) => {
  const handleViewDetails = () => {
    onEdit(property);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleViewDetails}
      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
    >
      <Eye className="h-4 w-4 mr-1" />
      Ver Detalhes
    </Button>
  );
};

export default function PropertyCapture() {
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: [] as string[],
    type: [] as string[],
    city: [] as string[],
    priceRange: "all"
  });

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
        className={`text-${stageInfo.color}-600 border-${stageInfo.color}-600 ${
          stageInfo.key === 'concluido' ? 'bg-green-600 text-white' : ''
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Captação de Imóveis</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe o processo de captação dos seus imóveis
          </p>
        </div>
        <Button onClick={() => setShowPropertyModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Captação
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por endereço, proprietário ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
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
                      <h4 className="font-medium mb-2">Status</h4>
                      <div className="space-y-2">
                        {uniqueStatuses.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`status-${status}`}
                              checked={filters.status.includes(status)}
                              onChange={(e) => handleFilterChange('status', status, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`status-${status}`} className="text-sm">
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
                      <h4 className="font-medium mb-2">Tipo</h4>
                      <div className="space-y-2">
                        {uniqueTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`type-${type}`}
                              checked={filters.type.includes(type)}
                              onChange={(e) => handleFilterChange('type', type, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`type-${type}`} className="text-sm">{type}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* City Filter */}
                    <div>
                      <h4 className="font-medium mb-2">Cidade</h4>
                      <div className="space-y-2">
                        {uniqueCities.map((city) => (
                          <div key={city} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`city-${city}`}
                              checked={filters.city.includes(city)}
                              onChange={(e) => handleFilterChange('city', city, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`city-${city}`} className="text-sm">{city}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <h4 className="font-medium mb-2">Faixa de Preço</h4>
                      <select
                        value={filters.priceRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                        className="w-full p-2 border rounded-md"
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
          <CardTitle>
            Imóveis em Captação ({filteredProperties.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property: Property) => (
                  <TableRow key={property.id || Math.random()}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {property.type} - {property.street}, {property.number}
                        </div>
                        <div className="text-sm text-muted-foreground">
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
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {property.owners?.[0]?.fullName || 'Não informado'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {property.owners?.[0]?.phone || 'Telefone não informado'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(property)}
                    </TableCell>
                    <TableCell>
                      <DocumentationProgress property={property} />
                    </TableCell>
                    <TableCell>
                      <PropertyActions 
                        property={property} 
                        onEdit={(prop) => {
                          setSelectedProperty(prop);
                          setShowPropertyModal(true);
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
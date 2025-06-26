import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, Search, Filter, X, 
  Circle, Clock, CheckCircle, FileText, Pen, FileCheck, Award,
  Eye, Edit, MoreHorizontal, Share
} from "lucide-react";
import { PropertyModal } from "@/components/PropertyModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Property {
  id: string;
  type: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  value: number;
  currentStage: number;
  status: string;
  owners?: Array<{
    fullName: string;
    phone: string;
  }>;
}

interface DocumentationProgressProps {
  property: Property;
}

const DocumentationProgress = ({ property }: DocumentationProgressProps) => {
  const [docData, setDocData] = useState({ progress: 0, uploadedCount: 0, totalRequired: 6 });
  
  useEffect(() => {
    const getDocumentationProgress = async (prop: Property) => {
      // Lista de documentos obrigatórios baseada na documentação
      const requiredDocuments = [
        'IPTU', 'Inscrição do Imóvel', 'RG/CNH dos Proprietários', 
        'Boleto Condomínio', 'Cópia RGI', 'Ônus Reais'
      ];
      
      try {
        // Buscar documentos enviados da propriedade
        const response = await fetch(`/api/properties/${prop.id}/documents`);
        const documents = await response.json();
        
        const uploadedCount = documents.length;
        const totalRequired = requiredDocuments.length;
        const progress = Math.min(Math.round((uploadedCount / totalRequired) * 100), 100);
        
        return { progress, uploadedCount, totalRequired };
      } catch (error) {
        // Fallback baseado no estágio
        const progress = prop.currentStage === 1 ? 30 : 
                        prop.currentStage === 2 ? 75 : 100;
        return { progress, uploadedCount: 0, totalRequired: requiredDocuments.length };
      }
    };

    getDocumentationProgress(property).then(setDocData);
  }, [property.id]);
  
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {docData.uploadedCount}/{docData.totalRequired} documentos
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
        {docData.progress === 100 ? "Completo" : 
         docData.progress >= 75 ? "Quase completo" :
         docData.progress >= 50 ? "Em andamento" : "Pendente"}
      </div>
    </div>
  );
};

interface PropertyActionsProps {
  property: Property;
  onEdit: (property: Property) => void;
}

const PropertyActions = ({ property, onEdit }: PropertyActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(property)}
        className="text-blue-600 hover:text-blue-800"
      >
        <Eye className="h-4 w-4 mr-1" />
        Ver Detalhes
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(property)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FileText className="h-4 w-4 mr-2" />
            Relatório
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
    
    switch (status) {
      case 'captacao':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Circle className="h-3 w-3 mr-1 fill-orange-600" />
            Em Captação
          </Badge>
        );
      case 'diligence':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Clock className="h-3 w-3 mr-1" />
            Due Diligence
          </Badge>
        );
      case 'mercado':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            No Mercado
          </Badge>
        );
      case 'proposta':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            <FileText className="h-3 w-3 mr-1" />
            Com Proposta
          </Badge>
        );
      case 'contrato':
        return (
          <Badge variant="outline" className="text-indigo-600 border-indigo-600">
            <Pen className="h-3 w-3 mr-1" />
            Em Contrato
          </Badge>
        );
      case 'instrumento':
        return (
          <Badge variant="outline" className="text-teal-600 border-teal-600">
            <FileCheck className="h-3 w-3 mr-1" />
            Instrumento
          </Badge>
        );
      case 'concluido':
        return (
          <Badge className="bg-green-600 text-white">
            <Award className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Em Andamento
          </Badge>
        );
    }
  };

  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = searchTerm === "" || 
      property.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owners?.[0]?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status.length === 0 || 
      filters.status.includes(property.status || 'captacao');

    const matchesType = filters.type.length === 0 || 
      filters.type.includes(property.type);

    const matchesCity = filters.city.length === 0 || 
      filters.city.includes(property.city);

    let matchesPrice = true;
    if (filters.priceRange !== "all") {
      const value = Number(property.value);
      switch (filters.priceRange) {
        case "0-300k":
          matchesPrice = value <= 300000;
          break;
        case "300k-500k":
          matchesPrice = value > 300000 && value <= 500000;
          break;
        case "500k-1m":
          matchesPrice = value > 500000 && value <= 1000000;
          break;
        case "1m+":
          matchesPrice = value > 1000000;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesCity && matchesPrice;
  });

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => {
      if (filterType === "priceRange") {
        return { ...prev, priceRange: value };
      }
      
      const currentFilter = prev[filterType as keyof typeof prev] as string[];
      const isSelected = currentFilter.includes(value);
      
      return {
        ...prev,
        [filterType]: isSelected 
          ? currentFilter.filter(item => item !== value)
          : [...currentFilter, value]
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      status: [],
      type: [],
      city: [],
      priceRange: "all"
    });
  };

  const hasActiveFilters = () => {
    return filters.status.length > 0 || 
           filters.type.length > 0 || 
           filters.city.length > 0 || 
           filters.priceRange !== "all";
  };

  const getUniqueValues = (key: string) => {
    return [...new Set(properties.map((p: Property) => 
      key === 'status' ? (p.status || 'captacao') : p[key as keyof Property]
    ))];
  };

  const getActiveFiltersCount = () => {
    return filters.status.length + filters.type.length + filters.city.length + 
           (filters.priceRange !== "all" ? 1 : 0);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Captação de Imóveis</h1>
        <Button onClick={() => {
          setSelectedProperty(null);
          setShowPropertyModal(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Captação
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por endereço, proprietário ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="px-2 py-1.5 text-sm font-semibold">Status</div>
                  {['captacao', 'diligence', 'mercado', 'proposta', 'contrato', 'instrumento', 'concluido'].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.status.includes(status)}
                      onCheckedChange={() => handleFilterChange("status", status)}
                    >
                      {status === 'captacao' ? 'Em Captação' : 
                       status === 'diligence' ? 'Due Diligence' :
                       status === 'mercado' ? 'No Mercado' :
                       status === 'proposta' ? 'Com Proposta' :
                       status === 'contrato' ? 'Em Contrato' :
                       status === 'instrumento' ? 'Instrumento' : 'Concluído'}
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-semibold">Tipo</div>
                  {getUniqueValues('type').map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filters.type.includes(type)}
                      onCheckedChange={() => handleFilterChange("type", type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-semibold">Cidade</div>
                  {getUniqueValues('city').map((city) => (
                    <DropdownMenuCheckboxItem
                      key={city}
                      checked={filters.city.includes(city)}
                      onCheckedChange={() => handleFilterChange("city", city)}
                    >
                      {city}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm font-semibold">Faixa de Preço</div>
                  {[
                    { value: "all", label: "Todos" },
                    { value: "0-300k", label: "Até R$ 300k" },
                    { value: "300k-500k", label: "R$ 300k - R$ 500k" },
                    { value: "500k-1m", label: "R$ 500k - R$ 1M" },
                    { value: "1m+", label: "Acima de R$ 1M" }
                  ].map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={filters.priceRange === option.value}
                      onCheckedChange={() => handleFilterChange("priceRange", option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}

                  {hasActiveFilters() && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearAllFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Limpar Filtros
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters() && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.status.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  Status: {status === 'captacao' ? 'Em Captação' : 
                          status === 'diligence' ? 'Due Diligence' :
                          status === 'mercado' ? 'No Mercado' :
                          status === 'proposta' ? 'Com Proposta' :
                          status === 'contrato' ? 'Em Contrato' :
                          status === 'instrumento' ? 'Instrumento' : 'Concluído'}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("status", status)} />
                </Badge>
              ))}
              {filters.type.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  Tipo: {type.charAt(0).toUpperCase() + type.slice(1)}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("type", type)} />
                </Badge>
              ))}
              {filters.city.map((city) => (
                <Badge key={city} variant="secondary" className="gap-1">
                  Cidade: {city}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("city", city)} />
                </Badge>
              ))}
              {filters.priceRange !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Preço: {filters.priceRange === "0-300k" ? "Até R$ 300k" : 
                          filters.priceRange === "300k-500k" ? "R$ 300k - R$ 500k" :
                          filters.priceRange === "500k-1m" ? "R$ 500k - R$ 1M" : "Acima de R$ 1M"}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("priceRange", "all")} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Imóveis em Captação ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum imóvel encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente ajustar sua busca." : "Comece cadastrando seu primeiro imóvel."}
                </p>
              </div>
              {!searchTerm && (
                <Button onClick={() => {
                  setSelectedProperty(null);
                  setShowPropertyModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Imóvel
                </Button>
              )}
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
                  <TableRow key={property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {property.type.charAt(0).toUpperCase() + property.type.slice(1)} - {property.street}, {property.number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {property.neighborhood} • R$ {Number(property.value).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{property.owners?.[0]?.fullName || 'Não informado'}</div>
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
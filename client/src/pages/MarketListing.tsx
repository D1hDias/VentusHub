import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Camera, 
  Globe, 
  Eye, 
  Search, 
  Filter,
  ExternalLink,
  TrendingUp,
  Calendar
} from "lucide-react";

export default function MarketListing() {
  // Mock data for demonstration
  const marketProperties = [
    {
      id: 1,
      sequenceNumber: "00001",
      property: "Apartamento Vila Madalena",
      address: "Rua das Flores, 123 - Vila Madalena",
      value: 850000,
      bedrooms: 3,
      bathrooms: 2,
      area: 120,
      owner: "Maria Santos",
      status: "active",
      photos: true,
      documentation: true,
      portals: ["ZAP", "Viva Real", "OLX"],
      views: 247,
      leads: 12,
      visits: 5,
      listedAt: "2024-01-20"
    },
    {
      id: 2,
      sequenceNumber: "00002",
      property: "Casa Jardins",
      address: "Rua dos Jardins, 456 - Jardins",
      value: 1200000,
      bedrooms: 4,
      bathrooms: 3,
      area: 250,
      owner: "João Oliveira",
      status: "preparing",
      photos: false,
      documentation: true,
      portals: [],
      views: 0,
      leads: 0,
      visits: 0,
      listedAt: null
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativo no Mercado</Badge>;
      case "preparing":
        return <Badge variant="secondary">Preparando</Badge>;
      case "sold":
        return <Badge variant="outline">Vendido</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Gerencie seus imóveis ativos e acompanhe o desempenho das vendas
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preparando</p>
                <p className="text-2xl font-bold text-blue-600">1</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold text-purple-600">247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads</p>
                <p className="text-2xl font-bold text-orange-600">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por endereço, valor ou proprietário..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div className="space-y-6">
        {marketProperties.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {property.sequenceNumber || String(property.id).padStart(5, '0')}
                    </span>
                    <CardTitle className="text-lg">{property.property}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{property.address}</p>
                </div>
                {getStatusBadge(property.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Property Details */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        R$ {property.value.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">Valor</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{property.bedrooms}q</p>
                      <p className="text-xs text-muted-foreground">Quartos</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{property.bathrooms}b</p>
                      <p className="text-xs text-muted-foreground">Banheiros</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{property.area}m²</p>
                      <p className="text-xs text-muted-foreground">Área</p>
                    </div>
                  </div>

                  {/* Status Checklist */}
                  <div className="space-y-3">
                    <h4 className="font-medium">Status de Publicação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`h-4 w-4 ${property.documentation ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="text-sm">Documentação Aprovada</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Camera className={`h-4 w-4 ${property.photos ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="text-sm">Fotos Profissionais</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className={`h-4 w-4 ${property.portals.length > 0 ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="text-sm">Publicado nos Portais</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className={`h-4 w-4 ${property.status === 'active' ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className="text-sm">Recebendo Visitas</span>
                      </div>
                    </div>
                  </div>

                  {/* Portals */}
                  {property.portals.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Publicado em:</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.portals.map((portal, index) => (
                          <Badge key={index} variant="outline" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {portal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h4 className="font-medium">Performance</h4>
                  
                  {property.status === "active" ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Visualizações</span>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{property.views}</p>
                        <p className="text-xs text-green-600">+15 esta semana</p>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Leads</span>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{property.leads}</p>
                        <p className="text-xs text-blue-600">Taxa de 4.9%</p>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Visitas</span>
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{property.visits}</p>
                        <p className="text-xs text-purple-600">3 agendadas</p>
                      </div>

                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Anúncios
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          Agendar Visita
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                          Aguardando Fotos
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                        Sessão de fotos profissionais pendente para publicação nos portais.
                      </p>
                      <Button size="sm" variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Agendar Fotos
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

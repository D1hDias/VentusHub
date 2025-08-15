import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/KPICard";
import { CompactKPICard } from "@/components/CompactKPICard";
import { SimpleKPICard } from "@/components/SimpleKPICard";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
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
  const [searchTerm, setSearchTerm] = useState("");
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  const { isMobile } = useResponsive();
  
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

      {/* KPI Cards - Responsivo com layout compacto para mobile */}
      <motion.div 
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        {isMobile ? (
          // Layout em grid 2x2 para mobile - otimizado para espaço
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: "Ativos", value: 1, icon: CheckCircle, iconBgColor: "#1ea475", subtitle: "Imóveis no mercado" },
              { title: "Preparando", value: 1, icon: Camera, iconBgColor: "#001f3f", subtitle: "Aguardando fotos" },
              { title: "Visualizações", value: 247, icon: Eye, iconBgColor: "#d47c16", subtitle: "Este mês" },
              { title: "Leads", value: 12, icon: TrendingUp, iconBgColor: "#dc2828", subtitle: "Interessados" }
            ].map((kpi, index) => (
              <motion.div
                key={index}
                variants={getListItemVariants()}
                className="w-full"
              >
                <SimpleKPICard 
                  title={kpi.title}
                  value={kpi.value}
                  icon={kpi.icon}
                  iconBgColor={kpi.iconBgColor}
                  subtitle={kpi.subtitle}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          // Layout em grid para desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          variants={getListItemVariants()}
          className={`${classes.cardInteractive} touch-target`}
          whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
          whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
        >
          <KPICard
            title="Ativos"
            value={1}
            icon={CheckCircle}
            iconBgColor="#1ea475"
            progress={75}
            subtitle="Imóveis no mercado"
            onClick={() => {}}
          />
        </motion.div>
        <motion.div
          variants={getListItemVariants()}
          className={`${classes.cardInteractive} touch-target`}
          whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
          whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
        >
          <KPICard
            title="Preparando"
            value={1}
            icon={Camera}
            iconBgColor="#001f3f"
            onClick={() => {}}
          />
        </motion.div>
        <motion.div
          variants={getListItemVariants()}
          className={`${classes.cardInteractive} touch-target`}
          whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
          whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
        >
          <KPICard
            title="Visualizações"
            value={247}
            icon={Eye}
            iconBgColor="#d47c16"
            onClick={() => {}}
          />
        </motion.div>
        <motion.div
          variants={getListItemVariants()}
          className={`${classes.cardInteractive} touch-target`}
          whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
          whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
        >
          <KPICard
            title="Leads"
            value={12}
            icon={TrendingUp}
            iconBgColor="#dc2828"
            onClick={() => {}}
          />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por endereço, valor ou proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
      <Card>
        <CardHeader>
          <CardTitle>Imóveis no Mercado ({marketProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : (
            <div className="space-y-4">
                {marketProperties.map((property) => (
                <div 
                  key={property.id}
                  className="button-interactive border rounded-md m-1 transition-shadow"
                  style={{
                    '--hover-shadow': `0 4px 12px rgba(0, 31, 63, 0.08)`
                  }}
                >
                  <Card>
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

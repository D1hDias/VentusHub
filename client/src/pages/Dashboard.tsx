import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Store, Handshake, File, Plus, TrendingUp, Search, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/KPICard";
import { TimelineStep } from "@/components/TimelineStep";
import { PropertyModal } from "@/components/PropertyModal";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { KPIGrid } from "@/components/responsive/ResponsiveGrid";
import { useSmoothtTransitions, useEntranceAnimation } from "@/hooks/useSmoothtTransitions";

// Garantir que crypto está disponível
if (typeof crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

// Interfaces corrigidas
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  creci?: string;
}

interface Stats {
  captacao: number;
  mercado: number;
  propostas: number;
  contratos: number;
}

interface Property {
  id: string;
  type: string;
  address?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  value: string | number;
  currentStage: number;
  createdAt: string;
  updatedAt: string;
  owners?: any[];
  registrationNumber?: string;
  municipalRegistration?: string;
}

export default function Dashboard() {
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();

  // Buscar todas as propriedades para calcular estatísticas
  const { data: allProperties = [], isLoading: propertiesLoading, error } = useQuery({
    queryKey: ["/api/properties"],
    enabled: !!user, // Só executar se usuário estiver logado
    // Usar o queryFn padrão que já inclui credentials
  });

  // Calcular estatísticas baseadas no status das propriedades
  const stats: Stats = {
    captacao: allProperties.filter((p: any) => 
      p.status === 'captacao' || p.currentStage === 1 || !p.status
    ).length,
    mercado: allProperties.filter((p: any) => 
      p.status === 'mercado' || p.currentStage === 3
    ).length,
    propostas: allProperties.filter((p: any) => 
      p.status === 'proposta' || p.currentStage === 4
    ).length,
    contratos: allProperties.filter((p: any) => 
      p.status === 'contrato' || p.status === 'instrumento' || p.status === 'concluido' || p.currentStage >= 5
    ).length,
  };

  // Calcular quantos estão em Due Diligence  
  const dueDiligenceCount = allProperties.filter((p: any) => 
    p.status === 'diligence' || p.currentStage === 2
  ).length;

  // Propriedades recentes (últimas 5)
  const recentTransactions = allProperties
    .sort((a: any, b: any) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)
    .map((prop: any) => ({
      ...prop,
      address: `${prop.street}, ${prop.number}${prop.complement ? ', ' + prop.complement : ''} - ${prop.neighborhood}, ${prop.city}${prop.state ? '/' + prop.state : ''}`
    }));

  // Função para navegar para seções específicas
  const navigateToSection = (section: string) => {
    switch (section) {
      case 'captacao':
        setLocation('/captacao');
        break;
      case 'due-diligence':
        setLocation('/due-diligence');
        break;
      case 'mercado':
        setLocation('/mercado');
        break;
      case 'propostas':
        setLocation('/propostas');
        break;
      case 'contratos':
        setLocation('/contratos');
        break;
      default:
        break;
    }
  };

  // Função para navegar para detalhes da propriedade
  const handleViewProperty = (property: Property) => {
    setLocation(`/property/${property.id}`);
  };

  // Função para abrir modal de edição
  const handleEditProperty = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProperty(property);
    setShowPropertyModal(true);
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowPropertyModal(false);
    setEditingProperty(null);
  };

  // Mutation para deletar propriedade
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await apiRequest('DELETE', `/api/properties/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Propriedade excluída",
        description: "A propriedade foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a propriedade.",
        variant: "destructive",
      });
    },
  });

  // Função para deletar propriedade com confirmação
  const handleDeleteProperty = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const propertyAddress = `${property.type} - ${property.street}, ${property.number}`;
    
    if (window.confirm(`Tem certeza que deseja excluir a propriedade:\n\n${propertyAddress}\n\nEsta ação não pode ser desfeita.`)) {
      deletePropertyMutation.mutate(property.id!);
    }
  };

  if (propertiesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <KPIGrid animateItems>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </KPIGrid>
      </div>
    );
  }

  const kpiData = [
    {
      title: "Imóveis em Captação",
      value: Math.max(stats.captacao, allProperties.length > 0 ? allProperties.length : 0),
      icon: Home,
      iconBgColor: "#001f3f",
      progress: Math.min(stats.captacao * 10, 100),
      subtitle: `${stats.captacao} captações ativas`,
      onClick: () => navigateToSection('captacao')
    },
    {
      title: "Ativos no Mercado",
      value: stats.mercado,
      icon: Store,
      iconBgColor: "hsl(159, 69%, 38%)",
      progress: Math.min(stats.mercado * 8, 100),
      subtitle: "Prontos para venda",
      onClick: () => navigateToSection('mercado')
    },
    {
      title: "Propostas Pendentes",
      value: stats.propostas,
      icon: Handshake,
      iconBgColor: "hsl(32, 81%, 46%)",
      progress: Math.min(stats.propostas * 15, 100),
      subtitle: "Aguardando negociação",
      onClick: () => navigateToSection('propostas')
    },
    {
      title: "Contratos Ativos",
      value: stats.contratos,
      icon: File,
      iconBgColor: "hsl(0, 72%, 51%)",
      progress: Math.min(stats.contratos * 12, 100),
      subtitle: "Em andamento",
      onClick: () => navigateToSection('contratos')
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-3xl font-bold mb-1">
            Bem-vindo, {(user as any)?.firstName || "Usuário"} {(user as any)?.lastName || ""}
          </h1>
          <p className="text-muted-foreground text-fluid-sm">
            CRECI: {(user as any)?.creci || "Não informado"} | Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* KPI Cards - Responsivo com animações OTIMIZADAS */}
      <motion.div 
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
        className="container-query"
      >
        <KPIGrid animateItems>
          {kpiData.map((kpi, index) => (
            <motion.div
              key={index}
              variants={getListItemVariants()}
              className={`${classes.cardInteractive} touch-target`}
              onClick={kpi.onClick}
              whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
              whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
            >
              <KPICard {...kpi} />
            </motion.div>
          ))}
        </KPIGrid>
      </motion.div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>
                  Últimas atualizações em suas propriedades
                </CardDescription>
              </div>
              <Button onClick={() => setShowPropertyModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Captação
              </Button>
            </CardHeader>
            <CardContent>
              {!recentTransactions || recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum imóvel cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece cadastrando seu primeiro imóvel para começar a usar o sistema.
                  </p>
                  <Button onClick={() => setShowPropertyModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Imóvel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 transition-smooth">
                  {recentTransactions.map((property, index) => {
                    const formattedValue = typeof property.value === 'number' 
                      ? property.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(property.value) || 0);
                      
                    return (
                      <div
                        key={property.id}
                        className="button-interactive flex items-center justify-between p-4 border rounded-lg cursor-pointer"
                        onClick={() => handleViewProperty(property)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <span className="text-primary font-medium">{property.sequenceNumber || '00000'}</span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {property.type.charAt(0).toUpperCase() + property.type.slice(1)} - {formattedValue}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              property.currentStage === 1 ? "bg-orange-100 text-orange-600 border-orange-200" :
                              property.currentStage === 2 ? "bg-blue-100 text-blue-600 border-blue-200" :
                              property.currentStage === 3 ? "bg-green-100 text-green-600 border-green-200" :
                              property.currentStage === 4 ? "bg-purple-100 text-purple-600 border-purple-200" :
                              property.currentStage === 5 ? "bg-indigo-100 text-indigo-600 border-indigo-200" :
                              property.currentStage === 6 ? "bg-teal-100 text-teal-600 border-teal-200" :
                              property.currentStage >= 7 ? "bg-green-100 text-green-600 border-green-200" : 
                              "bg-gray-100 text-gray-600 border-gray-200"
                            }
                          >
                            {property.currentStage === 1 ? "Captação" :
                             property.currentStage === 2 ? "Due Diligence" :
                             property.currentStage === 3 ? "Mercado" :
                             property.currentStage === 4 ? "Proposta" :
                             property.currentStage === 5 ? "Contrato" :
                             property.currentStage === 6 ? "Instrumento" :
                             property.currentStage >= 7 ? "Concluído" : "Pendente"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditProperty(property, e)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteProperty(property, e)}
                            className="hover:bg-red-50 hover:text-red-600"
                            disabled={deletePropertyMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Pendências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="button-interactive">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  <strong>Performance do mês:</strong><br />
                  {stats.captacao} novas captações
                </AlertDescription>
              </Alert>

              {dueDiligenceCount > 0 && (
                <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('due-diligence')}>
                  <File className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{dueDiligenceCount} imóveis em Due Diligence</strong><br />
                    Verificar documentação pendente
                  </AlertDescription>
                </Alert>
              )}
              
              {stats.propostas > 0 && (
                <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('propostas')}>
                  <Handshake className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.propostas} propostas pendentes</strong><br />
                    Revisar negociações em andamento
                  </AlertDescription>
                </Alert>
              )}

              {stats.contratos > 0 && (
                <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('contratos')}>
                  <File className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{stats.contratos} contratos ativos</strong><br />
                    Acompanhar prazos e documentação
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPropertyModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Captação
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigateToSection('captacao')}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar Imóvel
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <File className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PropertyModal 
        open={showPropertyModal} 
        onOpenChange={handleCloseModal}
        property={editingProperty}
      />
    </div>
  );
}
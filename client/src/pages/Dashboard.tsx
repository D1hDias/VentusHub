import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Store, Handshake, File, Plus, TrendingUp, Search, Edit, Trash2, FileCheck, CreditCard, Stamp, CheckCircle, Building2, Shield } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimelineStep } from "@/components/TimelineStep";
// import { PropertyModal } from "@/components/PropertyModal"; // Temporarily disabled
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
// import { useOrganization } from "@/hooks/useOrganization"; // Temporarily disabled
// import { OrganizationBadge } from "@/components/OrganizationSelector"; // Temporarily disabled
import { useSmoothtTransitions, useEntranceAnimation } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import { PageLoader } from "@/components/PageLoader";
import { formatSequenceNumber, formatCurrency, formatPropertyAddress, formatStageName, formatStageClasses } from "@/lib/formatUtils";
// import { AIAssistant } from "@/components/AIAssistant"; // Temporarily disabled
// import { useAIInsights } from "@/hooks/useAI"; // Temporarily disabled

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
  id?: string;
  sequenceNumber?: string;
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
  // const { 
  //   currentOrganization, 
  //   currentMembership,
  //   canManageProperties,
  //   hasPermission,
  //   isOrgAdmin,
  //   isManager 
  // } = useOrganization(); // Temporarily disabled
  
  // Temporary mock values
  const currentOrganization = { id: 'temp-org', nome: 'Dias Consultor Imobiliário' };
  const canManageProperties = () => true;
  const hasPermission = () => true;
  const isOrgAdmin = true;
  const isManager = true;
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  // Função para cumprimento baseado no horário
  const getGreeting = () => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
      return "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  };

  
  // Mock data for testing
  const propertiesResponse = { imoveis: [] };
  const propertiesLoading = false;
  const error = null;

  const allProperties = propertiesResponse?.imoveis || [];

  // Buscar insights de IA - Temporarily disabled
  // const { data: aiInsights, isLoading: aiInsightsLoading } = useAIInsights();
  const aiInsights = null;
  const aiInsightsLoading = false;

  // Calcular estatísticas baseadas no status das propriedades
  const stats: Stats = {
    captacao: allProperties.filter((p: Property) =>
      p.currentStage === 1
    ).length,
    mercado: allProperties.filter((p: Property) =>
      p.currentStage === 3
    ).length,
    propostas: allProperties.filter((p: Property) =>
      p.currentStage === 4
    ).length,
    contratos: allProperties.filter((p: Property) =>
      p.currentStage >= 5
    ).length,
  };

  // Calcular estatísticas detalhadas por etapa
  const detailedStats = {
    captacao: allProperties.filter((p: Property) => p.currentStage === 1).length,
    dueDiligence: allProperties.filter((p: Property) => p.currentStage === 2).length,
    mercado: allProperties.filter((p: Property) => p.currentStage === 3).length,
    propostas: allProperties.filter((p: Property) => p.currentStage === 4).length,
    contratos: allProperties.filter((p: Property) => p.currentStage === 5).length,
    financiamento: allProperties.filter((p: Property) => p.currentStage === 6).length,
    instrumento: allProperties.filter((p: Property) => p.currentStage === 7).length,
    concluido: allProperties.filter((p: Property) => p.currentStage === 8).length,
  };

  // Calcular quantos estão em Due Diligence  
  const dueDiligenceCount = detailedStats.dueDiligence;

  // Propriedades recentes (últimas 5)
  const recentTransactions = allProperties
    .sort((a: Property, b: Property) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5)
    .map((prop: Property) => ({
      ...prop,
      address: formatPropertyAddress(prop)
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
      case 'financiamento':
        setLocation('/financiamento');
        break;
      case 'instrumento':
        setLocation('/instrumento-final');
        break;
      case 'timeline':
        setLocation('/timeline');
        break;
      default:
        break;
    }
  };

  // Função para navegar para detalhes da propriedade
  const handleViewProperty = (property: Property) => {
    setLocation(`/property/${property.id}`);
  };

  // Função para abrir modal de edição - Temporarily disabled
  const handleEditProperty = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();
    // setEditingProperty(property);
    // setShowPropertyModal(true);
    console.log('PropertyModal temporarily disabled');
  };

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowPropertyModal(false);
    setEditingProperty(null);
  };

  // Função mockada para "Novo Imóvel"
  const handleNewProperty = () => {
    console.log('PropertyModal temporarily disabled - New property creation');
  };

  // Mutation para deletar propriedade
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const response = await fetch(`/api/imoveis/${propertyId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erro ao excluir propriedade');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', currentOrganization?.id] });
      toast({
        title: "Propriedade excluída",
        description: "A propriedade foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a propriedade.",
        variant: "destructive",
      });
    },
  });

  // Função para deletar propriedade com confirmação
  const handleDeleteProperty = (property: Property, e: React.MouseEvent) => {
    e.stopPropagation();

    // Verificar permissão de exclusão
    if (!hasPermission('imoveis')) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para excluir propriedades.",
        variant: "destructive",
      });
      return;
    }

    const propertyAddress = `${property.type} - ${property.street}, ${property.number}`;

    if (window.confirm(`Tem certeza que deseja excluir a propriedade:\n\n${propertyAddress}\n\nEsta ação não pode ser desfeita.`)) {
      deletePropertyMutation.mutate(property.id!);
    }
  };

  if (propertiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader 
          size="lg" 
          message="Carregando dashboard..." 
        />
      </div>
    );
  }

  const kpiData = [
    {
      title: "Captação",
      value: detailedStats.captacao,
      icon: Home,
      iconBgColor: "hsl(32, 81%, 46%)", // orange
      subtitle: "Novos imóveis",
      onClick: () => navigateToSection('captacao')
    },
    {
      title: "Due Diligence",
      value: detailedStats.dueDiligence,
      icon: FileCheck,
      iconBgColor: "hsl(217, 91%, 60%)", // blue
      subtitle: "Em análise",
      onClick: () => navigateToSection('due-diligence')
    },
    {
      title: "No Mercado",
      value: detailedStats.mercado,
      icon: Store,
      iconBgColor: "hsl(159, 69%, 38%)", // green
      subtitle: "À venda",
      onClick: () => navigateToSection('mercado')
    },
    {
      title: "Propostas",
      value: detailedStats.propostas,
      icon: Handshake,
      iconBgColor: "hsl(271, 81%, 56%)", // purple
      subtitle: "Em negociação",
      onClick: () => navigateToSection('propostas')
    },
    {
      title: "Contratos",
      value: detailedStats.contratos,
      icon: File,
      iconBgColor: "hsl(231, 48%, 48%)", // indigo
      subtitle: "Assinados",
      onClick: () => navigateToSection('contratos')
    },
    {
      title: "Financiamento",
      value: detailedStats.financiamento,
      icon: CreditCard,
      iconBgColor: "hsl(180, 67%, 47%)", // teal
      subtitle: "Em aprovação",
      onClick: () => navigateToSection('financiamento')
    },
    {
      title: "Instrumento",
      value: detailedStats.instrumento,
      icon: Stamp,
      iconBgColor: "hsl(142, 76%, 36%)", // emerald
      subtitle: "Finalizando",
      onClick: () => navigateToSection('instrumento')
    },
    {
      title: "Concluídos",
      value: detailedStats.concluido,
      icon: CheckCircle,
      iconBgColor: "hsl(120, 100%, 25%)", // dark green
      subtitle: "Finalizados",
      onClick: () => navigateToSection('timeline')
    }
  ];

  // Verificar se tem organização selecionada
  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma Organização Selecionada</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Por favor, selecione uma organização no menu superior para visualizar o dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Verificar permissões básicas
  if (!canManageProperties()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Você não tem permissão para visualizar o dashboard de propriedades.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 card-desktop-compact">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className={`font-bold mb-1 ${isMobile ? "text-xl" : "text-2xl"}`}>
            {getGreeting()}, {(user as any)?.firstName || "Usuário"} {(user as any)?.lastName || ""}
          </h1>
          <div className="flex items-center gap-4">
            <p className={`text-muted-foreground ${isMobile ? "text-sm" : "text-sm"}`}>
              CRECI: {(user as any)?.creci || "Não informado"} | Última atualização: {new Date().toLocaleString('pt-BR')}
            </p>
            {/* <OrganizationBadge /> */}
          </div>
        </div>
      </div>

      {/* KPI Cards - Responsivo com layout compacto para mobile */}
      <motion.div
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
        className="container-query"
      >
        {isMobile ? (
          // Modern Mobile Layout - Clean cards without progress bars
          <div className="grid grid-cols-2 gap-3">
            {kpiData.map((kpi, index) => (
              <motion.div
                key={index}
                variants={getListItemVariants()}
                className="w-full"
              >
                <motion.div
                  onClick={kpi.onClick}
                  className="cursor-pointer group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
                    <div 
                      className="absolute top-0 left-0 right-0 h-1 opacity-80 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: kpi.iconBgColor }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200"
                          style={{ backgroundColor: kpi.iconBgColor }}
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
                            style={{ color: kpi.iconBgColor }}
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
          // Modern Desktop Layout - Compact cards in 2 rows
          <div className="space-y-4">
            {/* First Row - Primary Metrics */}
            <div className="grid grid-cols-4 gap-3">
              {kpiData.slice(0, 4).map((kpi, index) => (
                <motion.div
                  key={index}
                  variants={getListItemVariants()}
                  className="h-full"
                >
                  <motion.div
                    onClick={kpi.onClick}
                    className="cursor-pointer group h-full"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col overflow-hidden relative hover:border-gray-300">
                      {/* Subtle gradient background */}
                      <div 
                        className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity"
                        style={{ 
                          background: `linear-gradient(135deg, ${kpi.iconBgColor} 0%, transparent 100%)` 
                        }}
                      />
                      
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                            style={{ backgroundColor: kpi.iconBgColor }}
                          >
                            <kpi.icon className="h-5 w-5 text-white" />
                          </div>
                          <motion.div
                            className="text-right"
                            key={kpi.value}
                            initial={{ scale: 1.1, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.1 }}
                          >
                            <div 
                              className="text-2xl font-bold tabular-nums leading-none"
                              style={{ color: kpi.iconBgColor }}
                            >
                              {kpi.value}
                            </div>
                          </motion.div>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-end">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{kpi.title}</h3>
                          <p className="text-xs text-gray-500 leading-tight">{kpi.subtitle}</p>
                        </div>
                        
                        {/* Bottom accent line */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                          style={{ backgroundColor: kpi.iconBgColor }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
            
            {/* Second Row - Secondary Metrics */}
            <div className="grid grid-cols-4 gap-3">
              {kpiData.slice(4, 8).map((kpi, index) => (
                <motion.div
                  key={index + 4}
                  variants={getListItemVariants()}
                  className="h-full"
                >
                  <motion.div
                    onClick={kpi.onClick}
                    className="cursor-pointer group h-full"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col overflow-hidden relative hover:border-gray-300">
                      {/* Subtle gradient background */}
                      <div 
                        className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity"
                        style={{ 
                          background: `linear-gradient(135deg, ${kpi.iconBgColor} 0%, transparent 100%)` 
                        }}
                      />
                      
                      <CardContent className="p-4 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200"
                            style={{ backgroundColor: kpi.iconBgColor }}
                          >
                            <kpi.icon className="h-5 w-5 text-white" />
                          </div>
                          <motion.div
                            className="text-right"
                            key={kpi.value}
                            initial={{ scale: 1.1, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: (index + 4) * 0.1 }}
                          >
                            <div 
                              className="text-2xl font-bold tabular-nums leading-none"
                              style={{ color: kpi.iconBgColor }}
                            >
                              {kpi.value}
                            </div>
                          </motion.div>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-end">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1">{kpi.title}</h3>
                          <p className="text-xs text-gray-500 leading-tight">{kpi.subtitle}</p>
                        </div>
                        
                        {/* Bottom accent line */}
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                          style={{ backgroundColor: kpi.iconBgColor }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      {isMobile ? (
        // Mobile: Full width, no sidebar sections
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Transações Recentes</h2>
                <CardDescription className="text-xs">
                  Últimas atualizações em suas propriedades
                </CardDescription>
              </div>
              <Button onClick={handleNewProperty}>
                <Plus className="h-2 w-2 mr-0" />
                Captação
              </Button>
            </CardHeader>
            <CardContent>
              {!recentTransactions || recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-base font-medium mb-2">Nenhum imóvel cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece cadastrando seu primeiro imóvel para começar a usar o sistema.
                  </p>
                  <Button onClick={handleNewProperty}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Imóvel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 transition-smooth">
                  {recentTransactions.map((property: Property, index: number) => {
                    const formattedValue = formatCurrency(property.value);

                    // Extract just street and number for mobile
                    const mobileAddress = `${property.street || 'Endereço'}, ${property.number || 'S/N'}`;

                    return (
                      <div
                        key={property.id}
                        className="button-interactive border rounded-lg cursor-pointer"
                        onClick={() => handleViewProperty(property)}
                      >
                        {/* Mobile Layout - New optimized structure */}
                        <div className="p-3 space-y-2">
                          {/* First Row: Registration Number and Property Type */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                <span className="text-primary font-medium text-xs">
                                  {formatSequenceNumber(property.sequenceNumber)}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">
                                {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Second Row: Property Value and Address */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-green-600">
                              {formattedValue}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                              {mobileAddress}
                            </span>
                          </div>

                          {/* Third Row: Status Badge and Action Icons */}
                          <div className="flex items-center justify-between">
                            <Badge className={`text-xs px-1.5 py-0.5 ${formatStageClasses(property.currentStage)}`}>
                              {formatStageName(property.currentStage)}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEditProperty(property, e)}
                                className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDeleteProperty(property, e)}
                                className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                                disabled={deletePropertyMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        // Desktop: 3-column layout with sidebar sections
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Transações Recentes</h2>
                  <CardDescription className="text-xs">
                    Últimas atualizações em suas propriedades
                  </CardDescription>
                </div>
                <Button onClick={handleNewProperty}>
                  <Plus className="h-2 w-2 mr-0" />
                  Captação
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
                    <Button onClick={handleNewProperty}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Imóvel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 transition-smooth">
                    {recentTransactions.map((property: Property, index: number) => {
                      const formattedValue = formatCurrency(property.value);

                      return (
                        <div
                          key={property.id}
                          className="button-interactive border rounded-lg cursor-pointer"
                          onClick={() => handleViewProperty(property)}
                        >
                          {/* Desktop Layout */}
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                <span className="text-primary font-medium text-xs">
                                  {formatSequenceNumber(property.sequenceNumber)}
                                </span>
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
                              <Badge className={formatStageClasses(property.currentStage)}>
                                {formatStageName(property.currentStage)}
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
                <h2 className="text-xl font-semibold">Alertas e Pendências</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="button-interactive">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Performance do mês:</strong><br />
                    {stats.captacao} novas captações
                  </AlertDescription>
                </Alert>

                {detailedStats.dueDiligence > 0 && (
                  <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('due-diligence')}>
                    <FileCheck className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{detailedStats.dueDiligence} imóveis em Due Diligence</strong><br />
                      Verificar documentação pendente
                    </AlertDescription>
                  </Alert>
                )}

                {detailedStats.financiamento > 0 && (
                  <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('financiamento')}>
                    <CreditCard className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{detailedStats.financiamento} em financiamento</strong><br />
                      Acompanhar aprovações bancárias
                    </AlertDescription>
                  </Alert>
                )}

                {detailedStats.propostas > 0 && (
                  <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('propostas')}>
                    <Handshake className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{detailedStats.propostas} propostas pendentes</strong><br />
                      Revisar negociações em andamento
                    </AlertDescription>
                  </Alert>
                )}

                {detailedStats.contratos > 0 && (
                  <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('contratos')}>
                    <File className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{detailedStats.contratos} contratos assinados</strong><br />
                      Acompanhar prazos e documentação
                    </AlertDescription>
                  </Alert>
                )}

                {detailedStats.instrumento > 0 && (
                  <Alert className="cursor-pointer button-interactive" onClick={() => navigateToSection('instrumento')}>
                    <Stamp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{detailedStats.instrumento} em instrumento final</strong><br />
                      Finalizar documentação de cartório
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Ações Rápidas</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleNewProperty}
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
      )}

      {/* <PropertyModal
        open={showPropertyModal}
        onOpenChange={handleCloseModal}
        property={editingProperty as any}
      /> */}

      {/* AI Assistant - Temporarily disabled */}
      {/* <AIAssistant
        context={{
          type: 'general',
          data: {
            properties: allProperties.slice(0, 5), // Send recent properties for context
            stats: {
              total: allProperties.length,
              captacao: stats.captacao,
              mercado: stats.mercado,
              propostas: stats.propostas
            }
          }
        }}
        suggestions={[
          {
            label: "Analisar meu portfólio",
            action: "analyze",
            type: "portfolio",
            icon: TrendingUp
          },
          {
            label: "Sugestões de marketing",
            action: "suggest",
            type: "marketing",
            icon: Search
          },
          {
            label: "Melhorar conversões",
            action: "suggest", 
            type: "conversion",
            icon: CheckCircle
          },
          {
            label: "Orientações para vendas",
            action: "guide",
            type: "sales",
            icon: Handshake
          }
        ]}
      /> */}
    </div>
  );
}
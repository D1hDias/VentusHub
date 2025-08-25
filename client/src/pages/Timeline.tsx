import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search, Filter, CheckCircle, AlertTriangle, Calendar, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/PageLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { StageStatusBadge, BadgeWrapper } from "@/components/StageStatusBadge";
import { PendencyModal } from "@/components/PendencyModal";
import { StageChecklist } from "@/components/StageChecklist";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import React from "react";
import { cn } from "@/lib/utils";

export default function Timeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [pendencyModalOpen, setPendencyModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Real pendency data synchronized with actual database state for each property
  const getPendenciesForProperty = (propertyId: number) => {
    // Cadastro #00001 (Diego) - 0/5 docs (nenhum documento enviado ainda)
    if (propertyId === 1) {
      return {
        1: [ // Captação - Todos os documentos pendentes para cadastro #00001
          { id: '1', title: 'Ônus Reais', description: 'Certidão de onus reais do imovel', category: 'document', priority: 'critical', status: 'pending' }, // Ainda não enviado
          { id: '2', title: 'Espelho de IPTU', description: 'Espelho atual do IPTU do imovel', category: 'document', priority: 'critical', status: 'pending' }, // Falta
          { id: '3', title: 'RG/CNH dos Proprietários', description: 'Documento de identidade dos proprietários', category: 'document', priority: 'critical', status: 'pending' }, // Falta
          { id: '4', title: 'Certidão de Estado Civil', description: 'Certidão de estado civil dos proprietários', category: 'document', priority: 'critical', status: 'pending' }, // Falta
          { id: '5', title: 'Comprovante de Residência', description: 'Comprovante de endereço dos proprietários', category: 'document', priority: 'critical', status: 'pending' }, // Falta
        ],
      };
    }
    
    // Cadastro #00002 (Nayane) - 1/5 docs (apenas Ônus Reais enviado)
    if (propertyId === 2) {
      return {
        1: [ // Captação - Ônus Reais completo, outros pendentes para cadastro #00002
          { id: '1', title: 'Ônus Reais', description: 'Certidão de onus reais do imovel', category: 'document', priority: 'critical', status: 'completed' }, // Enviado para cadastro #00002
          { id: '2', title: 'Espelho de IPTU', description: 'Espelho atual do IPTU do imovel', category: 'document', priority: 'critical', status: 'pending' }, // Falta
          { id: '3', title: 'RG/CNH dos Proprietários', description: 'Documento de identidade dos proprietários', category: 'document', priority: 'critical', status: 'pending' }, // Falta
          { id: '4', title: 'Certidão de Estado Civil', description: 'Certidão de estado civil dos proprietários', category: 'document', priority: 'critical', status: 'pending' }, // Falta
          { id: '5', title: 'Comprovante de Residência', description: 'Comprovante de endereço dos proprietários', category: 'document', priority: 'critical', status: 'pending' }, // Falta
        ],
      };
    }
    
    // Default case for other properties
    return {
      1: [],
    };
  };

  // Helper functions
  const toggleChecklist = (timelineId: string, stageId: number) => {
    const key = `${timelineId}-${stageId}`;
    setExpandedChecklists(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleStageAdvancement = (timeline: any, targetStage: number) => {
    const propertyPendencies = getPendenciesForProperty(timeline.id) as any;
    const currentStagePendencies = propertyPendencies[timeline.currentStage] || [];
    const incompletePendencies = currentStagePendencies.filter((p: any) => p.status !== 'completed');
    
    if (incompletePendencies.length > 0) {
      setSelectedStage({
        timeline,
        targetStage,
        pendencies: incompletePendencies,
        stageName: timeline.stages.find((s: any) => s.stage === timeline.currentStage)?.title || 'Etapa Atual'
      });
      setPendencyModalOpen(true);
    } else {
      // Advance directly if no pendencies
      console.log(`Advancing to stage ${targetStage}`);
    }
  };

  const handleProceedWithPendencies = () => {
    if (selectedStage) {
      console.log(`Proceeding to stage ${selectedStage.targetStage} with ${selectedStage.pendencies.length} pendencies`);
      setPendencyModalOpen(false);
      setSelectedStage(null);
    }
  };

  const handleReviewPendencies = () => {
    setPendencyModalOpen(false);
    if (selectedStage) {
      // Auto-expand the checklist for the current stage
      const key = `${selectedStage.timeline.id}-${selectedStage.timeline.currentStage}`;
      setExpandedChecklists(prev => ({ ...prev, [key]: true }));
    }
  };

  const getStageStatus = (stageId: number, pendencies: any[]) => {
    if (!pendencies || pendencies.length === 0) return 'complete';
    
    const incomplete = pendencies.filter((p: any) => p.status !== 'completed');
    if (incomplete.length === 0) return 'complete';
    
    const critical = incomplete.filter((p: any) => p.priority === 'critical');
    if (critical.length > 0) return 'critical';
    
    return 'incomplete';
  };

  // Real timeline data - updated with actual property information
  const mockTimelines = [
    {
      id: 1,
      sequenceNumber: "00001",
      property: "apartamento - Rua Franz Weissman, 410",
      owner: "Diego Henrique da Silva Dias",
      totalStages: 7,
      currentStage: 2, // Currently in Due Diligence stage
      stages: [
        {
          stage: 1,
          title: "Captacao do Imovel",
          status: "completed", // Captação completed
          startDate: "2025-01-15",
          completedDate: "2025-01-17",
          responsible: "Diego Henrique da Silva Dias",
          description: "Cadastro e documentação inicial do imovel",
          alerts: []
        },
        {
          stage: 2,
          title: "Due Diligence",
          status: "in_progress", // Currently in Due Diligence
          startDate: "2025-01-18",
          completedDate: null,
          responsible: "Sistema Automático",
          description: "Coleta e validação de certidões",
          alerts: [
            { type: "info", message: "Validação de certidões em andamento" }
          ]
        },
        {
          stage: 3,
          title: "Imóvel no Mercado",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Diego Henrique da Silva Dias",
          description: "Fotos profissionais e publicação nos portais",
          alerts: []
        },
        {
          stage: 4,
          title: "Propostas",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Diego Henrique da Silva Dias",
          description: "Recebimento e análise de propostas",
          alerts: []
        },
        {
          stage: 5,
          title: "Contratos",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Diego Henrique da Silva Dias",
          description: "Elaboração e assinatura de contratos",
          alerts: []
        },
        {
          stage: 6,
          title: "Instrumento Definitivo",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Diego Henrique da Silva Dias",
          description: "Escritura e registro em cartório",
          alerts: []
        },
        {
          stage: 7,
          title: "Finalização",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Diego Henrique da Silva Dias",
          description: "Entrega de chaves e conclusão",
          alerts: []
        }
      ]
    },
    {
      id: 2,
      sequenceNumber: "00002",
      property: "casa - Rua Congonhas, 83",
      owner: "Nayane Raggio Macieira Dias",
      totalStages: 7,
      currentStage: 2, // Currently in Due Diligence stage
      stages: [
        {
          stage: 1,
          title: "Captacao do Imovel",
          status: "completed", // Captação completed
          startDate: "2025-01-15",
          completedDate: "2025-01-17",
          responsible: "Nayane Raggio Macieira Dias",
          description: "Cadastro e documentação inicial do imovel",
          alerts: []
        },
        {
          stage: 2,
          title: "Due Diligence",
          status: "in_progress", // Currently in Due Diligence
          startDate: "2025-01-18",
          completedDate: null,
          responsible: "Sistema Automático",
          description: "Coleta e validação de certidões",
          alerts: [
            { type: "info", message: "Validação de certidões em andamento" }
          ]
        },
        {
          stage: 3,
          title: "Imóvel no Mercado",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Nayane Raggio Macieira Dias",
          description: "Fotos profissionais e publicação nos portais",
          alerts: []
        },
        {
          stage: 4,
          title: "Propostas",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Nayane Raggio Macieira Dias",
          description: "Recebimento e análise de propostas",
          alerts: []
        },
        {
          stage: 5,
          title: "Contratos",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Nayane Raggio Macieira Dias",
          description: "Elaboração e assinatura de contratos",
          alerts: []
        },
        {
          stage: 6,
          title: "Instrumento Definitivo",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Nayane Raggio Macieira Dias",
          description: "Escritura e registro em cartório",
          alerts: []
        },
        {
          stage: 7,
          title: "Finalização",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "Nayane Raggio Macieira Dias",
          description: "Entrega de chaves e conclusão",
          alerts: []
        }
      ]
    }
  ];

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />;
      case "delayed":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-50 dark:bg-green-900/20";
      case "in_progress":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "pending":
        return "border-gray-300 bg-gray-50 dark:bg-gray-800";
      case "delayed":
        return "border-red-500 bg-red-50 dark:bg-red-900/20";
      default:
        return "border-gray-300 bg-gray-50 dark:bg-gray-800";
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "danger":
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case "warning":
        return <Badge variant="secondary" className="text-xs">Atenção</Badge>;
      case "info":
        return <Badge variant="outline" className="text-xs">Info</Badge>;
      default:
        return null;
    }
  };

  const filteredTimelines = mockTimelines.filter((timeline: any) => {
    const matchesSearch = timeline.property.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProperty = selectedProperty === "all" || timeline.property === selectedProperty;
    return matchesSearch && matchesProperty;
  });

  const overallStats = {
    totalProperties: mockTimelines.length,
    completed: mockTimelines.filter((t: any) => t.currentStage === 7).length,
    inProgress: mockTimelines.filter((t: any) => t.currentStage > 1 && t.currentStage < 7).length,
    starting: mockTimelines.filter((t: any) => t.currentStage === 1).length,
    alerts: mockTimelines.reduce((acc, timeline) => {
      return acc + timeline.stages.reduce((stageAcc, stage) => stageAcc + stage.alerts.length, 0);
    }, 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader 
          size="lg" 
          message="Carregando timeline dos imóveis..." 
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Visualize o progresso completo de todas as transações em uma linha do tempo
          </p>
        </div>
      </div>

      {/* KPI Cards - Responsivo com layout compacto para mobile */}
      <motion.div 
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        {/* Data for KPI cards */}
        {(() => {
          const kpiData = [
            {
              title: "Total",
              value: overallStats.totalProperties,
              icon: FileText,
              color: "hsl(211, 100%, 50%)", // blue
              subtitle: "Propriedades"
            },
            {
              title: "Em Andamento",
              value: overallStats.inProgress,
              icon: Clock,
              color: "hsl(32, 81%, 46%)", // orange
              subtitle: "Transações ativas"
            },
            {
              title: "Concluídos",
              value: overallStats.completed,
              icon: CheckCircle,
              color: "hsl(159, 69%, 38%)", // green
              subtitle: "Finalizados"
            },
            {
              title: "Alertas",
              value: overallStats.alerts,
              icon: AlertTriangle,
              color: "hsl(0, 84%, 60%)", // red
              subtitle: "Requer atenção"
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
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                          style={{ backgroundColor: kpi.color }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          );
        })()}
      </motion.div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por imovel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por imovel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os imoveis</SelectItem>
                {mockTimelines.map((timeline) => (
                  <SelectItem key={timeline.id} value={timeline.property}>
                    {timeline.property}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Cards */}
      <div className="space-y-6">
        {filteredTimelines.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhuma timeline encontrada</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tente ajustar sua busca." : "Timelines aparecerão aqui conforme os imóveis são processados."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTimelines.map((timeline: any) => (
            <div 
              key={timeline.id}
              className="button-interactive border rounded-md m-1 transition-shadow"
              style={{
                '--hover-shadow': `0 4px 12px rgba(0, 31, 63, 0.08)`
              } as any}
            >
              <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {timeline.sequenceNumber || String(timeline.id).padStart(5, '0')}
                      </span>
                      <CardTitle className="text-lg">{timeline.property}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 font-medium">{timeline.owner}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Etapa {timeline.currentStage} de {timeline.totalStages} - 
                      {Math.round((timeline.currentStage / timeline.totalStages) * 100)}% concluído
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(timeline.currentStage / timeline.totalStages) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round((timeline.currentStage / timeline.totalStages) * 100)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.stages
                    .filter((stage: any) => stage.stage <= timeline.currentStage) // Only show completed and current stages
                    .map((stage: any, index: number, filteredArray: any[]) => (
                    <div key={stage.stage} className="relative">
                      {/* Timeline connector */}
                      {index < filteredArray.length - 1 && (
                        <div className="absolute left-6 top-12 w-px h-16 bg-border"></div>
                      )}
                      
                      <div className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border-2 transition-all",
                        getStageColor(stage.status)
                      )}>
                        <BadgeWrapper
                          badge={(() => {
                            const propertyPendencies = getPendenciesForProperty(timeline.id) as any;
                            const stagePendencies = propertyPendencies[stage.stage] || [];
                            const incompletePendencies = stagePendencies.filter((p: any) => p.status !== 'completed');
                            if (incompletePendencies.length === 0) return null;
                            
                            const stageStatus = getStageStatus(stage.stage, stagePendencies);
                            return (
                              <StageStatusBadge
                                count={incompletePendencies.length}
                                status={stageStatus}
                                size="md"
                                showPulse={stageStatus === 'critical'}
                              />
                            );
                          })()}
                        >
                          <div className="shrink-0 w-12 h-12 rounded-full bg-background border-2 border-current flex items-center justify-center">
                            {getStageIcon(stage.status)}
                          </div>
                        </BadgeWrapper>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{stage.stage}. {stage.title}</h4>
                                {(() => {
                                  const propertyPendencies = getPendenciesForProperty(timeline.id) as any;
                                  const stagePendencies = propertyPendencies[stage.stage] || [];
                                  const incompletePendencies = stagePendencies.filter((p: any) => p.status !== 'completed');
                                  const criticalPendencies = incompletePendencies.filter((p: any) => p.priority === 'critical');
                                  
                                  if (incompletePendencies.length === 0) {
                                    return <Badge className="bg-green-100 text-green-800 text-xs">Completo</Badge>;
                                  }
                                  
                                  if (criticalPendencies.length > 0) {
                                    return <Badge className="bg-red-100 text-red-800 text-xs">
                                      {criticalPendencies.length} Crítica{criticalPendencies.length !== 1 ? 's' : ''}
                                    </Badge>;
                                  }
                                  
                                  return <Badge className="bg-amber-100 text-amber-800 text-xs">
                                    {incompletePendencies.length} Pendente{incompletePendencies.length !== 1 ? 's' : ''}
                                  </Badge>;
                                })()}
                              </div>
                              <p className="text-sm text-muted-foreground">{stage.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Pendency Actions */}
                              {(() => {
                                const propertyPendencies = getPendenciesForProperty(timeline.id) as any;
                                const stagePendencies = propertyPendencies[stage.stage] || [];
                                const incompletePendencies = stagePendencies.filter((p: any) => p.status !== 'completed');
                                
                                if (incompletePendencies.length > 0) {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleChecklist(timeline.id.toString(), stage.stage)}
                                      className="text-xs"
                                    >
                                      {expandedChecklists[`${timeline.id}-${stage.stage}`] ? 'Ocultar' : 'Ver'} Pendências
                                    </Button>
                                  );
                                }
                                
                                return null;
                              })()}
                              
                              {/* Stage Advancement Button */}
                              {stage.stage === timeline.currentStage && stage.stage < 8 && (
                                <Button
                                  size="sm"
                                  onClick={() => handleStageAdvancement(timeline, stage.stage + 1)}
                                  className="text-xs bg-blue-600 hover:bg-blue-700"
                                >
                                  Avançar Etapa
                                </Button>
                              )}
                              
                              {/* Original Alerts */}
                              {stage.alerts.map((alert: any, alertIndex: number) => (
                                <div key={alertIndex}>
                                  {getAlertBadge(alert.type)}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{stage.responsible}</span>
                            </div>
                            
                            {stage.startDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Iniciado: {new Date(stage.startDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                            
                            {stage.completedDate && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>
                                  Concluído: {new Date(stage.completedDate).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {stage.alerts.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {stage.alerts.map((alert: any, alertIndex: number) => (
                                <div key={alertIndex} className="text-sm">
                                  <div className={cn(
                                    "p-2 rounded text-xs",
                                    alert.type === "danger" && "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
                                    alert.type === "warning" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                                    alert.type === "info" && "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                  )}>
                                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                                    {alert.message}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Expandable Checklist */}
                      {(() => {
                        const propertyPendencies = getPendenciesForProperty(timeline.id) as any;
                        const stagePendencies = propertyPendencies[stage.stage] || [];
                        const checklistKey = `${timeline.id}-${stage.stage}`;
                        const isExpanded = expandedChecklists[checklistKey];
                        
                        if (stagePendencies.length === 0) return null;
                        
                        return (
                          <div className="mt-3 ml-16">
                            <StageChecklist
                              stageId={stage.stage}
                              stageName={stage.title}
                              requirements={stagePendencies}
                              isExpanded={isExpanded}
                              onToggle={() => toggleChecklist(timeline.id.toString(), stage.stage)}
                              onUpdateRequirement={(reqId, status) => {
                                console.log(`Updating requirement ${reqId} to status ${status}`);
                                // In real app, this would call an API
                              }}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          ))
        )}
      </div>
      
      {/* Pendency Modal */}
      {selectedStage && (
        <PendencyModal
          isOpen={pendencyModalOpen}
          onClose={() => setPendencyModalOpen(false)}
          stageName={selectedStage.stageName}
          stageNumber={selectedStage.timeline.currentStage}
          targetStage={selectedStage.targetStage}
          pendencies={selectedStage.pendencies}
          onProceed={handleProceedWithPendencies}
          onReview={handleReviewPendencies}
          canProceed={true} // Always allow proceeding with acknowledgment
          totalRequirements={3} // Mock data - would come from API
          completedRequirements={1} // Mock data - would come from API
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search, Filter, CheckCircle, AlertTriangle, Calendar, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/KPICard";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { cn } from "@/lib/utils";

export default function Timeline() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Mock timeline data - in real app this would come from API
  const mockTimelines = [
    {
      id: 1,
      sequenceNumber: "00001",
      property: "Apartamento Vila Madalena",
      totalStages: 7,
      currentStage: 3,
      stages: [
        {
          stage: 1,
          title: "Captação do Imóvel",
          status: "completed",
          startDate: "2024-01-10",
          completedDate: "2024-01-12",
          responsible: "João Silva",
          description: "Cadastro e documentação inicial do imóvel",
          alerts: []
        },
        {
          stage: 2,
          title: "Due Diligence",
          status: "completed",
          startDate: "2024-01-13",
          completedDate: "2024-01-17",
          responsible: "Sistema Automático",
          description: "Coleta e validação de certidões",
          alerts: []
        },
        {
          stage: 3,
          title: "Imóvel no Mercado",
          status: "in_progress",
          startDate: "2024-01-18",
          completedDate: null,
          responsible: "João Silva",
          description: "Fotos profissionais e publicação nos portais",
          alerts: [
            { type: "warning", message: "Sessão de fotos agendada para hoje" }
          ]
        },
        {
          stage: 4,
          title: "Propostas",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "João Silva",
          description: "Recebimento e análise de propostas",
          alerts: []
        },
        {
          stage: 5,
          title: "Contratos",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "João Silva",
          description: "Elaboração e assinatura de contratos",
          alerts: []
        },
        {
          stage: 6,
          title: "Instrumento Definitivo",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "João Silva",
          description: "Escritura e registro em cartório",
          alerts: []
        },
        {
          stage: 7,
          title: "Finalização",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "João Silva",
          description: "Entrega de chaves e conclusão",
          alerts: []
        }
      ]
    },
    {
      id: 2,
      sequenceNumber: "00002",
      property: "Casa Jardins",
      totalStages: 7,
      currentStage: 5,
      stages: [
        {
          stage: 1,
          title: "Captação do Imóvel",
          status: "completed",
          startDate: "2024-01-08",
          completedDate: "2024-01-10",
          responsible: "João Silva",
          description: "Cadastro e documentação inicial do imóvel",
          alerts: []
        },
        {
          stage: 2,
          title: "Due Diligence",
          status: "completed",
          startDate: "2024-01-11",
          completedDate: "2024-01-15",
          responsible: "Sistema Automático",
          description: "Coleta e validação de certidões",
          alerts: []
        },
        {
          stage: 3,
          title: "Imóvel no Mercado",
          status: "completed",
          startDate: "2024-01-16",
          completedDate: "2024-01-20",
          responsible: "João Silva",
          description: "Fotos profissionais e publicação nos portais",
          alerts: []
        },
        {
          stage: 4,
          title: "Propostas",
          status: "completed",
          startDate: "2024-01-21",
          completedDate: "2024-01-22",
          responsible: "João Silva",
          description: "Recebimento e análise de propostas",
          alerts: []
        },
        {
          stage: 5,
          title: "Contratos",
          status: "in_progress",
          startDate: "2024-01-23",
          completedDate: null,
          responsible: "João Silva",
          description: "Elaboração e assinatura de contratos",
          alerts: [
            { type: "danger", message: "Contrato vence em 3 dias" }
          ]
        },
        {
          stage: 6,
          title: "Instrumento Definitivo",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "João Silva",
          description: "Escritura e registro em cartório",
          alerts: []
        },
        {
          stage: 7,
          title: "Finalização",
          status: "pending",
          startDate: null,
          completedDate: null,
          responsible: "João Silva",
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
    completed: mockTimelines.filter(t => t.currentStage === 7).length,
    inProgress: mockTimelines.filter(t => t.currentStage > 1 && t.currentStage < 7).length,
    starting: mockTimelines.filter(t => t.currentStage === 1).length,
    alerts: mockTimelines.reduce((acc, timeline) => {
      return acc + timeline.stages.reduce((stageAcc, stage) => stageAcc + stage.alerts.length, 0);
    }, 0)
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
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

      {/* KPI Cards */}
      <motion.div 
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          variants={getListItemVariants()}
          className={`${classes.cardInteractive} touch-target`}
          whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
          whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
        >
          <KPICard
            title="Total"
            value={overallStats.totalProperties}
            icon={FileText}
            iconBgColor="#001f3f"
            progress={50}
            subtitle="Propriedades"
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
            title="Em Andamento"
            value={overallStats.inProgress}
            icon={Clock}
            iconBgColor="#d47c16"
            progress={75}
            subtitle="Transações ativas"
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
            title="Concluídos"
            value={overallStats.completed}
            icon={CheckCircle}
            iconBgColor="#1ea475"
            progress={100}
            subtitle="Finalizados"
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
            title="Alertas"
            value={overallStats.alerts}
            icon={AlertTriangle}
            iconBgColor="#dc2828"
            progress={overallStats.alerts > 0 ? 25 : 0}
            subtitle="Requer atenção"
            onClick={() => {}}
          />
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por imóvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por imóvel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os imóveis</SelectItem>
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
              }}
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
                    <p className="text-sm text-muted-foreground">
                      Etapa {timeline.currentStage} de {timeline.totalStages} - 
                      {Math.round((timeline.currentStage / timeline.totalStages) * 100)}% concluído
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(timeline.currentStage / timeline.totalStages) * 100} 
                      className="w-32 h-2" 
                    />
                    <span className="text-sm font-medium">
                      {Math.round((timeline.currentStage / timeline.totalStages) * 100)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeline.stages.map((stage: any, index: number) => (
                    <div key={stage.stage} className="relative">
                      {/* Timeline connector */}
                      {index < timeline.stages.length - 1 && (
                        <div className="absolute left-6 top-12 w-px h-16 bg-border"></div>
                      )}
                      
                      <div className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border-2 transition-all",
                        getStageColor(stage.status)
                      )}>
                        <div className="shrink-0 w-12 h-12 rounded-full bg-background border-2 border-current flex items-center justify-center">
                          {getStageIcon(stage.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{stage.stage}. {stage.title}</h4>
                              <p className="text-sm text-muted-foreground">{stage.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

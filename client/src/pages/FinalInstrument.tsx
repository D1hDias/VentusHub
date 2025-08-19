import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stamp, Search, Filter, Eye, Send, CheckCircle, Clock, AlertCircle, Building, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinalInstrument() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Mock final instruments data - in real app this would come from API
  const mockInstruments = [
    {
      id: 1,
      sequenceNumber: "00001",
      propertyId: 1,
      property: "Apartamento Vila Madalena",
      buyer: "Ana Costa",
      seller: "Maria Santos",
      value: 850000,
      paymentMethod: "À vista",
      status: "ready_for_registry",
      progress: 95,
      createdAt: "2024-01-20",
      sentToRegistryAt: null,
      completedAt: null,
      registryOffice: "3º Cartório de Registro de Imóveis",
      bankName: null,
      estimatedDays: 15,
      documents: [
        { name: "Contrato Assinado", status: "completed" },
        { name: "Certidões Atualizadas", status: "completed" },
        { name: "Comprovante de Pagamento", status: "completed" },
        { name: "Procurações", status: "completed" },
        { name: "Declarações", status: "pending" }
      ],
      fees: {
        registryFee: 8500,
        itbi: 25500,
        lawyerFee: 5000,
        total: 39000
      }
    },
    {
      id: 2,
      sequenceNumber: "00002",
      propertyId: 2,
      property: "Casa Jardins",
      buyer: "Roberto Lima",
      seller: "João Oliveira",
      value: 1180000,
      paymentMethod: "Financiamento + Recursos Próprios",
      status: "sent_to_registry",
      progress: 80,
      createdAt: "2024-01-15",
      sentToRegistryAt: "2024-01-18",
      completedAt: null,
      registryOffice: "1º Cartório de Registro de Imóveis",
      bankName: "Caixa Econômica Federal",
      estimatedDays: 10,
      documents: [
        { name: "Contrato Assinado", status: "completed" },
        { name: "Certidões Atualizadas", status: "completed" },
        { name: "Aprovação Bancária", status: "completed" },
        { name: "Procurações", status: "completed" },
        { name: "Registro no Cartório", status: "in_progress" }
      ],
      fees: {
        registryFee: 11800,
        itbi: 35400,
        lawyerFee: 7000,
        total: 54200
      }
    },
    {
      id: 3,
      sequenceNumber: "00003",
      propertyId: 3,
      property: "Cobertura Itaim",
      buyer: "Fernanda Silva",
      seller: "Carlos Santos",
      value: 2100000,
      paymentMethod: "Financiamento Bradesco",
      status: "completed",
      progress: 100,
      createdAt: "2024-01-10",
      sentToRegistryAt: "2024-01-12",
      completedAt: "2024-01-22",
      registryOffice: "5º Cartório de Registro de Imóveis",
      bankName: "Banco Bradesco",
      estimatedDays: 0,
      documents: [
        { name: "Contrato Assinado", status: "completed" },
        { name: "Certidões Atualizadas", status: "completed" },
        { name: "Aprovação Bancária", status: "completed" },
        { name: "Procurações", status: "completed" },
        { name: "Escritura Registrada", status: "completed" }
      ],
      fees: {
        registryFee: 21000,
        itbi: 63000,
        lawyerFee: 12000,
        total: 96000
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return <Badge variant="outline">Preparando</Badge>;
      case "ready_for_registry":
        return <Badge variant="secondary">Pronto para Cartório</Badge>;
      case "sent_to_registry":
        return <Badge className="bg-blue-500">No Cartório</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      case "blocked":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preparing":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "ready_for_registry":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "sent_to_registry":
        return <Building className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredInstruments = mockInstruments.filter((instrument: any) =>
    instrument.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instrument.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instrument.seller.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsData = {
    total: mockInstruments.length,
    preparing: mockInstruments.filter(i => i.status === "preparing").length,
    ready: mockInstruments.filter(i => i.status === "ready_for_registry").length,
    inRegistry: mockInstruments.filter(i => i.status === "sent_to_registry").length,
    completed: mockInstruments.filter(i => i.status === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
            Gerencie o processo de escrituração e registro em cartório
          </p>
        </div>
      </div>

      {/* KPI Cards - Modern Design */}
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
              value: statsData.total,
              icon: Stamp,
              color: "hsl(211, 100%, 50%)", // blue
              subtitle: "Processos ativos"
            },
            {
              title: "Preparando",
              value: statsData.preparing,
              icon: Clock,
              color: "hsl(32, 81%, 46%)", // orange
              subtitle: "Em elaboração"
            },
            {
              title: "Prontos",
              value: statsData.ready,
              icon: AlertCircle,
              color: "hsl(271, 81%, 56%)", // purple
              subtitle: "Para cartório"
            },
            {
              title: "No Cartório",
              value: statsData.inRegistry,
              icon: Building,
              color: "hsl(48, 100%, 67%)", // yellow
              subtitle: "Em processamento"
            },
            {
              title: "Concluídos",
              value: statsData.completed,
              icon: CheckCircle,
              color: "hsl(159, 69%, 38%)", // green
              subtitle: "Escrituras finais"
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
            // Desktop Layout (1x5 grid)
            <div className="grid grid-cols-5 gap-4">
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por imóvel, comprador ou vendedor..."
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

      {/* Instruments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Processos de Escrituração ({filteredInstruments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInstruments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Stamp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum processo encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente ajustar sua busca." : "Processos de escrituração aparecerão aqui."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Partes</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstruments.map((instrument: any) => (
                  <TableRow key={instrument.id} className="row-hover">
                    <TableCell>
                      <div className="font-mono text-sm text-muted-foreground">
                        {instrument.sequenceNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{instrument.property}</div>
                        <div className="text-sm text-muted-foreground">
                          {instrument.registryOffice}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><strong>Comprador:</strong> {instrument.buyer}</div>
                        <div><strong>Vendedor:</strong> {instrument.seller}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-primary">
                          R$ {instrument.value.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {instrument.paymentMethod}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(instrument.status)}
                        {getStatusBadge(instrument.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${instrument.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {instrument.progress}% concluído
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {instrument.status === "completed" ? (
                          <span className="text-green-600 font-medium">Finalizado</span>
                        ) : instrument.estimatedDays > 0 ? (
                          <>
                            <div>{instrument.estimatedDays} dias úteis</div>
                            <div className="text-xs text-muted-foreground">estimativa</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedInstrument(instrument);
                            setShowInstrumentModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {instrument.status === "ready_for_registry" && (
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-1" />
                            Enviar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Instrument Details Modal */}
      <Dialog open={showInstrumentModal} onOpenChange={setShowInstrumentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Instrumento Definitivo - Imóvel {selectedInstrument?.sequenceNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstrument && (
            <div className="space-y-6">
              {/* Instrument Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Informações da Transação</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nº do Instrumento:</strong> {selectedInstrument.sequenceNumber}</div>
                    <div><strong>Imóvel:</strong> {selectedInstrument.property}</div>
                    <div><strong>Valor:</strong> R$ {selectedInstrument.value.toLocaleString('pt-BR')}</div>
                    <div><strong>Pagamento:</strong> {selectedInstrument.paymentMethod}</div>
                    <div><strong>Comprador:</strong> {selectedInstrument.buyer}</div>
                    <div><strong>Vendedor:</strong> {selectedInstrument.seller}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Informações do Cartório</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Cartório:</strong> {selectedInstrument.registryOffice}</div>
                    {selectedInstrument.bankName && (
                      <div><strong>Banco:</strong> {selectedInstrument.bankName}</div>
                    )}
                    <div><strong>Status:</strong> {getStatusBadge(selectedInstrument.status)}</div>
                    <div><strong>Previsão:</strong> {selectedInstrument.estimatedDays > 0 ? `${selectedInstrument.estimatedDays} dias úteis` : "Finalizado"}</div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <h4 className="font-medium mb-3">Progresso da Escrituração</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Conclusão geral</span>
                    <span>{selectedInstrument.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedInstrument.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Documents Checklist */}
              <div>
                <h4 className="font-medium mb-3">Documentos para Escritura</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedInstrument.documents.map((doc: any, index: number) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          {doc.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {doc.status === "in_progress" && <Clock className="h-4 w-4 text-blue-500" />}
                          {doc.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.status === "completed" && "Concluído"}
                          {doc.status === "in_progress" && "Em andamento"}
                          {doc.status === "pending" && "Pendente"}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Fees Breakdown */}
              <div>
                <h4 className="font-medium mb-3">Custos da Escrituração</h4>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Registro no Cartório</span>
                        <span>R$ {selectedInstrument.fees.registryFee.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ITBI (Imposto de Transmissão)</span>
                        <span>R$ {selectedInstrument.fees.itbi.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Honorários Advocatícios</span>
                        <span>R$ {selectedInstrument.fees.lawyerFee.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span className="text-primary">R$ {selectedInstrument.fees.total.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Actions */}
              {selectedInstrument.status === "ready_for_registry" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Pronto para Envio ao Cartório
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Todos os documentos estão prontos. Com um clique, envie automaticamente para o cartório e banco.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Revisar Documentos
                    </Button>
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar - 1 Clique
                    </Button>
                  </div>
                </div>
              )}

              {selectedInstrument.status === "sent_to_registry" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Em Processo no Cartório
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Documentos enviados para {selectedInstrument.registryOffice}. 
                    Previsão de conclusão: {selectedInstrument.estimatedDays} dias úteis.
                  </p>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Acompanhar Status
                  </Button>
                </div>
              )}

              {selectedInstrument.status === "completed" && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Escritura Concluída
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    A escritura foi registrada com sucesso. A transação está oficialmente finalizada.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Stamp className="h-4 w-4 mr-2" />
                      Download Escritura
                    </Button>
                    <Button size="sm" variant="outline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Relatório Final
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowInstrumentModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { File, Search, Filter, Eye, Download, Send, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import React from "react";
import { PageLoader } from "@/components/PageLoader";
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

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  const { isMobile } = useResponsive();


  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Mock contracts data - in real app this would come from API
  const mockContracts = [
    {
      id: 1,
      sequenceNumber: "CTR-2024-001",
      propertyId: 1,
      property: "Apartamento Vila Madalena",
      buyer: "Ana Costa",
      seller: "Maria Santos",
      value: 850000,
      paymentMethod: "À vista",
      status: "signed",
      progress: 85,
      createdAt: "2024-01-19",
      signedAt: "2024-01-20",
      expiresAt: "2024-03-20",
      nextStep: "Escritura no cartório",
      daysToExpire: 45,
      documents: [
        { name: "Contrato de Compra e Venda", status: "signed" },
        { name: "Procuração", status: "signed" },
        { name: "Declaração de Renda", status: "pending" },
        { name: "Comprovante de Recursos", status: "signed" }
      ]
    },
    {
      id: 2,
      sequenceNumber: "CTR-2024-002",
      propertyId: 2,
      property: "Casa Jardins",
      buyer: "Roberto Lima",
      seller: "João Oliveira",
      value: 1180000,
      paymentMethod: "Financiamento + Recursos Próprios",
      status: "sent",
      progress: 40,
      createdAt: "2024-01-22",
      signedAt: null,
      expiresAt: "2024-02-22",
      nextStep: "Aguardando assinatura do comprador",
      daysToExpire: 15,
      documents: [
        { name: "Contrato de Compra e Venda", status: "sent" },
        { name: "Procuração", status: "draft" },
        { name: "Declaração de Renda", status: "pending" },
        { name: "Análise de Crédito", status: "pending" }
      ]
    },
    {
      id: 3,
      sequenceNumber: "CTR-2024-003",
      propertyId: 1,
      property: "Cobertura Itaim",
      buyer: "Carlos Silva",
      seller: "Pedro Santos",
      value: 2100000,
      paymentMethod: "Financiamento CEF",
      status: "draft",
      progress: 15,
      createdAt: "2024-01-23",
      signedAt: null,
      expiresAt: "2024-02-23",
      nextStep: "Revisão jurídica",
      daysToExpire: 16,
      documents: [
        { name: "Contrato de Compra e Venda", status: "draft" },
        { name: "Procuração", status: "draft" },
        { name: "Declaração de Renda", status: "pending" },
        { name: "Análise de Crédito", status: "pending" }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Rascunho</Badge>;
      case "sent":
        return <Badge variant="secondary">Enviado</Badge>;
      case "signed":
        return <Badge className="status-completed">Assinado</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "sent":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "signed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (daysToExpire: number) => {
    if (daysToExpire <= 7) return "text-red-600";
    if (daysToExpire <= 15) return "text-yellow-600";
    return "text-green-600";
  };

  const filteredContracts = mockContracts.filter((contract: any) =>
    contract.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.sequenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsData = {
    total: mockContracts.length,
    draft: mockContracts.filter((c: any) => c.status === "draft").length,
    sent: mockContracts.filter((c: any) => c.status === "sent").length,
    signed: mockContracts.filter((c: any) => c.status === "signed").length,
    expiringSoon: mockContracts.filter((c: any) => c.daysToExpire <= 7).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader 
          size="lg" 
          message="Carregando contratos..." 
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
            Gerencie contratos de compra e venda e acompanhe o processo de assinatura
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
              icon: File,
              color: "hsl(211, 100%, 50%)", // blue
              subtitle: "Contratos cadastrados"
            },
            {
              title: "Rascunhos",
              value: statsData.draft,
              icon: Clock,
              color: "hsl(32, 81%, 46%)", // orange
              subtitle: "Em elaboração"
            },
            {
              title: "Enviados",
              value: statsData.sent,
              icon: Send,
              color: "hsl(271, 81%, 56%)", // purple
              subtitle: "Para assinatura"
            },
            {
              title: "Assinados",
              value: statsData.signed,
              icon: CheckCircle,
              color: "hsl(159, 69%, 38%)", // green
              subtitle: "Contratos válidos"
            },
            {
              title: "Expirando",
              value: statsData.expiringSoon,
              icon: AlertTriangle,
              color: "hsl(0, 84%, 60%)", // red
              subtitle: "Atenção urgente"
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
                placeholder="Buscar por número, imóvel, comprador ou vendedor..."
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

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos Ativos ({filteredContracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente ajustar sua busca." : "Contratos aparecerão aqui quando gerados."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Contrato</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Partes</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract: any) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-primary">
                        {contract.sequenceNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.property}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.paymentMethod}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div><strong>Comprador:</strong> {contract.buyer}</div>
                        <div><strong>Vendedor:</strong> {contract.seller}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">
                        R$ {contract.value.toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contract.status)}
                        {getStatusBadge(contract.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${contract.progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contract.progress}% concluído
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(contract.expiresAt).toLocaleDateString('pt-BR')}</div>
                        <div className={`text-xs font-medium ${getPriorityColor(contract.daysToExpire)}`}>
                          {contract.daysToExpire} dias restantes
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowContractModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {contract.status === "signed" && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
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

      {/* Contract Details Modal */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Contrato {selectedContract?.sequenceNumber}
            </DialogTitle>
          </DialogHeader>
          
          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Informações do Contrato</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nº Contrato:</strong> <span className="font-mono">{selectedContract.sequenceNumber}</span></div>
                    <div><strong>Imóvel:</strong> {selectedContract.property}</div>
                    <div><strong>Valor:</strong> R$ {selectedContract.value.toLocaleString('pt-BR')}</div>
                    <div><strong>Pagamento:</strong> {selectedContract.paymentMethod}</div>
                    <div><strong>Status:</strong> {getStatusBadge(selectedContract.status)}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Cronograma</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Criado em:</strong> {new Date(selectedContract.createdAt).toLocaleDateString('pt-BR')}</div>
                    {selectedContract.signedAt && (
                      <div><strong>Assinado em:</strong> {new Date(selectedContract.signedAt).toLocaleDateString('pt-BR')}</div>
                    )}
                    <div><strong>Vence em:</strong> {new Date(selectedContract.expiresAt).toLocaleDateString('pt-BR')}</div>
                    <div className={`font-medium ${getPriorityColor(selectedContract.daysToExpire)}`}>
                      <strong>{selectedContract.daysToExpire} dias restantes</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <h4 className="font-medium mb-3">Progresso do Contrato</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Conclusão geral</span>
                    <span>{selectedContract.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedContract.progress}%` }}
                    ></div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">Próximo Passo</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{selectedContract.nextStep}</p>
                  </div>
                </div>
              </div>

              {/* Documents Checklist */}
              <div>
                <h4 className="font-medium mb-3">Documentos do Contrato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedContract.documents.map((doc: any, index: number) => (
                    <Card key={index} className="border border-border/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          {doc.status === "signed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {doc.status === "sent" && <Send className="h-4 w-4 text-blue-500" />}
                          {doc.status === "pending" && <Clock className="h-4 w-4 text-yellow-500" />}
                          {doc.status === "draft" && <Clock className="h-4 w-4 text-gray-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.status === "signed" && "Assinado"}
                          {doc.status === "sent" && "Enviado para assinatura"}
                          {doc.status === "pending" && "Pendente"}
                          {doc.status === "draft" && "Rascunho"}
                        </div>
                        {doc.status === "signed" && (
                          <Button variant="ghost" size="sm" className="mt-2 h-8 w-full">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedContract.status === "draft" && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">
                      Contrato em Elaboração
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    O contrato está sendo preparado. Após a revisão, será enviado para assinatura das partes.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Revisar Contrato
                    </Button>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Assinatura
                    </Button>
                  </div>
                </div>
              )}

              {selectedContract.status === "sent" && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Aguardando Assinatura
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    O contrato foi enviado para assinatura digital das partes. Você será notificado quando todas as assinaturas forem coletadas.
                  </p>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Acompanhar Status
                  </Button>
                </div>
              )}

              {selectedContract.status === "signed" && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Contrato Assinado
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Todas as partes assinaram o contrato. Próximo passo: preparar documentação para cartório.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button size="sm">
                      Preparar Escritura
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowContractModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

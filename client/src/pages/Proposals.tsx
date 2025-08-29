import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Check, X, Clock, DollarSign } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function Proposals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  const { data: properties, isLoading } = useQuery({
    queryKey: ["/api/properties"],
  });

  // Mock proposals data - in real app this would come from API
  const mockProposals = [
    {
      id: 1,
      propertyId: 1,
      sequenceNumber: "00001",
      property: "Apartamento Vila Madalena",
      propertyValue: 850000,
      buyerName: "Carlos Silva",
      buyerCpf: "123.456.789-00",
      buyerPhone: "(11) 99999-9999",
      proposedValue: 820000,
      paymentMethod: "Financiamento CEF",
      terms: "Financiamento 80% CEF, entrada 20% à vista, prazo 30 anos",
      status: "pending",
      createdAt: "2024-01-20",
      expiresAt: "2024-01-27"
    },
    {
      id: 2,
      propertyId: 1,
      sequenceNumber: "00001",
      property: "Apartamento Vila Madalena",
      propertyValue: 850000,
      buyerName: "Ana Costa",
      buyerCpf: "987.654.321-00",
      buyerPhone: "(11) 88888-8888",
      proposedValue: 850000,
      paymentMethod: "À vista",
      terms: "Pagamento integral à vista em 30 dias",
      status: "accepted",
      createdAt: "2024-01-18",
      acceptedAt: "2024-01-19"
    },
    {
      id: 3,
      propertyId: 2,
      sequenceNumber: "00002",
      property: "Casa Jardins",
      propertyValue: 1200000,
      buyerName: "Roberto Lima",
      buyerCpf: "456.789.123-00",
      buyerPhone: "(11) 77777-7777",
      proposedValue: 1150000,
      paymentMethod: "Financiamento + Recursos Próprios",
      terms: "50% financiamento, 50% recursos próprios, prazo 25 anos",
      status: "negotiating",
      createdAt: "2024-01-21",
      counterOffer: 1180000
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="status-pending">Pendente</Badge>;
      case "accepted":
        return <Badge className="status-completed">Aceita</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>;
      case "negotiating":
        return <Badge variant="secondary">Negociando</Badge>;
      case "expired":
        return <Badge variant="outline">Expirada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "accepted":
        return <Check className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <X className="h-4 w-4 text-red-500" />;
      case "negotiating":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredProposals = mockProposals.filter((proposal: any) =>
    proposal.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsData = {
    total: mockProposals.length,
    pending: mockProposals.filter((p: any) => p.status === "pending").length,
    accepted: mockProposals.filter((p: any) => p.status === "accepted").length,
    negotiating: mockProposals.filter((p: any) => p.status === "negotiating").length,
    rejected: mockProposals.filter((p: any) => p.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader 
          size="lg" 
          message="Carregando propostas..." 
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
            Gerencie propostas e conduza negociações com compradores interessados
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
              icon: Eye,
              color: "hsl(211, 100%, 50%)", // blue
              subtitle: "Propostas recebidas"
            },
            {
              title: "Pendentes",
              value: statsData.pending,
              icon: Clock,
              color: "hsl(32, 81%, 46%)", // orange
              subtitle: "Aguardando resposta"
            },
            {
              title: "Aceitas",
              value: statsData.accepted,
              icon: Check,
              color: "hsl(159, 69%, 38%)", // green
              subtitle: "Propostas aprovadas"
            },
            {
              title: "Negociando",
              value: statsData.negotiating,
              icon: DollarSign,
              color: "hsl(271, 81%, 56%)", // purple
              subtitle: "Em negociação"
            },
            {
              title: "Rejeitadas",
              value: statsData.rejected,
              icon: X,
              color: "hsl(0, 84%, 60%)", // red
              subtitle: "Não aceitas"
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
      <motion.div
        variants={getListItemVariants()}
        initial="hidden"
        animate="visible"
      >
        <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por imóvel, comprador ou forma de pagamento..."
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
      </motion.div>

      {/* Proposals Table */}
      <motion.div
        variants={getListItemVariants()}
        initial="hidden"
        animate="visible"
      >
      <Card>
        <CardHeader>
          <CardTitle>Propostas Recebidas ({filteredProposals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProposals.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma proposta encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente ajustar sua busca." : "Propostas aparecerão aqui quando recebidas."}
              </p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">#</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Valor Proposto</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.map((proposal: any) => (
                <TableRow key={proposal.id} className="row-hover">
                  <TableCell>
                    <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {proposal.sequenceNumber || String(proposal.propertyId).padStart(5, '0')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{proposal.property}</div>
                      <div className="text-sm text-muted-foreground">
                        Valor: R$ {proposal.propertyValue.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{proposal.buyerName}</div>
                      <div className="text-sm text-muted-foreground">{proposal.buyerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-primary">
                        R$ {proposal.proposedValue.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((proposal.proposedValue / proposal.propertyValue) * 100).toFixed(1)}% do valor
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{proposal.paymentMethod}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(proposal.status)}
                      {getStatusBadge(proposal.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setShowProposalModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {proposal.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Check className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                            <Button variant="outline" size="sm">
                              Negociar
                            </Button>
                          </>
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
      </motion.div>

      {/* Proposal Details Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Proposta - Imóvel {selectedProposal?.sequenceNumber || '00000'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Property and Buyer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Informações do Imóvel</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Imóvel:</strong> {selectedProposal.property}</div>
                    <div><strong>Valor de Venda:</strong> R$ {selectedProposal.propertyValue.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Dados do Comprador</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Nome:</strong> {selectedProposal.buyerName}</div>
                    <div><strong>CPF:</strong> {selectedProposal.buyerCpf}</div>
                    <div><strong>Telefone:</strong> {selectedProposal.buyerPhone}</div>
                  </div>
                </div>
              </div>

              {/* Proposal Details */}
              <div>
                <h4 className="font-medium mb-3">Detalhes da Proposta</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span>Valor Proposto:</span>
                    <span className="font-medium text-primary">R$ {selectedProposal.proposedValue.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forma de Pagamento:</span>
                    <span>{selectedProposal.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    {getStatusBadge(selectedProposal.status)}
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div>
                <h4 className="font-medium mb-3">Condições e Observações</h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">{selectedProposal.terms}</p>
                </div>
              </div>

              {/* Counter Offer */}
              {selectedProposal.status === "pending" && (
                <div>
                  <h4 className="font-medium mb-3">Resposta à Proposta</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Contraproposta (opcional)</label>
                      <Input 
                        type="number" 
                        placeholder="Valor da contraproposta"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Observações</label>
                      <Textarea 
                        placeholder="Observações sobre a negociação..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowProposalModal(false)}>
              Fechar
            </Button>
            {selectedProposal?.status === "pending" && (
              <div className="flex gap-2">
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  <X className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Contraproposta
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-2" />
                  Aceitar Proposta
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

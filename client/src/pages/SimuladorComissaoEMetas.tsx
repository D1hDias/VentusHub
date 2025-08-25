import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertTriangle, Award, Plus, Trash2, DollarSign, BarChart3, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { INDICADORES_MERCADO } from "@/lib/indicadores-mercado";
import IndicadoresMercado from '@/components/IndicadoresMercado';
import { LoadingModal } from "@/components/LoadingModal";

interface CommissionTier {
  id: string;
  pct_meta: number;
  pct_comissao: number;
}

interface BonusTier {
  id: string;
  pct_meta: number;
  bonus_pct: number;
}

interface FormData {
  ticket_medio: string;
  meta_anual_faturamento: string;
  commission_tiers: CommissionTier[];
  toggle_bonus_escalonado: boolean;
  bonus_tiers: BonusTier[];
  toggle_sazonalidade: boolean;
  sazonalidade_percent: number[];
  vendas_reais_mensais: string[];
  alerta_gap_percent: number;
}

interface DashboardMensal {
  mes: number;
  meta: number;
  vendas: number;
  pct_meta: number;
  comissao: number;
  alerta_gap: boolean;
}

interface ResultadoComissaoMetas {
  dashboard_anual: DashboardMensal[];
  totais: {
    faturamento_projetado: number;
    comissao_total: number;
    pct_meta_anual_atingida: number;
  };
}

export default function SimuladorComissaoEMetas() {
  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-comissao-e-metas';

    if (isDirectAccess) {
      // Criar um evento customizado para comunicar com o Layout
      const event = new CustomEvent('disableSecondSidebar', {
        detail: { disable: true }
      });
      window.dispatchEvent(event);
    }

    // Cleanup: reabilitar a sidebar quando sair da página
    return () => {
      const event = new CustomEvent('disableSecondSidebar', {
        detail: { disable: false }
      });
      window.dispatchEvent(event);
    };
  }, []);

  const [formData, setFormData] = useState<FormData>({
    ticket_medio: '',
    meta_anual_faturamento: '',
    commission_tiers: [
      { id: "1", pct_meta: 80, pct_comissao: 0.5 },
      { id: "2", pct_meta: 100, pct_comissao: 1.5 },
      { id: "3", pct_meta: 120, pct_comissao: 3.0 }
    ],
    toggle_bonus_escalonado: false,
    bonus_tiers: [
      { id: "1", pct_meta: 110, bonus_pct: 1 },
      { id: "2", pct_meta: 125, bonus_pct: 2 }
    ],
    toggle_sazonalidade: false,
    sazonalidade_percent: [8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33], // 12 meses iguais
    vendas_reais_mensais: Array(12).fill(''),
    alerta_gap_percent: 80
  });

  const [resultado, setResultado] = useState<ResultadoComissaoMetas | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'ticket_medio' || field === 'meta_anual_faturamento') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(numericValue) / 100);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const parseMonetaryValue = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const adicionarCommissionTier = () => {
    const newTier: CommissionTier = {
      id: String(Date.now()),
      pct_meta: 100,
      pct_comissao: 1.0
    };
    setFormData(prev => ({
      ...prev,
      commission_tiers: [...prev.commission_tiers, newTier]
    }));
  };

  const removerCommissionTier = (id: string) => {
    if (formData.commission_tiers.length > 1) {
      setFormData(prev => ({
        ...prev,
        commission_tiers: prev.commission_tiers.filter((tier: any) => tier.id !== id)
      }));
    }
  };

  const atualizarCommissionTier = (id: string, campo: string, valor: number) => {
    const newTiers = formData.commission_tiers.map((tier: any) =>
      tier.id === id ? { ...tier, [campo]: valor } : tier
    );
    setFormData(prev => ({ ...prev, commission_tiers: newTiers }));
  };

  const adicionarBonusTier = () => {
    const newTier: BonusTier = {
      id: String(Date.now()),
      pct_meta: 110,
      bonus_pct: 1.0
    };
    setFormData(prev => ({
      ...prev,
      bonus_tiers: [...prev.bonus_tiers, newTier]
    }));
  };

  const removerBonusTier = (id: string) => {
    if (formData.bonus_tiers.length > 1) {
      setFormData(prev => ({
        ...prev,
        bonus_tiers: prev.bonus_tiers.filter((tier: any) => tier.id !== id)
      }));
    }
  };

  const atualizarBonusTier = (id: string, campo: string, valor: number) => {
    const newTiers = formData.bonus_tiers.map((tier: any) =>
      tier.id === id ? { ...tier, [campo]: valor } : tier
    );
    setFormData(prev => ({ ...prev, bonus_tiers: newTiers }));
  };

  const atualizarSazonalidade = (index: number, valor: number) => {
    const newSazonalidade = [...formData.sazonalidade_percent];
    newSazonalidade[index] = valor;
    setFormData(prev => ({ ...prev, sazonalidade_percent: newSazonalidade }));
  };

  const atualizarVendaReal = (index: number, valor: string) => {
    const formattedValue = valor.replace(/[^\d]/g, '');
    const currencyValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(formattedValue) / 100);
    
    const newVendas = [...formData.vendas_reais_mensais];
    newVendas[index] = currencyValue;
    setFormData(prev => ({ ...prev, vendas_reais_mensais: newVendas }));
  };

  const calcularSimulacao = async () => {
    const metaAnual = parseMonetaryValue(formData.meta_anual_faturamento);
    const ticketMedio = parseMonetaryValue(formData.ticket_medio);
    
    if (metaAnual <= 0 || ticketMedio <= 0) {
      alert('Por favor, preencha o ticket médio e a meta anual');
      return;
    }

    // Validar se soma da sazonalidade é 100%
    if (formData.toggle_sazonalidade) {
      const somaSazonalidade = formData.sazonalidade_percent.reduce((a, b) => a + b, 0);
      if (Math.abs(somaSazonalidade - 100) > 0.1) {
        alert('A soma da sazonalidade deve ser 100%');
        return;
      }
    }

    setIsLoadingModalOpen(true);
    setLoading(true);
    
    try {
      // Simular processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Calcular metas mensais
      const metasMensais = formData.toggle_sazonalidade
        ? formData.sazonalidade_percent.map((pct: any) => metaAnual * (pct / 100))
        : Array(12).fill(metaAnual / 12);

      // Ordenar tiers por pct_meta
      const tiersOrdenados = [...formData.commission_tiers].sort((a, b) => a.pct_meta - b.pct_meta);
      const bonusOrdenados = [...formData.bonus_tiers].sort((a, b) => a.pct_meta - b.pct_meta);

      // Calcular dashboard mensal
      const dashboardAnual: DashboardMensal[] = [];
      let faturamentoTotal = 0;
      let comissaoTotalAcumulada = 0;

      for (let mes = 0; mes < 12; mes++) {
        const meta = metasMensais[mes];
        const vendas = parseMonetaryValue(formData.vendas_reais_mensais[mes]);
        const pctMeta = meta > 0 ? (vendas / meta) * 100 : 0;
        
        // Calcular comissão base
        let comissaoBase = 0;
        for (let i = tiersOrdenados.length - 1; i >= 0; i--) {
          const tier = tiersOrdenados[i];
          if (pctMeta >= tier.pct_meta) {
            comissaoBase = vendas * (tier.pct_comissao / 100);
            break;
          }
        }

        // Calcular bônus
        let bonus = 0;
        if (formData.toggle_bonus_escalonado) {
          for (let i = bonusOrdenados.length - 1; i >= 0; i--) {
            const bonusTier = bonusOrdenados[i];
            if (pctMeta >= bonusTier.pct_meta) {
              bonus = comissaoBase * (bonusTier.bonus_pct / 100);
              break;
            }
          }
        }

        const comissaoTotalMes = comissaoBase + bonus;
        const alertaGap = pctMeta < formData.alerta_gap_percent;

        dashboardAnual.push({
          mes: mes + 1,
          meta,
          vendas,
          pct_meta: pctMeta,
          comissao: comissaoTotalMes,
          alerta_gap: alertaGap
        });

        faturamentoTotal += vendas;
        comissaoTotalAcumulada += comissaoTotalMes;
      }

      const pctMetaAnualAtingida = metaAnual > 0 ? (faturamentoTotal / metaAnual) * 100 : 0;

      setResultado({
        dashboard_anual: dashboardAnual,
        totais: {
          faturamento_projetado: faturamentoTotal,
          comissao_total: comissaoTotalAcumulada,
          pct_meta_anual_atingida: pctMetaAnualAtingida
        }
      });

    } catch (error: any) {
      console.error("Erro no cálculo:", error);
      alert("Erro ao calcular simulação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
      setIsLoadingModalOpen(false);
    }
  };

  const prepararDadosGrafico = () => {
    if (!resultado) return [];
    
    return (resultado as any).dashboard_anual.map((item: any, index: any) => ({
      mes: meses[index],
      meta: item.meta,
      vendas: item.vendas,
      comissao: item.comissao,
      pct_meta: item.pct_meta
    }));
  };

  return (
    <div className="simulador-container p-6 space-y-6 bg-background min-h-screen">
      <div className="space-y-6">

        {/* Layout Principal com duas colunas */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Coluna Esquerda (Scrollable) */}
          <div className="w-full lg:w-2/3">
            {/* Formulário */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Configurações de Comissão
                </h2>

                {/* Indicadores do Mercado - Seção ampliada */}
                <div className="mb-6">
                  <IndicadoresMercado className="max-w-full mx-auto" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-4 w-4 inline-block mr-2" />Ticket Médio (R$)
                    </label>
                    <input
                      type="text"
                      value={formData.ticket_medio}
                      onChange={(e) => handleInputChange('ticket_medio', e.target.value)}
                      placeholder="R$ 350.000,00"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Target className="h-4 w-4 inline-block mr-2" />Meta Anual de Faturamento (R$)
                    </label>
                    <input
                      type="text"
                      value={formData.meta_anual_faturamento}
                      onChange={(e) => handleInputChange('meta_anual_faturamento', e.target.value)}
                      placeholder="R$ 1.200.000,00"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <AlertTriangle className="h-4 w-4 inline-block mr-2" />Alerta de Gap (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.alerta_gap_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, alerta_gap_percent: Number(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={calcularSimulacao}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Target className="h-5 w-5" />
                  {loading ? 'Processando...' : 'Simular Comissão & Metas'}
                </motion.button>
              </div>
            </motion.div>

            {/* Resultados */}
            {resultado && (
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard de Performance</h2>
              {/* Resumo Geral */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Faturamento Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency((resultado as any).totais.faturamento_projetado)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent((resultado as any).totais.pct_meta_anual_atingida)} da meta
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Comissão Total</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency((resultado as any).totais.comissao_total)}
                        </p>
                        <p className="text-xs text-muted-foreground">Projetada</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Gaps Identificados</p>
                        <p className="text-2xl font-bold text-red-600">
                          {(resultado as any).dashboard_anual.filter((item: any) => item.alerta_gap).length}
                        </p>
                        <p className="text-xs text-muted-foreground">Meses com alerta</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela Mensal */}
              <Card className="bg-card dark:bg-card border border-border dark:border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Dashboard Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-foreground">Mês</th>
                          <th className="text-right p-3 font-medium text-foreground">Meta</th>
                          <th className="text-right p-3 font-medium text-foreground">Vendas</th>
                          <th className="text-right p-3 font-medium text-foreground">% Meta</th>
                          <th className="text-right p-3 font-medium text-foreground">Comissão</th>
                          <th className="text-center p-3 font-medium text-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultado as any).dashboard_anual.map((item: any, index: any) => (
                          <tr key={index} className="border-b border-border">
                            <td className="p-3 font-medium text-foreground">{meses[index]}</td>
                            <td className="text-right p-3 text-muted-foreground">{formatCurrency(item.meta)}</td>
                            <td className="text-right p-3 text-foreground">{formatCurrency(item.vendas)}</td>
                            <td className="text-right p-3">
                              <span className={`${item.pct_meta >= 100 ? 'text-green-600' : item.pct_meta >= formData.alerta_gap_percent ? 'text-yellow-600' : 'text-red-600'}`}>
                                {formatPercent(item.pct_meta)}
                              </span>
                            </td>
                            <td className="text-right p-3 text-green-600">{formatCurrency(item.comissao)}</td>
                            <td className="text-center p-3">
                              {item.alerta_gap ? (
                                <Badge variant="destructive">Gap</Badge>
                              ) : item.pct_meta >= 100 ? (
                                <Badge variant="default">Meta</Badge>
                              ) : (
                                <Badge variant="secondary">OK</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico */}
              <Card className="bg-card dark:bg-card border border-border dark:border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-5 h-5" />
                    Desempenho Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepararDadosGrafico()}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="mes" 
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          className="text-muted-foreground"
                          tickFormatter={(value: any) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(Number(value))}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="meta" 
                          fill="#e5e7eb" 
                          name="Meta"
                        />
                        <Bar 
                          dataKey="vendas" 
                          fill="#3b82f6" 
                          name="Vendas"
                        />
                        <Bar 
                          dataKey="comissao" 
                          fill="#10b981" 
                          name="Comissão"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
                </div>
              </motion.div>
            )}

          </div>

          {/* Coluna Direita (Fixa) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-8 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-l-4 border-orange-400 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-400 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Indicadores de Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">SELIC:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">{INDICADORES_MERCADO.selic}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">CDI:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">{INDICADORES_MERCADO.cdi}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">IPCA:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">{INDICADORES_MERCADO.ipca}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">IGP-M:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">{INDICADORES_MERCADO.igpM}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                    *Índices para reajustes de metas e comissões
                  </p>
                </div>
              </motion.div>

              {/* Informações sobre comissão */}
              <motion.div
                className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg shadow-sm p-6 border border-orange-200 dark:border-orange-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Estratégias de Performance
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 border border-orange-300 dark:border-orange-700">
                    <div className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Faixas de Comissão</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                      <div>• 80% da meta: comissão base</div>
                      <div>• 100% da meta: comissão padrão</div>
                      <div>• 120% da meta: comissão premium</div>
                    </div>
                  </div>

                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 border border-amber-300 dark:border-amber-700">
                    <div className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Bônus Escalonado</div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      <div>• 110% da meta: bônus inicial</div>
                      <div>• 125% da meta: bônus máximo</div>
                      <div>• Aplicado sobre a comissão base</div>
                    </div>
                  </div>

                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 border border-orange-300 dark:border-orange-700">
                    <div className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Sazonalidade</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
                      <div>• Distribuição mensal personalizada</div>
                      <div>• Adapta metas conforme mercado</div>
                      <div>• Total deve somar 100%</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {!resultado && (
                <motion.div
                  className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg shadow-sm p-4 border border-orange-200 dark:border-orange-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <div className="text-center space-y-3">
                    <Target className="w-12 h-12 text-orange-400 mx-auto" />
                    <h3 className="text-lg font-medium text-orange-900 dark:text-orange-300">
                      Configure suas metas
                    </h3>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">
                      Defina suas faixas de comissão, bônus escalonado e vendas reais para calcular o desempenho.
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
      
      <LoadingModal
        isOpen={isLoadingModalOpen}
        onClose={() => setIsLoadingModalOpen(false)}
        message="Processando simulação de comissão e metas..."
        duration={4000}
      />
    </div>
  );
}
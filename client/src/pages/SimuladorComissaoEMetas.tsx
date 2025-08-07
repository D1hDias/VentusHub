import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertTriangle, Award, Plus, Trash2, DollarSign, BarChart3, Calendar } from "lucide-react";
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
        commission_tiers: prev.commission_tiers.filter(tier => tier.id !== id)
      }));
    }
  };

  const atualizarCommissionTier = (id: string, campo: string, valor: number) => {
    const newTiers = formData.commission_tiers.map(tier =>
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
        bonus_tiers: prev.bonus_tiers.filter(tier => tier.id !== id)
      }));
    }
  };

  const atualizarBonusTier = (id: string, campo: string, valor: number) => {
    const newTiers = formData.bonus_tiers.map(tier =>
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
        ? formData.sazonalidade_percent.map(pct => metaAnual * (pct / 100))
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

    } catch (error) {
      console.error("Erro no cálculo:", error);
      alert("Erro ao calcular simulação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
      setIsLoadingModalOpen(false);
    }
  };

  const prepararDadosGrafico = () => {
    if (!resultado) return [];
    
    return resultado.dashboard_anual.map((item, index) => ({
      mes: meses[index],
      meta: item.meta,
      vendas: item.vendas,
      comissao: item.comissao,
      pct_meta: item.pct_meta
    }));
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Simulador de Comissão & Metas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Planeje suas metas mensais, calcule comissões por faixas e acompanhe o desempenho
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores do Mercado - Seção ampliada */}
      <div className="mb-8">
        <IndicadoresMercado className="max-w-full mx-auto" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="xl:col-span-1 space-y-6">
          {/* Configurações Básicas */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <DollarSign className="w-5 h-5" />
                Configurações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ticket_medio" className="text-foreground">Ticket Médio (R$)</Label>
                <Input
                  id="ticket_medio"
                  type="text"
                  placeholder="R$ 350.000,00"
                  value={formData.ticket_medio}
                  onChange={(e) => handleInputChange('ticket_medio', e.target.value)}
                  className="bg-background text-foreground border-input"
                />
              </div>

              <div>
                <Label htmlFor="meta_anual_faturamento" className="text-foreground">Meta Anual de Faturamento (R$)</Label>
                <Input
                  id="meta_anual_faturamento"
                  type="text"
                  placeholder="R$ 1.200.000,00"
                  value={formData.meta_anual_faturamento}
                  onChange={(e) => handleInputChange('meta_anual_faturamento', e.target.value)}
                  className="bg-background text-foreground border-input"
                />
              </div>

              <div>
                <Label htmlFor="alerta_gap_percent" className="text-foreground">Alerta de Gap (%)</Label>
                <Input
                  id="alerta_gap_percent"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.alerta_gap_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, alerta_gap_percent: Number(e.target.value) }))}
                  className="bg-background text-foreground border-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Faixas de Comissão */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-5 h-5" />
                  Faixas de Comissão
                </CardTitle>
                <Button
                  onClick={adicionarCommissionTier}
                  size="sm"
                  variant="outline"
                  className="bg-background text-foreground border-input hover:bg-accent"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.commission_tiers.map((tier, index) => (
                <div key={tier.id} className="p-4 border border-border dark:border-border rounded-lg bg-accent/10 dark:bg-accent/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">Faixa {index + 1}</h4>
                    {formData.commission_tiers.length > 1 && (
                      <Button
                        onClick={() => removerCommissionTier(tier.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-foreground">% da Meta</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        max="200"
                        value={tier.pct_meta}
                        onChange={(e) => atualizarCommissionTier(tier.id, 'pct_meta', Number(e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">% Comissão</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={tier.pct_comissao}
                        onChange={(e) => atualizarCommissionTier(tier.id, 'pct_comissao', Number(e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bônus Escalonado */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Award className="w-5 h-5" />
                  Bônus Escalonado
                </CardTitle>
                <Switch
                  checked={formData.toggle_bonus_escalonado}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, toggle_bonus_escalonado: checked }))}
                />
              </div>
            </CardHeader>
            {formData.toggle_bonus_escalonado && (
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    onClick={adicionarBonusTier}
                    size="sm"
                    variant="outline"
                    className="bg-background text-foreground border-input hover:bg-accent"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {formData.bonus_tiers.map((tier, index) => (
                  <div key={tier.id} className="p-4 border border-border dark:border-border rounded-lg bg-accent/10 dark:bg-accent/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Bônus {index + 1}</h4>
                      {formData.bonus_tiers.length > 1 && (
                        <Button
                          onClick={() => removerBonusTier(tier.id)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-foreground">% da Meta</Label>
                        <Input
                          type="number"
                          step="1"
                          min="100"
                          max="200"
                          value={tier.pct_meta}
                          onChange={(e) => atualizarBonusTier(tier.id, 'pct_meta', Number(e.target.value))}
                          className="bg-background text-foreground border-input"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">% Bônus</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={tier.bonus_pct}
                          onChange={(e) => atualizarBonusTier(tier.id, 'bonus_pct', Number(e.target.value))}
                          className="bg-background text-foreground border-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Sazonalidade */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5" />
                  Sazonalidade
                </CardTitle>
                <Switch
                  checked={formData.toggle_sazonalidade}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, toggle_sazonalidade: checked }))}
                />
              </div>
            </CardHeader>
            {formData.toggle_sazonalidade && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {meses.map((mes, index) => (
                    <div key={index}>
                      <Label className="text-foreground text-xs">{mes}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={formData.sazonalidade_percent[index]}
                        onChange={(e) => atualizarSazonalidade(index, Number(e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: {formData.sazonalidade_percent.reduce((a, b) => a + b, 0).toFixed(1)}%
                </div>
              </CardContent>
            )}
          </Card>

          {/* Vendas Reais */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="w-5 h-5" />
                Vendas Reais Mensais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {meses.map((mes, index) => (
                  <div key={index} className="grid grid-cols-2 gap-3 items-center">
                    <Label className="text-foreground text-sm">{mes}</Label>
                    <Input
                      type="text"
                      placeholder="R$ 0,00"
                      value={formData.vendas_reais_mensais[index]}
                      onChange={(e) => atualizarVendaReal(index, e.target.value)}
                      className="bg-background text-foreground border-input"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={calcularSimulacao} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Calculando..." : "Simular Comissão & Metas"}
          </Button>
        </div>

        {/* Resultados */}
        <div className="xl:col-span-2">
          {resultado && (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Faturamento Total</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(resultado.totais.faturamento_projetado)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(resultado.totais.pct_meta_anual_atingida)} da meta
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
                          {formatCurrency(resultado.totais.comissao_total)}
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
                          {resultado.dashboard_anual.filter(item => item.alerta_gap).length}
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
                        {resultado.dashboard_anual.map((item, index) => (
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
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value) => formatCurrency(Number(value))}
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
          )}

          {!resultado && (
            <Card className="bg-card dark:bg-card border border-border dark:border-border">
              <CardContent className="p-12 text-center">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Configure suas metas e comissões
                </h3>
                <p className="text-muted-foreground">
                  Defina suas faixas de comissão, bônus escalonado e vendas reais para calcular o desempenho.
                </p>
              </CardContent>
            </Card>
          )}
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
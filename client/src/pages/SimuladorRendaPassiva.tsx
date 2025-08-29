import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Trash2, DollarSign, PieChart, TrendingUp, BarChart3, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { INDICADORES_MERCADO } from "@/lib/indicadores-mercado";
import IndicadoresMercado from '@/components/IndicadoresMercado';

interface Imovel {
  id: string;
  valor_imovel: string;
  aluguel_mensal_inicial: string;
  vacancia_percent_aa: number;
  toggle_condominio: boolean;
  condominio_mensal: string;
  toggle_iptu: boolean;
  iptu_anual: string;
  manutencao_percent_aa: number;
}

interface FormData {
  horizonte_anos: number;
  indice_reajuste: string;
  taxa_reajuste_custom_aa: number;
  intervalo_reajuste_meses: number;
  toggle_depreciacao: boolean;
  taxa_depreciacao_aa: number;
  aliquota_ir_percent: number;
  imoveis: Imovel[];
}

interface ResultadoImovel {
  id: string;
  yield_bruto: number;
  yield_liquido: number;
}

interface MetricasPortfolio {
  yield_bruto_anual: number;
  yield_liquido_anual: number;
  ir_total_anual: number;
}

interface ResultadoRendaPassiva {
  metricas_portfolio: MetricasPortfolio;
  imoveis: ResultadoImovel[];
  fluxo_caixa_mensal: number[];
}

export default function SimuladorRendaPassiva() {
  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-renda-passiva';

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
    horizonte_anos: 5,
    indice_reajuste: "igpm",
    taxa_reajuste_custom_aa: 6,
    intervalo_reajuste_meses: 12,
    toggle_depreciacao: false,
    taxa_depreciacao_aa: 1,
    aliquota_ir_percent: 15,
    imoveis: [
      {
        id: "1",
        valor_imovel: '',
        aluguel_mensal_inicial: '',
        vacancia_percent_aa: 5,
        toggle_condominio: false,
        condominio_mensal: '',
        toggle_iptu: false,
        iptu_anual: '',
        manutencao_percent_aa: 1
      }
    ]
  });

  const [resultado, setResultado] = useState<ResultadoRendaPassiva | null>(null);
  const [loading, setLoading] = useState(false);

  const adicionarImovel = () => {
    const novoImovel: Imovel = {
      id: String(formData.imoveis.length + 1),
      valor_imovel: '',
      aluguel_mensal_inicial: '',
      vacancia_percent_aa: 5,
      toggle_condominio: false,
      condominio_mensal: '',
      toggle_iptu: false,
      iptu_anual: '',
      manutencao_percent_aa: 1
    };
    setFormData(prev => ({
      ...prev,
      imoveis: [...prev.imoveis, novoImovel]
    }));
  };

  const removerImovel = (index: number) => {
    if (formData.imoveis.length > 1) {
      setFormData(prev => ({
        ...prev,
        imoveis: prev.imoveis.filter((_, i) => i !== index)
      }));
    }
  };

  const atualizarImovel = (index: number, campo: string, valor: any) => {
    const novosImoveis = [...formData.imoveis];
    novosImoveis[index] = { ...novosImoveis[index], [campo]: valor };
    setFormData(prev => ({ ...prev, imoveis: novosImoveis }));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('valor_') || field.includes('aluguel_') || field.includes('condominio_') || field.includes('iptu_')) {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(numericValue) / 100);
      return formattedValue;
    }
    return value;
  };

  const parseMonetaryValue = (value: string): number => {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const calcularSimulacao = () => {
    setLoading(true);
    
    try {
      // Validações básicas
      const imoveisValidos = formData.imoveis.filter((imovel: any) => 
        parseMonetaryValue(imovel.valor_imovel) > 0 && 
        parseMonetaryValue(imovel.aluguel_mensal_inicial) > 0
      );

      if (imoveisValidos.length === 0) {
        alert('Por favor, preencha pelo menos um imóvel com valor e aluguel válidos');
        return;
      }

      // Taxa de reajuste anual usando indicadores atualizados
      let taxaReajusteAnual = 0;
      if (formData.indice_reajuste === 'igpm') {
        taxaReajusteAnual = INDICADORES_MERCADO.igpM / 100;
      } else if (formData.indice_reajuste === 'ipca') {
        taxaReajusteAnual = INDICADORES_MERCADO.ipca / 100;
      } else {
        taxaReajusteAnual = formData.taxa_reajuste_custom_aa / 100;
      }

      const taxaReajusteMensal = Math.pow(1 + taxaReajusteAnual, 1/12) - 1;
      const taxaDepreciacaoMensal = formData.toggle_depreciacao ? 
        Math.pow(1 - formData.taxa_depreciacao_aa/100, 1/12) - 1 : 0;

      const totalMeses = formData.horizonte_anos * 12;
      const fluxoCaixaMensal: number[] = [];
      let irTotalAnual = 0;

      // Calcular para cada mês
      for (let mes = 0; mes < totalMeses; mes++) {
        let fluxoMes = 0;

        for (const imovel of imoveisValidos) {
          const valorImovel = parseMonetaryValue(imovel.valor_imovel);
          let aluguelMensal = parseMonetaryValue(imovel.aluguel_mensal_inicial);

          // Aplicar reajustes (a cada intervalo)
          const reajustes = Math.floor(mes / formData.intervalo_reajuste_meses);
          for (let r = 0; r < reajustes; r++) {
            aluguelMensal *= (1 + taxaReajusteMensal * formData.intervalo_reajuste_meses);
          }

          // Aplicar depreciação mensal acumulada
          aluguelMensal *= Math.pow(1 + taxaDepreciacaoMensal, mes);

          // Aplicar vacância
          const receitaEfetiva = aluguelMensal * (1 - imovel.vacancia_percent_aa/100);

          // Custos mensais
          const iptuMensal = imovel.toggle_iptu ? parseMonetaryValue(imovel.iptu_anual) / 12 : 0;
          const condominioMensal = imovel.toggle_condominio ? parseMonetaryValue(imovel.condominio_mensal) : 0;
          const manutencaoMensal = valorImovel * (imovel.manutencao_percent_aa / 100) / 12;

          const custosTotais = iptuMensal + condominioMensal + manutencaoMensal;
          const lucroAntes = receitaEfetiva - custosTotais;
          const irMensal = Math.max(0, lucroAntes * formData.aliquota_ir_percent / 100);
          const fluxoImovel = lucroAntes - irMensal;

          fluxoMes += fluxoImovel;
          irTotalAnual += irMensal;
        }

        fluxoCaixaMensal.push(fluxoMes);
      }

      // Calcular yields
      const valorTotalCarteira = imoveisValidos.reduce((total, imovel) => 
        total + parseMonetaryValue(imovel.valor_imovel), 0);

      const receitaBrutaAnual = imoveisValidos.reduce((total, imovel) => 
        total + parseMonetaryValue(imovel.aluguel_mensal_inicial) * 12, 0);

      const fluxoCaixaAnual = fluxoCaixaMensal.slice(0, 12).reduce((a, b) => a + b, 0);

      const yieldBrutoAnual = receitaBrutaAnual / valorTotalCarteira;
      const yieldLiquidoAnual = fluxoCaixaAnual / valorTotalCarteira;

      // Calcular yields por imóvel
      const resultadosImoveis: ResultadoImovel[] = imoveisValidos.map((imovel: any) => {
        const valorImovel = parseMonetaryValue(imovel.valor_imovel);
        const aluguelAnual = parseMonetaryValue(imovel.aluguel_mensal_inicial) * 12;
        const yieldBruto = aluguelAnual / valorImovel;
        
        // Simplificação: yield líquido baseado na proporção do portfólio
        const yieldLiquido = yieldBruto * (yieldLiquidoAnual / yieldBrutoAnual);

        return {
          id: imovel.id,
          yield_bruto: yieldBruto,
          yield_liquido: yieldLiquido
        };
      });

      setResultado({
        metricas_portfolio: {
          yield_bruto_anual: yieldBrutoAnual,
          yield_liquido_anual: yieldLiquidoAnual,
          ir_total_anual: irTotalAnual
        },
        imoveis: resultadosImoveis,
        fluxo_caixa_mensal: fluxoCaixaMensal
      });

    } catch (error: any) {
      console.error("Erro no cálculo:", error);
      alert("Erro ao calcular simulação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
    }
  };

  const prepararDadosGrafico = () => {
    if (!resultado) return [];
    
    return (resultado as any).fluxo_caixa_mensal.map((valor: any, index: any) => ({
      mes: index + 1,
      fluxo_caixa: valor,
      acumulado: (resultado as any).fluxo_caixa_mensal.slice(0, index + 1).reduce((a: any, b: any) => a + b, 0)
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
                  Configurações da Carteira
                </h2>

                {/* Indicadores do Mercado - Seção ampliada */}
                <div className="mb-6">
                  <IndicadoresMercado className="max-w-full mx-auto" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 inline-block mr-2" />Horizonte (anos)
                    </label>
                    <input
                      type="number"
                      value={formData.horizonte_anos}
                      onChange={(e) => setFormData(prev => ({ ...prev, horizonte_anos: Number(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <TrendingUp className="h-4 w-4 inline-block mr-2" />Índice de Reajuste
                    </label>
                    <Select 
                      value={formData.indice_reajuste} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, indice_reajuste: value }))}
                    >
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="igpm">IGP-M ({INDICADORES_MERCADO.igpM}% a.a.)</SelectItem>
                        <SelectItem value="ipca">IPCA ({INDICADORES_MERCADO.ipca}% a.a.)</SelectItem>
                        <SelectItem value="custom">Taxa Customizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.indice_reajuste === 'custom' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Taxa Custom (% a.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.taxa_reajuste_custom_aa}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxa_reajuste_custom_aa: Number(e.target.value) }))}
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Intervalo Reajuste (meses)
                    </label>
                    <Select 
                      value={String(formData.intervalo_reajuste_meses)} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, intervalo_reajuste_meses: Number(value) }))}
                    >
                      <SelectTrigger className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 meses</SelectItem>
                        <SelectItem value="24">24 meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir Depreciação?</label>
                    <Switch
                      checked={formData.toggle_depreciacao}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, toggle_depreciacao: checked }))}
                    />
                  </div>

                  {formData.toggle_depreciacao && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Taxa Depreciação (% a.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.taxa_depreciacao_aa}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxa_depreciacao_aa: Number(e.target.value) }))}
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-4 w-4 inline-block mr-2" />Alíquota IR (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.aliquota_ir_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, aliquota_ir_percent: Number(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>
                </div>

                <motion.button
                  onClick={calcularSimulacao}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Building2 className="h-5 w-5" />
                  {loading ? 'Processando...' : 'Simular Carteira'}
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
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Análise da Carteira</h2>
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Yield Bruto</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercent((resultado as any).metricas_portfolio.yield_bruto_anual)}
                        </p>
                        <p className="text-xs text-muted-foreground">Anual</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Yield Líquido</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatPercent((resultado as any).metricas_portfolio.yield_liquido_anual)}
                        </p>
                        <p className="text-xs text-muted-foreground">Após custos e IR</p>
                      </div>
                      <PieChart className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">IR Anual</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency((resultado as any).metricas_portfolio.ir_total_anual)}
                        </p>
                        <p className="text-xs text-muted-foreground">Estimado</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Yields por Imóvel */}
              <Card className="bg-card dark:bg-card border border-border dark:border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Yields por Imóvel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-3 font-medium text-foreground">Imóvel</th>
                          <th className="text-right p-3 font-medium text-foreground">Yield Bruto</th>
                          <th className="text-right p-3 font-medium text-foreground">Yield Líquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(resultado as any).imoveis.map((imovel: any, index: any) => (
                          <tr key={index} className="border-b border-border">
                            <td className="p-3 font-medium text-foreground">Imóvel {imovel.id}</td>
                            <td className="text-right p-3 text-blue-600">{formatPercent(imovel.yield_bruto)}</td>
                            <td className="text-right p-3 text-green-600">{formatPercent(imovel.yield_liquido)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Fluxo de Caixa */}
              <Card className="bg-card dark:bg-card border border-border dark:border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-5 h-5" />
                    Fluxo de Caixa Projetado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={prepararDadosGrafico()}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="mes" 
                          className="text-muted-foreground"
                        />
                        <YAxis 
                          className="text-muted-foreground"
                        />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(Number(value))}
                          labelFormatter={(label) => `Mês ${label}`}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="fluxo_caixa" 
                          stroke="#10b981" 
                          fill="#10b981"
                          fillOpacity={0.3}
                          strokeWidth={2}
                          name="Fluxo Mensal"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="acumulado" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Acumulado"
                        />
                      </AreaChart>
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
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-l-4 border-purple-400 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-400 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Indicadores de Referência
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-800 dark:text-purple-300">SELIC:</span>
                      <span className="font-medium text-purple-900 dark:text-purple-200">{INDICADORES_MERCADO.selic}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800 dark:text-purple-300">CDI:</span>
                      <span className="font-medium text-purple-900 dark:text-purple-200">{INDICADORES_MERCADO.cdi}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800 dark:text-purple-300">IPCA:</span>
                      <span className="font-medium text-purple-900 dark:text-purple-200">{INDICADORES_MERCADO.ipca}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-800 dark:text-purple-300">IGP-M:</span>
                      <span className="font-medium text-purple-900 dark:text-purple-200">{INDICADORES_MERCADO.igpM}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mt-2">
                    *Valores de referência para reajuste de aluguéis
                  </p>
                </div>
              </motion.div>

              {/* Informações sobre renda passiva */}
              <motion.div
                className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-6 border border-purple-200 dark:border-purple-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Dicas de Análise
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-300 dark:border-purple-700">
                    <div className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Yield Bruto vs Líquido</div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      <div>• Yield bruto: somente receita vs valor do imóvel</div>
                      <div>• Yield líquido: descontados custos e impostos</div>
                    </div>
                  </div>

                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-3 border border-indigo-300 dark:border-indigo-700">
                    <div className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Fatores Importantes</div>
                    <div className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                      <div>• Vacância: períodos sem locatário</div>
                      <div>• Manutenção: custos de reparo e reforma</div>
                      <div>• Reajustes: periodicidade conforme contrato</div>
                    </div>
                  </div>

                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 border border-purple-300 dark:border-purple-700">
                    <div className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Benchmark de Yields</div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                      <div>• Residencial: 4-7% a.a. (bruto)</div>
                      <div>• Comercial: 6-10% a.a. (bruto)</div>
                      <div>• CDI atual: {INDICADORES_MERCADO.cdi}% a.a.</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {!resultado && (
                <motion.div
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-4 border border-purple-200 dark:border-purple-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <div className="text-center space-y-3">
                    <Building2 className="w-12 h-12 text-purple-400 mx-auto" />
                    <h3 className="text-lg font-medium text-purple-900 dark:text-purple-300">
                      Configure sua carteira
                    </h3>
                    <p className="text-purple-700 dark:text-purple-300 text-sm">
                      Preencha os dados dos imóveis e configurações para simular o fluxo de caixa da sua carteira de aluguéis.
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
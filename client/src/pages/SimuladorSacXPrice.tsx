import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingDown, TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { INDICADORES_MERCADO } from "@/lib/indicadores-mercado";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { LoadingModal } from "@/components/LoadingModal";

interface FormData {
  valor_financiado: string;
  prazo_meses: number;
  taxa_efetiva_anual: number;
  renda_mensal: string;
  toogle_seguro: boolean;
  seguro_percent_aa: number;
}

interface SistemaAmortizacao {
  primeira_parcela: number;
  ultima_parcela: number;
  total_juros: number;
  fluxo_parcelas: number[];
}

interface ResultadoComparativo {
  price: SistemaAmortizacao;
  sac: SistemaAmortizacao;
  comparativo: {
    economia_juros_sac_vs_price: number;
    indicacao_perfil: string;
  };
}

export default function SimuladorSacXPrice() {
  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-sac-x-price';

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
    valor_financiado: '',
    prazo_meses: 420,
    taxa_efetiva_anual: 11.5,
    renda_mensal: '',
    toogle_seguro: false,
    seguro_percent_aa: 0.35
  });

  const [resultado, setResultado] = useState<ResultadoComparativo | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);

  const calcularTaxaMensal = (taxaAnual: number): number => {
    return Math.pow(1 + taxaAnual / 100, 1 / 12) - 1; // Taxa efetiva mensal
  };

  const calcularPrice = (pv: number, taxaMensal: number, prazoMeses: number, incluirSeguro: boolean, seguroPercent: number): SistemaAmortizacao => {
    const pmt = pv * (taxaMensal * Math.pow(1 + taxaMensal, prazoMeses)) / (Math.pow(1 + taxaMensal, prazoMeses) - 1);
    const fluxo_parcelas: number[] = [];
    let totalJuros = 0;
    let saldo = pv;

    for (let mes = 1; mes <= prazoMeses; mes++) {
      const juros = saldo * taxaMensal;
      const amortizacao = pmt - juros;
      const seguro = incluirSeguro ? (seguroPercent / 100 / 12) * saldo : 0;
      const parcelaMensal = pmt + seguro;
      
      fluxo_parcelas.push(parcelaMensal);
      totalJuros += juros;
      saldo -= amortizacao;
    }

    return {
      primeira_parcela: fluxo_parcelas[0],
      ultima_parcela: fluxo_parcelas[fluxo_parcelas.length - 1],
      total_juros: totalJuros,
      fluxo_parcelas
    };
  };

  const calcularSac = (pv: number, taxaMensal: number, prazoMeses: number, incluirSeguro: boolean, seguroPercent: number): SistemaAmortizacao => {
    const amortizacaoConstante = pv / prazoMeses;
    const fluxo_parcelas: number[] = [];
    let totalJuros = 0;
    let saldo = pv;

    for (let mes = 1; mes <= prazoMeses; mes++) {
      const juros = saldo * taxaMensal;
      const seguro = incluirSeguro ? (seguroPercent / 100 / 12) * saldo : 0;
      const parcelaMensal = amortizacaoConstante + juros + seguro;
      
      fluxo_parcelas.push(parcelaMensal);
      totalJuros += juros;
      saldo -= amortizacaoConstante;
    }

    return {
      primeira_parcela: fluxo_parcelas[0],
      ultima_parcela: fluxo_parcelas[fluxo_parcelas.length - 1],
      total_juros: totalJuros,
      fluxo_parcelas
    };
  };

  const calcularComparativo = async () => {
    const valorFinanciado = parseFloat(formData.valor_financiado.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const rendaMensal = parseFloat(formData.renda_mensal.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    
    if (valorFinanciado <= 0) {
      alert('Por favor, preencha um valor válido para financiar');
      return;
    }

    setIsLoadingModalOpen(true);
    setLoading(true);
    
    try {
      // Simular processamento assíncrono
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      const taxaMensal = calcularTaxaMensal(formData.taxa_efetiva_anual);
      
      const priceResult = calcularPrice(
        valorFinanciado,
        taxaMensal,
        formData.prazo_meses,
        formData.toogle_seguro,
        formData.seguro_percent_aa
      );

      const sacResult = calcularSac(
        valorFinanciado,
        taxaMensal,
        formData.prazo_meses,
        formData.toogle_seguro,
        formData.seguro_percent_aa
      );

      const economiaJuros = priceResult.total_juros - sacResult.total_juros;
      
      let indicacaoPerfil = "Ambos os sistemas são viáveis";
      if (rendaMensal > 0) {
        const limiteParcela = rendaMensal * 0.3;
        const sacCabeNaRenda = sacResult.primeira_parcela <= limiteParcela;
        const priceCabeNaRenda = priceResult.primeira_parcela <= limiteParcela;
        
        if (sacCabeNaRenda && priceCabeNaRenda) {
          indicacaoPerfil = economiaJuros > 0 ? "SAC é mais econômico" : "Price tem parcelas menores";
        } else if (sacCabeNaRenda && !priceCabeNaRenda) {
          indicacaoPerfil = "Apenas SAC cabe na renda";
        } else if (!sacCabeNaRenda && priceCabeNaRenda) {
          indicacaoPerfil = "Apenas Price cabe na renda";
        } else {
          indicacaoPerfil = "Nenhum sistema cabe na renda informada";
        }
      }

      setResultado({
        price: priceResult,
        sac: sacResult,
        comparativo: {
          economia_juros_sac_vs_price: economiaJuros,
          indicacao_perfil: indicacaoPerfil
        }
      });
    } catch (error: any) {
      console.error("Erro no cálculo:", error);
    } finally {
      setLoading(false);
      setIsLoadingModalOpen(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'valor_financiado' || field === 'renda_mensal') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(numericValue) / 100);
      setFormData({ ...formData, [field]: formattedValue });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const prepararDadosGrafico = () => {
    if (!resultado) return [];
    
    const dados = [];
    const maxPontos = Math.min((resultado as any).price.fluxo_parcelas.length, 60); // Máximo 60 pontos para performance
    const intervalo = Math.ceil((resultado as any).price.fluxo_parcelas.length / maxPontos);
    
    for (let i = 0; i < (resultado as any).price.fluxo_parcelas.length; i += intervalo) {
      dados.push({
        mes: i + 1,
        price: (resultado as any).price.fluxo_parcelas[i],
        sac: (resultado as any).sac.fluxo_parcelas[i]
      });
    }
    
    return dados;
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
                  Dados do Financiamento
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-4 w-4 inline-block mr-2" />Valor a Financiar (R$)
                    </label>
                    <input
                      type="text"
                      value={formData.valor_financiado}
                      onChange={(e) => handleInputChange('valor_financiado', e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Calendar className="h-4 w-4 inline-block mr-2" />Prazo (meses)
                    </label>
                    <input
                      type="number"
                      value={formData.prazo_meses}
                      onChange={(e) => setFormData(prev => ({ ...prev, prazo_meses: Number(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <TrendingUp className="h-4 w-4 inline-block mr-2" />Taxa Efetiva Anual (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.taxa_efetiva_anual}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxa_efetiva_anual: Number(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <DollarSign className="h-4 w-4 inline-block mr-2" />Renda Mensal (R$) - Opcional
                    </label>
                    <input
                      type="text"
                      value={formData.renda_mensal}
                      onChange={(e) => handleInputChange('renda_mensal', e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    />
                  </div>

                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir Seguro?</label>
                    <Switch
                      checked={formData.toogle_seguro}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, toogle_seguro: checked }))}
                    />
                  </div>

                  {formData.toogle_seguro && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Taxa do Seguro (% a.a.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.seguro_percent_aa}
                        onChange={(e) => setFormData(prev => ({ ...prev, seguro_percent_aa: Number(e.target.value) }))}
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={calcularComparativo}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calculator className="h-5 w-5" />
                  {loading ? 'Processando...' : 'Calcular Comparativo'}
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
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Comparação dos Sistemas</h2>
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sistema Price</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency((resultado as any).price.primeira_parcela)}
                        </p>
                        <p className="text-xs text-gray-500">Parcela fixa</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sistema SAC</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency((resultado as any).sac.primeira_parcela)}
                        </p>
                        <p className="text-xs text-gray-500">1ª parcela</p>
                      </div>
                      <TrendingDown className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Economia SAC</p>
                        <p className={`text-2xl font-bold ${(resultado as any).comparativo.economia_juros_sac_vs_price > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs((resultado as any).comparativo.economia_juros_sac_vs_price))}
                        </p>
                        <p className="text-xs text-gray-500">Em juros totais</p>
                      </div>
                      <DollarSign className={`w-8 h-8 ${(resultado as any).comparativo.economia_juros_sac_vs_price > 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recomendação */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Recomendação</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {(resultado as any).comparativo.indicacao_perfil}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela Comparativa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Comparativo Detalhado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Sistema</th>
                          <th className="text-right p-3 font-medium">1ª Parcela</th>
                          <th className="text-right p-3 font-medium">Última Parcela</th>
                          <th className="text-right p-3 font-medium">Total de Juros</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3 font-medium text-blue-600">Price</td>
                          <td className="text-right p-3">{formatCurrency((resultado as any).price.primeira_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency((resultado as any).price.ultima_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency((resultado as any).price.total_juros)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-green-600">SAC</td>
                          <td className="text-right p-3">{formatCurrency((resultado as any).sac.primeira_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency((resultado as any).sac.ultima_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency((resultado as any).sac.total_juros)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Evolução das Parcelas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepararDadosGrafico()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(Number(value))}
                          labelFormatter={(label) => `Mês ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          name="Price"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sac" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          name="SAC"
                        />
                      </LineChart>
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
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Indicadores de Referência
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-300">SELIC:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-200">{INDICADORES_MERCADO.selic}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-300">CDI:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-200">{INDICADORES_MERCADO.cdi}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-300">IPCA:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-200">{INDICADORES_MERCADO.ipca}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800 dark:text-blue-300">IGP-M:</span>
                      <span className="font-medium text-blue-900 dark:text-blue-200">{INDICADORES_MERCADO.igpM}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    *Valores de referência do mercado financeiro
                  </p>
                </div>
              </motion.div>

              {/* Informações sobre os sistemas */}
              <motion.div
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-6 border border-blue-200 dark:border-blue-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Sistemas de Amortização
                </h3>

                <div className="space-y-4">
                  {/* SAC */}
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                        SAC (Sistema de Amortização Constante)
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                      <div>• Amortização constante ao longo do tempo</div>
                      <div>• Parcelas decrescentes</div>
                      <div>• Juros incidem sobre saldo devedor</div>
                      <div>• Menor valor total de juros pagos</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-lg p-4 border border-indigo-300 dark:border-indigo-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                      <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">
                        PRICE (Tabela Price)
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-indigo-700 dark:text-indigo-300">
                      <div>• Parcelas fixas durante todo período</div>
                      <div>• Amortização crescente ao longo do tempo</div>
                      <div>• Facilita o planejamento financeiro</div>
                      <div>• Maior valor total de juros pagos</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {!resultado && (
                <motion.div
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-4 border border-blue-200 dark:border-blue-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <div className="text-center space-y-3">
                    <Calculator className="w-12 h-12 text-blue-400 mx-auto" />
                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300">
                      Preencha os dados
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Informe o valor, prazo e taxa para comparar os sistemas SAC e Price.
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
        message="Processando cálculo comparativo..."
        duration={4000}
      />
    </div>
  );
}
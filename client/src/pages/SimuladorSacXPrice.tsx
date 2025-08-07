import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingDown, TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react";
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
    } catch (error) {
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
    const maxPontos = Math.min(resultado.price.fluxo_parcelas.length, 60); // Máximo 60 pontos para performance
    const intervalo = Math.ceil(resultado.price.fluxo_parcelas.length / maxPontos);
    
    for (let i = 0; i < resultado.price.fluxo_parcelas.length; i += intervalo) {
      dados.push({
        mes: i + 1,
        price: resultado.price.fluxo_parcelas[i],
        sac: resultado.sac.fluxo_parcelas[i]
      });
    }
    
    return dados;
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Simulador SAC × Price
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Compare os sistemas de amortização e escolha o melhor para seu perfil
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Dados do Financiamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="valor_financiado">Valor a Financiar (R$)</Label>
                <Input
                  id="valor_financiado"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.valor_financiado}
                  onChange={(e) => handleInputChange('valor_financiado', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="prazo_meses">Prazo (meses)</Label>
                <Input
                  id="prazo_meses"
                  type="number"
                  value={formData.prazo_meses}
                  onChange={(e) => setFormData(prev => ({ ...prev, prazo_meses: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="taxa_efetiva_anual">Taxa Efetiva Anual (%)</Label>
                <Input
                  id="taxa_efetiva_anual"
                  type="number"
                  step="0.01"
                  value={formData.taxa_efetiva_anual}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxa_efetiva_anual: Number(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="renda_mensal">Renda Mensal (R$) - Opcional</Label>
                <Input
                  id="renda_mensal"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.renda_mensal}
                  onChange={(e) => handleInputChange('renda_mensal', e.target.value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="toogle_seguro">Incluir Seguro?</Label>
                <Switch
                  id="toogle_seguro"
                  checked={formData.toogle_seguro}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, toogle_seguro: checked }))}
                />
              </div>

              {formData.toogle_seguro && (
                <div>
                  <Label htmlFor="seguro_percent_aa">Taxa do Seguro (% a.a.)</Label>
                  <Input
                    id="seguro_percent_aa"
                    type="number"
                    step="0.01"
                    value={formData.seguro_percent_aa}
                    onChange={(e) => setFormData(prev => ({ ...prev, seguro_percent_aa: Number(e.target.value) }))}
                  />
                </div>
              )}

              <Button 
                onClick={calcularComparativo} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Calculando..." : "Calcular Comparativo"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2">
          {resultado && (
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sistema Price</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(resultado.price.primeira_parcela)}
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
                          {formatCurrency(resultado.sac.primeira_parcela)}
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
                        <p className={`text-2xl font-bold ${resultado.comparativo.economia_juros_sac_vs_price > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(resultado.comparativo.economia_juros_sac_vs_price))}
                        </p>
                        <p className="text-xs text-gray-500">Em juros totais</p>
                      </div>
                      <DollarSign className={`w-8 h-8 ${resultado.comparativo.economia_juros_sac_vs_price > 0 ? 'text-green-600' : 'text-red-600'}`} />
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
                      {resultado.comparativo.indicacao_perfil}
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
                          <td className="text-right p-3">{formatCurrency(resultado.price.primeira_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency(resultado.price.ultima_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency(resultado.price.total_juros)}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-medium text-green-600">SAC</td>
                          <td className="text-right p-3">{formatCurrency(resultado.sac.primeira_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency(resultado.sac.ultima_parcela)}</td>
                          <td className="text-right p-3">{formatCurrency(resultado.sac.total_juros)}</td>
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
                          formatter={(value) => formatCurrency(Number(value))}
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
          )}

          {!resultado && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Pronto para simular?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Preencha os dados do financiamento e clique em "Calcular Comparativo" para ver os resultados.
                </p>
              </CardContent>
            </Card>
          )}
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
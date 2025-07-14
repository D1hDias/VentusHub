import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Trash2, DollarSign, PieChart, TrendingUp, BarChart3, Calendar } from "lucide-react";
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
      const imoveisValidos = formData.imoveis.filter(imovel => 
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
      const resultadosImoveis: ResultadoImovel[] = imoveisValidos.map(imovel => {
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

    } catch (error) {
      console.error("Erro no cálculo:", error);
      alert("Erro ao calcular simulação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
    }
  };

  const prepararDadosGrafico = () => {
    if (!resultado) return [];
    
    return resultado.fluxo_caixa_mensal.map((valor, index) => ({
      mes: index + 1,
      fluxo_caixa: valor,
      acumulado: resultado.fluxo_caixa_mensal.slice(0, index + 1).reduce((a, b) => a + b, 0)
    }));
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Renda Passiva - Carteira de Aluguéis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Projete o fluxo de caixa e rentabilidade da sua carteira de imóveis locados
            </p>
          </div>
        </div>
        
        {/* Indicadores do Mercado - Seção ampliada */}
        <div className="mb-8">
          <IndicadoresMercado className="max-w-full mx-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="xl:col-span-1 space-y-6">
          {/* Configurações Gerais */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="horizonte_anos" className="text-foreground">Horizonte (anos)</Label>
                <Input
                  id="horizonte_anos"
                  type="number"
                  value={formData.horizonte_anos}
                  onChange={(e) => setFormData(prev => ({ ...prev, horizonte_anos: Number(e.target.value) }))}
                  className="bg-background text-foreground border-input"
                />
              </div>

              <div>
                <Label htmlFor="indice_reajuste" className="text-foreground">Índice de Reajuste</Label>
                <Select 
                  value={formData.indice_reajuste} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, indice_reajuste: value }))}
                >
                  <SelectTrigger className="bg-background text-foreground border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="igpm">IGP-M ({INDICADORES_MERCADO.igpM}% a.a.)</SelectItem>
                    <SelectItem value="ipca">IPCA ({INDICADORES_MERCADO.ipca}% a.a.)</SelectItem>
                    <SelectItem value="custom">Taxa Customizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.indice_reajuste === 'custom' && (
                <div>
                  <Label htmlFor="taxa_reajuste_custom_aa" className="text-foreground">Taxa Custom (% a.a.)</Label>
                  <Input
                    id="taxa_reajuste_custom_aa"
                    type="number"
                    step="0.01"
                    value={formData.taxa_reajuste_custom_aa}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxa_reajuste_custom_aa: Number(e.target.value) }))}
                    className="bg-background text-foreground border-input"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="intervalo_reajuste_meses" className="text-foreground">Intervalo Reajuste (meses)</Label>
                <Select 
                  value={String(formData.intervalo_reajuste_meses)} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, intervalo_reajuste_meses: Number(value) }))}
                >
                  <SelectTrigger className="bg-background text-foreground border-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between">
                <Label htmlFor="toggle_depreciacao" className="text-foreground">Incluir Depreciação?</Label>
                <Switch
                  id="toggle_depreciacao"
                  checked={formData.toggle_depreciacao}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, toggle_depreciacao: checked }))}
                />
              </div>

              {formData.toggle_depreciacao && (
                <div>
                  <Label htmlFor="taxa_depreciacao_aa" className="text-foreground">Taxa Depreciação (% a.a.)</Label>
                  <Input
                    id="taxa_depreciacao_aa"
                    type="number"
                    step="0.01"
                    value={formData.taxa_depreciacao_aa}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxa_depreciacao_aa: Number(e.target.value) }))}
                    className="bg-background text-foreground border-input"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="aliquota_ir_percent" className="text-foreground">Alíquota IR (%)</Label>
                <Input
                  id="aliquota_ir_percent"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_ir_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, aliquota_ir_percent: Number(e.target.value) }))}
                  className="bg-background text-foreground border-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Carteira de Imóveis */}
          <Card className="bg-card dark:bg-card border border-border dark:border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="w-5 h-5" />
                  Carteira de Imóveis
                </CardTitle>
                <Button
                  onClick={adicionarImovel}
                  size="sm"
                  variant="outline"
                  className="bg-background text-foreground border-input hover:bg-accent"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.imoveis.map((imovel, index) => (
                <div key={index} className="p-4 border border-border dark:border-border rounded-lg bg-accent/10 dark:bg-accent/10">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground">Imóvel {index + 1}</h4>
                    {formData.imoveis.length > 1 && (
                      <Button
                        onClick={() => removerImovel(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-foreground">Valor do Imóvel (R$)</Label>
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={imovel.valor_imovel}
                        onChange={(e) => atualizarImovel(index, 'valor_imovel', handleInputChange('valor_imovel', e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>

                    <div>
                      <Label className="text-foreground">Aluguel Mensal Inicial (R$)</Label>
                      <Input
                        type="text"
                        placeholder="R$ 0,00"
                        value={imovel.aluguel_mensal_inicial}
                        onChange={(e) => atualizarImovel(index, 'aluguel_mensal_inicial', handleInputChange('aluguel_mensal_inicial', e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>

                    <div>
                      <Label className="text-foreground">Vacância (% a.a.)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={imovel.vacancia_percent_aa}
                        onChange={(e) => atualizarImovel(index, 'vacancia_percent_aa', Number(e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Condomínio</Label>
                      <Switch
                        checked={imovel.toggle_condominio}
                        onCheckedChange={(checked) => atualizarImovel(index, 'toggle_condominio', checked)}
                      />
                    </div>

                    {imovel.toggle_condominio && (
                      <div>
                        <Label className="text-foreground">Condomínio Mensal (R$)</Label>
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          value={imovel.condominio_mensal}
                          onChange={(e) => atualizarImovel(index, 'condominio_mensal', handleInputChange('condominio_mensal', e.target.value))}
                          className="bg-background text-foreground border-input"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">IPTU</Label>
                      <Switch
                        checked={imovel.toggle_iptu}
                        onCheckedChange={(checked) => atualizarImovel(index, 'toggle_iptu', checked)}
                      />
                    </div>

                    {imovel.toggle_iptu && (
                      <div>
                        <Label className="text-foreground">IPTU Anual (R$)</Label>
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          value={imovel.iptu_anual}
                          onChange={(e) => atualizarImovel(index, 'iptu_anual', handleInputChange('iptu_anual', e.target.value))}
                          className="bg-background text-foreground border-input"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-foreground">Manutenção (% a.a. do valor)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={imovel.manutencao_percent_aa}
                        onChange={(e) => atualizarImovel(index, 'manutencao_percent_aa', Number(e.target.value))}
                        className="bg-background text-foreground border-input"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                onClick={calcularSimulacao} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Calculando..." : "Simular Carteira"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="xl:col-span-2">
          {resultado && (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card dark:bg-card border border-border dark:border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Yield Bruto</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercent(resultado.metricas_portfolio.yield_bruto_anual)}
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
                          {formatPercent(resultado.metricas_portfolio.yield_liquido_anual)}
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
                          {formatCurrency(resultado.metricas_portfolio.ir_total_anual)}
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
                        {resultado.imoveis.map((imovel, index) => (
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
                          formatter={(value) => formatCurrency(Number(value))}
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
          )}

          {!resultado && (
            <Card className="bg-card dark:bg-card border border-border dark:border-border">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Configure sua carteira
                </h3>
                <p className="text-muted-foreground">
                  Preencha os dados dos imóveis e configurações para simular o fluxo de caixa da sua carteira de aluguéis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
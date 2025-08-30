import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building, CreditCard, FileText, TrendingUp, TrendingDown, BarChart3, PieChart, Users, DollarSign, Target, Calendar, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INDICADORES_MERCADO } from '@/lib/indicadores-mercado';
import IndicadoresMercado from '@/components/IndicadoresMercado';
import { Switch } from "@/components/ui/switch";

// Função para converter hex para RGB
const hexToRgb = (hex: any) => {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 31, b: 63 };
};

// Função para converter imagem em base64
const imageToBase64 = (url: any) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height
      });
    };
    img.onerror = () => reject('Failed to load image');
    img.src = url;
  });
};

// Função sigmoid para probabilidade de contemplação
const sigmoid = (x: any) => {
  return 1 / (1 + Math.exp(-x));
};

// Modelo logístico de contemplação: P(t) = σ(α + β·lance% + γ·t)
const calcularProbabilidadeContemplacao = (lancePercent: any, mes: any) => {
  const alpha = -3;     // Intercepto
  const beta = 0.12;    // Coeficiente do lance (por ponto percentual)
  const gamma = 0.08;   // Coeficiente temporal (por mês)
  
  const z = alpha + beta * lancePercent + gamma * mes;
  return sigmoid(z);
};

// Função para calcular TIR (Taxa Interna de Retorno)
const calcularTIR = (fluxosCaixa: any) => {
  const maxIteracoes = 100;
  const tolerancia = 0.0001;
  let taxa = 0.01; // Estimativa inicial de 1% ao mês
  
  for (let i = 0; i < maxIteracoes; i++) {
    let vpl = 0;
    let vplDerivada = 0;
    
    for (let j = 0; j < fluxosCaixa.length; j++) {
      const fator = Math.pow(1 + taxa, j);
      vpl += fluxosCaixa[j] / fator;
      vplDerivada -= j * fluxosCaixa[j] / Math.pow(1 + taxa, j + 1);
    }
    
    if (Math.abs(vpl) < tolerancia) {
      return taxa; // Retorna taxa mensal
    }
    
    if (vplDerivada !== 0) {
      taxa = taxa - vpl / vplDerivada;
    }
  }
  
  return 0; // Retorna 0 se não conseguir calcular
};

// Função para calcular parcela Price
const calcularParcelaPrice = (valorFinanciado: any, taxaAnual: any, prazoMeses: any) => {
  const taxaMensal = taxaAnual / 100 / 12;
  if (taxaMensal === 0) return valorFinanciado / prazoMeses;
  
  const fator = Math.pow(1 + taxaMensal, prazoMeses);
  return valorFinanciado * (taxaMensal * fator) / (fator - 1);
};

// Formatação de valores
const formatCurrency = (value: any) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPercent = (value: any) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

export default function SimuladorConsorcioXFinanciamento() {
  const [formData, setFormData] = useState({
    // Consórcio
    valorCarta: '',
    lancePercent: '0',
    prazoConsorcioMeses: '180',
    toggleTaxaAdm: false,
    taxaAdmTotalPercent: '20',
    toggleIndiceCorrecao: false,
    indiceCorrecaoAnual: '6',
    toggleSeguroConsorcio: false,
    seguroConsorcioPercentAA: '0.05',
    
    // Financiamento
    valorFinanciamento: '',
    prazoFinanciamentoMeses: '360',
    taxaJurosFinanciamentoAA: '10.8',
    entradaPercent: '20',
    toggleSeguroFinanciamento: false,
    seguroFinanciamentoPercentAA: '0.25',
    
    // Geral
    custoOportunidadeAA: '',
    horizonteAnaliseMeses: ''
  });

  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-consorcio-financiamento';

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

  // Auto-sync valor financiamento com valor carta
  useEffect(() => {
    if (formData.valorCarta && !formData.valorFinanciamento) {
      setFormData(prev => ({
        ...prev,
        valorFinanciamento: prev.valorCarta
      }));
    }
  }, [formData.valorCarta]);

  // Auto-calcular horizonte baseado no menor prazo
  useEffect(() => {
    const prazoConsorcio = parseInt(formData.prazoConsorcioMeses) || 180;
    const prazoFinanciamento = parseInt(formData.prazoFinanciamentoMeses) || 360;
    const menorPrazo = Math.min(prazoConsorcio, prazoFinanciamento);
    
    if (!formData.horizonteAnaliseMeses) {
      setFormData(prev => ({
        ...prev,
        horizonteAnaliseMeses: menorPrazo.toString()
      }));
    }
  }, [formData.prazoConsorcioMeses, formData.prazoFinanciamentoMeses]);

  const handleInputChange = (field: any, value: any) => {
    if (field === 'valorCarta' || field === 'valorFinanciamento') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue / 100);
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

  const calcularSimulacao = () => {
    setLoading(true);
    
    try {
      // Parsing dos dados
      const valorCarta = parseFloat(formData.valorCarta.replace(/[^\\d,]/g, '').replace(',', '.')) || 0;
      const lancePercent = parseFloat(formData.lancePercent) || 0;
      const prazoConsorcioMeses = parseInt(formData.prazoConsorcioMeses) || 180;
      const taxaAdmPercent = formData.toggleTaxaAdm ? parseFloat(formData.taxaAdmTotalPercent) || 20 : 20;
      const indiceCorrecaoAnual = formData.toggleIndiceCorrecao ? parseFloat(formData.indiceCorrecaoAnual) || 0 : 0;
      const seguroConsorcioAA = formData.toggleSeguroConsorcio ? parseFloat(formData.seguroConsorcioPercentAA) || 0 : 0;
      
      const valorFinanciamento = parseFloat(formData.valorFinanciamento.replace(/[^\\d,]/g, '').replace(',', '.')) || valorCarta;
      const prazoFinanciamentoMeses = parseInt(formData.prazoFinanciamentoMeses) || 360;
      const taxaJurosFinanciamentoAA = parseFloat(formData.taxaJurosFinanciamentoAA) || 10.8;
      const entradaPercent = parseFloat(formData.entradaPercent) || 20;
      const seguroFinanciamentoAA = formData.toggleSeguroFinanciamento ? parseFloat(formData.seguroFinanciamentoPercentAA) || 0.25 : 0.25;
      
      const custoOportunidadeAA = parseFloat(formData.custoOportunidadeAA) || INDICADORES_MERCADO.custoOportunidade;
      const horizonteAnaliseMeses = parseInt(formData.horizonteAnaliseMeses) || Math.min(prazoConsorcioMeses, prazoFinanciamentoMeses);

      // === CÁLCULOS DO CONSÓRCIO ===
      
      // Parcela base do consórcio
      const parcelaBaseConsorcio = valorCarta / prazoConsorcioMeses + (taxaAdmPercent * valorCarta / 100) / prazoConsorcioMeses;
      
      // Fluxo de caixa do consórcio
      const fluxoConsorcio = [];
      const probabilidadesContemplacao = [];
      let saldoCorrigidoConsorcio = valorCarta;
      
      // Mês 0: Lance inicial (se houver) + primeira parcela
      const lanceInicial = valorCarta * lancePercent / 100;
      fluxoConsorcio.push(-(lanceInicial + parcelaBaseConsorcio));
      
      let mesContemplacao = null;
      let probabilidadeAcumulada = 0;
      
      for (let mes = 1; mes < horizonteAnaliseMeses; mes++) {
        // Correção anual do saldo
        if (mes % 12 === 0 && indiceCorrecaoAnual > 0) {
          saldoCorrigidoConsorcio *= (1 + indiceCorrecaoAnual / 100);
        }
        
        // Probabilidade de contemplação neste mês
        const probMes = calcularProbabilidadeContemplacao(lancePercent, mes);
        probabilidadesContemplacao.push({ mes, probabilidade: probMes });
        
        // Se ainda não foi contemplado
        if (!mesContemplacao && Math.random() < probMes && probabilidadeAcumulada < 0.95) {
          mesContemplacao = mes;
          // Mês da contemplação: recebe crédito menos parcela
          const seguroMes = (seguroConsorcioAA / 100 / 12) * saldoCorrigidoConsorcio;
          fluxoConsorcio.push(saldoCorrigidoConsorcio - (parcelaBaseConsorcio + seguroMes));
        } else {
          // Parcela normal + seguro
          const seguroMes = (seguroConsorcioAA / 100 / 12) * saldoCorrigidoConsorcio;
          fluxoConsorcio.push(-(parcelaBaseConsorcio + seguroMes));
        }
        
        probabilidadeAcumulada = 1 - probabilidadesContemplacao.reduce((acc, p) => acc * (1 - p.probabilidade), 1);
      }
      
      // Se não foi contemplado até o horizonte, assumir contemplação no último mês
      if (!mesContemplacao) {
        mesContemplacao = horizonteAnaliseMeses - 1;
        fluxoConsorcio[fluxoConsorcio.length - 1] += saldoCorrigidoConsorcio;
      }

      // === CÁLCULOS DO FINANCIAMENTO ===
      
      const valorFinanciado = valorFinanciamento * (1 - entradaPercent / 100);
      const entrada = valorFinanciamento * entradaPercent / 100;
      const parcelaFinanciamento = calcularParcelaPrice(valorFinanciado, taxaJurosFinanciamentoAA, prazoFinanciamentoMeses);
      
      // Fluxo de caixa do financiamento
      const fluxoFinanciamento = [];
      fluxoFinanciamento.push(-entrada); // Mês 0: entrada
      
      let saldoDevedorFinanciamento = valorFinanciado;
      const taxaMensalFinanciamento = taxaJurosFinanciamentoAA / 100 / 12;
      
      for (let mes = 1; mes < horizonteAnaliseMeses; mes++) {
        const seguroMes = (seguroFinanciamentoAA / 100 / 12) * saldoDevedorFinanciamento;
        const totalParcela = parcelaFinanciamento + seguroMes;
        fluxoFinanciamento.push(-totalParcela);
        
        // Atualizar saldo devedor
        const jurosMes = saldoDevedorFinanciamento * taxaMensalFinanciamento;
        const amortizacaoMes = parcelaFinanciamento - jurosMes;
        saldoDevedorFinanciamento = Math.max(0, saldoDevedorFinanciamento - amortizacaoMes);
      }

      // === CÁLCULO DOS INDICADORES ===
      
      // TIR do consórcio e financiamento
      const tirMensalConsorcio = calcularTIR(fluxoConsorcio);
      const tirAnualConsorcio = Math.pow(1 + tirMensalConsorcio, 12) - 1;
      
      const tirMensalFinanciamento = calcularTIR(fluxoFinanciamento);
      const tirAnualFinanciamento = Math.pow(1 + tirMensalFinanciamento, 12) - 1;
      
      // NPV (Valor Presente Líquido)
      const taxaDesconto = custoOportunidadeAA / 100 / 12;
      
      const npvConsorcio = fluxoConsorcio.reduce((acc, fluxo, mes) => {
        return acc + fluxo / Math.pow(1 + taxaDesconto, mes);
      }, 0);
      
      const npvFinanciamento = fluxoFinanciamento.reduce((acc, fluxo, mes) => {
        return acc + fluxo / Math.pow(1 + taxaDesconto, mes);
      }, 0);
      
      const npvDiff = npvConsorcio - npvFinanciamento;
      const vencedor = npvDiff > 0 ? 'Consórcio' : 'Financiamento';

      // === RESULTADO FINAL ===
      
      const resultadoFinal = {
        financiamento: {
          tirMensal: tirMensalFinanciamento,
          tirAnual: tirAnualFinanciamento,
          cetAnual: tirAnualFinanciamento * 100, // CET aproximado
          fluxoCaixa: fluxoFinanciamento,
          parcelaMensal: parcelaFinanciamento,
          valorFinanciado: valorFinanciado,
          entrada: entrada,
          npv: npvFinanciamento
        },
        consorcio: {
          tirMensal: tirMensalConsorcio,
          tirAnual: tirAnualConsorcio,
          probContAteHoriz: probabilidadeAcumulada,
          fluxoCaixaEsperado: fluxoConsorcio,
          parcelaBase: parcelaBaseConsorcio,
          mesContemplacao: mesContemplacao,
          probabilidades: probabilidadesContemplacao,
          npv: npvConsorcio
        },
        comparativo: {
          npvDiff: npvDiff,
          vencedor: vencedor,
          vantagem: Math.abs(npvDiff),
          economiaPercent: Math.abs(npvDiff) / Math.max(Math.abs(npvConsorcio), Math.abs(npvFinanciamento)) * 100
        },
        parametros: {
          valorCarta,
          valorFinanciamento,
          horizonteAnaliseMeses,
          custoOportunidadeAA
        }
      };

      setResultado(resultadoFinal);
      
      // Scroll para resultados
      setTimeout(() => {
        scroller.scrollTo('results-section', {
          duration: 800,
          delay: 0,
          smooth: 'easeInOutQuart'
        });
      }, 100);
      
    } catch (error: any) {
      console.error('Erro no cálculo:', error);
      alert('Erro no cálculo. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  const gerarPDF = async () => {
    if (!resultado) return;
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Cor VentusHub
      const rgbVentusHub = hexToRgb('#001f3f');
      
      // Logo
      let logoVentusHub = null;
      try {
        logoVentusHub = await imageToBase64('/src/assets/logo.png');
      } catch (error: any) {
        console.warn('Logo não encontrada:', error);
      }
      
      // Cabeçalho
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      if (logoVentusHub) {
        const logoWidth = 25;
        const logoHeight = logoWidth / (logoVentusHub as any).aspectRatio;
        const logoY = 12.5 - (logoHeight / 2);
        doc.addImage((logoVentusHub as any).dataUrl, 'PNG', 15, logoY, logoWidth, logoHeight);
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SIMULADOR CONSÓRCIO × FINANCIAMENTO', 50, 16);
      
      let currentY = 40;
      
      // Parâmetros da simulação
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Parâmetros da Simulação', 15, currentY);
      
      currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Valor da carta/financiamento: ${formatCurrency((resultado as any).parametros.valorCarta)}`, 15, currentY);
      doc.text(`Horizonte de análise: ${(resultado as any).parametros.horizonteAnaliseMeses} meses`, 15, currentY + 5);
      doc.text(`Custo de oportunidade: ${(resultado as any).parametros.custoOportunidadeAA.toFixed(2)}% a.a.`, 15, currentY + 10);
      
      currentY += 25;
      
      // Resultados Comparativos
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados Comparativos', 15, currentY);
      
      currentY += 15;
      
      // Tabela de resultados
      const dadosTabela = [
        ['Indicador', 'Consórcio', 'Financiamento'],
        ['TIR Anual', formatPercent((resultado as any).consorcio.tirAnual * 100), formatPercent((resultado as any).financiamento.tirAnual * 100)],
        ['Parcela Base', formatCurrency((resultado as any).consorcio.parcelaBase), formatCurrency((resultado as any).financiamento.parcelaMensal)],
        ['NPV', formatCurrency((resultado as any).consorcio.npv), formatCurrency((resultado as any).financiamento.npv)],
        ['Prob. Contemplação', formatPercent((resultado as any).consorcio.probContAteHoriz * 100), 'N/A']
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [dadosTabela[0]],
        body: dadosTabela.slice(1),
        theme: 'grid',
        headStyles: {
          fillColor: [rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold' }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Recomendação
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const recomendacao = `RECOMENDAÇÃO: ${(resultado as any).comparativo.vencedor.toUpperCase()}`;
      const corRecomendacao = (resultado as any).comparativo.vencedor === 'Consórcio' ? [0, 100, 0] : [0, 100, 200];
      doc.setTextColor(corRecomendacao[0], corRecomendacao[1], corRecomendacao[2]);
      doc.text(recomendacao, 15, currentY);
      
      currentY += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Vantagem financeira: ${formatCurrency((resultado as any).comparativo.vantagem)}`, 15, currentY);
      doc.text(`Economia percentual: ${(resultado as any).comparativo.economiaPercent.toFixed(2)}%`, 15, currentY + 5);
      
      // Rodapé
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setFontSize(8);
      doc.text('VentusHub - Plataforma Inteligente de Crédito Imobiliário', pageWidth/2, pageHeight - 8, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth/2, pageHeight - 4, { align: 'center' });
      
      // Salvar
      const fileName = `Simulacao_Consorcio_vs_Financiamento_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    }
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
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calculator className="h-6 w-6 mr-2 text-purple-600" />
                Parâmetros da Simulação
              </h2>
            
            {/* Layout em duas colunas: Consórcio e Financiamento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* === COLUNA ESQUERDA: CONSÓRCIO === */}
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-6 flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  📋 Consórcio Imobiliário
                </h3>
                
                {/* Valor da Carta */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    Valor da Carta de Crédito (R$) *
                  </label>
                  <input
                    type="text"
                    value={formData.valorCarta}
                    onChange={(e) => handleInputChange('valorCarta', e.target.value)}
                    placeholder="R$ 300.000,00"
                    className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                    required
                  />
                </div>

                {/* Parâmetros do Consórcio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Lance Inicial (% da carta)
                    </label>
                    <input
                      type="number"
                      value={formData.lancePercent}
                      onChange={(e) => handleInputChange('lancePercent', e.target.value)}
                      step="0.1"
                      min="0"
                      max="50"
                      className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      Prazo (meses)
                    </label>
                    <input
                      type="number"
                      value={formData.prazoConsorcioMeses}
                      onChange={(e) => handleInputChange('prazoConsorcioMeses', e.target.value)}
                      step="1"
                      min="60"
                      max="300"
                      className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                    />
                  </div>
                </div>

                {/* Opções Avançadas do Consórcio */}
                <div className="space-y-4">
                  
                  {/* Toggle Taxa Administrativa */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.toggleTaxaAdm}
                        onCheckedChange={(checked) => handleInputChange('toggleTaxaAdm', checked)}
                      />
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">
                        Personalizar Taxa Administrativa (padrão: 20%)
                      </label>
                    </div>
                    {formData.toggleTaxaAdm && (
                      <input
                        type="number"
                        value={formData.taxaAdmTotalPercent}
                        onChange={(e) => handleInputChange('taxaAdmTotalPercent', e.target.value)}
                        step="0.1"
                        min="10"
                        max="30"
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                      />
                    )}
                  </div>

                  {/* Toggle Correção */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.toggleIndiceCorrecao}
                        onCheckedChange={(checked) => handleInputChange('toggleIndiceCorrecao', checked)}
                      />
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">
                        Correção Anual (padrão: sem correção)
                      </label>
                    </div>
                    {formData.toggleIndiceCorrecao && (
                      <input
                        type="number"
                        value={formData.indiceCorrecaoAnual}
                        onChange={(e) => handleInputChange('indiceCorrecaoAnual', e.target.value)}
                        step="0.1"
                        min="0"
                        max="15"
                        placeholder="6% (INCC)"
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                      />
                    )}
                  </div>

                  {/* Toggle Seguro Consórcio */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.toggleSeguroConsorcio}
                        onCheckedChange={(checked) => handleInputChange('toggleSeguroConsorcio', checked)}
                      />
                      <label className="text-sm font-medium text-green-700 dark:text-green-300">
                        Seguro do Consórcio (padrão: sem seguro)
                      </label>
                    </div>
                    {formData.toggleSeguroConsorcio && (
                      <input
                        type="number"
                        value={formData.seguroConsorcioPercentAA}
                        onChange={(e) => handleInputChange('seguroConsorcioPercentAA', e.target.value)}
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.05% a.a."
                        className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* === COLUNA DIREITA: FINANCIAMENTO === */}
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-6 flex items-center">
                  <Building className="h-6 w-6 mr-2" />
                  🏦 Financiamento Bancário
                </h3>
                
                {/* Valor do Financiamento */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Valor do Financiamento (R$) *
                  </label>
                  <input
                    type="text"
                    value={formData.valorFinanciamento}
                    onChange={(e) => handleInputChange('valorFinanciamento', e.target.value)}
                    placeholder="R$ 300.000,00"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    required
                  />
                </div>

                {/* Parâmetros do Financiamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Prazo (meses)
                    </label>
                    <input
                      type="number"
                      value={formData.prazoFinanciamentoMeses}
                      onChange={(e) => handleInputChange('prazoFinanciamentoMeses', e.target.value)}
                      step="1"
                      min="60"
                      max="420"
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Taxa de Juros (% a.a.)
                    </label>
                    <input
                      type="number"
                      value={formData.taxaJurosFinanciamentoAA}
                      onChange={(e) => handleInputChange('taxaJurosFinanciamentoAA', e.target.value)}
                      step="0.1"
                      min="6"
                      max="18"
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Entrada (% do valor)
                  </label>
                  <input
                    type="number"
                    value={formData.entradaPercent}
                    onChange={(e) => handleInputChange('entradaPercent', e.target.value)}
                    step="5"
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  />
                </div>

                {/* Opções Avançadas do Financiamento */}
                <div className="space-y-4">
                  
                  {/* Toggle Seguro Financiamento */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={formData.toggleSeguroFinanciamento}
                        onCheckedChange={(checked) => handleInputChange('toggleSeguroFinanciamento', checked)}
                      />
                      <label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Seguro MIP/DFI (padrão: sem seguro)
                      </label>
                    </div>
                    {formData.toggleSeguroFinanciamento && (
                      <input
                        type="number"
                        value={formData.seguroFinanciamentoPercentAA}
                        onChange={(e) => handleInputChange('seguroFinanciamentoPercentAA', e.target.value)}
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.25% a.a."
                        className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

              
              <div className="mt-8 flex justify-center">
                <motion.button
                  onClick={calcularSimulacao}
                  disabled={loading || !formData.valorCarta || !formData.valorFinanciamento}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calculator className="h-5 w-5" />
                  <span>{loading ? 'Calculando...' : 'Calcular Comparativo'}</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Resultados */}
            <AnimatePresence>
              {resultado && (
                <Element name="results-section">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6 w-full"
                  >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
                      Resultados da Comparação
                    </h2>
                    <button
                      onClick={gerarPDF}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Baixar PDF</span>
                    </button>
                  </div>

                  {/* Resumo Executivo */}
                  <div className={`rounded-lg p-6 mb-8 ${
                    (resultado as any).comparativo.vencedor === 'Consórcio' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-blue-100 border-l-4 border-blue-500'
                  }`}>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      📊 Recomendação: {(resultado as any).comparativo.vencedor}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Vantagem financeira:</strong> {formatCurrency((resultado as any).comparativo.vantagem)}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Economia:</strong> {(resultado as any).comparativo.economiaPercent.toFixed(2)}% em valor presente
                    </p>
                  </div>

                  {/* Comparativo Detalhado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Consórcio */}
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        📋 Consórcio
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>TIR Anual:</span>
                          <span className="font-semibold">{formatPercent((resultado as any).consorcio.tirAnual)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NPV:</span>
                          <span className="font-semibold">{formatCurrency((resultado as any).consorcio.npv)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo Total:</span>
                          <span className="font-semibold">{formatCurrency((resultado as any).consorcio.custoTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prob. Contemplação:</span>
                          <span className="font-semibold">{(resultado as any).consorcio.probabilidadeContemplacao.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Financiamento */}
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        🏦 Financiamento
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>TIR Anual:</span>
                          <span className="font-semibold">{formatPercent((resultado as any).financiamento.tirAnual)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NPV:</span>
                          <span className="font-semibold">{formatCurrency((resultado as any).financiamento.npv)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custo Total:</span>
                          <span className="font-semibold">{formatCurrency((resultado as any).financiamento.custoTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parcela Inicial:</span>
                          <span className="font-semibold">{formatCurrency((resultado as any).financiamento.parcelaInicial)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">📊 Análise Detalhada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Detalhes Consórcio */}
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">Detalhes do Consórcio:</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Parcela Mensal:</strong> {formatCurrency((resultado as any).consorcio.parcelaMensal)}</p>
                          <p><strong>Taxa Administrativa:</strong> {(resultado as any).consorcio.taxaAdm}%</p>
                          <p><strong>Valor Total Pago:</strong> {formatCurrency((resultado as any).consorcio.valorTotalPago)}</p>
                          <p><strong>Tempo Médio Contemplação:</strong> {(resultado as any).consorcio.tempoMedioContemplacao} meses</p>
                        </div>
                      </div>

                      {/* Detalhes Financiamento */}
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">Detalhes do Financiamento:</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Entrada:</strong> {formatCurrency((resultado as any).financiamento.entrada)}</p>
                          <p><strong>Valor Financiado:</strong> {formatCurrency((resultado as any).financiamento.valorFinanciado)}</p>
                          <p><strong>Taxa de Juros:</strong> {(resultado as any).financiamento.taxaJuros}% a.a.</p>
                          <p><strong>Valor Total Pago:</strong> {formatCurrency((resultado as any).financiamento.valorTotalPago)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Observações Importantes:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• A probabilidade de contemplação é baseada em modelo estatístico simplificado</li>
                      <li>• TIR considera fluxo de caixa até contemplação (consórcio) ou fim do prazo (financiamento)</li>
                      <li>• NPV calculado com base no custo de oportunidade informado</li>
                      <li>• Consulte um especialista para validação detalhada da análise</li>
                    </ul>
                  </div>

                  </motion.div>
                </Element>
              )}
            </AnimatePresence>
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
                    *Valores padrão do mercado - podem ser personalizados no formulário
                  </p>
                </div>
              </motion.div>

              {/* Critérios de Análise */}
              <motion.div
                className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-6 border border-purple-200 dark:border-purple-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Critérios de Análise
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Consórcio
                    </h4>
                    <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Sem juros pré-fixados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span>Contemplação por sorteio ou lance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-blue-500" />
                        <span>Taxa administrativa fixa</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Financiamento
                    </h4>
                    <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Liberação imediata do crédito</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span>Juros pré-fixados ou pós-fixados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-blue-500" />
                        <span>Entrada exigida pelo banco</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dicas de Otimização */}
              <motion.div
                className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow-sm p-6 border border-purple-200 dark:border-purple-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Dicas de Otimização
                </h3>
                
                <div className="space-y-3 text-sm text-purple-700 dark:text-purple-300">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">Consórcio:</span>
                      <p className="text-xs mt-1">Lance estratégico de 15-30% aumenta significativamente a probabilidade de contemplação.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">Financiamento:</span>
                      <p className="text-xs mt-1">Entrada maior reduz o valor financiado e os juros totais pagos.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">TIR vs NPV:</span>
                      <p className="text-xs mt-1">NPV considera o custo de oportunidade do capital, oferecendo visão mais realista.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                    <div>
                      <span className="font-medium">Horizonte de Análise:</span>
                      <p className="text-xs mt-1">Compare prazos equivalentes para análise mais precisa dos custos.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

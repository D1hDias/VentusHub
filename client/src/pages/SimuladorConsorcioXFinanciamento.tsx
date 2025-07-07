import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building, CreditCard, FileText, TrendingUp, TrendingDown, BarChart3, PieChart, Users, DollarSign, Target, Calendar } from "lucide-react";
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { INDICADORES_MERCADO } from '@/lib/indicadores-mercado';
import IndicadoresMercado from '@/components/IndicadoresMercado';
import { Switch } from "@/components/ui/switch";

// Função para converter hex para RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 31, b: 63 };
};

// Função para converter imagem em base64
const imageToBase64 = (url) => {
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
const sigmoid = (x) => {
  return 1 / (1 + Math.exp(-x));
};

// Modelo logístico de contemplação: P(t) = σ(α + β·lance% + γ·t)
const calcularProbabilidadeContemplacao = (lancePercent, mes) => {
  const alpha = -3;     // Intercepto
  const beta = 0.12;    // Coeficiente do lance (por ponto percentual)
  const gamma = 0.08;   // Coeficiente temporal (por mês)
  
  const z = alpha + beta * lancePercent + gamma * mes;
  return sigmoid(z);
};

// Função para calcular TIR (Taxa Interna de Retorno)
const calcularTIR = (fluxosCaixa) => {
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
const calcularParcelaPrice = (valorFinanciado, taxaAnual, prazoMeses) => {
  const taxaMensal = taxaAnual / 100 / 12;
  if (taxaMensal === 0) return valorFinanciado / prazoMeses;
  
  const fator = Math.pow(1 + taxaMensal, prazoMeses);
  return valorFinanciado * (taxaMensal * fator) / (fator - 1);
};

// Formatação de valores
const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPercent = (value) => {
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

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      
    } catch (error) {
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
      } catch (error) {
        console.warn('Logo não encontrada:', error);
      }
      
      // Cabeçalho
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      if (logoVentusHub) {
        const logoWidth = 25;
        const logoHeight = logoWidth / logoVentusHub.aspectRatio;
        const logoY = 12.5 - (logoHeight / 2);
        doc.addImage(logoVentusHub.dataUrl, 'PNG', 15, logoY, logoWidth, logoHeight);
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
      
      doc.text(`Valor da carta/financiamento: ${formatCurrency(resultado.parametros.valorCarta)}`, 15, currentY);
      doc.text(`Horizonte de análise: ${resultado.parametros.horizonteAnaliseMeses} meses`, 15, currentY + 5);
      doc.text(`Custo de oportunidade: ${resultado.parametros.custoOportunidadeAA.toFixed(2)}% a.a.`, 15, currentY + 10);
      
      currentY += 25;
      
      // Resultados Comparativos
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados Comparativos', 15, currentY);
      
      currentY += 15;
      
      // Tabela de resultados
      const dadosTabela = [
        ['Indicador', 'Consórcio', 'Financiamento'],
        ['TIR Anual', formatPercent(resultado.consorcio.tirAnual * 100), formatPercent(resultado.financiamento.tirAnual * 100)],
        ['Parcela Base', formatCurrency(resultado.consorcio.parcelaBase), formatCurrency(resultado.financiamento.parcelaMensal)],
        ['NPV', formatCurrency(resultado.consorcio.npv), formatCurrency(resultado.financiamento.npv)],
        ['Prob. Contemplação', formatPercent(resultado.consorcio.probContAteHoriz * 100), 'N/A']
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
      const recomendacao = `RECOMENDAÇÃO: ${resultado.comparativo.vencedor.toUpperCase()}`;
      const corRecomendacao = resultado.comparativo.vencedor === 'Consórcio' ? [0, 100, 0] : [0, 100, 200];
      doc.setTextColor(corRecomendacao[0], corRecomendacao[1], corRecomendacao[2]);
      doc.text(recomendacao, 15, currentY);
      
      currentY += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Vantagem financeira: ${formatCurrency(resultado.comparativo.vantagem)}`, 15, currentY);
      doc.text(`Economia percentual: ${resultado.comparativo.economiaPercent.toFixed(2)}%`, 15, currentY + 5);
      
      // Rodapé
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setFontSize(8);
      doc.text('VentusHub - Plataforma Inteligente de Crédito Imobiliário', pageWidth/2, pageHeight - 8, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth/2, pageHeight - 4, { align: 'center' });
      
      // Salvar
      const fileName = `Simulacao_Consorcio_vs_Financiamento_${new Date().toLocaleDateString('pt-BR').replace(/\\//g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Cabeçalho */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <Users className="inline-block mr-3 h-10 w-10 text-blue-600" />
              Simulador Consórcio × Financiamento
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Compare as vantagens financeiras entre consórcio imobiliário e financiamento bancário. 
              Análise com TIR, probabilidade de contemplação e fluxo de caixa detalhado.
            </p>
            
            {/* Indicadores do Mercado */}
            <IndicadoresMercado className="mt-6 max-w-4xl mx-auto" />
          </div>

          {/* Formulário */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calculator className="h-6 w-6 mr-2 text-blue-600" />
              Parâmetros da Simulação
            </h2>
            
            {/* Valores Principais */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Valores Principais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor da Carta de Crédito (R$)
                  </label>
                  <input
                    type="text"
                    value={formData.valorCarta}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\\D/g, '');
                      const formatted = new Intl.NumberFormat('pt-BR').format(value);
                      handleInputChange('valorCarta', formatted);
                    }}
                    placeholder="R$ 300.000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor do Financiamento (R$)
                  </label>
                  <input
                    type="text"
                    value={formData.valorFinanciamento}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\\D/g, '');
                      const formatted = new Intl.NumberFormat('pt-BR').format(value);
                      handleInputChange('valorFinanciamento', formatted);
                    }}
                    placeholder="R$ 300.000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Seção Consórcio */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                📋 Parâmetros do Consórcio
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lance Inicial (% da carta)
                  </label>
                  <input
                    type="number"
                    value={formData.lancePercent}
                    onChange={(e) => handleInputChange('lancePercent', e.target.value)}
                    step="0.1"
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo do Consórcio (meses)
                  </label>
                  <input
                    type="number"
                    value={formData.prazoConsorcioMeses}
                    onChange={(e) => handleInputChange('prazoConsorcioMeses', e.target.value)}
                    step="1"
                    min="60"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Toggles do Consórcio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Toggle Taxa Administrativa */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.toggleTaxaAdm}
                      onCheckedChange={(checked) => handleInputChange('toggleTaxaAdm', checked)}
                    />
                    <label className="text-sm font-medium text-gray-700">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="text-sm font-medium text-gray-700">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="text-sm font-medium text-gray-700">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Seção Financiamento */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                🏦 Parâmetros do Financiamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prazo do Financiamento (meses)
                  </label>
                  <input
                    type="number"
                    value={formData.prazoFinanciamentoMeses}
                    onChange={(e) => handleInputChange('prazoFinanciamentoMeses', e.target.value)}
                    step="1"
                    min="60"
                    max="420"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa de Juros (% a.a.)
                  </label>
                  <input
                    type="number"
                    value={formData.taxaJurosFinanciamentoAA}
                    onChange={(e) => handleInputChange('taxaJurosFinanciamentoAA', e.target.value)}
                    step="0.1"
                    min="4"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrada (% do valor)
                  </label>
                  <input
                    type="number"
                    value={formData.entradaPercent}
                    onChange={(e) => handleInputChange('entradaPercent', e.target.value)}
                    step="5"
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Toggle Seguro Financiamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.toggleSeguroFinanciamento}
                      onCheckedChange={(checked) => handleInputChange('toggleSeguroFinanciamento', checked)}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Personalizar Seguro (padrão: 0,25% a.a.)
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Parâmetros Gerais */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">⚙️ Parâmetros Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo de Oportunidade (% a.a.)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={formData.custoOportunidadeAA}
                      onChange={(e) => handleInputChange('custoOportunidadeAA', e.target.value)}
                      step="0.1"
                      min="3"
                      max="20"
                      placeholder={`${INDICADORES_MERCADO.custoOportunidade.toFixed(1)}% (CDI)`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('custoOportunidadeAA', INDICADORES_MERCADO.custoOportunidade.toString())}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium whitespace-nowrap"
                    >
                      Usar CDI
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horizonte de Análise (meses)
                  </label>
                  <input
                    type="number"
                    value={formData.horizonteAnaliseMeses}
                    onChange={(e) => handleInputChange('horizonteAnaliseMeses', e.target.value)}
                    step="12"
                    min="60"
                    max="360"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={calcularSimulacao}
                disabled={loading || !formData.valorCarta || !formData.valorFinanciamento}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Calculator className="h-5 w-5" />
                <span>{loading ? 'Calculando...' : 'Calcular Comparativo'}</span>
              </button>
            </div>
          </div>

          {/* Resultados */}
          <AnimatePresence>
            {resultado && (
              <Element name="results-section">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-lg shadow-lg p-8 mb-8"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
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
                    resultado.comparativo.vencedor === 'Consórcio' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-blue-100 border-l-4 border-blue-500'
                  }`}>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      📊 Recomendação: {resultado.comparativo.vencedor}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      <strong>Vantagem financeira:</strong> {formatCurrency(resultado.comparativo.vantagem)}
                    </p>
                    <p className="text-gray-700">
                      <strong>Economia:</strong> {resultado.comparativo.economiaPercent.toFixed(2)}% em valor presente
                    </p>
                  </div>

                  {/* Comparativo Detalhado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    
                    {/* Consórcio */}
                    <div className="bg-green-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        📋 Consórcio
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>TIR Anual:</span>
                          <span className="font-medium">{formatPercent(resultado.consorcio.tirAnual * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parcela Base:</span>
                          <span className="font-medium">{formatCurrency(resultado.consorcio.parcelaBase)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prob. Contemplação:</span>
                          <span className="font-medium">{formatPercent(resultado.consorcio.probContAteHoriz * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mês Contemplação:</span>
                          <span className="font-medium">{resultado.consorcio.mesContemplacao}º mês</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NPV:</span>
                          <span className={`font-medium ${resultado.consorcio.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(resultado.consorcio.npv)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financiamento */}
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        🏦 Financiamento
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>TIR Anual:</span>
                          <span className="font-medium">{formatPercent(resultado.financiamento.tirAnual * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parcela Mensal:</span>
                          <span className="font-medium">{formatCurrency(resultado.financiamento.parcelaMensal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Entrada:</span>
                          <span className="font-medium">{formatCurrency(resultado.financiamento.entrada)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor Financiado:</span>
                          <span className="font-medium">{formatCurrency(resultado.financiamento.valorFinanciado)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NPV:</span>
                          <span className={`font-medium ${resultado.financiamento.npv > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(resultado.financiamento.npv)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Probabilidade de Contemplação */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      📈 Evolução da Probabilidade de Contemplação
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      {resultado.consorcio.probabilidades.slice(0, 24).map((prob, index) => (
                        <div key={index} className="text-center">
                          <div className="text-gray-600">Mês {prob.mes}</div>
                          <div className="font-medium">{formatPercent(prob.probabilidade * 100)}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      *Modelo logístico: P(t) = σ(-3 + 0.12·lance% + 0.08·t)
                    </p>
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
      </div>
    </div>
  );
}
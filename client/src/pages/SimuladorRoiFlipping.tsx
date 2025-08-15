import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building, Home, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, FileText, AlertTriangle, Calendar, Settings, Hammer, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import IndicadoresMercado from '@/components/IndicadoresMercado';
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função para converter hex para RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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

import { INDICADORES_MERCADO } from '@/lib/indicadores-mercado';

// Indicadores específicos para Flip/Revenda (complementam os indicadores gerais)
const INDICADORES_FLIP = {
  custoObraM2: 1200,   // Custo médio obra por m² (R$)
  valorizacaoReforma: 1.8 // Multiplicador de valor pós-reforma
};

// Função para calcular TIR (Taxa Interna de Retorno) mensal
const calcularTIRMensal = (fluxosCaixa) => {
  const maxIteracoes = 100;
  const tolerancia = 0.0001;
  let taxa = 0.02; // Estimativa inicial de 2% ao mês
  
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

export default function SimuladorRoiFlipping() {
  const [formData, setFormData] = useState({
    precoAquisicao: '',
    custoObra: '',
    prazoObraMeses: '6',
    iptuAnual: '',
    toggleCondominio: false,
    condominioMensal: '',
    toggleItbiRegistro: false,
    itbiRegistroPercent: '5',
    corretagemPercent: '6',
    toggleIrGanho: false,
    irGanhoPercent: '15',
    precoRevenda: '',
    toggleDeltaPreco: false,
    deltaPrecoPercent: [-5, 0, 5],
    custoOportunidadeAM: '1.01'
  });

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);

  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-roi-flipping';

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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const handleInputChange = (field, value) => {
    if (field === 'precoAquisicao' || field === 'custoObra' || field === 'iptuAnual' || 
        field === 'condominioMensal' || field === 'precoRevenda') {
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
    
    setTimeout(() => {
      const precoAquisicao = parseFloat(formData.precoAquisicao.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const custoObra = parseFloat(formData.custoObra.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const prazoObraMeses = parseInt(formData.prazoObraMeses);
      const iptuAnual = parseFloat(formData.iptuAnual.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const condominioMensal = formData.toggleCondominio ? 
        parseFloat(formData.condominioMensal.replace(/[^\d,]/g, '').replace(',', '.')) || 0 : 0;
      const precoRevenda = parseFloat(formData.precoRevenda.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      
      // Custos fixos e percentuais
      const itbiRegistroPercent = formData.toggleItbiRegistro ? 
        parseFloat(formData.itbiRegistroPercent) / 100 : INDICADORES_MERCADO.itbiRegistro / 100;
      const corretagemPercent = parseFloat(formData.corretagemPercent) / 100;
      const irGanhoPercent = formData.toggleIrGanho ? 
        parseFloat(formData.irGanhoPercent) / 100 : INDICADORES_MERCADO.irGanhoCapital / 100;
      const custoOportunidadeAM = parseFloat(formData.custoOportunidadeAM) / 100;
      
      // Cálculo dos custos
      const itbiRegistro = precoAquisicao * itbiRegistroPercent;
      const iptuMensal = iptuAnual / 12;
      const custoObraMensal = custoObra / prazoObraMeses;
      const custosHolding = (iptuMensal + condominioMensal) * prazoObraMeses;
      
      // Receita líquida de venda
      const corretagem = precoRevenda * corretagemPercent;
      const receitaLiquidaVenda = precoRevenda - corretagem;
      
      // Base para cálculo do IR
      const baseIR = receitaLiquidaVenda - precoAquisicao - itbiRegistro - custoObra;
      const impostoGanhoCapital = Math.max(0, baseIR * irGanhoPercent);
      
      // Investimento total
      const investimentoTotal = precoAquisicao + itbiRegistro + custoObra + custosHolding;
      
      // Lucro líquido
      const lucroLiquido = receitaLiquidaVenda - impostoGanhoCapital - investimentoTotal;
      
      // ROI simples e anualizado
      const roiSimples = lucroLiquido / investimentoTotal;
      const roiAnualizado = Math.pow(1 + roiSimples, 12 / prazoObraMeses) - 1;
      
      // Fluxo de caixa mensal
      const fluxoCaixa = [];
      
      // Mês 0: Aquisição + ITBI
      fluxoCaixa.push(-(precoAquisicao + itbiRegistro));
      
      // Meses 1 até prazo: Obra + Holding
      for (let mes = 1; mes <= prazoObraMeses; mes++) {
        const custoMes = custoObraMensal + iptuMensal + condominioMensal;
        if (mes === prazoObraMeses) {
          // Último mês: adicionar receita da venda
          fluxoCaixa.push(-custoMes + receitaLiquidaVenda - impostoGanhoCapital);
        } else {
          fluxoCaixa.push(-custoMes);
        }
      }
      
      // TIR mensal e anual
      const tirMensal = calcularTIRMensal(fluxoCaixa);
      const tirAnual = Math.pow(1 + tirMensal, 12) - 1;
      
      // Payback (meses para recuperar investimento)
      let paybackMeses = null;
      let acumulado = 0;
      for (let i = 0; i < fluxoCaixa.length; i++) {
        acumulado += fluxoCaixa[i];
        if (acumulado > 0 && paybackMeses === null) {
          paybackMeses = i;
          break;
        }
      }
      
      // Análise de sensibilidade no preço de revenda
      const deltaPrecos = formData.toggleDeltaPreco ? 
        formData.deltaPrecoPercent : [-5, 0, 5];
      
      const sensibilidade = deltaPrecos.map(delta => {
        const precoRevendaAjustado = precoRevenda * (1 + delta / 100);
        const corretagemAjustada = precoRevendaAjustado * corretagemPercent;
        const receitaLiquidaAjustada = precoRevendaAjustado - corretagemAjustada;
        const baseIRAjustada = receitaLiquidaAjustada - precoAquisicao - itbiRegistro - custoObra;
        const impostoAjustado = Math.max(0, baseIRAjustada * irGanhoPercent);
        const lucroAjustado = receitaLiquidaAjustada - impostoAjustado - investimentoTotal;
        const roiAjustado = lucroAjustado / investimentoTotal;
        const roiAnualizadoAjustado = Math.pow(1 + roiAjustado, 12 / prazoObraMeses) - 1;
        
        // Fluxo de caixa ajustado para TIR
        const fluxoAjustado = [...fluxoCaixa];
        fluxoAjustado[fluxoAjustado.length - 1] = -custoObraMensal - iptuMensal - condominioMensal + 
          receitaLiquidaAjustada - impostoAjustado;
        const tirMensalAjustada = calcularTIRMensal(fluxoAjustado);
        const tirAnualAjustada = Math.pow(1 + tirMensalAjustada, 12) - 1;
        
        return {
          deltaPreco: delta,
          roi: roiAjustado,
          roiAnualizado: roiAnualizadoAjustado,
          irr: tirAnualAjustada,
          precoRevenda: precoRevendaAjustado,
          lucroLiquido: lucroAjustado
        };
      });
      
      setResultado({
        // Cenário base
        roi: roiSimples,
        roiAnualizado: roiAnualizado,
        tirMensal: tirMensal,
        tirAnual: tirAnual,
        paybackMeses: paybackMeses,
        
        // Fluxo de caixa
        fluxoCaixa: fluxoCaixa,
        
        // Sensibilidade
        sensibilidade: sensibilidade,
        
        // Detalhes financeiros
        detalhes: {
          investimentoTotal,
          lucroLiquido,
          precoAquisicao,
          custoObra,
          custosHolding,
          itbiRegistro,
          corretagem,
          impostoGanhoCapital,
          receitaLiquidaVenda,
          baseIR
        }
      });
      
      setLoading(false);
      
      // Scroll para resultados
      setTimeout(() => {
        scroller.scrollTo('results-section', {
          duration: 800,
          delay: 0,
          smooth: 'easeInOutQuart'
        });
      }, 100);
    }, 1000);
  };

  const gerarPDFComparativo = async () => {
    try {
      const doc = new jsPDF('portrait');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      const corVentusHub = '#001f3f';
      const rgbVentusHub = hexToRgb(corVentusHub);
      
      // Carregar logo VentusHub
      let logoVentusHub = null;
      try {
        logoVentusHub = await imageToBase64('/src/assets/logo.png');
      } catch (error) {
        console.warn('Erro ao carregar logo VentusHub:', error);
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
      doc.text('SIMULADOR ROI FLIP/REVENDA', 50, 16);
      
      let currentY = 40;
      
      // Parâmetros da simulação
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Parâmetros do Projeto', 15, currentY);
      
      currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const precoAquisicao = parseFloat(formData.precoAquisicao.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const custoObra = parseFloat(formData.custoObra.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const precoRevenda = parseFloat(formData.precoRevenda.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      
      doc.text(`Preço de aquisição: ${formatCurrency(precoAquisicao)}`, 15, currentY);
      doc.text(`Custo da obra: ${formatCurrency(custoObra)}`, 15, currentY + 5);
      doc.text(`Prazo da obra: ${formData.prazoObraMeses} meses`, 15, currentY + 10);
      doc.text(`Preço de revenda: ${formatCurrency(precoRevenda)}`, 15, currentY + 15);
      doc.text(`Corretagem: ${formData.corretagemPercent}%`, 15, currentY + 20);
      
      currentY += 35;
      
      // Resultados
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados da Análise', 15, currentY);
      
      currentY += 15;
      
      // Tabela de resultados
      const dadosTabela = [
        ['ROI Simples', formatPercent(resultado.roi * 100)],
        ['ROI Anualizado', formatPercent(resultado.roiAnualizado * 100)],
        ['TIR Anual', formatPercent(resultado.tirAnual * 100)],
        ['Payback', resultado.paybackMeses ? `${resultado.paybackMeses} meses` : 'N/A'],
        ['Lucro Líquido', formatCurrency(resultado.detalhes.lucroLiquido)],
        ['Investimento Total', formatCurrency(resultado.detalhes.investimentoTotal)]
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['Métrica', 'Valor']],
        body: dadosTabela,
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
      
      // Análise de viabilidade
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const viabilidade = resultado.roi > 0.2 ? 'PROJETO VIÁVEL' : 
                         resultado.roi > 0.1 ? 'PROJETO MODERADO' : 'PROJETO ARRISCADO';
      const cor = resultado.roi > 0.2 ? [0, 100, 0] : 
                  resultado.roi > 0.1 ? [255, 140, 0] : [255, 0, 0];
      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.text(`Análise: ${viabilidade}`, 15, currentY);
      
      currentY += 15;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Esta análise é baseada nos parâmetros informados e serve como orientação.', 15, currentY);
      doc.text('Consulte especialistas para validação detalhada do projeto.', 15, currentY + 5);
      
      // Rodapé
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('VentusHub - Plataforma Inteligente de Crédito Imobiliário', pageWidth/2, pageHeight - 8, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth/2, pageHeight - 4, { align: 'center' });
      
      // Salvar
      const fileName = `Simulacao_Flip_Revenda_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    }
  };

  return (
    <div className="simulador-container p-6 space-y-6 bg-background min-h-screen">
      <div className="space-y-6">
        {/* Header */}

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
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calculator className="h-6 w-6 mr-2 text-blue-600" />
              Parâmetros do Projeto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Preço de Aquisição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building className="h-4 w-4 inline mr-1" />
                  Preço de Aquisição *
                </label>
                <input
                  type="text"
                  value={formData.precoAquisicao}
                  onChange={(e) => handleInputChange('precoAquisicao', e.target.value)}
                  placeholder="R$ 480.000,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  required
                />
              </div>
              
              {/* Custo da Obra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Hammer className="h-4 w-4 inline mr-1" />
                  Custo da Obra *
                </label>
                <input
                  type="text"
                  value={formData.custoObra}
                  onChange={(e) => handleInputChange('custoObra', e.target.value)}
                  placeholder="R$ 120.000,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  required
                />
              </div>
              
              {/* Prazo da Obra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Prazo da Obra (meses) *
                </label>
                <select
                  value={formData.prazoObraMeses}
                  onChange={(e) => handleInputChange('prazoObraMeses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  required
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} {i+1 === 1 ? 'mês' : 'meses'}</option>
                  ))}
                </select>
              </div>
              
              {/* Preço de Revenda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Target className="h-4 w-4 inline mr-1" />
                  Preço de Revenda *
                </label>
                <input
                  type="text"
                  value={formData.precoRevenda}
                  onChange={(e) => handleInputChange('precoRevenda', e.target.value)}
                  placeholder="R$ 760.000,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  required
                />
              </div>
              
              {/* IPTU Anual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  IPTU Anual
                  <span className="text-xs text-gray-500 ml-1">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.iptuAnual}
                  onChange={(e) => handleInputChange('iptuAnual', e.target.value)}
                  placeholder="R$ 3.600,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
              
              {/* Corretagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Corretagem (%)
                </label>
                <input
                  type="number"
                  value={formData.corretagemPercent}
                  onChange={(e) => handleInputChange('corretagemPercent', e.target.value)}
                  step="0.5"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                />
              </div>
              
            </div>
            
            {/* Toggles e Configurações Avançadas */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configurações Avançadas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Toggle Condomínio */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.toggleCondominio}
                      onCheckedChange={(checked) => handleInputChange('toggleCondominio', checked)}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Há condomínio/taxas mensais
                    </label>
                  </div>
                  {formData.toggleCondominio && (
                    <input
                      type="text"
                      value={formData.condominioMensal}
                      onChange={(e) => handleInputChange('condominioMensal', e.target.value)}
                      placeholder="R$ 450,00"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  )}
                </div>
                
                {/* Toggle ITBI/Registro */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.toggleItbiRegistro}
                      onCheckedChange={(checked) => handleInputChange('toggleItbiRegistro', checked)}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Personalizar ITBI + Registro (padrão: 5%)
                    </label>
                  </div>
                  {formData.toggleItbiRegistro && (
                    <input
                      type="number"
                      value={formData.itbiRegistroPercent}
                      onChange={(e) => handleInputChange('itbiRegistroPercent', e.target.value)}
                      step="0.1"
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  )}
                </div>
                
                {/* Toggle IR Ganho */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={formData.toggleIrGanho}
                      onCheckedChange={(checked) => handleInputChange('toggleIrGanho', checked)}
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Personalizar IR Ganho Capital (padrão: 15%)
                    </label>
                  </div>
                  {formData.toggleIrGanho && (
                    <input
                      type="number"
                      value={formData.irGanhoPercent}
                      onChange={(e) => handleInputChange('irGanhoPercent', e.target.value)}
                      step="0.1"
                      min="0"
                      max="25"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  )}
                </div>
                
                {/* Custo de Oportunidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custo de Oportunidade (% a.m. líquido)
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={formData.custoOportunidadeAM}
                        onChange={(e) => handleInputChange('custoOportunidadeAM', e.target.value)}
                        step="0.01"
                        min="0"
                        max="5"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 1.01"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('custoOportunidadeAM', INDICADORES_MERCADO.cdiMensalLiquido.toFixed(2))}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium whitespace-nowrap"
                        title="Usar CDI atual líquido (com desconto IR)"
                      >
                        Quero CDI atual
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 Informe o rendimento que você conseguiria em uma aplicação segura (ex.: CDB 100% CDI). 
                      Se deixar em branco, usaremos CDI líquido automático.
                    </p>
                  </div>
                </div>
                
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={calcularSimulacao}
                disabled={loading || !formData.precoAquisicao || !formData.custoObra || !formData.precoRevenda}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Calculator className="h-5 w-5" />
                <span>{loading ? 'Calculando...' : 'Calcular ROI'}</span>
              </button>
            </div>
            </motion.div>

            {/* Resultados */}
            <AnimatePresence>
              {resultado && (
                <Element name="results-section">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6 w-full"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                      <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
                      Resultados da Análise
                    </h2>
                    <button
                      onClick={gerarPDFComparativo}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Gerar PDF</span>
                    </button>
                  </div>

                  {/* Resumo Principal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    
                    <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">ROI Simples</h3>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatPercent(resultado.roi * 100)}</p>
                      <p className="text-xs text-blue-700">Retorno sobre investimento</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">ROI Anualizado</h3>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatPercent(resultado.roiAnualizado * 100)}</p>
                      <p className="text-xs text-green-700">Equivalente anual</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
                      <h3 className="text-lg font-semibold text-purple-900 mb-2">TIR Anual</h3>
                      <p className="text-2xl font-bold text-purple-900">{formatPercent(resultado.tirAnual * 100)}</p>
                      <p className="text-xs text-purple-700">Taxa interna retorno</p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">Payback</h3>
                      <p className="text-2xl font-bold text-orange-900">
                        {resultado.paybackMeses ? `${resultado.paybackMeses}m` : 'N/A'}
                      </p>
                      <p className="text-xs text-orange-700">Tempo para retorno</p>
                    </div>
                  </div>

                  {/* Detalhes Financeiros */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Investimentos</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Aquisição:</span>
                          <span className="font-medium">{formatCurrency(resultado.detalhes.precoAquisicao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Obra:</span>
                          <span className="font-medium">{formatCurrency(resultado.detalhes.custoObra)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ITBI + Registro:</span>
                          <span className="font-medium">{formatCurrency(resultado.detalhes.itbiRegistro)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custos Holding:</span>
                          <span className="font-medium">{formatCurrency(resultado.detalhes.custosHolding)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Total Investido:</span>
                          <span>{formatCurrency(resultado.detalhes.investimentoTotal)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Retornos</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Receita Bruta:</span>
                          <span className="font-medium">{formatCurrency(resultado.detalhes.receitaLiquidaVenda + resultado.detalhes.corretagem)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Corretagem:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(resultado.detalhes.corretagem)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IR Ganho Capital:</span>
                          <span className="font-medium text-red-600">-{formatCurrency(resultado.detalhes.impostoGanhoCapital)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Receita Líquida:</span>
                          <span className="font-medium">{formatCurrency(resultado.detalhes.receitaLiquidaVenda - resultado.detalhes.impostoGanhoCapital)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold">
                          <span>Lucro Líquido:</span>
                          <span className={resultado.detalhes.lucroLiquido > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(resultado.detalhes.lucroLiquido)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Análise de Sensibilidade */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                      Análise de Sensibilidade - Preço de Revenda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {resultado.sensibilidade.map((cenario, index) => (
                        <div 
                          key={index} 
                          className={`p-4 rounded-lg border-2 ${
                            cenario.deltaPreco === 0 ? 'border-blue-500 bg-blue-50' : 
                            cenario.deltaPreco < 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                          }`}
                        >
                          <h4 className="font-semibold mb-2">
                            {cenario.deltaPreco === 0 ? 'Cenário Base' : 
                             cenario.deltaPreco < 0 ? `Pessimista (${cenario.deltaPreco}%)` : 
                             `Otimista (+${cenario.deltaPreco}%)`}
                          </h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Preço Venda:</span>
                              <span className="font-medium">{formatCurrency(cenario.precoRevenda)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ROI:</span>
                              <span className={`font-medium ${cenario.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(cenario.roi * 100)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>TIR Anual:</span>
                              <span className={`font-medium ${cenario.irr > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercent(cenario.irr * 100)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Lucro:</span>
                              <span className={`font-medium ${cenario.lucroLiquido > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(cenario.lucroLiquido)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recomendação */}
                  <div className={`rounded-lg p-6 ${
                    resultado.roi > 0.2 ? 'bg-green-100 border-l-4 border-green-500' : 
                    resultado.roi > 0.1 ? 'bg-yellow-100 border-l-4 border-yellow-500' : 
                    'bg-red-100 border-l-4 border-red-500'
                  }`}>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      {resultado.roi > 0.2 ? (
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      ) : resultado.roi > 0.1 ? (
                        <TrendingUp className="h-5 w-5 mr-2 text-yellow-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                      )}
                      Análise de Viabilidade
                    </h3>
                    <p className="text-lg">
                      <strong>
                        {resultado.roi > 0.2 ? 'PROJETO ALTAMENTE VIÁVEL' : 
                         resultado.roi > 0.1 ? 'PROJETO MODERADAMENTE VIÁVEL' : 
                         resultado.roi > 0 ? 'PROJETO DE BAIXA RENTABILIDADE' : 'PROJETO INVIÁVEL'}
                      </strong>
                    </p>
                    <p className="text-sm mt-2">
                      {resultado.roi > 0.2 ? 'ROI superior a 20% indica excelente oportunidade de investimento.' : 
                       resultado.roi > 0.1 ? 'ROI entre 10-20% sugere projeto viável com retorno moderado.' : 
                       resultado.roi > 0 ? 'ROI baixo. Considere renegociar condições ou buscar outras oportunidades.' : 
                       'Projeto apresenta prejuízo. Revise parâmetros ou abandone o investimento.'}
                    </p>
                  </div>

                  {/* Observações */}
                  <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          <strong>Importante:</strong> Esta análise é baseada nos parâmetros informados e serve como orientação. 
                          Considere fatores adicionais como: condições do mercado, localização, qualidade da reforma, 
                          tempo de venda, custos imprevistos e cenário econômico. Consulte especialistas para validação detalhada.
                        </p>
                      </div>
                    </div>
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
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-400 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-400 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Indicadores de Mercado
                  </h3>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">Custo Obra/m²:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">R$ {INDICADORES_FLIP.custoObraM2}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">Valorização:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">{(INDICADORES_FLIP.valorizacaoReforma * 100 - 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-800 dark:text-orange-300">CDI:</span>
                      <span className="font-medium text-orange-900 dark:text-orange-200">{INDICADORES_MERCADO.cdi}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-2">
                    *Valores de mercado para análise comparativa
                  </p>
                </div>
              </motion.div>

              {/* Análise de Viabilidade */}
              <motion.div
                className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg shadow-sm p-6 border border-orange-200 dark:border-orange-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Critérios de Análise
                </h3>

                <div className="space-y-4">
                  {/* ROI Simples */}
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border border-green-300 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <h4 className="font-semibold text-green-900 dark:text-green-300">
                        ROI Excelente
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                      <div className="flex justify-between">
                        <span>Meta:</span>
                        <span className="font-medium">&gt; 20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium">Projeto Viável</span>
                      </div>
                    </div>
                  </div>

                  {/* ROI Moderado */}
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-4 border border-yellow-300 dark:border-yellow-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">
                        ROI Moderado
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-yellow-700 dark:text-yellow-300">
                      <div className="flex justify-between">
                        <span>Faixa:</span>
                        <span className="font-medium">10% - 20%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium">Avaliar Cenário</span>
                      </div>
                    </div>
                  </div>

                  {/* ROI Baixo */}
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4 border border-red-300 dark:border-red-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <h4 className="font-semibold text-red-900 dark:text-red-300">
                        ROI Baixo
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-red-700 dark:text-red-300">
                      <div className="flex justify-between">
                        <span>Faixa:</span>
                        <span className="font-medium">&lt; 10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium">Alto Risco</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dicas de Otimização */}
              <motion.div
                className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg shadow-sm p-4 border border-orange-200 dark:border-orange-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">
                      Dicas de Otimização
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                      <div className="space-y-3 text-xs text-orange-700 dark:text-orange-300 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span><strong>Prazo:</strong> Projetos até 6 meses têm melhor TIR</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                          <span><strong>Custos:</strong> Controle rigoroso da obra</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span><strong>Venda:</strong> Preço competitivo acelera liquidez</span>
                        </div>
                      </div>
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
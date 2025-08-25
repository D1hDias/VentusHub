import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building, Home, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, FileText, AlertTriangle, Calendar } from "lucide-react";
import { INDICADORES_MERCADO as INDICADORES_CENTRAIS } from '@/lib/indicadores-mercado';
import IndicadoresMercado from '@/components/IndicadoresMercado';
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função para converter hex para RGB
const hexToRgb = (hex: any) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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

// Função para calcular parcela Price
const calcularParcelaPrice = (valorFinanciado: any, taxaJurosAnual: any, prazoMeses: any) => {
  const taxaMensal = taxaJurosAnual / 100 / 12;
  const fatorPagamento = Math.pow(1 + taxaMensal, prazoMeses);
  return valorFinanciado * (taxaMensal * fatorPagamento) / (fatorPagamento - 1);
};

// Função para calcular parcela SAC
const calcularParcelaSAC = (valorFinanciado: any, taxaJurosAnual: any, prazoMeses: any) => {
  const taxaMensal = taxaJurosAnual / 100 / 12;
  const amortizacaoMensal = valorFinanciado / prazoMeses;
  
  const parcelas = [];
  let saldoDevedor = valorFinanciado;
  
  for (let i = 0; i < prazoMeses; i++) {
    const juros = saldoDevedor * taxaMensal;
    const prestacao = amortizacaoMensal + juros;
    
    parcelas.push({
      mes: i + 1,
      prestacao: prestacao,
      juros: juros,
      amortizacao: amortizacaoMensal,
      saldoDevedor: saldoDevedor - amortizacaoMensal
    });
    
    saldoDevedor -= amortizacaoMensal;
  }
  
  return parcelas;
};

// Mapeamento dos indicadores centralizados para compatibilidade
const INDICADORES_MERCADO = {
  selic: INDICADORES_CENTRAIS.selic,
  cdi: INDICADORES_CENTRAIS.cdi,
  igpM: INDICADORES_CENTRAIS.igpM,
  valorizacaoImovel: INDICADORES_CENTRAIS.valorizacaoImovel,
  custosCompra: INDICADORES_CENTRAIS.custosCompra,
  manutencaoAnual: INDICADORES_CENTRAIS.manutencaoAnual,
  inflacaoAluguel: INDICADORES_CENTRAIS.igpM, // IGP-M é usado para correção de aluguéis
  get custoOportunidade() {
    return INDICADORES_CENTRAIS.custoOportunidade;
  }
};

// Função para calcular TIR (Taxa Interna de Retorno)
const calcularTIR = (fluxosCaixa: any) => {
  const maxIteracoes = 100;
  const tolerancia = 0.0001;
  let taxa = 0.1; // Estimativa inicial de 10%
  
  for (let i = 0; i < maxIteracoes; i++) {
    let vpl = 0;
    let vplDerivada = 0;
    
    for (let j = 0; j < fluxosCaixa.length; j++) {
      const fator = Math.pow(1 + taxa, j);
      vpl += fluxosCaixa[j] / fator;
      vplDerivada -= j * fluxosCaixa[j] / Math.pow(1 + taxa, j + 1);
    }
    
    if (Math.abs(vpl) < tolerancia) {
      return taxa * 100; // Retorna em percentual
    }
    
    if (vplDerivada !== 0) {
      taxa = taxa - vpl / vplDerivada;
    }
  }
  
  return 0; // Retorna 0 se não conseguir calcular
};

export default function SimuladorAluguelXCompra() {
  const [formData, setFormData] = useState({
    precoCompra: '',
    aluguelMensal: '',
    anosPermanencia: '10',
    entradaPercentual: '20',
    prazoMeses: '360',
    taxaJurosFinanciamentoAA: '11.0',
    iptuAnual: '', // Agora em valor monetário
    condominioMensal: '',
    modeloFinanciamento: 'price'
  });

  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-aluguel-compra';

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

  const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercent = (value: any) => {
    return `${value.toFixed(2)}%`;
  };

  const handleInputChange = (field: any, value: any) => {
    if (field === 'precoCompra' || field === 'aluguelMensal' || field === 'iptuAnual' || field === 'condominioMensal') {
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
      const precoCompra = parseFloat(formData.precoCompra.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const aluguelMensal = parseFloat(formData.aluguelMensal.replace(/[^\d,]/g, '').replace(',', '.')) || (precoCompra * 0.004);
      const anosPermanencia = parseInt(formData.anosPermanencia);
      const entradaPercentual = parseFloat(formData.entradaPercentual) / 100;
      const prazoMeses = parseInt(formData.prazoMeses);
      const taxaJurosFinanciamentoAA = parseFloat(formData.taxaJurosFinanciamentoAA);
      const iptuAnual = parseFloat(formData.iptuAnual.replace(/[^\d,]/g, '').replace(',', '.')) || (precoCompra * 0.008); // Default 0.8% se não informado
      const condominioMensal = parseFloat(formData.condominioMensal.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      
      // Usar indicadores automáticos do mercado
      const custoOportunidadeAA = INDICADORES_MERCADO.custoOportunidade / 100;
      const manutencaoPercentualAA = INDICADORES_MERCADO.manutencaoAnual / 100;
      const custosCompraPercent = INDICADORES_MERCADO.custosCompra / 100;
      const valorizacaoImovelAA = INDICADORES_MERCADO.valorizacaoImovel / 100;
      const inflacaoAluguelAA = INDICADORES_MERCADO.igpM / 100;

      // Cálculos para COMPRAR
      const valorEntrada = precoCompra * entradaPercentual;
      const custosCompra = precoCompra * custosCompraPercent;
      const desembolsoInicial = valorEntrada + custosCompra;
      const valorFinanciado = precoCompra - valorEntrada;
      
      let parcelaMensal;
      if (formData.modeloFinanciamento === 'price') {
        parcelaMensal = calcularParcelaPrice(valorFinanciado, taxaJurosFinanciamentoAA, prazoMeses);
      } else {
        const parcelasSAC = calcularParcelaSAC(valorFinanciado, taxaJurosFinanciamentoAA, prazoMeses);
        parcelaMensal = parcelasSAC[0].prestacao; // Primeira parcela
      }
      
      const iptuMensal = iptuAnual / 12;
      const manutencaoMensal = (precoCompra * manutencaoPercentualAA) / 12;
      const custosFixosMensais = parcelaMensal + iptuMensal + condominioMensal + manutencaoMensal;
      
      // Valor residual do imóvel
      const valorResidual = precoCompra * Math.pow(1 + valorizacaoImovelAA, anosPermanencia);
      const corretagem = valorResidual * 0.06; // 6% de corretagem na venda
      const valorResidualLiquido = valorResidual - corretagem;
      
      // Saldo devedor final
      const mesesPermanencia = anosPermanencia * 12;
      const taxaMensal = taxaJurosFinanciamentoAA / 100 / 12;
      let saldoDevedor = valorFinanciado;
      
      for (let i = 0; i < Math.min(mesesPermanencia, prazoMeses); i++) {
        const juros = saldoDevedor * taxaMensal;
        const amortizacao = parcelaMensal - juros;
        saldoDevedor -= amortizacao;
      }
      
      const patrimonioLiquidoComprar = valorResidualLiquido - Math.max(0, saldoDevedor);

      // Cálculos para ALUGAR
      const custoOportunidadeMensal = custoOportunidadeAA / 12;
      const inflacaoAluguelMensal = inflacaoAluguelAA / 12;
      
      let patrimonioInvestido = desembolsoInicial; // Investe a entrada que não gastou
      let aluguelAtual = aluguelMensal;
      
      for (let mes = 0; mes < mesesPermanencia; mes++) {
        // Diferença entre o que pagaria de financiamento e o aluguel atual
        const diferencaMensal = custosFixosMensais - aluguelAtual;
        
        // Se sobra dinheiro, investe
        if (diferencaMensal > 0) {
          patrimonioInvestido += diferencaMensal;
        }
        
        // Rendimento do patrimônio investido
        patrimonioInvestido *= (1 + custoOportunidadeMensal);
        
        // Reajuste do aluguel
        aluguelAtual *= (1 + inflacaoAluguelMensal);
      }
      
      const patrimonioLiquidoAlugar = patrimonioInvestido;

      // Cálculo da TIR
      const fluxoComprar = [-desembolsoInicial];
      for (let i = 0; i < mesesPermanencia; i++) {
        fluxoComprar.push(-custosFixosMensais);
      }
      fluxoComprar[fluxoComprar.length - 1] += patrimonioLiquidoComprar;
      
      const fluxoAlugar = [-desembolsoInicial];
      for (let i = 0; i < mesesPermanencia; i++) {
        fluxoAlugar.push(-aluguelMensal * Math.pow(1 + inflacaoAluguelMensal, i));
      }
      fluxoAlugar[fluxoAlugar.length - 1] += patrimonioLiquidoAlugar;
      
      const tirComprar = calcularTIR(fluxoComprar);
      const tirAlugar = calcularTIR(fluxoAlugar);

      // Série temporal para gráfico
      const serieTemporalAnos = [];
      const seriePatrimonioComprar = [];
      const seriePatrimonioAlugar = [];
      
      for (let ano = 1; ano <= anosPermanencia; ano++) {
        serieTemporalAnos.push(ano);
        
        // Patrimônio comprar no ano
        const valorImovelAno = precoCompra * Math.pow(1 + valorizacaoImovelAA, ano);
        const mesesAno = ano * 12;
        let saldoAno = valorFinanciado;
        
        for (let i = 0; i < Math.min(mesesAno, prazoMeses); i++) {
          const juros = saldoAno * taxaMensal;
          const amortizacao = parcelaMensal - juros;
          saldoAno -= amortizacao;
        }
        
        const patrimonioComprarAno = valorImovelAno - Math.max(0, saldoAno);
        seriePatrimonioComprar.push(patrimonioComprarAno);
        
        // Patrimônio alugar no ano
        let patrimonioAlugarAno = desembolsoInicial;
        let aluguelAnoAtual = aluguelMensal;
        
        for (let mes = 0; mes < mesesAno; mes++) {
          const diferencaMensal = custosFixosMensais - aluguelAnoAtual;
          if (diferencaMensal > 0) {
            patrimonioAlugarAno += diferencaMensal;
          }
          patrimonioAlugarAno *= (1 + custoOportunidadeMensal);
          aluguelAnoAtual *= (1 + inflacaoAluguelMensal);
        }
        
        seriePatrimonioAlugar.push(patrimonioAlugarAno);
      }

      // Determinar break-even
      let breakEvenAno = null;
      for (let i = 0; i < seriePatrimonioComprar.length; i++) {
        if (seriePatrimonioComprar[i] > seriePatrimonioAlugar[i]) {
          breakEvenAno = i + 1;
          break;
        }
      }

      // Calcular payback (quando o patrimônio de comprar supera o investimento inicial)
      let paybackAnos = null;
      for (let i = 0; i < seriePatrimonioComprar.length; i++) {
        if (seriePatrimonioComprar[i] > desembolsoInicial) {
          paybackAnos = i + 1;
          break;
        }
      }

      setResultado({
        patrimonioLiquidoComprar,
        patrimonioLiquidoAlugar,
        tirComprar,
        tirAlugar,
        paybackAnos,
        breakEvenAno,
        serieTemporalAnos,
        seriePatrimonioComprar,
        seriePatrimonioAlugar,
        detalhesComprar: {
          desembolsoInicial,
          parcelaMensal,
          iptuMensal,
          condominioMensal,
          manutencaoMensal,
          custosFixosMensais,
          valorResidual,
          valorResidualLiquido,
          saldoDevedor: Math.max(0, saldoDevedor)
        },
        detalhesAlugar: {
          aluguelInicial: aluguelMensal,
          aluguelFinal: aluguelMensal * Math.pow(1 + inflacaoAluguelAA, anosPermanencia),
          patrimonioInvestido,
          rendimentoAcumulado: patrimonioInvestido - desembolsoInicial
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
      } catch (error: any) {
        console.warn('Erro ao carregar logo VentusHub:', error);
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
      doc.text('SIMULADOR ALUGAR × COMPRAR', 50, 16);
      
      let currentY = 40;
      
      // Parâmetros da simulação
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Parâmetros da Simulação', 15, currentY);
      
      currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const precoCompra = parseFloat(formData.precoCompra.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const aluguelMensal = parseFloat(formData.aluguelMensal.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      
      doc.text(`Preço de compra: ${formatCurrency(precoCompra)}`, 15, currentY);
      doc.text(`Aluguel mensal: ${formatCurrency(aluguelMensal)}`, 15, currentY + 5);
      doc.text(`Período de permanência: ${formData.anosPermanencia} anos`, 15, currentY + 10);
      doc.text(`Entrada: ${formData.entradaPercentual}%`, 15, currentY + 15);
      doc.text(`Financiamento: ${formData.modeloFinanciamento.toUpperCase()}`, 15, currentY + 20);
      
      currentY += 35;
      
      // Indicadores automáticos do mercado
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicadores Automáticos do Mercado:', 15, currentY);
      
      currentY += 8;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`• CDI (custo oportunidade): ${INDICADORES_MERCADO.custoOportunidade}%`, 15, currentY);
      doc.text(`• Valorização imobiliária: ${INDICADORES_MERCADO.valorizacaoImovel}% a.a.`, 15, currentY + 4);
      doc.text(`• Correção aluguéis (IGP-M): ${INDICADORES_MERCADO.igpM}% a.a.`, 15, currentY + 8);
      doc.text(`• Custos de compra: ${INDICADORES_MERCADO.custosCompra}% (ITBI+escritura+corretagem)`, 15, currentY + 12);
      doc.text(`• Manutenção: ${INDICADORES_MERCADO.manutencaoAnual}% a.a.`, 15, currentY + 16);
      
      currentY += 30;
      
      // Resultados
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados da Comparação', 15, currentY);
      
      currentY += 15;
      
      // Tabela de resultados
      const dadosTabela = [
        ['Patrimônio Líquido Final', formatCurrency((resultado as any).patrimonioLiquidoComprar), formatCurrency((resultado as any).patrimonioLiquidoAlugar)],
        ['Taxa Interna de Retorno (TIR)', formatPercent((resultado as any).tirComprar), formatPercent((resultado as any).tirAlugar)],
        ['Payback (anos)', (resultado as any).paybackAnos || 'N/A', 'N/A'],
        ['Break-even (ano)', (resultado as any).breakEvenAno || 'N/A', (resultado as any).breakEvenAno || 'N/A']
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['Métrica', 'Comprar', 'Alugar']],
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
      
      // Recomendação
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const melhorOpcao = (resultado as any).patrimonioLiquidoComprar > (resultado as any).patrimonioLiquidoAlugar ? 'COMPRAR' : 'ALUGAR';
      doc.setTextColor(melhorOpcao === 'COMPRAR' ? 0 : 255, melhorOpcao === 'COMPRAR' ? 100 : 0, 0);
      doc.text(`Recomendação: ${melhorOpcao}`, 15, currentY);
      
      currentY += 15;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Esta simulação é baseada nos parâmetros informados e serve apenas como orientação.', 15, currentY);
      doc.text('Consulte um especialista para análise detalhada do seu caso específico.', 15, currentY + 5);
      
      // Rodapé
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('VentusHub - Plataforma Inteligente de Crédito Imobiliário', pageWidth/2, pageHeight - 8, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth/2, pageHeight - 4, { align: 'center' });
      
      // Salvar
      const fileName = `Simulacao_Alugar_vs_Comprar_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
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
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-6 flex items-center">
              <Calculator className="h-6 w-6 mr-2 text-blue-600" />
              Parâmetros da Simulação
            </h2>
            
            {/* Valor Comum */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-4">💰 Tempo de Permanência</h3>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Tempo de Permanência *
                </label>
                <select
                  value={formData.anosPermanencia}
                  onChange={(e) => handleInputChange('anosPermanencia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  required
                >
                  {[...Array(30)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} {i+1 === 1 ? 'ano' : 'anos'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Layout em duas colunas: Comprar e Alugar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* === COLUNA ESQUERDA: COMPRAR === */}
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-6 flex items-center">
                  <Building className="h-6 w-6 mr-2" />
                  🏠 Comprar Imóvel
                </h3>
                
                {/* Preço de Compra */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Preço de Compra (R$) *
                  </label>
                  <input
                    type="text"
                    value={formData.precoCompra}
                    onChange={(e) => handleInputChange('precoCompra', e.target.value)}
                    placeholder="R$ 500.000,00"
                    className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    required
                  />
                </div>

                {/* Parâmetros de Financiamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Entrada (%)
                    </label>
                    <select
                      value={formData.entradaPercentual}
                      onChange={(e) => handleInputChange('entradaPercentual', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    >
                      <option value="0">0% (100% financiado)</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                      <option value="30">30%</option>
                      <option value="40">40%</option>
                      <option value="50">50%</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Prazo Financiamento
                    </label>
                    <select
                      value={formData.prazoMeses}
                      onChange={(e) => handleInputChange('prazoMeses', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    >
                      <option value="240">20 anos</option>
                      <option value="300">25 anos</option>
                      <option value="360">30 anos</option>
                      <option value="420">35 anos</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Modelo de Financiamento
                    </label>
                    <select
                      value={formData.modeloFinanciamento}
                      onChange={(e) => handleInputChange('modeloFinanciamento', e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    >
                      <option value="price">Tabela Price (parcela fixa)</option>
                      <option value="sac">SAC (parcela decrescente)</option>
                    </select>
                  </div>
                </div>

                {/* Custos do Imóvel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      IPTU Anual
                      <span className="text-xs text-blue-500 dark:text-blue-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.iptuAnual}
                      onChange={(e) => handleInputChange('iptuAnual', e.target.value)}
                      placeholder="R$ 4.000,00"
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Condomínio Mensal
                      <span className="text-xs text-blue-500 dark:text-blue-400 ml-1">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.condominioMensal}
                      onChange={(e) => handleInputChange('condominioMensal', e.target.value)}
                      placeholder="R$ 300,00"
                      className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* === COLUNA DIREITA: ALUGAR === */}
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-6 flex items-center">
                  <Home className="h-6 w-6 mr-2" />
                  🏡 Alugar Imóvel
                </h3>
                
                {/* Aluguel Mensal */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                    Aluguel Mensal (R$) *
                  </label>
                  <input
                    type="text"
                    value={formData.aluguelMensal}
                    onChange={(e) => handleInputChange('aluguelMensal', e.target.value)}
                    placeholder="R$ 2.000,00"
                    className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground"
                    required
                  />
                </div>

                {/* Informações sobre Aluguel */}
                <div className="space-y-4">
                  <div className="bg-green-100 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">💡 Considerações Automáticas:</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <li>• Correção anual pelo IGP-M: {INDICADORES_MERCADO.igpM}%</li>
                      <li>• Investimento da entrada no CDI</li>
                      <li>• Diferença de custos investida mensalmente</li>
                      <li>• Sem custos de manutenção ou IPTU</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">📈 Estratégia de Investimento:</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      <strong>O que será investido:</strong>
                    </p>
                    <ul className="text-xs text-yellow-600 space-y-1">
                      <li>• Valor da entrada que não foi gasta</li>
                      <li>• Diferença mensal entre financiamento e aluguel</li>
                      <li>• Rendimento: {INDICADORES_MERCADO.custoOportunidade}% a.a. (CDI)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">🎯 Comparação Justa:</h4>
                    <p className="text-xs text-blue-600">
                      A simulação compara o patrimônio líquido final de ambas as estratégias, 
                      considerando valorização do imóvel, custos totais, impostos e rendimentos de investimento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resumo dos Indicadores Automáticos */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start">
                <BarChart3 className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-800">
                    <strong>📊 Indicadores Automáticos aplicados:</strong> Valorização imobiliária {INDICADORES_MERCADO.valorizacaoImovel}% a.a. • 
                    Custos de compra {INDICADORES_MERCADO.custosCompra}% • Manutenção {INDICADORES_MERCADO.manutencaoAnual}% a.a.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={calcularSimulacao}
                disabled={loading || !formData.precoCompra || !formData.aluguelMensal}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Calculator className="h-5 w-5" />
                <span>{loading ? 'Calculando...' : 'Calcular Simulação'}</span>
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
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
                      Resultados da Comparação
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    
                    {/* Comprar */}
                    <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-6 border-l-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        Comprar
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Patrimônio Líquido Final:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency((resultado as any).patrimonioLiquidoComprar)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">TIR:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{formatPercent((resultado as any).tirComprar)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Desembolso Inicial:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency((resultado as any).detalhesComprar.desembolsoInicial)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Custos Fixos Mensais:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency((resultado as any).detalhesComprar.custosFixosMensais)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alugar */}
                    <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-6 border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center">
                        <Home className="h-5 w-5 mr-2" />
                        Alugar
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Patrimônio Líquido Final:</span>
                          <span className="font-semibold text-green-900 dark:text-green-100">{formatCurrency((resultado as any).patrimonioLiquidoAlugar)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">TIR:</span>
                          <span className="font-semibold text-green-900 dark:text-green-100">{formatPercent((resultado as any).tirAlugar)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Aluguel Inicial:</span>
                          <span className="font-semibold text-green-900 dark:text-green-100">{formatCurrency((resultado as any).detalhesAlugar.aluguelInicial)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Aluguel Final:</span>
                          <span className="font-semibold text-green-900 dark:text-green-100">{formatCurrency((resultado as any).detalhesAlugar.aluguelFinal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recomendação */}
                  <div className={`rounded-lg p-6 mb-8 ${(resultado as any).patrimonioLiquidoComprar > (resultado as any).patrimonioLiquidoAlugar ? 'bg-blue-100 dark:bg-blue-950/50 border-l-4 border-blue-500' : 'bg-green-100 dark:bg-green-950/50 border-l-4 border-green-500'}`}>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      {(resultado as any).patrimonioLiquidoComprar > (resultado as any).patrimonioLiquidoAlugar ? (
                        <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 mr-2 text-green-600" />
                      )}
                      Recomendação
                    </h3>
                    <p className="text-lg">
                      <strong>
                        {(resultado as any).patrimonioLiquidoComprar > (resultado as any).patrimonioLiquidoAlugar ? 'COMPRAR' : 'ALUGAR'}
                      </strong>{' '}
                      é a melhor opção para o seu perfil, resultando em{' '}
                      <strong>
                        {formatCurrency(Math.abs((resultado as any).patrimonioLiquidoComprar - (resultado as any).patrimonioLiquidoAlugar))}
                      </strong>{' '}
                      a mais em patrimônio líquido.
                    </p>
                  </div>

                  {/* Métricas Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {(resultado as any).paybackAnos || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Payback (anos)</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {(resultado as any).breakEvenAno || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Break-even (ano)</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formData.anosPermanencia}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Período analisado</div>
                    </div>
                  </div>

                  {/* Gráfico Simplificado */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                      Evolução do Patrimônio
                    </h3>
                    <div className="space-y-2">
                      {(resultado as any).serieTemporalAnos.map((ano: any, index: any) => (
                        <div key={ano} className="flex items-center space-x-4">
                          <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ano {ano}
                          </div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
                            <div
                              className="bg-blue-500 h-4 rounded-full"
                              style={{
                                width: `${Math.min(100, ((resultado as any).seriePatrimonioComprar[index] / Math.max(...(resultado as any).seriePatrimonioComprar, ...(resultado as any).seriePatrimonioAlugar)) * 100)}%`
                              }}
                            ></div>
                            <div
                              className="bg-green-500 h-4 rounded-full absolute top-0 opacity-70"
                              style={{
                                width: `${Math.min(100, ((resultado as any).seriePatrimonioAlugar[index] / Math.max(...(resultado as any).seriePatrimonioComprar, ...(resultado as any).seriePatrimonioAlugar)) * 100)}%`
                              }}
                            ></div>
                          </div>
                          <div className="w-32 text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency((resultado as any).seriePatrimonioComprar[index] > (resultado as any).seriePatrimonioAlugar[index] ? (resultado as any).seriePatrimonioComprar[index] : (resultado as any).seriePatrimonioAlugar[index])}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Comprar</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Alugar</span>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          <strong>Importante:</strong> Esta simulação é baseada nos parâmetros informados e serve apenas como orientação. 
                          Os resultados podem variar conforme mudanças no mercado, taxas de juros, inflação e outros fatores econômicos. 
                          Consulte um especialista para análise detalhada do seu caso específico.
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
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-l-4 border-cyan-400 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-400 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Indicadores de Referência
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-800 dark:text-cyan-300">CDI:</span>
                      <span className="font-medium text-cyan-900 dark:text-cyan-200">{INDICADORES_MERCADO.custoOportunidade}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-800 dark:text-cyan-300">Valorização:</span>
                      <span className="font-medium text-cyan-900 dark:text-cyan-200">{INDICADORES_MERCADO.valorizacaoImovel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-800 dark:text-cyan-300">IGP-M:</span>
                      <span className="font-medium text-cyan-900 dark:text-cyan-200">{INDICADORES_MERCADO.igpM}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-800 dark:text-cyan-300">Manutenção:</span>
                      <span className="font-medium text-cyan-900 dark:text-cyan-200">{INDICADORES_MERCADO.manutencaoAnual}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-cyan-700 dark:text-cyan-400 mt-2">
                    *Indicadores automáticos aplicados na simulação
                  </p>
                </div>
              </motion.div>

              {/* Informações sobre a Análise */}
              <motion.div
                className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg shadow-sm p-6 border border-cyan-200 dark:border-cyan-700"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-300 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Como Funciona a Análise
                </h3>

                <div className="space-y-4">
                  {/* Comprar */}
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-300 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                        Comprar
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                      <div className="flex justify-between">
                        <span>Considera:</span>
                        <span className="font-medium">Valorização do imóvel</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Custos:</span>
                        <span className="font-medium">ITBI + Escritura + Manutenção</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patrimônio:</span>
                        <span className="font-medium">Valor - Saldo devedor</span>
                      </div>
                    </div>
                  </div>

                  {/* Alugar */}
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border border-green-300 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <h4 className="font-semibold text-green-900 dark:text-green-300">
                        Alugar
                      </h4>
                    </div>
                    <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                      <div className="flex justify-between">
                        <span>Investe:</span>
                        <span className="font-medium">Entrada não gasta</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rendimento:</span>
                        <span className="font-medium">CDI ({INDICADORES_MERCADO.custoOportunidade}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diferença:</span>
                        <span className="font-medium">Investe mensalmente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dicas de Interpretação */}
              <motion.div
                className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg shadow-sm p-4 border border-cyan-200 dark:border-cyan-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-full">
                      <PieChart className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-300">
                      Interpretação dos Resultados
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700">
                      <div className="space-y-3 text-xs text-cyan-700 dark:text-cyan-300 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          <span><strong>TIR:</strong> Taxa de retorno do investimento</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                          <span><strong>Payback:</strong> Tempo para recuperar o investimento</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span><strong>Break-even:</strong> Quando comprar se torna vantajoso</span>
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
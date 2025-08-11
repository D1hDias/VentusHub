import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building2, CreditCard, FileText, TrendingUp, DollarSign, Calendar, Shield, Info, User, Check, FileDown, X, Briefcase, Target, Users, AlertCircle, RefreshCcw } from "lucide-react";
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LoadingModal } from '@/components/LoadingModal';
import IndicadoresMercado from '@/components/IndicadoresMercado';
import { INDICADORES_MERCADO, getIndicadoresComCache } from '@/lib/indicadores-mercado';
import logoVentusHub from '@/assets/logo.png';


// Função para converter imagem em base64 e obter dimensões
const imageToBase64 = (url) => {
  return new Promise((resolve) => { // Removido reject para não quebrar a promise chain
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Se não conseguir o contexto, resolve com null para não quebrar
          resolve(null);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      };
      img.onerror = () => {
        // Em caso de erro, resolve com null
        console.error('Failed to load image for PDF:', url);
        resolve(null);
      };
      img.src = url;
    } catch (error) {
      // Captura qualquer erro síncrono
      console.error('Error in imageToBase64 function:', error);
      resolve(null);
    }
  });
};

// Função para converter hex para RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 31, b: 63 }; // fallback para azul VentusHub
};

// Configurações dos produtos PJ (função para usar indicadores dinâmicos)
const getProdutosConfig = (indicadores) => ({
  pronampe: {
    nome: 'Pronampe',
    valorMinimo: 0,
    valorMaximo: 150000,
    prazoMaximo: 48,
    cor: '#0056b3',
    descricao: 'Programa Nacional de Apoio às Microempresas e Empresas de Pequeno Porte',
    tipoTaxa: 'pos-fixada',
    taxaBase: 6.0, // 6% + SELIC
    caracteristicas: [
      'Valor até R$ 150.000',
      'Prazo até 48 meses',
      'Garantia do FGO',
      `Taxa: 6% + SELIC (${indicadores.selic}%) = ${(6.0 + indicadores.selic).toFixed(2)}% ao ano`,
      'Juros pós-fixados'
    ]
  },
  fgi: {
    nome: 'FGI',
    valorMinimo: 150001,
    valorMaximo: 3000000,
    prazoMaximo: 48,
    cor: '#28a745',
    descricao: 'Fundo Garantidor para Investimentos',
    tipoTaxa: 'pre-fixada',
    taxaMensal: 1.90, // 1,90% ao mês
    caracteristicas: [
      'Valor de R$ 151.000 até R$ 3.000.000',
      'Prazo até 48 meses',
      'Garantia complementar',
      'Taxa: 1,90% ao mês (22,8% ao ano)',
      'Juros pré-fixados'
    ]
  }
});

const SimuladorCreditoPJ = () => {
  // Estados do formulário
  const [produto, setProduto] = useState('');
  const [valorCredito, setValorCredito] = useState('');
  const [prazoDesejado, setPrazoDesejado] = useState('');

  // Estados de controle
  const [resultado, setResultado] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [erros, setErros] = useState({});
  const [indicadoresAtuais, setIndicadoresAtuais] = useState(INDICADORES_MERCADO);

  // Carregar indicadores atualizados ao montar o componente
  useEffect(() => {
    const carregarIndicadores = async () => {
      try {
        const indicadores = await getIndicadoresComCache();
        setIndicadoresAtuais(indicadores);
      } catch (error) {
        console.warn('Erro ao carregar indicadores:', error);
        // Mantém os valores estáticos em caso de erro
      }
    };

    carregarIndicadores();
  }, []);

  // Função para controlar a sidebar secundária - desabilitar quando acessado diretamente
  useEffect(() => {
    // Verificar se chegou diretamente na página do simulador
    const isDirectAccess = window.location.pathname === '/simulador-credito-pj';

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

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    const numValue = parseFloat(value.toString().replace(/[^\d]/g, '')) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  // Função para processar mudanças no valor
  const handleValorChange = (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    if (value.length > 0) {
      value = (parseInt(value) / 100).toFixed(2).replace('.', '');
      const formattedValue = formatCurrency(value);
      setValorCredito(formattedValue);

      // Auto-selecionar produto baseado no valor
      const numericValue = parseFloat(value) / 100;
      if (numericValue <= 150000) {
        setProduto('pronampe');
      } else if (numericValue <= 3000000) {
        setProduto('fgi');
      }
    } else {
      setValorCredito('');
      setProduto('');
    }
  };

  // Função para validar formulário
  const validarFormulario = () => {
    const novosErros = {};

    if (!produto) {
      novosErros.produto = 'Selecione um produto';
    }

    if (!valorCredito || valorCredito === 'R$ 0,00') {
      novosErros.valorCredito = 'Informe o valor do crédito necessário';
    } else {
      const valor = parseFloat(valorCredito.replace(/[^\d,]/g, '').replace(',', '.'));
      if (valor < 1) {
        novosErros.valorCredito = 'Valor deve ser maior que R$ 0,00';
      } else if (valor > 3000000) {
        novosErros.valorCredito = 'Valor máximo é R$ 3.000.000,00';
      }
    }

    if (!prazoDesejado) {
      novosErros.prazoDesejado = 'Informe o prazo desejado';
    } else {
      const prazo = parseInt(prazoDesejado);
      if (prazo < 1 || prazo > 48) {
        novosErros.prazoDesejado = 'Prazo deve ser entre 1 e 48 meses';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Função para processar simulação
  const processarSimulacao = async () => {
    if (!validarFormulario()) return;

    setIsLoading(true);

    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const valorNumerico = parseFloat(valorCredito.replace(/[^\d,]/g, '').replace(',', '.'));
    const produtosConfig = getProdutosConfig(indicadoresAtuais);
    const produtoConfig = produtosConfig[produto];
    const prazo = parseInt(prazoDesejado);

    // Cálculo das taxas baseado no produto
    let taxaJurosMensal;
    let taxaJurosAnual;
    let descricaoTaxa;

    if (produto === 'pronampe') {
      // Pronampe: 6% + SELIC (pós-fixada)
      const taxaAnualTotal = produtoConfig.taxaBase + indicadoresAtuais.selic;
      taxaJurosMensal = taxaAnualTotal / 12 / 100;
      taxaJurosAnual = taxaAnualTotal;
      descricaoTaxa = `${produtoConfig.taxaBase}% + SELIC (${indicadoresAtuais.selic}%) = ${taxaAnualTotal.toFixed(2)}% ao ano`;
    } else {
      // FGI: 1,90% ao mês (pré-fixada)
      taxaJurosMensal = produtoConfig.taxaMensal / 100;
      taxaJurosAnual = produtoConfig.taxaMensal * 12;
      descricaoTaxa = `${produtoConfig.taxaMensal}% ao mês (${taxaJurosAnual.toFixed(2)}% ao ano)`;
    }

    // Cálculo da parcela usando Price
    const parcela = valorNumerico * (taxaJurosMensal * Math.pow(1 + taxaJurosMensal, prazo)) / (Math.pow(1 + taxaJurosMensal, prazo) - 1);
    const valorTotal = parcela * prazo;
    const jurosTotal = valorTotal - valorNumerico;

    const resultadoSimulacao = {
      produto: produtoConfig,
      valorSolicitado: valorNumerico,
      prazo: prazo,
      taxaJuros: taxaJurosAnual,
      taxaJurosMensal: taxaJurosMensal * 100,
      descricaoTaxa: descricaoTaxa,
      parcela: parcela,
      valorTotal: valorTotal,
      jurosTotal: jurosTotal,
      aprovado: true,
      dataSimulacao: new Date().toLocaleString('pt-BR')
    };

    setResultado(resultadoSimulacao);
    setIsLoading(false);

    // Scroll para os resultados
    setTimeout(() => {
      scroller.scrollTo('resultados', {
        duration: 800,
        delay: 0,
        smooth: 'easeInOutQuart',
        offset: -100
      });
    }, 100);
  };

  // Função para limpar simulação
  const limparSimulacao = () => {
    setProduto('');
    setValorCredito('');
    setPrazoDesejado('');
    setResultado(null);
    setErros({});

    // Scroll para o topo do formulário
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Função para gerar PDF
  const gerarPDF = async () => {
    if (!resultado) return;

    const doc = new jsPDF();

    try {
      // Adicionar logo
      const logoBase64 = await imageToBase64(logoVentusHub);
      if (logoBase64 && logoBase64.dataUrl) {
        doc.addImage(logoBase64.dataUrl, 'PNG', 160, 10, 30, 30);
      }
    } catch (error) {
      console.log('Erro ao carregar logo:', error);
    }

    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(0, 31, 63);
    doc.text('Simulação de Crédito PJ', 20, 30);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${resultado.dataSimulacao}`, 20, 40);

    // Dados da simulação
    const dados = [
      ['Produto:', resultado.produto.nome],
      ['Valor Solicitado:', `R$ ${resultado.valorSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Prazo:', `${resultado.prazo} meses`],
      ['Taxa de Juros:', resultado.descricaoTaxa],
      ['Parcela Mensal:', `R$ ${resultado.parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Valor Total:', `R$ ${resultado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total de Juros:', `R$ ${resultado.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
    ];

    autoTable(doc, {
      startY: 60,
      body: dados,
      theme: 'grid',
      headStyles: { fillColor: [0, 31, 63] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 100 }
      }
    });

    // Salvar PDF
    doc.save(`simulacao-credito-pj-${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <LoadingModal isOpen={isLoading} title="Processando simulação..." />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Layout Principal com duas colunas */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Coluna Esquerda (Scrollable) */}
          <div className="w-full lg:w-2/3">
            <motion.div
              className="text-center lg:text-left mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 bg-clip-text text-transparent mb-2">
                Simulador de Crédito PJ
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Simule seu crédito empresarial com as melhores condições do mercado.
              </p>
            </motion.div>

            {/* Formulário */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                    <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Dados da Simulação
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300"><Briefcase className="h-4 w-4 inline-block mr-2" />Produto</label>
                    <select
                      value={produto}
                      onChange={(e) => setProduto(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${erros.produto ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'
                        }`}
                    >
                      <option value="">Selecione um produto</option>
                      <option value="pronampe">Pronampe - até R$ 150.000</option>
                      <option value="fgi">FGI - R$ 151.000 a R$ 3.000.000</option>
                    </select>
                    {erros.produto && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{erros.produto}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300"><Calendar className="h-4 w-4 inline-block mr-2" />Prazo (até 48 Meses)</label>
                    <input
                      type="number"
                      value={prazoDesejado}
                      onChange={(e) => setPrazoDesejado(e.target.value)}
                      placeholder="Digite aqui..."
                      min="1"
                      max="48"
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${erros.prazoDesejado ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'
                        }`}
                    />
                    {erros.prazoDesejado && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{erros.prazoDesejado}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300"><DollarSign className="h-4 w-4 inline-block mr-2" />Valor do Crédito</label>
                  <input
                    type="text"
                    value={valorCredito}
                    onChange={handleValorChange}
                    placeholder="Digite Aqui..."
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${erros.valorCredito ? 'border-red-300' : 'border-gray-200 dark:border-gray-600'
                      }`}
                  />
                  {erros.valorCredito && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="h-4 w-4" />{erros.valorCredito}</p>}
                </div>

                <motion.button
                  onClick={processarSimulacao}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calculator className="h-5 w-5" />
                  {isLoading ? 'Processando...' : 'Simular Crédito'}
                </motion.button>
              </div>
            </motion.div>

            {/* Resultados */}
            {resultado && (
              <Element name="resultados">
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 mt-8 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full text-white" style={{ backgroundColor: resultado.produto.cor }}><TrendingUp className="h-6 w-6" /></div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Resultado da Simulação</h2>
                        <p className="text-gray-600 dark:text-gray-300">{resultado.produto.nome} • {resultado.dataSimulacao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button onClick={limparSimulacao} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><RefreshCcw className="h-5 w-5 text-gray-600" /></motion.button>
                      <motion.button onClick={gerarPDF} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><FileDown className="h-5 w-5 text-blue-600" /></motion.button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6"><div className="flex items-center justify-between mb-4"><DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" /><span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded-full">SOLICITADO</span></div><p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {resultado.valorSolicitado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-sm text-gray-600 dark:text-gray-400">Valor do crédito</p></div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6"><div className="flex items-center justify-between mb-4"><Calendar className="h-8 w-8 text-green-600 dark:text-green-400" /><span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-800 px-2 py-1 rounded-full">PRAZO</span></div><p className="text-2xl font-bold text-gray-900 dark:text-white">{resultado.prazo}</p><p className="text-sm text-gray-600 dark:text-gray-400">meses</p></div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6"><div className="flex items-center justify-between mb-4"><CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400" /><span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded-full">PARCELA</span></div><p className="text-2xl font-bold text-gray-900 dark:text-white">R$ {resultado.parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><p className="text-sm text-gray-600 dark:text-gray-400">mensal</p></div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6"><div className="flex items-center justify-between mb-4"><TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" /><span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-200 dark:bg-orange-800 px-2 py-1 rounded-full">TAXA</span></div><p className="text-xl font-bold text-gray-900 dark:text-white">{resultado.taxaJuros.toFixed(2)}%</p><p className="text-xs text-gray-600 dark:text-gray-400">{resultado.descricaoTaxa}</p></div>
                  </div>
                </motion.div>
              </Element>
            )}
          </div>

          {/* Coluna Direita (Fixa) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-8 space-y-6">
              <motion.div
                className="lg:mt-[10.5rem]" // Margem superior para alinhar com o formulário
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <IndicadoresMercado
                  indicadoresVisiveis={['selic', 'cdi', 'ipca', 'igpM']}
                  showUpdateButton={true}
                  autoRefresh={true}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimuladorCreditoPJ;

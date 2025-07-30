import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building, CreditCard, FileText, TrendingUp, Home, DollarSign, Calendar, Shield, Info, User, MapPin, Check, FileDown, X } from "lucide-react";
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoInter from '@/assets/logo-inter.png';
import logoItau from '@/assets/logo-itau.png';
import logoSantander from '@/assets/logo-santander.png';
import logoGalleria from '@/assets/logo-galleria.png';
import logoBari from '@/assets/logo-bari.png';
import logoVentusHub from '@/assets/logo.png';

// Função para converter imagem em base64 e obter dimensões
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

// Função para converter hex para RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 31, b: 63 }; // fallback para azul VentusHub
};

// Função TIR simplificada e robusta para cálculo do CET
const calcularTIR = (fluxosCaixa, datas) => {
  // Método de bissecção mais estável para TIR
  let taxaMin = -0.99; // Taxa mínima possível
  let taxaMax = 10.0;   // Taxa máxima razoável (1000% ao ano)
  const tolerancia = 1e-8;
  const maxIteracoes = 100;
  
  const calcularVPL = (taxa) => {
    let vpl = 0;
    for (let j = 0; j < fluxosCaixa.length; j++) {
      const diasDiferenca = (datas[j] - datas[0]) / (1000 * 60 * 60 * 24);
      const fator = Math.pow(1 + taxa, diasDiferenca / 365);
      vpl += fluxosCaixa[j] / fator;
    }
    return vpl;
  };
  
  // Verificar se há mudança de sinal (condição necessária para TIR)
  const vplMin = calcularVPL(taxaMin);
  const vplMax = calcularVPL(taxaMax);
  
  if (vplMin * vplMax > 0) {
    // Não há mudança de sinal, usar aproximação baseada na taxa mensal
    const valorLiberado = Math.abs(fluxosCaixa[0]);
    const parcelaTipica = Math.abs(fluxosCaixa[1]) || Math.abs(fluxosCaixa[fluxosCaixa.length - 1]);
    const prazoMeses = fluxosCaixa.length - 1;
    
    // Aproximação inicial baseada na relação parcela/valor
    const taxaMensalAprox = (parcelaTipica * prazoMeses / valorLiberado - 1) / prazoMeses;
    return Math.max(0, Math.min(0.1, taxaMensalAprox * 12 / 365)); // Converter para diária
  }
  
  // Método da bissecção
  for (let i = 0; i < maxIteracoes; i++) {
    const taxaMed = (taxaMin + taxaMax) / 2;
    const vplMed = calcularVPL(taxaMed);
    
    if (Math.abs(vplMed) < tolerancia || (taxaMax - taxaMin) < tolerancia) {
      return Math.max(0, taxaMed); // Garantir que não seja negativa
    }
    
    if (vplMed * vplMin < 0) {
      taxaMax = taxaMed;
    } else {
      taxaMin = taxaMed;
    }
  }
  
  return Math.max(0, (taxaMin + taxaMax) / 2);
};

// Função para calcular CET conforme padrão dos bancos (baseado no Itaú)
const calcularCETRegulamentar = (valorLiberado, parcelas, taxaJurosAnual) => {
  try {
    // Se não há parcelas, não pode calcular CET
    if (!parcelas || parcelas.length === 0) {
      return { taxaDiaria: 0, cetAnual: 0, sucesso: false };
    }
    
    // Calcular CESH (Custo Efetivo do Seguro Habitacional)
    const totalSeguros = parcelas.reduce((sum, p) => sum + p.seguroMIP + p.seguroDFI, 0);
    const ceshAnual = (totalSeguros / valorLiberado) * (12 / parcelas.length) * 100;
    
    // CET = Taxa de Juros + CESH (método usado pelos bancos)
    const cetAnual = taxaJurosAnual + ceshAnual;
    
    // Validação para garantir valores razoáveis
    const cetFinal = Math.max(taxaJurosAnual, Math.min(50, cetAnual));
    
    const taxaDiaria = Math.pow(1 + cetFinal / 100, 1 / 365) - 1;
    
    return {
      taxaDiaria,
      cetAnual: cetFinal,
      ceshAnual,
      sucesso: true
    };
  } catch (error) {
    console.error('Erro no cálculo do CET:', error);
    return {
      taxaDiaria: 0,
      cetAnual: taxaJurosAnual || 0,
      ceshAnual: 0,
      sucesso: false
    };
  }
};

// Configurações específicas de cada banco
const BANCOS_CONFIG = {
  bari: {
    nome: "Bari",
    cor: "#000000",
    logo: logoBari,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Taxa de juros pode variar de acordo com o seu relacionamento com o banco e o prazo escolhido.",
    taxas: {
      PRICE_IPCA: 14.40
    },
    seguros: {
      mip: { 18: 0.00021028, 30: 0.00021028, 40: 0.00021028, 50: 0.00021028, 60: 0.00021028, 70: 0.00021028, 80: 0.00021028 },
      dfi: { residencial: 0.000037, comercial: 0.000037 }
    }
  },
  inter: {
    nome: "Inter",
    cor: "#FF6600",
    logo: logoInter,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      PRICE_IPCA: 12.68
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0005684 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0005684 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.0005684 }
      ],
      dfi: { residencial: 0, comercial: 0 }
    }
  },
  itau: {
    nome: "Itaú",
    cor: "#EC7000",
    logo: logoItau,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Taxa de juros pode variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      PRICE_TR: 26.40,
      PRICE_IPCA: 26.40
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 }
    }
  },
  galleria: {
    nome: "Galleria",
    cor: "#16A34A",
    logo: logoGalleria,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      PRICE_IPCA: 14.28
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.00021028 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.00021028 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.00021028 }
      ],
      dfi: { residencial: 0.000037, comercial: 0.000037 }
    }
  },
  santander: {
    nome: "Santander",
    cor: "#EC0000",
    logo: logoSantander,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      PRICE_TR: 22.28,
      PRICE_IPCA: 22.28
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 }
    }
  }
};

// Estados do Brasil
const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' }
];

// Tabela de coeficientes de financiamento para cálculo SAC
function gerarTabelaCoeficientesSAC(taxaMensal, numeroParcelas) {
  const parcelas = [];
  const amortizacao = 1 / numeroParcelas;
  let saldoDevedor = 1;
  
  for (let n = 1; n <= numeroParcelas; n++) {
    const juros = saldoDevedor * taxaMensal;
    const parcela = amortizacao + juros;
    
    parcelas.push({
      numero: n,
      parcela: parcela,
      juros: juros,
      amortizacao: amortizacao,
      saldoDevedor: saldoDevedor - amortizacao
    });
    
    saldoDevedor -= amortizacao;
  }
  
  return parcelas;
}

// Calcular parcela Price
function calcularParcelaPrice(valor, taxaMensal, numeroParcelas) {
  if (taxaMensal === 0) return valor / numeroParcelas;
  
  const fatorPrice = (Math.pow(1 + taxaMensal, numeroParcelas) * taxaMensal) / 
                     (Math.pow(1 + taxaMensal, numeroParcelas) - 1);
  return valor * fatorPrice;
}

// Função para calibração exata - 240 meses
function calcularTaxaNecessaria(valorFinanciado, prestacaoDesejada, prazo) {
  // Busca binária para encontrar a taxa que resulta na prestação desejada
  let taxaMin = 0.001; // 0.1% ao mês
  let taxaMax = 0.05;   // 5% ao mês
  const tolerancia = 0.01; // R$ 0,01 de diferença
  
  for (let i = 0; i < 100; i++) {
    const taxaTeste = (taxaMin + taxaMax) / 2;
    const prestacaoTeste = calcularParcelaPrice(valorFinanciado, taxaTeste, prazo);
    
    if (Math.abs(prestacaoTeste - prestacaoDesejada) < tolerancia) {
      return taxaTeste;
    }
    
    if (prestacaoTeste < prestacaoDesejada) {
      taxaMin = taxaTeste;
    } else {
      taxaMax = taxaTeste;
    }
  }
  
  return (taxaMin + taxaMax) / 2;
}

function testarCalculosPrestacao() {
  const valorFinanciado = 500000;
  const prazo = 240;
  
  // Valores esperados dos simuladores oficiais dos bancos
  const valoresEsperados = {
    bari: 7228.09,
    galleria: 6756.92,
    inter: 6492.31
  };
  
  // Taxas informadas
  const taxasInformadas = {
    bari: 14.40,
    galleria: 14.28,
    inter: 12.68
  };
  
  console.log('=== CALIBRAÇÃO EXATA - 240 MESES ===');
  console.log(`Valor financiado: R$ ${valorFinanciado.toLocaleString('pt-BR')}`);
  console.log(`Prazo: ${prazo} meses`);
  console.log('');
  
  Object.entries(valoresEsperados).forEach(([banco, valorEsperado]) => {
    const taxaInformada = taxasInformadas[banco];
    const taxaMensalInformada = Math.pow(1 + taxaInformada / 100, 1/12) - 1;
    const prestacaoCalculada = calcularParcelaPrice(valorFinanciado, taxaMensalInformada, prazo);
    
    // Encontrar taxa necessária para o valor exato
    const taxaMensalNecessaria = calcularTaxaNecessaria(valorFinanciado, valorEsperado, prazo);
    const taxaAnualNecessaria = (Math.pow(1 + taxaMensalNecessaria, 12) - 1) * 100;
    
    console.log(`${banco.toUpperCase()}:`);
    console.log(`  Valor esperado: R$ ${valorEsperado.toFixed(2)}`);
    console.log(`  Taxa informada: ${taxaInformada}% a.a.`);
    console.log(`  Prestação atual: R$ ${prestacaoCalculada.toFixed(2)}`);
    console.log(`  Diferença: R$ ${(prestacaoCalculada - valorEsperado).toFixed(2)}`);
    console.log(`  Taxa necessária: ${taxaAnualNecessaria.toFixed(4)}% a.a.`);
    console.log('');
  });
}

// Tabela de parcelas Price
function gerarTabelaParcelasPrice(valor, taxaMensal, numeroParcelas) {
  const parcelas = [];
  const parcelaFixa = calcularParcelaPrice(valor, taxaMensal, numeroParcelas);
  let saldoDevedor = valor;
  
  for (let n = 1; n <= numeroParcelas; n++) {
    const juros = saldoDevedor * taxaMensal;
    const amortizacao = parcelaFixa - juros;
    
    parcelas.push({
      numero: n,
      parcela: parcelaFixa,
      juros: juros,
      amortizacao: amortizacao,
      saldoDevedor: saldoDevedor - amortizacao
    });
    
    saldoDevedor -= amortizacao;
  }
  
  return parcelas;
}

// Calcular FGTS
function calcularFGTS(salarioBruto, tempoContribuicao) {
  const fgtsBase = salarioBruto * 0.08 * 12 * tempoContribuicao;
  // Assumindo um rendimento médio de 5.5% ao ano (TR + juros)
  const rendimento = Math.pow(1 + 0.055, tempoContribuicao) - 1;
  return fgtsBase * (1 + rendimento);
}

// Calcular seguros
function calcularSeguros(banco, idade, valorFinanciado, tipoImovel = 'residencial', valorImovel = valorFinanciado, numeroParcela = 1) {
  const config = BANCOS_CONFIG[banco];
  if (!config) return { mip: 0, dfi: 0 };
  
  let seguroMIP = 0;
  let seguroDFI = 0;
  
  // Calcular MIP (Morte e Invalidez Permanente)
  if (banco === 'bari') {
    // Cálculo especial para Bari - valores mensais decrescentes
    const mipInicial = 105.14;
    const reducaoMensal = 0.09;
    seguroMIP = Math.max(mipInicial - (numeroParcela - 1) * reducaoMensal, 50);
  } else if (Array.isArray(config.seguros.mip)) {
    // Para bancos com faixas de idade (como Bradesco)
    const faixaIdade = config.seguros.mip.find(faixa => 
      idade >= faixa.idadeMin && idade <= faixa.idadeMax
    );
    if (faixaIdade) {
      seguroMIP = (valorFinanciado * faixaIdade.aliquota) / 12;
    }
  } else {
    // Para bancos com tabela por idade (como BB)
    const idades = Object.keys(config.seguros.mip).map(Number);
    let idadeAplicavel = 18;
    
    for (let i = 0; i < idades.length; i++) {
      if (idade >= idades[i]) {
        idadeAplicavel = idades[i];
      }
    }
    
    seguroMIP = (valorFinanciado * config.seguros.mip[idadeAplicavel]) / 12;
  }
  
  // Calcular DFI (Danos Físicos do Imóvel)
  if (banco === 'bari') {
    // Valor fixo mensal para Bari
    seguroDFI = 48.10;
  } else {
    // Aplicado sobre valor do imóvel para outros bancos
    seguroDFI = (valorImovel * config.seguros.dfi[tipoImovel]) / 12;
  }
  
  return { mip: seguroMIP, dfi: seguroDFI };
}

// Função para calcular tabela SAC com seguros
function calcularTabelaSAC(valorFinanciado, taxaMensal, numeroParcelas, banco, idade, valorImovel, tipoImovel = 'residencial') {
  const parcelas = [];
  const amortizacao = valorFinanciado / numeroParcelas;
  let saldoDevedor = valorFinanciado;
  
  for (let n = 1; n <= numeroParcelas; n++) {
    const juros = saldoDevedor * taxaMensal;
    const parcelaPrincipal = amortizacao + juros;
    
    // Calcular seguros mensais
    const seguros = calcularSeguros(banco, idade, saldoDevedor, tipoImovel, valorImovel, n);
    const seguroMensalMIP = seguros.mip;
    const seguroMensalDFI = seguros.dfi;
    
    const parcelaTotal = parcelaPrincipal + seguroMensalMIP + seguroMensalDFI;
    
    parcelas.push({
      numero: n,
      parcela: parcelaTotal,
      principal: parcelaPrincipal,
      juros: juros,
      amortizacao: amortizacao,
      seguroMIP: seguroMensalMIP,
      seguroDFI: seguroMensalDFI,
      saldoDevedor: Math.max(0, saldoDevedor - amortizacao)
    });
    
    saldoDevedor -= amortizacao;
  }
  
  return parcelas;
}

// Função para calcular tabela PRICE com seguros
function calcularTabelaPrice(valorFinanciado, taxaMensal, numeroParcelas, banco, idade, valorImovel, tipoImovel = 'residencial') {
  const parcelas = [];
  const parcelaFixaPrincipal = calcularParcelaPrice(valorFinanciado, taxaMensal, numeroParcelas);
  let saldoDevedor = valorFinanciado;
  
  for (let n = 1; n <= numeroParcelas; n++) {
    const juros = saldoDevedor * taxaMensal;
    const amortizacao = parcelaFixaPrincipal - juros;
    
    // Calcular seguros mensais
    const seguros = calcularSeguros(banco, idade, saldoDevedor, tipoImovel, valorImovel, n);
    const seguroMensalMIP = seguros.mip;
    const seguroMensalDFI = seguros.dfi;
    
    const parcelaTotal = parcelaFixaPrincipal + seguroMensalMIP + seguroMensalDFI;
    
    parcelas.push({
      numero: n,
      parcela: parcelaTotal,
      principal: parcelaFixaPrincipal,
      juros: juros,
      amortizacao: amortizacao,
      seguroMIP: seguroMensalMIP,
      seguroDFI: seguroMensalDFI,
      saldoDevedor: Math.max(0, saldoDevedor - amortizacao)
    });
    
    saldoDevedor -= amortizacao;
  }
  
  return parcelas;
}

const SimuladorCGI = () => {
  // Estados do formulário
  const [bancosEscolhidos, setBancosEscolhidos] = useState([]);
  const [valorImovel, setValorImovel] = useState('');
  const [valorFinanciamento, setValorFinanciamento] = useState('');
  const [prazoMeses, setPrazoMeses] = useState('');
  const [rendaBruta, setRendaBruta] = useState('');
  const [rendaConjuge, setRendaConjuge] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [idadeConjuge, setIdadeConjuge] = useState('');
  const [tempoContribuicao, setTempoContribuicao] = useState('');
  const [tempoContribuicaoConjuge, setTempoContribuicaoConjuge] = useState('');
  const [tipoImovel, setTipoImovel] = useState('residencial');
  const [primeiroImovel, setPrimeiroImovel] = useState(true);
  const [utilizarFGTS, setUtilizarFGTS] = useState(false);
  const [sistema, setSistema] = useState('PRICE');
  const [indexador, setIndexador] = useState('TR');
  const [tipoFinanciamento, setTipoFinanciamento] = useState('PRICE_TR');

  // Estados dos resultados
  const [resultados, setResultados] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [erro, setErro] = useState('');

  // Estado para controlar qual banco está sendo exibido nos resultados
  const [bancoExibindo, setBancoExibindo] = useState('');

  // Estado para armazenar as tabelas de amortização
  const [tabelasAmortizacao, setTabelasAmortizacao] = useState({});

  // Estado para controlar a exibição da tabela de amortização
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const [tabelaAtual, setTabelaAtual] = useState(null);


  // Função para alternar seleção de banco
  const toggleBanco = (codigoBanco) => {
    setBancosEscolhidos(prev => {
      const novosBancos = prev.includes(codigoBanco) 
        ? prev.filter(b => b !== codigoBanco)
        : [...prev, codigoBanco];
      
      // Definir padrão do sistema baseado no banco selecionado
      if (!prev.includes(codigoBanco)) { // Se está selecionando o banco
        if (codigoBanco === 'itau' || codigoBanco === 'santander') {
          setTipoFinanciamento('PRICE_TR');
        } else if (codigoBanco === 'bari' || codigoBanco === 'galleria' || codigoBanco === 'inter') {
          setTipoFinanciamento('PRICE_IPCA');
        }
      }
      
      // Se foi selecionado um banco (não desselecionado) e é o primeiro banco, rolar para o formulário
      if (!prev.includes(codigoBanco) && prev.length === 0) {
        setTimeout(() => {
          scroller.scrollTo('formulario', {
            duration: 800,
            delay: 300, // Aguardar a animação do formulário aparecer
            smooth: 'easeInOutQuart',
            offset: -50 // Offset para centralizar melhor
          });
        }, 100);
      }
      
      return novosBancos;
    });
  };

  // Função para selecionar/desselecionar todos os bancos
  const toggleAllBancos = () => {
    const estaVazio = bancosEscolhidos.length === 0;
    
    if (bancosEscolhidos.length === Object.keys(BANCOS_CONFIG).length) {
      setBancosEscolhidos([]);
    } else {
      setBancosEscolhidos(Object.keys(BANCOS_CONFIG));
      
      // Se estava vazio e agora vai selecionar todos, rolar para o formulário
      if (estaVazio) {
        setTimeout(() => {
          scroller.scrollTo('formulario', {
            duration: 800,
            delay: 300,
            smooth: 'easeInOutQuart',
            offset: -50
          });
        }, 100);
      }
    }
  };

  // Função para calcular idade a partir da data de nascimento
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return 0;
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  // Função para calcular prazo máximo baseado na idade
  const calcularPrazoMaximo = (dataNasc, bancoKey = null) => {
    const idade = calcularIdade(dataNasc);
    const idadeMaxima = 80;
    const prazoMaximo = (idadeMaxima - idade) * 12;
    
    return Math.min(240, prazoMaximo);
  };

  // Função para atualizar valor do financiamento baseado no valor do imóvel
  const atualizarValorFinanciamento = (valorImovelStr) => {
    const valor = limparFormatacao(valorImovelStr);
    const maxFinanciamento = valor * 0.6; // 60% máximo
    setValorFinanciamento(formatarEntradaMoeda(maxFinanciamento.toString()));
  };

  // Função para formatar valores monetários
  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Função para formatar porcentagem
  const formatarPorcentagem = (valor, decimais = 2) => {
    if (valor === null || valor === undefined || isNaN(valor)) return '0,00%';
    return (valor).toLocaleString('pt-BR', {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais
    }) + '%';
  };

  // Função para limpar formatação de moeda
  const limparFormatacao = (valor) => {
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  };

  // Função para formatar entrada de moeda
  const formatarEntradaMoeda = (valor) => {
    const numero = limparFormatacao(valor);
    if (numero === 0) return '';
    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para formatar valor monetário durante a digitação
  const formatarMoedaDigitacao = (valor) => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Se vazio, retorna vazio
    if (!apenasNumeros) return '';
    
    // Converte para número (centavos)
    const numero = parseInt(apenasNumeros, 10);
    
    // Formata como moeda brasileira
    return (numero / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função de validação
  const validarFormulario = () => {
    const valor = limparFormatacao(valorImovel);
    const financiamento = limparFormatacao(valorFinanciamento);
    const prazo = parseInt(prazoMeses) || 0;
    const renda = limparFormatacao(rendaBruta);
    const idade = calcularIdade(dataNascimento);

    if (bancosEscolhidos.length === 0) {
      setErro('Selecione pelo menos um banco para a simulação');
      return false;
    }

    if (valor < 50000) {
      setErro('O valor do imóvel deve ser de pelo menos R$ 50.000');
      return false;
    }

    if (financiamento > valor * 0.6) {
      setErro('O valor do financiamento não pode ser superior a 60% do valor do imóvel');
      return false;
    }

    if (financiamento < valor * 0.1) {
      setErro('O valor do financiamento deve ser de pelo menos 10% do valor do imóvel');
      return false;
    }

    if (!dataNascimento) {
      setErro('Informe a data de nascimento');
      return false;
    }

    if (idade < 18 || idade > 75) {
      setErro('A idade deve estar entre 18 e 75 anos');
      return false;
    }

    const prazoMaximo = calcularPrazoMaximo(dataNascimento);
    if (prazo < 12 || prazo > prazoMaximo) {
      setErro(`O prazo deve estar entre 12 e ${prazoMaximo} meses para esta idade`);
      return false;
    }

    if (renda < 1000) {
      setErro('A renda bruta deve ser de pelo menos R$ 1.000');
      return false;
    }

    setErro('');
    return true;
  };

  // Função principal de cálculo
  const calcularSimulacao = () => {
    if (!validarFormulario()) return;

    const valor = limparFormatacao(valorImovel);
    const valorFinanciado = limparFormatacao(valorFinanciamento);
    const prazo = parseInt(prazoMeses);
    const renda = limparFormatacao(rendaBruta);
    const rendaConj = limparFormatacao(rendaConjuge) || 0;
    const idadeInt = calcularIdade(dataNascimento);
    const idadeConjInt = parseInt(idadeConjuge) || 25;
    const tempoContribInt = parseInt(tempoContribuicao) || 0;
    const tempoContribConjInt = parseInt(tempoContribuicaoConjuge) || 0;

    const valorEntrada = valor - valorFinanciado;
    const rendaTotal = renda + rendaConj;

    // Calcular FGTS se selecionado
    let fgtsDisponivel = 0;
    if (utilizarFGTS) {
      const fgtsTitular = calcularFGTS(renda, tempoContribInt);
      const fgtsConjuge = rendaConj > 0 ? calcularFGTS(rendaConj, tempoContribConjInt) : 0;
      fgtsDisponivel = fgtsTitular + fgtsConjuge;
    }

    const resultadosBancos = {};
    const tabelasBanco = {};

    // Calcular para cada banco selecionado
    bancosEscolhidos.forEach(bancoKey => {
      const banco = BANCOS_CONFIG[bancoKey];
      
      // Validar compatibilidade banco x sistema/correção
      let chaveIndexador = tipoFinanciamento;
      let sistemaAdaptado = false;
      
      // Se selecionou PRICE_TR mas o banco só trabalha com IPCA
      if (tipoFinanciamento === 'PRICE_TR' && (bancoKey === 'bari' || bancoKey === 'galleria' || bancoKey === 'inter')) {
        chaveIndexador = 'PRICE_IPCA';
        sistemaAdaptado = true;
      }
      // Se selecionou PRICE_IPCA mas o banco trabalha com TR
      else if (tipoFinanciamento === 'PRICE_IPCA' && (bancoKey === 'itau' || bancoKey === 'santander')) {
        chaveIndexador = 'PRICE_TR';
        sistemaAdaptado = true;
      }
      
      const taxaAnual = banco.taxas[chaveIndexador];
      
      if (!taxaAnual) return;

      const taxaMensal = Math.pow(1 + taxaAnual / 100, 1/12) - 1;

      // Verificar prazo máximo específico do banco
      const prazoMaximoBanco = calcularPrazoMaximo(dataNascimento);

      if (prazo > prazoMaximoBanco) {
        resultadosBancos[bancoKey] = {
          erro: `Este banco permite prazo máximo de ${prazoMaximoBanco} meses para sua idade`
        };
        return;
      }

      // Verificar se o financiamento está dentro dos limites do banco (60% máximo)
      const percentualFinanciamento = valorFinanciado / valor;
      if (percentualFinanciamento > 0.6) {
        resultadosBancos[bancoKey] = {
          erro: `Este banco financia no máximo 60% do valor do imóvel`
        };
        return;
      }

      // Calcular parcelas (sempre PRICE)
      const parcelas = calcularTabelaPrice(valorFinanciado, taxaMensal, prazo, bancoKey, idadeInt, valor, tipoImovel);

      const primeiraParcela = parcelas[0];
      const ultimaParcela = parcelas[parcelas.length - 1];
      const totalPago = parcelas.reduce((sum, p) => sum + p.parcela, 0);
      const totalJuros = parcelas.reduce((sum, p) => sum + p.juros, 0);
      const totalSeguros = parcelas.reduce((sum, p) => sum + p.seguroMIP + p.seguroDFI, 0);

      // Calcular CET
      const cetInfo = calcularCETRegulamentar(valorFinanciado, parcelas, taxaAnual);

      // Verificar compatibilidade com renda (30% da renda)
      const comprometimentoRenda = (primeiraParcela.parcela / rendaTotal) * 100;
      const aprovado = comprometimentoRenda <= 30;

      resultadosBancos[bancoKey] = {
        banco: banco.nome,
        cor: banco.cor,
        logo: banco.logo,
        taxaJuros: taxaAnual,
        primeiraParcela: primeiraParcela.parcela,
        ultimaParcela: ultimaParcela.parcela,
        totalPago: totalPago,
        totalJuros: totalJuros,
        totalSeguros: totalSeguros,
        cetAnual: cetInfo.cetAnual,
        comprometimentoRenda: comprometimentoRenda,
        aprovado: aprovado,
        observacao: banco.observacaoEspecial,
        valorFinanciado: valorFinanciado,
        valorEntrada: valorEntrada,
        parcelas: parcelas.length,
        sistemaAdaptado: sistemaAdaptado,
        sistemaUsado: chaveIndexador
      };

      tabelasBanco[bancoKey] = parcelas;
    });

    setResultados(resultadosBancos);
    setTabelasAmortizacao(tabelasBanco);
    setMostrarResultados(true);

    // Rolar para a seção de resultados
    setTimeout(() => {
      scroller.scrollTo('resultados', {
        duration: 800,
        delay: 0,
        smooth: 'easeInOutQuart'
      });
    }, 100);
  };

  // Função para visualizar tabela de amortização
  const visualizarTabela = (bancoKey) => {
    setTabelaAtual({
      banco: bancoKey,
      dados: tabelasAmortizacao[bancoKey],
      nome: BANCOS_CONFIG[bancoKey].nome
    });
    setMostrarTabela(true);
  };

  // Função para fechar card individual
  const fecharCard = (codigoBanco) => {
    const novosResultados = { ...resultados };
    delete novosResultados[codigoBanco];
    
    // Remove a seleção do banco correspondente
    const novosBancosEscolhidos = bancosEscolhidos.filter(banco => banco !== codigoBanco);
    setBancosEscolhidos(novosBancosEscolhidos);
    
    // Se não sobrar nenhum card, reset completo da página
    if (Object.keys(novosResultados).length === 0) {
      setResultados({});
      setTabelasAmortizacao({});
      setMostrarResultados(false);
    } else {
      setResultados(novosResultados);
      
      // Remove também da tabela de amortização
      const novasTabelasAmortizacao = { ...tabelasAmortizacao };
      delete novasTabelasAmortizacao[codigoBanco];
      setTabelasAmortizacao(novasTabelasAmortizacao);
    }
  };

  // Função para gerar PDF
  const gerarPDF = async (bancoKey = null) => {
    console.log('Iniciando geração de PDF...', { bancoKey, resultados });
    
    // Verificar se há dados para gerar o PDF
    if (!resultados || Object.keys(resultados).length === 0) {
      alert('Execute uma simulação antes de gerar o PDF.');
      return;
    }
    
    // Verificar se há incompatibilidade de correção monetária
    const temIncompatibilidade = Object.values(resultados || {}).some(r => r.sistemaAdaptado);
    
    if (temIncompatibilidade) {
      const confirmar = window.confirm(
        '⚠️ ATENÇÃO - CORREÇÃO MONETÁRIA\n\n' +
        'Alguns bancos da simulação foram adaptados automaticamente:\n\n' +
        '• Itaú e Santander: Trabalham principalmente com TR\n' +
        '• Bari, Galleria e Inter: Trabalham principalmente com IPCA\n\n' +
        'As taxas e condições apresentadas podem variar conforme a correção monetária disponível em cada banco.\n\n' +
        'Deseja continuar com o download do relatório?'
      );
      
      if (!confirmar) return;
    }
    
    try {
      console.log('Criando documento PDF...');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Configurações de cores (seguindo padrão do SimuladorFinanciamento)
      const corVentusHub = '#001f3f';
      const rgbVentusHub = hexToRgb(corVentusHub);
      
      const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      const formatPercent = (value) => {
        return `${value.toFixed(2)}%`;
      };

      // Carregar logo VentusHub com dimensões
      let logoVentusHubData = null;
      
      try {
        console.log('Carregando logo...');
        logoVentusHubData = await imageToBase64(logoVentusHub);
        console.log('Logo carregado com sucesso');
      } catch (error) {
        console.warn('Erro ao carregar logo VentusHub:', error);
      }
      
      // PÁGINA 1 - CONFORME WIREFRAME DO SIMULADOR FINANCIAMENTO
      
      // Cabeçalho branco (sem cor de fundo)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Logo do Bari + Título centralizado (preto sobre fundo branco)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      
      // Calcular posição para centralizar logo + texto
      const textoTitulo = 'SIMULAÇÃO DE FINANCIAMENTO CGI';
      const larguraTexto = doc.getTextWidth(textoTitulo);
      const logoWidth = 25; // Largura estimada da logo
      const espacoEntreLogo = 5;
      const larguraTotal = logoWidth + espacoEntreLogo + larguraTexto;
      const inicioX = (pageWidth - larguraTotal) / 2;
      
      // Adicionar logo do Bari
      try {
        const logoData = await imageToBase64(logoBari);
        const logoHeight = 15;
        const logoWidthReal = logoHeight * logoData.aspectRatio;
        doc.addImage(logoData.dataUrl, 'PNG', inicioX, 12, logoWidthReal, logoHeight, undefined, 'FAST');
        
        // Texto ao lado da logo
        doc.text(textoTitulo, inicioX + logoWidthReal + espacoEntreLogo, 20);
      } catch (error) {
        console.warn('Erro ao carregar logo do Bari:', error);
        // Fallback: apenas o texto centralizado
        doc.text(textoTitulo, pageWidth/2, 20, { align: 'center' });
      }
      
      // Faixa azul VentusHub
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, 35, pageWidth, 8, 'F');
      
      // Logo VentusHub na faixa azul (direita)
      if (logoVentusHubData) {
        try {
          const alturaFaixa = 6;
          const larguraFaixa = alturaFaixa * logoVentusHubData.aspectRatio;
          doc.addImage(logoVentusHubData.dataUrl, 'PNG', pageWidth - larguraFaixa - 10, 36, larguraFaixa, alturaFaixa, undefined, 'FAST');
        } catch (error) {
          // Fallback texto se logo não carregar
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('ventus', pageWidth - 25, 40, { align: 'center' });
        }
      }
      
      doc.setTextColor(0, 0, 0);
      let currentY = 60;
      
      // Dados da simulação (seguindo estrutura do SimuladorFinanciamento)
      const valor = limparFormatacao(valorImovel);
      const valorFinanciado = limparFormatacao(valorFinanciamento);
      const valorEntrada = valor - valorFinanciado;
      const percentualEntrada = ((valorEntrada / valor) * 100).toFixed(1);
      const prazo = parseInt(prazoMeses);
      
      // Resumo (seguindo estilo do SimuladorFinanciamento)
      // Buscar dados do primeiro banco para taxa e CET (assumindo que é sempre Bari)
      const primeiroBanco = Object.keys(resultados)[0];
      const dadosPrimeiroBanco = resultados[primeiroBanco];
      
      const resumoData = [
        ['Tipo do Imóvel', tipoImovel === 'residencial' ? 'Residencial' : 'Comercial'],
        ['Valor do Imóvel', formatCurrency(valor)],
        ['Valor Financiado', formatCurrency(valorFinanciado)],
        ['Prazo', `${prazo} meses`],
        ['Sistema/Correção', tipoFinanciamento.replace('_', ' + ')],
        ['Taxa de juros efetivos', formatPercent(dadosPrimeiroBanco?.taxaJuros || 0) + ' a.a.'],
        ['CET', formatPercent(dadosPrimeiroBanco?.cetAnual || 0) + ' a.a.']
      ];
      
      // Desenhar título manualmente sem tabela para o cabeçalho
      const tituloY = currentY;
      const larguraTitulo = 180;
      const alturaTitulo = 20;
      
      // Desenhar fundo azul para o título
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(16, tituloY, larguraTitulo, alturaTitulo, 'F');
      
      // Desenhar borda
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.rect(16, tituloY, larguraTitulo, alturaTitulo, 'S');
      
      // Texto do título centralizado
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('QUADRO RESUMO DA SIMULAÇÃO', 16 + larguraTitulo / 2, tituloY + alturaTitulo / 2 + 2, { align: 'center' });
      
      // Ajustar currentY para a tabela de dados
      currentY += alturaTitulo;
      
      // Tabela apenas com os dados (sem cabeçalho)
      autoTable(doc, {
        startY: currentY,
        body: resumoData,
        theme: 'grid',
        bodyStyles: {
          fontSize: 10,
          textColor: 50
        },
        alternateRowStyles: { fillColor: '#f8f9fa' },
        styles: { 
          fontSize: 10,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'normal', cellWidth: 100 },
          1: { halign: 'right', fontStyle: 'normal', cellWidth: 80 }
        },
        margin: { left: 16, right: 5 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Verificar se precisa de nova página para resultados
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }
      
      // Aviso importante sobre IPCA para bancos específicos
      const bancosIPCA = ['bari', 'galleria', 'inter'];
      const bancosParaPDF = bancoKey ? [bancoKey] : Object.keys(resultados);
      const temBancoIPCA = bancosParaPDF.some(key => bancosIPCA.includes(key) && resultados[key] && !resultados[key].erro);
      
      if (temBancoIPCA) {
        // Calcular altura necessária para o bloco de aviso
        const margemLateral = 16;
        const larguraBloco = pageWidth - (margemLateral * 2);
        const alturaBloco = 35; // Altura suficiente para todo o conteúdo
        
        // Desenhar retângulo amarelo de fundo
        doc.setFillColor(255, 235, 59); // Amarelo
        doc.rect(margemLateral, currentY - 2, larguraBloco, alturaBloco, 'F');
        
        // Desenhar borda preta
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(margemLateral, currentY - 2, larguraBloco, alturaBloco, 'S');
        
        // Configurar texto preto
        doc.setTextColor(0, 0, 0); // Preto
        
        // Ícone de exclamação simulado com círculo e texto
        const iconeX = margemLateral + 8;
        const iconeY = currentY + 6;
        
        // Desenhar círculo do ícone
        doc.setFillColor(0, 0, 0); // Preto
        doc.circle(iconeX, iconeY, 3, 'F');
        
        // Desenhar exclamação branca no círculo
        doc.setTextColor(255, 255, 255); // Branco para o !
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('!', iconeX, iconeY + 1, { align: 'center' });
        
        // Voltar para texto preto
        doc.setTextColor(0, 0, 0);
        
        // Título do aviso
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMAÇÃO IMPORTANTE - CORREÇÃO IPCA', iconeX + 8, currentY + 8);
        
        // Conteúdo do aviso
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const textoCompleto = 'Os valores apresentados para este banco NÃO inclui a projeção do IPCA atual na correção monetária das parcelas. Importante: As parcelas reais podem ser maiores devido à variação do IPCA. Consulte sempre as condições atualizadas diretamente com o banco.';
        
        // Quebrar texto para caber na largura do bloco
        const linhasTexto = doc.splitTextToSize(textoCompleto, larguraBloco - 10);
        
        let yTexto = currentY + 18;
        linhasTexto.forEach(linha => {
          doc.text(linha, margemLateral + 5, yTexto);
          yTexto += 4;
        });
        
        // Ajustar posição Y após o bloco
        currentY += alturaBloco + 10;
        
        // Resetar cor do texto para preto
        doc.setTextColor(0, 0, 0);
      }
      
      // Resultados por banco (seguindo estrutura do SimuladorFinanciamento)
      if (resultados) {
        
        const bancosParaPDF = bancoKey ? [bancoKey] : Object.keys(resultados);
        
        for (const key of bancosParaPDF) {
          const resultado = resultados[key];
          
          if (resultado.erro) continue;
          
          // Verificar se precisa de nova página
          if (currentY > pageHeight - 80) {
            doc.addPage();
            currentY = 20;
          }
          
          // Definir cor do banco para as tabelas
          const corBanco = resultado.cor ? hexToRgb(resultado.cor) : rgbVentusHub;
          
          // Verificar se precisa de nova página para tabela de parcelas
          if (currentY > pageHeight - 100) {
            doc.addPage();
            currentY = 20;
          }
          
          // Preparar dados das parcelas (todas as parcelas)
          let parcelasData = [];
          
          // Buscar parcelas na tabela de amortização
          const parcelasArray = tabelasAmortizacao && tabelasAmortizacao[key] ? tabelasAmortizacao[key] : null;
          
          if (Array.isArray(parcelasArray) && parcelasArray.length > 0) {
            parcelasData = parcelasArray.map(parcela => [
              parcela.numero.toString(),
              formatCurrency(parcela.parcela || 0),
              formatCurrency(parcela.amortizacao || 0),
              formatCurrency(parcela.juros || 0),
              formatCurrency(parcela.seguroMIP || 0),
              formatCurrency(parcela.seguroDFI || 0),
              formatCurrency(parcela.saldoDevedor || 0)
            ]);
          } else {
            console.warn('Parcelas não encontradas para o banco:', key);
            // Gerar tabela básica se não houver parcelas detalhadas
            const prazoNum = parseInt(prazo) || 240;
            const valorParcela = resultado.primeiraParcela || 0;
            for (let i = 1; i <= Math.min(prazoNum, 12); i++) { // Mostrar apenas 12 primeiras se não houver dados
              parcelasData.push([
                i.toString(),
                formatCurrency(valorParcela),
                formatCurrency(0),
                formatCurrency(0), 
                formatCurrency(0),
                formatCurrency(0),
                formatCurrency(0)
              ]);
            }
          }
          
          // Tabela completa de parcelas PRICE (seguindo padrão SimuladorFinanciamento)
          if (parcelasData.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('TABELA DE AMORTIZAÇÃO COMPLETA', 16, currentY);
            currentY += 5;
          
          autoTable(doc, {
            startY: currentY,
            head: [['Parcela', 'Prestação', 'Amortização', 'Juros', 'Seguro MIP', 'Seguro DFI', 'Saldo Devedor']],
            body: parcelasData,
            theme: 'grid',
            headStyles: { 
              fillColor: [0, 0, 0], // Preto sólido
              textColor: 255, // Branco
              fontSize: 8,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 7,
              textColor: 50
            },
            alternateRowStyles: { fillColor: '#f8f9fa' },
            styles: { 
              fontSize: 7,
              cellPadding: 2,
              lineColor: [200, 200, 200],
              lineWidth: 0.1
            },
            columnStyles: {
              0: { halign: 'center', cellWidth: 20 },
              1: { halign: 'right', cellWidth: 25 },
              2: { halign: 'right', cellWidth: 25 },
              3: { halign: 'right', cellWidth: 25 },
              4: { halign: 'right', cellWidth: 25 },
              5: { halign: 'right', cellWidth: 25 },
              6: { halign: 'right', cellWidth: 30 }
            },
            margin: { left: 16, right: 5 }
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 10;
          } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text('Tabela de parcelas não disponível para este banco.', 16, currentY);
            currentY += 10;
          }
          
          // Observação se existir
          if (resultado.observacao) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const observacaoLinhas = doc.splitTextToSize(resultado.observacao, pageWidth - 40);
            doc.text(observacaoLinhas, 16, currentY);
            currentY += observacaoLinhas.length * 4 + 5;
          }
        }
      }
      
      // Rodapé (seguindo padrão SimuladorFinanciamento)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('VentusHub - Sistema de Gestão Imobiliária', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      
      // Salvar PDF
      const nomeArquivo = bancoKey 
        ? `simulacao-cgi-${BANCOS_CONFIG[bancoKey].nome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        : `simulacao-cgi-completa-${new Date().toISOString().split('T')[0]}.pdf`;
      
      console.log('Salvando PDF:', nomeArquivo);
      doc.save(nomeArquivo);
      console.log('PDF gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      console.error('Stack trace:', error.stack);
      alert(`Erro ao gerar PDF: ${error.message}. Verifique o console para mais detalhes.`);
    }
  };

  // Função para gerar PDF comparativo
  const gerarPDFComparativo = async () => {
    try {
      // Verificar se há pelo menos 2 bancos nos resultados
      const bancosComResultado = Object.entries(resultados).filter(([_, resultado]) => !resultado.erro);
      if (bancosComResultado.length < 2) {
        alert('É necessário ter pelo menos 2 bancos com resultados válidos para gerar o comparativo.');
        return;
      }

      const doc = new jsPDF('portrait');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      const corVentusHub = '#001f3f';
      const rgbVentusHub = hexToRgb(corVentusHub);
      
      const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      const formatPercent = (value) => {
        return `${value.toFixed(2)}%`;
      };

      // Dados da simulação
      const valor = limparFormatacao(valorImovel);
      const valorFinanciado = limparFormatacao(valorFinanciamento);
      const prazo = parseInt(prazoMeses);
      
      // Filtrar e ordenar bancos por primeira parcela
      const bancosParaComparar = bancosComResultado
        .sort(([_, a], [__, b]) => a.primeiraParcela - b.primeiraParcela);
      
      // Carregar logo VentusHub
      let logoVentusHubData = null;
      try {
        logoVentusHubData = await imageToBase64(logoVentusHub);
      } catch (error) {
        console.warn('Erro ao carregar logo VentusHub:', error);
      }
      
      // Cabeçalho VentusHub
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo VentusHub
      if (logoVentusHubData) {
        const logoWidth = 25;
        const logoHeight = logoWidth / logoVentusHubData.aspectRatio;
        const logoY = 12.5 - (logoHeight / 2);
        doc.addImage(logoVentusHubData.dataUrl, 'PNG', 15, logoY, logoWidth, logoHeight);
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const titleX = 15 + 25 + 10;
      doc.text('COMPARATIVO DE FINANCIAMENTO CGI', titleX, 16, { align: 'left' });
      
      let currentY = 40;
      
      // Texto introdutório
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Comparativo entre bancos para financiamento com garantia de imóvel próprio (CGI).', 15, currentY);
      doc.text('Os valores apresentados são estimativas baseadas nos dados informados.', 15, currentY + 5);
      
      currentY += 20;
      
      // Seção de resultados
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultado da simulação:', 15, currentY);
      
      currentY += 15;
      
      // Tabela comparativa
      const headerComparativo = ['Item', ...bancosParaComparar.map(([_, resultado]) => resultado.banco)];
      
      const linhasComparativo = [
        ['Valor do imóvel', ...bancosParaComparar.map(() => formatCurrency(valor))],
        ['Valor financiado', ...bancosParaComparar.map(([_, r]) => formatCurrency(r.valorFinanciado))],
        ['Primeira parcela', ...bancosParaComparar.map(([_, r]) => formatCurrency(r.primeiraParcela))],
        ['Taxa de juros', ...bancosParaComparar.map(([_, r]) => formatPercent(r.taxaJuros) + ' a.a.')],
        ['Sistema/Correção', ...bancosParaComparar.map(() => tipoFinanciamento.replace('_', ' + '))],
        ['CET', ...bancosParaComparar.map(([_, r]) => formatPercent(r.cetAnual) + ' a.a.')],
        ['Total pago', ...bancosParaComparar.map(([_, r]) => formatCurrency(r.totalPago))],
        ['Prazo', ...bancosParaComparar.map(() => prazo + ' meses')],
        ['Comprometimento', ...bancosParaComparar.map(([_, r]) => formatPercent(r.comprometimentoRenda))]
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [headerComparativo],
        body: linhasComparativo,
        theme: 'grid',
        headStyles: {
          fillColor: [rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 50
        },
        alternateRowStyles: { fillColor: '#f8f9fa' },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
          ...Object.fromEntries(
            bancosParaComparar.map((_, index) => [
              index + 1,
              { halign: 'right', cellWidth: (pageWidth - 60) / bancosParaComparar.length }
            ])
          )
        },
        margin: { left: 15, right: 15 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Observações importantes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações importantes:', 15, currentY);
      
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const observacoes = [
        '• Esta é uma simulação baseada nos dados informados.',
        '• Apenas o banco pode aprovar ou negar um crédito após análise completa.',
        '• Taxas e condições podem variar conforme relacionamento bancário.',
        '• Para bancos IPCA: parcelas podem variar conforme índice de correção.',
        '• CGI: Crédito com Garantia de Imóvel permite financiar até 60% do valor do imóvel.'
      ];
      
      observacoes.forEach(obs => {
        doc.text(obs, 15, currentY);
        currentY += 5;
      });
      
      // Rodapé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('VentusHub - Sistema de Gestão Imobiliária', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Salvar PDF
      const nomeArquivo = `comparativo-cgi-${bancosParaComparar.length}-bancos-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('Erro ao gerar PDF comparativo:', error);
      alert(`Erro ao gerar PDF comparativo: ${error.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
            <Calculator className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Simulador de Financiamento CGI</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Simule seu financiamento com as melhores condições do mercado
            </p>
          </div>
        </div>
      </div>
      {/* Seleção de Bancos */}  
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Escolha os Bancos para Comparar
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Selecione um ou mais bancos para ver as condições específicas de cada um</p>
        </div>

        <div className="p-6">
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={toggleAllBancos}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              {bancosEscolhidos.length === Object.keys(BANCOS_CONFIG).length ? "Desmarcar Todos" : "Marcar Todos"}
            </button>
          </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(BANCOS_CONFIG)
                .sort(([, a], [, b]) => a.nome.localeCompare(b.nome))
                .map(([codigo, config]) => (
                <div
                  key={codigo}
                  onClick={() => toggleBanco(codigo)}
                  className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all ${
                    bancosEscolhidos.includes(codigo)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-card'
                  }`}
                >
                  {bancosEscolhidos.includes(codigo) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="mb-3 flex justify-center">
                      {config.logo ? (
                        <img 
                          src={config.logo}
                          alt={`Logo ${config.nome}`}
                          className="w-[100px] h-16 object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-[100px] h-16 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: config.cor, display: config.logo ? 'none' : 'flex' }}
                      >
                        {config.nome}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.nome}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Formulário - só aparece quando há bancos selecionados */}
      <Element name="formulario">
        {bancosEscolhidos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Building className="h-5 w-5 mr-2 text-blue-600" />
              Dados Básicos do Financiamento
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Estes são os dados básicos solicitados por todos os bancos</p>
          </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo do Imóvel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Home className="h-4 w-4 inline mr-1" />
                      Tipo do Imóvel
                    </label>
                    <select
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={tipoImovel}
                      onChange={(e) => setTipoImovel(e.target.value)}
                    >
                      <option value="residencial">Residencial</option>
                      <option value="comercial">Comercial</option>
                    </select>
                  </div>


                  {/* Valor do Imóvel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Home className="h-4 w-4 inline mr-1" />
                      Valor do Imóvel (mín. R$ 100.000)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="500.000,00"
                        value={valorImovel}
                        onChange={(e) => {
                          // Formatar como moeda durante a digitação
                          const valorFormatado = formatarMoedaDigitacao(e.target.value);
                          setValorImovel(valorFormatado);
                          
                          // Auto-ajustar valor do financiamento para 60% do valor do imóvel
                          const valorNumerico = limparFormatacao(valorFormatado);
                          if (valorNumerico > 0) {
                            const maxFinanciamento = valorNumerico * 0.6;
                            const financiamentoFormatado = formatarMoedaDigitacao((maxFinanciamento * 100).toString());
                            setValorFinanciamento(financiamentoFormatado);
                          } else if (valorFormatado === '') {
                            setValorFinanciamento('');
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Valor do Financiamento Desejado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Valor do Financiamento Desejado
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="400.000,00"
                        value={valorFinanciamento}
                        onChange={(e) => {
                          // Formatar como moeda durante a digitação
                          const valorFormatado = formatarMoedaDigitacao(e.target.value);
                          const valorNumerico = limparFormatacao(valorFormatado);
                          const maxFinanciamento = limparFormatacao(valorImovel) * 0.6;
                          
                          if (valorNumerico <= maxFinanciamento || valorFormatado === '') {
                            setValorFinanciamento(valorFormatado);
                          }
                        }}
                      />
                    </div>
                    {valorImovel && (
                      <p className="text-xs text-gray-500 mt-1">
                        Máximo: {formatarMoeda(limparFormatacao(valorImovel) * 0.6)} (60% do valor do imóvel)
                      </p>
                    )}
                  </div>

                  {/* Renda Bruta Familiar Comprovada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      Renda Bruta Familiar Comprovada
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10.000,00"
                        value={rendaBruta}
                        onChange={(e) => {
                          const valorFormatado = formatarMoedaDigitacao(e.target.value);
                          setRendaBruta(valorFormatado);
                        }}
                      />
                    </div>
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="dd/mm/aaaa"
                      value={dataNascimento}
                      onChange={(e) => {
                        setDataNascimento(e.target.value);
                        
                        // Auto-preencher prazo máximo baseado na idade
                        if (e.target.value) {
                          const prazoMaximo = calcularPrazoMaximo(e.target.value);
                          setPrazoMeses(prazoMaximo.toString());
                        } else {
                          setPrazoMeses('');
                        }
                      }}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                      min={new Date(new Date().setFullYear(new Date().getFullYear() - 75)).toISOString().split('T')[0]}
                    />
                    {dataNascimento && (
                      <p className="text-xs text-gray-500 mt-1">
                        Idade: {calcularIdade(dataNascimento)} anos - Prazo máximo: {calcularPrazoMaximo(dataNascimento)} meses
                      </p>
                    )}
                  </div>

                  {/* Prazo Desejado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Prazo Desejado (máx. 240 meses)
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-1 py-2 px-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="240"
                        min="12"
                        max={dataNascimento ? calcularPrazoMaximo(dataNascimento) : 240}
                        value={prazoMeses}
                        onChange={(e) => setPrazoMeses(e.target.value)}
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600 text-sm">
                        meses
                      </span>
                    </div>
                    {dataNascimento && (
                      <p className="text-xs text-gray-500 mt-1">
                        Prazo máximo permitido para sua idade: {calcularPrazoMaximo(dataNascimento)} meses
                      </p>
                    )}
                  </div>

                  {/* Sistema/Correção */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      Sistema/Correção
                    </label>
                    <select
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={tipoFinanciamento}
                      onChange={(e) => setTipoFinanciamento(e.target.value)}
                    >
                      <option value="PRICE_TR">PRICE + TR</option>
                      <option value="PRICE_IPCA">PRICE + IPCA</option>
                    </select>
                  </div>
                </div>


                {/* Botões de Ação */}
                <div className="border-t pt-6">
                  <button
                    onClick={calcularSimulacao}
                    disabled={bancosEscolhidos.length === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                  >
                    <Calculator className="h-5 w-5" />
                    <span>Simular {bancosEscolhidos.length} Banco(s) Selecionado(s)</span>
                  </button>
                </div>

                {/* Mensagem de Erro */}
                {erro && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
                  >
                    <div className="bg-red-100 rounded-full p-1">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                    <p className="text-red-700 text-sm">{erro}</p>
                  </motion.div>
                )}
          </div>
        </div>
        )}
      </Element>

      {/* Seção de Resultados */}
      <Element name="resultados">
        <AnimatePresence>
          {mostrarResultados && resultados && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Resultados da Simulação
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Compare as opções disponíveis</p>
                </div>

                  <div className="p-6">
                    {/* Cabeçalho do Comparativo */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">📊 Comparativo de Resultados</h3>
                    </div>
                    
                    {/* Aviso importante e botão PDF */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex-1 mr-4">
                        <strong>💡 Importante:</strong> Esta é uma simulação baseada nos dados informados. Apenas o banco pode aprovar ou negar um crédito após análise completa da documentação e perfil do cliente.
                      </div>
                      <button
                        onClick={() => gerarPDFComparativo()}
                        disabled={Object.keys(resultados).length < 2}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <FileDown className="h-4 w-4" />
                        PDF Comparativo
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                      {Object.entries(resultados).map(([bancoKey, resultado]) => (
                        <motion.div
                          key={bancoKey}
                          initial={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9, x: -100 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          layout
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative"
                          style={{borderLeftColor: resultado.cor, borderLeftWidth: '4px'}}
                        >
                          {resultado.erro ? (
                            <div className="text-center">
                              <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                <X className="h-6 w-6 text-red-600" />
                              </div>
                              <h3 className="font-semibold text-red-900 mb-2">{resultado.banco}</h3>
                              <p className="text-sm text-red-700">{resultado.erro}</p>
                            </div>
                          ) : (
                            <>
                              {/* Botões X e PDF */}
                              <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                  onClick={() => fecharCard(bancoKey)}
                                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                  title="Fechar card"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => gerarPDF(bancoKey)}
                                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                  title="Gerar PDF individual"
                                >
                                  <FileDown className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex items-center gap-3 mb-4 pr-20">
                                {resultado.logo ? (
                                  <img 
                                    src={resultado.logo} 
                                    alt={resultado.banco}
                                    className="h-8 object-contain"
                                  />
                                ) : (
                                  <div 
                                    className="h-8 w-16 rounded flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: resultado.cor }}
                                  >
                                    {resultado.banco}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-semibold">{resultado.banco}</h4>
                                  {resultado.aprovado ? (
                                    <span className="text-green-600 text-sm">✅ Cenário favorável</span>
                                  ) : (
                                    <span className="text-red-600 text-sm">❌ Não atende critérios</span>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span>Valor financiado:</span>
                                  <strong>{formatarMoeda(resultado.valorFinanciado)}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Primeira parcela:</span>
                                  <strong className={resultado.aprovado ? 'text-green-600' : 'text-red-600'}>
                                    {formatarMoeda(resultado.primeiraParcela)}
                                  </strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Taxa de juros:</span>
                                  <strong>{formatarPorcentagem(resultado.taxaJuros)} a.a.</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Sistema:</span>
                                  <strong>{tipoFinanciamento.replace('_', ' + ')}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>CET:</span>
                                  <strong>{formatarPorcentagem(resultado.cetAnual)} a.a.</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total pago:</span>
                                  <strong>{formatarMoeda(resultado.totalPago)}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Prazo:</span>
                                  <strong>{resultado.prazo || prazoMeses} meses</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>Comprometimento:</span>
                                  <strong className={resultado.comprometimentoRenda <= 30 ? 'text-green-600' : 'text-red-600'}>
                                    {formatarPorcentagem(resultado.comprometimentoRenda)} da renda
                                  </strong>
                                </div>
                              </div>

                              {resultado.observacao && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                                  <strong>💡</strong> {resultado.observacao}
                                </div>
                              )}

                              {resultado.sistemaAdaptado && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-xs text-yellow-700 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Sistema adaptado para {resultado.sistemaUsado.replace('_', ' + ')}
                                  </p>
                                </div>
                              )}

                              {!resultado.aprovado && (
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <p className="text-xs text-orange-700 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Parcela compromete {formatarPorcentagem(resultado.comprometimentoRenda)} da renda (máx. 30%)
                                  </p>
                                </div>
                              )}

                              <div className="mt-4">
                                <button
                                  onClick={() => visualizarTabela(bancoKey)}
                                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>Ver Tabela de Amortização</span>
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                      </AnimatePresence>
                    </div>

                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Element>


      {/* Modal de Tabela de Amortização */}
      <AnimatePresence>
        {mostrarTabela && tabelaAtual && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-black px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Tabela de Amortização - {tabelaAtual.nome}
                </h2>
                <button
                  onClick={() => setMostrarTabela(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Parcela</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Valor Total</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Principal</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Juros</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Amortização</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Seguro MIP</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Seguro DFI</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-900">Saldo Devedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabelaAtual.dados.map((parcela, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 text-gray-900">{parcela.numero}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatarMoeda(parcela.parcela)}</td>
                          <td className="px-4 py-2 text-right">{formatarMoeda(parcela.principal)}</td>
                          <td className="px-4 py-2 text-right text-red-600">{formatarMoeda(parcela.juros)}</td>
                          <td className="px-4 py-2 text-right text-blue-600">{formatarMoeda(parcela.amortizacao)}</td>
                          <td className="px-4 py-2 text-right text-orange-600">{formatarMoeda(parcela.seguroMIP)}</td>
                          <td className="px-4 py-2 text-right text-purple-600">{formatarMoeda(parcela.seguroDFI)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatarMoeda(parcela.saldoDevedor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => gerarPDF(tabelaAtual.banco)}
                    className="bg-green-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Download className="h-5 w-5" />
                    <span>Baixar Tabela (PDF)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SimuladorCGI;
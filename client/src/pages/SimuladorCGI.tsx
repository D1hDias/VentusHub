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
    cor: "#E67E22",
    logo: logoBari,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Taxa de juros pode variar de acordo com o seu relacionamento com o banco e o prazo escolhido.",
    taxas: {
      SAC_TR: 14.25,
      PRICE_TR: 14.55,
      SAC_POUPANCA: 13.65
    },
    seguros: {
      mip: { 18: 0.009, 30: 0.009, 40: 0.013, 50: 0.019, 60: 0.027, 70: 0.037, 80: 0.047 },
      dfi: { residencial: 0.00015, comercial: 0.00025 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
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
      SAC_TR: 13.25,
      PRICE_TR: 13.55,
      SAC_POUPANCA: 12.65
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
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
      SAC_TR: 12.95,
      PRICE_TR: 13.25,
      SAC_POUPANCA: 12.35
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
    }
  },
  galleria: {
    nome: "Galleria",
    cor: "#8E44AD",
    logo: logoGalleria,
    financiamentoMax: 0.60,
    entradaMin: 0.40,
    prazoMaximoEspecial: 240,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      SAC_TR: 13.75,
      PRICE_TR: 14.05,
      SAC_POUPANCA: 13.15
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.75 },
      PRICE_TR: { financiamentoMax: 0.70 },
      SAC_POUPANCA: { financiamentoMax: 0.65 }
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
      SAC_TR: 13.50,
      PRICE_TR: 13.80,
      SAC_POUPANCA: 12.90
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 },
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 },
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
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
function calcularSeguros(banco, idade, valorFinanciado, tipoImovel = 'residencial') {
  const config = BANCOS_CONFIG[banco];
  if (!config) return { mip: 0, dfi: 0 };
  
  let seguroMIP = 0;
  let seguroDFI = 0;
  
  // Calcular MIP (Morte e Invalidez Permanente)
  if (Array.isArray(config.seguros.mip)) {
    // Para bancos com faixas de idade (como Bradesco)
    const faixaIdade = config.seguros.mip.find(faixa => 
      idade >= faixa.idadeMin && idade <= faixa.idadeMax
    );
    if (faixaIdade) {
      seguroMIP = valorFinanciado * faixaIdade.aliquota;
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
    
    seguroMIP = valorFinanciado * config.seguros.mip[idadeAplicavel];
  }
  
  // Calcular DFI (Danos Físicos do Imóvel)
  seguroDFI = valorFinanciado * config.seguros.dfi[tipoImovel];
  
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
    const seguros = calcularSeguros(banco, idade, saldoDevedor, tipoImovel);
    const seguroMensalMIP = seguros.mip / 12;
    const seguroMensalDFI = seguros.dfi / 12;
    
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
    const seguros = calcularSeguros(banco, idade, saldoDevedor, tipoImovel);
    const seguroMensalMIP = seguros.mip / 12;
    const seguroMensalDFI = seguros.dfi / 12;
    
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
  const [nomeCliente, setNomeCliente] = useState('');
  const [nomeConjuge, setNomeConjuge] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfConjuge, setCpfConjuge] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [enderecoImovel, setEnderecoImovel] = useState('');
  const [cidadeImovel, setCidadeImovel] = useState('');
  const [estadoImovel, setEstadoImovel] = useState('');
  const [cepImovel, setCepImovel] = useState('');

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

  // Estado para o modal de dados pessoais
  const [mostrarModalDados, setMostrarModalDados] = useState(false);

  // Função para alternar seleção de banco
  const toggleBanco = (codigoBanco) => {
    setBancosEscolhidos(prev => {
      const novosBancos = prev.includes(codigoBanco) 
        ? prev.filter(b => b !== codigoBanco)
        : [...prev, codigoBanco];
      
      return novosBancos;
    });
  };

  // Função para selecionar/desselecionar todos os bancos
  const toggleAllBancos = () => {
    if (bancosEscolhidos.length === Object.keys(BANCOS_CONFIG).length) {
      setBancosEscolhidos([]);
    } else {
      setBancosEscolhidos(Object.keys(BANCOS_CONFIG));
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
    
    if (bancoKey === 'inter') {
      return Math.min(180, prazoMaximo);
    }
    
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
      const chaveIndexador = `PRICE_${indexador}`;  // Sempre usar PRICE
      const taxaAnual = banco.taxas[chaveIndexador];
      
      if (!taxaAnual) return;

      const taxaMensal = Math.pow(1 + taxaAnual / 100, 1/12) - 1;

      // Verificar prazo máximo específico do banco
      const prazoMaximoBanco = bancoKey === 'inter' ? 
        Math.min(180, calcularPrazoMaximo(dataNascimento)) : 
        calcularPrazoMaximo(dataNascimento);

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
        parcelas: parcelas.length
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

  // Função para gerar PDF
  const gerarPDF = async (bancoKey = null) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Configurações de cores
      const corPrimaria = hexToRgb('#001F3F');
      const corSecundaria = hexToRgb('#0066CC');
      
      // Cabeçalho com logo
      try {
        const logoData = await imageToBase64(logoVentusHub);
        const logoHeight = 15;
        const logoWidth = logoHeight * logoData.aspectRatio;
        doc.addImage(logoData.dataUrl, 'PNG', 20, 15, logoWidth, logoHeight);
      } catch (error) {
        console.warn('Erro ao carregar logo:', error);
      }
      
      // Título
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(corPrimaria.r, corPrimaria.g, corPrimaria.b);
      doc.text('Simulação de Financiamento CGI', pageWidth / 2, 25, { align: 'center' });
      
      // Informações da simulação
      let yPos = 45;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(corSecundaria.r, corSecundaria.g, corSecundaria.b);
      doc.text('DADOS DA SIMULAÇÃO', 20, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const valor = limparFormatacao(valorImovel);
      const entrada = parseFloat(percentualEntrada) / 100;
      const valorEntrada = valor * entrada;
      const valorFinanciado = valor - valorEntrada;
      
      const dadosSimulacao = [
        ['Valor do Imóvel:', formatarMoeda(valor)],
        ['Entrada:', `${formatarMoeda(valorEntrada)} (${percentualEntrada}%)`],
        ['Valor Financiado:', formatarMoeda(valorFinanciado)],
        ['Prazo:', `${prazoMeses} meses`],
        ['Sistema:', sistema],
        ['Indexador:', indexador],
        ['Tipo do Imóvel:', tipoImovel === 'residencial' ? 'Residencial' : 'Comercial']
      ];
      
      dadosSimulacao.forEach(([label, value]) => {
        doc.text(label, 20, yPos);
        doc.text(value, 80, yPos);
        yPos += 7;
      });
      
      yPos += 10;
      
      // Dados pessoais se fornecidos
      if (nomeCliente || email || telefone) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(corSecundaria.r, corSecundaria.g, corSecundaria.b);
        doc.text('DADOS PESSOAIS', 20, yPos);
        yPos += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        if (nomeCliente) {
          doc.text('Nome:', 20, yPos);
          doc.text(nomeCliente, 80, yPos);
          yPos += 7;
        }
        
        if (email) {
          doc.text('E-mail:', 20, yPos);
          doc.text(email, 80, yPos);
          yPos += 7;
        }
        
        if (telefone) {
          doc.text('Telefone:', 20, yPos);
          doc.text(telefone, 80, yPos);
          yPos += 7;
        }
        
        yPos += 10;
      }
      
      // Resultados por banco
      if (resultados) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(corSecundaria.r, corSecundaria.g, corSecundaria.b);
        doc.text('RESULTADOS DA SIMULAÇÃO', 20, yPos);
        yPos += 15;
        
        const bancosParaPDF = bancoKey ? [bancoKey] : Object.keys(resultados);
        
        for (const key of bancosParaPDF) {
          const resultado = resultados[key];
          
          if (resultado.erro) continue;
          
          // Verificar se precisa de nova página
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
          }
          
          // Nome do banco
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(corSecundaria.r, corSecundaria.g, corSecundaria.b);
          doc.text(resultado.banco, 20, yPos);
          yPos += 10;
          
          // Logo do banco se disponível
          if (resultado.logo) {
            try {
              const logoData = await imageToBase64(resultado.logo);
              const logoHeight = 12;
              const logoWidth = logoHeight * logoData.aspectRatio;
              doc.addImage(logoData.dataUrl, 'PNG', pageWidth - logoWidth - 20, yPos - 15, logoWidth, logoHeight);
            } catch (error) {
              console.warn('Erro ao carregar logo do banco:', error);
            }
          }
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          const dadosBanco = [
            ['Taxa de Juros:', formatarPorcentagem(resultado.taxaJuros)],
            ['CET (a.a.):', formatarPorcentagem(resultado.cetAnual)],
            ['Primeira Parcela:', formatarMoeda(resultado.primeiraParcela)],
            ['Última Parcela:', formatarMoeda(resultado.ultimaParcela)],
            ['Total Pago:', formatarMoeda(resultado.totalPago)],
            ['Total Juros:', formatarMoeda(resultado.totalJuros)],
            ['Total Seguros:', formatarMoeda(resultado.totalSeguros)],
            ['Comprometimento:', formatarPorcentagem(resultado.comprometimentoRenda)],
            ['Status:', resultado.aprovado ? 'Pré-aprovado' : 'Acima de 30% da renda']
          ];
          
          dadosBanco.forEach(([label, value]) => {
            doc.text(label, 25, yPos);
            doc.text(value, 85, yPos);
            yPos += 6;
          });
          
          if (resultado.observacao) {
            yPos += 3;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            const observacaoLinhas = doc.splitTextToSize(resultado.observacao, pageWidth - 40);
            doc.text(observacaoLinhas, 25, yPos);
            yPos += observacaoLinhas.length * 4;
          }
          
          yPos += 10;
        }
      }
      
      // Rodapé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('VentusHub - Sistema de Gestão Imobiliária', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      
      // Salvar PDF
      const nomeArquivo = bancoKey 
        ? `simulacao-cgi-${BANCOS_CONFIG[bancoKey].nome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        : `simulacao-cgi-completa-${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(nomeArquivo);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
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

                  {/* Opção de Financiamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="h-4 w-4 inline mr-1" />
                      Opção de Financiamento
                    </label>
                    <select
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value="imovel-pronto"
                      disabled
                    >
                      <option value="imovel-pronto">Imóvel Pronto</option>
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
                        value={formatarEntradaMoeda(valorImovel)}
                        onChange={(e) => {
                          setValorImovel(e.target.value);
                          // Auto-ajustar valor do financiamento para 60% do valor do imóvel
                          const valor = limparFormatacao(e.target.value);
                          if (valor > 0) {
                            const maxFinanciamento = valor * 0.6;
                            setValorFinanciamento(formatarEntradaMoeda(maxFinanciamento.toString()));
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
                        value={formatarEntradaMoeda(valorFinanciamento)}
                        onChange={(e) => {
                          const valor = limparFormatacao(e.target.value);
                          const maxFinanciamento = limparFormatacao(valorImovel) * 0.6;
                          if (valor <= maxFinanciamento) {
                            setValorFinanciamento(e.target.value);
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
                        value={formatarEntradaMoeda(rendaBruta)}
                        onChange={(e) => setRendaBruta(e.target.value)}
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
                      onChange={(e) => setDataNascimento(e.target.value)}
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
                      <option value="PRICE_SAC">PRICE + SAC</option>
                    </select>
                  </div>
                </div>


                {/* Botões de Ação */}
                <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={calcularSimulacao}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Calculator className="h-5 w-5" />
                    <span>Calcular Simulação</span>
                  </button>

                  <button
                    onClick={() => setMostrarModalDados(true)}
                    className="bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <User className="h-5 w-5" />
                    <span>Dados para Relatório</span>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Object.entries(resultados).map(([bancoKey, resultado]) => (
                        <motion.div
                          key={bancoKey}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                            resultado.aprovado 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50'
                          }`}
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
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
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
                                  <h3 className="font-semibold text-gray-900">{resultado.banco}</h3>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  resultado.aprovado 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {resultado.aprovado ? 'Pré-aprovado' : 'Acima 30%'}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Taxa de Juros:</span>
                                  <span className="font-medium">{formatarPorcentagem(resultado.taxaJuros)} a.a.</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">CET:</span>
                                  <span className="font-medium">{formatarPorcentagem(resultado.cetAnual)} a.a.</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">1ª Parcela:</span>
                                  <span className="font-medium text-lg">{formatarMoeda(resultado.primeiraParcela)}</span>
                                </div>

                                {sistema === 'SAC' && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Última Parcela:</span>
                                    <span className="font-medium">{formatarMoeda(resultado.ultimaParcela)}</span>
                                  </div>
                                )}

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Total Pago:</span>
                                  <span className="font-medium">{formatarMoeda(resultado.totalPago)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Total Juros:</span>
                                  <span className="font-medium text-red-600">{formatarMoeda(resultado.totalJuros)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Comprometimento:</span>
                                  <span className={`font-medium ${
                                    resultado.comprometimentoRenda <= 30 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatarPorcentagem(resultado.comprometimentoRenda)}
                                  </span>
                                </div>
                              </div>

                              {resultado.observacao && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-xs text-blue-700">{resultado.observacao}</p>
                                </div>
                              )}

                              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => visualizarTabela(bancoKey)}
                                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>Ver Tabela</span>
                                </button>
                                <button
                                  onClick={() => gerarPDF(bancoKey)}
                                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Botão para gerar PDF completo */}
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => gerarPDF()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-8 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <FileDown className="h-5 w-5" />
                        <span>Baixar Relatório Completo (PDF)</span>
                      </button>
                    </div>
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Element>

      {/* Modal de Dados Pessoais */}
      <AnimatePresence>
        {mostrarModalDados && (
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
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Dados para Relatório
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Dados Pessoais do Titular */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Titular</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="João da Silva"
                        value={nomeCliente}
                        onChange={(e) => setNomeCliente(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                      <input
                        type="email"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="joao@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Dados do Cônjuge */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Cônjuge (opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Maria da Silva"
                        value={nomeConjuge}
                        onChange={(e) => setNomeConjuge(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CPF</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="000.000.000-00"
                        value={cpfConjuge}
                        onChange={(e) => setCpfConjuge(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço Residencial */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Endereço Residencial
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Rua das Flores, 123, Apto 45"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="São Paulo"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                      >
                        <option value="">Selecione o estado</option>
                        {ESTADOS_BRASIL.map((est) => (
                          <option key={est.sigla} value={est.sigla}>{est.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço do Imóvel */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Home className="h-5 w-5 mr-2 text-blue-600" />
                    Endereço do Imóvel
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Rua dos Sonhos, 456, Casa 2"
                        value={enderecoImovel}
                        onChange={(e) => setEnderecoImovel(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="São Paulo"
                        value={cidadeImovel}
                        onChange={(e) => setCidadeImovel(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={estadoImovel}
                        onChange={(e) => setEstadoImovel(e.target.value)}
                      >
                        <option value="">Selecione o estado</option>
                        {ESTADOS_BRASIL.map((est) => (
                          <option key={est.sigla} value={est.sigla}>{est.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                      <input
                        type="text"
                        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="00000-000"
                        value={cepImovel}
                        onChange={(e) => setCepImovel(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="border-t pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setMostrarModalDados(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Salvar e Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
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
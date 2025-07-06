import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Download, Building, CreditCard, FileText, TrendingUp, Home, DollarSign, Calendar, Shield, Info, User, MapPin, Check, FileDown, X } from "lucide-react";
import { scroller, Element } from 'react-scroll';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  bb: {
    nome: "Banco do Brasil",
    cor: "#FFD700",
    logo: "/src/assets/logo-bb.png",
    financiamentoMax: 0.80,
    entradaMin: 0.20,
    prazoMaximoEspecial: 360,
    observacaoEspecial: "Taxa de juros pode variar de acordo com o seu relacionamento com o banco e o prazo escolhido. Quando menor o prazo, menor a taxa de juros.",
    taxas: {
      SAC_TR: 15.45,
      PRICE_TR: 15.75,
      SAC_POUPANCA: 14.85
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
  bradesco: {
    nome: "Bradesco",
    cor: "#CC0000",
    logo: "/src/assets/logo-bradesco.png",
    financiamentoMax: 0.70,
    entradaMin: 0.30,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      SAC_TR: 13.50,
      PRICE_TR: 13.80,
      SAC_POUPANCA: 12.90
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0001568 }, // R$ 65,86 mensal para R$ 420k financiado (24 anos)
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0001819 }, // R$ 72,92 mensal para R$ 401k financiado (34 anos)  
        { idadeMin: 56, idadeMax: 80, aliquota: 0.001782 }   // R$ 748,27 mensal para R$ 420k financiado (64 anos)
      ],
      dfi: { residencial: 0.000066, comercial: 0.000066 } // R$ 33,00 mensal para R$ 500k imóvel
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.70 },
      PRICE_TR: { financiamentoMax: 0.65 },
      SAC_POUPANCA: { financiamentoMax: 0.60 }
    }
  },
  brb: {
    nome: "BRB",
    cor: "#0066CC",
    logo: "/src/assets/logo-brb.png",
    financiamentoMax: 0.80,
    entradaMin: 0.20,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      SAC_TR: 12.00,
      PRICE_TR: 12.30,
      SAC_POUPANCA: 11.40
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.000143 }, // R$ 68,74 mensal para R$ 480k financiado (24 anos)
        { idadeMin: 36, idadeMax: 43, aliquota: 0.0001615 }, // R$ 77,53 mensal para R$ 480k financiado (34 anos)
        { idadeMin: 44, idadeMax: 53, aliquota: 0.0002664 }, // R$ 127,86 mensal para R$ 480k financiado (44 anos)
        { idadeMin: 54, idadeMax: 63, aliquota: 0.0007136 }, // R$ 342,53 mensal para R$ 480k financiado (54 anos)
        { idadeMin: 64, idadeMax: 80, aliquota: 0.001677 } // R$ 804,83 mensal para R$ 480k financiado (64 anos)
      ],
      dfi: { residencial: 0.0001207, comercial: 0.0001207 } // R$ 60,36 mensal para R$ 500k imóvel (dados oficiais)
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
    }
  },
  caixa: {
    nome: "Caixa",
    cor: "#0066CC",
    logo: "/src/assets/logo-caixa.png",
    financiamentoMax: 0.70,
    entradaMin: 0.30,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco, sistema de amortização e correção.",
    taxas: {
      SAC_TR: 10.62, // Taxa mensal de 0.8769% equivale a 10.62% ao ano
      PRICE_TR: 10.92,
      SAC_POUPANCA: 10.02
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.0002785 }, // R$ 116,97 mensal para R$ 420k financiado (24 anos - dados oficiais)
        { idadeMin: 36, idadeMax: 50, aliquota: 0.000346 }, // R$ 145,19 mensal para R$ 420k financiado (44 anos - dados oficiais)
        { idadeMin: 51, idadeMax: 60, aliquota: 0.000859 }, // R$ 360,98 mensal para R$ 420k financiado (54 anos - dados oficiais)
        { idadeMin: 61, idadeMax: 80, aliquota: 0.002902 } // R$ 1.218,68 mensal para R$ 420k financiado (64 anos - dados oficiais)
      ],
      dfi: { residencial: 0.00003, comercial: 0.00003 } // Valor mínimo para DFI
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.70 },
      PRICE_TR: { financiamentoMax: 0.70 },
      SAC_POUPANCA: { financiamentoMax: 0.60 }
    }
  },
  inter: {
    nome: "Inter",
    cor: "#FF6600",
    logo: "/src/assets/logo-inter.png",
    financiamentoMax: 0.75,
    entradaMin: 0.25,
    observacao: "Inter não trabalha com correção TR. Financiamentos apenas com IPCA.",
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco, sistema de amortização e correção.",
    taxas: {
      SAC_IPCA: 9.50,
      PRICE_IPCA: 9.80,
      SAC_TR: null,
      PRICE_TR: null,
      SAC_POUPANCA: null
    },
    seguros: {
      mip: { 18: 0.009, 30: 0.009, 40: 0.014, 50: 0.021, 60: 0.029, 70: 0.039, 80: 0.049 },
      dfi: { residencial: 0.00016, comercial: 0.00026 }
    },
    regrasEspeciais: {
      SAC_IPCA: { financiamentoMax: 0.75 },
      PRICE_IPCA: { financiamentoMax: 0.70 },
      SAC_TR: { financiamentoMax: 0 },
      PRICE_TR: { financiamentoMax: 0 },
      SAC_POUPANCA: { financiamentoMax: 0 }
    }
  },
  itau: {
    nome: "Itaú",
    cor: "#EC7000",
    logo: "/src/assets/logo-itau.png",
    financiamentoMax: 0.80,
    entradaMin: 0.20,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      SAC_TR: 12.39,
      PRICE_TR: 12.69,
      SAC_POUPANCA: 11.79
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.000273 }, // R$ 109,20 mensal para R$ 400k financiado
        { idadeMin: 36, idadeMax: 55, aliquota: 0.000592 }, // R$ 236,68 mensal para R$ 400k financiado (47 anos)
        { idadeMin: 56, idadeMax: 65, aliquota: 0.001539 }, // R$ 615,76 mensal para R$ 400k financiado (57 anos)
        { idadeMin: 66, idadeMax: 80, aliquota: 0.003663 }  // R$ 1.465,28 mensal para R$ 400k financiado (67 anos)
      ],
      dfi: { residencial: 0.0000554, comercial: 0.0000554 } // R$ 27,70 mensal para R$ 500k imóvel
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
    }
  },
  santander: {
    nome: "Santander",
    cor: "#EC0000",
    logo: "/src/assets/logo-santander.png",
    financiamentoMax: 0.80,
    entradaMin: 0.20,
    observacaoEspecial: "Percentual de financiamento e taxa de juros podem variar de acordo com o seu relacionamento com o banco.",
    taxas: {
      SAC_TR: 13.69,
      PRICE_TR: 13.99,
      SAC_POUPANCA: 13.09
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 35, aliquota: 0.00017 }, // R$ 81,60 mensal para R$ 480k financiado (24 anos)
        { idadeMin: 36, idadeMax: 55, aliquota: 0.0004 }, // R$ 192,00 mensal para R$ 480k financiado (44 anos)
        { idadeMin: 56, idadeMax: 80, aliquota: 0.00384 }  // R$ 1.843,20 mensal para R$ 480k financiado (65 anos)
      ],
      dfi: { residencial: 0.00006, comercial: 0.00006 } // R$ 30,00 mensal para R$ 500k imóvel
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
    }
  }
};

// Configurações específicas para Minha Casa Minha Vida
const BANCOS_MCMV_CONFIG = {
  caixa_mcmv: {
    nome: "Caixa Econômica Federal",
    cor: "#0066CC",
    logo: "/src/assets/logo-caixa.png",
    financiamentoMax: 0.90,
    entradaMin: 0.10,
    observacaoEspecial: "Taxas especiais do programa Minha Casa Minha Vida. Condições diferenciadas para famílias de baixa renda.",
    taxas: {
      SAC_TR: 5.00,
      PRICE_TR: 5.25,
      SAC_POUPANCA: 4.75
    },
    seguros: {
      mip: [
        { idadeMin: 18, idadeMax: 80, aliquota: 0.00025 }
      ],
      dfi: { residencial: 0.00008, comercial: 0.00008 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.90 },
      PRICE_TR: { financiamentoMax: 0.85 },
      SAC_POUPANCA: { financiamentoMax: 0.80 }
    }
  },
  bb_mcmv: {
    nome: "Banco do Brasil",
    cor: "#FFD700",
    logo: "/src/assets/logo-bb.png",
    financiamentoMax: 0.90,
    entradaMin: 0.10,
    prazoMaximoEspecial: 360,
    observacaoEspecial: "Taxas especiais do programa Minha Casa Minha Vida com condições facilitadas.",
    taxas: {
      SAC_TR: 5.50,
      PRICE_TR: 5.75,
      SAC_POUPANCA: 5.25
    },
    seguros: {
      mip: { 18: 0.005, 30: 0.005, 40: 0.007, 50: 0.009, 60: 0.012, 70: 0.015, 80: 0.018 },
      dfi: { residencial: 0.0001, comercial: 0.00015 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.90 },
      PRICE_TR: { financiamentoMax: 0.85 },
      SAC_POUPANCA: { financiamentoMax: 0.80 }
    }
  }
};

export default function SimuladorComparativo() {
  const [bancosEscolhidos, setBancosEscolhidos] = useState([]);
  const [formData, setFormData] = useState({
    tipoImovel: 'residencial',
    opcaoFinanciamento: 'imovel_pronto',
    valorImovel: '',
    valorFinanciamento: '',
    rendaBrutaFamiliar: '',
    dataNascimento: '',
    prazoDesejado: '',
    sistemaAmortizacao: 'SAC_TR',
    financiarITBI: 'nao'
  });

  const [dadosCalculados, setDadosCalculados] = useState({
    idade: 0,
    prazoMaximo: 420,
    valorEntrada: 0,
    capacidadePagamento: 0
  });

  const [prazoValido, setPrazoValido] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [minhaCasaMinhaVida, setMinhaCasaMinhaVida] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [relatorioContent, setRelatorioContent] = useState('');
  const [resultados, setResultados] = useState({});

  // Helper para obter configuração correta dos bancos
  const getBancosConfig = () => minhaCasaMinhaVida ? BANCOS_MCMV_CONFIG : BANCOS_CONFIG;

  // Limpar bancos selecionados quando toggle muda
  useEffect(() => {
    setBancosEscolhidos([]);
  }, [minhaCasaMinhaVida]);

  // Calcular idade e prazo máximo baseado na data de nascimento
  const calcularIdadePrazoMaximo = (dataNasc, bancoCodigo = null) => {
    if (!dataNasc) return { idade: 0, prazoMaximo: 420 };
    
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    const mesNasc = nascimento.getMonth();
    const diaNasc = nascimento.getDate();
    
    if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
      idade--;
    }
    
    const idadeMaximaQuitacao = 80;
    
    // Verificar se é Banco do Brasil com limite especial
    const limiteBB = bancoCodigo === 'bb' ? 360 : 420;
    let prazoMaximo = limiteBB;
    
    if (idade > 45 || (idade === 45 && (mesAtual > mesNasc || (mesAtual === mesNasc && diaAtual >= diaNasc)))) {
      const dataLimite = new Date(nascimento.getFullYear() + idadeMaximaQuitacao, nascimento.getMonth(), nascimento.getDate());
      const diffMeses = (dataLimite.getFullYear() - hoje.getFullYear()) * 12 + (dataLimite.getMonth() - hoje.getMonth());
      
      if (hoje.getDate() > dataLimite.getDate()) {
        prazoMaximo = Math.max(2, diffMeses - 1);
      } else {
        prazoMaximo = Math.max(2, diffMeses);
      }
    }
    
    return { idade, prazoMaximo: Math.min(limiteBB, Math.max(2, prazoMaximo)) };
  };

  // Atualizar dados calculados
  useEffect(() => {
    const { idade, prazoMaximo } = calcularIdadePrazoMaximo(formData.dataNascimento);
    const valorImovel = parseFloat(formData.valorImovel.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const valorFinanciamento = parseFloat(formData.valorFinanciamento.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const valorEntrada = valorImovel - valorFinanciamento;
    const rendaFamiliar = parseFloat(formData.rendaBrutaFamiliar.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const capacidadePagamento = rendaFamiliar * 0.30;
    
    setDadosCalculados({
      idade,
      prazoMaximo,
      valorEntrada,
      capacidadePagamento
    });

    // Sempre definir o prazo como máximo quando a data de nascimento for preenchida
    if (formData.dataNascimento && prazoMaximo > 0) {
      setFormData(prev => ({ ...prev, prazoDesejado: prazoMaximo.toString() }));
      setPrazoValido(true);
    }

    if (formData.prazoDesejado) {
      const prazo = parseInt(formData.prazoDesejado);
      const prazoMaximoPermitido = Math.min(420, prazoMaximo);
      if (isNaN(prazo) || prazo < 2 || prazo > prazoMaximoPermitido) {
        setPrazoValido(false);
      } else {
        setPrazoValido(true);
      }
    }
  }, [formData.dataNascimento, formData.valorImovel, formData.valorFinanciamento, formData.rendaBrutaFamiliar]);

  const obterAliquotaMIP = (configBanco, idade) => {
    // Verifica se o banco usa o novo formato de alíquotas MIP (array)
    if (Array.isArray(configBanco.seguros.mip)) {
      // Novo formato: busca pela faixa etária
      for (const faixa of configBanco.seguros.mip) {
        if (idade >= faixa.idadeMin && idade <= faixa.idadeMax) {
          return faixa.aliquota;
        }
      }
      // Se não encontrou, usa a primeira faixa (mais jovem)
      return configBanco.seguros.mip[0].aliquota;
    } else {
      // Formato antigo: mantém compatibilidade com Inter e BB
      const faixas = Object.keys(configBanco.seguros.mip).map(Number).sort((a, b) => a - b);
      for (let i = faixas.length - 1; i >= 0; i--) {
        if (idade >= faixas[i]) {
          return configBanco.seguros.mip[faixas[i]];
        }
      }
      return configBanco.seguros.mip[18];
    }
  };

  const validarPrazo = (valor) => {
    const prazo = parseInt(valor);
    const prazoMaximoPermitido = Math.min(420, dadosCalculados.prazoMaximo);
    
    if (isNaN(prazo) || prazo < 2 || prazo > prazoMaximoPermitido) {
      setPrazoValido(false);
      return false;
    }
    setPrazoValido(true);
    return true;
  };

  const handleInputChange = (field, value) => {
    if (field === 'valorImovel' || field === 'valorFinanciamento' || field === 'rendaBrutaFamiliar') {
      const numericValue = value.replace(/[^\d]/g, '');
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue / 100);
      setFormData({...formData, [field]: formattedValue});
    } else if (field === 'prazoDesejado') {
      const numericValue = value.replace(/[^\d]/g, '');
      validarPrazo(numericValue);
      setFormData({...formData, [field]: numericValue});
    } else {
      setFormData({...formData, [field]: value});
    }
  };

  const calcularFinanciamentoBanco = (codigoBanco) => {
    const configBanco = getBancosConfig()[codigoBanco];
    const valorImovel = parseFloat(formData.valorImovel.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    let valorFinanciamento = parseFloat(formData.valorFinanciamento.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const prazo = parseInt(formData.prazoDesejado);
    
    // Verificar prazo máximo específico do BB
    const { prazoMaximo: prazoMaximoEspecifico } = calcularIdadePrazoMaximo(formData.dataNascimento, codigoBanco);
    
    const taxaJurosAnual = configBanco.taxas[formData.sistemaAmortizacao];
    
    if (taxaJurosAnual === null || taxaJurosAnual === undefined) {
      return { 
        banco: configBanco.nome, 
        cor: configBanco.cor,
        logo: configBanco.logo,
        erros: [`${configBanco.nome} não oferece ${formData.sistemaAmortizacao.replace('_', ' + ')}`], 
        aprovado: false 
      };
    }
    
    const regrasEspeciais = configBanco.regrasEspeciais[formData.sistemaAmortizacao] || {};
    
    // Percentuais fixos por tipo de imóvel
    const percentualMaximo = formData.tipoImovel === 'comercial' ? 0.70 : 0.80;
    const financiamentoMaxPermitido = Math.min(
      (regrasEspeciais.financiamentoMax || configBanco.financiamentoMax) * valorImovel,
      percentualMaximo * valorImovel
    );
    
    const percentualFinanciamento = valorFinanciamento / valorImovel;
    const percentualSolicitado = percentualFinanciamento * 100;
    const percentualMaximoBanco = Math.min(
      (regrasEspeciais.financiamentoMax || configBanco.financiamentoMax) * 100,
      percentualMaximo * 100
    );
    
    let valorFinanciamentoAjustado = valorFinanciamento;
    let mensagemAjuste = null;
    
    // Se excede o limite, ajustar para o máximo do banco
    if (valorFinanciamento > financiamentoMaxPermitido) {
      valorFinanciamentoAjustado = financiamentoMaxPermitido;
      mensagemAjuste = `Foi simulado ${percentualMaximoBanco}% pois o ${configBanco.nome}, neste momento, não financia percentual superior do imóvel.`;
    }
    
    const erros = [];
    
    // Verificar prazo específico do BB
    if (codigoBanco === 'bb' && prazo > prazoMaximoEspecifico) {
      erros.push(`${configBanco.nome}: Prazo máximo ${prazoMaximoEspecifico} meses`);
    }
    
    if (erros.length > 0) {
      return { 
        banco: configBanco.nome, 
        cor: configBanco.cor,
        logo: configBanco.logo,
        erros, 
        aprovado: false 
      };
    }
    
    // Usar valor ajustado para cálculos
    valorFinanciamento = valorFinanciamentoAjustado;

    const aliquotaITBI = formData.tipoImovel === 'comercial' ? 0.03 : 0.02;
    const valorITBI = valorImovel * aliquotaITBI;
    const custosCartorio = valorImovel * 0.015;
    const custosAdicionais = formData.financiarITBI === 'sim' ? valorITBI + custosCartorio : 0;
    
    const valorTotalFinanciamento = valorFinanciamento + custosAdicionais;
    const taxaMensal = Math.pow(1 + taxaJurosAnual / 100, 1/12) - 1; // Taxa efetiva mensal
    const aliquotaMIP = obterAliquotaMIP(configBanco, dadosCalculados.idade);
    const seguroDFI = valorImovel * configBanco.seguros.dfi[formData.tipoImovel];
    const tac = 0.00; // TAC removida conforme solicitado

    let parcelas = [];
    let totalJuros = 0;
    let totalSeguros = 0;
    let totalTAC = 0;
    const isSAC = formData.sistemaAmortizacao.includes('SAC');
    
    if (isSAC) {
      const amortizacaoMensal = valorTotalFinanciamento / prazo;
      let saldoDevedor = valorTotalFinanciamento;

      for (let i = 1; i <= prazo; i++) {
        const juros = saldoDevedor * taxaMensal;
        const seguroMIP = saldoDevedor * aliquotaMIP;
        const prestacao = amortizacaoMensal + juros + seguroMIP + seguroDFI;
        
        totalJuros += juros;
        totalSeguros += seguroMIP + seguroDFI;
        // totalTAC += tac; // TAC removida
        
        parcelas.push({
          parcela: i,
          prestacao,
          amortizacao: amortizacaoMensal,
          juros,
          seguroMIP,
          seguroDFI,
          tac: 0, // TAC removida
          saldoDevedor: Math.max(0, saldoDevedor - amortizacaoMensal)
        });
        
        saldoDevedor -= amortizacaoMensal;
      }
    } else {
      const prestacaoBase = valorTotalFinanciamento * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1);
      let saldoDevedor = valorTotalFinanciamento;

      for (let i = 1; i <= prazo; i++) {
        const juros = saldoDevedor * taxaMensal;
        const amortizacao = prestacaoBase - juros;
        const seguroMIP = saldoDevedor * aliquotaMIP;
        const prestacao = prestacaoBase + seguroMIP + seguroDFI;
        
        totalJuros += juros;
        totalSeguros += seguroMIP + seguroDFI;
        // totalTAC += tac; // TAC removida
        
        parcelas.push({
          parcela: i,
          prestacao,
          amortizacao,
          juros,
          seguroMIP,
          seguroDFI,
          tac: 0, // TAC removida
          saldoDevedor: Math.max(0, saldoDevedor - amortizacao)
        });
        
        saldoDevedor -= amortizacao;
      }
    }

    const totalPago = valorTotalFinanciamento + totalJuros + totalSeguros; // + totalTAC removido
    
    // Calcular CET conforme padrão bancário (Taxa de Juros + CESH)
    const resultadoCET = calcularCETRegulamentar(valorTotalFinanciamento, parcelas, taxaJurosAnual);
    const cet = resultadoCET.sucesso ? resultadoCET.cetAnual : taxaJurosAnual;
    const primeiraParcela = parcelas[0].prestacao;
    const aprovadoCapacidade = primeiraParcela <= dadosCalculados.capacidadePagamento;

    return {
      banco: configBanco.nome,
      cor: configBanco.cor,
      logo: configBanco.logo,
      aprovado: true,
      aprovadoCapacidade,
      valorTotalFinanciamento,
      valorFinanciamentoReal: valorFinanciamento,
      custosAdicionais,
      valorITBI,
      custosCartorio,
      primeiraParcela,
      ultimaParcela: parcelas[parcelas.length - 1].prestacao,
      totalJuros,
      totalSeguros,
      totalTAC,
      totalPago,
      cet,
      taxaJurosAnual,
      seguroDFI,
      aliquotaMIP,
      percentualFinanciamento: (valorFinanciamento / valorImovel) * 100,
      percentualSolicitado,
      financiamentoMaxPermitido: (regrasEspeciais.financiamentoMax || configBanco.financiamentoMax) * 100,
      parcelas: parcelas,
      parcelasPrimeiros12: parcelas.slice(0, 12),
      sistemaUsado: formData.sistemaAmortizacao,
      observacao: configBanco.observacao,
      observacaoEspecial: configBanco.observacaoEspecial,
      mensagemAjuste
    };
  };

  const simularTodos = () => {
    const valorImovel = parseFloat(formData.valorImovel.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const valorFinanciamento = parseFloat(formData.valorFinanciamento.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const rendaFamiliar = parseFloat(formData.rendaBrutaFamiliar.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const prazo = parseInt(formData.prazoDesejado);
    const prazoMaximoPermitido = Math.min(420, dadosCalculados.prazoMaximo);
    
    if (valorImovel < 100000) {
      alert('Valor mínimo do imóvel: R$ 100.000,00');
      return;
    }
    
    if (valorFinanciamento <= 0 || valorFinanciamento >= valorImovel) {
      alert('Valor do financiamento deve ser maior que zero e menor que o valor do imóvel');
      return;
    }
    
    if (rendaFamiliar <= 0) {
      alert('Informe a renda bruta familiar');
      return;
    }
    
    if (!formData.dataNascimento) {
      alert('Informe a data de nascimento');
      return;
    }
    
    if (dadosCalculados.idade < 18) {
      alert('Idade mínima: 18 anos');
      return;
    }

    if (!prazoValido || isNaN(prazo) || prazo < 2 || prazo > prazoMaximoPermitido) {
      alert(`Digite um prazo válido entre 2 e ${prazoMaximoPermitido} meses para esta idade`);
      return;
    }

    const novosResultados = {};
    bancosEscolhidos.forEach(codigoBanco => {
      novosResultados[codigoBanco] = calcularFinanciamentoBanco(codigoBanco);
    });
    
    setResultados(novosResultados);
    
    // Scroll suave para os resultados após a simulação
    setTimeout(() => {
      scroller.scrollTo('results-section', {
        duration: 800,
        delay: 0,
        smooth: 'easeInOutQuart',
        offset: -20
      });
    }, 200);
  };

  const fecharCard = (codigoBanco) => {
    const novosResultados = { ...resultados };
    delete novosResultados[codigoBanco];
    
    // Remove a seleção do banco correspondente
    const novosBancosEscolhidos = bancosEscolhidos.filter(banco => banco !== codigoBanco);
    setBancosEscolhidos(novosBancosEscolhidos);
    
    // Se não sobrar nenhum card, reset completo da página
    if (Object.keys(novosResultados).length === 0) {
      setResultados({});
      // Scroll de volta ao topo da página
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 300);
    } else {
      setResultados(novosResultados);
    }
  };

  const gerarPDFIndividual = async (codigoBanco, resultado) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      const corPrimaria = resultado.cor;
      const corVentusHub = '#001f3f';
      const rgbPrimaria = hexToRgb(corPrimaria);
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

      // Carregar logos com dimensões
      let logoBanco = null;
      let logoVentusHub = null;
      
      try {
        logoBanco = await imageToBase64(resultado.logo);
      } catch (error) {
        console.warn('Erro ao carregar logo do banco:', error);
      }
      
      try {
        logoVentusHub = await imageToBase64('/src/assets/logo.png');
      } catch (error) {
        console.warn('Erro ao carregar logo VentusHub:', error);
      }

      // PÁGINA 1 - CONFORME WIREFRAME
      
      // Cabeçalho branco (sem cor de fundo)
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Logo do banco (esquerda, com cor do banco)
      if (logoBanco) {
        try {
          const alturaDesejada = 20;
          const larguraProporcional = alturaDesejada * logoBanco.aspectRatio;
          doc.addImage(logoBanco.dataUrl, 'PNG', 15, 8, larguraProporcional, alturaDesejada, undefined, 'FAST');
        } catch (error) {
          // Fallback: caixa com cor do banco
          doc.setFillColor(rgbPrimaria.r, rgbPrimaria.g, rgbPrimaria.b);
          doc.rect(15, 8, 35, 20, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('LOGO', 32.5, 15, { align: 'center' });
          doc.text('DO', 32.5, 19, { align: 'center' });
          doc.text('BANCO', 32.5, 23, { align: 'center' });
        }
      } else {
        // Caixa com cor do banco se logo não carregar
        doc.setFillColor(rgbPrimaria.r, rgbPrimaria.g, rgbPrimaria.b);
        doc.rect(15, 8, 35, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('LOGO', 32.5, 15, { align: 'center' });
        doc.text('DO', 32.5, 19, { align: 'center' });
        doc.text('BANCO', 32.5, 23, { align: 'center' });
      }
      
      // Título centralizado (preto sobre fundo branco)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`SIMULAÇÃO DE FINANCIAMENTO ${resultado.banco.toUpperCase()}`, pageWidth/2, 20, { align: 'center' });
      
      // Faixa azul VentusHub
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, 35, pageWidth, 8, 'F');
      
      // Logo VentusHub na faixa azul (direita)
      if (logoVentusHub) {
        try {
          const alturaFaixa = 6;
          const larguraFaixa = alturaFaixa * logoVentusHub.aspectRatio;
          doc.addImage(logoVentusHub.dataUrl, 'PNG', pageWidth - larguraFaixa - 10, 36, larguraFaixa, alturaFaixa, undefined, 'FAST');
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
      
      // Dados da simulação
      const valorImovel = parseFloat(formData.valorImovel.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const valorFinanciamento = parseFloat(formData.valorFinanciamento.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const rendaBrutaFamiliar = parseFloat(formData.rendaBrutaFamiliar.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const prazoDesejado = parseInt(formData.prazoDesejado);
      
      // Resumo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('QUADRO RESUMO DA SIMULAÇÃO', pageWidth/2, currentY, { align: 'center' });
      currentY += 10;
      
      // Usar CET regulamentar já calculado (conforme Resolução CMN 3.517/2007)
      const cetCorreto = resultado.cet;
      
      const resumoData = [
        ['Valor do Imóvel', formatCurrency(valorImovel)],
        ['Valor Financiado', formatCurrency(resultado.valorFinanciamentoReal)],
        ['Percentual Financiado', formatPercent(resultado.percentualFinanciamento)],
        ['Prazo', `${prazoDesejado} meses`],
        ['Sistema de Amortização', resultado.sistemaUsado.replace('_', ' + ')],
        ['Taxa de Juros', formatPercent(resultado.taxaJurosAnual) + ' a.a.'],
        ['CET', formatPercent(cetCorreto) + ' a.a.'],
        ['Primeira Parcela', formatCurrency(resultado.primeiraParcela)],
        ['Última Parcela', formatCurrency(resultado.ultimaParcela)],
        ['Total de Juros', formatCurrency(resultado.totalJuros)],
        ['Total de Seguros', formatCurrency(resultado.totalSeguros)],
        // ['Total de TAC', 'R$ 25,00'], // TAC removida
        ['Total Pago', formatCurrency(resultado.totalPago)]
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Valor']],
        body: resumoData,
        theme: 'grid',
        headStyles: { 
          fillColor: [rgbPrimaria.r, rgbPrimaria.g, rgbPrimaria.b], // Cor do banco no cabeçalho (era preto no wireframe)
          textColor: 255,
          fontSize: 14,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 14,
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
      
      // Verificar se precisa de nova página para tabela de parcelas
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }
      
      // Tabela completa de parcelas
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TABELA DE AMORTIZAÇÃO COMPLETA', 16, currentY,);
      currentY += 5;
      
      // Preparar dados das parcelas (todas as parcelas)
      const parcelasData = resultado.parcelas.map(parcela => [
        parcela.parcela.toString(),
        formatCurrency(parcela.prestacao),
        formatCurrency(parcela.amortizacao),
        formatCurrency(parcela.juros),
        formatCurrency(parcela.seguroMIP),
        formatCurrency(parcela.seguroDFI),
        // formatCurrency(parcela.tac), // TAC removida
        formatCurrency(parcela.saldoDevedor)
      ]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Parcela', 'Prestação', 'Amortização', 'Juros', 'Seguro MIP', 'Seguro DFI', 'Saldo Devedor']],
        body: parcelasData,
        theme: 'grid',
        headStyles: { 
          fillColor: [rgbPrimaria.r, rgbPrimaria.g, rgbPrimaria.b], // Cor do banco no cabeçalho (era preto no wireframe)
          textColor: 255, 
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: 50
        },
        alternateRowStyles: { fillColor: '#f8f9fa' },
        styles: { 
          fontSize: 9,
          cellPadding: 1.5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 18 },  // Parcela
          1: { halign: 'right', cellWidth: 30 },   // Prestação - ampliado
          2: { halign: 'right', cellWidth: 30 },   // Amortização - ampliado
          3: { halign: 'right', cellWidth: 30 },   // Juros - ampliado
          4: { halign: 'right', cellWidth: 25 },   // Seguro MIP - ampliado
          5: { halign: 'right', cellWidth: 25 },   // Seguro DFI - ampliado
          6: { halign: 'right', cellWidth: 30 }    // Saldo Devedor - ampliado para evitar quebra
        },
        margin: { left: 10, right: 5 }
      });
      
      // Observações importantes
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      if (resultado.observacao || resultado.observacaoEspecial) {
        // Verificar se precisa de nova página para observações
        if (finalY > pageHeight - 40) {
          doc.addPage();
          let observacaoY = 20;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('OBSERVAÇÕES IMPORTANTES', 15, observacaoY);
          observacaoY += 10;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          
          if (resultado.observacao) {
            const observacaoLines = doc.splitTextToSize(resultado.observacao, pageWidth - 30);
            doc.text(observacaoLines, 15, observacaoY);
            observacaoY += observacaoLines.length * 5 + 5;
          }
          
          if (resultado.observacaoEspecial) {
            const observacaoEspecialLines = doc.splitTextToSize(resultado.observacaoEspecial, pageWidth - 30);
            doc.text(observacaoEspecialLines, 15, observacaoY);
          }
        } else {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('OBSERVAÇÕES IMPORTANTES', 15, finalY);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          let obsY = finalY + 10;
          
          if (resultado.observacao) {
            const observacaoLines = doc.splitTextToSize(resultado.observacao, pageWidth - 30);
            doc.text(observacaoLines, 15, obsY);
            obsY += observacaoLines.length * 5 + 5;
          }
          
          if (resultado.observacaoEspecial) {
            const observacaoEspecialLines = doc.splitTextToSize(resultado.observacaoEspecial, pageWidth - 30);
            doc.text(observacaoEspecialLines, 15, obsY);
          }
        }
      }
      
      // Rodapé compactado na margem inferior
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Linha separadora mais próxima da margem
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
        
        // Textos do rodapé compactados
        doc.setFontSize(7);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        doc.text('Esta simulação é apenas uma estimativa. Consulte o banco para condições reais.', 15, pageHeight - 10);
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} por Ventus`, 15, pageHeight - 6);
        
        // Número da página (direita)
        doc.text(`Página ${i}/${totalPages}`, pageWidth - 15, pageHeight - 8, { align: 'right' });
      }
      
      // Salvar
      const fileName = `Simulacao_${resultado.banco.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF: ' + error.message);
    }
  };

  const gerarPDFComparativo = async () => {
    try {
      const doc = new jsPDF('portrait'); // Mudança para formato retrato
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
      const valorImovel = parseFloat(formData.valorImovel.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const valorFinanciamento = parseFloat(formData.valorFinanciamento.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const prazoDesejado = parseInt(formData.prazoDesejado);
      
      // Filtrar bancos aprovados
      const bancosAprovados = Object.entries(resultados)
        .filter(([_, resultado]) => resultado.aprovado)
        .sort(([_, a], [__, b]) => a.primeiraParcela - b.primeiraParcela);
      
      if (bancosAprovados.length === 0) {
        doc.setTextColor(255, 0, 0);
        doc.setFontSize(16);
        doc.text('Nenhum banco aprovado para os critérios informados', pageWidth/2, pageHeight/2, { align: 'center' });
        doc.save('Comparativo_Sem_Aprovacao.pdf');
        return;
      }

      // PÁGINA 1 - RESUMO COMPLETO CONFORME WIREFRAME
      
      // Carregar logo VentusHub primeiro
      let logoVentusHub = null;
      try {
        logoVentusHub = await imageToBase64('/src/assets/logo.png');
      } catch (error) {
        console.warn('Erro ao carregar logo VentusHub:', error);
      }
      
      // Cabeçalho VentusHub com logo
      doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Logo VentusHub centralizada verticalmente à esquerda
      if (logoVentusHub) {
        const logoWidth = 25; // Largura ajustada conforme solicitado
        const logoHeight = logoWidth / logoVentusHub.aspectRatio; // Altura proporcional
        const logoY = 12.5 - (logoHeight / 2); // Centralizar verticalmente no header (25px/2 = 12.5)
        doc.addImage(logoVentusHub.dataUrl, 'PNG', 15, logoY, logoWidth, logoHeight);
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      // Título alinhado à esquerda com margem de 10px da logo
      const titleX = 15 + 25 + 10; // posição logo + largura logo + margem 10px
      doc.text('COMPARATIVO DE FINANCIAMENTO HABITACIONAL', titleX, 16, { align: 'left' });
      
      let currentY = 40;
      
      // Texto introdutório (conforme wireframe - corrigido caracteres)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Ola! Somos a assessoria de credito imobiliario da VentusHub, nossa plataforma digital multibanco oferece um servico', 15, currentY);
      doc.text('de apoio especializado de forma pratica, rapida e descomplicada.', 15, currentY + 5);
      
      currentY += 20;
      
      // Carregar logos dos bancos
      const logosCarregados = {};
      for (const [codigoBanco, resultado] of bancosAprovados) {
        try {
          logosCarregados[codigoBanco] = await imageToBase64(resultado.logo);
        } catch (error) {
          console.warn(`Erro ao carregar logo do ${resultado.banco}:`, error);
        }
      }
      
      // Seção "Este é o resultado da sua simulação de crédito:" (corrigido caracteres)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Este e o resultado da sua simulacao de credito:', 15, currentY);
      
      currentY += 15;
      
      // Tabela comparativa principal (conforme wireframe)
      const headerComparativo = ['Bancos', ...bancosAprovados.map(([_, resultado]) => resultado.banco)];
      
      // Usar CET regulamentar já calculado para cada banco
      const bancosComCET = bancosAprovados.map(([codigoBanco, resultado]) => {
        return [codigoBanco, { ...resultado, cetCorreto: resultado.cet }];
      });
      
      const linhasComparativo = [
        ['Sistema de amortizacao', ...bancosComCET.map(([_, r]) => r.sistemaUsado.replace('_', ' + '))],
        ['Valor imovel', ...bancosComCET.map(([_, r]) => formatCurrency(valorImovel))],
        ['Valor financiamento', ...bancosComCET.map(([_, r]) => formatCurrency(r.valorFinanciamentoReal))],
        ['Primeira parcela', ...bancosComCET.map(([_, r]) => formatCurrency(r.primeiraParcela))],
        ['Ultima parcela', ...bancosComCET.map(([_, r]) => formatCurrency(r.ultimaParcela))],
        ['Taxa de juros', ...bancosComCET.map(([_, r]) => formatPercent(r.taxaJurosAnual))],
        ['Custo Efetivo Total (R$)', ...bancosComCET.map(([_, r]) => formatCurrency(r.totalPago))],
        ['Custo Efetivo Total (%)', ...bancosComCET.map(([_, r]) => formatPercent(r.cetCorreto))],
        ['Prazo em meses', ...bancosComCET.map(([_, r]) => prazoDesejado.toString())]
      ];
      
      // Logos dos bancos como imagens no cabeçalho
      const logoHeight = 12;
      const colunaWidth = (pageWidth - 80) / bancosAprovados.length;
      
      // Criar tabela sem logos primeiro (para ter fundo branco)
      autoTable(doc, {
        startY: currentY,
        head: [headerComparativo],
        body: linhasComparativo,
        theme: 'grid',
        headStyles: { 
          fillColor: [255, 255, 255], // Fundo branco para as logos
          textColor: [0, 0, 0], // Texto preto
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          minCellHeight: 18
        },
        bodyStyles: { 
          fontSize: 6,
          halign: 'center',
          textColor: 50
        },
        alternateRowStyles: { fillColor: '#f8f9fa' },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', fillColor: [230, 230, 230] }
        },
        styles: { 
          fontSize: 7,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        margin: { left: 5, right: 5 }
      });
      
      // Adicionar logos dos bancos manualmente - posicionamento direto nas colunas
      const totalTableWidth = pageWidth - 10; // Largura total da tabela (margens 5px cada lado)
      const firstColumnWidth = 70; // Largura estimada da primeira coluna "Bancos" (ajuste fino)
      const bankColumnsWidth = totalTableWidth - firstColumnWidth; // Largura restante para bancos
      const singleBankColumnWidth = bankColumnsWidth / bancosAprovados.length; // Largura de cada coluna de banco
      
      bancosAprovados.forEach(([codigoBanco, resultado], index) => {
        if (logosCarregados[codigoBanco]) {
          // Definir tamanho da logo do banco (menor que a do header)
          const bankLogoHeight = 10; // Altura menor para as logos dos bancos
          const bankLogoWidth = bankLogoHeight * logosCarregados[codigoBanco].aspectRatio;
          
          // Calcular posição centralizada na coluna do banco (ajuste para margens menores)
          const columnStartX = 5 + firstColumnWidth + (index * singleBankColumnWidth);
          const centerX = columnStartX + (singleBankColumnWidth / 2) - (bankLogoWidth / 2) + 1;
          const logoY = currentY + 4; // Posição Y dentro da célula do cabeçalho
          
          // Validar coordenadas antes de adicionar a imagem
          if (centerX >= 0 && logoY >= 0 && bankLogoWidth > 0 && bankLogoHeight > 0) {
            doc.addImage(logosCarregados[codigoBanco].dataUrl, 'PNG', centerX, logoY, bankLogoWidth, bankLogoHeight);
          } else {
            console.warn(`Coordenadas inválidas para logo ${resultado.banco}:`, { centerX, logoY, bankLogoWidth, bankLogoHeight });
          }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Observações importantes (conforme wireframe - corrigido caracteres)
      doc.setFillColor(255, 243, 205); // Fundo amarelo claro
      doc.rect(5, currentY, pageWidth - 10, 40, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('A renda media estimada para comportar o financiamento e de R$ 15.309,22, podendo haver mudancas', 15, currentY + 8);
      doc.text('nesse valor de acordo com cada instituicao financeira e perfil do cliente.', 15, currentY + 15);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('• Os resultados apresentados consistem em uma simulacao e nao valem como proposta;', 15, currentY + 25);
      doc.text('• Comparativo com base nas informacoes declaradas durante o processo de simulacao;', 15, currentY + 30);
      doc.text('• SAC: Parcelas decrescentes - comecam maiores e vao diminuindo. Amortizacao constante.', 15, currentY + 35);
      
      // PÁGINA 2 - TABELA DETALHADA DE PARCELAS
      doc.addPage();
      
      // Título da segunda página (corrigido caracteres)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Simulacao de financiamento - comparacao de parcelas', 15, 25);
      
      currentY = 40;
      
      // Tabela de parcelas (conforme wireframe)
      const maxParcelas = Math.max(...bancosAprovados.map(([_, r]) => r.parcelas.length));
      const tabelaParcelas = [];
      
      for (let i = 0; i < maxParcelas; i++) {
        const linha = [(i + 1).toString().padStart(2, '0')]; // Parcela começa em 01, não 00
        bancosAprovados.forEach(([_, resultado]) => {
          if (resultado.parcelas[i]) {
            linha.push(formatCurrency(resultado.parcelas[i].prestacao));
          } else {
            linha.push('-');
          }
        });
        tabelaParcelas.push(linha);
      }
      
      // Cabeçalho da tabela
      const headerTabela = ['Parcela', ...bancosAprovados.map(([_, r]) => r.banco)];
      
      autoTable(doc, {
        startY: currentY,
        head: [headerTabela],
        body: tabelaParcelas,
        theme: 'grid',
        headStyles: { 
          fillColor: [rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b], 
          textColor: 255,
          fontSize: 6,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 5,
          halign: 'center',
          textColor: 50
        },
        alternateRowStyles: { fillColor: '#f8f9fa' },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold', fillColor: [240, 240, 240] }
        },
        styles: { 
          fontSize: 6,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        margin: { left: 5, right: 5 }
      });
      
      // Rodapé compactado para todas as páginas
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        const finalY = pageHeight - 15;
        doc.setFillColor(rgbVentusHub.r, rgbVentusHub.g, rgbVentusHub.b);
        doc.rect(0, finalY, pageWidth, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('VentusHub - Plataforma Inteligente de Credito Imobiliario', pageWidth/2, finalY + 6, { align: 'center' });
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} as ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth/2, finalY + 11, { align: 'center' });
        
        // Número da página
        doc.text(`Pagina ${i}/${totalPages}`, pageWidth - 15, finalY + 8, { align: 'right' });
      }
      
      // Salvar
      const fileName = `Comparativo_Financiamento_${bancosAprovados.length}bancos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao gerar PDF comparativo:', error);
      alert('Erro ao gerar PDF comparativo: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const toggleBanco = (codigoBanco) => {
    setBancosEscolhidos(prev => {
      const novosBancos = prev.includes(codigoBanco) 
        ? prev.filter(b => b !== codigoBanco)
        : [...prev, codigoBanco];
      
      // Se adicionou um banco e não havia nenhum antes, scroll para o formulário
      if (!prev.includes(codigoBanco) && prev.length === 0) {
        setTimeout(() => {
          scroller.scrollTo('form-section', {
            duration: 800,
            delay: 0,
            smooth: 'easeInOutQuart',
            offset: -20
          });
        }, 350); // Aguarda a animação do fade completar
      }
      
      return novosBancos;
    });
  };

  const toggleAllBancos = () => {
    const currentConfig = getBancosConfig();
    if (bancosEscolhidos.length === Object.keys(currentConfig).length) {
      // All banks are selected, so deselect all
      setBancosEscolhidos([]);
    } else {
      // Not all banks are selected, so select all
      setBancosEscolhidos(Object.keys(currentConfig));
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calculator className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Simulador Comparativo Bancário</h1>
            <p className="text-gray-600 mt-1">
              Compare condições de financiamento habitacional entre diferentes bancos
            </p>
          </div>
        </div>
      </div>

      {/* Seleção de Bancos */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Escolha os Bancos para Comparar
          </h3>
          <p className="text-sm text-gray-600 mt-1">Selecione um ou mais bancos para ver as condições específicas de cada um</p>
        </div>
        <div className="p-6">
          <div className="flex justify-end items-center mb-4">
            <div className="flex items-center mr-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={minhaCasaMinhaVida}
                  onChange={(e) => setMinhaCasaMinhaVida(e.target.checked)}
                />
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${
                  minhaCasaMinhaVida ? 'bg-green-600' : 'bg-gray-200'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                    minhaCasaMinhaVida ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">Simular Minha Casa Minha Vida</span>
              </label>
            </div>
            <button
              onClick={toggleAllBancos}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              {bancosEscolhidos.length === Object.keys(getBancosConfig()).length ? "Desmarcar Todos" : "Marcar Todos"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(minhaCasaMinhaVida ? BANCOS_MCMV_CONFIG : BANCOS_CONFIG)
              .sort(([, a], [, b]) => a.nome.localeCompare(b.nome))
              .map(([codigo, config]) => (
              <div
                key={codigo}
                onClick={() => toggleBanco(codigo)}
                className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all ${
                  bancosEscolhidos.includes(codigo)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {bancosEscolhidos.includes(codigo) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="text-center">
                  <div className="mb-3 flex justify-center">
                    <img 
                      src={config.logo}
                      alt={`Logo ${config.nome}`}
                      className="w-[100px] h-16 object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="w-[100px] h-16 rounded items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: config.cor, display: 'none' }}
                    >
                      {config.nome}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{config.nome}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <AnimatePresence>
        {bancosEscolhidos.length > 0 && (
          <Element name="form-section">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-sm"
            >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados Básicos do Financiamento
              </h3>
              <p className="text-sm text-gray-600 mt-1">Estes são os dados básicos solicitados por todos os bancos</p>
            </div>
            <div className="p-6 space-y-6">
              
              {/* Tipo de Imóvel e Opção de Financiamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="h-4 w-4 inline mr-1" />
                    Tipo do Imóvel
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.tipoImovel} 
                    onChange={(e) => setFormData({...formData, tipoImovel: e.target.value})}
                  >
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Opção de Financiamento
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.opcaoFinanciamento} 
                    onChange={(e) => setFormData({...formData, opcaoFinanciamento: e.target.value})}
                  >
                    <option value="imovel_pronto">Imóvel Pronto</option>
                    <option value="terreno">Terreno</option>
                    <option value="emprestimo_garantia">Empréstimo c/ Garantia</option>
                  </select>
                </div>
              </div>

              {/* Valor do Imóvel e Valor do Financiamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="h-4 w-4 inline mr-1" />
                    Valor do Imóvel (mín. R$ 100.000)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.valorImovel}
                    onChange={(e) => handleInputChange('valorImovel', e.target.value)}
                    placeholder="R$ 500.000,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Valor do Financiamento Desejado
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.valorFinanciamento}
                    onChange={(e) => handleInputChange('valorFinanciamento', e.target.value)}
                    placeholder="R$ 400.000,00"
                  />
                </div>
              </div>

              {/* Renda e Data de Nascimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <CreditCard className="h-4 w-4 inline mr-1" />
                    Renda Bruta Familiar Comprovada
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.rendaBrutaFamiliar}
                    onChange={(e) => handleInputChange('rendaBrutaFamiliar', e.target.value)}
                    placeholder="R$ 10.000,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Data de Nascimento
                    <div className="relative inline-block ml-1">
                      <Info 
                        className="h-3 w-3 text-gray-400 cursor-help" 
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      />
                      {showTooltip && (
                        <div className="absolute z-50 w-64 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-4 whitespace-normal">
                          Digitar sempre a data de nascimento do mais velho entre os compradores.
                        </div>
                      )}
                    </div>
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Prazo e Sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Prazo Desejado (máx. {dadosCalculados.prazoMaximo} meses)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="2"
                        max={Math.min(420, dadosCalculados.prazoMaximo)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          prazoValido 
                            ? 'border-gray-300 focus:ring-blue-500' 
                            : 'border-red-500 focus:ring-red-500 bg-red-50'
                        }`}
                        value={formData.prazoDesejado}
                        onChange={(e) => handleInputChange('prazoDesejado', e.target.value)}
                        placeholder="360"
                      />
                      {!prazoValido && (
                        <div className="absolute z-10 w-64 px-3 py-2 text-xs text-white bg-red-600 rounded-lg shadow-lg -bottom-2 left-0 transform translate-y-full">
                          Digite o prazo correto. De 2 a {Math.min(420, dadosCalculados.prazoMaximo)} meses para esta idade.
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">meses</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    Sistema/Correção
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.sistemaAmortizacao} 
                    onChange={(e) => setFormData({...formData, sistemaAmortizacao: e.target.value})}
                  >
                    <option value="SAC_TR">SAC + TR</option>
                    <option value="PRICE_TR">PRICE + TR</option>
                    <option value="SAC_POUPANCA">SAC + POUPANÇA</option>
                    <option value="SAC_IPCA">SAC + IPCA (apenas Inter)</option>
                    <option value="PRICE_IPCA">PRICE + IPCA (apenas Inter)</option>
                  </select>
                </div>
              </div>

              {/* Informações Calculadas */}
              {dadosCalculados.idade > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>Idade:</strong> {dadosCalculados.idade} anos</p>
                  <p><strong>Prazo máximo:</strong> {dadosCalculados.prazoMaximo} meses ({(dadosCalculados.prazoMaximo/12).toFixed(1)} anos)</p>
                  <p><strong>Valor da entrada:</strong> {formatCurrency(dadosCalculados.valorEntrada)}</p>
                  <p><strong>Capacidade de pagamento (30% renda):</strong> {formatCurrency(dadosCalculados.capacidadePagamento)}</p>
                </div>
              )}

              <button 
                onClick={simularTodos} 
                disabled={bancosEscolhidos.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Calculator className="h-5 w-5" />
                Simular {bancosEscolhidos.length} Banco(s) Selecionado(s)
              </button>
            </div>
            </motion.div>
          </Element>
        )}
      </AnimatePresence>

      {/* Resultados Comparativos */}
      {Object.keys(resultados).length > 0 && (
        <Element name="results-section">
          <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📊 Comparativo de Resultados</h3>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex-1 mr-4">
                <strong>💡 Importante:</strong> Esta é uma simulação baseada nos dados informados. 
                Apenas o banco pode aprovar ou negar um crédito após análise completa da documentação e perfil do cliente.
              </div>
              <button
                onClick={() => gerarPDFComparativo()}
                disabled={bancosEscolhidos.length < 2}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FileDown className="h-4 w-4" />
                PDF Comparativo
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
              {Object.entries(resultados).map(([codigo, resultado]) => (
                <motion.div 
                  key={codigo} 
                  className="border border-gray-200 rounded-lg p-4 relative" 
                  style={{borderLeftColor: resultado.cor, borderLeftWidth: '4px'}}
                  initial={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -100 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  layout
                >
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => fecharCard(codigo)}
                      className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                      title="Fechar card"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => gerarPDFIndividual(codigo, resultado)}
                      className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      title="Gerar PDF individual"
                    >
                      <FileDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mb-4 pr-20">
                    <img 
                      src={resultado.logo}
                      alt={`Logo ${resultado.banco}`}
                      className="w-[100px] h-16 object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div 
                      className="w-[100px] h-16 rounded items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: resultado.cor, display: 'none' }}
                    >
                      {resultado.banco}
                    </div>
                    <div>
                      <h4 className="font-semibold">{resultado.banco}</h4>
                      {resultado.aprovado ? (
                        resultado.aprovadoCapacidade ? (
                          <span className="text-green-600 text-sm">✅ Cenário favorável</span>
                        ) : (
                          <span className="text-orange-600 text-sm">⚠️ Acima da capacidade</span>
                        )
                      ) : (
                        <span className="text-red-600 text-sm">❌ Não atende critérios</span>
                      )}
                    </div>
                  </div>
                  
                  {resultado.mensagemAjuste && (
                    <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <strong>⚠️ Ajuste:</strong> {resultado.mensagemAjuste}
                    </div>
                  )}
                  
                  {resultado.aprovado ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Financiamento máx.:</span>
                        <strong>{resultado.financiamentoMaxPermitido}%</strong>
                      </div>
                      {resultado.percentualSolicitado !== resultado.percentualFinanciamento && (
                        <div className="flex justify-between text-yellow-700">
                          <span>Solicitado:</span>
                          <strong>{resultado.percentualSolicitado.toFixed(1)}%</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Simulado:</span>
                        <strong>{resultado.percentualFinanciamento.toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor financiado:</span>
                        <strong>{formatCurrency(resultado.valorFinanciamentoReal)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Primeira parcela:</span>
                        <strong className={resultado.aprovadoCapacidade ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(resultado.primeiraParcela)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Última parcela:</span>
                        <strong className="text-gray-600">
                          {formatCurrency(resultado.ultimaParcela)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de juros:</span>
                        <strong>{resultado.taxaJurosAnual}% a.a.</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Sistema:</span>
                        <strong>{resultado.sistemaUsado?.replace('_', ' + ')}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>CET:</span>
                        <strong>{resultado.cet.toFixed(2)}% a.a.</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total pago:</span>
                        <strong>{formatCurrency(resultado.totalPago)}</strong>
                      </div>
                      {resultado.observacao && (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                          <strong>ℹ️</strong> {resultado.observacao}
                        </div>
                      )}
                      {resultado.observacaoEspecial && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                          <strong>💡</strong> {resultado.observacaoEspecial}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      {resultado.erros?.map((erro, index) => (
                        <p key={index}>{erro}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          </div>
          </div>
        </Element>
      )}
    </div>
  );
}
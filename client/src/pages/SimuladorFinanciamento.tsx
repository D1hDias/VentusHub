import React, { useState, useEffect } from 'react';
import { Calculator, Download, Building, CreditCard, FileText, TrendingUp, Home, DollarSign, Calendar, Shield, Info, User, MapPin, Check, FileDown } from "lucide-react";

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
      mip: { 18: 0.010, 30: 0.010, 40: 0.015, 50: 0.022, 60: 0.030, 70: 0.040, 80: 0.050 },
      dfi: { residencial: 0.00018, comercial: 0.00028 }
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
      mip: { 18: 0.008, 30: 0.008, 40: 0.012, 50: 0.017, 60: 0.024, 70: 0.034, 80: 0.044 },
      dfi: { residencial: 0.00014, comercial: 0.00024 }
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
      SAC_TR: 11.49,
      PRICE_TR: 11.79,
      SAC_POUPANCA: 10.89
    },
    seguros: {
      mip: { 18: 0.008, 30: 0.008, 40: 0.012, 50: 0.018, 60: 0.025, 70: 0.035, 80: 0.045 },
      dfi: { residencial: 0.0001337, comercial: 0.0002 }
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
      mip: { 18: 0.009, 30: 0.009, 40: 0.014, 50: 0.020, 60: 0.028, 70: 0.038, 80: 0.048 },
      dfi: { residencial: 0.00016, comercial: 0.00026 }
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
      mip: { 18: 0.010, 30: 0.010, 40: 0.015, 50: 0.021, 60: 0.029, 70: 0.039, 80: 0.049 },
      dfi: { residencial: 0.00017, comercial: 0.00027 }
    },
    regrasEspeciais: {
      SAC_TR: { financiamentoMax: 0.80 },
      PRICE_TR: { financiamentoMax: 0.75 },
      SAC_POUPANCA: { financiamentoMax: 0.70 }
    }
  }
};

export default function SimuladorComparativo() {
  const [bancosEscolhidos, setBancosEscolhidos] = useState(['caixa']);
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
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [relatorioContent, setRelatorioContent] = useState('');
  const [resultados, setResultados] = useState({});

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
    const faixas = Object.keys(configBanco.seguros.mip).map(Number).sort((a, b) => a - b);
    for (let i = faixas.length - 1; i >= 0; i--) {
      if (idade >= faixas[i]) {
        return configBanco.seguros.mip[faixas[i]];
      }
    }
    return configBanco.seguros.mip[18];
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
    const configBanco = BANCOS_CONFIG[codigoBanco];
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
    const financiamentoMaxPermitido = (regrasEspeciais.financiamentoMax || configBanco.financiamentoMax) * valorImovel;
    const percentualFinanciamento = valorFinanciamento / valorImovel;
    const percentualSolicitado = percentualFinanciamento * 100;
    const percentualMaximoBanco = (regrasEspeciais.financiamentoMax || configBanco.financiamentoMax) * 100;
    
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
    const taxaMensal = taxaJurosAnual / 100 / 12;
    const aliquotaMIP = obterAliquotaMIP(configBanco, dadosCalculados.idade);
    const seguroDFI = valorImovel * configBanco.seguros.dfi[formData.tipoImovel];

    let parcelas = [];
    let totalJuros = 0;
    let totalSeguros = 0;
    const isSAC = formData.sistemaAmortizacao.includes('SAC');
    
    if (isSAC) {
      const amortizacaoMensal = valorTotalFinanciamento / prazo;
      let saldoDevedor = valorTotalFinanciamento;

      for (let i = 1; i <= prazo; i++) {
        const juros = saldoDevedor * taxaMensal;
        const seguroMIP = saldoDevedor * aliquotaMIP / 100;
        const prestacao = amortizacaoMensal + juros + seguroMIP + seguroDFI;
        
        totalJuros += juros;
        totalSeguros += seguroMIP + seguroDFI;
        
        parcelas.push({
          parcela: i,
          prestacao,
          amortizacao: amortizacaoMensal,
          juros,
          seguroMIP,
          seguroDFI,
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
        const seguroMIP = saldoDevedor * aliquotaMIP / 100;
        const prestacao = prestacaoBase + seguroMIP + seguroDFI;
        
        totalJuros += juros;
        totalSeguros += seguroMIP + seguroDFI;
        
        parcelas.push({
          parcela: i,
          prestacao,
          amortizacao,
          juros,
          seguroMIP,
          seguroDFI,
          saldoDevedor: Math.max(0, saldoDevedor - amortizacao)
        });
        
        saldoDevedor -= amortizacao;
      }
    }

    const totalPago = valorTotalFinanciamento + totalJuros + totalSeguros;
    const cet = ((totalPago / valorTotalFinanciamento) ** (1/(prazo/12)) - 1) * 100;
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
      totalPago,
      cet,
      taxaJurosAnual,
      seguroDFI,
      aliquotaMIP,
      percentualFinanciamento: (valorFinanciamento / valorImovel) * 100,
      percentualSolicitado,
      financiamentoMaxPermitido: (regrasEspeciais.financiamentoMax || configBanco.financiamentoMax) * 100,
      parcelas: parcelas.slice(0, 12),
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
  };

  const gerarPDFIndividual = (codigoBanco, resultado) => {
    console.log('Gerando PDF individual para:', codigoBanco, resultado);
    // Implementação do PDF individual
    alert(`PDF individual do ${resultado.banco} será implementado`);
  };

  const gerarPDFComparativo = () => {
    console.log('Gerando PDF comparativo para todos os bancos');
    // Implementação do PDF comparativo
    alert('PDF comparativo será implementado');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const toggleBanco = (codigoBanco) => {
    setBancosEscolhidos(prev => 
      prev.includes(codigoBanco) 
        ? prev.filter(b => b !== codigoBanco)
        : [...prev, codigoBanco]
    );
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(BANCOS_CONFIG)
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
      <div className="bg-white rounded-lg shadow-sm">
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
      </div>

      {/* Resultados Comparativos */}
      {Object.keys(resultados).length > 0 && (
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <FileDown className="h-4 w-4" />
                PDF Comparativo
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(resultados).map(([codigo, resultado]) => (
                <div key={codigo} className="border border-gray-200 rounded-lg p-4 relative" style={{borderLeftColor: resultado.cor, borderLeftWidth: '4px'}}>
                  <button
                    onClick={() => gerarPDFIndividual(codigo, resultado)}
                    className="absolute top-4 right-4 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    title="Gerar PDF individual"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-3 mb-4 pr-12">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
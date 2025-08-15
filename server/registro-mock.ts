// Mock integration para simular APIs de cartórios
// Este módulo simula consultas e atualizações de status de registros imobiliários

/**
 * Simula delay de resposta real de APIs externas
 */
const simulateDelay = (min: number = 500, max: number = 2000): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Lista de cartórios simulados para o sistema
 */
export const cartoriosMock = [
  {
    id: 1,
    nome: "1º Cartório de Registro de Imóveis de São Paulo",
    url: "https://www.1crispdr.sp.gov.br",
    regiao: "São Paulo - Centro",
    taxaBase: 850.00
  },
  {
    id: 2,
    nome: "2º Cartório de Registro de Imóveis de São Paulo",
    url: "https://www.2crispdr.sp.gov.br",
    regiao: "São Paulo - Zona Norte",
    taxaBase: 920.00
  },
  {
    id: 3,
    nome: "Cartório de Registro de Imóveis de Guarulhos",
    url: "https://www.cartoriogru.com.br",
    regiao: "Guarulhos",
    taxaBase: 750.00
  },
  {
    id: 4,
    nome: "Cartório de Registro de Imóveis de Santos",
    url: "https://www.cartoriosantos.com.br",
    regiao: "Santos",
    taxaBase: 680.00
  }
];

/**
 * Estados possíveis para simulação de registros
 */
export const statusOptions = [
  "pendente_envio",
  "em_analise", 
  "aguardando_pagamento",
  "registrado",
  "indeferido"
] as const;

/**
 * Gera protocolo simulado baseado em timestamp
 */
export const generateProtocolo = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp.slice(-6)}${random}`;
};

/**
 * Simula consulta de status em cartório externo
 * Retorna dados ficcionais mas realísticos
 */
export const consultarStatusCartorio = async (protocolo: string): Promise<any> => {
  await simulateDelay();

  // Simula diferentes cenários baseados no protocolo
  const seed = parseInt(protocolo.slice(-2));
  
  let status: typeof statusOptions[number];
  let observacoes: string;
  let prazoEstimado: number;
  let proximaEtapa: string;

  if (seed < 20) {
    status = "pendente_envio";
    observacoes = "Documentação ainda não recebida pelo cartório";
    prazoEstimado = 0;
    proximaEtapa = "Aguardando envio da documentação";
  } else if (seed < 50) {
    status = "em_analise";
    observacoes = "Documentação em análise pelo registrador";
    prazoEstimado = Math.floor(Math.random() * 15) + 5; // 5-20 dias
    proximaEtapa = "Análise documental em andamento";
  } else if (seed < 70) {
    status = "aguardando_pagamento";
    observacoes = "Análise concluída. Aguardando pagamento das taxas";
    prazoEstimado = 5;
    proximaEtapa = "Pagamento das taxas de registro";
  } else if (seed < 90) {
    status = "registrado";
    observacoes = "Registro concluído com sucesso";
    prazoEstimado = 0;
    proximaEtapa = "Processo finalizado";
  } else {
    status = "indeferido";
    observacoes = "Documentação irregular. Necessária correção";
    prazoEstimado = 0;
    proximaEtapa = "Correção de documentos necessária";
  }

  return {
    protocolo,
    status,
    dataConsulta: new Date().toISOString(),
    observacoes,
    prazoEstimado,
    proximaEtapa,
    cartorioResponse: {
      timestamp: new Date().getTime(),
      servidor: `cartorio-api-${Math.floor(Math.random() * 3) + 1}`,
      versaoApi: "2.1.0"
    }
  };
};

/**
 * Simula envio de documentos para cartório
 * Retorna protocolo e dados iniciais
 */
export const enviarDocumentosCartorio = async (dados: {
  cartorioNome: string;
  valorImovel: number;
  documentos: string[];
}): Promise<any> => {
  await simulateDelay(1000, 3000); // Simula upload mais demorado

  const protocolo = generateProtocolo();
  const cartorio = cartoriosMock.find(c => c.nome === dados.cartorioNome) || cartoriosMock[0];
  
  // Calcula taxa baseada no valor do imóvel (simulação realística)
  const percentualTaxa = 0.003; // 0.3% do valor do imóvel
  const valorTaxas = dados.valorImovel * percentualTaxa + cartorio.taxaBase;
  
  const prazoEstimado = Math.floor(Math.random() * 20) + 10; // 10-30 dias

  return {
    protocolo,
    status: "em_analise",
    dataEnvio: new Date().toISOString(),
    valorTaxas: parseFloat(valorTaxas.toFixed(2)),
    prazoEstimado,
    cartorioInfo: {
      nome: cartorio.nome,
      url: cartorio.url,
      regiao: cartorio.regiao
    },
    documentosEnviados: dados.documentos.length,
    observacoes: "Documentos recebidos e protocolo gerado. Análise iniciada."
  };
};

/**
 * Simula atualização forçada de status (para testes)
 * Permite simular mudanças de status manualmente
 */
export const forcarAtualizacaoStatus = async (
  protocolo: string, 
  novoStatus: typeof statusOptions[number]
): Promise<any> => {
  await simulateDelay(300, 800);

  let observacoes: string;
  let prazoEstimado: number;

  switch (novoStatus) {
    case "pendente_envio":
      observacoes = "Status alterado manualmente para pendente de envio";
      prazoEstimado = 0;
      break;
    case "em_analise":
      observacoes = "Análise iniciada pelo registrador";
      prazoEstimado = Math.floor(Math.random() * 15) + 5;
      break;
    case "aguardando_pagamento":
      observacoes = "Análise aprovada. Aguardando pagamento das taxas";
      prazoEstimado = 5;
      break;
    case "registrado":
      observacoes = "Registro concluído com sucesso!";
      prazoEstimado = 0;
      break;
    case "indeferido":
      observacoes = "Registro indeferido. Verificar documentação";
      prazoEstimado = 0;
      break;
  }

  return {
    protocolo,
    status: novoStatus,
    dataAtualizacao: new Date().toISOString(),
    observacoes,
    prazoEstimado,
    atualizacaoManual: true,
    responsavel: "Sistema VentusHub"
  };
};

/**
 * Simula consulta de taxas por cartório
 */
export const consultarTaxasCartorio = async (cartorioNome: string, valorImovel: number): Promise<any> => {
  await simulateDelay(500, 1200);

  const cartorio = cartoriosMock.find(c => c.nome === cartorioNome) || cartoriosMock[0];
  
  // Simulação realística de cálculo de taxas
  const percentualItbi = 0.02; // 2% ITBI
  const percentualRegistro = 0.003; // 0.3% registro
  
  const taxaItbi = valorImovel * percentualItbi;
  const taxaRegistro = valorImovel * percentualRegistro + cartorio.taxaBase;
  const taxasCertidoes = 150.00; // Certidões diversas
  const emolumentos = 280.00; // Emolumentos fixos
  
  const totalTaxas = taxaItbi + taxaRegistro + taxasCertidoes + emolumentos;

  return {
    cartorio: cartorio.nome,
    valorImovel,
    detalhamento: {
      itbi: parseFloat(taxaItbi.toFixed(2)),
      registro: parseFloat(taxaRegistro.toFixed(2)),
      certidoes: taxasCertidoes,
      emolumentos: emolumentos
    },
    totalTaxas: parseFloat(totalTaxas.toFixed(2)),
    validadeConsulta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
    observacoes: "Valores calculados com base na tabela vigente. Consulte o cartório para confirmação."
  };
};

/**
 * Simula webhook de notificação do cartório
 * Seria usado para receber atualizações automáticas
 */
export const simularWebhookCartorio = (protocolo: string) => {
  // Em uma implementação real, esta função seria chamada pelo cartório
  // quando houvesse mudanças no status do registro
  
  const eventos = [
    "documento_recebido",
    "analise_iniciada", 
    "pendencia_encontrada",
    "aprovacao_concluida",
    "pagamento_necessario",
    "registro_finalizado"
  ];
  
  const eventoAleatorio = eventos[Math.floor(Math.random() * eventos.length)];
  
  return {
    protocolo,
    evento: eventoAleatorio,
    timestamp: new Date().toISOString(),
    dados: {
      mensagem: `Evento ${eventoAleatorio} registrado para protocolo ${protocolo}`,
      origem: "webhook_cartorio",
      requerAcao: ["pendencia_encontrada", "pagamento_necessario"].includes(eventoAleatorio)
    }
  };
};
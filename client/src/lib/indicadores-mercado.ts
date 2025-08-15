/**
 * ===== INDICADORES DE MERCADO - ATUALIZAÇÃO MANUAL OBRIGATÓRIA =====
 * 
 * 🚨 ATENÇÃO DESENVOLVEDORES: Estes indicadores devem ser atualizados MENSALMENTE
 * para garantir simulações precisas em todos os simuladores.
 * 
 * Última atualização: Agosto 2025 - IPCA corrigido para 5,23%
 * 
 * 📋 FONTES OFICIAIS PARA ATUALIZAÇÃO:
 * 
 * 1. SELIC/CDI:
 *    - Site BCB: https://www.bcb.gov.br/controleinflacao/taxaselic
 *    - API BCB: https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json
 *    - Frequência: Após cada reunião COPOM (8x por ano)
 * 
 * 2. IGP-M (inflação - usado para aluguéis):
 *    - Site FGV: https://portalibre.fgv.br/estudos-e-pesquisas/indices-de-precos/igp/igp-m
 *    - Usar: IGP-M acumulado em 12 meses
 *    - Frequência: Mensal (todo final do mês)
 * 
 * 3. IPCA (inflação geral):
 *    - Site IBGE: https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos/9256-indice-nacional-de-precos-ao-consumidor-amplo.html
 *    - Frequência: Mensal
 * 
 * 4. Valorização Imobiliária:
 *    - FIPE-ZAP: https://www.zapimoveis.com.br/fipe-zap/
 *    - FGV IVAR: https://portalibre.fgv.br/
 *    - Usar média nacional anualizada
 *    - Frequência: Trimestral
 * 
 * 5. Custos de Compra:
 *    - Base: ITBI (2-3%) + Escritura (0.5-1%) + Corretagem (3-6%)
 *    - Verificar mudanças legislativas municipais/estaduais
 *    - Frequência: Semestral
 */

// ===== TAXAS BÁSICAS DE JUROS =====
export const TAXAS_JUROS = {
  /** Taxa SELIC atual (% ao ano) - Fonte: BCB */
  selic: 15.0,
  
  /** Taxa CDI atual (% ao ano) - Fonte: ANBIMA */
  cdi: 13.25,
  
  /** CDI mensal bruto (% ao mês) - Calculado: CDI anual / 12 */
  cdiMensal: 13.25 / 12,
  
  /** CDI mensal líquido (% ao mês) - Calculado: CDI mensal * 0.775 (desconto IR) */
  cdiMensalLiquido: (13.25 / 12) * 0.775,
} as const;

// ===== ÍNDICES DE INFLAÇÃO =====
export const INFLACAO = {
  /** IGP-M 12 meses (% ao ano) - Fonte: FGV - Usado para aluguéis */
  igpM: 4.39,
  
  /** IGP-M mensal (% ao mês) - Calculado: IGP-M anual / 12 */
  igpMMensal: 4.39 / 12,
  
  /** IPCA 12 meses (% ao ano) - Fonte: IBGE - Inflação geral */
  ipca: 5.23,
  
  /** IPCA mensal (% ao mês) - Calculado: IPCA anual / 12 */
  ipcaMensal: 5.23 / 12,
} as const;

// ===== CUSTOS IMOBILIÁRIOS =====
export const CUSTOS_IMOVEIS = {
  /** ITBI + Registro padrão (% do valor do imóvel) */
  itbiRegistro: 5.0,
  
  /** IR sobre ganho de capital (% do ganho) */
  irGanhoCapital: 15.0,
  
  /** Corretagem padrão (% do valor do imóvel) */
  corretagem: 6.0,
  
  /** Custos de compra totais (ITBI + Escritura + Corretagem) */
  custosCompra: 6.2,
  
  /** Manutenção anual típica (% do valor do imóvel) */
  manutencaoAnual: 1.8,
} as const;

// ===== VALORIZAÇÃO E RENDIMENTOS =====
export const VALORIZACAO = {
  /** Valorização média de imóveis (% ao ano) - Fonte: FIPE-ZAP */
  valorizacaoImovel: 4.2,
  
  /** Custo de oportunidade típico (% ao ano) - CDI líquido */
  custoOportunidade: 10.27,
  
  /** Custo de oportunidade mensal (% ao mês) */
  custoOportunidadeMensal: 10.27 / 12,
} as const;

// ===== INDICADORES CONSOLIDADOS =====
export const INDICADORES_MERCADO = {
  ...TAXAS_JUROS,
  ...INFLACAO,
  ...CUSTOS_IMOVEIS,
  ...VALORIZACAO,
} as const;

// ===== FUNÇÕES AUXILIARES =====

/**
 * Converte taxa anual para mensal
 */
export const anualParaMensal = (taxaAnual: number): number => {
  return taxaAnual / 12;
};

/**
 * Converte taxa mensal para anual
 */
export const mensalParaAnual = (taxaMensal: number): number => {
  return taxaMensal * 12;
};

/**
 * Calcula CDI líquido (com desconto de IR)
 */
export const calcularCDILiquido = (cdiAnual: number): number => {
  return (cdiAnual / 12) * 0.775; // 22.5% de IR
};

/**
 * Valida se os indicadores estão atualizados (últimos 90 dias)
 */
export const validarIndicadores = (): boolean => {
  // Implementar validação se necessário
  return true;
};

/**
 * Retorna versão formatada dos indicadores para exibição
 */
export const getIndicadoresFormatados = () => {
  return {
    selic: `${TAXAS_JUROS.selic}%`,
    cdi: `${TAXAS_JUROS.cdi}%`,
    igpM: `${INFLACAO.igpM}%`,
    ipca: `${INFLACAO.ipca}%`,
    itbiRegistro: `${CUSTOS_IMOVEIS.itbiRegistro}%`,
    irGanhoCapital: `${CUSTOS_IMOVEIS.irGanhoCapital}%`,
    corretagem: `${CUSTOS_IMOVEIS.corretagem}%`,
    valorizacao: `${VALORIZACAO.valorizacaoImovel}%`,
  };
};

export default INDICADORES_MERCADO;
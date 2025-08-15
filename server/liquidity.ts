
// server/liquidity.ts

import { LiquidityIndexIn, LiquidityIndexOut, LiquidityFeaturesDebug, Comparavel } from '../shared/liquidity';

// Mock de uma função que buscaria dados de mercado.
// Em um cenário real, isso se conectaria a um banco de dados ou outra API.
const getComparables = (bairro_id: string, area_m2: number): Comparavel[] => {
  console.log(`Buscando comparáveis para bairro ${bairro_id} e área ${area_m2}m²...`);
  // Retorna dados mockados para a simulação
  return [
    { preco: 680000, area_m2: area_m2 - 2, dias_mercado: 55 },
    { preco: 700000, area_m2: area_m2 + 2, dias_mercado: 62 },
    { preco: 710000, area_m2: area_m2, dias_mercado: 40 },
  ];
};

/**
 * Extrai features do payload de entrada.
 * @param payload - O corpo da requisição.
 * @returns As features extraídas e os comparáveis utilizados.
 */
const extractFeatures = (payload: LiquidityIndexIn): { features: LiquidityFeaturesDebug, comparaveis: Comparavel[] } => {
  const comparaveis = payload.comparaveis && payload.comparaveis.length > 0
    ? payload.comparaveis
    : getComparables(payload.bairro_id, payload.area_m2);

  const mediaPrecoM2Comparaveis = comparaveis.reduce((acc, comp) => acc + (comp.preco / comp.area_m2), 0) / comparaveis.length;
  const pricePerM2Anuncio = payload.preco_anuncio / payload.area_m2;
  const overpricePct = ((pricePerM2Anuncio / mediaPrecoM2Comparaveis) - 1) * 100;

  const features: LiquidityFeaturesDebug = {
    price_per_m2: pricePerM2Anuncio,
    overprice_pct: overpricePct,
    foto_qtd: payload.fotos_urls?.length || 0,
    texto_len: payload.texto_anuncio.length,
    comparaveis_usados: comparaveis.length,
    media_preco_m2_comparaveis: mediaPrecoM2Comparaveis,
  };

  return { features, comparaveis };
};

/**
 * Calcula o score de liquidez usando a heurística de fallback.
 * @param features - As features extraídas do anúncio.
 * @returns O score de 0 a 100.
 */
const calculateScoreHeuristic = (features: LiquidityFeaturesDebug): number => {
  let score = 100;
  score -= features.overprice_pct; // Penaliza pelo sobrepreço
  score -= (8 - Math.min(8, features.foto_qtd)) * 2; // Penaliza por poucas fotos (máx 8)
  if (features.texto_len < 400) {
    score -= 10; // Penaliza por descrição curta
  }

  // Garante que o score fique entre 0 e 100
  return Math.max(0, Math.min(100, Math.floor(score)));
};

/**
 * Gera recomendações com base nas features.
 * @param features - As features extraídas.
 * @param payload - O payload original para referência.
 * @returns Uma lista de strings com recomendações.
 */
const buildRecommendations = (features: LiquidityFeaturesDebug, payload: LiquidityIndexIn): string[] => {
  const recomendacoes: string[] = [];

  if (payload.toggle_sugestoes_preco && features.overprice_pct > 10) {
    const precoSugerido = payload.preco_anuncio / (1 + (features.overprice_pct - 10) / 100);
    recomendacoes.push(`Preço ${features.overprice_pct.toFixed(0)}% acima do mercado. Considere baixar para R$ ${precoSugerido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}.`);
  }

  if (features.foto_qtd < 8) {
    recomendacoes.push(`Adicione pelo menos ${8 - features.foto_qtd} fotos para melhorar o anúncio.`);
  }

  if (features.texto_len < 400) {
    recomendacoes.push(`Descrição curta (${features.texto_len} caracteres). Detalhe os pontos fortes do imóvel para atrair mais interesse.`);
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push('Anúncio com bom potencial de liquidez! Monitore o interesse e os contatos.');
  }

  return recomendacoes;
};

/**
 * Orquestra a simulação do índice de liquidez.
 * @param payload - O corpo da requisição.
 * @param debug - Flag para incluir informações de debug na resposta.
 * @returns O resultado da simulação.
 */
export const runLiquiditySimulation = (payload: LiquidityIndexIn, debug = false): LiquidityIndexOut => {
  const { features } = extractFeatures(payload);

  // Como não temos o modelo, usamos a heurística diretamente.
  const score = calculateScoreHeuristic(features);
  const probVenda = score / 100;

  const recomendacoes = buildRecommendations(features, payload);

  const resultado: LiquidityIndexOut = {
    score_0_100: score,
    prob_venda_pct: probVenda,
    horizonte_dias: payload.horizonte_dias || 90,
    recomendacoes,
  };

  if (debug) {
    resultado.features_debug = features;
  }

  return resultado;
};

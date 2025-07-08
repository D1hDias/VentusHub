
// shared/liquidity.ts

/**
 * Representa um imóvel comparável para a análise de liquidez.
 */
export interface Comparavel {
  preco: number;
  area_m2: number;
  dias_mercado: number;
}

/**
 * Payload de entrada para o simulador de índice de liquidez.
 */
export interface LiquidityIndexIn {
  preco_anuncio: number;
  area_m2: number;
  bairro_id: string; // Ex: "SP_PINHEIROS"
  data_captura: string; // Formato ISO-8601: "YYYY-MM-DD"
  horizonte_dias?: 30 | 60 | 90;
  fotos_urls?: string[];
  texto_anuncio: string;
  comparaveis?: Comparavel[];
  toggle_analise_fotos?: boolean;
  toggle_sugestoes_preco?: boolean;
}

/**
 * Features extraídas e usadas para a depuração do modelo.
 */
export interface LiquidityFeaturesDebug {
  price_per_m2: number;
  overprice_pct: number;
  foto_qtd: number;
  texto_len: number;
  comparaveis_usados: number;
  media_preco_m2_comparaveis: number;
}

/**
 * Payload de saída do simulador de índice de liquidez.
 */
export interface LiquidityIndexOut {
  score_0_100: number;
  prob_venda_pct: number;
  horizonte_dias: number;
  recomendacoes: string[];
  features_debug?: LiquidityFeaturesDebug;
}

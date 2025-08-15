
/**
 * ===== SERVIÇOS DE API PARA INDICADORES DE MERCADO =====
 * 
 * Este arquivo agora atua como um cliente para o nosso próprio backend,
 * que por sua vez faz o proxy para as APIs oficiais. Isso resolve
 * problemas de CORS e centraliza a lógica de cache e fallback no servidor.
 */

// ===== TIPOS E INTERFACES =====
export interface Indicador {
  valor: number;
  dataAtualizacao: string;
  fonte: string;
}

export interface IndicadoresResponse {
  selic: number;
  cdi: number;
  ipca: number;
  igpM: number;
  ultimaAtualizacao?: string; // Opcional, pois o servidor pode não enviar
  erro?: string;
}

// ===== CONFIGURAÇÕES =====
const API_BASE_URL = '/api'; // Aponta para o nosso próprio backend

/**
 * Busca todos os indicadores de mercado do nosso backend.
 * O backend lida com cache, fallbacks e chamadas às APIs externas.
 */
export const fetchIndicadoresMercado = async (): Promise<IndicadoresResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/indicadores`);
    
    if (!response.ok) {
      // Se a resposta não for OK, tenta usar o corpo do erro se disponível
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro no servidor: ${response.status}`);
    }
    
    const data: IndicadoresResponse = await response.json();
    
    return data; // Não sobrescrever timestamp do servidor
    
  } catch (error) {
    console.error('Erro ao buscar indicadores do backend:', error);
    
    // Em caso de falha total da nossa API, retorna um objeto de fallback
    return {
      selic: 15.0,
      cdi: 13.25,
      ipca: 5.23,
      igpM: 4.39,
      erro: 'Não foi possível conectar ao servidor. Usando dados de fallback.',
    };
  }
};

/**
 * Força a atualização dos indicadores limpando o cache do backend.
 * Usa o endpoint dedicado de refresh que limpa o cache e busca dados frescos.
 */
export const forceUpdateIndicadores = async (): Promise<IndicadoresResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/indicadores/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro no force refresh: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data || result; // Retorna os dados atualizados
    
  } catch (error) {
    console.warn('Erro no force refresh, fallback para fetch normal:', error);
    // Fallback para o fetch normal se o force refresh falhar
    return fetchIndicadoresMercado();
  }
};

// === ALIAS PARA COMPATIBILIDADE ===
/**
 * Alias para fetchIndicadoresMercado para manter compatibilidade com código existente
 */
export const getIndicadoresFromAPI = fetchIndicadoresMercado;

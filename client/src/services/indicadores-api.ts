
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
    
    return {
      ...data,
      ultimaAtualizacao: new Date().toISOString(), // Adiciona timestamp do cliente
    };
    
  } catch (error) {
    console.error('Erro ao buscar indicadores do backend:', error);
    
    // Em caso de falha total da nossa API, retorna um objeto de fallback
    return {
      selic: 10.50,
      cdi: 10.40,
      ipca: 4.62,
      igpM: -0.47,
      erro: 'Não foi possível conectar ao servidor. Usando dados de fallback.',
    };
  }
};

/**
 * Força a atualização dos indicadores.
 * No novo modelo, isso pode ser um endpoint específico no backend
 * ou simplesmente refazer a chamada. Por simplicidade, vamos refazer a chamada.
 */
export const forceUpdateIndicadores = async (): Promise<IndicadoresResponse> => {
  // O backend pode ter seu próprio mecanismo de cache, então uma chamada
  // pode não necessariamente buscar dados novos.
  // Para uma atualização real, o backend precisaria de uma rota como /api/indicadores/force-refresh
  return fetchIndicadoresMercado();
};

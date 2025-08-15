import { useState, useEffect } from 'react';
import { getIndicadoresFromAPI, forceUpdateIndicadores } from '@/services/indicadores-api';
import { INDICADORES_MERCADO } from '@/lib/indicadores-mercado';

export type FonteIndicadores = 'api' | 'estatico' | 'carregando';

export interface IndicadoresComMetadata {
  // Dados
  selic: number;
  cdi: number;
  igpM: number;
  ipca: number;
  itbiRegistro: number;
  irGanhoCapital: number;
  corretagem: number;
  valorizacao: number;
  
  // Metadata
  fonte: FonteIndicadores;
  ultimaAtualizacao: Date;
  erro?: string;
}

export interface UseIndicadoresMercadoOptions {
  forceStatic?: boolean;
  updateInterval?: number; // em millisegundos
  autoRefresh?: boolean;
}

const CACHE_KEY = 'indicadores_mercado_cache';
const DEFAULT_CACHE_TTL = 15 * 60 * 1000; // 15 minutos

// Cache em memória
let cacheData: {
  data: IndicadoresComMetadata | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

export function useIndicadoresMercado(options: UseIndicadoresMercadoOptions = {}) {
  const {
    forceStatic = false,
    updateInterval = DEFAULT_CACHE_TTL,
    autoRefresh = true
  } = options;

  const [indicadores, setIndicadores] = useState<IndicadoresComMetadata>(() => ({
    ...INDICADORES_MERCADO,
    fonte: 'carregando' as FonteIndicadores,
    ultimaAtualizacao: new Date(),
    erro: undefined
  }));

  const [isLoading, setIsLoading] = useState(false);

  // Função para formatar dados da API para o formato unificado
  const formatarDadosAPI = (dadosAPI: any): IndicadoresComMetadata => {
    // Usar a data da API se disponível, senão criar nova
    let ultimaAtualizacao: Date;
    if (dadosAPI.ultimaAtualizacao) {
      ultimaAtualizacao = typeof dadosAPI.ultimaAtualizacao === 'string' 
        ? new Date(dadosAPI.ultimaAtualizacao) 
        : dadosAPI.ultimaAtualizacao;
    } else {
      ultimaAtualizacao = new Date();
    }

    return {
      selic: dadosAPI.selic || INDICADORES_MERCADO.selic,
      cdi: dadosAPI.cdi || INDICADORES_MERCADO.cdi,
      igpM: dadosAPI.igpM || INDICADORES_MERCADO.igpM,
      ipca: dadosAPI.ipca || INDICADORES_MERCADO.ipca,
      itbiRegistro: INDICADORES_MERCADO.itbiRegistro, // Sempre estático
      irGanhoCapital: INDICADORES_MERCADO.irGanhoCapital, // Sempre estático
      corretagem: INDICADORES_MERCADO.corretagem, // Sempre estático
      valorizacao: dadosAPI.valorizacao || INDICADORES_MERCADO.valorizacao,
      fonte: 'api' as FonteIndicadores,
      ultimaAtualizacao,
      erro: undefined
    };
  };

  // Função para dados estáticos
  const getDadosEstaticos = (erro?: string): IndicadoresComMetadata => ({
    ...INDICADORES_MERCADO,
    fonte: 'estatico' as FonteIndicadores,
    ultimaAtualizacao: new Date(),
    erro
  });

  // Função para verificar se cache é válido
  const isCacheValid = (): boolean => {
    const agora = Date.now();
    return cacheData.data !== null && (agora - cacheData.timestamp) < updateInterval;
  };

  // Função para buscar dados da API
  const fetchIndicadores = async (forceRefresh = false): Promise<void> => {
    // Se forçado estático ou cache válido e não force refresh, usar cache/estático
    if (forceStatic) {
      setIndicadores(getDadosEstaticos());
      return;
    }

    if (!forceRefresh && isCacheValid() && cacheData.data) {
      setIndicadores(cacheData.data);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 Buscando indicadores da API...');
      const dadosAPI = await getIndicadoresFromAPI();
      
      if (dadosAPI && typeof dadosAPI === 'object') {
        const indicadoresFormatados = formatarDadosAPI(dadosAPI);
        
        // Atualizar cache
        cacheData = {
          data: indicadoresFormatados,
          timestamp: Date.now()
        };
        
        // Salvar no localStorage também
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: indicadoresFormatados,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Não foi possível salvar cache no localStorage');
        }

        setIndicadores(indicadoresFormatados);
        console.log('✅ Indicadores atualizados via API');
      } else {
        throw new Error('Dados da API inválidos');
      }
    } catch (error) {
      console.warn('⚠️ Erro na API, usando dados estáticos:', error);
      
      // Fallback para dados estáticos
      const dadosEstaticos = getDadosEstaticos(
        `Erro na API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
      setIndicadores(dadosEstaticos);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para refresh manual usando force refresh do backend
  const refresh = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Force refresh solicitado pelo usuário...');
      const dadosAPI = await forceUpdateIndicadores();
      
      if (dadosAPI && typeof dadosAPI === 'object') {
        const indicadoresFormatados = formatarDadosAPI(dadosAPI);
        
        // Atualizar cache
        cacheData = {
          data: indicadoresFormatados,
          timestamp: Date.now()
        };
        
        // Salvar no localStorage
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: indicadoresFormatados,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('Não foi possível salvar cache no localStorage');
        }

        setIndicadores(indicadoresFormatados);
        console.log('✅ Force refresh completado com sucesso');
      } else {
        throw new Error('Dados do force refresh inválidos');
      }
    } catch (error) {
      console.warn('⚠️ Erro no force refresh, fallback para dados estáticos:', error);
      const dadosEstaticos = getDadosEstaticos(
        `Erro no refresh: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
      setIndicadores(dadosEstaticos);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar cache do localStorage na inicialização
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem(CACHE_KEY);
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        if (parsed.data && (Date.now() - parsed.timestamp) < updateInterval) {
          cacheData = parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cache do localStorage');
    }

    // Buscar dados inicialmente
    fetchIndicadores();
  }, [forceStatic, updateInterval]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!forceStatic) {
        fetchIndicadores();
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, forceStatic, updateInterval]);

  return {
    indicadores,
    isLoading,
    refresh,
    // Helpers para formatação
    getFormatted: () => ({
      selic: `${indicadores.selic}%`,
      cdi: `${indicadores.cdi}%`,
      igpM: `${indicadores.igpM}%`,
      ipca: `${indicadores.ipca}%`,
      itbiRegistro: `${indicadores.itbiRegistro}%`,
      irGanhoCapital: `${indicadores.irGanhoCapital}%`,
      corretagem: `${indicadores.corretagem}%`,
      valorizacao: `${indicadores.valorizacao}%`
    })
  };
}
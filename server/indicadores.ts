
import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Log para debug
console.log('🔧 Rota de indicadores sendo registrada...');

// --- CONFIGURAÇÕES ---
const REQUEST_TIMEOUT = 8000; // 8 segundos
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos em ms

// --- CACHE EM MEMÓRIA ---
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();

// --- VALORES DE FALLBACK ATUALIZADOS ---
const FALLBACK_DATA = {
  selic: 15.0,
  cdi: 13.25,
  ipca: 5.23,
  igpM: 4.39,
  valorizacao: 4.2
};

// --- FUNÇÕES DE CACHE ---
const getCachedData = (key: string): any | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const isExpired = (Date.now() - entry.timestamp) > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
};

const setCacheData = (key: string, data: any): void => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// --- FUNÇÃO AUXILIAR PARA FETCH ---
const fetchApiData = async (url: string, source: string) => {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'VentusHub/1.0',
        'Accept': 'application/json',
      },
    });
    if (response.status === 200 && response.data) {
      return response.data;
    }
    throw new Error(`Status ${response.status}`);
  } catch (error) {
    console.error(`❌ Erro ao buscar [${source}]: ${error.message}`);
    return null;
  }
};

// --- ROTA DE INDICADORES ---
router.get('/indicadores', async (req, res) => {
  console.log('🎯 Rota /indicadores acionada!');
  const CACHE_KEY = 'indicadores_mercado';
  
  try {
    // 1. Tentar cache primeiro
    const cachedData = getCachedData(CACHE_KEY);
    if (cachedData) {
      console.log('✅ Servindo indicadores do cache');
      return res.status(200).json(cachedData);
    }
    
    console.log('🔄 Cache expirado, buscando APIs externas...');
    
    // 2. URLs das APIs oficiais
    const selicUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
    const cdiUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';
    const ipcaUrl = 'https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/69?localidades=N1[all]';
    const igpmUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/1?formato=json';

    // 3. Buscar dados em paralelo
    const [selicData, cdiData, ipcaData, igpmData] = await Promise.all([
      fetchApiData(selicUrl, 'SELIC'),
      fetchApiData(cdiUrl, 'CDI'), 
      fetchApiData(ipcaUrl, 'IPCA'),
      fetchApiData(igpmUrl, 'IGP-M'),
    ]);

    // 4. Processar dados com fallback inteligente
    const selic = parseFloat(selicData?.[0]?.valor) || FALLBACK_DATA.selic;
    const cdi = parseFloat(cdiData?.[0]?.valor) || FALLBACK_DATA.cdi;
    const igpM = parseFloat(igpmData?.[0]?.valor) || FALLBACK_DATA.igpM;

    let ipca = FALLBACK_DATA.ipca;
    if (ipcaData?.[0]?.resultados?.[0]?.series?.[0]?.serie) {
      const serie = ipcaData[0].resultados[0].series[0].serie;
      const lastValue = Object.values(serie)[0];
      ipca = parseFloat(lastValue as string) || FALLBACK_DATA.ipca;
    }
    
    // 5. Incluir valorização estática (não disponível via API)
    const resultado = {
      selic,
      cdi,
      ipca,
      igpM,
      valorizacao: FALLBACK_DATA.valorizacao,
      ultimaAtualizacao: new Date().toISOString(),
      fonte: 'api'
    };

    // 6. Salvar no cache
    setCacheData(CACHE_KEY, resultado);
    console.log('✅ Indicadores atualizados e salvos no cache');

    res.status(200).json(resultado);

  } catch (error) {
    console.error('🚨 Erro fatal no endpoint /api/indicadores:', error);
    
    // Fallback final com dados estáticos
    const fallbackResponse = {
      ...FALLBACK_DATA,
      ultimaAtualizacao: new Date().toISOString(),
      fonte: 'fallback',
      error: 'Erro no servidor ao processar os indicadores - usando dados de fallback.'
    };
    
    res.status(500).json(fallbackResponse);
  }
});

// --- ROTA DE FORCE REFRESH ---
router.post('/indicadores/refresh', async (req, res) => {
  const CACHE_KEY = 'indicadores_mercado';
  
  try {
    console.log('🔄 Force refresh solicitado, limpando cache...');
    
    // Limpar cache existente
    cache.delete(CACHE_KEY);
    
    // Redirecionar para o endpoint principal que buscará dados frescos
    const response = await fetch('http://localhost:5000/api/indicadores');
    const data = await response.json();
    
    res.status(200).json({
      message: 'Cache limpo e dados atualizados',
      data
    });
    
  } catch (error) {
    console.error('🚨 Erro no force refresh:', error);
    res.status(500).json({
      error: 'Erro ao forçar atualização dos indicadores'
    });
  }
});

export default router;

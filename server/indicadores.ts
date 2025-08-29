
import { Router } from 'express';
import axios from 'axios';

const router = Router();


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
  ipca: 5.23, // IPCA últimos 12 meses (sempre estático para garantir precisão)
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
  } catch (error: any) {
    console.error(`❌ Erro ao buscar [${source}]: ${error.message}`);
    return null;
  }
};

// --- FUNÇÃO PARA BUSCAR IPCA DO SITE OFICIAL DO IBGE ---
const fetchIPCAFromIBGE = async (): Promise<number | null> => {
  try {
    console.log('🔍 Buscando IPCA do site oficial do IBGE...');
    const response = await axios.get('https://www.ibge.gov.br/explica/inflacao.php', {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (response.status === 200 && response.data) {
      // Regex para extrair o IPCA acumulado de 12 meses
      const ipcaRegex = /<li class="variavel">\s*<h3 class="variavel-titulo">IPCA acumulado de 12 meses<\/h3>\s*<p class="variavel-dado">([0-9,]+)%<\/p>/i;
      const match = response.data.match(ipcaRegex);
      
      if (match && match[1]) {
        // Converter vírgula para ponto e fazer parse
        const ipcaValue = parseFloat(match[1].replace(',', '.'));
        console.log(`✅ IPCA extraído do IBGE: ${ipcaValue}%`);
        return ipcaValue;
      } else {
        console.warn('⚠️ IPCA não encontrado na estrutura HTML esperada');
        return null;
      }
    }
    
    throw new Error(`Status ${response.status}`);
  } catch (error: any) {
    console.error(`❌ Erro ao buscar IPCA do IBGE: ${error.message}`);
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
    const igpmUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/1?formato=json';

    // 3. Buscar dados em paralelo (incluindo IPCA do site oficial)
    const [selicData, cdiData, igpmData, ipcaFromIBGE] = await Promise.all([
      fetchApiData(selicUrl, 'SELIC'),
      fetchApiData(cdiUrl, 'CDI'), 
      fetchApiData(igpmUrl, 'IGP-M'),
      fetchIPCAFromIBGE(), // Buscar do site oficial do IBGE
    ]);

    // 4. Processar dados com fallback inteligente
    const selic = parseFloat(selicData?.[0]?.valor) || FALLBACK_DATA.selic;
    const cdi = parseFloat(cdiData?.[0]?.valor) || FALLBACK_DATA.cdi;
    const igpM = parseFloat(igpmData?.[0]?.valor) || FALLBACK_DATA.igpM;

    // IPCA: Usar valor do site oficial do IBGE ou fallback
    const ipca = ipcaFromIBGE || FALLBACK_DATA.ipca;
    
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

  } catch (error: any) {
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
    
  } catch (error: any) {
    console.error('🚨 Erro no force refresh:', error);
    res.status(500).json({
      error: 'Erro ao forçar atualização dos indicadores'
    });
  }
});

export default router;

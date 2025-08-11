
import { Router } from 'express';
import axios from 'axios';

const router = Router();

// --- CONFIGURAÇÕES ---
const REQUEST_TIMEOUT = 8000; // 8 segundos

// --- VALORES DE FALLBACK ---
const FALLBACK_DATA = {
  selic: 10.50,
  cdi: 10.40,
  ipca: 4.61,
  igpM: -0.47,
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
  try {
    // URLs CORRIGIDAS E VALIDADAS
    const selicUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
    const cdiUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';
    const ipcaUrl = 'https://servicodados.ibge.gov.br/api/v3/agregados/1737/periodos/-1/variaveis/69?localidades=N1[all]';
    const igpmUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.189/dados/ultimos/1?formato=json';

    const [selicData, cdiData, ipcaData, igpmData] = await Promise.all([
      fetchApiData(selicUrl, 'SELIC'),
      fetchApiData(cdiUrl, 'CDI'),
      fetchApiData(ipcaUrl, 'IPCA'),
      fetchApiData(igpmUrl, 'IGP-M'),
    ]);

    // Processamento com fallback
    const selic = parseFloat(selicData?.[0]?.valor) || FALLBACK_DATA.selic;
    const cdi = parseFloat(cdiData?.[0]?.valor) || FALLBACK_DATA.cdi;
    const igpM = parseFloat(igpmData?.[0]?.valor) || FALLBACK_DATA.igpM;

    let ipca = FALLBACK_DATA.ipca;
    if (ipcaData?.[0]?.resultados?.[0]?.series?.[0]?.serie) {
      const serie = ipcaData[0].resultados[0].series[0].serie;
      const lastValue = Object.values(serie)[0];
      ipca = parseFloat(lastValue as string) || FALLBACK_DATA.ipca;
    }

    res.status(200).json({ selic, cdi, ipca, igpM });

  } catch (error) {
    console.error('🚨 Erro fatal no endpoint /api/indicadores:', error);
    res.status(500).json({
      ...FALLBACK_DATA,
      error: 'Erro no servidor ao processar os indicadores.',
    });
  }
});

export default router;

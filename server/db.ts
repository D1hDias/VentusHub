import dotenv from 'dotenv';
dotenv.config();

import * as schema from "../shared/schema";

// Verificar conectividade do banco primeiro
let db: any;
let pool: any = null;

const isDevelopment = process.env.NODE_ENV === 'development';

// Função para tentar conectar com retry e fallback
const conectarComRetry = async (tentativas = 3): Promise<boolean> => {
  for (let i = 1; i <= tentativas; i++) {
    try {
      console.log(`🔄 Tentativa ${i}/${tentativas} de conexão com Neon Database...`);
      
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL não configurada");
      }

      const { Pool, neonConfig } = await import('@neondatabase/serverless');
      const { drizzle } = await import('drizzle-orm/neon-serverless');
      const ws = await import("ws");

      // Configurações otimizadas para conectividade
      neonConfig.webSocketConstructor = ws.default;
      neonConfig.poolQueryViaFetch = true; // Prefer fetch over WebSocket
      neonConfig.useSecureWebSocket = true;
      neonConfig.fetchConnectionCache = true; // Enable connection caching
      
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        max: 2, // Reduzir ainda mais conexões
        min: 0,
        idleTimeoutMillis: 10000, // Reduzir timeout
        connectionTimeoutMillis: 8000, // Timeout mais curto
        query_timeout: 15000,
        statement_timeout: 15000,
        allowExitOnIdle: true,
      });

      // Teste de conectividade com timeout mais agressivo
      const testClient = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 6000)
        )
      ]);
      
      // Query simples para testar
      await Promise.race([
        testClient.query('SELECT 1 as test'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        )
      ]);
      
      testClient.release();
      
      db = drizzle(pool, { schema });
      
      // Error handling para o pool
      pool.on('error', (err: any) => {
        console.warn('⚠️ Database pool error:', err.message);
      });
      
      console.log('✅ Conexão com Neon Database estabelecida com sucesso!');
      return true;

    } catch (error: any) {
      console.warn(`❌ Tentativa ${i} falhou:`, error.message);
      
      if (i < tentativas) {
        const delay = i * 1500; // Delay crescente mais curto
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

// Função para inicializar a conexão (será chamada pelo index.ts)
export const initializeDB = async () => {
  console.log('🚀 Iniciando conexão com banco de dados...');
  
  try {
    // Timeout mais agressivo para inicialização
    const conectado = await Promise.race([
      conectarComRetry(3), // Aumentar tentativas
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na inicialização do banco (20s)')), 20000)
      )
    ]);
    
    if (!conectado) {
      throw new Error("Não foi possível conectar após várias tentativas");
    }
    
    console.log('🎉 Database initialized successfully!');
    return { db, pool };

  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    
    if (isDevelopment) {
      console.log('🔄 Ativando modo fallback para desenvolvimento...');
      
      try {
        const { createFallbackDB } = await import('./db-fallback.js');
        db = createFallbackDB();
        
        console.log('⚠️ Usando banco SQLite local como fallback');
        return { db, pool: null };
      } catch (fallbackError: any) {
        console.error('❌ Fallback database failed:', fallbackError.message);
        throw new Error('Nenhuma opção de banco disponível');
      }
    } else {
      throw error; // Em produção, falhar se não conseguir conectar
    }
  }
};

// Função para verificar se o banco está saudável
export const isDBHealthy = async (): Promise<boolean> => {
  if (!db || !pool) {
    return false;
  }
  
  try {
    const testClient = await Promise.race([
      pool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 3000)
      )
    ]);
    
    await testClient.query('SELECT 1');
    testClient.release();
    return true;
  } catch (error) {
    console.warn('⚠️ Database health check failed:', (error as any).message);
    return false;
  }
};

// Função para reconectar em caso de falha
export const reconnectDB = async (): Promise<boolean> => {
  console.log('🔄 Tentando reconectar ao banco...');
  try {
    if (pool) {
      await pool.end();
      pool = null;
    }
    
    const result = await initializeDB();
    return result.db !== null;
  } catch (error) {
    console.error('❌ Falha na reconexão:', (error as any).message);
    return false;
  }
};

export { db, pool };
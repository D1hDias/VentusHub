import dotenv from 'dotenv';
dotenv.config();

import * as schema from "../shared/schema.js";

// Verificar conectividade do banco primeiro
let db: any;
let pool: any = null;

const isDevelopment = process.env.NODE_ENV === 'development';

// Função para tentar conectar com retry
const conectarComRetry = async (tentativas = 3): Promise<boolean> => {
  for (let i = 1; i <= tentativas; i++) {
    try {
      
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL não configurada");
      }

      const { Pool, neonConfig } = await import('@neondatabase/serverless');
      const { drizzle } = await import('drizzle-orm/neon-serverless');
      const ws = await import("ws");

      neonConfig.webSocketConstructor = ws.default;

      // Configuração mais robusta para lidar com timeouts
      neonConfig.poolQueryViaFetch = true; // Usar fetch em vez de WebSocket quando possível
      neonConfig.useSecureWebSocket = true;
      
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        max: 3, // Reduzido ainda mais
        min: 0, // Permitir zero conexões ativas
        idleTimeoutMillis: 20000, // Reduzido
        connectionTimeoutMillis: 5000, // Reduzido
        query_timeout: 10000, // Timeout de query
        statement_timeout: 10000, // Timeout de statement
        // Configurações de reconexão
        allowExitOnIdle: true,
      });

      // Teste de conectividade rápido
      const testClient = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na conexão')), 5000))
      ]);
      
      await testClient.query('SELECT NOW()');
      testClient.release();
      
      db = drizzle(pool, { schema });
      
      // Melhor tratamento de erros do pool
      pool.on('error', (err: any) => {
        if (isDevelopment) {
          console.warn('⚠️ Pool error (será reconectado):', err.message);
        }
      });
      
      return true;

    } catch (error) {
      
      if (i < tentativas) {
        await new Promise(resolve => setTimeout(resolve, i * 2000));
      }
    }
  }
  return false;
};

// Função para inicializar a conexão (será chamada pelo index.ts)
export const initializeDB = async () => {
  
  try {
    // Adicionar timeout geral para inicialização
    const conectado = await Promise.race([
      conectarComRetry(2),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na inicialização do banco (30s)')), 30000)
      )
    ]);
    
    if (!conectado) {
      throw new Error("Não foi possível conectar após várias tentativas");
    }
    
    return { db, pool };

  } catch (error) {
    
    if (isDevelopment) {
      
      const { createFallbackDB } = await import('./db-fallback.js');
      db = createFallbackDB();
      
      return { db, pool: null };
    } else {
      throw error; // Em produção, falhar se não conseguir conectar
    }
  }
};

export { db, pool };
import dotenv from 'dotenv';
dotenv.config();

import * as schema from "../shared/schema.js";

// Usar sempre Neon PostgreSQL (configuração original)
console.log("🔧 Usando Neon PostgreSQL");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool, neonConfig } = await import('@neondatabase/serverless');
const { drizzle } = await import('drizzle-orm/neon-serverless');
const ws = await import("ws");

neonConfig.webSocketConstructor = ws.default;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool, { schema });

// Adicionar tratamento de erros do pool
pool.on('error', (err: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Database pool error:', err.message);
  }
});

export { db, pool };
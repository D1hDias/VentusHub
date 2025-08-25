/**
 * Neon Database Configuration - Enhanced with retry logic and fallback
 */
import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "../shared/schema.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Enhanced connection with timeout and retry configuration
const sql = neon(DATABASE_URL, {
  fetchConnectionCache: true,
  connectionTimeoutMillis: 30000, // 30 seconds timeout
});

const db = drizzle(sql, { schema });

// Export pool for compatibility with existing code
const pool = null; // Simplified - no pool needed with HTTP connection

// Retry utility function for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Log retry attempt
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`🔄 Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        console.log(`   Error: ${error.message}`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  console.error(`❌ Database operation failed after ${maxRetries} attempts`);
  throw lastError!;
}

// Enhanced database query wrapper with automatic retry
export async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  return withRetry(queryFn, 3, 1000);
}

// Initialize function for server startup
export async function initializeDB() {
  try {
    console.log('🔄 Initializing Neon database (HTTP mode with retry logic)...');
    
    // Test connection with retry logic
    const result = await withRetry(async () => {
      return await sql`SELECT 1 as test, NOW() as time`;
    }, 5, 2000); // 5 retries with 2s base delay for initialization
    
    if (result[0]?.test === 1) {
      console.log('✅ Database connection successful');
      console.log('🕐 Database time:', result[0].time);
      return true;
    } else {
      throw new Error('Database test query failed');
    }
  } catch (error: any) {
    console.error('❌ Database initialization failed after all retries:', error.message);
    
    // Log additional context for debugging
    if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.error('💡 Timeout error - check DATABASE_URL and network connectivity');
      console.error('💡 Consider using fallback database or implementing circuit breaker');
    }
    
    throw error;
  }
}

// Health check function for monitoring
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number; error?: string }> {
  const start = Date.now();
  
  try {
    await withRetry(async () => {
      return await sql`SELECT 1`;
    }, 2, 500); // Quick health check with minimal retries
    
    const latency = Date.now() - start;
    return { healthy: true, latency };
  } catch (error: any) {
    const latency = Date.now() - start;
    return { healthy: false, latency, error: error.message };
  }
}

export { db, pool, sql };
export default db;
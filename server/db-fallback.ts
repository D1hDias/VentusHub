/**
 * DATABASE FALLBACK SYSTEM - Enhanced for VentusHub
 * 
 * Provides graceful degradation when database is unavailable
 * Implements circuit breaker pattern and in-memory caching
 */

import { checkDatabaseHealth, withRetry } from './db.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DatabaseFallback {
  private cache = new Map<string, CacheEntry<any>>();
  private circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly timeoutWindow = 30000; // 30 seconds
  private readonly cacheDefaultTtl = 300000; // 5 minutes

  /**
   * Execute database operation with fallback support
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallbackData?: T,
    cacheKey?: string,
    cacheTtl?: number
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreakerState === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeoutWindow) {
        this.circuitBreakerState = 'HALF_OPEN';
      } else {
        console.warn('🔴 Circuit breaker OPEN - using fallback');
        return this.getFallbackData(cacheKey, fallbackData);
      }
    }

    try {
      // Execute operation with retry
      const result = await withRetry(operation, 2, 1000);
      
      // Success - reset circuit breaker and cache result
      this.onSuccess(result, cacheKey, cacheTtl);
      return result;
      
    } catch (error: any) {
      console.error('❌ Database operation failed:', error.message);
      
      // Handle failure
      this.onFailure();
      
      // Return fallback data
      return this.getFallbackData(cacheKey, fallbackData);
    }
  }

  /**
   * Get cached data or fallback
   */
  private getFallbackData<T>(cacheKey?: string, fallbackData?: T): T {
    if (cacheKey && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (Date.now() - entry.timestamp < entry.ttl) {
        console.log('✅ Using cached data for:', cacheKey);
        return entry.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    if (fallbackData !== undefined) {
      console.log('⚠️ Using fallback data');
      return fallbackData;
    }

    throw new Error('No fallback data available and database is unavailable');
  }

  /**
   * Handle successful operation
   */
  private onSuccess<T>(result: T, cacheKey?: string, cacheTtl?: number) {
    // Reset circuit breaker
    if (this.circuitBreakerState === 'HALF_OPEN') {
      console.log('✅ Circuit breaker reset to CLOSED');
      this.circuitBreakerState = 'CLOSED';
    }
    this.failureCount = 0;

    // Cache successful result
    if (cacheKey && result) {
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: cacheTtl || this.cacheDefaultTtl
      });
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      console.warn(`🔴 Circuit breaker OPENED after ${this.failureCount} failures`);
      this.circuitBreakerState = 'OPEN';
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      circuitBreakerState: this.circuitBreakerState,
      failureCount: this.failureCount,
      cacheSize: this.cache.size,
      lastFailureTime: this.lastFailureTime
    };
  }

  /**
   * Manual circuit breaker reset
   */
  resetCircuitBreaker() {
    this.circuitBreakerState = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log('🔄 Circuit breaker manually reset');
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Health check with fallback info
   */
  async getHealthStatus() {
    const dbHealth = await checkDatabaseHealth();
    return {
      database: dbHealth,
      fallback: this.getStatus()
    };
  }
}

// Export singleton instance
export const dbFallback = new DatabaseFallback();

/**
 * Common fallback data for different scenarios
 */
export const fallbackData = {
  notifications: {
    summary: { total: 0, unread: 0, urgent: 0 },
    empty: []
  },
  users: {
    anonymous: { id: 'anonymous', name: 'Guest User', email: '' }
  }
};

// Legacy exports for compatibility
export const mockUser = {
  id: "demo-user-id",
  name: "Demo User", 
  email: "demo@ventushub.com",
  role: "USER",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

export const mockProperties = [
  {
    id: 1,
    userId: "demo-user-id",
    type: "casa",
    registrationNumber: "DEMO001",
    sequenceNumber: "001",
    street: "Rua Demo",
    number: "123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01000-000",
    area: 120,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    value: 500000,
    stage: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
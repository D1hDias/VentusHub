/**
 * HEALTH MONITORING ROUTES - Enhanced system health check
 * 
 * Provides comprehensive health monitoring for VentusHub system
 * Includes database, fallback system, and circuit breaker status
 */

import { Router } from 'express';
import { checkDatabaseHealth } from './db.js';
import { dbFallback } from './db-fallback.js';

const router = Router();

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', async (req, res) => {
  try {
    const health = await getSystemHealth();
    const isHealthy = health.database.healthy && health.fallback.circuitBreakerState !== 'OPEN';
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      ...health
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/detailed
 * Comprehensive health check with metrics
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await getSystemHealth();
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    res.json({
      status: health.database.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        human: formatUptime(uptime)
      },
      memory: {
        rss: formatBytes(memory.rss),
        heapTotal: formatBytes(memory.heapTotal),
        heapUsed: formatBytes(memory.heapUsed),
        external: formatBytes(memory.external)
      },
      database: health.database,
      fallback: health.fallback,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * POST /api/health/reset-circuit-breaker
 * Manual circuit breaker reset
 */
router.post('/reset-circuit-breaker', async (req, res) => {
  try {
    dbFallback.resetCircuitBreaker();
    
    res.json({
      message: 'Circuit breaker reset successfully',
      timestamp: new Date().toISOString(),
      status: dbFallback.getStatus()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to reset circuit breaker',
      message: error.message
    });
  }
});

/**
 * DELETE /api/health/clear-cache
 * Clear fallback system cache
 */
router.delete('/clear-cache', async (req, res) => {
  try {
    dbFallback.clearCache();
    
    res.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
      status: dbFallback.getStatus()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * Get comprehensive system health
 */
async function getSystemHealth() {
  const [dbHealth, fallbackStatus] = await Promise.all([
    checkDatabaseHealth(),
    Promise.resolve(dbFallback.getStatus())
  ]);

  return {
    database: dbHealth,
    fallback: fallbackStatus
  };
}

/**
 * Format uptime in human readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format bytes in human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
/**
 * Health Check Endpoint - Uptime Monitoring
 *
 * Provides health check endpoint for external monitoring (UptimeRobot, Pingdom, etc.)
 * Checks:
 * - Database connectivity
 * - Storage connectivity
 * - Functions availability
 *
 * ISO 27001 A.17, SOC 2 Availability
 */

import { onRequest } from 'firebase-functions/v2/https';
import { db, storage } from './admin';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  durationMs?: number;
  checks: {
    database: { status: 'ok' | 'error'; responseTimeMs?: number; error?: string };
    storage: { status: 'ok' | 'error'; error?: string };
    functions: { status: 'ok' | 'error'; error?: string };
  };
  version?: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{ status: 'ok' | 'error'; responseTimeMs?: number; error?: string }> {
  const startTime = Date.now();
  try {
    // Simple read operation to verify connectivity
    await db.ref('.info/serverTimeOffset').once('value');
    const responseTime = Date.now() - startTime;
    return { status: 'ok', responseTimeMs: responseTime };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check storage connectivity
 */
async function checkStorage(): Promise<{ status: 'ok' | 'error'; error?: string }> {
  try {
    const bucket = storage.bucket();
    if (!bucket) {
      return { status: 'error', error: 'Storage bucket not initialized' };
    }
    // Check if bucket exists and is accessible
    const [exists] = await bucket.exists();
    if (exists) {
      return { status: 'ok' };
    } else {
      return { status: 'error', error: 'Storage bucket not found' };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Health check endpoint
 */
export const healthCheck = onRequest(
  { cors: true },
  async (req, res) => {
    const startTime = Date.now();

    try {
      // Run all health checks in parallel (startTime used for duration below)
      const [databaseCheck, storageCheck] = await Promise.all([
        checkDatabase(),
        checkStorage(),
      ]);

      // Functions check is implicit (if this endpoint responds, functions are working)
      const functionsCheck = { status: 'ok' as const };

      // Determine overall status
      const allChecksOk = databaseCheck.status === 'ok' && storageCheck.status === 'ok' && functionsCheck.status === 'ok';
      const anyCheckFailed = databaseCheck.status === 'error' || storageCheck.status === 'error' || functionsCheck.status === 'error';

      const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = allChecksOk
        ? 'healthy'
        : anyCheckFailed
        ? 'unhealthy'
        : 'degraded';

      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        checks: {
          database: databaseCheck,
          storage: storageCheck,
          functions: functionsCheck,
        },
        version: process.env.K_SERVICE || 'unknown',
      };

      // Return appropriate HTTP status code
      const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

      res.status(httpStatus).json(result);
    } catch (error) {
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'error', error: 'Check failed' },
          storage: { status: 'error', error: 'Check failed' },
          functions: { status: 'error', error: 'Check failed' },
        },
      };

      res.status(503).json(errorResult);
    }
  }
);

/**
 * Simple ping endpoint (for basic uptime monitoring)
 */
export const ping = onRequest(
  { cors: true },
  async (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: '1Stop',
    });
  }
);

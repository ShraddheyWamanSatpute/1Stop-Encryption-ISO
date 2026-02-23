/**
 * Backup Retention Cleanup - ISO 27001 A.17
 *
 * Implements automated cleanup of expired backups based on retention policy:
 * - Daily backups: 60-90 days retention
 * - Monthly snapshots: 12 months retention
 * - Yearly snapshots: 6 years retention
 *
 * Runs daily to clean up expired backups.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Storage } from '@google-cloud/storage';
import { db } from './admin';

const gcsStorage = new Storage();
const BUCKET_NAME = process.env.BACKUP_BUCKET_NAME || '1stop-backups';

// Retention periods in milliseconds
const RETENTION_PERIODS = {
  daily: 90 * 24 * 60 * 60 * 1000, // 90 days
  monthly: 12 * 30 * 24 * 60 * 60 * 1000, // 12 months (approximate)
  yearly: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
};

interface CleanupResult {
  deleted: number;
  failed: number;
  totalSizeDeleted: number;
  errors: string[];
}

/**
 * Clean up expired daily backups
 */
async function cleanupDailyBackups(): Promise<CleanupResult> {
  const bucket = gcsStorage.bucket(BUCKET_NAME);
  const cutoffDate = Date.now() - RETENTION_PERIODS.daily;
  const result: CleanupResult = {
    deleted: 0,
    failed: 0,
    totalSizeDeleted: 0,
    errors: [],
  };

  try {
    const [files] = await bucket.getFiles({ prefix: 'backups/daily/' });

    for (const file of files) {
      const created = file.metadata.timeCreated ? new Date(file.metadata.timeCreated).getTime() : 0;
      
      if (created < cutoffDate) {
        try {
          const size = parseInt(file.metadata.size || '0', 10);
          await file.delete();
          result.deleted++;
          result.totalSizeDeleted += size;
          console.log(`[backupRetentionCleanup] Deleted expired daily backup: ${file.name}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `Failed to delete ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[backupRetentionCleanup] ${errorMsg}`);
        }
      }
    }

    return result;
  } catch (error) {
    const errorMsg = `Error cleaning daily backups: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(`[backupRetentionCleanup] ${errorMsg}`);
    return result;
  }
}

/**
 * Clean up expired monthly snapshots
 */
async function cleanupMonthlyBackups(): Promise<CleanupResult> {
  const bucket = gcsStorage.bucket(BUCKET_NAME);
  const cutoffDate = Date.now() - RETENTION_PERIODS.monthly;
  const result: CleanupResult = {
    deleted: 0,
    failed: 0,
    totalSizeDeleted: 0,
    errors: [],
  };

  try {
    const [files] = await bucket.getFiles({ prefix: 'backups/monthly/' });

    for (const file of files) {
      const created = file.metadata.timeCreated ? new Date(file.metadata.timeCreated).getTime() : 0;
      
      if (created < cutoffDate) {
        try {
          const size = parseInt(file.metadata.size || '0', 10);
          await file.delete();
          result.deleted++;
          result.totalSizeDeleted += size;
          console.log(`[backupRetentionCleanup] Deleted expired monthly backup: ${file.name}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `Failed to delete ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[backupRetentionCleanup] ${errorMsg}`);
        }
      }
    }

    return result;
  } catch (error) {
    const errorMsg = `Error cleaning monthly backups: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(`[backupRetentionCleanup] ${errorMsg}`);
    return result;
  }
}

/**
 * Clean up expired yearly snapshots (older than 6 years)
 */
async function cleanupYearlyBackups(): Promise<CleanupResult> {
  const bucket = gcsStorage.bucket(BUCKET_NAME);
  const cutoffDate = Date.now() - RETENTION_PERIODS.yearly;
  const result: CleanupResult = {
    deleted: 0,
    failed: 0,
    totalSizeDeleted: 0,
    errors: [],
  };

  try {
    const [files] = await bucket.getFiles({ prefix: 'backups/yearly/' });

    for (const file of files) {
      const created = file.metadata.timeCreated ? new Date(file.metadata.timeCreated).getTime() : 0;
      
      if (created < cutoffDate) {
        try {
          const size = parseInt(file.metadata.size || '0', 10);
          await file.delete();
          result.deleted++;
          result.totalSizeDeleted += size;
          console.log(`[backupRetentionCleanup] Deleted expired yearly backup: ${file.name}`);
        } catch (error) {
          result.failed++;
          const errorMsg = `Failed to delete ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[backupRetentionCleanup] ${errorMsg}`);
        }
      }
    }

    return result;
  } catch (error) {
    const errorMsg = `Error cleaning yearly backups: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(`[backupRetentionCleanup] ${errorMsg}`);
    return result;
  }
}

/**
 * Clean up expired backup metadata from database
 */
async function cleanupBackupMetadata(): Promise<number> {
  const cutoffDate = Date.now() - RETENTION_PERIODS.daily;
  let deleted = 0;

  try {
    const metadataRef = db.ref('backups/metadata');
    const snapshot = await metadataRef.once('value');

    if (!snapshot.exists()) {
      return 0;
    }

    const updates: Record<string, null> = {};
    snapshot.forEach((child) => {
      const timestamp = parseInt(child.key || '0', 10);
      if (timestamp < cutoffDate) {
        updates[child.key!] = null;
        deleted++;
      }
    });

    if (Object.keys(updates).length > 0) {
      await metadataRef.update(updates);
    }

    return deleted;
  } catch (error) {
    console.error('[backupRetentionCleanup] Error cleaning backup metadata:', error);
    return deleted;
  }
}

/**
 * Main cleanup function
 */
export async function runBackupRetentionCleanup(): Promise<{
  daily: CleanupResult;
  monthly: CleanupResult;
  yearly: CleanupResult;
  metadataDeleted: number;
}> {
  console.log('[backupRetentionCleanup] Starting backup retention cleanup...');

  const [dailyResult, monthlyResult, yearlyResult, metadataDeleted] = await Promise.all([
    cleanupDailyBackups(),
    cleanupMonthlyBackups(),
    cleanupYearlyBackups(),
    cleanupBackupMetadata(),
  ]);

  const summary = {
    daily: dailyResult,
    monthly: monthlyResult,
    yearly: yearlyResult,
    metadataDeleted,
  };

  console.log('[backupRetentionCleanup] Cleanup completed:', {
    dailyDeleted: dailyResult.deleted,
    monthlyDeleted: monthlyResult.deleted,
    yearlyDeleted: yearlyResult.deleted,
    metadataDeleted,
    totalSizeDeleted: dailyResult.totalSizeDeleted + monthlyResult.totalSizeDeleted + yearlyResult.totalSizeDeleted,
  });

  return summary;
}

/**
 * Scheduled Cloud Function - Daily cleanup
 */
export const backupRetentionCleanup = onSchedule(
  {
    schedule: '0 3 * * *', // Daily at 03:00 UTC (after backup completes)
    timeZone: 'UTC',
    memory: '256MiB',
    timeoutSeconds: 540,
  },
  async () => {
    console.log('[backupRetentionCleanup] Scheduled cleanup triggered');
    try {
      const result = await runBackupRetentionCleanup();
      console.log('[backupRetentionCleanup] Cleanup completed:', result);
    } catch (error) {
      console.error('[backupRetentionCleanup] Cleanup failed:', error);
    }
  }
);

/**
 * Backup Restore Service - ISO 27001 A.17
 *
 * Provides functionality to restore from backups for testing and disaster recovery.
 * 
 * Usage:
 * - Restore testing (quarterly requirement)
 * - Disaster recovery scenarios
 * 
 * Security: Only callable by super-admin or via secure admin interface
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Storage } from '@google-cloud/storage';
import { db } from './admin';

const gcsStorage = new Storage();
const BUCKET_NAME = process.env.BACKUP_BUCKET_NAME || '1stop-backups';

interface RestoreOptions {
  backupPath: string;
  targetPath?: string; // Optional: restore to specific path (for testing)
  dryRun?: boolean; // If true, validate backup but don't restore
}

interface RestoreResult {
  success: boolean;
  backupPath: string;
  restoredRecords: number;
  restoredSize: number;
  durationMs: number;
  error?: string;
  dryRun?: boolean;
}

/**
 * Validate backup file exists and is readable
 */
async function validateBackup(backupPath: string): Promise<{ valid: boolean; size: number; error?: string }> {
  try {
    const bucket = gcsStorage.bucket(BUCKET_NAME);
    const file = bucket.file(backupPath);
    
    const [exists] = await file.exists();
    if (!exists) {
      return { valid: false, size: 0, error: 'Backup file not found' };
    }

    const [metadata] = await file.getMetadata();
    const size = parseInt(metadata.size || '0', 10);

    // Try to read first few bytes to verify file is readable
    await file.download({ start: 0, end: 1024 });

    return { valid: true, size };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restore database from backup
 */
async function restoreDatabase(backupPath: string, targetPath?: string, dryRun: boolean = false): Promise<RestoreResult> {
  const startTime = Date.now();
  
  try {
    // Validate backup
    const validation = await validateBackup(backupPath);
    if (!validation.valid) {
      return {
        success: false,
        backupPath,
        restoredRecords: 0,
        restoredSize: 0,
        durationMs: Date.now() - startTime,
        error: validation.error,
        dryRun,
      };
    }

    if (dryRun) {
      // Dry run: just validate
      return {
        success: true,
        backupPath,
        restoredRecords: 0,
        restoredSize: validation.size,
        durationMs: Date.now() - startTime,
        dryRun: true,
      };
    }

    // Download backup file
    const bucket = gcsStorage.bucket(BUCKET_NAME);
    const file = bucket.file(backupPath);
    const [buffer] = await file.download();
    const jsonData = buffer.toString('utf-8');
    const data = JSON.parse(jsonData);

    // Restore to database
    const restorePath = targetPath || '/';
    const restoreRef = db.ref(restorePath);
    
    // Count records before restore
    const beforeSnapshot = await restoreRef.once('value');
    const beforeCount = beforeSnapshot.exists() ? Object.keys(beforeSnapshot.val() || {}).length : 0;

    // Restore data
    await restoreRef.set(data);

    // Count records after restore
    const afterSnapshot = await restoreRef.once('value');
    const afterCount = afterSnapshot.exists() ? Object.keys(afterSnapshot.val() || {}).length : 0;

    const restoredRecords = afterCount - beforeCount;

    return {
      success: true,
      backupPath,
      restoredRecords,
      restoredSize: validation.size,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      backupPath,
      restoredRecords: 0,
      restoredSize: 0,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List available backups
 */
async function listBackups(type?: 'daily' | 'monthly' | 'yearly'): Promise<Array<{ path: string; size: number; created: string }>> {
  const bucket = gcsStorage.bucket(BUCKET_NAME);
  const prefix = type ? `backups/${type}/` : 'backups/';
  
  const [files] = await bucket.getFiles({ prefix });
  
  return files
    .filter(file => file.name.endsWith('.json'))
    .map(file => ({
      path: file.name,
      size: parseInt(file.metadata.size || '0', 10),
      created: file.metadata.timeCreated || '',
    }))
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
}

/**
 * Callable function: Restore from backup
 * 
 * Security: Should be restricted to super-admin only
 */
export const restoreFromBackup = onCall(
  {
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async (request) => {
    // Security: Require super-admin or admin role
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Check for super-admin claim or admin role
    const isSuperAdmin = auth.token.superAdmin === true;
    const isAdmin = auth.token.admin === true || auth.token.role === 'admin' || auth.token.role === 'owner';
    
    if (!isSuperAdmin && !isAdmin) {
      throw new HttpsError('permission-denied', 'Super-admin or admin access required for backup restore');
    }

    const { backupPath, targetPath, dryRun } = request.data as RestoreOptions;

    if (!backupPath) {
      throw new HttpsError('invalid-argument', 'backupPath is required');
    }

    const result = await restoreDatabase(backupPath, targetPath, dryRun || false);
    
    // Log restore operation
    await db.ref('backups/restoreLogs').push({
      timestamp: Date.now(),
      backupPath,
      targetPath: targetPath || '/',
      dryRun: dryRun || false,
      result,
      requestedBy: request.auth?.uid || 'unknown',
    });

    return result;
  }
);

/**
 * Callable function: List available backups
 * 
 * Security: Requires authentication (admin or super-admin)
 */
export const listAvailableBackups = onCall(
  async (request) => {
    // Security: Require authentication
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Allow admin, owner, or super-admin to list backups
    const isSuperAdmin = auth.token.superAdmin === true;
    const isAdmin = auth.token.admin === true || auth.token.role === 'admin' || auth.token.role === 'owner';
    
    if (!isSuperAdmin && !isAdmin) {
      throw new HttpsError('permission-denied', 'Admin access required to list backups');
    }

    const { type } = request.data as { type?: 'daily' | 'monthly' | 'yearly' };
    
    const backups = await listBackups(type);
    return { backups, count: backups.length };
  }
);

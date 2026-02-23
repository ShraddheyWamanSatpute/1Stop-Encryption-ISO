/**
 * Scheduled GDPR retention cleanup and user account anonymization
 * 
 * Runs daily at 4 AM UTC (1 hour after log cleanup).
 * 
 * Tasks:
 * 1. Run data retention cleanup (archive/delete/anonymize expired records)
 * 2. Process pending user account anonymizations (grace period expired)
 * 
 * Reference: GDPR Art. 5, ISO 27701, ICO Retention Guidance
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from './admin';

/**
 * Run retention cleanup for all companies
 */
async function runRetentionCleanupForAllCompanies(): Promise<{
  companiesProcessed: number;
  totalArchived: number;
  totalDeleted: number;
  totalAnonymized: number;
}> {
  const companiesSnapshot = await db.ref('companies').once('value');
  const companies = companiesSnapshot.val();
  if (!companies) {
    return { companiesProcessed: 0, totalArchived: 0, totalDeleted: 0, totalAnonymized: 0 };
  }

  let companiesProcessed = 0;
  let totalArchived = 0;
  let totalDeleted = 0;
  let totalAnonymized = 0;

  for (const companyId of Object.keys(companies)) {
    try {
      // Import DataRetentionService dynamically (client-side service)
      // For Cloud Functions, we'll use Admin SDK directly
      const recordsRef = db.ref(`compliance/dataRetention/records/${companyId}`);
      const recordsSnapshot = await recordsRef.once('value');
      const records = recordsSnapshot.val();
      
      if (!records) continue;

      const now = Date.now();
      const policiesRef = db.ref(`compliance/dataRetention/policies/${companyId}`);
      const policiesSnapshot = await policiesRef.once('value');
      const policies = policiesSnapshot.val() || {};

      for (const [recordId, record] of Object.entries(records)) {
        const rec = record as {
          expiresAt?: number;
          isArchived?: boolean;
          isDeleted?: boolean;
          isAnonymized?: boolean;
          dataCategory?: string;
          dataPath?: string;
        };

        if (!rec || rec.isDeleted || rec.isAnonymized) continue;
        if (!rec.expiresAt || rec.expiresAt > now) continue;

        const policy = policies[rec.dataCategory || ''] as {
          autoArchive?: boolean;
          autoDelete?: boolean;
          autoAnonymize?: boolean;
        } | undefined;

        if (!policy) continue;

        try {
          if (!rec.isArchived && policy.autoArchive) {
            await recordsRef.child(recordId).update({
              isArchived: true,
              archivedAt: now,
            });
            totalArchived++;
          }

          if (policy.autoDelete) {
            // Delete the record and data
            await recordsRef.child(recordId).update({
              isDeleted: true,
              deletedAt: now,
            });
            
            if (rec.dataPath) {
              await db.ref(rec.dataPath).remove();
            }
            
            totalDeleted++;
          } else if (policy.autoAnonymize && !rec.isAnonymized) {
            // Anonymize the record
            await recordsRef.child(recordId).update({
              isAnonymized: true,
              anonymizedAt: now,
            });
            
            // Anonymize actual data (simplified - full logic in DataRetentionService)
            if (rec.dataPath) {
              const dataRef = db.ref(rec.dataPath);
              const dataSnapshot = await dataRef.once('value');
              if (dataSnapshot.exists()) {
                const data = dataSnapshot.val() as Record<string, unknown>;
                const anonymized: Record<string, unknown> = {};
                
                // Generic anonymization
                if (data.name) anonymized.name = 'Deleted User';
                if (data.email) anonymized.email = `${recordId}@deleted.local`;
                if (data.phone) anonymized.phone = null;
                if (data.address) anonymized.address = null;
                
                await dataRef.update(anonymized);
              }
            }
            
            totalAnonymized++;
          }
        } catch (err) {
          console.error(`[gdprRetentionCleanup] Error processing record ${recordId}:`, err);
        }
      }

      companiesProcessed++;
    } catch (err) {
      console.error(`[gdprRetentionCleanup] Error processing company ${companyId}:`, err);
    }
  }

  return { companiesProcessed, totalArchived, totalDeleted, totalAnonymized };
}

/**
 * Process pending user account anonymizations
 */
async function processPendingUserAnonymizations(): Promise<{
  processed: number;
  errors: number;
}> {
  const usersRef = db.ref('users');
  const usersSnapshot = await usersRef.once('value');
  const users = usersSnapshot.val();
  if (!users) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;
  const now = Date.now();

  for (const [userId, userData] of Object.entries(users)) {
    try {
      const deletionStatusRef = db.ref(`users/${userId}/deletionStatus`);
      const statusSnapshot = await deletionStatusRef.once('value');
      
      if (!statusSnapshot.exists()) continue;

      const status = statusSnapshot.val() as {
        isDeleted?: boolean;
        isAnonymized?: boolean;
        gracePeriodEndsAt?: number;
      };

      if (
        status.isDeleted &&
        !status.isAnonymized &&
        status.gracePeriodEndsAt &&
        status.gracePeriodEndsAt < now
      ) {
        // Anonymize user account
        const anonymizedEmail = `${userId}@deleted.local`;
        
        // Update user profile
        await db.ref(`users/${userId}`).update({
          displayName: 'Deleted User',
          email: anonymizedEmail,
          photoURL: null,
          phoneNumber: null,
        });

        // Update personal settings
        await db.ref(`users/${userId}/settings/personal`).update({
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          address: null,
          emergencyContact: null,
          bankDetails: null,
          niNumber: null,
          taxCode: null,
        });

        // Mark as anonymized
        await deletionStatusRef.update({
          isAnonymized: true,
          anonymizedAt: now,
        });

        processed++;
      }
    } catch (err) {
      console.error(`[gdprRetentionCleanup] Error anonymizing user ${userId}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Scheduled function: GDPR retention cleanup
 * Runs daily at 4 AM UTC
 */
export const gdprRetentionCleanup = onSchedule(
  {
    schedule: '0 4 * * *', // 4 AM UTC daily
    timeZone: 'UTC',
  },
  async () => {
    console.log('[gdprRetentionCleanup] Starting GDPR retention cleanup...');

    // 1. Run retention cleanup for all companies
    const retentionResults = await runRetentionCleanupForAllCompanies();
    console.log('[gdprRetentionCleanup] Retention cleanup:', retentionResults);

    // 2. Process pending user account anonymizations
    const anonymizationResults = await processPendingUserAnonymizations();
    console.log('[gdprRetentionCleanup] User anonymizations:', anonymizationResults);

    console.log('[gdprRetentionCleanup] Completed GDPR retention cleanup');
  }
);

/**
 * User Account Deletion Service
 *
 * Implements GDPR Art. 17 (Right to Erasure) with soft-delete → grace period → anonymization flow.
 *
 * Policy:
 * - Stage 1: User clicks delete → Soft delete + 30-day grace period
 * - Stage 2: After grace period → Anonymize user record
 * - Stage 3: Legal-required data → Retain but anonymized
 *
 * Reference: GDPR Art. 17, ISO 27701, ICO Right to Erasure Guidance
 */

import { ref, get, update, set, remove } from 'firebase/database';
import { db } from '../Firebase';
import { auditTrailService } from './AuditTrailService';
import { sensitiveDataService } from '../encryption/SensitiveDataService';

/**
 * User deletion status
 */
export interface UserDeletionStatus {
  userId: string;
  isDeleted: boolean;
  deletedAt?: number;
  gracePeriodEndsAt?: number;
  isAnonymized: boolean;
  anonymizedAt?: number;
  retentionExemptions?: string[];
}

/**
 * Anonymization result
 */
export interface AnonymizationResult {
  userId: string;
  fieldsAnonymized: string[];
  fieldsDeleted: string[];
  recordsAffected: number;
}

/**
 * User Account Deletion Service
 */
export class UserAccountDeletionService {
  private readonly GRACE_PERIOD_DAYS = 30;
  private readonly _deletionStatusPath = 'users/{userId}/deletionStatus';

  /**
   * Initiate user account deletion (soft delete)
   * Sets deletion flag and grace period end date
   */
  async initiateDeletion(
    userId: string,
    companyId: string,
    requestedBy: string
  ): Promise<UserDeletionStatus> {
    const now = Date.now();
    const gracePeriodEndsAt = now + this.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

    const deletionStatus: UserDeletionStatus = {
      userId,
      isDeleted: true,
      deletedAt: now,
      gracePeriodEndsAt,
      isAnonymized: false,
    };

    // Store deletion status
    const statusRef = ref(db, `users/${userId}/deletionStatus`);
    await set(statusRef, deletionStatus);

    // Log the deletion request
    await auditTrailService.log('data_delete', requestedBy, companyId, {
      resourceType: 'user_account',
      resourceId: userId,
      description: `User account deletion initiated. Grace period ends: ${new Date(gracePeriodEndsAt).toISOString()}`,
      metadata: {
        gracePeriodDays: this.GRACE_PERIOD_DAYS,
        gracePeriodEndsAt,
      },
    });

    return deletionStatus;
  }

  /**
   * Restore user account (within grace period)
   */
  async restoreAccount(
    userId: string,
    companyId: string,
    restoredBy: string
  ): Promise<void> {
    const statusRef = ref(db, `users/${userId}/deletionStatus`);
    const snapshot = await get(statusRef);

    if (!snapshot.exists()) {
      throw new Error('No deletion status found for user');
    }

    const status = snapshot.val() as UserDeletionStatus;

    if (status.isAnonymized) {
      throw new Error('Cannot restore anonymized account');
    }

    if (status.gracePeriodEndsAt && Date.now() > status.gracePeriodEndsAt) {
      throw new Error('Grace period has expired. Account cannot be restored.');
    }

    await remove(statusRef);

    await auditTrailService.log('data_update', restoredBy, companyId, {
      resourceType: 'user_account',
      resourceId: userId,
      description: 'User account restoration (within grace period)',
    });
  }

  /**
   * Anonymize user account (after grace period)
   * Replaces PII with anonymized values
   */
  async anonymizeUserAccount(
    userId: string,
    companyId: string,
    anonymizedBy: string
  ): Promise<AnonymizationResult> {
    const result: AnonymizationResult = {
      userId,
      fieldsAnonymized: [],
      fieldsDeleted: [],
      recordsAffected: 0,
    };

    // 1. Anonymize user profile (users/{uid})
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const _userData = userSnapshot.val();
      const anonymizedEmail = `${userId}@deleted.local`;
      
      await update(userRef, {
        displayName: 'Deleted User',
        email: anonymizedEmail,
        photoURL: null,
        phoneNumber: null,
        lastLogin: null,
      });

      result.fieldsAnonymized.push('displayName', 'email', 'photoURL', 'phoneNumber', 'lastLogin');
      result.recordsAffected++;
    }

    // 2. Anonymize personal settings (users/{uid}/settings/personal)
    const personalSettingsRef = ref(db, `users/${userId}/settings/personal`);
    const personalSettingsSnapshot = await get(personalSettingsRef);
    
    if (personalSettingsSnapshot.exists()) {
      let personalSettings = personalSettingsSnapshot.val();
      
      // Decrypt if encrypted
      if (sensitiveDataService.isInitialized()) {
        try {
          personalSettings = await sensitiveDataService.decryptUserPersonalData(
            personalSettings as Record<string, unknown>
          );
        } catch (err) {
          console.warn('[UserAccountDeletionService] Failed to decrypt personal settings:', err);
        }
      }

      await update(personalSettingsRef, {
        firstName: 'Deleted',
        lastName: 'User',
        middleName: null,
        phone: null,
        address: null,
        emergencyContact: null,
        bankDetails: null,
        niNumber: null,
        taxCode: null,
        avatar: null,
      });

      result.fieldsAnonymized.push(
        'firstName', 'lastName', 'middleName', 'phone', 'address',
        'emergencyContact', 'bankDetails', 'niNumber', 'taxCode', 'avatar'
      );
      result.recordsAffected++;
    }

    // 3. Anonymize employee records (if user is an employee)
    // Note: Employee records may need to be retained for HMRC (6 years)
    // So we anonymize but keep the record structure
    const companiesRef = ref(db, `users/${userId}/companies`);
    const companiesSnapshot = await get(companiesRef);
    
    if (companiesSnapshot.exists()) {
      const companyIds: string[] = [];
      companiesSnapshot.forEach((companyChild) => {
        const compId = companyChild.key;
        if (compId) companyIds.push(compId);
      });
      for (const compId of companyIds) {
        try {
          const sitesRef = ref(db, `companies/${compId}/sites`);
          const sitesSnapshot = await get(sitesRef);
          if (!sitesSnapshot.exists()) continue;
          const siteIds: string[] = [];
          sitesSnapshot.forEach((siteChild) => {
            const siteId = siteChild.key;
            if (siteId) siteIds.push(siteId);
          });
          for (const siteId of siteIds) {
            const employeesRef = ref(db, `companies/${compId}/sites/${siteId}/data/hr/employees`);
            const employeesSnapshot = await get(employeesRef);
            if (!employeesSnapshot.exists()) continue;
            const empIds: string[] = [];
            employeesSnapshot.forEach((empChild) => {
              const employee = empChild.val() as Record<string, unknown>;
              if (employee.userId === userId && empChild.key) empIds.push(empChild.key);
            });
            for (const empKey of empIds) {
              const empRef = ref(db, `companies/${compId}/sites/${siteId}/data/hr/employees/${empKey}`);
              await update(empRef, {
                firstName: 'Deleted',
                lastName: 'User',
                email: `${userId}@deleted.local`,
                phone: null,
                address: null,
                emergencyContact: null,
                notes: null,
                photo: null,
              });
              result.fieldsAnonymized.push(
                'firstName', 'lastName', 'email', 'phone', 'address',
                'emergencyContact', 'notes', 'photo'
              );
              result.recordsAffected++;
            }
          }
        } catch (err) {
          console.warn(`[UserAccountDeletionService] Error anonymizing employee records for company ${compId}:`, err);
        }
      }
    }

    // 4. Update deletion status
    const statusRef = ref(db, `users/${userId}/deletionStatus`);
    await update(statusRef, {
      isAnonymized: true,
      anonymizedAt: Date.now(),
    });

    // 5. Log anonymization
    await auditTrailService.log('data_update', anonymizedBy, companyId, {
      resourceType: 'user_account',
      resourceId: userId,
      description: `User account anonymized. Fields anonymized: ${result.fieldsAnonymized.length}, Records affected: ${result.recordsAffected}`,
      metadata: {
        fieldsAnonymized: result.fieldsAnonymized,
        fieldsDeleted: result.fieldsDeleted,
        recordsAffected: result.recordsAffected,
      },
    });

    return result;
  }

  /**
   * Get users pending anonymization (grace period expired)
   */
  async getUsersPendingAnonymization(): Promise<UserDeletionStatus[]> {
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    const pending: UserDeletionStatus[] = [];
    const now = Date.now();

    if (!usersSnapshot.exists()) return [];

    usersSnapshot.forEach((userChild) => {
      const userId = userChild.key;
      if (!userId) return;

      const statusRef = ref(db, `users/${userId}/deletionStatus`);
      get(statusRef).then((statusSnapshot) => {
        if (statusSnapshot.exists()) {
          const status = statusSnapshot.val() as UserDeletionStatus;
          
          if (
            status.isDeleted &&
            !status.isAnonymized &&
            status.gracePeriodEndsAt &&
            status.gracePeriodEndsAt < now
          ) {
            pending.push(status);
          }
        }
      }).catch(() => {});
    });

    return pending;
  }

  /**
   * Process pending anonymizations (should be called by scheduled job)
   */
  async processPendingAnonymizations(companyId: string): Promise<{
    processed: number;
    errors: number;
  }> {
    const pending = await this.getUsersPendingAnonymization();
    let processed = 0;
    let errors = 0;

    for (const status of pending) {
      try {
        await this.anonymizeUserAccount(status.userId, companyId, 'system');
        processed++;
      } catch (err) {
        console.error(`[UserAccountDeletionService] Error anonymizing user ${status.userId}:`, err);
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * Get deletion status for a user
   */
  async getDeletionStatus(userId: string): Promise<UserDeletionStatus | null> {
    const statusRef = ref(db, `users/${userId}/deletionStatus`);
    const snapshot = await get(statusRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as UserDeletionStatus;
  }
}

// Export singleton instance
export const userAccountDeletionService = new UserAccountDeletionService();

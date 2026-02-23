/**
 * Data Retention Policy Service
 *
 * Manages data retention policies in compliance with UK GDPR and HMRC requirements.
 * Implements automated archival and deletion based on retention schedules.
 *
 * Reference: ICO Retention Guidance, HMRC Record Keeping Requirements
 *
 * Key Retention Periods:
 * - Payroll records: 6 years after tax year end (HMRC)
 * - HMRC submissions: 6 years (HMRC)
 * - P45/P60: 6 years (HMRC)
 * - Employment contracts: 6 years after employment ends (Limitation Act)
 * - Audit logs: 6-7 years (Compliance)
 * - Health & Safety records: 3 years (or until 21 if minor)
 */

import { ref, push, set, get, update, remove, query, orderByChild, startAt, endAt } from 'firebase/database';
import { db } from '../Firebase';
import type { DataRetentionPolicy } from './types';
import { auditTrailService } from './AuditTrailService';

/**
 * Data category for retention
 */
export type DataCategory =
  | 'payroll_records'
  | 'hmrc_submissions'
  | 'tax_documents'     // P45, P60, P11D
  | 'employment_contracts'
  | 'employee_personal_data'
  | 'financial_data'    // Bank details, salary
  | 'pension_records'
  | 'audit_logs'
  | 'security_logs'
  | 'health_safety_records'
  | 'consent_records'
  | 'dsar_records'
  | 'breach_records'
  | 'general_data';

/**
 * Retention action
 */
export type RetentionAction = 'archive' | 'delete' | 'anonymize' | 'review';

/**
 * Retention schedule record
 */
export interface RetentionScheduleRecord {
  id: string;
  companyId: string;
  dataCategory: DataCategory;
  retentionPeriodYears: number;
  retentionPeriodMonths?: number;
  legalBasis: string;
  description: string;
  autoArchive: boolean;
  autoDelete: boolean;
  autoAnonymize?: boolean;
  warningPeriodDays: number; // Days before expiry to warn
  reviewFrequencyMonths: number;
  lastReviewedAt?: number;
  nextReviewAt: number;
  isActive: boolean;
  createdAt: number;
  updatedAt?: number;
  createdBy: string;
  updatedBy?: string;
}

/**
 * Data record with retention tracking
 */
export interface RetentionTrackedRecord {
  id: string;
  companyId: string;
  dataCategory: DataCategory;
  dataPath: string; // Firebase path to the data
  createdAt: number;
  lastAccessedAt?: number;
  retentionStartDate: number; // When retention period starts (e.g., tax year end)
  expiresAt: number;
  isArchived: boolean;
  archivedAt?: number;
  isDeleted: boolean;
  deletedAt?: number;
  isAnonymized: boolean;
  anonymizedAt?: number;
  retentionExemption?: string; // Reason for exemption
  metadata?: Record<string, unknown>;
}

/**
 * Retention review task
 */
export interface RetentionReviewTask {
  id: string;
  companyId: string;
  dataCategory: DataCategory;
  recordCount: number;
  oldestRecord: number;
  newestRecord: number;
  recommendedAction: RetentionAction;
  dueDate: number;
  completedAt?: number;
  completedBy?: string;
  notes?: string;
  createdAt: number;
}

/**
 * Default retention policies based on UK legal requirements
 */
export const DEFAULT_RETENTION_POLICIES: Omit<RetentionScheduleRecord, 'id' | 'companyId' | 'createdAt' | 'nextReviewAt' | 'createdBy'>[] = [
  {
    dataCategory: 'payroll_records',
    retentionPeriodYears: 6,
    legalBasis: 'HMRC Record Keeping Requirements',
    description: 'Payroll records must be kept for at least 6 years after the end of the tax year they relate to.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'hmrc_submissions',
    retentionPeriodYears: 6,
    legalBasis: 'HMRC Record Keeping Requirements',
    description: 'FPS, EPS, and EYU submissions must be retained for 6 years.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'tax_documents',
    retentionPeriodYears: 6,
    legalBasis: 'HMRC Requirements, Income Tax (PAYE) Regulations',
    description: 'P45, P60, P11D forms must be kept for 6 years.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'employment_contracts',
    retentionPeriodYears: 6,
    legalBasis: 'Limitation Act 1980',
    description: 'Employment contracts should be kept for 6 years after employment ends.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 60,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'pension_records',
    retentionPeriodYears: 6,
    legalBasis: 'Pensions Act 2008, HMRC Requirements',
    description: 'Pension records for auto-enrolment and contributions.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'audit_logs',
    retentionPeriodYears: 6,
    legalBasis: 'UK GDPR Accountability, HMRC Audit Requirements',
    description: 'Audit logs for compliance and security purposes.',
    autoArchive: true,
    autoDelete: true,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'security_logs',
    retentionPeriodYears: 7,
    legalBasis: 'UK GDPR Security Requirements',
    description: 'Security event logs for incident investigation.',
    autoArchive: true,
    autoDelete: true,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'health_safety_records',
    retentionPeriodYears: 3,
    legalBasis: 'Social Security (Claims and Payments) Regulations 1979',
    description: 'SSP and accident records. Longer retention if minor involved.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 60,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'consent_records',
    retentionPeriodYears: 6,
    legalBasis: 'UK GDPR Article 7 - Accountability',
    description: 'Records of consent for GDPR compliance.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'dsar_records',
    retentionPeriodYears: 6,
    legalBasis: 'UK GDPR - Accountability',
    description: 'Data Subject Access Request records.',
    autoArchive: true,
    autoDelete: false,
    warningPeriodDays: 30,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
  {
    dataCategory: 'breach_records',
    retentionPeriodYears: 6,
    legalBasis: 'UK GDPR Article 33(5)',
    description: 'Data breach incident records.',
    autoArchive: false,
    autoDelete: false,
    warningPeriodDays: 60,
    reviewFrequencyMonths: 12,
    isActive: true,
  },
];

/**
 * Data Retention Service
 */
export class DataRetentionService {
  private policiesPath: string;
  private recordsPath: string;
  private reviewsPath: string;

  constructor() {
    this.policiesPath = 'compliance/dataRetention/policies';
    this.recordsPath = 'compliance/dataRetention/records';
    this.reviewsPath = 'compliance/dataRetention/reviews';
  }

  /**
   * Initialize default retention policies for a company
   */
  async initializeDefaultPolicies(companyId: string, userId: string): Promise<void> {
    const existingPolicies = await this.getPolicies(companyId);

    if (existingPolicies.length > 0) {
      console.log(`[DataRetentionService] Policies already exist for company ${companyId}`);
      return;
    }

    const now = Date.now();

    for (const defaultPolicy of DEFAULT_RETENTION_POLICIES) {
      const policyRef = push(ref(db, `${this.policiesPath}/${companyId}`));
      const nextReviewAt = now + defaultPolicy.reviewFrequencyMonths * 30 * 24 * 60 * 60 * 1000;

      const policy: RetentionScheduleRecord = {
        id: policyRef.key!,
        companyId,
        ...defaultPolicy,
        createdAt: now,
        nextReviewAt,
        createdBy: userId,
      };

      await set(policyRef, policy);
    }

    console.log(`[DataRetentionService] Initialized ${DEFAULT_RETENTION_POLICIES.length} default policies for company ${companyId}`);

    // Log the initialization
    await auditTrailService.log('settings_change', userId, companyId, {
      resourceType: 'retention_policy',
      description: `Initialized ${DEFAULT_RETENTION_POLICIES.length} default retention policies`,
    });
  }

  /**
   * Create or update a retention policy
   */
  async upsertPolicy(
    companyId: string,
    userId: string,
    policy: Omit<RetentionScheduleRecord, 'id' | 'companyId' | 'createdAt' | 'createdBy'>
  ): Promise<RetentionScheduleRecord> {
    // Check if policy for this category already exists
    const existing = await this.getPolicyByCategory(companyId, policy.dataCategory);

    if (existing) {
      // Update existing policy
      const policyRef = ref(db, `${this.policiesPath}/${companyId}/${existing.id}`);
      const updated: Partial<RetentionScheduleRecord> = {
        ...policy,
        updatedAt: Date.now(),
        updatedBy: userId,
      };

      await update(policyRef, updated);

      await auditTrailService.log('settings_change', userId, companyId, {
        resourceType: 'retention_policy',
        resourceId: existing.id,
        description: `Updated retention policy for ${policy.dataCategory}`,
        previousValue: existing,
        newValue: { ...existing, ...updated },
      });

      return { ...existing, ...updated };
    } else {
      // Create new policy
      const policyRef = push(ref(db, `${this.policiesPath}/${companyId}`));
      const now = Date.now();

      const newPolicy: RetentionScheduleRecord = {
        id: policyRef.key!,
        companyId,
        ...policy,
        createdAt: now,
        createdBy: userId,
      };

      await set(policyRef, newPolicy);

      await auditTrailService.log('settings_change', userId, companyId, {
        resourceType: 'retention_policy',
        resourceId: newPolicy.id,
        description: `Created retention policy for ${policy.dataCategory}`,
      });

      return newPolicy;
    }
  }

  /**
   * Get all retention policies for a company
   */
  async getPolicies(companyId: string): Promise<RetentionScheduleRecord[]> {
    const policiesRef = ref(db, `${this.policiesPath}/${companyId}`);
    const snapshot = await get(policiesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const policies: RetentionScheduleRecord[] = [];
    snapshot.forEach((child) => {
      policies.push(child.val() as RetentionScheduleRecord);
    });

    return policies;
  }

  /**
   * Get policy by data category
   */
  async getPolicyByCategory(
    companyId: string,
    category: DataCategory
  ): Promise<RetentionScheduleRecord | null> {
    const policies = await this.getPolicies(companyId);
    return policies.find((p) => p.dataCategory === category) || null;
  }

  /**
   * Track a data record for retention
   */
  async trackRecord(
    companyId: string,
    dataCategory: DataCategory,
    dataPath: string,
    options: {
      retentionStartDate?: number; // Defaults to now
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<RetentionTrackedRecord> {
    const policy = await this.getPolicyByCategory(companyId, dataCategory);

    if (!policy) {
      throw new Error(`No retention policy found for category: ${dataCategory}`);
    }

    const now = Date.now();
    const retentionStartDate = options.retentionStartDate || now;
    const retentionMs =
      (policy.retentionPeriodYears * 365 + (policy.retentionPeriodMonths || 0) * 30) *
      24 * 60 * 60 * 1000;
    const expiresAt = retentionStartDate + retentionMs;

    const recordRef = push(ref(db, `${this.recordsPath}/${companyId}`));

    const record: RetentionTrackedRecord = {
      id: recordRef.key!,
      companyId,
      dataCategory,
      dataPath,
      createdAt: now,
      retentionStartDate,
      expiresAt,
      isArchived: false,
      isDeleted: false,
      isAnonymized: false,
      metadata: options.metadata,
    };

    await set(recordRef, record);
    return record;
  }

  /**
   * Get records expiring within a date range
   */
  async getExpiringRecords(
    companyId: string,
    options: {
      startDate?: number;
      endDate?: number;
      category?: DataCategory;
      includeArchived?: boolean;
    } = {}
  ): Promise<RetentionTrackedRecord[]> {
    const recordsRef = ref(db, `${this.recordsPath}/${companyId}`);
    let recordsQuery = query(recordsRef, orderByChild('expiresAt'));

    if (options.startDate) {
      recordsQuery = query(recordsQuery, startAt(options.startDate));
    }
    if (options.endDate) {
      recordsQuery = query(recordsQuery, endAt(options.endDate));
    }

    const snapshot = await get(recordsQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const records: RetentionTrackedRecord[] = [];
    snapshot.forEach((child) => {
      const record = child.val() as RetentionTrackedRecord;

      // Apply filters
      if (record.isDeleted) return;
      if (!options.includeArchived && record.isArchived) return;
      if (options.category && record.dataCategory !== options.category) return;

      records.push(record);
    });

    return records;
  }

  /**
   * Archive a record
   */
  async archiveRecord(
    companyId: string,
    recordId: string,
    userId: string
  ): Promise<void> {
    const recordRef = ref(db, `${this.recordsPath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Record not found');
    }

    await update(recordRef, {
      isArchived: true,
      archivedAt: Date.now(),
    });

    await auditTrailService.log('data_update', userId, companyId, {
      resourceType: 'retention_record',
      resourceId: recordId,
      description: 'Archived data record',
    });
  }

  /**
   * Delete a record (mark as deleted)
   */
  async deleteRecord(
    companyId: string,
    recordId: string,
    userId: string
  ): Promise<void> {
    const recordRef = ref(db, `${this.recordsPath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Record not found');
    }

    const record = snapshot.val() as RetentionTrackedRecord;

    // Check for retention exemption
    if (record.retentionExemption) {
      throw new Error(`Cannot delete: ${record.retentionExemption}`);
    }

    await update(recordRef, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    // Also delete the actual data
    const dataRef = ref(db, record.dataPath);
    await remove(dataRef);

    await auditTrailService.log('data_delete', userId, companyId, {
      resourceType: 'retention_record',
      resourceId: recordId,
      description: `Deleted data record: ${record.dataPath}`,
      metadata: { dataCategory: record.dataCategory },
    });
  }

  /**
   * Run retention cleanup (process expired records)
   */
  async runRetentionCleanup(companyId: string, userId: string): Promise<{
    archived: number;
    deleted: number;
    anonymized: number;
    skipped: number;
  }> {
    const now = Date.now();
    const policies = await this.getPolicies(companyId);
    const expiredRecords = await this.getExpiringRecords(companyId, {
      endDate: now,
      includeArchived: true,
    });

    const results = {
      archived: 0,
      deleted: 0,
      anonymized: 0,
      skipped: 0,
    };

    for (const record of expiredRecords) {
      const policy = policies.find((p) => p.dataCategory === record.dataCategory);

      if (!policy || !policy.isActive) {
        results.skipped++;
        continue;
      }

      if (record.retentionExemption) {
        results.skipped++;
        continue;
      }

      try {
        if (!record.isArchived && policy.autoArchive) {
          await this.archiveRecord(companyId, record.id, userId);
          results.archived++;
        }

        if (policy.autoDelete && !record.isDeleted) {
          await this.deleteRecord(companyId, record.id, userId);
          results.deleted++;
        } else if (policy.autoAnonymize && !record.isAnonymized) {
          await this.anonymizeRecord(companyId, record.id, userId);
          results.anonymized++;
        }
      } catch (error) {
        console.error(`[DataRetentionService] Error processing record ${record.id}:`, error);
        results.skipped++;
      }
    }

    // Log cleanup run
    await auditTrailService.log('data_delete', userId, companyId, {
      resourceType: 'retention_cleanup',
      description: `Retention cleanup completed: ${results.archived} archived, ${results.deleted} deleted, ${results.anonymized} anonymized, ${results.skipped} skipped`,
      metadata: results,
    });

    return results;
  }

  /**
   * Anonymize a record
   * Replaces PII with anonymized values based on data category
   */
  async anonymizeRecord(
    companyId: string,
    recordId: string,
    userId: string
  ): Promise<void> {
    const recordRef = ref(db, `${this.recordsPath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Record not found');
    }

    const record = snapshot.val() as RetentionTrackedRecord;
    const dataRef = ref(db, record.dataPath);
    const dataSnapshot = await get(dataRef);

    if (!dataSnapshot.exists()) {
      // Mark as anonymized even if data doesn't exist
      await update(recordRef, {
        isAnonymized: true,
        anonymizedAt: Date.now(),
      });
      return;
    }

    const data = dataSnapshot.val() as Record<string, unknown>;
    const anonymizedData: Record<string, unknown> = { ...data };

    // Anonymize based on data category
    switch (record.dataCategory) {
      case 'employee_personal_data':
        // Anonymize employee PII
        anonymizedData.firstName = 'Deleted';
        anonymizedData.lastName = 'User';
        anonymizedData.email = `${record.id}@deleted.local`;
        anonymizedData.phone = null;
        anonymizedData.address = null;
        anonymizedData.emergencyContact = null;
        anonymizedData.notes = null;
        anonymizedData.photo = null;
        // Keep: salary, payroll records, tax info (required for HMRC)
        break;

      case 'financial_data':
        // Anonymize financial PII
        if (anonymizedData.bankDetails) {
          anonymizedData.bankDetails = {
            accountNumber: 'REDACTED',
            sortCode: 'REDACTED',
            accountHolderName: 'Deleted User',
          };
        }
        // Keep: transaction references, amounts, dates (required for audit)
        break;

      case 'consent_records':
        // Anonymize consent records
        anonymizedData.userId = `deleted_${record.id}`;
        anonymizedData.ipAddress = 'REDACTED';
        anonymizedData.userAgent = 'REDACTED';
        // Keep: consent timestamp, purpose, lawful basis (required for compliance)
        break;

      case 'audit_logs':
        // Anonymize audit log PII
        anonymizedData.userEmail = 'REDACTED';
        anonymizedData.ipAddress = 'REDACTED';
        anonymizedData.userAgent = 'REDACTED';
        // Keep: timestamp, action, resourceType (required for audit trail)
        break;

      default:
        // Generic anonymization for other categories
        if (anonymizedData.name) anonymizedData.name = 'Deleted User';
        if (anonymizedData.email) anonymizedData.email = `${record.id}@deleted.local`;
        if (anonymizedData.phone) anonymizedData.phone = null;
        if (anonymizedData.address) anonymizedData.address = null;
        break;
    }

    // Update the actual data
    await update(dataRef, anonymizedData);

    // Mark record as anonymized
    await update(recordRef, {
      isAnonymized: true,
      anonymizedAt: Date.now(),
    });

    await auditTrailService.log('data_update', userId, companyId, {
      resourceType: 'retention_record',
      resourceId: recordId,
      description: `Anonymized data record: ${record.dataCategory}`,
      metadata: {
        dataCategory: record.dataCategory,
        dataPath: record.dataPath,
      },
    });
  }

  /**
   * Create retention review task
   */
  async createReviewTask(
    companyId: string,
    category: DataCategory,
    _userId: string
  ): Promise<RetentionReviewTask> {
    const records = await this.getExpiringRecords(companyId, {
      category,
      endDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // Next 90 days
    });

    const policy = await this.getPolicyByCategory(companyId, category);
    const now = Date.now();

    const taskRef = push(ref(db, `${this.reviewsPath}/${companyId}`));

    const task: RetentionReviewTask = {
      id: taskRef.key!,
      companyId,
      dataCategory: category,
      recordCount: records.length,
      oldestRecord: records.length > 0 ? Math.min(...records.map((r) => r.createdAt)) : 0,
      newestRecord: records.length > 0 ? Math.max(...records.map((r) => r.createdAt)) : 0,
      recommendedAction: policy?.autoDelete ? 'delete' : policy?.autoArchive ? 'archive' : 'review',
      dueDate: now + 30 * 24 * 60 * 60 * 1000,
      createdAt: now,
    };

    await set(taskRef, task);
    return task;
  }

  /**
   * Get pending review tasks
   */
  async getPendingReviewTasks(companyId: string): Promise<RetentionReviewTask[]> {
    const tasksRef = ref(db, `${this.reviewsPath}/${companyId}`);
    const snapshot = await get(tasksRef);

    if (!snapshot.exists()) {
      return [];
    }

    const tasks: RetentionReviewTask[] = [];
    snapshot.forEach((child) => {
      const task = child.val() as RetentionReviewTask;
      if (!task.completedAt) {
        tasks.push(task);
      }
    });

    return tasks.sort((a, b) => a.dueDate - b.dueDate);
  }

  /**
   * Complete review task
   */
  async completeReviewTask(
    companyId: string,
    taskId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const taskRef = ref(db, `${this.reviewsPath}/${companyId}/${taskId}`);

    await update(taskRef, {
      completedAt: Date.now(),
      completedBy: userId,
      notes,
    });

    await auditTrailService.log('data_update', userId, companyId, {
      resourceType: 'retention_review',
      resourceId: taskId,
      description: 'Completed retention review task',
    });
  }

  /**
   * Get retention statistics
   */
  async getStatistics(companyId: string): Promise<{
    totalRecords: number;
    archivedRecords: number;
    expiringWithin30Days: number;
    expiringWithin90Days: number;
    pendingReviews: number;
    byCategory: Record<DataCategory, number>;
  }> {
    const recordsRef = ref(db, `${this.recordsPath}/${companyId}`);
    const snapshot = await get(recordsRef);

    const now = Date.now();
    const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
    const ninetyDays = now + 90 * 24 * 60 * 60 * 1000;

    const stats = {
      totalRecords: 0,
      archivedRecords: 0,
      expiringWithin30Days: 0,
      expiringWithin90Days: 0,
      pendingReviews: 0,
      byCategory: {} as Record<DataCategory, number>,
    };

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const record = child.val() as RetentionTrackedRecord;

        if (record.isDeleted) return;

        stats.totalRecords++;

        if (record.isArchived) {
          stats.archivedRecords++;
        }

        if (record.expiresAt <= thirtyDays) {
          stats.expiringWithin30Days++;
        } else if (record.expiresAt <= ninetyDays) {
          stats.expiringWithin90Days++;
        }

        stats.byCategory[record.dataCategory] = (stats.byCategory[record.dataCategory] || 0) + 1;
      });
    }

    const pendingReviews = await this.getPendingReviewTasks(companyId);
    stats.pendingReviews = pendingReviews.length;

    return stats;
  }
}

// Export singleton instance
export const dataRetentionService = new DataRetentionService();

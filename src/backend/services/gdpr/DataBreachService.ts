/**
 * Data Breach Incident Service
 *
 * Manages data breach incidents in compliance with UK GDPR and HMRC requirements.
 * - Documents all breaches (required by ICO)
 * - Tracks ICO notification within 72 hours
 * - Tracks HMRC notification within 72 hours
 * - Manages user notification for high-risk breaches
 * - Encrypts sensitive breach details (description, consequences)
 *
 * Reference: ICO Personal Data Breaches Guide
 */

import { ref, push, set, get, update, query, orderByChild } from 'firebase/database';
import { db } from '../Firebase';
import { DataBreachIncident, BreachSeverity, BreachStatus } from './types';
import { sensitiveDataService } from '../encryption/SensitiveDataService';

const HOURS_72_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

// Fields to encrypt in breach records (may contain sensitive incident details)
const BREACH_ENCRYPTED_FIELDS = ['description'] as const;

export class DataBreachService {
  private basePath: string;

  constructor() {
    this.basePath = 'compliance/dataBreaches';
  }

  /**
   * Encrypt sensitive breach data before storage
   */
  private async encryptBreachData(data: Partial<DataBreachIncident>): Promise<Partial<DataBreachIncident>> {
    if (!sensitiveDataService.isInitialized()) {
      console.warn('[DataBreachService] Encryption service not initialized - storing breach data without encryption');
      return data;
    }

    try {
      const encrypted = { ...data };

      // Encrypt description
      if (encrypted.description) {
        encrypted.description = await sensitiveDataService.encryptValue(encrypted.description);
      }

      // Encrypt each potential consequence
      if (encrypted.potentialConsequences && Array.isArray(encrypted.potentialConsequences)) {
        encrypted.potentialConsequences = await Promise.all(
          encrypted.potentialConsequences.map(async (consequence) => {
            return sensitiveDataService.encryptValue(consequence);
          })
        );
      }

      return encrypted;
    } catch (error) {
      console.error('[DataBreachService] Failed to encrypt breach data:', error);
      return data; // Return unencrypted data as fallback
    }
  }

  /**
   * Decrypt sensitive breach data after retrieval
   */
  private async decryptBreachData(data: DataBreachIncident): Promise<DataBreachIncident> {
    if (!sensitiveDataService.isInitialized()) {
      return data;
    }

    try {
      const decrypted = { ...data };

      // Decrypt description if encrypted
      if (decrypted.description && sensitiveDataService.isEncryptedValue(decrypted.description)) {
        decrypted.description = await sensitiveDataService.decryptValue(decrypted.description);
      }

      // Decrypt each potential consequence if encrypted
      if (decrypted.potentialConsequences && Array.isArray(decrypted.potentialConsequences)) {
        decrypted.potentialConsequences = await Promise.all(
          decrypted.potentialConsequences.map(async (consequence) => {
            if (sensitiveDataService.isEncryptedValue(consequence)) {
              return sensitiveDataService.decryptValue(consequence);
            }
            return consequence;
          })
        );
      }

      return decrypted;
    } catch (error) {
      console.error('[DataBreachService] Failed to decrypt breach data:', error);
      return data; // Return encrypted data as fallback
    }
  }

  /**
   * Report a new data breach incident
   */
  async reportBreach(
    companyId: string,
    detectedBy: string,
    incident: {
      title: string;
      description: string;
      severity: BreachSeverity;
      dataCategories: string[];
      estimatedRecordsAffected: number;
      riskToIndividuals: 'unlikely' | 'possible' | 'likely' | 'highly_likely';
      potentialConsequences: string[];
    }
  ): Promise<DataBreachIncident> {
    const breachRef = push(ref(db, `${this.basePath}/${companyId}`));
    const now = Date.now();

    // Determine notification requirements based on severity and risk
    const requiresICONotification = this.assessICONotificationRequired(
      incident.severity,
      incident.riskToIndividuals,
      incident.estimatedRecordsAffected
    );

    const requiresUserNotification = this.assessUserNotificationRequired(
      incident.riskToIndividuals,
      incident.potentialConsequences
    );

    // HMRC notification required if payroll/tax data is affected
    const requiresHMRCNotification = incident.dataCategories.some(
      (cat) =>
        cat.includes('payroll') ||
        cat.includes('tax') ||
        cat.includes('hmrc') ||
        cat.includes('paye') ||
        cat.includes('ni_number')
    );

    const record: DataBreachIncident = {
      id: breachRef.key!,
      companyId,
      detectedAt: now,
      detectedBy,
      reportedAt: now,
      reportedBy: detectedBy,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: 'detected',
      dataCategories: incident.dataCategories,
      estimatedRecordsAffected: incident.estimatedRecordsAffected,
      riskToIndividuals: incident.riskToIndividuals,
      potentialConsequences: incident.potentialConsequences,
      requiresICONotification,
      requiresUserNotification,
      requiresHMRCNotification,
      remediationActions: [],
      preventiveMeasures: [],
      createdAt: now,
    };

    // Encrypt sensitive breach data before storage
    const encryptedRecord = await this.encryptBreachData(record) as DataBreachIncident;
    await set(breachRef, encryptedRecord);

    // Log console warning for urgent breaches
    if (requiresICONotification || requiresHMRCNotification) {
      console.warn(
        `[DATA BREACH] Critical breach detected (ID: ${record.id}). ` +
        `ICO notification required: ${requiresICONotification}. ` +
        `HMRC notification required: ${requiresHMRCNotification}. ` +
        `72-hour deadline: ${new Date(now + HOURS_72_MS).toISOString()}`
      );
    }

    return record;
  }

  /**
   * Update breach status
   */
  async updateStatus(
    companyId: string,
    breachId: string,
    newStatus: BreachStatus,
    userId: string,
    notes?: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);
    const snapshot = await get(breachRef);

    if (!snapshot.exists()) {
      throw new Error('Breach incident not found');
    }

    const updates: Partial<DataBreachIncident> = {
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (newStatus === 'resolved') {
      updates.resolvedAt = Date.now();
      updates.resolvedBy = userId;
    }

    if (notes) {
      const current = snapshot.val() as DataBreachIncident;
      updates.remediationActions = [
        ...(current.remediationActions || []),
        `[${new Date().toISOString()}] ${notes}`,
      ];
    }

    await update(breachRef, updates);
  }

  /**
   * Record ICO notification
   */
  async recordICONotification(
    companyId: string,
    breachId: string,
    userId: string,
    referenceNumber: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);

    await update(breachRef, {
      status: 'notified_ico',
      icoNotifiedAt: Date.now(),
      icoNotifiedBy: userId,
      icoReferenceNumber: referenceNumber,
      updatedAt: Date.now(),
    });
  }

  /**
   * Record HMRC notification
   */
  async recordHMRCNotification(
    companyId: string,
    breachId: string,
    userId: string,
    referenceNumber: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);

    await update(breachRef, {
      hmrcNotifiedAt: Date.now(),
      hmrcReferenceNumber: referenceNumber,
      updatedAt: Date.now(),
    });
  }

  /**
   * Record user notification
   */
  async recordUserNotification(
    companyId: string,
    breachId: string,
    method: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);

    await update(breachRef, {
      status: 'notified_users',
      usersNotifiedAt: Date.now(),
      notificationMethod: method,
      updatedAt: Date.now(),
    });
  }

  /**
   * Get breach incident by ID
   */
  async getBreach(
    companyId: string,
    breachId: string
  ): Promise<DataBreachIncident | null> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);
    const snapshot = await get(breachRef);

    if (!snapshot.exists()) return null;

    // Decrypt sensitive breach data before returning
    const breach = snapshot.val() as DataBreachIncident;
    return this.decryptBreachData(breach);
  }

  /**
   * Get all breach incidents for a company
   */
  async getCompanyBreaches(companyId: string): Promise<DataBreachIncident[]> {
    const breachRef = ref(db, `${this.basePath}/${companyId}`);
    const breachQuery = query(breachRef, orderByChild('detectedAt'));
    const snapshot = await get(breachQuery);

    if (!snapshot.exists()) return [];

    const breaches: DataBreachIncident[] = [];
    snapshot.forEach((child) => {
      breaches.push(child.val() as DataBreachIncident);
    });

    // Decrypt sensitive breach data before returning
    const decryptedBreaches = await Promise.all(
      breaches.map((breach) => this.decryptBreachData(breach))
    );

    return decryptedBreaches.reverse(); // Most recent first
  }

  /**
   * Get breaches requiring urgent action (notification deadline approaching)
   */
  async getUrgentBreaches(companyId: string): Promise<DataBreachIncident[]> {
    const breaches = await this.getCompanyBreaches(companyId);
    const now = Date.now();

    return breaches.filter((breach) => {
      // Not yet resolved
      if (breach.status === 'resolved' || breach.status === 'closed') {
        return false;
      }

      // ICO notification required but not done
      if (
        breach.requiresICONotification &&
        !breach.icoNotifiedAt &&
        breach.detectedAt + HOURS_72_MS > now
      ) {
        return true;
      }

      // HMRC notification required but not done
      if (
        breach.requiresHMRCNotification &&
        !breach.hmrcNotifiedAt &&
        breach.detectedAt + HOURS_72_MS > now
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get overdue breaches (past 72-hour deadline)
   */
  async getOverdueBreaches(companyId: string): Promise<DataBreachIncident[]> {
    const breaches = await this.getCompanyBreaches(companyId);
    const now = Date.now();

    return breaches.filter((breach) => {
      const deadline = breach.detectedAt + HOURS_72_MS;

      // ICO notification overdue
      if (
        breach.requiresICONotification &&
        !breach.icoNotifiedAt &&
        deadline < now
      ) {
        return true;
      }

      // HMRC notification overdue
      if (
        breach.requiresHMRCNotification &&
        !breach.hmrcNotifiedAt &&
        deadline < now
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Add remediation action to breach record
   */
  async addRemediationAction(
    companyId: string,
    breachId: string,
    action: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);
    const snapshot = await get(breachRef);

    if (!snapshot.exists()) {
      throw new Error('Breach incident not found');
    }

    const current = snapshot.val() as DataBreachIncident;
    await update(breachRef, {
      remediationActions: [
        ...(current.remediationActions || []),
        `[${new Date().toISOString()}] ${action}`,
      ],
      updatedAt: Date.now(),
    });
  }

  /**
   * Add preventive measure to breach record
   */
  async addPreventiveMeasure(
    companyId: string,
    breachId: string,
    measure: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);
    const snapshot = await get(breachRef);

    if (!snapshot.exists()) {
      throw new Error('Breach incident not found');
    }

    const current = snapshot.val() as DataBreachIncident;
    await update(breachRef, {
      preventiveMeasures: [
        ...(current.preventiveMeasures || []),
        `[${new Date().toISOString()}] ${measure}`,
      ],
      updatedAt: Date.now(),
    });
  }

  /**
   * Document root cause analysis
   */
  async documentRootCause(
    companyId: string,
    breachId: string,
    rootCause: string
  ): Promise<void> {
    const breachRef = ref(db, `${this.basePath}/${companyId}/${breachId}`);

    await update(breachRef, {
      rootCause,
      updatedAt: Date.now(),
    });
  }

  /**
   * Assess if ICO notification is required
   * Based on ICO guidance for notifiable breaches
   */
  private assessICONotificationRequired(
    severity: BreachSeverity,
    riskToIndividuals: string,
    recordsAffected: number
  ): boolean {
    // High/critical severity always requires notification
    if (severity === 'critical' || severity === 'high') {
      return true;
    }

    // Likely/highly likely risk to individuals requires notification
    if (riskToIndividuals === 'likely' || riskToIndividuals === 'highly_likely') {
      return true;
    }

    // Large number of records affected
    if (recordsAffected >= 100) {
      return true;
    }

    return false;
  }

  /**
   * Assess if user notification is required
   * Based on high risk to rights and freedoms
   */
  private assessUserNotificationRequired(
    riskToIndividuals: string,
    consequences: string[]
  ): boolean {
    // High risk to individuals requires notification
    if (riskToIndividuals === 'likely' || riskToIndividuals === 'highly_likely') {
      return true;
    }

    // Severe consequences require notification
    const severeConsequences = [
      'identity_theft',
      'financial_loss',
      'discrimination',
      'reputational_damage',
    ];

    if (consequences.some((c) => severeConsequences.includes(c.toLowerCase()))) {
      return true;
    }

    return false;
  }

  /**
   * Get breach statistics for compliance reporting
   */
  async getBreachStatistics(companyId: string): Promise<{
    total: number;
    resolved: number;
    pending: number;
    icoNotified: number;
    hmrcNotified: number;
    overdue: number;
    bySeverity: Record<BreachSeverity, number>;
  }> {
    const breaches = await this.getCompanyBreaches(companyId);
    const overdueBreaches = await this.getOverdueBreaches(companyId);

    const stats = {
      total: breaches.length,
      resolved: 0,
      pending: 0,
      icoNotified: 0,
      hmrcNotified: 0,
      overdue: overdueBreaches.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      } as Record<BreachSeverity, number>,
    };

    for (const breach of breaches) {
      if (breach.status === 'resolved' || breach.status === 'closed') {
        stats.resolved++;
      } else {
        stats.pending++;
      }

      if (breach.icoNotifiedAt) stats.icoNotified++;
      if (breach.hmrcNotifiedAt) stats.hmrcNotified++;
      stats.bySeverity[breach.severity]++;
    }

    return stats;
  }
}

// Export singleton instance
export const dataBreachService = new DataBreachService();

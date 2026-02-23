/**
 * GDPR Consent Management Service
 *
 * Manages consent records for data processing in compliance with UK GDPR.
 * Tracks lawful basis, consent given/withdrawn, and maintains audit trail.
 *
 * Reference: ICO Lawful Basis Guide
 */

import { ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../Firebase';
import { ConsentRecord, LawfulBasis, ConsentPurpose } from './types';

export class ConsentService {
  private basePath: string;

  constructor() {
    this.basePath = 'compliance/consent';
  }

  /**
   * Record consent given by a user
   */
  async recordConsent(
    userId: string,
    companyId: string,
    purpose: ConsentPurpose,
    options: {
      lawfulBasis: LawfulBasis;
      policyVersion: string;
      method?: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
      expiresAt?: number;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ConsentRecord> {
    const consentRef = push(ref(db, `${this.basePath}/${companyId}`));

    const record: ConsentRecord = {
      id: consentRef.key!,
      userId,
      companyId,
      purpose,
      lawfulBasis: options.lawfulBasis,
      consentGiven: true,
      consentTimestamp: Date.now(),
      method: options.method || 'explicit',
      version: options.policyVersion,
      ipAddress: options.ipAddress ? this.maskIpAddress(options.ipAddress) : undefined,
      userAgent: options.userAgent?.substring(0, 100),
      expiresAt: options.expiresAt,
      metadata: options.metadata,
    };

    await set(consentRef, record);
    return record;
  }

  /**
   * Withdraw previously given consent
   */
  async withdrawConsent(
    companyId: string,
    consentId: string,
    userId: string
  ): Promise<boolean> {
    const consentRef = ref(db, `${this.basePath}/${companyId}/${consentId}`);
    const snapshot = await get(consentRef);

    if (!snapshot.exists()) {
      throw new Error('Consent record not found');
    }

    const record = snapshot.val() as ConsentRecord;

    // Verify the user owns this consent record
    if (record.userId !== userId) {
      throw new Error('Unauthorized: Cannot withdraw consent for another user');
    }

    await update(consentRef, {
      consentGiven: false,
      withdrawnTimestamp: Date.now(),
    });

    return true;
  }

  /**
   * Check if user has given consent for a specific purpose
   */
  async hasConsent(
    userId: string,
    companyId: string,
    purpose: ConsentPurpose
  ): Promise<boolean> {
    const consents = await this.getUserConsents(userId, companyId);
    const relevantConsent = consents.find(
      (c) => c.purpose === purpose && c.consentGiven && !c.withdrawnTimestamp
    );

    if (!relevantConsent) return false;

    // Check if consent has expired
    if (relevantConsent.expiresAt && relevantConsent.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get all consent records for a user
   */
  async getUserConsents(
    userId: string,
    companyId: string
  ): Promise<ConsentRecord[]> {
    const consentRef = ref(db, `${this.basePath}/${companyId}`);
    const consentQuery = query(consentRef, orderByChild('userId'), equalTo(userId));
    const snapshot = await get(consentQuery);

    if (!snapshot.exists()) return [];

    const records: ConsentRecord[] = [];
    snapshot.forEach((child) => {
      records.push(child.val() as ConsentRecord);
    });

    return records;
  }

  /**
   * Get consent record by ID
   */
  async getConsent(
    companyId: string,
    consentId: string
  ): Promise<ConsentRecord | null> {
    const consentRef = ref(db, `${this.basePath}/${companyId}/${consentId}`);
    const snapshot = await get(consentRef);

    if (!snapshot.exists()) return null;
    return snapshot.val() as ConsentRecord;
  }

  /**
   * Get all active consents for a company
   */
  async getCompanyConsents(companyId: string): Promise<ConsentRecord[]> {
    const consentRef = ref(db, `${this.basePath}/${companyId}`);
    const snapshot = await get(consentRef);

    if (!snapshot.exists()) return [];

    const records: ConsentRecord[] = [];
    snapshot.forEach((child) => {
      const record = child.val() as ConsentRecord;
      if (record.consentGiven && !record.withdrawnTimestamp) {
        records.push(record);
      }
    });

    return records;
  }

  /**
   * Check consent required for HMRC submissions
   * Returns true if lawful basis is established (contract or legal obligation)
   */
  async hasHMRCSubmissionBasis(
    userId: string,
    companyId: string
  ): Promise<{ valid: boolean; basis: LawfulBasis | null; record?: ConsentRecord }> {
    const consents = await this.getUserConsents(userId, companyId);

    // For HMRC submissions, legal obligation or contract are valid bases
    const validConsent = consents.find(
      (c) =>
        c.purpose === 'hmrc_submission' &&
        c.consentGiven &&
        !c.withdrawnTimestamp &&
        (c.lawfulBasis === 'legal_obligation' || c.lawfulBasis === 'contract')
    );

    if (validConsent) {
      return { valid: true, basis: validConsent.lawfulBasis, record: validConsent };
    }

    return { valid: false, basis: null };
  }

  /**
   * Record lawful basis documentation (for non-consent bases)
   */
  async documentLawfulBasis(
    companyId: string,
    userId: string,
    purpose: ConsentPurpose,
    lawfulBasis: LawfulBasis,
    justification: string,
    policyVersion: string
  ): Promise<ConsentRecord> {
    const consentRef = push(ref(db, `${this.basePath}/${companyId}`));

    const record: ConsentRecord = {
      id: consentRef.key!,
      userId,
      companyId,
      purpose,
      lawfulBasis,
      consentGiven: true, // For contract/legal obligation, this represents acknowledgment
      consentTimestamp: Date.now(),
      method: 'implicit',
      version: policyVersion,
      metadata: {
        justification,
        documentedAt: Date.now(),
      },
    };

    await set(consentRef, record);
    return record;
  }

  /**
   * Mask IP address for GDPR compliance
   * Keeps first two octets, masks last two
   */
  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    // IPv6 or invalid - return truncated
    return ip.substring(0, 10) + '...';
  }

  /**
   * Export consent records for DSAR (Data Subject Access Request)
   */
  async exportUserConsents(
    userId: string,
    companyId: string
  ): Promise<{ consents: ConsentRecord[]; exportedAt: number }> {
    const consents = await this.getUserConsents(userId, companyId);

    return {
      consents,
      exportedAt: Date.now(),
    };
  }

  /**
   * Delete all consent records for a user (Right to Erasure)
   * Note: Some records may need to be retained for legal compliance
   */
  async deleteUserConsents(
    userId: string,
    companyId: string,
    options: { preserveLegalObligations?: boolean } = {}
  ): Promise<{ deleted: number; preserved: number }> {
    const consents = await this.getUserConsents(userId, companyId);
    let deleted = 0;
    let preserved = 0;

    for (const consent of consents) {
      // If preserving legal obligations, don't delete those records
      if (
        options.preserveLegalObligations &&
        consent.lawfulBasis === 'legal_obligation'
      ) {
        preserved++;
        continue;
      }

      const consentRef = ref(db, `${this.basePath}/${companyId}/${consent.id}`);
      await set(consentRef, null);
      deleted++;
    }

    return { deleted, preserved };
  }
}

// Export singleton instance
export const consentService = new ConsentService();

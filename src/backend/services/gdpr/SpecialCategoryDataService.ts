/**
 * Special Category Data Service
 *
 * Manages processing conditions for special category data (Article 9)
 * and criminal offence data (Article 10) under UK GDPR.
 *
 * UK GDPR Article 9: Processing of Special Categories of Personal Data
 * - Requires BOTH a lawful basis (Article 6) AND an Article 9 condition
 * - Must be documented before processing
 *
 * UK GDPR Article 10: Processing relating to Criminal Convictions
 * - Only allowed under official authority OR with specific legal basis
 * - Must be documented with appropriate policy document
 *
 * References:
 * - ICO Special Category Data Guidance
 * - Schedule 1, Data Protection Act 2018
 */

import { ref, push, set, get, update } from 'firebase/database';
import { db } from '../Firebase';
import { LawfulBasis } from './types';

/**
 * Special Category Data Types (Article 9)
 */
export type SpecialCategoryType =
  | 'racial_ethnic_origin'    // Racial or ethnic origin
  | 'political_opinions'      // Political opinions
  | 'religious_beliefs'       // Religious or philosophical beliefs
  | 'trade_union_membership'  // Trade union membership
  | 'genetic_data'            // Genetic data
  | 'biometric_data'          // Biometric data for identification
  | 'health_data'             // Health data
  | 'sex_life'                // Sex life or sexual orientation
  | 'criminal_offence';       // Criminal convictions and offences (Article 10)

/**
 * Article 9(2) Conditions for Processing Special Category Data
 */
export type Article9Condition =
  | 'explicit_consent'              // 9(2)(a) - Explicit consent
  | 'employment_social_security'    // 9(2)(b) - Employment, social security
  | 'vital_interests'               // 9(2)(c) - Vital interests
  | 'legitimate_activities'         // 9(2)(d) - Foundation/association activities
  | 'made_public'                   // 9(2)(e) - Data made public by subject
  | 'legal_claims'                  // 9(2)(f) - Legal claims
  | 'substantial_public_interest'   // 9(2)(g) - Substantial public interest
  | 'health_social_care'            // 9(2)(h) - Health/social care
  | 'public_health'                 // 9(2)(i) - Public health
  | 'archiving_research';           // 9(2)(j) - Archiving/research

/**
 * Schedule 1 Conditions (DPA 2018) - Additional UK-specific conditions
 */
export type Schedule1Condition =
  // Part 1 - Employment, Health, Research
  | 'employment_condition'          // Para 1 - Employment, social security, social protection
  | 'health_condition'              // Para 2 - Health or social care purposes
  | 'public_health_condition'       // Para 3 - Public health
  | 'research_condition'            // Para 4 - Research purposes
  // Part 2 - Substantial Public Interest
  | 'statutory_purpose'             // Para 6 - Statutory/government purposes
  | 'administration_of_justice'     // Para 7 - Administration of justice
  | 'equality_opportunity'          // Para 8 - Equality of opportunity
  | 'racial_ethnic_diversity'       // Para 9 - Racial/ethnic diversity
  | 'preventing_fraud'              // Para 10 - Preventing/detecting unlawful acts
  | 'suspicion_of_terrorism'        // Para 11 - Protecting the public
  | 'journalism'                    // Para 13 - Journalism
  | 'preventing_unlawful_acts'      // Para 14 - Preventing unlawful acts
  | 'protecting_public'             // Para 15 - Protecting the public
  | 'regulatory_requirements'       // Para 16 - Regulatory requirements
  | 'support_individuals'           // Para 18 - Safeguarding of children
  | 'insurance'                     // Para 20 - Insurance
  | 'occupational_pension'          // Para 21 - Occupational pensions
  | 'political_parties';            // Para 22 - Political parties

/**
 * Special Category Processing Record
 */
export interface SpecialCategoryProcessingRecord {
  id: string;
  companyId: string;

  // Data being processed
  specialCategoryType: SpecialCategoryType;
  dataDescription: string;

  // Legal basis (both required)
  article6Basis: LawfulBasis;              // General lawful basis
  article9Condition: Article9Condition;     // Special category condition
  schedule1Condition?: Schedule1Condition;  // UK-specific Schedule 1 condition

  // Justification
  article6Justification: string;
  article9Justification: string;
  legalReference?: string;

  // Purpose and necessity
  processingPurpose: string;
  necessityJustification: string;  // Why this processing is necessary

  // Data subjects
  dataSubjects: string[];

  // Safeguards (required for special category data)
  safeguards: string[];

  // Consent details (if condition is explicit_consent)
  consentDetails?: {
    mechanism: string;
    withdrawalProcess: string;
    lastConsentCheck?: number;
  };

  // Policy document (required for Schedule 1 conditions)
  policyDocumentRef?: string;

  // Review
  reviewFrequencyMonths: number;
  lastReviewedAt?: number;
  lastReviewedBy?: string;
  nextReviewAt: number;

  // Status
  status: 'draft' | 'active' | 'under_review' | 'suspended' | 'deprecated';

  // Audit
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;
}

/**
 * Pre-defined conditions for common payroll special category data
 */
export const PAYROLL_SPECIAL_CATEGORY_CONDITIONS: Record<string, {
  specialCategoryType: SpecialCategoryType;
  article9Condition: Article9Condition;
  schedule1Condition: Schedule1Condition;
  justification: string;
  safeguards: string[];
}> = {
  statutory_sick_pay: {
    specialCategoryType: 'health_data',
    article9Condition: 'employment_social_security',
    schedule1Condition: 'employment_condition',
    justification:
      'Processing health data is necessary for administering Statutory Sick Pay ' +
      'under employment and social security law (Social Security Contributions and Benefits Act 1992).',
    safeguards: [
      'Access restricted to authorized payroll personnel only',
      'Health details not stored beyond minimum required',
      'Encrypted at rest and in transit',
      'Audit logging of all access',
      'Regular access reviews',
    ],
  },
  statutory_maternity_pay: {
    specialCategoryType: 'health_data',
    article9Condition: 'employment_social_security',
    schedule1Condition: 'employment_condition',
    justification:
      'Processing health/pregnancy data is necessary for administering Statutory Maternity Pay ' +
      'under employment and social security law.',
    safeguards: [
      'Access restricted to authorized payroll personnel only',
      'Pregnancy-related data handled with extra sensitivity',
      'Encrypted at rest and in transit',
      'Audit logging of all access',
      'Data minimization - only essential details retained',
    ],
  },
  disability_adjustments: {
    specialCategoryType: 'health_data',
    article9Condition: 'employment_social_security',
    schedule1Condition: 'employment_condition',
    justification:
      'Processing disability data is necessary to make reasonable adjustments ' +
      'under the Equality Act 2010 and for employment purposes.',
    safeguards: [
      'Access on need-to-know basis only',
      'Specific consent obtained where appropriate',
      'Encrypted storage with additional access controls',
      'Regular review of necessity',
      'Data deletion when no longer needed',
    ],
  },
  trade_union_deductions: {
    specialCategoryType: 'trade_union_membership',
    article9Condition: 'explicit_consent',
    schedule1Condition: 'employment_condition',
    justification:
      'Processing trade union membership data for payroll deductions ' +
      'requires explicit employee consent.',
    safeguards: [
      'Explicit written consent required',
      'Easy withdrawal mechanism provided',
      'Access restricted to payroll only',
      'Not disclosed to other parties',
      'Deleted upon employment termination',
    ],
  },
  dbs_check_results: {
    specialCategoryType: 'criminal_offence',
    article9Condition: 'employment_social_security',
    schedule1Condition: 'preventing_fraud',
    justification:
      'Processing criminal record data for roles requiring DBS checks ' +
      'under legal obligations for safeguarding.',
    safeguards: [
      'Only processed where legally required for role',
      'Appropriate policy document in place',
      'Access strictly limited',
      'Certificate numbers only stored, not full details',
      'Regular review and deletion when no longer needed',
      'Not used beyond original purpose',
    ],
  },
};

/**
 * Special Category Data Service
 */
export class SpecialCategoryDataService {
  private basePath: string;

  constructor() {
    this.basePath = 'compliance/special_category';
  }

  /**
   * Document special category data processing
   * Must be done BEFORE any processing occurs
   */
  async documentSpecialCategoryProcessing(
    companyId: string,
    userId: string,
    options: {
      specialCategoryType: SpecialCategoryType;
      dataDescription: string;
      article6Basis: LawfulBasis;
      article9Condition: Article9Condition;
      schedule1Condition?: Schedule1Condition;
      article6Justification: string;
      article9Justification: string;
      legalReference?: string;
      processingPurpose: string;
      necessityJustification: string;
      dataSubjects: string[];
      safeguards: string[];
      consentDetails?: {
        mechanism: string;
        withdrawalProcess: string;
      };
      policyDocumentRef?: string;
      reviewFrequencyMonths?: number;
    }
  ): Promise<SpecialCategoryProcessingRecord> {
    // Validate that consent details are provided if condition is explicit_consent
    if (options.article9Condition === 'explicit_consent' && !options.consentDetails) {
      throw new Error(
        'Explicit consent condition requires consent mechanism and withdrawal process details.'
      );
    }

    // Validate policy document for Schedule 1 conditions (Part 2)
    const schedule1Part2Conditions: Schedule1Condition[] = [
      'statutory_purpose',
      'administration_of_justice',
      'equality_opportunity',
      'racial_ethnic_diversity',
      'preventing_fraud',
      'suspicion_of_terrorism',
      'journalism',
      'preventing_unlawful_acts',
      'protecting_public',
      'regulatory_requirements',
      'support_individuals',
      'insurance',
      'occupational_pension',
      'political_parties',
    ];

    if (
      options.schedule1Condition &&
      schedule1Part2Conditions.includes(options.schedule1Condition) &&
      !options.policyDocumentRef
    ) {
      throw new Error(
        `Schedule 1 Part 2 condition "${options.schedule1Condition}" requires an Appropriate Policy Document reference.`
      );
    }

    const recordRef = push(ref(db, `${this.basePath}/${companyId}`));
    const reviewFrequency = options.reviewFrequencyMonths || 6; // More frequent review for special category
    const now = Date.now();

    const record: SpecialCategoryProcessingRecord = {
      id: recordRef.key!,
      companyId,
      specialCategoryType: options.specialCategoryType,
      dataDescription: options.dataDescription,
      article6Basis: options.article6Basis,
      article9Condition: options.article9Condition,
      schedule1Condition: options.schedule1Condition,
      article6Justification: options.article6Justification,
      article9Justification: options.article9Justification,
      legalReference: options.legalReference,
      processingPurpose: options.processingPurpose,
      necessityJustification: options.necessityJustification,
      dataSubjects: options.dataSubjects,
      safeguards: options.safeguards,
      consentDetails: options.consentDetails ? {
        ...options.consentDetails,
        lastConsentCheck: now,
      } : undefined,
      policyDocumentRef: options.policyDocumentRef,
      reviewFrequencyMonths: reviewFrequency,
      nextReviewAt: now + (reviewFrequency * 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      createdAt: now,
      createdBy: userId,
    };

    await set(recordRef, record);
    return record;
  }

  /**
   * Use pre-defined condition for common payroll scenarios
   */
  async documentStandardPayrollCondition(
    companyId: string,
    userId: string,
    scenario: keyof typeof PAYROLL_SPECIAL_CATEGORY_CONDITIONS,
    options?: {
      additionalSafeguards?: string[];
      policyDocumentRef?: string;
      consentDetails?: {
        mechanism: string;
        withdrawalProcess: string;
      };
    }
  ): Promise<SpecialCategoryProcessingRecord> {
    const condition = PAYROLL_SPECIAL_CATEGORY_CONDITIONS[scenario];
    if (!condition) {
      throw new Error(`Unknown payroll scenario: ${scenario}`);
    }

    return this.documentSpecialCategoryProcessing(companyId, userId, {
      specialCategoryType: condition.specialCategoryType,
      dataDescription: `${scenario.replace(/_/g, ' ')} processing`,
      article6Basis: 'legal_obligation',
      article9Condition: condition.article9Condition,
      schedule1Condition: condition.schedule1Condition,
      article6Justification:
        'Processing necessary to comply with employment and social security legal obligations.',
      article9Justification: condition.justification,
      legalReference: 'Data Protection Act 2018, Schedule 1',
      processingPurpose: `Administer ${scenario.replace(/_/g, ' ')} as required by law.`,
      necessityJustification:
        'Processing is strictly necessary to comply with statutory obligations.',
      dataSubjects: ['employees'],
      safeguards: [
        ...condition.safeguards,
        ...(options?.additionalSafeguards || []),
      ],
      consentDetails: options?.consentDetails,
      policyDocumentRef: options?.policyDocumentRef,
      reviewFrequencyMonths: 6,
    });
  }

  /**
   * Validate that processing conditions exist for special category data
   */
  async validateSpecialCategoryProcessing(
    companyId: string,
    specialCategoryType: SpecialCategoryType
  ): Promise<{ valid: boolean; record?: SpecialCategoryProcessingRecord; error?: string }> {
    const records = await this.getProcessingRecords(companyId);
    const activeRecord = records.find(
      r => r.specialCategoryType === specialCategoryType && r.status === 'active'
    );

    if (!activeRecord) {
      return {
        valid: false,
        error:
          `No documented Article 9 condition for "${specialCategoryType}" data. ` +
          'Document processing conditions before handling this data.',
      };
    }

    // Check if review is overdue
    if (activeRecord.nextReviewAt < Date.now()) {
      return {
        valid: false,
        record: activeRecord,
        error:
          `Processing conditions for "${specialCategoryType}" are overdue for review. ` +
          'Review required before continued processing.',
      };
    }

    // Check consent validity if required
    if (
      activeRecord.article9Condition === 'explicit_consent' &&
      activeRecord.consentDetails
    ) {
      const consentAge = Date.now() - (activeRecord.consentDetails.lastConsentCheck || 0);
      const oneYear = 365 * 24 * 60 * 60 * 1000;

      if (consentAge > oneYear) {
        return {
          valid: false,
          record: activeRecord,
          error: 'Consent verification required. Last check was over 1 year ago.',
        };
      }
    }

    return { valid: true, record: activeRecord };
  }

  /**
   * Get all processing records for a company
   */
  async getProcessingRecords(companyId: string): Promise<SpecialCategoryProcessingRecord[]> {
    const recordsRef = ref(db, `${this.basePath}/${companyId}`);
    const snapshot = await get(recordsRef);

    if (!snapshot.exists()) return [];

    const records: SpecialCategoryProcessingRecord[] = [];
    snapshot.forEach((child) => {
      records.push(child.val() as SpecialCategoryProcessingRecord);
    });

    return records;
  }

  /**
   * Get records requiring review
   */
  async getRecordsRequiringReview(companyId: string): Promise<SpecialCategoryProcessingRecord[]> {
    const records = await this.getProcessingRecords(companyId);
    const now = Date.now();

    return records.filter(
      r => r.status === 'active' && r.nextReviewAt < now
    );
  }

  /**
   * Mark record as reviewed
   */
  async markAsReviewed(
    companyId: string,
    recordId: string,
    userId: string,
    notes?: string
  ): Promise<SpecialCategoryProcessingRecord> {
    const recordRef = ref(db, `${this.basePath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Processing record not found');
    }

    const existing = snapshot.val() as SpecialCategoryProcessingRecord;
    const now = Date.now();

    const updates: Partial<SpecialCategoryProcessingRecord> = {
      lastReviewedAt: now,
      lastReviewedBy: userId,
      nextReviewAt: now + (existing.reviewFrequencyMonths * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      updatedBy: userId,
    };

    await update(recordRef, updates);

    return { ...existing, ...updates } as SpecialCategoryProcessingRecord;
  }

  /**
   * Suspend processing (e.g., if safeguards fail)
   */
  async suspendProcessing(
    companyId: string,
    recordId: string,
    userId: string,
    reason: string
  ): Promise<SpecialCategoryProcessingRecord> {
    const recordRef = ref(db, `${this.basePath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Processing record not found');
    }

    const existing = snapshot.val() as SpecialCategoryProcessingRecord;
    const now = Date.now();

    const updates: Partial<SpecialCategoryProcessingRecord> = {
      status: 'suspended',
      updatedAt: now,
      updatedBy: userId,
    };

    await update(recordRef, updates);

    // Log suspension for audit purposes
    console.warn(
      `Special category processing suspended: ${existing.specialCategoryType} ` +
      `(Company: ${companyId}, Reason: ${reason})`
    );

    return { ...existing, ...updates } as SpecialCategoryProcessingRecord;
  }

  /**
   * Export processing records for compliance audit
   */
  async exportForAudit(companyId: string): Promise<{
    records: SpecialCategoryProcessingRecord[];
    summary: {
      total: number;
      active: number;
      requiresReview: number;
      byType: Record<string, number>;
    };
    exportedAt: number;
  }> {
    const records = await this.getProcessingRecords(companyId);
    const now = Date.now();

    const byType: Record<string, number> = {};
    let requiresReview = 0;

    for (const record of records) {
      byType[record.specialCategoryType] = (byType[record.specialCategoryType] || 0) + 1;
      if (record.status === 'active' && record.nextReviewAt < now) {
        requiresReview++;
      }
    }

    return {
      records,
      summary: {
        total: records.length,
        active: records.filter(r => r.status === 'active').length,
        requiresReview,
        byType,
      },
      exportedAt: now,
    };
  }

  /**
   * Generate Appropriate Policy Document template
   * Required for Schedule 1 Part 2 conditions
   */
  generatePolicyDocumentTemplate(
    companyName: string,
    processingPurpose: string,
    condition: Schedule1Condition
  ): string {
    return `
APPROPRIATE POLICY DOCUMENT
============================

Company: ${companyName}
Date: ${new Date().toISOString().split('T')[0]}
Review Date: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}

1. INTRODUCTION
---------------
This document sets out ${companyName}'s policy for processing special category
personal data and criminal offence data under the ${condition.replace(/_/g, ' ')}
condition set out in Schedule 1, Part 2 of the Data Protection Act 2018.

2. PROCESSING PURPOSE
---------------------
${processingPurpose}

3. SCHEDULE 1 CONDITION RELIED UPON
-----------------------------------
Condition: ${condition.replace(/_/g, ' ').toUpperCase()}
Reference: Data Protection Act 2018, Schedule 1, Part 2

4. PROCEDURES FOR COMPLIANCE WITH DATA PROTECTION PRINCIPLES
------------------------------------------------------------
We ensure compliance with UK GDPR principles by:

a) Lawfulness, Fairness, Transparency
   - Processing only with valid lawful basis
   - Informing data subjects via privacy notices
   - Maintaining clear records of processing activities

b) Purpose Limitation
   - Using data only for specified purposes
   - Not processing for incompatible purposes without consent

c) Data Minimisation
   - Collecting only necessary data
   - Regular review of data holdings

d) Accuracy
   - Keeping data up to date
   - Correction procedures in place

e) Storage Limitation
   - Retention periods defined and enforced
   - Secure deletion when no longer needed

f) Integrity and Confidentiality
   - Encryption at rest and in transit
   - Access controls and authentication
   - Audit logging

g) Accountability
   - This policy document
   - Staff training
   - Regular audits

5. RETENTION AND ERASURE POLICIES
---------------------------------
Special category data will be retained only for as long as necessary:
- [Specify retention period]
- [Specify deletion/anonymisation process]
- [Specify backup handling]

6. DATA SUBJECT RIGHTS
----------------------
Data subjects retain all UK GDPR rights including:
- Right of access
- Right to rectification
- Right to erasure (subject to legal obligations)
- Right to restrict processing
- Right to data portability
- Right to object

Contact the Data Protection Officer to exercise rights.

7. SAFEGUARDS
-------------
[List specific safeguards appropriate to the processing]

8. REVIEW
---------
This policy will be reviewed annually or when:
- Processing activities change
- Legislation changes
- Following a data breach
- On request from ICO

Signed: _________________________
Name: _________________________
Position: _________________________
Date: _________________________
    `.trim();
  }
}

// Export singleton instance
export const specialCategoryDataService = new SpecialCategoryDataService();

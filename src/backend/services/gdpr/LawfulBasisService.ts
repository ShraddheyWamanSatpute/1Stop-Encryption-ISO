/**
 * Lawful Basis Service
 *
 * Manages lawful basis documentation and validation for UK GDPR compliance.
 * Ensures lawful basis is determined and documented BEFORE any data processing.
 *
 * UK GDPR Article 6: Lawfulness of Processing
 * - Processing is lawful only if at least one basis applies
 * - Must document the basis before processing begins
 * - Basis must be included in privacy notices
 *
 * Reference: ICO Lawful Basis Guidance
 * https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/
 */

import { ref, push, set, get, update } from 'firebase/database';
import { db } from '../Firebase';
import { LawfulBasis } from './types';

/**
 * Processing Activity Types
 */
export type ProcessingActivity =
  | 'payroll_calculation'     // Calculating employee pay
  | 'tax_calculation'         // PAYE and NI calculations
  | 'hmrc_fps_submission'     // Full Payment Submission to HMRC
  | 'hmrc_eps_submission'     // Employer Payment Summary
  | 'hmrc_eyu_submission'     // Earlier Year Update
  | 'pension_submission'      // Pension provider reporting
  | 'employee_record_storage' // Storing employee data
  | 'payslip_generation'      // Creating payslips
  | 'p45_p60_generation'      // Tax documents
  | 'ssp_processing'          // Statutory Sick Pay
  | 'smp_processing'          // Statutory Maternity Pay
  | 'spp_processing'          // Statutory Paternity Pay
  | 'student_loan_deduction'  // Student loan calculations
  | 'bank_payment'            // BACS payments
  | 'audit_logging'           // Security audit trail
  | 'analytics'               // Usage analytics
  | 'marketing';              // Marketing communications

/**
 * Data Category Types
 */
export type DataCategoryType =
  | 'identity'           // Name, DOB, NI number
  | 'contact'            // Address, email, phone
  | 'employment'         // Job details, dates
  | 'financial'          // Bank details, salary
  | 'tax'                // Tax codes, PAYE
  | 'health'             // SSP-related health data
  | 'special_category';  // Article 9 data

/**
 * Lawful Basis Record
 * Documents the lawful basis for a specific processing activity
 */
export interface LawfulBasisRecord {
  id: string;
  companyId: string;
  processingActivity: ProcessingActivity;
  dataCategories: DataCategoryType[];
  lawfulBasis: LawfulBasis;

  // Documentation (required before processing)
  justification: string;
  legalReference?: string;          // e.g., "Income Tax Act 2007", "PAYE Regulations"
  legitimateInterestAssessment?: string;  // Required if basis is legitimate_interests

  // Data subjects affected
  dataSubjects: ('employees' | 'contractors' | 'directors' | 'pensioners')[];

  // Processing details
  processingPurpose: string;
  dataRetentionPeriod: string;      // e.g., "6 years after tax year end"

  // Consent tracking (if basis is consent)
  consentRequired: boolean;
  consentMechanism?: string;

  // Review schedule
  reviewFrequencyMonths: number;
  lastReviewedAt?: number;
  lastReviewedBy?: string;
  nextReviewAt: number;

  // Status
  status: 'draft' | 'active' | 'under_review' | 'deprecated';

  // Audit
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
  updatedBy?: string;

  // Privacy notice reference
  privacyNoticeSectionId?: string;  // Links to privacy policy section
}

/**
 * Pre-defined lawful basis mappings for common payroll activities
 */
export const STANDARD_LAWFUL_BASIS_MAPPINGS: Partial<Record<ProcessingActivity, {
  basis: LawfulBasis;
  justification: string;
  legalReference?: string;
}>> = {
  payroll_calculation: {
    basis: 'contract',
    justification: 'Processing necessary to fulfil employment contract obligations - paying employees their agreed salary.',
    legalReference: 'Employment Rights Act 1996',
  },
  tax_calculation: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to calculate and deduct PAYE income tax and National Insurance contributions.',
    legalReference: 'Income Tax (Earnings and Pensions) Act 2003, Social Security Contributions and Benefits Act 1992',
  },
  hmrc_fps_submission: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to report payroll data to HMRC in real time under RTI regulations.',
    legalReference: 'PAYE Regulations 2003 (as amended), Income Tax Act 2007',
  },
  hmrc_eps_submission: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to submit employer payment summary to HMRC monthly.',
    legalReference: 'PAYE Regulations 2003 (as amended)',
  },
  hmrc_eyu_submission: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to correct previous tax year submissions to HMRC.',
    legalReference: 'PAYE Regulations 2003 (as amended)',
  },
  pension_submission: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to submit pension contributions and comply with auto-enrolment duties.',
    legalReference: 'Pensions Act 2008, Automatic Enrolment Regulations 2010',
  },
  employee_record_storage: {
    basis: 'contract',
    justification: 'Processing necessary to maintain employment relationship and fulfil contractual obligations.',
    legalReference: 'Employment Rights Act 1996',
  },
  payslip_generation: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to provide itemised pay statements to employees.',
    legalReference: 'Employment Rights Act 1996, Section 8',
  },
  p45_p60_generation: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to issue P45 on employment termination and P60 at tax year end.',
    legalReference: 'PAYE Regulations 2003',
  },
  ssp_processing: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to administer Statutory Sick Pay for eligible employees.',
    legalReference: 'Social Security Contributions and Benefits Act 1992',
  },
  smp_processing: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to administer Statutory Maternity Pay for eligible employees.',
    legalReference: 'Social Security Contributions and Benefits Act 1992',
  },
  spp_processing: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to administer Statutory Paternity Pay for eligible employees.',
    legalReference: 'Social Security Contributions and Benefits Act 1992',
  },
  student_loan_deduction: {
    basis: 'legal_obligation',
    justification: 'Legal requirement to deduct student loan repayments when directed by HMRC.',
    legalReference: 'Education (Student Loans) Act 1990',
  },
  bank_payment: {
    basis: 'contract',
    justification: 'Processing necessary to fulfil contractual obligation to pay employee salary.',
    legalReference: 'Employment Rights Act 1996',
  },
  audit_logging: {
    basis: 'legitimate_interests',
    justification: 'Legitimate interest in maintaining security, detecting fraud, and ensuring compliance. This does not override individual privacy rights as logging is minimal and necessary.',
  },
  analytics: {
    basis: 'consent',
    justification: 'Processing for analytics and service improvement requires explicit user consent.',
  },
  marketing: {
    basis: 'consent',
    justification: 'Marketing communications require explicit opt-in consent under PECR and UK GDPR.',
    legalReference: 'Privacy and Electronic Communications Regulations 2003',
  },
};

/**
 * Lawful Basis Service
 */
export class LawfulBasisService {
  private basePath: string;

  constructor() {
    this.basePath = 'compliance/lawful_basis';
  }

  /**
   * Document lawful basis BEFORE processing begins
   * This is a UK GDPR requirement - must document basis before processing
   */
  async documentLawfulBasis(
    companyId: string,
    userId: string,
    activity: ProcessingActivity,
    options: {
      dataCategories: DataCategoryType[];
      dataSubjects: ('employees' | 'contractors' | 'directors' | 'pensioners')[];
      customJustification?: string;
      customLegalReference?: string;
      legitimateInterestAssessment?: string;
      dataRetentionPeriod?: string;
      consentMechanism?: string;
      reviewFrequencyMonths?: number;
    }
  ): Promise<LawfulBasisRecord> {
    // Get standard mapping if available
    const standardMapping = STANDARD_LAWFUL_BASIS_MAPPINGS[activity];
    if (!standardMapping && !options.customJustification) {
      throw new Error(
        `No standard lawful basis mapping for activity "${activity}". ` +
        'Please provide a customJustification.'
      );
    }

    const basis = standardMapping?.basis || 'legitimate_interests';
    const justification = options.customJustification || standardMapping?.justification || '';
    const legalReference = options.customLegalReference || standardMapping?.legalReference;

    // Validate legitimate interests assessment if required
    if (basis === 'legitimate_interests' && !options.legitimateInterestAssessment) {
      throw new Error(
        'Legitimate interests basis requires a documented Legitimate Interest Assessment (LIA).'
      );
    }

    const recordRef = push(ref(db, `${this.basePath}/${companyId}`));
    const reviewFrequency = options.reviewFrequencyMonths || 12;
    const now = Date.now();

    const record: LawfulBasisRecord = {
      id: recordRef.key!,
      companyId,
      processingActivity: activity,
      dataCategories: options.dataCategories,
      lawfulBasis: basis,
      justification,
      legalReference,
      legitimateInterestAssessment: options.legitimateInterestAssessment,
      dataSubjects: options.dataSubjects,
      processingPurpose: this.getProcessingPurpose(activity),
      dataRetentionPeriod: options.dataRetentionPeriod || this.getDefaultRetentionPeriod(activity),
      consentRequired: basis === 'consent',
      consentMechanism: options.consentMechanism,
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
   * Get processing purpose description
   */
  private getProcessingPurpose(activity: ProcessingActivity): string {
    const purposes: Record<ProcessingActivity, string> = {
      payroll_calculation: 'Calculate employee gross pay, deductions, and net pay',
      tax_calculation: 'Calculate PAYE income tax and National Insurance contributions',
      hmrc_fps_submission: 'Submit payroll data to HMRC via Real Time Information (RTI)',
      hmrc_eps_submission: 'Submit employer payment summary adjustments to HMRC',
      hmrc_eyu_submission: 'Correct previous tax year submissions to HMRC',
      pension_submission: 'Submit pension contributions to pension providers',
      employee_record_storage: 'Store and maintain employee personal and employment records',
      payslip_generation: 'Generate and distribute itemised pay statements',
      p45_p60_generation: 'Generate statutory tax documents for employees',
      ssp_processing: 'Calculate and pay Statutory Sick Pay',
      smp_processing: 'Calculate and pay Statutory Maternity Pay',
      spp_processing: 'Calculate and pay Statutory Paternity Pay',
      student_loan_deduction: 'Calculate and deduct student loan repayments',
      bank_payment: 'Process salary payments via BACS',
      audit_logging: 'Record access and changes to sensitive data for security',
      analytics: 'Analyse usage patterns to improve services',
      marketing: 'Send marketing communications about products and services',
    };
    return purposes[activity];
  }

  /**
   * Get default retention period for an activity
   */
  private getDefaultRetentionPeriod(activity: ProcessingActivity): string {
    const retentionPeriods: Partial<Record<ProcessingActivity, string>> = {
      payroll_calculation: '6 years after current tax year',
      tax_calculation: '6 years after current tax year',
      hmrc_fps_submission: '6 years after tax year of submission',
      hmrc_eps_submission: '6 years after tax year of submission',
      hmrc_eyu_submission: '6 years after tax year of correction',
      pension_submission: '6 years after employment ends',
      employee_record_storage: '6 years after employment ends',
      payslip_generation: '6 years after current tax year',
      p45_p60_generation: '6 years after issue date',
      ssp_processing: '3 years after tax year',
      smp_processing: '3 years after tax year',
      spp_processing: '3 years after tax year',
      student_loan_deduction: '6 years after current tax year',
      bank_payment: '6 years after payment date',
      audit_logging: '7 years',
      analytics: 'Until consent withdrawn or 2 years',
      marketing: 'Until consent withdrawn',
    };
    return retentionPeriods[activity] || '6 years';
  }

  /**
   * Validate that lawful basis exists for a processing activity
   * Call this BEFORE performing any data processing
   */
  async validateProcessingBasis(
    companyId: string,
    activity: ProcessingActivity
  ): Promise<{ valid: boolean; record?: LawfulBasisRecord; error?: string }> {
    const records = await this.getLawfulBasisRecords(companyId);
    const activeRecord = records.find(
      r => r.processingActivity === activity && r.status === 'active'
    );

    if (!activeRecord) {
      return {
        valid: false,
        error: `No documented lawful basis for activity "${activity}". ` +
          'Document lawful basis before processing.',
      };
    }

    // Check if review is overdue
    if (activeRecord.nextReviewAt < Date.now()) {
      return {
        valid: false,
        record: activeRecord,
        error: `Lawful basis for "${activity}" is overdue for review. ` +
          'Please review and update before processing.',
      };
    }

    return { valid: true, record: activeRecord };
  }

  /**
   * Get all lawful basis records for a company
   */
  async getLawfulBasisRecords(companyId: string): Promise<LawfulBasisRecord[]> {
    const recordsRef = ref(db, `${this.basePath}/${companyId}`);
    const snapshot = await get(recordsRef);

    if (!snapshot.exists()) return [];

    const records: LawfulBasisRecord[] = [];
    snapshot.forEach((child) => {
      records.push(child.val() as LawfulBasisRecord);
    });

    return records;
  }

  /**
   * Get lawful basis record by activity
   */
  async getLawfulBasisByActivity(
    companyId: string,
    activity: ProcessingActivity
  ): Promise<LawfulBasisRecord | null> {
    const records = await this.getLawfulBasisRecords(companyId);
    return records.find(
      r => r.processingActivity === activity && r.status === 'active'
    ) || null;
  }

  /**
   * Update lawful basis record
   */
  async updateLawfulBasis(
    companyId: string,
    recordId: string,
    userId: string,
    updates: Partial<Pick<LawfulBasisRecord,
      | 'justification'
      | 'legalReference'
      | 'legitimateInterestAssessment'
      | 'dataRetentionPeriod'
      | 'reviewFrequencyMonths'
      | 'status'
    >>
  ): Promise<LawfulBasisRecord> {
    const recordRef = ref(db, `${this.basePath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Lawful basis record not found');
    }

    const existing = snapshot.val() as LawfulBasisRecord;
    const now = Date.now();

    const updatedRecord: Partial<LawfulBasisRecord> = {
      ...updates,
      updatedAt: now,
      updatedBy: userId,
      lastReviewedAt: now,
      lastReviewedBy: userId,
    };

    // Recalculate next review date if frequency changed
    if (updates.reviewFrequencyMonths) {
      updatedRecord.nextReviewAt = now + (updates.reviewFrequencyMonths * 30 * 24 * 60 * 60 * 1000);
    }

    await update(recordRef, updatedRecord);

    return { ...existing, ...updatedRecord } as LawfulBasisRecord;
  }

  /**
   * Mark lawful basis as reviewed
   */
  async markAsReviewed(
    companyId: string,
    recordId: string,
    userId: string
  ): Promise<LawfulBasisRecord> {
    const recordRef = ref(db, `${this.basePath}/${companyId}/${recordId}`);
    const snapshot = await get(recordRef);

    if (!snapshot.exists()) {
      throw new Error('Lawful basis record not found');
    }

    const existing = snapshot.val() as LawfulBasisRecord;
    const now = Date.now();

    const updates: Partial<LawfulBasisRecord> = {
      lastReviewedAt: now,
      lastReviewedBy: userId,
      nextReviewAt: now + (existing.reviewFrequencyMonths * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
      updatedBy: userId,
    };

    await update(recordRef, updates);

    return { ...existing, ...updates } as LawfulBasisRecord;
  }

  /**
   * Get records requiring review
   */
  async getRecordsRequiringReview(companyId: string): Promise<LawfulBasisRecord[]> {
    const records = await this.getLawfulBasisRecords(companyId);
    const now = Date.now();

    return records.filter(
      r => r.status === 'active' && r.nextReviewAt < now
    );
  }

  /**
   * Initialize standard lawful basis records for a new company
   * Creates documentation for all standard payroll processing activities
   */
  async initializeStandardBasis(
    companyId: string,
    userId: string
  ): Promise<LawfulBasisRecord[]> {
    const standardActivities: ProcessingActivity[] = [
      'payroll_calculation',
      'tax_calculation',
      'hmrc_fps_submission',
      'hmrc_eps_submission',
      'pension_submission',
      'employee_record_storage',
      'payslip_generation',
      'p45_p60_generation',
      'bank_payment',
      'audit_logging',
    ];

    const records: LawfulBasisRecord[] = [];

    for (const activity of standardActivities) {
      const record = await this.documentLawfulBasis(
        companyId,
        userId,
        activity,
        {
          dataCategories: this.getDataCategoriesForActivity(activity),
          dataSubjects: ['employees', 'contractors', 'directors'],
          reviewFrequencyMonths: 12,
        }
      );
      records.push(record);
    }

    return records;
  }

  /**
   * Get data categories processed by an activity
   */
  private getDataCategoriesForActivity(activity: ProcessingActivity): DataCategoryType[] {
    const categoryMap: Record<ProcessingActivity, DataCategoryType[]> = {
      payroll_calculation: ['identity', 'employment', 'financial', 'tax'],
      tax_calculation: ['identity', 'financial', 'tax'],
      hmrc_fps_submission: ['identity', 'contact', 'employment', 'financial', 'tax'],
      hmrc_eps_submission: ['financial', 'tax'],
      hmrc_eyu_submission: ['identity', 'financial', 'tax'],
      pension_submission: ['identity', 'employment', 'financial'],
      employee_record_storage: ['identity', 'contact', 'employment'],
      payslip_generation: ['identity', 'financial', 'tax'],
      p45_p60_generation: ['identity', 'financial', 'tax'],
      ssp_processing: ['identity', 'financial', 'health'],
      smp_processing: ['identity', 'financial', 'health'],
      spp_processing: ['identity', 'financial'],
      student_loan_deduction: ['identity', 'financial'],
      bank_payment: ['identity', 'financial'],
      audit_logging: ['identity'],
      analytics: ['identity'],
      marketing: ['identity', 'contact'],
    };
    return categoryMap[activity] || ['identity'];
  }

  /**
   * Export lawful basis documentation for privacy notice
   */
  async exportForPrivacyNotice(companyId: string): Promise<{
    activities: Array<{
      activity: string;
      purpose: string;
      lawfulBasis: string;
      dataCategories: string[];
      retention: string;
    }>;
    lastUpdated: number;
  }> {
    const records = await this.getLawfulBasisRecords(companyId);
    const activeRecords = records.filter(r => r.status === 'active');

    const lawfulBasisLabels: Record<LawfulBasis, string> = {
      consent: 'Consent (Article 6(1)(a))',
      contract: 'Contract (Article 6(1)(b))',
      legal_obligation: 'Legal Obligation (Article 6(1)(c))',
      vital_interests: 'Vital Interests (Article 6(1)(d))',
      public_task: 'Public Task (Article 6(1)(e))',
      legitimate_interests: 'Legitimate Interests (Article 6(1)(f))',
    };

    return {
      activities: activeRecords.map(r => ({
        activity: r.processingActivity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        purpose: r.processingPurpose,
        lawfulBasis: lawfulBasisLabels[r.lawfulBasis],
        dataCategories: r.dataCategories.map(c => c.replace(/_/g, ' ')),
        retention: r.dataRetentionPeriod,
      })),
      lastUpdated: Math.max(...activeRecords.map(r => r.updatedAt || r.createdAt)),
    };
  }
}

// Export singleton instance
export const lawfulBasisService = new LawfulBasisService();

/**
 * Data Subject Access Request (DSAR) Service
 *
 * Manages data subject access requests in compliance with UK GDPR.
 * Handles all data subject rights:
 * - Right of Access (Article 15)
 * - Right to Rectification (Article 16)
 * - Right to Erasure (Article 17)
 * - Right to Data Portability (Article 20)
 * - Right to Restriction of Processing (Article 18)
 * - Right to Object (Article 21)
 *
 * Reference: ICO Data Subject Access Requests Guide
 *
 * Timeline Requirements:
 * - Respond within 1 month of receipt
 * - Can extend by 2 months for complex requests (must notify within 1 month)
 * - Must verify identity before processing
 */

import { ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../Firebase';
import { DataSubjectAccessRequest } from './types';
import { auditTrailService } from './AuditTrailService';
import { consentService } from './ConsentService';
import { sensitiveDataService } from '../encryption/SensitiveDataService';

/**
 * DSAR Request Types
 */
export type DSARRequestType =
  | 'access'        // Right to access personal data
  | 'rectification' // Right to correct inaccurate data
  | 'erasure'       // Right to be forgotten
  | 'portability'   // Right to data portability
  | 'restriction'   // Right to restrict processing
  | 'objection';    // Right to object

/**
 * DSAR Status
 */
export type DSARStatus =
  | 'pending'       // Awaiting processing
  | 'identity_verification' // Verifying requester identity
  | 'in_progress'   // Being processed
  | 'extended'      // Extended timeline (complex request)
  | 'completed'     // Request fulfilled
  | 'rejected'      // Request rejected (with reason)
  | 'withdrawn';    // Withdrawn by requester

/**
 * Extended DSAR record with full tracking
 */
export interface DSARRecord extends DataSubjectAccessRequest {
  status: DSARStatus;
  // Identity verification
  identityVerified: boolean;
  identityVerifiedAt?: number;
  identityVerifiedBy?: string;
  identityVerificationMethod?: string;

  // Timeline tracking
  receivedAt: number;
  acknowledgedAt?: number;
  dueDate: number;
  extensionGranted?: boolean;
  extensionReason?: string;
  extendedDueDate?: number;

  // Processing
  assignedTo?: string;
  dataCategories?: string[];
  systemsSearched?: string[];

  // Response
  responseMethod?: 'email' | 'postal' | 'portal';
  responseDetails?: string;
  dataCopiesProvided?: boolean;

  // For rectification/erasure
  fieldsAffected?: string[];
  changesApplied?: Record<string, { old: string; new: string }>;

  // Retention exemptions
  retentionExemptions?: string[];
  partialDeletion?: boolean;

  // Audit
  auditLogIds: string[];
  internalNotes?: string;
}

/**
 * DSAR Response data for access requests
 */
export interface DSARResponseData {
  personalData: Record<string, unknown>;
  processingPurposes: string[];
  dataCategories: string[];
  recipients: string[];
  retentionPeriods: Record<string, string>;
  dataSource: string;
  automatedDecisionMaking: boolean;
  transfersToThirdCountries: boolean;
  safeguards?: string;
  exportedAt: number;
  exportFormat: 'json' | 'csv' | 'pdf';
}

/**
 * Data Subject Access Request Service
 */
export class DSARService {
  private basePath: string;
  private readonly DEFAULT_RESPONSE_DAYS = 30; // 1 month
  private readonly MAX_EXTENSION_DAYS = 60; // 2 additional months

  constructor() {
    this.basePath = 'compliance/dsar';
  }

  /**
   * Submit a new DSAR
   */
  async submitRequest(
    companyId: string,
    requestType: DSARRequestType,
    requester: {
      userId?: string;
      email: string;
      name: string;
      employeeId?: string;
    },
    details: {
      description: string;
      dataCategories?: string[];
      specificData?: string;
      preferredResponseMethod?: 'email' | 'postal' | 'portal';
    }
  ): Promise<DSARRecord> {
    const dsarRef = push(ref(db, `${this.basePath}/${companyId}`));
    const now = Date.now();
    const dueDate = now + this.DEFAULT_RESPONSE_DAYS * 24 * 60 * 60 * 1000;

    const record: DSARRecord = {
      id: dsarRef.key!,
      companyId,
      requesterId: requester.userId || `guest_${Date.now()}`,
      requesterEmail: requester.email,
      requestType,
      status: 'pending',
      requestedAt: now,
      dueDate,
      receivedAt: now,
      identityVerified: !!requester.userId, // Auto-verified if logged in user
      notes: details.description,
      dataCategories: details.dataCategories,
      responseMethod: details.preferredResponseMethod,
      auditLogIds: [],
      createdAt: now,
    };

    await set(dsarRef, record);

    // Log the DSAR submission
    const auditLog = await auditTrailService.log('data_view', requester.userId || 'guest', companyId, {
      resourceType: 'dsar',
      resourceId: record.id,
      description: `DSAR submitted: ${requestType} request`,
      metadata: {
        requestType,
        requesterEmail: this.maskEmail(requester.email),
      },
    });

    // Update record with audit log ID
    await update(dsarRef, {
      auditLogIds: [auditLog.id],
    });

    console.log(`[DSARService] New ${requestType} request submitted (ID: ${record.id})`);
    return record;
  }

  /**
   * Acknowledge receipt of DSAR
   */
  async acknowledgeRequest(
    companyId: string,
    dsarId: string,
    handlerId: string
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    const record = snapshot.val() as DSARRecord;

    await update(dsarRef, {
      acknowledgedAt: Date.now(),
      assignedTo: handlerId,
      status: record.identityVerified ? 'in_progress' : 'identity_verification',
      updatedAt: Date.now(),
    });

    // Log acknowledgement
    await this.addAuditLog(companyId, dsarId, handlerId, 'Acknowledged DSAR request');
  }

  /**
   * Verify requester identity
   */
  async verifyIdentity(
    companyId: string,
    dsarId: string,
    verifierId: string,
    verificationMethod: string
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    await update(dsarRef, {
      identityVerified: true,
      identityVerifiedAt: Date.now(),
      identityVerifiedBy: verifierId,
      identityVerificationMethod: verificationMethod,
      status: 'in_progress',
      updatedAt: Date.now(),
    });

    await this.addAuditLog(
      companyId,
      dsarId,
      verifierId,
      `Identity verified via ${verificationMethod}`
    );
  }

  /**
   * Request timeline extension (for complex requests)
   */
  async requestExtension(
    companyId: string,
    dsarId: string,
    handlerId: string,
    reason: string
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    const record = snapshot.val() as DSARRecord;

    if (record.extensionGranted) {
      throw new Error('Extension already granted for this request');
    }

    const extendedDueDate = record.dueDate + this.MAX_EXTENSION_DAYS * 24 * 60 * 60 * 1000;

    await update(dsarRef, {
      extensionGranted: true,
      extensionReason: reason,
      extendedDueDate,
      status: 'extended',
      updatedAt: Date.now(),
    });

    await this.addAuditLog(
      companyId,
      dsarId,
      handlerId,
      `Extension granted: ${reason}. New due date: ${new Date(extendedDueDate).toISOString()}`
    );
  }

  /**
   * Complete access request - export user data
   */
  async completeAccessRequest(
    companyId: string,
    dsarId: string,
    handlerId: string,
    responseData: DSARResponseData
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    const record = snapshot.val() as DSARRecord;

    if (record.requestType !== 'access') {
      throw new Error('This method is for access requests only');
    }

    await update(dsarRef, {
      status: 'completed',
      completedAt: Date.now(),
      handledBy: handlerId,
      dataCopiesProvided: true,
      responseDetails: `Data exported in ${responseData.exportFormat} format`,
      updatedAt: Date.now(),
    });

    await this.addAuditLog(
      companyId,
      dsarId,
      handlerId,
      `Access request completed. Data exported in ${responseData.exportFormat} format.`
    );
  }

  /**
   * Complete rectification request
   */
  async completeRectificationRequest(
    companyId: string,
    dsarId: string,
    handlerId: string,
    changes: Record<string, { old: string; new: string }>
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    const record = snapshot.val() as DSARRecord;

    if (record.requestType !== 'rectification') {
      throw new Error('This method is for rectification requests only');
    }

    await update(dsarRef, {
      status: 'completed',
      completedAt: Date.now(),
      handledBy: handlerId,
      fieldsAffected: Object.keys(changes),
      changesApplied: changes,
      responseDetails: `${Object.keys(changes).length} field(s) rectified`,
      updatedAt: Date.now(),
    });

    await this.addAuditLog(
      companyId,
      dsarId,
      handlerId,
      `Rectification completed. Fields updated: ${Object.keys(changes).join(', ')}`
    );
  }

  /**
   * Complete erasure request
   */
  async completeErasureRequest(
    companyId: string,
    dsarId: string,
    handlerId: string,
    options: {
      deletedCategories: string[];
      retentionExemptions?: string[];
      partialDeletion?: boolean;
    }
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    const record = snapshot.val() as DSARRecord;

    if (record.requestType !== 'erasure') {
      throw new Error('This method is for erasure requests only');
    }

    let responseDetails = `Deleted data categories: ${options.deletedCategories.join(', ')}`;
    if (options.retentionExemptions?.length) {
      responseDetails += `. Retained for legal compliance: ${options.retentionExemptions.join(', ')}`;
    }

    await update(dsarRef, {
      status: 'completed',
      completedAt: Date.now(),
      handledBy: handlerId,
      dataCategories: options.deletedCategories,
      retentionExemptions: options.retentionExemptions,
      partialDeletion: options.partialDeletion,
      responseDetails,
      updatedAt: Date.now(),
    });

    await this.addAuditLog(companyId, dsarId, handlerId, responseDetails);
  }

  /**
   * Reject DSAR with reason
   */
  async rejectRequest(
    companyId: string,
    dsarId: string,
    handlerId: string,
    reason: string
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    await update(dsarRef, {
      status: 'rejected',
      completedAt: Date.now(),
      handledBy: handlerId,
      responseDetails: reason,
      updatedAt: Date.now(),
    });

    await this.addAuditLog(companyId, dsarId, handlerId, `Request rejected: ${reason}`);
  }

  /**
   * Get DSAR by ID
   */
  async getRequest(companyId: string, dsarId: string): Promise<DSARRecord | null> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as DSARRecord;
  }

  /**
   * Get all DSARs for a company
   */
  async getCompanyRequests(
    companyId: string,
    options: {
      status?: DSARStatus;
      requestType?: DSARRequestType;
      limit?: number;
    } = {}
  ): Promise<DSARRecord[]> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}`);
    const dsarQuery = query(dsarRef, orderByChild('createdAt'));

    const snapshot = await get(dsarQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const requests: DSARRecord[] = [];
    snapshot.forEach((child) => {
      const record = child.val() as DSARRecord;

      // Apply filters
      if (options.status && record.status !== options.status) return;
      if (options.requestType && record.requestType !== options.requestType) return;

      requests.push(record);
    });

    // Sort by most recent first
    requests.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (options.limit) {
      return requests.slice(0, options.limit);
    }

    return requests;
  }

  /**
   * Get requests by requester email
   */
  async getRequestsByEmail(companyId: string, email: string): Promise<DSARRecord[]> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}`);
    const dsarQuery = query(dsarRef, orderByChild('requesterEmail'), equalTo(email));
    const snapshot = await get(dsarQuery);

    if (!snapshot.exists()) {
      return [];
    }

    const requests: DSARRecord[] = [];
    snapshot.forEach((child) => {
      requests.push(child.val() as DSARRecord);
    });

    return requests.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get overdue requests
   */
  async getOverdueRequests(companyId: string): Promise<DSARRecord[]> {
    const requests = await this.getCompanyRequests(companyId);
    const now = Date.now();

    return requests.filter((r) => {
      if (r.status === 'completed' || r.status === 'rejected' || r.status === 'withdrawn') {
        return false;
      }

      const effectiveDueDate = r.extendedDueDate || r.dueDate;
      return effectiveDueDate < now;
    });
  }

  /**
   * Get upcoming due requests (within 7 days)
   */
  async getUpcomingDueRequests(companyId: string): Promise<DSARRecord[]> {
    const requests = await this.getCompanyRequests(companyId);
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    return requests.filter((r) => {
      if (r.status === 'completed' || r.status === 'rejected' || r.status === 'withdrawn') {
        return false;
      }

      const effectiveDueDate = r.extendedDueDate || r.dueDate;
      return effectiveDueDate >= now && effectiveDueDate <= sevenDaysFromNow;
    });
  }

  /**
   * Get DSAR statistics
   */
  async getStatistics(companyId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
    overdue: number;
    averageCompletionDays: number;
    byType: Record<DSARRequestType, number>;
  }> {
    const requests = await this.getCompanyRequests(companyId);
    const overdueRequests = await this.getOverdueRequests(companyId);

    const stats = {
      total: requests.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      rejected: 0,
      overdue: overdueRequests.length,
      averageCompletionDays: 0,
      byType: {
        access: 0,
        rectification: 0,
        erasure: 0,
        portability: 0,
        restriction: 0,
        objection: 0,
      } as Record<DSARRequestType, number>,
    };

    let completedDaysTotal = 0;
    let completedCount = 0;

    for (const r of requests) {
      // Status counts
      if (r.status === 'pending' || r.status === 'identity_verification') {
        stats.pending++;
      } else if (r.status === 'in_progress' || r.status === 'extended') {
        stats.inProgress++;
      } else if (r.status === 'completed') {
        stats.completed++;
        if (r.completedAt && r.receivedAt) {
          completedDaysTotal += (r.completedAt - r.receivedAt) / (24 * 60 * 60 * 1000);
          completedCount++;
        }
      } else if (r.status === 'rejected') {
        stats.rejected++;
      }

      // Type counts
      stats.byType[r.requestType as DSARRequestType]++;
    }

    if (completedCount > 0) {
      stats.averageCompletionDays = Math.round(completedDaysTotal / completedCount);
    }

    return stats;
  }

  /**
   * Add internal note to DSAR
   */
  async addInternalNote(
    companyId: string,
    dsarId: string,
    _userId: string,
    note: string
  ): Promise<void> {
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (!snapshot.exists()) {
      throw new Error('DSAR request not found');
    }

    const record = snapshot.val() as DSARRecord;
    const existingNotes = record.internalNotes || '';
    const newNote = `[${new Date().toISOString()}] ${note}`;

    await update(dsarRef, {
      internalNotes: existingNotes ? `${existingNotes}\n${newNote}` : newNote,
      updatedAt: Date.now(),
    });
  }

  /**
   * Generate data export for access request (GDPR Art. 15 - Right of Access)
   * Collects all user personal data from all sources
   */
  async generateDataExport(
    companyId: string,
    userId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<DSARResponseData> {
    const personalData: Record<string, unknown> = {
      identity: {},
      contact: {},
      employment: {},
      financial: {},
      technical: {},
      consent: {},
      audit: {},
    };

    // 1. User profile data (users/{uid})
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      personalData.identity = {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin,
      };
      personalData.contact = {
        email: userData.email,
        phoneNumber: userData.phoneNumber,
      };
    }

    // 2. User personal settings (users/{uid}/settings/personal)
    const personalSettingsRef = ref(db, `users/${userId}/settings/personal`);
    const personalSettingsSnapshot = await get(personalSettingsRef);
    if (personalSettingsSnapshot.exists()) {
      let personalSettings: Record<string, unknown> = personalSettingsSnapshot.val() as Record<string, unknown>;
      
      // Decrypt if encrypted
      if (sensitiveDataService.isInitialized()) {
        try {
          personalSettings = (await sensitiveDataService.decryptUserPersonalData(
            personalSettings
          )) as Record<string, unknown>;
        } catch (err) {
          console.warn('[DSARService] Failed to decrypt personal settings:', err);
        }
      }

      personalData.contact = {
        ...(personalData.contact as Record<string, unknown>),
        firstName: personalSettings.firstName,
        lastName: personalSettings.lastName,
        phone: personalSettings.phone,
        address: personalSettings.address,
        emergencyContact: personalSettings.emergencyContact,
      };
      personalData.financial = {
        ...(personalData.financial as Record<string, unknown>),
        bankDetails: personalSettings.bankDetails,
        niNumber: personalSettings.niNumber,
        taxCode: personalSettings.taxCode,
      };
    }

    // 3. Company associations (users/{uid}/companies)
    const companiesRef = ref(db, `users/${userId}/companies`);
    const companiesSnapshot = await get(companiesRef);
    const companies: Record<string, unknown>[] = [];
    if (companiesSnapshot.exists()) {
      companiesSnapshot.forEach((child) => {
        companies.push({
          companyId: child.key,
          ...(child.val() as Record<string, unknown>),
        });
      });
    }
    personalData.employment = {
      ...(personalData.employment as Record<string, unknown>),
      companies,
    };

    // 4. Employee data (if user is an employee)
    // Search across all companies/sites for employee with matching userId
    const companiesList = companies.map((c: any) => c.companyId || c.companyID).filter(Boolean);
    const employeeRecords: Record<string, unknown>[] = [];
    
    for (const compId of companiesList) {
      try {
        // Check company-level employees
        const companyEmployeesRef = ref(db, `companies/${compId}/sites`);
        const sitesSnapshot = await get(companyEmployeesRef);
        
        if (sitesSnapshot.exists()) {
          sitesSnapshot.forEach((siteChild) => {
            const siteId = siteChild.key;
            if (!siteId) return;
            
            const employeesRef = ref(db, `companies/${compId}/sites/${siteId}/data/hr/employees`);
            get(employeesRef).then(async (empSnapshot) => {
              if (!empSnapshot.exists()) return;
              const promises: Promise<void>[] = [];
              empSnapshot.forEach((empChild) => {
                const employee = empChild.val() as Record<string, unknown>;
                if (employee.userId !== userId) return;
                const run = async () => {
                  let empData: Record<string, unknown> = { id: empChild.key, ...employee };
                  if (sensitiveDataService.isInitialized()) {
                    try {
                      empData = (await sensitiveDataService.decryptEmployeeData(empData)) as Record<string, unknown>;
                    } catch (err) {
                      console.warn('[DSARService] Failed to decrypt employee data:', err);
                    }
                  }
                  const { id: _empId, ...rest } = empData;
                  employeeRecords.push({ id: empChild.key ?? '', companyId: compId, siteId, ...rest } as Record<string, unknown>);
                };
                promises.push(run());
              });
              await Promise.all(promises);
            }).catch(() => {});
          });
        }
      } catch (err) {
        console.warn(`[DSARService] Error fetching employees for company ${compId}:`, err);
      }
    }
    
    if (employeeRecords.length > 0) {
      personalData.employment = {
        ...(personalData.employment as Record<string, unknown>),
        employeeRecords,
      };
    }

    // 5. Payroll records (for each employee)
    const payrollRecords: Record<string, unknown>[] = [];
    for (const emp of employeeRecords) {
      const empId = (emp.id || emp.employeeId) as string;
      const compId = emp.companyId as string;
      const siteId = emp.siteId as string;
      
      if (!empId || !compId || !siteId) continue;
      
      try {
        const payrollRef = ref(db, `companies/${compId}/sites/${siteId}/data/hr/payrolls`);
        const payrollSnapshot = await get(payrollRef);
        
        if (payrollSnapshot.exists()) {
          payrollSnapshot.forEach((payrollChild) => {
            const payroll = payrollChild.val() as Record<string, unknown>;
            if (payroll.employeeId === empId) {
              payrollRecords.push({
                id: payrollChild.key ?? '',
                ...payroll,
              } as Record<string, unknown>);
            }
          });
        }
      } catch (err) {
        console.warn(`[DSARService] Error fetching payroll for employee ${empId}:`, err);
      }
    }
    
    if (payrollRecords.length > 0) {
      personalData.financial = {
        ...(personalData.financial as Record<string, unknown>),
        payrollRecords,
      };
    }

    // 6. Consent records
    try {
      const consents = await consentService.exportUserConsents(userId, companyId);
      personalData.consent = {
        consents: consents.consents,
        exportedAt: consents.exportedAt,
      };
    } catch (err) {
      console.warn('[DSARService] Error fetching consent records:', err);
    }

    // 7. Audit logs (user activity)
    try {
      const auditLogs = await auditTrailService.getUserActivityLogs(companyId, userId, {
        limit: 1000, // Last 1000 activities
      });
      personalData.audit = {
        activityLogs: auditLogs,
        totalCount: auditLogs.length,
      };
    } catch (err) {
      console.warn('[DSARService] Error fetching audit logs:', err);
    }

    const responseData: DSARResponseData = {
      personalData,
      processingPurposes: [
        'Payroll processing',
        'Tax calculation and reporting',
        'HMRC RTI submissions',
        'Pension administration',
        'Employment contract fulfilment',
        'User account management',
        'System access and authentication',
      ],
      dataCategories: [
        'Identity data',
        'Contact data',
        'Employment data',
        'Financial data',
        'Technical data',
        'Consent records',
        'Audit trail data',
      ],
      recipients: [
        'HM Revenue & Customs (HMRC)',
        'Pension providers',
        'Cloud service providers (Firebase/Google Cloud)',
      ],
      retentionPeriods: {
        'Payroll records': '6 years after tax year end',
        'HMRC submissions': '6 years',
        'Employment contracts': '6 years after employment ends',
        'Audit logs': '7 years',
        'Consent records': '6 years',
        'User account data': 'Until account deletion or anonymization',
      },
      dataSource: 'Collected directly from you and your employer',
      automatedDecisionMaking: false,
      transfersToThirdCountries: true,
      safeguards: 'Standard Contractual Clauses (SCCs) and adequacy decisions',
      exportedAt: Date.now(),
      exportFormat: format,
    };

    // Log the export
    await auditTrailService.log('data_export', userId, companyId, {
      resourceType: 'dsar',
      description: `Data export generated for DSAR request (format: ${format})`,
      metadata: {
        format,
        dataCategories: responseData.dataCategories,
      },
    });

    return responseData;
  }

  /**
   * Add audit log entry for DSAR
   */
  private async addAuditLog(
    companyId: string,
    dsarId: string,
    userId: string,
    description: string
  ): Promise<void> {
    const auditLog = await auditTrailService.log('data_view', userId, companyId, {
      resourceType: 'dsar',
      resourceId: dsarId,
      description,
    });

    // Add audit log ID to DSAR record
    const dsarRef = ref(db, `${this.basePath}/${companyId}/${dsarId}`);
    const snapshot = await get(dsarRef);

    if (snapshot.exists()) {
      const record = snapshot.val() as DSARRecord;
      await update(dsarRef, {
        auditLogIds: [...(record.auditLogIds || []), auditLog.id],
      });
    }
  }

  /**
   * Mask email address
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***@***.***';
    const maskedLocal = local.length > 2 ? local[0] + '***' + local[local.length - 1] : '***';
    return `${maskedLocal}@${domain}`;
  }
}

// Export singleton instance
export const dsarService = new DSARService();

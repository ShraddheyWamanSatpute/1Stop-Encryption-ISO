/**
 * GDPR Compliance Types
 *
 * Types for UK GDPR and HMRC compliance features including:
 * - Consent management
 * - Data breach incident tracking
 * - Audit logging
 * - Data retention policies
 *
 * Reference: ICO GDPR Guidance, HMRC API Requirements
 */

/**
 * Lawful Basis for Processing (UK GDPR Article 6)
 */
export type LawfulBasis =
  | 'consent'           // Individual has given clear consent
  | 'contract'          // Processing necessary for contract
  | 'legal_obligation'  // Processing necessary for legal obligation
  | 'vital_interests'   // Protect someone's life
  | 'public_task'       // Perform an official task
  | 'legitimate_interests'; // Legitimate business interests

/**
 * Consent Record
 * Tracks individual consent for data processing
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  companyId: string;
  purpose: string;           // What the data will be used for
  lawfulBasis: LawfulBasis;
  consentGiven: boolean;
  consentTimestamp: number;
  withdrawnTimestamp?: number;
  expiresAt?: number;        // Optional expiry
  method: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  version: string;           // Version of privacy policy agreed to
  ipAddress?: string;        // Masked for compliance
  userAgent?: string;        // For audit purposes
  metadata?: Record<string, unknown>;
}

/**
 * Consent Purpose Categories
 */
export type ConsentPurpose =
  | 'hmrc_submission'       // Submitting data to HMRC
  | 'payroll_processing'    // Processing payroll data
  | 'pension_reporting'     // Pension auto-enrolment reporting
  | 'employee_records'      // Maintaining employee records
  | 'tax_calculations'      // Tax and NI calculations
  | 'marketing_communications' // Marketing emails
  | 'analytics'             // Usage analytics
  | 'third_party_sharing'   // Sharing with third parties
  | 'data_export';          // Exporting data

/**
 * Data Breach Severity Levels
 */
export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Data Breach Status
 */
export type BreachStatus =
  | 'detected'       // Breach has been detected
  | 'investigating'  // Under investigation
  | 'contained'      // Breach has been contained
  | 'notified_ico'   // ICO has been notified (within 72 hours)
  | 'notified_users' // Affected users have been notified
  | 'resolved'       // Breach fully resolved
  | 'closed';        // Case closed

/**
 * Data Breach Incident Record
 * Must be documented per ICO requirements
 */
export interface DataBreachIncident {
  id: string;
  companyId: string;
  detectedAt: number;
  detectedBy: string;         // User ID who detected
  reportedAt?: number;        // When reported internally
  reportedBy?: string;

  // Breach Details
  title: string;
  description: string;
  severity: BreachSeverity;
  status: BreachStatus;

  // Data Categories Affected
  dataCategories: string[];   // e.g., ['personal_data', 'financial', 'payroll']
  estimatedRecordsAffected: number;
  actualRecordsAffected?: number;

  // Impact Assessment
  riskToIndividuals: 'unlikely' | 'possible' | 'likely' | 'highly_likely';
  potentialConsequences: string[];

  // ICO Notification (required within 72 hours for notifiable breaches)
  requiresICONotification: boolean;
  icoNotifiedAt?: number;
  icoReferenceNumber?: string;
  icoNotifiedBy?: string;

  // HMRC Notification (required within 72 hours)
  requiresHMRCNotification: boolean;
  hmrcNotifiedAt?: number;
  hmrcReferenceNumber?: string;

  // User Notification
  requiresUserNotification: boolean;
  usersNotifiedAt?: number;
  notificationMethod?: string;

  // Resolution
  rootCause?: string;
  remediationActions: string[];
  preventiveMeasures: string[];
  resolvedAt?: number;
  resolvedBy?: string;

  // Documentation
  attachments?: string[];     // URLs to supporting documents
  auditTrailIds?: string[];   // Related audit log entries

  // Metadata
  createdAt: number;
  updatedAt?: number;
  lastReviewedAt?: number;
  lastReviewedBy?: string;
}

/**
 * Audit Action Types
 */
export type AuditAction =
  // Data Access
  | 'data_view'
  | 'data_export'
  | 'data_download'
  // Data Modification
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  // HMRC Submissions
  | 'hmrc_fps_submit'
  | 'hmrc_eps_submit'
  | 'hmrc_eyu_submit'
  | 'hmrc_auth_initiate'
  | 'hmrc_auth_complete'
  | 'hmrc_auth_refresh'
  // Consent
  | 'consent_given'
  | 'consent_withdrawn'
  // Security
  | 'login_success'
  | 'login_failure'
  | 'password_change'
  | 'mfa_enable'
  | 'mfa_disable'
  // Admin
  | 'user_invite'
  | 'user_remove'
  | 'role_change'
  | 'permission_change'
  | 'settings_change';

/**
 * Audit Log Entry
 * Tracks all sensitive data operations for compliance
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: AuditAction;

  // Actor
  userId: string;
  userEmail?: string;        // Partially masked
  userRole?: string;

  // Context
  companyId: string;
  siteId?: string;
  subsiteId?: string;

  // Resource
  resourceType: string;      // e.g., 'employee', 'payroll', 'hmrc_submission'
  resourceId?: string;
  resourceName?: string;     // Non-PII identifier

  // Details
  description: string;
  previousValue?: string;    // Encrypted or hashed if sensitive
  newValue?: string;         // Encrypted or hashed if sensitive
  metadata?: Record<string, unknown>;

  // Request Info
  ipAddress?: string;        // Masked (e.g., 192.168.xxx.xxx)
  userAgent?: string;        // Truncated
  requestId?: string;        // For tracing

  // Outcome
  success: boolean;
  errorCode?: string;
  errorMessage?: string;

  // Retention
  retentionPeriod: number;   // Days to keep (default 6 years for HMRC)
  expiresAt?: number;
}

/**
 * Data Retention Policy
 */
export interface DataRetentionPolicy {
  id: string;
  companyId: string;
  dataCategory: string;
  retentionPeriodYears: number;
  legalBasis: string;
  description: string;
  autoArchive: boolean;
  autoDelete: boolean;
  reviewFrequencyMonths: number;
  lastReviewedAt?: number;
  nextReviewAt?: number;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Data Subject Access Request (DSAR)
 */
export interface DataSubjectAccessRequest {
  id: string;
  companyId: string;
  requesterId: string;       // User making the request
  requesterEmail: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: number;
  dueDate: number;           // 30 days from request (1 month)
  completedAt?: number;
  handledBy?: string;
  notes?: string;
  attachments?: string[];
  createdAt: number;
  updatedAt?: number;
}

/**
 * Privacy Impact Assessment (PIA)
 */
export interface PrivacyImpactAssessment {
  id: string;
  companyId: string;
  projectName: string;
  description: string;
  dataProcessingPurpose: string;
  dataCategories: string[];
  dataSubjects: string[];
  lawfulBasis: LawfulBasis;
  riskLevel: 'low' | 'medium' | 'high';
  mitigationMeasures: string[];
  reviewDate?: number;
  approvedBy?: string;
  approvedAt?: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  createdAt: number;
  updatedAt?: number;
}

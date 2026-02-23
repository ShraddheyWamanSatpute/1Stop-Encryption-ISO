/**
 * GDPR Compliance Services Index
 *
 * UK GDPR and HMRC compliant services for:
 * - Consent management
 * - Data breach incident tracking
 * - Breach response plan management
 * - Breach notification templates
 * - Audit trail logging
 * - Privacy policy management
 * - Data subject access requests (DSAR)
 * - Data retention policy management
 * - Security incident reporting
 * - Lawful basis documentation (Article 6)
 * - Special category data processing (Article 9)
 *
 * References:
 * - ICO GDPR Guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/
 * - ICO Lawful Basis Guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/
 * - ICO Personal Data Breaches: https://ico.org.uk/for-organisations/report-a-breach/
 * - HMRC API Requirements: https://developer.service.hmrc.gov.uk/
 * - ICO Data Subject Access Requests: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/right-of-access/
 */

// Core GDPR Services
export { ConsentService, consentService } from './ConsentService';
export { DataBreachService, dataBreachService } from './DataBreachService';
export { AuditTrailService, auditTrailService } from './AuditTrailService';

// Breach Response and Notification Services
export {
  BreachResponsePlanService,
  breachResponsePlanService,
  DEFAULT_RESPONSE_PHASES,
  DEFAULT_ESCALATION_MATRIX,
} from './BreachResponsePlanService';
export type {
  BreachResponseRole,
  ResponsePhase,
  BreachResponseTeamMember,
  ResponsePhaseDetails,
  BreachResponsePlan,
  BreachResponseTask,
  BreachTrainingRecord,
} from './BreachResponsePlanService';

export {
  BreachNotificationService,
  breachNotificationService,
} from './BreachNotificationService';
export type {
  ICONotificationContent,
  IndividualNotificationContent,
  HMRCNotificationContent,
} from './BreachNotificationService';

// Lawful Basis Services (Article 6)
export {
  LawfulBasisService,
  lawfulBasisService,
  STANDARD_LAWFUL_BASIS_MAPPINGS,
} from './LawfulBasisService';
export type {
  ProcessingActivity,
  DataCategoryType,
  LawfulBasisRecord,
} from './LawfulBasisService';

// Special Category Data Services (Article 9 & 10)
export {
  SpecialCategoryDataService,
  specialCategoryDataService,
  PAYROLL_SPECIAL_CATEGORY_CONDITIONS,
} from './SpecialCategoryDataService';
export type {
  SpecialCategoryType,
  Article9Condition,
  Schedule1Condition,
  SpecialCategoryProcessingRecord,
} from './SpecialCategoryDataService';

// Privacy Policy
export { PrivacyPolicyService, privacyPolicyService } from './PrivacyPolicy';
export type { PrivacyPolicySection, PrivacyPolicyData } from './PrivacyPolicy';

// Data Subject Access Requests (DSAR)
export { DSARService, dsarService } from './DSARService';
export type { DSARRequestType, DSARStatus, DSARRecord, DSARResponseData } from './DSARService';

// Data Retention
export { DataRetentionService, dataRetentionService, DEFAULT_RETENTION_POLICIES } from './DataRetentionService';
export type {
  DataCategory,
  RetentionAction,
  RetentionScheduleRecord,
  RetentionTrackedRecord,
  RetentionReviewTask,
} from './DataRetentionService';

// User Account Deletion (GDPR Art. 17)
export { UserAccountDeletionService, userAccountDeletionService } from './UserAccountDeletionService';
export type {
  UserDeletionStatus,
  AnonymizationResult,
} from './UserAccountDeletionService';

// Consent Enforcement
export {
  isMarketingEmail,
  verifyMarketingConsent,
  verifyAnalyticsConsent,
  verifyConsentForPurpose,
} from './consentEnforcement';

// Security Incident Reporting
export { SecurityIncidentService, securityIncidentService } from './SecurityIncidentService';
export type {
  SecurityIncidentType,
  IncidentSeverity,
  IncidentStatus,
  SecurityIncidentReport,
  IncidentResponseAction,
} from './SecurityIncidentService';

// Core Types
export type {
  // Consent
  ConsentRecord,
  ConsentPurpose,
  LawfulBasis,
  // Data Breach
  DataBreachIncident,
  BreachSeverity,
  BreachStatus,
  // Audit
  AuditLogEntry,
  AuditAction,
  // Retention
  DataRetentionPolicy,
  // DSAR
  DataSubjectAccessRequest,
  // Privacy Impact
  PrivacyImpactAssessment,
} from './types';

/**
 * Testing Services Index
 *
 * Development and testing services for HMRC compliance:
 * - HMRC API monitoring and breaking change detection
 * - Automated sandbox testing (weekly)
 * - Security/penetration testing tracking
 * - Accessibility (WCAG 2.1 AA) compliance
 *
 * References:
 * - HMRC Developer Hub: https://developer.service.hmrc.gov.uk/
 * - WCAG 2.1: https://www.w3.org/TR/WCAG21/
 * - NCSC Testing Guidance: https://www.ncsc.gov.uk/guidance/penetration-testing
 */

// HMRC API Monitoring
export {
  HMRCAPIMonitoringService,
  hmrcAPIMonitoringService,
  HMRC_PAYROLL_APIS,
} from './HMRCAPIMonitoringService';
export type {
  APIStatus,
  ChangeType,
  HMRCAPIDefinition,
  APIChangeNotice,
  APIHealthCheckResult,
  MonitoringAlert,
} from './HMRCAPIMonitoringService';

// Sandbox Testing
export {
  SandboxTestingService,
  sandboxTestingService,
  STANDARD_HMRC_TEST_CASES,
} from './SandboxTestingService';
export type {
  TestType,
  TestStatus,
  TestFrequency,
  TestCase,
  TestRunResult,
  TestRunSummary,
  TestSchedule,
} from './SandboxTestingService';

// Security/Penetration Testing
export {
  SecurityTestingService,
  securityTestingService,
  OWASP_TOP_10_2021,
} from './SecurityTestingService';
export type {
  PenetrationTestType,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  PenetrationTestRecord,
  VulnerabilityFinding,
  SecurityAssessmentSchedule,
} from './SecurityTestingService';

// Accessibility Compliance
export {
  AccessibilityComplianceService,
  accessibilityComplianceService,
  WCAG_21_AA_CRITERIA,
} from './AccessibilityComplianceService';
export type {
  WCAGLevel,
  WCAGPrinciple,
  AccessibilityIssueSeverity,
  AccessibilityIssueStatus,
  AccessibilityAuditRecord,
  AccessibilityIssue,
  AccessibilityStatement,
} from './AccessibilityComplianceService';

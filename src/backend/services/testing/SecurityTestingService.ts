/**
 * Security Testing Service
 *
 * Tracks penetration testing, security assessments, and vulnerability management.
 *
 * HMRC Requirements:
 * - Periodic penetration testing
 * - Vulnerability assessment
 * - Security audit trails
 * - Remediation tracking
 *
 * Reference:
 * - NCSC Penetration Testing Guidance
 * - OWASP Testing Guide
 * - CHECK Scheme (NCSC approved)
 */

import { ref, push, set, get, update, query, orderByChild } from 'firebase/database';
import { db } from '../Firebase';

/**
 * Test Types
 */
export type PenetrationTestType =
  | 'external_network'      // External network penetration test
  | 'internal_network'      // Internal network penetration test
  | 'web_application'       // Web application security test
  | 'api_security'          // API security testing
  | 'mobile_application'    // Mobile app security
  | 'social_engineering'    // Phishing/social engineering
  | 'physical_security'     // Physical access testing
  | 'wireless_security'     // WiFi/wireless testing
  | 'cloud_security';       // Cloud infrastructure testing

/**
 * Vulnerability Severity (CVSS-based)
 */
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

/**
 * Vulnerability Status
 */
export type VulnerabilityStatus =
  | 'open'              // Newly identified
  | 'in_progress'       // Being remediated
  | 'remediated'        // Fix applied
  | 'verified'          // Fix verified
  | 'accepted_risk'     // Risk accepted (documented)
  | 'false_positive';   // Not a real vulnerability

/**
 * Penetration Test Record
 */
export interface PenetrationTestRecord {
  id: string;
  companyId: string;

  // Test details
  testType: PenetrationTestType;
  scope: string;
  methodology: string; // e.g., "OWASP Testing Guide v4.2", "PTES"

  // Provider
  testingProvider: string;
  leadTester: string;
  checkCertified: boolean; // NCSC CHECK scheme certified

  // Timeline
  plannedStartDate: number;
  plannedEndDate: number;
  actualStartDate?: number;
  actualEndDate?: number;

  // Status
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';

  // Results summary
  executiveSummary?: string;
  totalVulnerabilities?: number;
  criticalCount?: number;
  highCount?: number;
  mediumCount?: number;
  lowCount?: number;
  informationalCount?: number;

  // Deliverables
  reportRef?: string; // Reference to report document
  retestRequired: boolean;
  retestDate?: number;

  // Sign-off
  signedOffBy?: string;
  signedOffAt?: number;

  // Metadata
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
}

/**
 * Vulnerability Finding
 */
export interface VulnerabilityFinding {
  id: string;
  companyId: string;
  penTestId: string;

  // Identification
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  cvssScore?: number;
  cvssVector?: string;
  cweId?: string; // Common Weakness Enumeration
  cveId?: string; // Common Vulnerabilities and Exposures

  // Location
  affectedSystem: string;
  affectedComponent?: string;
  affectedUrl?: string;

  // Technical details
  proofOfConcept?: string;
  stepsToReproduce?: string[];
  impact: string;

  // Remediation
  status: VulnerabilityStatus;
  recommendation: string;
  remediationPriority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  remediationDeadline?: number;
  remediationNotes?: string;
  remediatedAt?: number;
  remediatedBy?: string;

  // Verification
  verifiedAt?: number;
  verifiedBy?: string;
  verificationNotes?: string;

  // Risk acceptance (if applicable)
  riskAcceptedBy?: string;
  riskAcceptedAt?: number;
  riskAcceptanceJustification?: string;

  // Metadata
  discoveredAt: number;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Security Assessment Schedule
 */
export interface SecurityAssessmentSchedule {
  id: string;
  companyId: string;

  // Assessment type
  assessmentType: PenetrationTestType;
  frequency: 'quarterly' | 'semi_annual' | 'annual' | 'biennial';

  // Provider
  preferredProvider?: string;
  checkRequired: boolean;

  // Schedule
  lastAssessmentDate?: number;
  nextAssessmentDate: number;

  // Budget
  estimatedCost?: number;

  // Status
  enabled: boolean;

  // Metadata
  createdAt: number;
  updatedAt?: number;
}

/**
 * OWASP Top 10 Categories (2021)
 */
export const OWASP_TOP_10_2021 = [
  { id: 'A01', name: 'Broken Access Control', cwe: ['CWE-22', 'CWE-23', 'CWE-35'] },
  { id: 'A02', name: 'Cryptographic Failures', cwe: ['CWE-259', 'CWE-327', 'CWE-331'] },
  { id: 'A03', name: 'Injection', cwe: ['CWE-79', 'CWE-89', 'CWE-73'] },
  { id: 'A04', name: 'Insecure Design', cwe: ['CWE-209', 'CWE-256', 'CWE-501'] },
  { id: 'A05', name: 'Security Misconfiguration', cwe: ['CWE-16', 'CWE-611'] },
  { id: 'A06', name: 'Vulnerable and Outdated Components', cwe: ['CWE-1104'] },
  { id: 'A07', name: 'Identification and Authentication Failures', cwe: ['CWE-287', 'CWE-384'] },
  { id: 'A08', name: 'Software and Data Integrity Failures', cwe: ['CWE-829', 'CWE-494'] },
  { id: 'A09', name: 'Security Logging and Monitoring Failures', cwe: ['CWE-778'] },
  { id: 'A10', name: 'Server-Side Request Forgery (SSRF)', cwe: ['CWE-918'] },
];

/**
 * Security Testing Service
 */
export class SecurityTestingService {
  private penTestsPath: string;
  private vulnerabilitiesPath: string;
  private schedulesPath: string;

  constructor() {
    this.penTestsPath = 'security_testing/pen_tests';
    this.vulnerabilitiesPath = 'security_testing/vulnerabilities';
    this.schedulesPath = 'security_testing/schedules';
  }

  /**
   * Schedule a penetration test
   */
  async schedulePenTest(
    companyId: string,
    userId: string,
    test: Omit<PenetrationTestRecord, 'id' | 'companyId' | 'createdAt' | 'createdBy' | 'status'>
  ): Promise<PenetrationTestRecord> {
    const testRef = push(ref(db, `${this.penTestsPath}/${companyId}`));
    const now = Date.now();

    const record: PenetrationTestRecord = {
      ...test,
      id: testRef.key!,
      companyId,
      status: 'planned',
      createdAt: now,
      createdBy: userId,
    };

    await set(testRef, record);
    return record;
  }

  /**
   * Update penetration test status
   */
  async updatePenTestStatus(
    companyId: string,
    testId: string,
    status: PenetrationTestRecord['status'],
    updates?: Partial<PenetrationTestRecord>
  ): Promise<void> {
    const testRef = ref(db, `${this.penTestsPath}/${companyId}/${testId}`);
    const now = Date.now();

    const updateData: Partial<PenetrationTestRecord> = {
      ...updates,
      status,
      updatedAt: now,
    };

    // Set start/end dates based on status
    if (status === 'in_progress' && !updates?.actualStartDate) {
      updateData.actualStartDate = now;
    }
    if (status === 'completed' && !updates?.actualEndDate) {
      updateData.actualEndDate = now;
    }

    await update(testRef, updateData);
  }

  /**
   * Get all penetration tests
   */
  async getPenTests(companyId: string): Promise<PenetrationTestRecord[]> {
    const testsRef = ref(db, `${this.penTestsPath}/${companyId}`);
    const snapshot = await get(testsRef);

    if (!snapshot.exists()) return [];

    const tests: PenetrationTestRecord[] = [];
    snapshot.forEach(child => {
      tests.push(child.val() as PenetrationTestRecord);
    });

    return tests.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Record vulnerability finding
   */
  async recordVulnerability(
    companyId: string,
    penTestId: string,
    vulnerability: Omit<VulnerabilityFinding, 'id' | 'companyId' | 'penTestId' | 'createdAt' | 'discoveredAt'>
  ): Promise<VulnerabilityFinding> {
    const vulnRef = push(ref(db, `${this.vulnerabilitiesPath}/${companyId}`));
    const now = Date.now();

    const finding: VulnerabilityFinding = {
      ...vulnerability,
      id: vulnRef.key!,
      companyId,
      penTestId,
      discoveredAt: now,
      createdAt: now,
    };

    await set(vulnRef, finding);

    // Update pen test counts
    await this.updatePenTestVulnerabilityCounts(companyId, penTestId);

    return finding;
  }

  /**
   * Update pen test vulnerability counts
   */
  private async updatePenTestVulnerabilityCounts(
    companyId: string,
    penTestId: string
  ): Promise<void> {
    const vulnerabilities = await this.getVulnerabilitiesByPenTest(companyId, penTestId);

    const counts = {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
      highCount: vulnerabilities.filter(v => v.severity === 'high').length,
      mediumCount: vulnerabilities.filter(v => v.severity === 'medium').length,
      lowCount: vulnerabilities.filter(v => v.severity === 'low').length,
      informationalCount: vulnerabilities.filter(v => v.severity === 'informational').length,
    };

    const testRef = ref(db, `${this.penTestsPath}/${companyId}/${penTestId}`);
    await update(testRef, counts);
  }

  /**
   * Get vulnerabilities for a pen test
   */
  async getVulnerabilitiesByPenTest(
    companyId: string,
    penTestId: string
  ): Promise<VulnerabilityFinding[]> {
    const vulnsRef = ref(db, `${this.vulnerabilitiesPath}/${companyId}`);
    const snapshot = await get(vulnsRef);

    if (!snapshot.exists()) return [];

    const vulnerabilities: VulnerabilityFinding[] = [];
    snapshot.forEach(child => {
      const vuln = child.val() as VulnerabilityFinding;
      if (vuln.penTestId === penTestId) {
        vulnerabilities.push(vuln);
      }
    });

    return vulnerabilities;
  }

  /**
   * Get all open vulnerabilities
   */
  async getOpenVulnerabilities(companyId: string): Promise<VulnerabilityFinding[]> {
    const vulnsRef = ref(db, `${this.vulnerabilitiesPath}/${companyId}`);
    const snapshot = await get(vulnsRef);

    if (!snapshot.exists()) return [];

    const vulnerabilities: VulnerabilityFinding[] = [];
    snapshot.forEach(child => {
      const vuln = child.val() as VulnerabilityFinding;
      if (['open', 'in_progress'].includes(vuln.status)) {
        vulnerabilities.push(vuln);
      }
    });

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, informational: 4 };
    return vulnerabilities.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Get overdue vulnerabilities
   */
  async getOverdueVulnerabilities(companyId: string): Promise<VulnerabilityFinding[]> {
    const openVulns = await this.getOpenVulnerabilities(companyId);
    const now = Date.now();

    return openVulns.filter(
      v => v.remediationDeadline && v.remediationDeadline < now
    );
  }

  /**
   * Update vulnerability status
   */
  async updateVulnerabilityStatus(
    companyId: string,
    vulnId: string,
    userId: string,
    status: VulnerabilityStatus,
    notes?: string
  ): Promise<void> {
    const vulnRef = ref(db, `${this.vulnerabilitiesPath}/${companyId}/${vulnId}`);
    const now = Date.now();

    const updates: Partial<VulnerabilityFinding> = {
      status,
      updatedAt: now,
    };

    if (status === 'remediated') {
      updates.remediatedAt = now;
      updates.remediatedBy = userId;
      updates.remediationNotes = notes;
    } else if (status === 'verified') {
      updates.verifiedAt = now;
      updates.verifiedBy = userId;
      updates.verificationNotes = notes;
    } else if (status === 'accepted_risk') {
      updates.riskAcceptedAt = now;
      updates.riskAcceptedBy = userId;
      updates.riskAcceptanceJustification = notes;
    }

    await update(vulnRef, updates);
  }

  /**
   * Create assessment schedule
   */
  async createAssessmentSchedule(
    companyId: string,
    schedule: Omit<SecurityAssessmentSchedule, 'id' | 'companyId' | 'createdAt'>
  ): Promise<SecurityAssessmentSchedule> {
    const scheduleRef = push(ref(db, `${this.schedulesPath}/${companyId}`));
    const now = Date.now();

    const newSchedule: SecurityAssessmentSchedule = {
      ...schedule,
      id: scheduleRef.key!,
      companyId,
      createdAt: now,
    };

    await set(scheduleRef, newSchedule);
    return newSchedule;
  }

  /**
   * Get assessment schedules
   */
  async getAssessmentSchedules(companyId: string): Promise<SecurityAssessmentSchedule[]> {
    const schedulesRef = ref(db, `${this.schedulesPath}/${companyId}`);
    const snapshot = await get(schedulesRef);

    if (!snapshot.exists()) return [];

    const schedules: SecurityAssessmentSchedule[] = [];
    snapshot.forEach(child => {
      schedules.push(child.val() as SecurityAssessmentSchedule);
    });

    return schedules;
  }

  /**
   * Get upcoming assessments
   */
  async getUpcomingAssessments(
    companyId: string,
    daysAhead: number = 90
  ): Promise<SecurityAssessmentSchedule[]> {
    const schedules = await this.getAssessmentSchedules(companyId);
    const now = Date.now();
    const cutoff = now + (daysAhead * 24 * 60 * 60 * 1000);

    return schedules.filter(
      s => s.enabled && s.nextAssessmentDate <= cutoff
    ).sort((a, b) => a.nextAssessmentDate - b.nextAssessmentDate);
  }

  /**
   * Initialize default assessment schedules
   */
  async initializeDefaultSchedules(companyId: string): Promise<SecurityAssessmentSchedule[]> {
    const now = Date.now();
    const year = 365 * 24 * 60 * 60 * 1000;

    const defaultSchedules: Omit<SecurityAssessmentSchedule, 'id' | 'companyId' | 'createdAt'>[] = [
      {
        assessmentType: 'web_application',
        frequency: 'annual',
        checkRequired: true,
        nextAssessmentDate: now + year,
        enabled: true,
      },
      {
        assessmentType: 'api_security',
        frequency: 'annual',
        checkRequired: true,
        nextAssessmentDate: now + year,
        enabled: true,
      },
      {
        assessmentType: 'external_network',
        frequency: 'annual',
        checkRequired: true,
        nextAssessmentDate: now + year,
        enabled: true,
      },
    ];

    const schedules: SecurityAssessmentSchedule[] = [];
    for (const schedule of defaultSchedules) {
      const created = await this.createAssessmentSchedule(companyId, schedule);
      schedules.push(created);
    }

    return schedules;
  }

  /**
   * Generate security testing report
   */
  async generateSecurityReport(companyId: string): Promise<{
    generatedAt: number;
    penTests: {
      total: number;
      completed: number;
      planned: number;
      lastCompletedDate?: number;
    };
    vulnerabilities: {
      total: number;
      open: number;
      critical: number;
      high: number;
      overdue: number;
      averageRemediationDays: number;
    };
    upcomingAssessments: SecurityAssessmentSchedule[];
    owaspCoverage: { category: string; tested: boolean }[];
  }> {
    const [penTests, allVulns, openVulns, overdueVulns, upcomingAssessments] = await Promise.all([
      this.getPenTests(companyId),
      this.getVulnerabilitiesByPenTest(companyId, ''), // Get all
      this.getOpenVulnerabilities(companyId),
      this.getOverdueVulnerabilities(companyId),
      this.getUpcomingAssessments(companyId),
    ]);

    // Get all vulnerabilities
    const vulnsRef = ref(db, `${this.vulnerabilitiesPath}/${companyId}`);
    const vulnsSnapshot = await get(vulnsRef);
    const vulnerabilities: VulnerabilityFinding[] = [];
    if (vulnsSnapshot.exists()) {
      vulnsSnapshot.forEach(child => {
        vulnerabilities.push(child.val() as VulnerabilityFinding);
      });
    }

    // Calculate average remediation time
    const remediatedVulns = vulnerabilities.filter(v => v.status === 'remediated' && v.remediatedAt);
    const avgRemediationDays = remediatedVulns.length > 0
      ? remediatedVulns.reduce((sum, v) => {
          const days = (v.remediatedAt! - v.discoveredAt) / (24 * 60 * 60 * 1000);
          return sum + days;
        }, 0) / remediatedVulns.length
      : 0;

    const completedTests = penTests.filter(t => t.status === 'completed');
    const lastCompleted = completedTests.sort((a, b) =>
      (b.actualEndDate || 0) - (a.actualEndDate || 0)
    )[0];

    // OWASP coverage - simplified check
    const owaspCoverage = OWASP_TOP_10_2021.map(category => ({
      category: `${category.id}: ${category.name}`,
      tested: penTests.some(t => t.status === 'completed' && t.testType === 'web_application'),
    }));

    return {
      generatedAt: Date.now(),
      penTests: {
        total: penTests.length,
        completed: completedTests.length,
        planned: penTests.filter(t => t.status === 'planned').length,
        lastCompletedDate: lastCompleted?.actualEndDate,
      },
      vulnerabilities: {
        total: vulnerabilities.length,
        open: openVulns.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        overdue: overdueVulns.length,
        averageRemediationDays: Math.round(avgRemediationDays),
      },
      upcomingAssessments,
      owaspCoverage,
    };
  }
}

// Export singleton instance
export const securityTestingService = new SecurityTestingService();

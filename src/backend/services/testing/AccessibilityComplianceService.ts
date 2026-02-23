/**
 * Accessibility Compliance Service
 *
 * Tracks WCAG 2.1 AA compliance for UK government service standards.
 *
 * Requirements:
 * - Public sector websites must meet WCAG 2.1 AA (UK law)
 * - HMRC APIs require accessible front-end implementations
 * - Accessibility statements required
 *
 * References:
 * - WCAG 2.1: https://www.w3.org/TR/WCAG21/
 * - UK Accessibility Regulations: https://www.legislation.gov.uk/uksi/2018/952
 * - GDS Accessibility Requirements: https://www.gov.uk/service-manual/helping-people-to-use-your-service
 */

import { ref, push, set, get, update } from 'firebase/database';
import { db } from '../Firebase';

/**
 * WCAG Conformance Levels
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * WCAG Principles
 */
export type WCAGPrinciple = 'perceivable' | 'operable' | 'understandable' | 'robust';

/**
 * Issue Severity
 */
export type AccessibilityIssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * Issue Status
 */
export type AccessibilityIssueStatus =
  | 'open'
  | 'in_progress'
  | 'fixed'
  | 'verified'
  | 'wont_fix'
  | 'false_positive';

/**
 * WCAG 2.1 Success Criteria (AA Level)
 */
export const WCAG_21_AA_CRITERIA = [
  // Perceivable
  { id: '1.1.1', name: 'Non-text Content', level: 'A', principle: 'perceivable' },
  { id: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A', principle: 'perceivable' },
  { id: '1.2.2', name: 'Captions (Prerecorded)', level: 'A', principle: 'perceivable' },
  { id: '1.2.3', name: 'Audio Description or Media Alternative', level: 'A', principle: 'perceivable' },
  { id: '1.2.4', name: 'Captions (Live)', level: 'AA', principle: 'perceivable' },
  { id: '1.2.5', name: 'Audio Description (Prerecorded)', level: 'AA', principle: 'perceivable' },
  { id: '1.3.1', name: 'Info and Relationships', level: 'A', principle: 'perceivable' },
  { id: '1.3.2', name: 'Meaningful Sequence', level: 'A', principle: 'perceivable' },
  { id: '1.3.3', name: 'Sensory Characteristics', level: 'A', principle: 'perceivable' },
  { id: '1.3.4', name: 'Orientation', level: 'AA', principle: 'perceivable' },
  { id: '1.3.5', name: 'Identify Input Purpose', level: 'AA', principle: 'perceivable' },
  { id: '1.4.1', name: 'Use of Color', level: 'A', principle: 'perceivable' },
  { id: '1.4.2', name: 'Audio Control', level: 'A', principle: 'perceivable' },
  { id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA', principle: 'perceivable' },
  { id: '1.4.4', name: 'Resize Text', level: 'AA', principle: 'perceivable' },
  { id: '1.4.5', name: 'Images of Text', level: 'AA', principle: 'perceivable' },
  { id: '1.4.10', name: 'Reflow', level: 'AA', principle: 'perceivable' },
  { id: '1.4.11', name: 'Non-text Contrast', level: 'AA', principle: 'perceivable' },
  { id: '1.4.12', name: 'Text Spacing', level: 'AA', principle: 'perceivable' },
  { id: '1.4.13', name: 'Content on Hover or Focus', level: 'AA', principle: 'perceivable' },

  // Operable
  { id: '2.1.1', name: 'Keyboard', level: 'A', principle: 'operable' },
  { id: '2.1.2', name: 'No Keyboard Trap', level: 'A', principle: 'operable' },
  { id: '2.1.4', name: 'Character Key Shortcuts', level: 'A', principle: 'operable' },
  { id: '2.2.1', name: 'Timing Adjustable', level: 'A', principle: 'operable' },
  { id: '2.2.2', name: 'Pause, Stop, Hide', level: 'A', principle: 'operable' },
  { id: '2.3.1', name: 'Three Flashes or Below Threshold', level: 'A', principle: 'operable' },
  { id: '2.4.1', name: 'Bypass Blocks', level: 'A', principle: 'operable' },
  { id: '2.4.2', name: 'Page Titled', level: 'A', principle: 'operable' },
  { id: '2.4.3', name: 'Focus Order', level: 'A', principle: 'operable' },
  { id: '2.4.4', name: 'Link Purpose (In Context)', level: 'A', principle: 'operable' },
  { id: '2.4.5', name: 'Multiple Ways', level: 'AA', principle: 'operable' },
  { id: '2.4.6', name: 'Headings and Labels', level: 'AA', principle: 'operable' },
  { id: '2.4.7', name: 'Focus Visible', level: 'AA', principle: 'operable' },
  { id: '2.5.1', name: 'Pointer Gestures', level: 'A', principle: 'operable' },
  { id: '2.5.2', name: 'Pointer Cancellation', level: 'A', principle: 'operable' },
  { id: '2.5.3', name: 'Label in Name', level: 'A', principle: 'operable' },
  { id: '2.5.4', name: 'Motion Actuation', level: 'A', principle: 'operable' },

  // Understandable
  { id: '3.1.1', name: 'Language of Page', level: 'A', principle: 'understandable' },
  { id: '3.1.2', name: 'Language of Parts', level: 'AA', principle: 'understandable' },
  { id: '3.2.1', name: 'On Focus', level: 'A', principle: 'understandable' },
  { id: '3.2.2', name: 'On Input', level: 'A', principle: 'understandable' },
  { id: '3.2.3', name: 'Consistent Navigation', level: 'AA', principle: 'understandable' },
  { id: '3.2.4', name: 'Consistent Identification', level: 'AA', principle: 'understandable' },
  { id: '3.3.1', name: 'Error Identification', level: 'A', principle: 'understandable' },
  { id: '3.3.2', name: 'Labels or Instructions', level: 'A', principle: 'understandable' },
  { id: '3.3.3', name: 'Error Suggestion', level: 'AA', principle: 'understandable' },
  { id: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)', level: 'AA', principle: 'understandable' },

  // Robust
  { id: '4.1.1', name: 'Parsing', level: 'A', principle: 'robust' },
  { id: '4.1.2', name: 'Name, Role, Value', level: 'A', principle: 'robust' },
  { id: '4.1.3', name: 'Status Messages', level: 'AA', principle: 'robust' },
];

/**
 * Accessibility Audit Record
 */
export interface AccessibilityAuditRecord {
  id: string;
  companyId: string;

  // Audit details
  auditType: 'automated' | 'manual' | 'combined' | 'user_testing';
  scope: string; // Pages/components tested
  methodology: string;

  // Tester
  auditorName: string;
  auditorOrganisation?: string;
  isExternal: boolean;

  // Timeline
  startDate: number;
  endDate?: number;
  status: 'planned' | 'in_progress' | 'completed';

  // Tools used
  toolsUsed: string[];

  // Results
  conformanceLevel?: WCAGLevel;
  passedCriteria: string[];
  failedCriteria: string[];
  notApplicableCriteria: string[];

  // Issues found
  totalIssues?: number;
  criticalIssues?: number;
  seriousIssues?: number;
  moderateIssues?: number;
  minorIssues?: number;

  // Report
  reportRef?: string;
  executiveSummary?: string;

  // Metadata
  createdAt: number;
  createdBy: string;
  updatedAt?: number;
}

/**
 * Accessibility Issue
 */
export interface AccessibilityIssue {
  id: string;
  companyId: string;
  auditId: string;

  // Issue details
  title: string;
  description: string;
  severity: AccessibilityIssueSeverity;
  status: AccessibilityIssueStatus;

  // WCAG reference
  wcagCriterion: string; // e.g., "1.4.3"
  wcagLevel: WCAGLevel;
  wcagPrinciple: WCAGPrinciple;

  // Location
  affectedPage: string;
  affectedComponent?: string;
  selector?: string; // CSS selector
  screenshot?: string;

  // Technical details
  currentBehavior: string;
  expectedBehavior: string;
  howToReproduce?: string[];

  // Impact
  userImpact: string;
  affectedUserGroups: string[]; // e.g., ['screen reader users', 'keyboard users']

  // Remediation
  recommendation: string;
  codeExample?: string;
  priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  remediationDeadline?: number;
  fixedAt?: number;
  fixedBy?: string;
  fixNotes?: string;

  // Verification
  verifiedAt?: number;
  verifiedBy?: string;

  // Metadata
  discoveredAt: number;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Accessibility Statement
 */
export interface AccessibilityStatement {
  id: string;
  companyId: string;

  // Service details
  serviceName: string;
  serviceUrl: string;

  // Statement content
  conformanceStatus: 'fully' | 'partially' | 'non_conformant';
  conformanceLevel: WCAGLevel;

  // Non-accessible content
  nonAccessibleContent: {
    description: string;
    wcagCriteria: string[];
    reason: 'disproportionate_burden' | 'not_in_scope' | 'being_fixed' | 'third_party';
    expectedResolution?: string;
  }[];

  // Preparation
  preparationDate: number;
  lastReviewDate: number;
  nextReviewDate: number;
  preparationMethod: string;

  // Contact
  feedbackEmail: string;
  feedbackPhone?: string;
  feedbackUrl?: string;

  // Enforcement
  enforcementProcedureUrl: string;

  // Metadata
  version: string;
  publishedAt: number;
  createdAt: number;
  updatedAt?: number;
}

/**
 * Accessibility Compliance Service
 */
export class AccessibilityComplianceService {
  private auditsPath: string;
  private issuesPath: string;
  private statementsPath: string;

  constructor() {
    this.auditsPath = 'accessibility/audits';
    this.issuesPath = 'accessibility/issues';
    this.statementsPath = 'accessibility/statements';
  }

  /**
   * Create accessibility audit
   */
  async createAudit(
    companyId: string,
    userId: string,
    audit: Omit<AccessibilityAuditRecord, 'id' | 'companyId' | 'createdAt' | 'createdBy'>
  ): Promise<AccessibilityAuditRecord> {
    const auditRef = push(ref(db, `${this.auditsPath}/${companyId}`));
    const now = Date.now();

    const record: AccessibilityAuditRecord = {
      ...audit,
      id: auditRef.key!,
      companyId,
      createdAt: now,
      createdBy: userId,
    };

    await set(auditRef, record);
    return record;
  }

  /**
   * Complete audit with results
   */
  async completeAudit(
    companyId: string,
    auditId: string,
    results: {
      conformanceLevel: WCAGLevel;
      passedCriteria: string[];
      failedCriteria: string[];
      notApplicableCriteria: string[];
      executiveSummary?: string;
      reportRef?: string;
    }
  ): Promise<void> {
    const auditRef = ref(db, `${this.auditsPath}/${companyId}/${auditId}`);
    const now = Date.now();

    // Count issues
    const issues = await this.getIssuesByAudit(companyId, auditId);

    await update(auditRef, {
      ...results,
      status: 'completed',
      endDate: now,
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      seriousIssues: issues.filter(i => i.severity === 'serious').length,
      moderateIssues: issues.filter(i => i.severity === 'moderate').length,
      minorIssues: issues.filter(i => i.severity === 'minor').length,
      updatedAt: now,
    });
  }

  /**
   * Get all audits
   */
  async getAudits(companyId: string): Promise<AccessibilityAuditRecord[]> {
    const auditsRef = ref(db, `${this.auditsPath}/${companyId}`);
    const snapshot = await get(auditsRef);

    if (!snapshot.exists()) return [];

    const audits: AccessibilityAuditRecord[] = [];
    snapshot.forEach(child => {
      audits.push(child.val() as AccessibilityAuditRecord);
    });

    return audits.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Record accessibility issue
   */
  async recordIssue(
    companyId: string,
    auditId: string,
    issue: Omit<AccessibilityIssue, 'id' | 'companyId' | 'auditId' | 'createdAt' | 'discoveredAt'>
  ): Promise<AccessibilityIssue> {
    const issueRef = push(ref(db, `${this.issuesPath}/${companyId}`));
    const now = Date.now();

    // Look up WCAG criterion details
    const criterion = WCAG_21_AA_CRITERIA.find(c => c.id === issue.wcagCriterion);

    const accessibilityIssue: AccessibilityIssue = {
      ...issue,
      id: issueRef.key!,
      companyId,
      auditId,
      wcagLevel: criterion?.level as WCAGLevel || issue.wcagLevel,
      wcagPrinciple: criterion?.principle as WCAGPrinciple || issue.wcagPrinciple,
      discoveredAt: now,
      createdAt: now,
    };

    await set(issueRef, accessibilityIssue);
    return accessibilityIssue;
  }

  /**
   * Get issues by audit
   */
  async getIssuesByAudit(companyId: string, auditId: string): Promise<AccessibilityIssue[]> {
    const issuesRef = ref(db, `${this.issuesPath}/${companyId}`);
    const snapshot = await get(issuesRef);

    if (!snapshot.exists()) return [];

    const issues: AccessibilityIssue[] = [];
    snapshot.forEach(child => {
      const issue = child.val() as AccessibilityIssue;
      if (issue.auditId === auditId) {
        issues.push(issue);
      }
    });

    return issues;
  }

  /**
   * Get open issues
   */
  async getOpenIssues(companyId: string): Promise<AccessibilityIssue[]> {
    const issuesRef = ref(db, `${this.issuesPath}/${companyId}`);
    const snapshot = await get(issuesRef);

    if (!snapshot.exists()) return [];

    const issues: AccessibilityIssue[] = [];
    snapshot.forEach(child => {
      const issue = child.val() as AccessibilityIssue;
      if (['open', 'in_progress'].includes(issue.status)) {
        issues.push(issue);
      }
    });

    // Sort by severity
    const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    return issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(
    companyId: string,
    issueId: string,
    userId: string,
    status: AccessibilityIssueStatus,
    notes?: string
  ): Promise<void> {
    const issueRef = ref(db, `${this.issuesPath}/${companyId}/${issueId}`);
    const now = Date.now();

    const updates: Partial<AccessibilityIssue> = {
      status,
      updatedAt: now,
    };

    if (status === 'fixed') {
      updates.fixedAt = now;
      updates.fixedBy = userId;
      updates.fixNotes = notes;
    } else if (status === 'verified') {
      updates.verifiedAt = now;
      updates.verifiedBy = userId;
    }

    await update(issueRef, updates);
  }

  /**
   * Create or update accessibility statement
   */
  async saveAccessibilityStatement(
    companyId: string,
    statement: Omit<AccessibilityStatement, 'id' | 'companyId' | 'createdAt'>
  ): Promise<AccessibilityStatement> {
    const statementsRef = ref(db, `${this.statementsPath}/${companyId}`);
    const snapshot = await get(statementsRef);
    const now = Date.now();

    let existingId: string | undefined;
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const existing = child.val() as AccessibilityStatement;
        if (existing.serviceName === statement.serviceName) {
          existingId = existing.id;
        }
      });
    }

    if (existingId) {
      // Update existing
      const statementRef = ref(db, `${this.statementsPath}/${companyId}/${existingId}`);
      const versionParts = statement.version.split('.').map(Number);
      versionParts[2]++; // Increment patch version

      await update(statementRef, {
        ...statement,
        version: versionParts.join('.'),
        updatedAt: now,
      });

      return {
        ...statement,
        id: existingId,
        companyId,
        version: versionParts.join('.'),
        createdAt: now,
      };
    }

    // Create new
    const newRef = push(ref(db, `${this.statementsPath}/${companyId}`));
    const newStatement: AccessibilityStatement = {
      ...statement,
      id: newRef.key!,
      companyId,
      createdAt: now,
    };

    await set(newRef, newStatement);
    return newStatement;
  }

  /**
   * Get accessibility statement
   */
  async getAccessibilityStatement(
    companyId: string,
    serviceName?: string
  ): Promise<AccessibilityStatement | null> {
    const statementsRef = ref(db, `${this.statementsPath}/${companyId}`);
    const snapshot = await get(statementsRef);

    if (!snapshot.exists()) return null;

    let latestStatement: AccessibilityStatement | null = null;
    snapshot.forEach(child => {
      const statement = child.val() as AccessibilityStatement;
      if (!serviceName || statement.serviceName === serviceName) {
        if (!latestStatement || statement.createdAt > latestStatement.createdAt) {
          latestStatement = statement;
        }
      }
    });

    return latestStatement;
  }

  /**
   * Generate accessibility statement HTML
   */
  generateAccessibilityStatementHTML(statement: AccessibilityStatement): string {
    const formatDate = (timestamp: number) =>
      new Date(timestamp).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

    const conformanceText = {
      fully: 'fully compliant',
      partially: 'partially compliant',
      non_conformant: 'not compliant',
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Statement - ${statement.serviceName}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0b0c0c; }
    h2 { color: #0b0c0c; margin-top: 30px; border-bottom: 1px solid #b1b4b6; padding-bottom: 10px; }
    .conformance-status { background: #f3f2f1; padding: 15px; margin: 20px 0; }
    .non-accessible { background: #fff3e0; padding: 15px; margin: 10px 0; border-left: 4px solid #ff9800; }
    a { color: #1d70b8; }
    .meta { color: #505a5f; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Accessibility statement for ${statement.serviceName}</h1>

  <p>This accessibility statement applies to <a href="${statement.serviceUrl}">${statement.serviceUrl}</a>.</p>

  <p>This website is run by the service provider. We want as many people as possible to be able to use this website. For example, that means you should be able to:</p>
  <ul>
    <li>change colours, contrast levels and fonts</li>
    <li>zoom in up to 300% without the text spilling off the screen</li>
    <li>navigate most of the website using just a keyboard</li>
    <li>navigate most of the website using speech recognition software</li>
    <li>listen to most of the website using a screen reader</li>
  </ul>

  <p>We've also made the website text as simple as possible to understand.</p>

  <p><a href="https://mcmw.abilitynet.org.uk/">AbilityNet</a> has advice on making your device easier to use if you have a disability.</p>

  <h2>Conformance status</h2>

  <div class="conformance-status">
    <p>This website is <strong>${conformanceText[statement.conformanceStatus]}</strong> with the Web Content Accessibility Guidelines version 2.1 ${statement.conformanceLevel} standard.</p>
  </div>

  ${statement.nonAccessibleContent.length > 0 ? `
  <h2>Non-accessible content</h2>

  <p>The content listed below is non-accessible for the following reasons.</p>

  ${statement.nonAccessibleContent.map(item => `
  <div class="non-accessible">
    <p><strong>${item.description}</strong></p>
    <p>This fails WCAG ${item.wcagCriteria.join(', ')} criteria.</p>
    <p>Reason: ${item.reason.replace(/_/g, ' ')}</p>
    ${item.expectedResolution ? `<p>Expected resolution: ${item.expectedResolution}</p>` : ''}
  </div>
  `).join('')}
  ` : ''}

  <h2>Feedback and contact information</h2>

  <p>If you need information on this website in a different format like accessible PDF, large print, easy read, audio recording or braille:</p>
  <ul>
    <li>email: <a href="mailto:${statement.feedbackEmail}">${statement.feedbackEmail}</a></li>
    ${statement.feedbackPhone ? `<li>phone: ${statement.feedbackPhone}</li>` : ''}
    ${statement.feedbackUrl ? `<li>online: <a href="${statement.feedbackUrl}">${statement.feedbackUrl}</a></li>` : ''}
  </ul>

  <p>We'll consider your request and get back to you within 5 working days.</p>

  <h2>Enforcement procedure</h2>

  <p>The Equality and Human Rights Commission (EHRC) is responsible for enforcing the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 (the 'accessibility regulations'). If you're not happy with how we respond to your complaint, <a href="${statement.enforcementProcedureUrl}">contact the Equality Advisory and Support Service (EASS)</a>.</p>

  <h2>Technical information about this website's accessibility</h2>

  <p>We are committed to making this website accessible, in accordance with the Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018.</p>

  <h2>Preparation of this accessibility statement</h2>

  <p>This statement was prepared on ${formatDate(statement.preparationDate)}. It was last reviewed on ${formatDate(statement.lastReviewDate)}.</p>

  <p>This website was last tested on ${formatDate(statement.preparationDate)}. The test was carried out by ${statement.preparationMethod}.</p>

  <p class="meta">Statement version: ${statement.version}</p>
</body>
</html>
    `.trim();
  }

  /**
   * Generate WCAG compliance checklist
   */
  getWCAGChecklist(level: WCAGLevel = 'AA'): typeof WCAG_21_AA_CRITERIA {
    if (level === 'A') {
      return WCAG_21_AA_CRITERIA.filter(c => c.level === 'A');
    }
    if (level === 'AA') {
      return WCAG_21_AA_CRITERIA.filter(c => c.level === 'A' || c.level === 'AA');
    }
    return WCAG_21_AA_CRITERIA;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(companyId: string): Promise<{
    generatedAt: number;
    audits: {
      total: number;
      completed: number;
      lastAuditDate?: number;
    };
    issues: {
      total: number;
      open: number;
      critical: number;
      serious: number;
      byPrinciple: Record<string, number>;
    };
    conformance: {
      level: WCAGLevel | null;
      passRate: number;
      passedCriteria: string[];
      failedCriteria: string[];
    };
    statement: {
      exists: boolean;
      lastUpdated?: number;
      nextReview?: number;
    };
  }> {
    const [audits, openIssues, statement] = await Promise.all([
      this.getAudits(companyId),
      this.getOpenIssues(companyId),
      this.getAccessibilityStatement(companyId),
    ]);

    // Get all issues
    const issuesRef = ref(db, `${this.issuesPath}/${companyId}`);
    const issuesSnapshot = await get(issuesRef);
    const allIssues: AccessibilityIssue[] = [];
    if (issuesSnapshot.exists()) {
      issuesSnapshot.forEach(child => {
        allIssues.push(child.val() as AccessibilityIssue);
      });
    }

    const completedAudits = audits.filter(a => a.status === 'completed');
    const latestAudit = completedAudits[0];

    const issuesByPrinciple: Record<string, number> = {
      perceivable: 0,
      operable: 0,
      understandable: 0,
      robust: 0,
    };
    for (const issue of openIssues) {
      if (issue.wcagPrinciple) {
        issuesByPrinciple[issue.wcagPrinciple]++;
      }
    }

    const totalCriteria = WCAG_21_AA_CRITERIA.filter(
      c => c.level === 'A' || c.level === 'AA'
    ).length;
    const passedCount = latestAudit?.passedCriteria?.length || 0;
    const passRate = totalCriteria > 0 ? (passedCount / totalCriteria) * 100 : 0;

    return {
      generatedAt: Date.now(),
      audits: {
        total: audits.length,
        completed: completedAudits.length,
        lastAuditDate: latestAudit?.endDate,
      },
      issues: {
        total: allIssues.length,
        open: openIssues.length,
        critical: openIssues.filter(i => i.severity === 'critical').length,
        serious: openIssues.filter(i => i.severity === 'serious').length,
        byPrinciple: issuesByPrinciple,
      },
      conformance: {
        level: latestAudit?.conformanceLevel || null,
        passRate,
        passedCriteria: latestAudit?.passedCriteria || [],
        failedCriteria: latestAudit?.failedCriteria || [],
      },
      statement: {
        exists: !!statement,
        lastUpdated: statement?.updatedAt || statement?.createdAt,
        nextReview: statement?.nextReviewDate,
      },
    };
  }
}

// Export singleton instance
export const accessibilityComplianceService = new AccessibilityComplianceService();

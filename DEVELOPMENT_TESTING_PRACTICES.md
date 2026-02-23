# Development & Testing Practices - HMRC Compliance Guide

This document outlines development and testing practices for HMRC API integration compliance.

## Overview

HMRC requires software vendors to follow specific development and testing practices:

| Requirement | Implementation |
|-------------|----------------|
| CI/CD DevOps practices | ✅ GitHub Actions pipeline |
| Weekly automated sandbox tests | ✅ Scheduled sandbox testing |
| Monitor for breaking changes | ✅ API monitoring service |
| Periodic penetration testing | ✅ Security testing tracking |
| WCAG 2.1 AA accessibility | ✅ Accessibility compliance service |

## 1. CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) implements:

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│    Build    │────▶│  Unit Tests  │────▶│ Security Scan  │
└─────────────┘     └──────────────┘     └────────────────┘
                            │
                            ▼
                    ┌──────────────┐     ┌────────────────┐
                    │ Accessibility│────▶│    Deploy      │
                    │    Tests     │     │   (if pass)    │
                    └──────────────┘     └────────────────┘
```

### Pipeline Stages

| Stage | Trigger | Actions |
|-------|---------|---------|
| Build & Lint | Every push | ESLint, TypeScript check, build |
| Unit Tests | Every push | Test suite execution |
| Security Scan | PRs, main branch | npm audit, Snyk, OWASP |
| Accessibility | PRs, main branch | axe-core, pa11y |
| Sandbox Tests | Weekly (Sunday 2am) | HMRC API tests |
| Deploy Staging | develop branch | Firebase staging |
| Deploy Production | main branch | Firebase production |

### Running the Pipeline

```bash
# Trigger manually via GitHub Actions
# Or push to appropriate branch

# Local build check
npm run build:check:main

# Local lint check
npm run lint
```

## 2. Automated Sandbox Testing

### Weekly Test Schedule

Tests run automatically every Sunday at 2am UTC against HMRC sandbox.

```typescript
import { sandboxTestingService } from './services/testing';

// Initialize standard HMRC test cases
await sandboxTestingService.initializeStandardTests(companyId);

// Create weekly schedule
await sandboxTestingService.createDefaultWeeklySchedule(companyId);

// Manual test run
const run = await sandboxTestingService.startTestRun(companyId, {
  trigger: 'manual',
  triggeredBy: userId,
});
```

### Standard Test Cases

| Test | Type | Description |
|------|------|-------------|
| OAuth Token Request | oauth_flow | Test token acquisition |
| OAuth Token Refresh | oauth_flow | Test token refresh |
| Fraud Prevention Headers | fraud_prevention | Validate headers |
| FPS Submission | api_endpoint | Test Full Payment Submission |
| EPS Submission | api_endpoint | Test Employer Payment Summary |
| Invalid Request Handling | error_handling | Test 400 responses |
| Unauthorized Request | error_handling | Test 401 responses |
| NI Number Validation | data_validation | Test NI validation |
| API Response Time | performance | Response < 3 seconds |

### Test Results

```typescript
// Get recent test runs
const recentRuns = await sandboxTestingService.getRecentRuns(companyId);

// Get detailed results
const report = await sandboxTestingService.generateTestReport(companyId, runId);

console.log(`Pass rate: ${report.passRate}%`);
console.log(`Avg response time: ${report.averageResponseTime}ms`);
console.log(`Failures by type:`, report.failuresByType);
```

## 3. Breaking Change Monitoring

### HMRC Provides 6 Months Notice

HMRC commits to providing 6 months notice before breaking changes.

```typescript
import { hmrcAPIMonitoringService } from './services/testing';

// Initialize monitoring
await hmrcAPIMonitoringService.initializeAPIs(companyId);

// Check for upcoming deprecations
const deprecations = await hmrcAPIMonitoringService.checkUpcomingDeprecations(
  companyId,
  180 // 6 months
);

for (const dep of deprecations) {
  console.log(`${dep.api.name} v${dep.version} deprecated in ${dep.daysRemaining} days`);
}
```

### Recording Change Notices

```typescript
// Record a change notice from HMRC
await hmrcAPIMonitoringService.recordChangeNotice(companyId, {
  apiId: 'rti-api',
  apiName: 'Real Time Information',
  changeType: 'deprecation',
  title: 'RTI API v1.0 Deprecation',
  description: 'Version 1.0 will be retired. Migrate to v2.0.',
  announcedDate: Date.now(),
  effectiveDate: Date.now() + (180 * 24 * 60 * 60 * 1000), // 6 months
  breakingChange: true,
  affectedVersions: ['1.0'],
  requiredActions: [
    'Update API client to use v2.0 endpoints',
    'Update authentication flow',
    'Test in sandbox',
  ],
  source: 'hmrc_announcement',
});
```

### Monitoring Dashboard

```typescript
// Generate monitoring report
const report = await hmrcAPIMonitoringService.generateMonitoringReport(companyId);

console.log('API Status:');
console.log(`  Total: ${report.apis.total}`);
console.log(`  Healthy: ${report.apis.healthy}`);
console.log(`  Deprecated: ${report.apis.deprecated}`);

console.log('Pending Changes:');
console.log(`  Total: ${report.changes.pending}`);
console.log(`  Urgent (30 days): ${report.changes.urgent}`);
console.log(`  Breaking: ${report.changes.breakingChanges}`);

console.log('Alerts:');
console.log(`  Critical: ${report.alerts.critical}`);
console.log(`  High: ${report.alerts.high}`);
```

## 4. Penetration Testing

### Annual Security Assessments

Schedule and track penetration tests:

```typescript
import { securityTestingService } from './services/testing';

// Initialize default schedules (annual)
await securityTestingService.initializeDefaultSchedules(companyId);

// Schedule a penetration test
const penTest = await securityTestingService.schedulePenTest(companyId, userId, {
  testType: 'web_application',
  scope: 'All customer-facing web application pages and API endpoints',
  methodology: 'OWASP Testing Guide v4.2',
  testingProvider: 'Security Vendor Ltd',
  leadTester: 'Jane Security',
  checkCertified: true, // NCSC CHECK certified
  plannedStartDate: Date.now() + (30 * 24 * 60 * 60 * 1000),
  plannedEndDate: Date.now() + (37 * 24 * 60 * 60 * 1000),
  retestRequired: true,
});
```

### Vulnerability Management

```typescript
// Record a vulnerability finding
const vulnerability = await securityTestingService.recordVulnerability(
  companyId,
  penTestId,
  {
    title: 'SQL Injection in Search Function',
    description: 'User input not properly sanitized in employee search',
    severity: 'high',
    cvssScore: 8.6,
    cweId: 'CWE-89',
    affectedSystem: 'Employee Management Module',
    affectedComponent: '/api/employees/search',
    impact: 'Attacker could access or modify employee data',
    recommendation: 'Use parameterized queries',
    status: 'open',
    remediationPriority: 'immediate',
    remediationDeadline: Date.now() + (7 * 24 * 60 * 60 * 1000),
  }
);

// Update when fixed
await securityTestingService.updateVulnerabilityStatus(
  companyId,
  vulnerability.id,
  userId,
  'remediated',
  'Implemented parameterized queries in all search functions'
);
```

### OWASP Top 10 Coverage

Track coverage of OWASP Top 10 2021:

```typescript
import { OWASP_TOP_10_2021 } from './services/testing';

// OWASP categories
for (const category of OWASP_TOP_10_2021) {
  console.log(`${category.id}: ${category.name}`);
  // A01: Broken Access Control
  // A02: Cryptographic Failures
  // A03: Injection
  // ...
}
```

### Security Report

```typescript
const report = await securityTestingService.generateSecurityReport(companyId);

console.log('Penetration Tests:');
console.log(`  Completed: ${report.penTests.completed}`);
console.log(`  Last test: ${new Date(report.penTests.lastCompletedDate).toDateString()}`);

console.log('Vulnerabilities:');
console.log(`  Open: ${report.vulnerabilities.open}`);
console.log(`  Critical: ${report.vulnerabilities.critical}`);
console.log(`  High: ${report.vulnerabilities.high}`);
console.log(`  Overdue: ${report.vulnerabilities.overdue}`);
console.log(`  Avg fix time: ${report.vulnerabilities.averageRemediationDays} days`);
```

## 5. Accessibility Compliance (WCAG 2.1 AA)

### UK Legal Requirement

Public sector websites must meet WCAG 2.1 Level AA. HMRC API integrations should also follow these standards.

### WCAG 2.1 AA Criteria

```typescript
import { WCAG_21_AA_CRITERIA, accessibilityComplianceService } from './services/testing';

// Get AA-level criteria (50 success criteria)
const checklist = accessibilityComplianceService.getWCAGChecklist('AA');

// Criteria are organized by principle:
// - Perceivable (1.x.x)
// - Operable (2.x.x)
// - Understandable (3.x.x)
// - Robust (4.x.x)
```

### Accessibility Audits

```typescript
// Create accessibility audit
const audit = await accessibilityComplianceService.createAudit(companyId, userId, {
  auditType: 'combined', // automated + manual
  scope: 'All public-facing pages',
  methodology: 'WCAG-EM (Website Accessibility Conformance Evaluation Methodology)',
  auditorName: 'Accessibility Expert',
  auditorOrganisation: 'A11y Consultants Ltd',
  isExternal: true,
  startDate: Date.now(),
  status: 'in_progress',
  toolsUsed: ['axe-core', 'WAVE', 'NVDA', 'VoiceOver'],
});

// Record issue
await accessibilityComplianceService.recordIssue(companyId, audit.id, {
  title: 'Missing alt text on employee photo',
  description: 'Employee profile images lack alternative text',
  severity: 'serious',
  status: 'open',
  wcagCriterion: '1.1.1',
  wcagLevel: 'A',
  wcagPrinciple: 'perceivable',
  affectedPage: '/employees/profile',
  currentBehavior: 'Images have empty alt attributes',
  expectedBehavior: 'Images should have descriptive alt text',
  userImpact: 'Screen reader users cannot identify employees',
  affectedUserGroups: ['screen reader users', 'users with images disabled'],
  recommendation: 'Add descriptive alt text: "Photo of [Employee Name]"',
  priority: 'short_term',
});
```

### Accessibility Statement

UK law requires an accessibility statement:

```typescript
// Create accessibility statement
const statement = await accessibilityComplianceService.saveAccessibilityStatement(
  companyId,
  {
    serviceName: 'ACME Payroll System',
    serviceUrl: 'https://payroll.acme.com',
    conformanceStatus: 'partially',
    conformanceLevel: 'AA',
    nonAccessibleContent: [
      {
        description: 'PDF payslips are not fully accessible',
        wcagCriteria: ['1.1.1', '1.3.1'],
        reason: 'being_fixed',
        expectedResolution: 'Q2 2025',
      },
    ],
    preparationDate: Date.now(),
    lastReviewDate: Date.now(),
    nextReviewDate: Date.now() + (365 * 24 * 60 * 60 * 1000),
    preparationMethod: 'External accessibility audit by A11y Consultants',
    feedbackEmail: 'accessibility@acme.com',
    feedbackPhone: '0800 123 4567',
    enforcementProcedureUrl: 'https://www.equalityadvisoryservice.com/',
    version: '1.0.0',
    publishedAt: Date.now(),
  }
);

// Generate HTML statement
const html = accessibilityComplianceService.generateAccessibilityStatementHTML(statement);
```

### Automated Testing Tools

The CI/CD pipeline uses:

1. **axe-core** - Automated accessibility testing
2. **pa11y** - Web accessibility testing CLI

Configuration in `.pa11yci.json`:

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "runners": ["axe", "htmlcs"]
  },
  "urls": [
    "http://localhost:3000/",
    "http://localhost:3000/dashboard",
    "http://localhost:3000/payroll"
  ]
}
```

### Compliance Report

```typescript
const report = await accessibilityComplianceService.generateComplianceReport(companyId);

console.log('Accessibility Compliance:');
console.log(`  Conformance level: ${report.conformance.level}`);
console.log(`  Pass rate: ${report.conformance.passRate.toFixed(1)}%`);
console.log(`  Open issues: ${report.issues.open}`);
console.log(`  Critical issues: ${report.issues.critical}`);
console.log(`  Statement exists: ${report.statement.exists}`);
console.log(`  Next review: ${new Date(report.statement.nextReview).toDateString()}`);
```

## 6. Implementation Checklist

### Initial Setup

- [ ] Configure GitHub Actions secrets
  - `HMRC_SANDBOX_CLIENT_ID`
  - `HMRC_SANDBOX_CLIENT_SECRET`
  - `FIREBASE_SERVICE_ACCOUNT_STAGING`
  - `FIREBASE_SERVICE_ACCOUNT_PRODUCTION`
  - `SNYK_TOKEN` (optional)

- [ ] Initialize testing services
  ```typescript
  await sandboxTestingService.initializeStandardTests(companyId);
  await hmrcAPIMonitoringService.initializeAPIs(companyId);
  await securityTestingService.initializeDefaultSchedules(companyId);
  ```

- [ ] Create accessibility statement

- [ ] Schedule first penetration test

### Ongoing Maintenance

- [ ] Review weekly sandbox test results
- [ ] Address any failing tests promptly
- [ ] Monitor for HMRC API change notices
- [ ] Conduct annual penetration test
- [ ] Review accessibility statement annually
- [ ] Fix critical/high vulnerabilities within SLA

## 7. API Reference

### HMRCAPIMonitoringService

```typescript
// Initialize APIs
hmrcAPIMonitoringService.initializeAPIs(companyId)

// Get APIs
hmrcAPIMonitoringService.getAPIs(companyId)

// Record change notice
hmrcAPIMonitoringService.recordChangeNotice(companyId, notice)

// Get pending changes
hmrcAPIMonitoringService.getPendingChanges(companyId)

// Get urgent changes (30 days)
hmrcAPIMonitoringService.getUrgentChanges(companyId)

// Check deprecations (6 months)
hmrcAPIMonitoringService.checkUpcomingDeprecations(companyId, 180)

// Generate report
hmrcAPIMonitoringService.generateMonitoringReport(companyId)
```

### SandboxTestingService

```typescript
// Initialize tests
sandboxTestingService.initializeStandardTests(companyId)

// Create schedule
sandboxTestingService.createDefaultWeeklySchedule(companyId)

// Start test run
sandboxTestingService.startTestRun(companyId, options)

// Get results
sandboxTestingService.getTestRunResults(companyId, runId)

// Generate report
sandboxTestingService.generateTestReport(companyId, runId)
```

### SecurityTestingService

```typescript
// Schedule pen test
securityTestingService.schedulePenTest(companyId, userId, test)

// Record vulnerability
securityTestingService.recordVulnerability(companyId, penTestId, vuln)

// Update vulnerability status
securityTestingService.updateVulnerabilityStatus(companyId, vulnId, userId, status, notes)

// Get open vulnerabilities
securityTestingService.getOpenVulnerabilities(companyId)

// Generate report
securityTestingService.generateSecurityReport(companyId)
```

### AccessibilityComplianceService

```typescript
// Create audit
accessibilityComplianceService.createAudit(companyId, userId, audit)

// Record issue
accessibilityComplianceService.recordIssue(companyId, auditId, issue)

// Get open issues
accessibilityComplianceService.getOpenIssues(companyId)

// Save statement
accessibilityComplianceService.saveAccessibilityStatement(companyId, statement)

// Generate statement HTML
accessibilityComplianceService.generateAccessibilityStatementHTML(statement)

// Generate report
accessibilityComplianceService.generateComplianceReport(companyId)
```

## References

- [HMRC Developer Hub](https://developer.service.hmrc.gov.uk/)
- [HMRC Testing in Sandbox](https://developer.service.hmrc.gov.uk/api-documentation/docs/testing)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [UK Accessibility Regulations](https://www.legislation.gov.uk/uksi/2018/952)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NCSC Penetration Testing](https://www.ncsc.gov.uk/guidance/penetration-testing)
- [GDS Service Manual - Accessibility](https://www.gov.uk/service-manual/helping-people-to-use-your-service)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-20
**Review Date:** 2025-07-20

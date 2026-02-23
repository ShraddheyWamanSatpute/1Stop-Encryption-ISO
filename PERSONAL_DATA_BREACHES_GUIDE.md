# Personal Data Breaches - UK GDPR Compliance Guide

This document outlines the implementation of personal data breach management in compliance with UK GDPR Articles 33 and 34.

## Overview

A personal data breach is a security incident that leads to the accidental or unlawful:
- Destruction of personal data
- Loss of personal data
- Alteration of personal data
- Unauthorised disclosure of or access to personal data

## Action Items Implementation

| Action Item | Implementation | Service |
|-------------|----------------|---------|
| Prepare breach response plan | ✅ Complete | `BreachResponsePlanService` |
| Assign responsibilities | ✅ Complete | Team roles and escalation matrix |
| Document all breaches | ✅ Complete | `DataBreachService` |
| Notify ICO within 72 hours | ✅ Complete | Notification tracking + templates |
| Notify individuals promptly | ✅ Complete | `BreachNotificationService` |
| Training | ✅ Complete | `BreachTrainingRecord` tracking |
| Root cause analysis | ✅ Complete | `documentRootCause()` |
| Audit logs | ✅ Complete | `AuditTrailService` integration |
| Access controls | ✅ Complete | Role-based access in plan |

## 1. Breach Response Plan

### Setting Up the Response Team

```typescript
import { breachResponsePlanService } from './services/gdpr';

// Define team members with assigned roles
const teamMembers = [
  {
    userId: 'user-001',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    phone: '020 1234 5678',
    role: 'data_protection_officer' as const,
    responsibilities: [
      'Assess data protection implications',
      'Determine ICO notification requirement',
      'Prepare ICO notification',
      'Liaise with ICO',
    ],
    notificationPriority: 1 as const,
    trainingCertified: true,
  },
  {
    userId: 'user-002',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'incident_coordinator' as const,
    responsibilities: [
      'Coordinate overall breach response',
      'Ensure tasks are assigned and completed',
      'Make escalation decisions',
    ],
    notificationPriority: 1 as const,
    trainingCertified: true,
  },
  // Add more team members...
];

// Create or update the response plan
const plan = await breachResponsePlanService.createOrUpdatePlan(
  companyId,
  adminUserId,
  {
    teamMembers,
    privacyPolicyVersion: '2.0.0',
    hmrcContact: {
      phone: '0300 200 3300',
      email: 'security.incidents@hmrc.gov.uk',
    },
  }
);

// Activate the plan after approval
await breachResponsePlanService.activatePlan(
  companyId,
  adminUserId,
  'Director Name'
);
```

### Available Roles

| Role | Notification Priority | Primary Responsibilities |
|------|----------------------|--------------------------|
| `incident_coordinator` | 1 (immediate) | Overall coordination, decisions |
| `data_protection_officer` | 1 (immediate) | ICO liaison, compliance |
| `technical_lead` | 1 (immediate) | Investigation, containment |
| `communications_lead` | 2 (1 hour) | External/internal comms |
| `legal_counsel` | 2 (1 hour) | Legal advice |
| `hr_representative` | 3 (4 hours) | Employee breaches |
| `senior_management` | 2 (1 hour) | Strategic decisions |
| `it_security` | 1 (immediate) | Security response |
| `business_continuity` | 2 (1 hour) | Operations continuity |

### Response Phases

The plan includes 7 phases, each with tasks and checklists:

1. **Detection** (Target: 1 hour)
   - Confirm breach occurred
   - Identify initial scope
   - Preserve evidence
   - Alert incident coordinator

2. **Containment** (Target: 4 hours)
   - Isolate affected systems
   - Block unauthorized access
   - Change compromised credentials
   - Document containment actions

3. **Assessment** (Target: 24 hours)
   - Identify data categories affected
   - Determine number of individuals
   - Assess risk to individuals
   - Determine notification requirements

4. **Notification** (Target: 72 hours from detection)
   - Submit ICO notification
   - Notify HMRC (if payroll data)
   - Notify affected individuals
   - Brief internal stakeholders

5. **Investigation** (Target: 2 weeks)
   - Conduct forensic analysis
   - Identify root cause
   - Document timeline
   - Identify control failures

6. **Remediation** (Target: 4 weeks)
   - Implement technical fixes
   - Update security controls
   - Provide additional training
   - Test remediation

7. **Review** (Target: 1 week after remediation)
   - Post-incident review meeting
   - Document lessons learned
   - Update response plan
   - Close breach record

## 2. Documenting All Breaches

### Reporting a Breach

```typescript
import { dataBreachService } from './services/gdpr';

// Report a new breach - ALL breaches must be documented
const breach = await dataBreachService.reportBreach(
  companyId,
  detectedByUserId,
  {
    title: 'Unauthorized access to employee payroll data',
    description: 'An unauthorized user gained access to the payroll system...',
    severity: 'high',
    dataCategories: ['payroll', 'salary', 'ni_number', 'bank_details'],
    estimatedRecordsAffected: 150,
    riskToIndividuals: 'likely',
    potentialConsequences: ['identity_theft', 'financial_loss'],
  }
);

// The service automatically determines:
// - requiresICONotification: true (based on severity/risk)
// - requiresHMRCNotification: true (payroll data involved)
// - requiresUserNotification: true (likely risk to individuals)
```

### Breach Assessment Criteria

**ICO Notification Required When:**
- Severity is `critical` or `high`
- Risk to individuals is `likely` or `highly_likely`
- 100+ records affected

**Individual Notification Required When:**
- Risk to individuals is `likely` or `highly_likely`
- Consequences include: identity theft, financial loss, discrimination

**HMRC Notification Required When:**
- Data categories include: payroll, tax, PAYE, NI number

### Creating Response Tasks

```typescript
// Automatically create tasks based on the response plan
const tasks = await breachResponsePlanService.createBreachTasks(
  companyId,
  breach.id,
  'high' // severity
);

// Tasks are created for all phases with appropriate priorities
// Phase 1 & 2 tasks: critical/high priority
// Notification phase: critical for high/critical severity
```

## 3. ICO Notification (72-Hour Deadline)

### Check Notification Deadline

```typescript
import { breachNotificationService } from './services/gdpr';

// Check deadline status
const deadline = breachNotificationService.getNotificationDeadline(breach.detectedAt);

console.log(`Deadline: ${deadline.deadline.toISOString()}`);
console.log(`Hours remaining: ${deadline.hoursRemaining}`);
console.log(`Is overdue: ${deadline.isOverdue}`);
```

### Generate ICO Notification

```typescript
// Generate ICO notification content
const icoNotification = breachNotificationService.generateICONotification(
  breach,
  {
    name: 'ACME Payroll Ltd',
    address: '123 Business Street, London, EC1A 1AA',
    registrationNumber: 'ZA123456',
    contactName: 'Jane Smith (DPO)',
    contactEmail: 'dpo@acmepayroll.com',
    contactPhone: '020 1234 5678',
  }
);

// Get form data for ICO web submission
const formData = breachNotificationService.getICOFormData(icoNotification);
```

### Record ICO Notification

```typescript
// Record that ICO was notified
await dataBreachService.recordICONotification(
  companyId,
  breach.id,
  userId,
  'ICO-REF-2025-12345' // Reference number from ICO
);
```

### Monitor Urgent and Overdue Breaches

```typescript
// Get breaches approaching deadline
const urgentBreaches = await dataBreachService.getUrgentBreaches(companyId);

// Get breaches past 72-hour deadline
const overdueBreaches = await dataBreachService.getOverdueBreaches(companyId);

if (overdueBreaches.length > 0) {
  console.error('CRITICAL: Breaches past ICO notification deadline!');
  // Take immediate action
}
```

## 4. Notifying Affected Individuals

### When to Notify

Notify individuals **without undue delay** when:
- Breach is likely to result in **high risk** to their rights and freedoms
- This includes risks of: identity theft, financial loss, discrimination, reputational damage

### Generate Individual Notification

```typescript
// Generate notification content for an individual
const notification = breachNotificationService.generateIndividualNotification(
  breach,
  {
    name: 'Employee Name',
    email: 'employee@email.com',
    address: '456 Home Street, London, SW1A 1AA',
  },
  {
    name: 'ACME Payroll Ltd',
    dpoName: 'Jane Smith',
    dpoEmail: 'dpo@acmepayroll.com',
    dpoPhone: '020 1234 5678',
    supportUrl: 'https://acmepayroll.com/breach-support',
  }
);

// Generate email (HTML + plain text)
const email = breachNotificationService.generateIndividualNotificationEmail(notification);
// email.subject, email.html, email.text

// Generate letter for postal notification
const letter = breachNotificationService.generateIndividualNotificationLetter(notification);
```

### Notification Content Includes

1. **What happened** - Clear, non-technical description
2. **Data affected** - Specific to that individual
3. **Actions taken** - Steps to address the breach
4. **Potential impact** - What it means for them
5. **Recommended actions** - Steps they should take
6. **Contact details** - DPO and support information
7. **ICO contact** - Their right to complain

### Record User Notification

```typescript
await dataBreachService.recordUserNotification(
  companyId,
  breach.id,
  'Email and postal letter'
);
```

## 5. Preventive Measures

### Training

```typescript
// Record training completion
await breachResponsePlanService.recordTraining(companyId, {
  userId: 'user-001',
  userName: 'Jane Smith',
  trainingType: 'initial', // 'initial', 'refresher', 'simulation', 'tabletop_exercise'
  completedSuccessfully: true,
  score: 95,
  topics: [
    'Breach identification',
    'Response procedures',
    'ICO notification requirements',
    'Individual notification requirements',
    'Evidence preservation',
  ],
  trainedBy: 'External Trainer',
});

// Check who needs training
const needsTraining = await breachResponsePlanService.getTeamMembersNeedingTraining(companyId);

for (const { member, reason } of needsTraining) {
  console.log(`${member.name} needs training: ${reason}`);
  // 'never_trained', 'expired', 'expiring_soon'
}
```

### Tabletop Exercises

```typescript
// Record a tabletop exercise
await breachResponsePlanService.recordTabletopExercise(companyId, {
  scenario: 'Ransomware attack on payroll database',
  participants: [
    { userId: 'user-001', userName: 'Jane Smith', role: 'data_protection_officer' },
    { userId: 'user-002', userName: 'John Doe', role: 'incident_coordinator' },
    { userId: 'user-003', userName: 'Bob Wilson', role: 'technical_lead' },
  ],
  duration: 120, // minutes
  findings: [
    'Communication delays between IT and DPO',
    'Need clearer escalation criteria',
  ],
  improvements: [
    'Add dedicated Slack channel for incidents',
    'Create one-page escalation guide',
  ],
  conductedBy: 'Security Consultant',
});
```

### Root Cause Analysis

```typescript
// Document root cause after investigation
await dataBreachService.documentRootCause(
  companyId,
  breach.id,
  'Phishing attack compromised employee credentials. ' +
  'Lack of MFA on payroll system allowed unauthorized access.'
);

// Add remediation actions
await dataBreachService.addRemediationAction(
  companyId,
  breach.id,
  'Implemented MFA on all payroll system access points'
);

// Add preventive measures
await dataBreachService.addPreventiveMeasure(
  companyId,
  breach.id,
  'Enhanced phishing awareness training rolled out to all staff'
);
```

### Audit Logging

All breach-related actions are automatically logged via `AuditTrailService`:

```typescript
// Get audit logs for a breach
// Logs include:
// - Breach reported
// - Status changes
// - Notifications sent
// - Tasks completed
// - Access to breach records
```

## 6. HMRC Notification

When payroll or tax data is involved:

```typescript
// Generate HMRC notification
const hmrcNotification = breachNotificationService.generateHMRCNotification(
  breach,
  {
    name: 'ACME Payroll Ltd',
    payeReference: '123/AB12345',
    accountsOfficeReference: '123PA00012345',
    contactName: 'Jane Smith',
    contactEmail: 'dpo@acmepayroll.com',
    contactPhone: '020 1234 5678',
  }
);

// Record HMRC notification
await dataBreachService.recordHMRCNotification(
  companyId,
  breach.id,
  userId,
  'HMRC-INCIDENT-2025-67890'
);
```

## 7. Breach Statistics and Reporting

```typescript
// Get breach statistics for compliance reporting
const stats = await dataBreachService.getBreachStatistics(companyId);

console.log(`Total breaches: ${stats.total}`);
console.log(`Resolved: ${stats.resolved}`);
console.log(`Pending: ${stats.pending}`);
console.log(`ICO notified: ${stats.icoNotified}`);
console.log(`HMRC notified: ${stats.hmrcNotified}`);
console.log(`Overdue: ${stats.overdue}`);
console.log(`By severity:`, stats.bySeverity);
```

## 8. Compliance Checklist

### Pre-Incident Preparation

- [ ] Breach response plan created and approved
- [ ] Team members assigned to all roles
- [ ] All team members trained and certified
- [ ] Contact information up to date
- [ ] Tabletop exercise conducted within last 12 months
- [ ] Plan reviewed within last 12 months

### During Incident

- [ ] Breach detected and confirmed
- [ ] Evidence preserved
- [ ] Incident coordinator notified immediately
- [ ] Containment actions taken
- [ ] Risk assessment completed
- [ ] ICO notification decision made (within 72 hours)
- [ ] Individual notification decision made
- [ ] HMRC notified (if applicable)
- [ ] All actions documented

### Post-Incident

- [ ] Root cause identified
- [ ] Remediation actions completed
- [ ] Preventive measures implemented
- [ ] Post-incident review conducted
- [ ] Lessons learned documented
- [ ] Response plan updated
- [ ] Staff retrained (if needed)
- [ ] Breach record closed

## 9. ICO Contact Information

**Report a Breach:**
- Online: https://ico.org.uk/for-organisations/report-a-breach/
- Phone: 0303 123 1113
- Email: casework@ico.org.uk

**72-Hour Deadline:**
- Starts when you become **aware** of the breach
- If you can't provide all details, provide what you have and follow up
- Document reasons for any delay

## 10. API Reference

### DataBreachService

```typescript
// Report breach
dataBreachService.reportBreach(companyId, detectedBy, incident)

// Update status
dataBreachService.updateStatus(companyId, breachId, status, userId, notes?)

// Record notifications
dataBreachService.recordICONotification(companyId, breachId, userId, reference)
dataBreachService.recordHMRCNotification(companyId, breachId, userId, reference)
dataBreachService.recordUserNotification(companyId, breachId, method)

// Document response
dataBreachService.addRemediationAction(companyId, breachId, action)
dataBreachService.addPreventiveMeasure(companyId, breachId, measure)
dataBreachService.documentRootCause(companyId, breachId, rootCause)

// Query breaches
dataBreachService.getBreach(companyId, breachId)
dataBreachService.getCompanyBreaches(companyId)
dataBreachService.getUrgentBreaches(companyId)
dataBreachService.getOverdueBreaches(companyId)
dataBreachService.getBreachStatistics(companyId)
```

### BreachResponsePlanService

```typescript
// Plan management
breachResponsePlanService.createOrUpdatePlan(companyId, userId, planData)
breachResponsePlanService.getPlan(companyId)
breachResponsePlanService.activatePlan(companyId, userId, approverName)

// Team management
breachResponsePlanService.getTeamMemberByRole(companyId, role)
breachResponsePlanService.getTeamForPhase(companyId, phase)

// Task management
breachResponsePlanService.createBreachTasks(companyId, breachId, severity)
breachResponsePlanService.getBreachTasks(companyId, breachId)
breachResponsePlanService.updateTaskStatus(companyId, breachId, taskId, userId, status)

// Training
breachResponsePlanService.recordTraining(companyId, trainingData)
breachResponsePlanService.getUserTrainingRecords(companyId, userId)
breachResponsePlanService.getAllTrainingRecords(companyId)
breachResponsePlanService.getTeamMembersNeedingTraining(companyId)
breachResponsePlanService.recordTabletopExercise(companyId, exerciseData)
```

### BreachNotificationService

```typescript
// Generate notifications
breachNotificationService.generateICONotification(breach, orgDetails)
breachNotificationService.generateIndividualNotification(breach, recipient, company)
breachNotificationService.generateIndividualNotificationLetter(content)
breachNotificationService.generateIndividualNotificationEmail(content)
breachNotificationService.generateHMRCNotification(breach, orgDetails)

// Utilities
breachNotificationService.getICOFormData(icoNotification)
breachNotificationService.getNotificationDeadline(breachDetectedAt)
```

## References

- [ICO Personal Data Breaches Guide](https://ico.org.uk/for-organisations/report-a-breach/)
- [ICO Breach Reporting Assessment](https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach-assessment/)
- [UK GDPR Article 33 - Notification to ICO](https://www.legislation.gov.uk/eur/2016/679/article/33)
- [UK GDPR Article 34 - Communication to Data Subject](https://www.legislation.gov.uk/eur/2016/679/article/34)
- [NCSC Incident Management](https://www.ncsc.gov.uk/collection/incident-management)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-20
**Review Date:** 2025-07-20

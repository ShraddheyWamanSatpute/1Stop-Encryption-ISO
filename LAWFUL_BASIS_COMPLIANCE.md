# Lawful Basis for Data Processing - UK GDPR Compliance Guide

This document outlines the implementation of lawful basis requirements for UK GDPR compliance in payroll processing operations.

## Overview

Under UK GDPR, **every** data processing activity must have a valid lawful basis documented **before** processing begins. This guide covers:

1. Article 6 - Lawful Basis for Processing
2. Article 9 - Special Category Data Conditions
3. Article 10 - Criminal Offence Data
4. Implementation in this codebase

## 1. Determining Lawful Basis (Article 6)

### Available Lawful Bases

| Basis | Article | When to Use |
|-------|---------|-------------|
| **Consent** | 6(1)(a) | Individual has given clear, affirmative consent |
| **Contract** | 6(1)(b) | Processing necessary to fulfil a contract |
| **Legal Obligation** | 6(1)(c) | Required by UK law |
| **Vital Interests** | 6(1)(d) | To protect someone's life |
| **Public Task** | 6(1)(e) | Official function or task in public interest |
| **Legitimate Interests** | 6(1)(f) | Your legitimate business interests (with balance test) |

### Payroll Processing Lawful Bases

Most payroll processing relies on **Legal Obligation** or **Contract**:

```typescript
import { lawfulBasisService, STANDARD_LAWFUL_BASIS_MAPPINGS } from './services/gdpr';

// View standard mappings
console.log(STANDARD_LAWFUL_BASIS_MAPPINGS.hmrc_fps_submission);
// {
//   basis: 'legal_obligation',
//   justification: 'Legal requirement to report payroll data to HMRC...',
//   legalReference: 'PAYE Regulations 2003 (as amended), Income Tax Act 2007'
// }
```

| Processing Activity | Lawful Basis | Legal Reference |
|---------------------|--------------|-----------------|
| HMRC FPS Submission | Legal Obligation | PAYE Regulations 2003 |
| HMRC EPS Submission | Legal Obligation | PAYE Regulations 2003 |
| Tax Calculations | Legal Obligation | Income Tax Act 2003 |
| Payroll Processing | Contract | Employment Rights Act 1996 |
| Payslip Generation | Legal Obligation | ERA 1996, Section 8 |
| P45/P60 Generation | Legal Obligation | PAYE Regulations 2003 |
| Pension Submissions | Legal Obligation | Pensions Act 2008 |
| Bank Payments | Contract | Employment contract |
| Audit Logging | Legitimate Interests | Security requirement |
| Marketing | Consent | PECR 2003 |

## 2. Documenting Lawful Basis Before Processing

### Requirement

UK GDPR requires that lawful basis is **determined and documented before** any processing occurs. This is not optional.

### Implementation

```typescript
import { lawfulBasisService } from './services/gdpr';

// Document lawful basis for a processing activity
async function setupProcessingBasis(companyId: string, userId: string) {
  // Document HMRC submission basis
  const record = await lawfulBasisService.documentLawfulBasis(
    companyId,
    userId,
    'hmrc_fps_submission',
    {
      dataCategories: ['identity', 'financial', 'tax'],
      dataSubjects: ['employees', 'contractors'],
      reviewFrequencyMonths: 12,
    }
  );

  console.log(`Documented lawful basis: ${record.lawfulBasis}`);
  console.log(`Justification: ${record.justification}`);
  console.log(`Legal reference: ${record.legalReference}`);
}
```

### Validate Before Processing

```typescript
// ALWAYS validate before processing data
async function submitToHMRC(companyId: string, data: PayrollData) {
  // Validate lawful basis exists
  const validation = await lawfulBasisService.validateProcessingBasis(
    companyId,
    'hmrc_fps_submission'
  );

  if (!validation.valid) {
    throw new Error(`Cannot process: ${validation.error}`);
  }

  // Proceed with submission
  return await hmrcApiClient.submitFPS(data);
}
```

### Initialize Standard Bases for New Company

```typescript
// When a new company is onboarded
async function onboardCompany(companyId: string, adminUserId: string) {
  // Initialize all standard lawful basis records
  const records = await lawfulBasisService.initializeStandardBasis(
    companyId,
    adminUserId
  );

  console.log(`Initialized ${records.length} lawful basis records`);
}
```

## 3. Including Lawful Basis in Privacy Notices

### Requirement

Privacy notices **must** inform individuals of:
- The lawful basis for each processing activity
- Why that basis applies
- Their rights under that basis

### Implementation

The `PrivacyPolicy.ts` service includes comprehensive lawful basis documentation:

```typescript
import { privacyPolicyService, lawfulBasisService } from './services/gdpr';

// Get formatted lawful basis for privacy notice
async function getLawfulBasisForPrivacyNotice(companyId: string) {
  const exportData = await lawfulBasisService.exportForPrivacyNotice(companyId);

  // Returns structured data for privacy policy display
  // {
  //   activities: [
  //     {
  //       activity: 'HMRC FPS Submission',
  //       purpose: 'Submit payroll data to HMRC via RTI',
  //       lawfulBasis: 'Legal Obligation (Article 6(1)(c))',
  //       dataCategories: ['identity', 'financial', 'tax'],
  //       retention: '6 years after tax year of submission'
  //     },
  //     ...
  //   ],
  //   lastUpdated: 1705708800000
  // }

  return exportData;
}
```

### Privacy Policy Section 4

The privacy policy automatically includes a Lawful Basis section that explains:
- Each lawful basis type used
- Which processing activities use each basis
- The relevant legal references
- Special category data conditions

## 4. Special Category Data (Article 9)

### What is Special Category Data?

Special category data requires **additional protection**:

| Category | Examples in Payroll |
|----------|---------------------|
| Health Data | SSP, SMP, disability information |
| Trade Union Membership | Union subscription deductions |
| Racial/Ethnic Origin | Diversity monitoring (if collected) |
| Religious Beliefs | Religious holiday accommodations |
| Criminal Offence Data | DBS check results (Article 10) |

### Dual Requirement

Processing special category data requires **BOTH**:
1. Article 6 lawful basis (e.g., legal obligation)
2. Article 9 condition (e.g., employment/social security)

### Implementation

```typescript
import { specialCategoryDataService } from './services/gdpr';

// Document special category processing for SSP
async function setupSSPProcessing(companyId: string, userId: string) {
  const record = await specialCategoryDataService.documentStandardPayrollCondition(
    companyId,
    userId,
    'statutory_sick_pay',
    {
      additionalSafeguards: ['Manager access restricted to duration only'],
    }
  );

  // Record includes:
  // - article6Basis: 'legal_obligation'
  // - article9Condition: 'employment_social_security'
  // - schedule1Condition: 'employment_condition'
  // - safeguards: ['Access restricted...', 'Encrypted...', etc.]
}
```

### Schedule 1 Conditions (DPA 2018)

UK law provides additional conditions in Schedule 1 of the Data Protection Act 2018:

**Part 1 - Employment, Health, Research:**
- Employment, social security, social protection
- Health or social care purposes
- Public health
- Research purposes

**Part 2 - Substantial Public Interest (requires Appropriate Policy Document):**
- Statutory/government purposes
- Preventing/detecting unlawful acts
- Regulatory requirements
- Insurance purposes
- Occupational pensions

### Validate Before Processing Special Category Data

```typescript
async function processSSP(companyId: string, employeeId: string, healthData: HealthInfo) {
  // Validate Article 9 conditions exist
  const validation = await specialCategoryDataService.validateSpecialCategoryProcessing(
    companyId,
    'health_data'
  );

  if (!validation.valid) {
    throw new Error(`Cannot process health data: ${validation.error}`);
  }

  // Proceed with SSP calculation
  return await calculateSSP(employeeId, healthData);
}
```

## 5. Criminal Offence Data (Article 10)

### Requirements

Criminal offence data (e.g., DBS check results) can only be processed:
- Under the control of official authority, OR
- With specific legal basis under domestic law

### Implementation

```typescript
// Document DBS check processing
const record = await specialCategoryDataService.documentStandardPayrollCondition(
  companyId,
  userId,
  'dbs_check_results',
  {
    policyDocumentRef: 'APD-DBS-2024-001', // Appropriate Policy Document required
  }
);
```

### Appropriate Policy Document

Schedule 1 Part 2 conditions require an Appropriate Policy Document:

```typescript
// Generate template for policy document
const template = specialCategoryDataService.generatePolicyDocumentTemplate(
  'ACME Payroll Ltd',
  'Processing DBS check results for regulated roles',
  'preventing_fraud'
);

// Template includes:
// - Company details
// - Processing purpose
// - Schedule 1 condition relied upon
// - Compliance procedures for all data protection principles
// - Retention and erasure policies
// - Data subject rights
// - Safeguards
// - Review schedule
```

## 6. Review Requirements

### Regular Reviews

| Data Type | Review Frequency |
|-----------|------------------|
| Standard Processing | 12 months |
| Special Category Data | 6 months |
| Criminal Offence Data | 6 months |
| Consent-based Processing | Verify consent annually |

### Implementation

```typescript
// Get records requiring review
const lawfulBasisReviews = await lawfulBasisService.getRecordsRequiringReview(companyId);
const specialCategoryReviews = await specialCategoryDataService.getRecordsRequiringReview(companyId);

if (lawfulBasisReviews.length > 0 || specialCategoryReviews.length > 0) {
  console.warn('Lawful basis records require review before continued processing');
  // Notify compliance officer
}

// Mark as reviewed after verification
await lawfulBasisService.markAsReviewed(companyId, recordId, userId);
await specialCategoryDataService.markAsReviewed(companyId, recordId, userId, 'Annual review completed');
```

## 7. Compliance Checklist

### Before Processing Any Data

- [ ] Identify all data categories being processed
- [ ] Determine appropriate lawful basis
- [ ] Document lawful basis with justification
- [ ] If special category data, identify Article 9 condition
- [ ] If criminal offence data, ensure appropriate safeguards and policy document
- [ ] Include in privacy notice
- [ ] Set review schedule

### Ongoing Compliance

- [ ] Validate lawful basis before each processing activity
- [ ] Review records before expiry
- [ ] Update privacy notices when processing changes
- [ ] Maintain Appropriate Policy Documents where required
- [ ] Log all special category data access

### Rights by Lawful Basis

| Right | Consent | Contract | Legal Obligation | Legitimate Interests |
|-------|---------|----------|------------------|----------------------|
| Access | Yes | Yes | Yes | Yes |
| Rectification | Yes | Yes | Yes | Yes |
| Erasure | Yes | Limited | No | Yes |
| Restrict | Yes | Yes | Yes | Yes |
| Portability | Yes | Yes | No | No |
| Object | Yes | No | No | Yes |
| Withdraw | Yes | N/A | N/A | N/A |

## 8. API Reference

### LawfulBasisService

```typescript
// Document lawful basis
lawfulBasisService.documentLawfulBasis(companyId, userId, activity, options)

// Validate processing
lawfulBasisService.validateProcessingBasis(companyId, activity)

// Get all records
lawfulBasisService.getLawfulBasisRecords(companyId)

// Get by activity
lawfulBasisService.getLawfulBasisByActivity(companyId, activity)

// Initialize standard bases
lawfulBasisService.initializeStandardBasis(companyId, userId)

// Export for privacy notice
lawfulBasisService.exportForPrivacyNotice(companyId)

// Get records requiring review
lawfulBasisService.getRecordsRequiringReview(companyId)

// Mark as reviewed
lawfulBasisService.markAsReviewed(companyId, recordId, userId)
```

### SpecialCategoryDataService

```typescript
// Document special category processing
specialCategoryDataService.documentSpecialCategoryProcessing(companyId, userId, options)

// Use standard payroll condition
specialCategoryDataService.documentStandardPayrollCondition(companyId, userId, scenario, options)

// Validate processing
specialCategoryDataService.validateSpecialCategoryProcessing(companyId, specialCategoryType)

// Get records
specialCategoryDataService.getProcessingRecords(companyId)

// Get records requiring review
specialCategoryDataService.getRecordsRequiringReview(companyId)

// Mark as reviewed
specialCategoryDataService.markAsReviewed(companyId, recordId, userId, notes?)

// Suspend processing
specialCategoryDataService.suspendProcessing(companyId, recordId, userId, reason)

// Export for audit
specialCategoryDataService.exportForAudit(companyId)

// Generate policy document template
specialCategoryDataService.generatePolicyDocumentTemplate(companyName, purpose, condition)
```

## 9. References

### ICO Guidance

- [Lawful Basis for Processing](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/)
- [Legitimate Interests](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/legitimate-interests/)
- [Special Category Data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/)
- [Criminal Offence Data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/criminal-offence-data/)

### Legislation

- UK General Data Protection Regulation (UK GDPR)
- Data Protection Act 2018
- PAYE Regulations 2003 (as amended)
- Income Tax (Earnings and Pensions) Act 2003
- Employment Rights Act 1996
- Pensions Act 2008
- Social Security Contributions and Benefits Act 1992

### HMRC Requirements

- [HMRC Developer Hub](https://developer.service.hmrc.gov.uk/)
- [RTI Technical Specifications](https://www.gov.uk/guidance/what-payroll-information-to-report-to-hmrc)
- [HMRC Privacy Notice](https://www.gov.uk/government/publications/data-protection-act-dpa-information-hm-revenue-and-customs-hold-about-you)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-20
**Review Date:** 2025-07-20

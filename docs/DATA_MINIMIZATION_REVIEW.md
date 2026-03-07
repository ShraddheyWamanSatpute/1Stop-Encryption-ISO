# Data Minimization Review

**Standards:** GDPR Article 5(1)(c), ISO 27701, SOC 2 Privacy
**Scope:** User, employee, company, customer data. No health data processing.
**Date:** March 2026

---

## Principle

Data minimization requires that personal data collected is adequate, relevant, and limited to what is necessary for the purpose of processing. This review maps PII fields to their business justification.

---

## 1. Employee / HR Data

| PII Field | Justification | Necessary | Notes |
|-----------|--------------|-----------|-------|
| firstName, lastName | Employment identity | Yes | Required for contracts, payroll |
| email | Work communication | Yes | Primary contact method |
| phone | Emergency contact, scheduling | Yes | Operational necessity |
| dateOfBirth | Statutory: age verification, pension auto-enrolment, NMW bands | Yes | UK employment law requires age-based calculations |
| nationalInsuranceNumber | HMRC payroll (RTI submissions) | Yes | Legal obligation (encrypted at rest) |
| gender | Statutory: SMP/SPP eligibility, equality monitoring | Justified | Required for statutory pay; equality monitoring optional |
| ethnicity | Equality Act 2010 monitoring (optional) | Optional | Mark as opt-in; not required for payroll |
| photo | Employee identification | Optional | Convenience only; not business-critical |
| address | Payroll (P45/P46), emergency contact | Yes | HMRC RTI requires employee address |
| bankDetails | Salary payment | Yes | Required for BACS payment (encrypted at rest) |
| taxCode, niCategory | HMRC payroll compliance | Yes | Legal obligation |
| emergencyContact | H&S regulations | Yes | Employer duty of care |
| salary, hourlyRate | Payroll | Yes | Employment contract |
| studentLoanPlan | HMRC deduction obligation | Yes | Legal obligation |
| pensionScheme | Auto-enrolment compliance | Yes | Legal obligation |
| rightToWorkVerified | Immigration Act 2016 | Yes | Legal obligation |
| documents | Employment records | Yes | Contract evidence |
| qualifications | Role requirements | Justified | Relevant for role allocation |

### Actions
- [x] `ethnicity` field is optional in the interface (not required)
- [x] `photo` field is optional in the interface
- [x] All sensitive fields encrypted via `SensitiveDataService.ts`
- [ ] Consider adding a note in the employee form that `ethnicity` is voluntary

---

## 2. Customer / Booking Data

| PII Field | Justification | Necessary | Notes |
|-----------|--------------|-----------|-------|
| firstName, lastName | Booking identification | Yes | Required for reservation |
| email | Booking confirmation | Yes | Communication channel |
| phone | Booking contact, day-of communication | Yes | Operational necessity |
| company | Corporate bookings attribution | Justified | Relevant for B2B bookings |
| specialRequests | Service quality | Justified | Guest experience |
| dietaryRequirements | Allergy/safety, service | Justified | Food safety obligation (not processed as health data) |
| visitCount, totalSpent | Customer relationship | Justified | Loyalty and service improvement |
| lastVisit | Customer relationship | Justified | Service context |
| preferences | Service personalization | Justified | Guest experience |
| vip | Service level indicator | Justified | Operational flag |
| marketingConsent | GDPR consent tracking | Yes | Required for lawful marketing |

### Actions
- [x] `dietaryRequirements` treated as operational data (food safety), not health data
- [x] `marketingConsent` tracked explicitly per GDPR
- [x] Customer data subject to retention policy via `DataRetentionService.ts`

---

## 3. User Settings / Profile Data

| PII Field | Justification | Necessary | Notes |
|-----------|--------------|-----------|-------|
| displayName, email | Account identity | Yes | |
| phoneNumber | Account recovery, contact | Justified | Optional for non-employee users |
| address | Payroll (employees only) | Conditional | Only needed for employees receiving payment |
| bankDetails | Salary payment | Conditional | Only for employees |
| niNumber | HMRC (employees only) | Conditional | Only for employees |
| avatar/photoURL | UI personalization | Optional | Not business-critical |

### Actions
- [x] Bank details and NI number only collected for employees (not all users)
- [x] Sensitive fields encrypted at rest

---

## 4. Company / Finance Contact Data

| PII Field | Justification | Necessary | Notes |
|-----------|--------------|-----------|-------|
| Primary/billing/technical contact | Business relationship | Yes | Required for service delivery |
| Supplier contact details | Procurement operations | Yes | Required for ordering |
| Finance contact details | Invoice processing | Yes | Required for accounts |

### Actions
- [x] Contact data limited to business context (name, email, phone, role)
- [x] No unnecessary personal data collected for business contacts

---

## 5. Special Category Data (GDPR Article 9)

| Data Type | Collected | Justification | Status |
|-----------|-----------|---------------|--------|
| Health data | No | Out of scope | Not processed |
| Ethnic origin | Optional field | Equality Act monitoring (voluntary) | Opt-in only |
| Religious beliefs | No | Not collected | N/A |
| Trade union membership | No | Not collected | N/A |
| Biometric data | No | Not collected | N/A |
| Criminal records | No | Not collected | N/A |

---

## Summary

**Finding:** The PII collected is adequate and relevant for the stated business purposes (hospitality management, HR, payroll, HMRC compliance). No fields were identified as clearly unnecessary given the UK employment law and hospitality operational requirements.

**Recommendations:**
1. Mark `ethnicity` as clearly voluntary/opt-in in the UI
2. `photo` field should be clearly optional in the employee form
3. Continue enforcing field-level encryption for all sensitive PII
4. Review data models annually for any newly added fields

**Data minimization status:** Compliant (GDPR Art. 5(1)(c))

# HMRC GDPR Compliance – Work Summary

**Reference:** Hmrc Gdpr Compliance Guide.pdf  
**Format:** File name | Relative path | Purpose | Work done

---

## 1. GDPR Services (`src/backend/services/gdpr/`)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **index.ts** | `src/backend/services/gdpr/index.ts` | Exports all GDPR services | Central export for 13 GDPR services; re-exports types for Consent, Breach, DSAR, Audit, LawfulBasis, SpecialCategory, Retention; provides single import path for frontend/backend |
| **types.ts** | `src/backend/services/gdpr/types.ts` | UK GDPR / HMRC type definitions | Defines all 6 lawful bases (consent, contract, legal_obligation, vital_interests, public_task, legitimate_interests); ConsentRecord, ConsentPurpose; DataBreachIncident, BreachSeverity, BreachStatus; DSAR types; AuditLogEntry, AuditAction; DataRetentionPolicy; DataSubjectAccessRequest |
| **PrivacyPolicy.ts** | `src/backend/services/gdpr/PrivacyPolicy.ts` | Privacy policy content & versioning | Full 16-section policy: Introduction, Data Controller, Data Collected, Lawful Basis (all 6), HMRC data processing, Data Sharing, Retention, Security, Your Rights (access/rectification/erasure/portability/object/complaints), Automated Decisions, International Transfers, Cookies, Breach Notification, Policy Changes, Contact, Complaints; versioning; company-specific content |
| **ConsentService.ts** | `src/backend/services/gdpr/ConsentService.ts` | Consent management | recordConsent() with lawful basis, policy version, method (explicit/opt_in); withdrawConsent(); hasConsent() check; getUserConsents(); IP address masked before storage (GDPR); stores to Firebase compliance/consent; validates consent before processing |
| **LawfulBasisService.ts** | `src/backend/services/gdpr/LawfulBasisService.ts` | Lawful basis (Art. 6) | documentLawfulBasis() – requires basis BEFORE processing; STANDARD_LAWFUL_BASIS_MAPPINGS for payroll, tax, HMRC FPS/EPS, pensions, SSP/SMP/SPP; validates lawful basis; tracks review schedule; links to privacy notice; 18+ processing activity types |
| **DataBreachService.ts** | `src/backend/services/gdpr/DataBreachService.ts` | Breach incident tracking | reportBreach(); assessICONotificationRequired() and assessUserNotificationRequired(); HMRC notification if payroll/tax affected; 72h deadline tracking; encrypts breach description/consequences; documentRootCause(), documentRemediation(), documentPreventiveMeasures(); severity (low/medium/high/critical); status workflow |
| **BreachResponsePlanService.ts** | `src/backend/services/gdpr/BreachResponsePlanService.ts` | Breach response plans | createOrUpdatePlan(); 9 roles (incident_coordinator, DPO, technical_lead, etc.); 7 phases (detection, containment, assessment, notification, investigation, remediation, review); escalation matrix by severity; ICO/HMRC contact info; BreachTrainingRecord; task checklists; notification priorities |
| **BreachNotificationService.ts** | `src/backend/services/gdpr/BreachNotificationService.ts` | Breach notifications | Generates ICO notification content; Individual notification content; HMRC notification content; templates for 72h ICO report; templates for user notification (Art. 34); compliant with UK GDPR Art. 33 & 34 |
| **DSARService.ts** | `src/backend/services/gdpr/DSARService.ts` | Data subject access requests | Handles Art. 15 (access), 16 (rectification), 17 (erasure), 18 (restriction), 20 (portability), 21 (objection); submitRequest(), processAccessRequest(); 1-month response deadline; identity verification tracking; extended timeline for complex requests; integration with AuditTrailService |
| **DataRetentionService.ts** | `src/backend/services/gdpr/DataRetentionService.ts` | Retention policies | DEFAULT_RETENTION_POLICIES: payroll 6yr, HMRC submissions 6yr, P45/P60 6yr, employment 6yr, audit 6–7yr, consent 6yr, breach 6yr; createRetentionSchedule(); trackRecord(); archive/delete/anonymize actions; review tasks; legal basis per category |
| **AuditTrailService.ts** | `src/backend/services/gdpr/AuditTrailService.ts` | Audit logging | log() for create/read/update/delete/export; masks email, IP, PII in stored logs; 6-year retention; HMRC submission tracking; sanitizes previousValue/newValue; supports company, site, subsite; requestId, userAgent |
| **SecurityIncidentService.ts** | `src/backend/services/gdpr/SecurityIncidentService.ts` | Security incident reporting | Reports security incidents; severity levels; response actions; incident types; tracks non-breach security events; supports compliance reporting |
| **SpecialCategoryDataService.ts** | `src/backend/services/gdpr/SpecialCategoryDataService.ts` | Art. 9 & 10 data | Handles special category data (health, ethnicity, etc.) per Art. 9; criminal offence data per Art. 10; PAYROLL_SPECIAL_CATEGORY_CONDITIONS; documents conditions for processing; required for SSP/health data |

---

## 2. Encryption Services (`src/backend/services/encryption/`)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **index.ts** | `src/backend/services/encryption/index.ts` | Encryption module exports | Re-exports SensitiveDataService, KeyManagementService, all field configs (EMPLOYEE_ENCRYPTED_FIELDS, PAYROLL_ENCRYPTED_FIELDS, etc.); single import path for encryption |
| **SensitiveDataService.ts** | `src/backend/services/encryption/SensitiveDataService.ts` | Field-level encryption for PII | CRITICAL: encrypts NI number, DOB, bank (account/sort/IBAN), tax ID/code, P45 data; HIGH: email, phone, salary, hourlyRate; Payroll: grossPay, netPay, tax/NI/pension deductions, YTD data; Company: tax ID, VAT, corporation tax, bank; User settings: bank, NI, taxCode; encryptEmployeeData(), decryptEmployeeData(), encryptPayrollData(), encryptCompanyData(); maskForDisplay(); ENC: marker; backward compatibility with legacy format; dot-notation for nested fields |
| **KeyManagementService.ts** | `src/backend/services/encryption/KeyManagementService.ts` | Encryption key lifecycle | Key rotation support; key storage separate from data (Firebase Secrets); per HMRC and UK GDPR Art. 32 |
| **EncryptionInitializer.tsx** | `src/backend/services/encryption/EncryptionInitializer.tsx` | App startup encryption init | EncryptionProvider wraps app; reads key from env/context; calls sensitiveDataService.initialize() on mount; graceful fallback if key missing; initialises before any data ops |

---

## 3. Core Encryption (`src/backend/utils/`)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **EncryptionService.ts** | `src/backend/utils/EncryptionService.ts` | AES-256-GCM encryption | encrypt()/decrypt() using Web Crypto API; AES-256-GCM; random 16-byte salt per encryption; random 12-byte IV; PBKDF2 key derivation (100k iterations, SHA-256); Version 2 format (version + salt + IV + ciphertext); backward compat with Version 1; hash() for comparisons; DataMasking: maskNI(), maskPAYE(), maskEmail(), maskPhone(), maskBankAccount(), maskSortCode(), maskIBAN(); base64 encoding |
| **SanitizedLogger.ts** | `src/backend/utils/SanitizedLogger.ts` | Logging without PII | createLogger() with sanitization; automatically redacts NI numbers, emails, bank details, tokens from log output; gdpr logger channel; ICO guidance compliant – avoids storing PII in logs |

---

## 4. Data Layer – Encryption Integration (`src/backend/rtdatabase/`)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **HRs.tsx** | `src/backend/rtdatabase/HRs.tsx` | Employee CRUD | createEmployee(): calls sensitiveDataService.encryptEmployeeData() before set(); updateEmployee(): encrypts before update; fetchEmployees(): calls decryptEmployeeData() after get(); checks isInitialized(); graceful fallback with warning if encryption not ready; all NI, DOB, bank, tax, salary, contact fields encrypted |
| **Company.tsx** | `src/backend/rtdatabase/Company.tsx` | Company data | Encrypts company data (tax ID, VAT, corporation tax, bank details) before save; decrypts on fetch; uses encryptCompanyData()/decryptCompanyData(); financialDetails.bankDetails encrypted |
| **Finance.tsx** | `src/backend/rtdatabase/Finance.tsx` | Finance data | Uses BANK_ACCOUNT_ENCRYPTED_FIELDS; encrypts accountNumber on bank accounts before save; decrypts on fetch; integrates with SensitiveDataService for finance records |
| **Settings.tsx** | `src/backend/rtdatabase/Settings.tsx` | Settings | Encrypts user personal settings (bank details, NI number, tax code) via USER_PERSONAL_ENCRYPTED_FIELDS; decrypts when loading; SensitiveDataService integration |

---

## 5. HMRC Services (`src/backend/services/hmrc/`)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **index.ts** | `src/backend/services/hmrc/index.ts` | HMRC service exports | Exports HMRCAPIClient, HMRCAuthService, HMRCTokenEncryption, RTIXMLGenerator, RTIValidationService, FraudPreventionService; single import path |
| **HMRCTokenEncryption.ts** | `src/backend/services/hmrc/HMRCTokenEncryption.ts` | OAuth token encryption | Encrypts access_token and refresh_token before Firebase storage; decrypts for API calls; uses EncryptionService (AES-256-GCM); version tracking; supports legacy unencrypted tokens; validateToken() |
| **HMRCAuthService.ts** | `src/backend/services/hmrc/HMRCAuthService.ts` | HMRC auth flows | OAuth 2.0 flow; token exchange; refresh token logic; company/site/subsite scoping; integrates with SecureTokenStorage |
| **HMRCAPIClient.ts** | `src/backend/services/hmrc/HMRCAPIClient.ts` | HMRC API calls | All URLs use https://; TLS 1.2+ enforced; FPS/EPS/EYU submission endpoints; Fraud Prevention headers; no credentials in client |
| **SecureTokenStorage.ts** | `src/backend/services/oauth/SecureTokenStorage.ts` | OAuth token storage | AES-256-GCM encryption before storage; keys from Firebase Secrets (never in code); stores encrypted tokens in Firebase; decrypts only when needed for API; token metadata queries without decryption |

---

## 6. Payroll & Functions

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **PayrollCalculation.tsx** | `src/backend/functions/PayrollCalculation.tsx` | Payroll calc | createPayrollRecord(): encrypts grossPay, netPay, tax/NI/pension deductions, YTD fields before saving; fetchEmployee(): decrypts employee data; uses SensitiveDataService; UK GDPR Art. 32 compliant; comment documents compliance |
| **HMRCSettings.tsx** | `src/backend/functions/HMRCSettings.tsx` | HMRC settings | Stores HMRC OAuth tokens: encrypts via HMRCTokenEncryption before Firebase; decrypts when calling HMRC APIs; company/site/subsite isolation; token refresh handling |
| **HMRCRTISubmission.tsx** | `src/backend/functions/HMRCRTISubmission.tsx` | RTI submission | Client-side orchestrator for RTI; calls Firebase submitRTI function; prepares XML payload; handles FPS/EPS/EYU; no credentials in client; server-side submission only |

---

## 7. Firebase Functions (`functions/`)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **hmrcOAuth.ts** | `functions/src/hmrcOAuth.ts` | HMRC OAuth | exchangeHMRCToken: server-side code-for-tokens; refreshHMRCToken: token refresh; defineSecret() for HMRC_CLIENT_ID, HMRC_CLIENT_SECRET; REJECTS requests containing clientId/clientSecret (security check); CORS enabled; credentials never accepted from client; TLS for all HMRC calls |
| **hmrcRTISubmission.ts** | `functions/src/hmrcRTISubmission.ts` | RTI submissions | submitRTI: server-side proxy for FPS/EPS/EYU; HMRC API has no CORS – all calls via function; maskPAYEReference() – masks employer ref in audit logs (GDPR); logAuditEntry() – no PII; auditLogs/hmrcSubmissions; credentials from Secrets only |
| **secureRequestGuard.ts** | `functions/src/guards/secureRequestGuard.ts` | Request security | Validates HMRC-related requests; auth checks; prevents unauthorized access to HMRC endpoints |
| **EncryptionService.ts** | `functions/src/encryption/EncryptionService.ts` | Server-side encryption | AES-256-GCM for Firebase Functions; same algo as client EncryptionService; used for server-side token/data encryption |

---

## 8. Frontend – Privacy & Consent

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **PrivacyPolicy.tsx** | `src/frontend/pages/PrivacyPolicy.tsx` | Privacy policy page | Loads policy via PrivacyPolicyService.getPrivacyPolicy() with company name, address, DPO; renders all 16 sections with markdown-style formatting; displays “UK GDPR and Data Protection Act 2018” notice; uses CompanyContext for company data |
| **EmployeeCRUDForm.tsx** | `src/frontend/components/hr/forms/EmployeeCRUDForm.tsx` | Employee form | Employee add/edit form; includes dataConsentGiven, dataConsentDate, payslipEmailConsent fields (HRs interface); ConsentService integration to be wired for recording consent at save |

---

## 9. Interfaces

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **HRs.tsx** | `src/backend/interfaces/HRs.tsx` | Employee/HR types | Employee interface: dataConsentGiven (bool), dataConsentDate (timestamp), payslipEmailConsent (bool); GDPR & Data Protection section; supports consent tracking for payroll/HR processing |

---

## 10. Database Rules

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **database.rules.json** | `database.rules.json` | Firebase RTDB rules | compliance/consent: owner/admin read; user can read own consent; compliance/dataBreaches: owner/admin only; compliance/dataRetention: owner/admin only; auditLogs: owner/admin; auditLogs/hmrcSubmissions: owner/admin; HMRC settings: owner/admin; RBAC via users/{uid}/companies/{companyId}/role; company-level isolation; no cross-company access |

---

## 11. Documentation

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **DATA_SECURITY_ENCRYPTION_GUIDE.md** | `DATA_SECURITY_ENCRYPTION_GUIDE.md` | Encryption for developers | Developer guide: UK GDPR Art. 32, HMRC requirements; data flow diagram; TLS 1.3; fields to encrypt (identity, financial, tax, OAuth, contact); usage examples for employee, payroll, company; developer checklist; key management |
| **PERSONAL_DATA_BREACHES_GUIDE.md** | `PERSONAL_DATA_BREACHES_GUIDE.md` | Breach management | UK GDPR Art. 33 & 34; breach response plan setup with BreachResponsePlanService; team roles, escalation matrix; DataBreachService usage; ICO 72h; BreachNotificationService; code examples; action items table |
| **LAWFUL_BASIS_COMPLIANCE.md** | `LAWFUL_BASIS_COMPLIANCE.md` | Lawful basis (Art. 6) | All 6 bases with Article refs; payroll mappings (contract, legal_obligation); LawfulBasisService usage; document before processing; special category (Art. 9/10); code examples |
| **ENCRYPTION_AND_PRIVACY_ASSESSMENT.md** | `ENCRYPTION_AND_PRIVACY_ASSESSMENT.md` | Privacy assessment | Assessment vs HMRC GDPR Guide PDF; component-by-component status (Encryption, Employee, Payroll, Company, Privacy Policy, Consent); matches documentation verification; gaps noted |
| **SECURITY_PRIVACY_IMPLEMENTATION_COMPLETE.md** | `SECURITY_PRIVACY_IMPLEMENTATION_COMPLETE.md` | Security/privacy checklist | Maps PDF requirements 1–10 to implementation; OAuth, encryption, lawful basis, breach, RBAC, marketing; verification table; service descriptions |
| **ENGINEERING_CONTROLS_VERIFICATION.md** | `ENGINEERING_CONTROLS_VERIFICATION.md` | Engineering controls | ISO 27001, SOC 2, GDPR, PCI DSS; TLS 1.2+ enforcement; HSTS; AES-256 at rest; key management; PBKDF2; GDPR Art. 32; file verification list |
| **HMRC_COMPLIANCE_CHECKLIST.md** | `HMRC_COMPLIANCE_CHECKLIST.md` | Payroll/HMRC checklist | Full checklist: employee fields, tax, NI, student loans, RTI, payslips, year-end, pensions, statutory pay; GDPR partial; data security basic; remaining gaps listed |
| **HMRC_COMPLIANCE_AUDIT_REPORT.md** | `HMRC_COMPLIANCE_AUDIT_REPORT.md` | Compliance audit | Scope: HMRC API, GDPR, data protection; audit findings; compliance status |
| **NEXT_STEPS_ENGINEERING_CONTROLS.md** | `NEXT_STEPS_ENGINEERING_CONTROLS.md` | Next steps | Post-implementation: test RS256, update prod env vars, JWT key setup; testing commands; deployment platforms |

---

## 12. Auth & Security (YourStop)

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **auth-service.ts** | `src/yourstop/backend/lib/auth-service.ts` | Auth service | JWT signing with RS256 (asymmetric); verify with public key; GDPR Art. 32 – stronger crypto than HS256; register, login, verify endpoints |
| **jwt-keys.ts** | `src/yourstop/backend/lib/jwt-keys.ts` | RSA key management | Loads JWT_PRIVATE_KEY, JWT_PUBLIC_KEY from env; PEM format; used by auth-service for RS256 |
| **JWT_RS256_MIGRATION_GUIDE.md** | `src/yourstop/backend/JWT_RS256_MIGRATION_GUIDE.md` | RS256 migration | Step-by-step migration from HS256 to RS256; key generation; env setup; testing; GDPR Art. 32 alignment |

---

## 13. Configuration

| File | Path | Purpose | Work Done |
|------|------|---------|-----------|
| **keys.ts** | `src/config/keys.ts` | Config/keys | Reads VITE_ENCRYPTION_KEY or ENCRYPTION_KEY from env; used by EncryptionInitializer; keys never in source |
| **env.example** | `.env.example` | Env template | Documents ENCRYPTION_KEY, VITE_ENCRYPTION_KEY; HMRC-related vars; Firebase config |
| **functions/env.example** | `functions/env.example` | Functions env | HMRC_CLIENT_ID, HMRC_CLIENT_SECRET (via Firebase Secrets); env vars for functions |

---

# Remaining Work

| Item | Priority | Notes |
|------|----------|------|
| **SAR automation** | High | DSARService present; automated workflow/UI still partial |
| **Company financial data encryption** | ~~Medium~~ DONE | getCompanyFromDb now decrypts on fetch; create/update already encrypted |
| **Finance bank account encryption** | ~~Medium~~ DONE | Bank accounts: create/update encrypt, fetch decrypts accountNumber |
| **Privacy policy UI verification** | ~~Low~~ DONE | Routes exist; Register page has link; Employee form has link |
| **Register/Employee form consent** | ~~Medium~~ DONE | Register: checkbox + link; EmployeeCRUDForm: dataConsentGiven checkbox, formRef submit |
| **Tax/NI calculations** | ~~Critical~~ DONE | TaxCalculation.ts, NICalculation.ts, StudentLoanCalculation.ts; cumulative, Week1/Month1, all tax codes, NI categories, director method; getDefaultTaxYearConfig 2024-25 |
| **HMRC RTI FPS/EPS** | ~~Critical~~ DONE | RTIXMLGenerator (FPS/EPS/EYU); HMRCRTISubmission (submitFPSForPayrollRun, submitEPS); RTISubmissionTab UI; Firebase submitRTI; OAuth, FraudPrevention |
| **Employee payroll fields** | ~~High~~ DONE | EmployeeCRUDForm: taxCode, taxCodeBasis, niCategory, starterDeclaration, studentLoanPlan, hasPostgraduateLoan, isDirector, paymentFrequency |
| **CI/CD & sandbox tests** | Medium | Config present; automated HMRC sandbox tests to complete |
| **Penetration testing** | Medium | Documented; formal pentest to perform |

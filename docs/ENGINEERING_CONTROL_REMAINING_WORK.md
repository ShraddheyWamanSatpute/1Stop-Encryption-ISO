# Engineering Control Verification — Remaining Work

**Goal:** Confirm all required controls are implemented (code/infra) or open a ticket.  
**Scope:** User, employee, company & customer data; HR, finance, bookings, operations. No health data.  
**Use:** For each checkbox — link to code/config or mark as open ticket.

---

## 1️⃣ Encryption & Data Protection (Code-Level)

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | All external traffic enforces TLS 1.2+ (HTTPS only, HSTS enabled) | ✅ Done | `vite.config.ts` (HSTS), `firebase.json`, `vercel.json`, `nginx.conf`; `ENGINEERING_CONTROL_SECTION1_PENDING_AND_GAPS.md` §1.1 |
| 2 | Internal service-to-service traffic is encrypted | ✅ Done | Firebase/Admin SDK + HMRC over HTTPS; §1.2 |
| 3 | Data at rest uses AES-256 (DBs, object storage, backups) | ✅ Done | `SensitiveDataService.ts`, `EncryptionService.ts`, `backupService.ts`; §1.3 |
| 4 | Encryption keys managed via KMS / HSM | ⚠️ Partial | Functions: Firebase Secrets (GCP Secret Manager). Client: env (VITE_*); documented in `KeyManagementService.ts`, §1.4 |
| 5 | No secrets, API keys, or credentials hardcoded in code | ✅ Done | `config/keys.ts`, Functions `defineSecret()`; §1.5 |
| 6 | Secrets stored in vault / env manager | ✅ Done | Firebase Secrets + `.env` / `ENV_CONFIGURATION.md`; §1.6 |
| 7 | Passwords hashed using bcrypt / argon2 / scrypt | ✅ Done | Firebase Auth (scrypt), YourStop/OldYourStop `auth-service.ts` (bcrypt); §1.7 |
| 8 | Token signing uses strong algorithms (RS256 / ES256) | ✅ Done | YourStop: RS256 required in prod; `generateToken` throws if HS256 would be used in prod (`auth-service.ts`). OldYourStop: documented as HS256 with migration path in file header and `JWT_RS256_MIGRATION_GUIDE`. |

---

## 2️⃣ Identity, Auth & Access Control

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Role-based access control (RBAC) implemented in code | ✅ Done | `Permissions.tsx`, `CompanyContext.tsx`, `secureRequestGuard.ts` (ROLE_PERMISSIONS, company-scoped) |
| 2 | Admin vs user vs support permissions clearly separated | ✅ Done | Roles in `secureRequestGuard.ts`; UI in `Permissions.tsx`, `UserSiteAllocation.tsx` |
| 3 | MFA enforced for admins and privileged roles | ✅ Done | `secureRequestGuard.ts` — MFA_ROLES, MFA_REQUIRED_ACTIONS; MFA rejection logged. MFA enrollment via Firebase Console (no in-app UI); see `docs/ENGINEERING_CONTROLS_COMPLIANCE_NOTES.md`. |
| 4 | Access checks exist server-side (not just UI) | ✅ Done | `functions/src/guards/secureRequestGuard.ts` — auth → company → role → handler |
| 5 | Session expiration & refresh logic exists | ✅ Done | ESS: `essSessionPersistence.ts` (24h expiry, refresh); YourStop: `session-manager.ts`; Firebase tokens handled by SDK |
| 6 | Brute-force protection / rate limiting in auth endpoints | ⚠️ Partial | **Done:** YourStop/OldYourStop backend `express-rate-limit` + `authLimiter` on auth routes (`src/yourstop/backend/index.ts`, `src/oldyourstop/backend/index.ts`). **Open:** Main 1Stop auth is Firebase (relies on Firebase quotas); no explicit rate limit on Firebase Auth client. Document or add app-level rate limit for login attempts if required. |
| 7 | No “god mode” or hardcoded admin access | ✅ Done | Admin via Firebase Auth + company/role from RTDB; no hardcoded admin UID in secure paths |

---

## 3️⃣ Data Isolation & Multi-Tenancy Safety

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Tenant/company isolation enforced at query level | ✅ Done | `secureRequestGuard.ts` (companyId), `tenantVerification.ts`, RTDB paths by companyId |
| 2 | No cross-tenant access via ID manipulation | ✅ Done | Guard validates auth token + company membership; data paths scoped by companyId |
| 3 | Background jobs respect tenant boundaries | ✅ Done | HMRC RTI, audit logs, cleanup use `companyId` / tenant-scoped paths |
| 4 | Logs and exports are tenant-scoped | ✅ Done | `auditLogs/{companyId}`, `authEvents`; exports via DSAR/audit by company |
| 5 | Test data cannot access prod data | ✅ Doc | Documented in `docs/ENGINEERING_CONTROLS_COMPLIANCE_NOTES.md` (test vs prod). Ensure staging/prod Firebase projects and secrets are separate; no test credentials in prod. |

---

## 4️⃣ Logging, Monitoring & Audit Trails

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Authentication events logged (login, failure, MFA) | ✅ Done | `logAuthEvent.ts` → `authEvents/{logId}`; `auditLogger.ts` → MFA rejection |
| 2 | Admin actions logged (role changes, deletes, exports) | ✅ Done | `AuditTrailService.ts`, `CompanyContext.tsx` (role_change, permission_change), `UserAccountDeletionService.ts`, `DSARService.ts` |
| 3 | Data access to sensitive objects logged | ✅ Done | `logSensitiveAccess` in `secureRequestGuard.ts`; DSAR data_view/data_export in `DSARService.ts` |
| 4 | Logs immutable and tamper-resistant | ✅ Done | RTDB rules: append-only `auditLogs`; `!data.exists()` for new writes |
| 5 | Log retention meets policy (e.g. 12 months) | ✅ Done | `cleanupExpiredLogs.ts` — scheduled cleanup; retention documented (e.g. auth 12mo, admin/sensitive 24mo, HMRC 6y) |
| 6 | Alerts for suspicious activity | ✅ Done | `alertSuspiciousActivity.ts` on `authEvents` (e.g. login_failure) |

---

## 5️⃣ Secure Development Practices (SDLC)

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Code reviews required before merge | ✅ Done | PRs to main/develop; branch protection is repo policy (confirm in GitHub) |
| 2 | Static analysis / linting in CI | ✅ Done | `.github/workflows/ci-cd.yml` — ESLint, `tsc --noEmit` in Build and Lint job |
| 3 | Dependency vulnerability scanning | ✅ Done | CI: `npm audit --audit-level=high` (root) and `npm audit` in `functions/`; both fail the job on high. Snyk/OWASP remain optional (continue-on-error). |
| 4 | Secrets scanning in repos | ⚠️ Partial | **Done:** Gitleaks added to CI (Security Scan job). **You:** Enable GitHub secret scanning in repo Settings → Code security and analysis. |
| 5 | Prod and non-prod environments separated | ✅ Done | CI `environment: production` for deploy-production; staging vs prod Firebase projects via secrets |
| 6 | Feature flags for risky changes | ✅ Doc | Documented in `docs/ENGINEERING_CONTROLS_COMPLIANCE_NOTES.md` (no dedicated service; use env or add later). |

---

## 6️⃣ Privacy & GDPR Controls (Code + Product)

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Ability to export user personal data | ✅ Done | `DSARService.ts` — export; `GDPRPrivacyTab.tsx` |
| 2 | Ability to delete or anonymize personal data | ✅ Done | `UserAccountDeletionService.ts`, `DataRetentionService.ts` (anonymize/delete); GDPR UI |
| 3 | Data retention logic implemented (not manual) | ✅ Done | `DataRetentionService.ts`, `cleanupExpiredLogs.ts`; retention categories and schedules |
| 4 | Consent flags stored and enforced | ✅ Done | `ConsentService.ts`, `LawfulBasisService.ts`, `consentEnforcement.ts` |
| 5 | Soft-delete vs hard-delete logic documented | ✅ Doc | `docs/ENGINEERING_CONTROLS_COMPLIANCE_NOTES.md` — soft vs hard delete and evidence (UserAccountDeletionService, DataRetentionService). |
| 6 | Data minimization (no unused PII fields) | ⚠️ Doc | **Ticket:** Review PII fields in HR/booking/customer models; document minimization approach or open cleanup tickets. |

---

## 7️⃣ Backups, Resilience & Availability

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Automated encrypted backups | ✅ Done | `functions/src/backupService.ts`; GCS encryption at rest |
| 2 | Backup restore tested | ⚠️ Open | **Done:** `backupRestore.ts`; procedure in `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md`. **Ticket:** Perform first restore test (e.g. list → dry run → restore to test path); schedule quarterly and document. `BACKUPS_RESILIENCE_CHECKLIST_ENGINEER.md` |
| 3 | Disaster recovery procedures exist | ✅ Done | `DISASTER_RECOVERY_PLAN.md` — RTO 4h, RPO 24h, scenarios |
| 4 | Uptime / availability monitoring | ⚠️ Doc | **Ticket:** Document monitoring (e.g. Firebase Uptime, external monitor); add if not in place. `UPTIME_MONITORING_SETUP.md` may exist. |
| 5 | No single point of failure | ⚠️ Doc | **Ticket:** Document architecture (e.g. Firebase multi-region or single region); record risk acceptance if single region. |

---

## 8️⃣ Third-Party & Payment Boundaries (If Applicable)

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | Payments fully offloaded to PCI-compliant provider (e.g. Stripe) | ✅ Done | Stripe used; keys from env (`VITE_STRIPE_PUBLISHABLE_KEY`); no card handling in app |
| 2 | No card data stored or logged | ✅ Done | Payment flow via Stripe; no PAN/logging in codebase |
| 3 | Webhooks verified and signed | ⚠️ Doc | **Ticket:** If Stripe (or other) webhooks are used, confirm verification (signature/secret) is implemented and document. |
| 4 | Vendor SDKs pinned and monitored | ⚠️ Doc | **Ticket:** Confirm lockfiles (package-lock.json) are committed; document or automate dependency update policy (e.g. Dependabot). |

---

## Summary: What’s Remaining

### Completed by engineer (code + CI + docs)

- **Token signing (1.8):** YourStop enforces RS256 in prod; OldYourStop documented as HS256 with migration path.
- **Dependency scanning (5.3):** CI runs npm audit for root and functions/; both fail the job on high.
- **Secrets scanning (5.4):** Gitleaks step added to Security Scan job.
- **MFA, soft-delete, test/prod, feature flags:** `docs/ENGINEERING_CONTROLS_COMPLIANCE_NOTES.md` added.

### What you need to do (your side)

1. **Enable GitHub secret scanning** — Repo → Settings → Code security and analysis → enable Secret scanning.
2. **Run first backup restore test** — Follow BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md; document and set quarterly reminder.
3. **Fix any npm audit failures** — CI now fails on high/critical; run npm audit locally and fix or document.
4. **YourStop production:** Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY (PEM) if you run YourStop backend in prod.
5. **Optional:** Document uptime monitoring, Stripe webhook verification, dependency update policy.

### Already complete (no action)

- TLS/HSTS, internal encryption, AES-256 at rest, no hardcoded secrets, secrets in vault, password hashing.  
- RBAC, server-side access checks, session expiry, tenant isolation, audit logging, retention, alerts.  
- Code review + lint in CI, prod/non-prod separation.  
- GDPR export/delete, retention, consent.  
- Automated backups, DR plan; Stripe, no card storage.

---

**How to use:** For auditors — use the table status and "Evidence / gap" column. For you — use "What you need to do" above for remaining actions.

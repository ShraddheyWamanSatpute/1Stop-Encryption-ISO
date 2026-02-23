"# Section 1: Encryption & Data Protection — Pending Work, Gaps & Errors

**Certs:** ISO 27001, SOC 2, GDPR, PCI  
**Standards:** ISO 27001 Annex A (Cryptography), PCI DSS Req 3 & 4, SOC 2 CC6  
**Scope:** User, employee, company & customer data; HR, finance, bookings, operations. No health data.  
**Document purpose:** What is pending, what must be fixed, and what is incomplete (audit-ready checklist).

---

## Checklist vs codebase (summary)

| # | Requirement | Status | Evidence / gap |
|---|-------------|--------|-----------------|
| 1 | All external traffic enforces TLS 1.2+ (HTTPS only, HSTS enabled) | ✅ Done | See 1.1 |
| 2 | Internal service-to-service traffic is encrypted | ✅ Done | See 1.2 |
| 3 | Data at rest uses AES-256 (DBs, object storage, backups) | ✅ Done | See 1.3 |
| 4 | Encryption keys are managed via KMS / HSM | ⚠️ Partial | See 1.4 |
| 5 | No secrets, API keys, or credentials hardcoded in code | ✅ Done | See 1.5 |
| 6 | Secrets stored in vault / env manager | ✅ Done | See 1.6 |
| 7 | Passwords hashed using bcrypt / argon2 / scrypt | ✅ Done | See 1.7 |
| 8 | Token signing uses strong algorithms (RS256 / ES256) | ⚠️ Partial | See 1.8 |

---

## 1.1 All external traffic enforces TLS 1.2+ (HTTPS only, HSTS enabled)

**Requirement:** All external traffic uses TLS 1.2+; HTTPS only; HSTS enabled.

**What is done:**
- **HTTPS:** Firebase (DB, Auth, Functions) and HMRC API use HTTPS. `HMRCAPIClient.ts`, `hmrcOAuth.ts`, `hmrcRTISubmission.ts` use `https://` only.
- **HSTS in nginx:** `nginx.conf` — HTTP→HTTPS redirect and `Strict-Transport-Security` header.
- **HSTS in YourStop/OldYourStop:** `src/yourstop/frontend/next.config.ts`, `src/oldyourstop/frontend/next.config.ts` — HSTS headers present.
- **Main 1Stop app (Vite):** Served over HTTPS when deployed (Firebase Hosting / Vercel); TLS 1.2+ enforced by platform.
- **HSTS for main app (done):** HSTS is set in (1) `vite.config.ts` for dev server and preview, (2) `firebase.json` under `hosting.headers` for Firebase Hosting, and (3) `vercel.json` under `headers` for Vercel — all use `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.

**Pending / gaps / errors:**
- **None** for HSTS on the main app (gap closed).

---

## 1.2 Internal service-to-service traffic is encrypted

**Requirement:** Internal service-to-service traffic is encrypted.

**What is done:**
- Firebase SDK and Admin SDK use TLS.
- Functions → Realtime Database, Auth, HMRC, Google APIs: all over HTTPS.
- No unencrypted internal channels in use.

**Pending / gaps / errors:**
- **None.** No pending work for this item.

---

## 1.3 Data at rest uses AES-256 (DBs, object storage, backups)

**Requirement:** Data at rest uses AES-256 (DBs, object storage, backups).

**What is done:**
- **Application layer:** AES-256-GCM in `src/backend/utils/EncryptionService.ts`, `functions/src/encryption/EncryptionService.ts`; field-level encryption via `SensitiveDataService.ts` (client and functions) for employee, payroll, company, bank, user personal, HMRC tokens.
- **Firebase Realtime Database:** Encryption at rest by Google (documented).
- **Backups:** `functions/src/backupService.ts` — backups in Google Cloud Storage; Google-managed encryption at rest (AES-256).

**Pending / gaps / errors:**
- **Done.** Production code paths never persist unencrypted sensitive data: `Company.tsx`, `Finance.tsx`, `Settings.tsx`, and `HRs.tsx` all throw in production (`import.meta.env.PROD`) when encryption fails or when the encryption service is not initialized. Dev-only fallback (store without encryption) is scoped to non-PROD. Documented in `SensitiveDataService.ts` (callers must throw in PROD) and enforced in all four rtdatabase modules.

---

## 1.4 Encryption keys are managed via KMS / HSM

**Requirement:** Encryption keys are managed via KMS/HSM.

**What is done:**
- **Firebase Functions:** Keys from Firebase Secrets (Google Cloud Secret Manager) — e.g. `HR_ENCRYPTION_KEY`, `FINANCE_ENCRYPTION_KEY`, `USER_SETTINGS_KEY`, `PAYROLL_ENCRYPTION_KEY`, `HMRC_CLIENT_ID`, `HMRC_CLIENT_SECRET` via `defineSecret()` in `hmrcOAuth.ts`, `hmrcRTISubmission.ts`, `hrSecure.ts`, `financeSecure.ts`, `settingsSecure.ts`, `payrollSecure.ts`.
- **Main app (client):** Encryption uses `VITE_GENERAL_ENCRYPTION_KEY` from env; keys come from build-time env, not a KMS/HSM in the browser.

**Pending / gaps / errors:**
- **Done (documented).** Client-side limitation is documented: `EncryptionInitializer.tsx` states that client keys are build-time env (VITE_*), not KMS/HSM, and that sensitive data should prefer server-side encryption (Firebase Functions + Secret Manager). `KeyManagementService.ts` states that server-side keys are in Firebase Secret Manager and never leave the server; client-side use of VITE_* is explicitly noted as not KMS/HSM. Secure callables already use server-side keys for HR, Finance, Settings, Payroll.

---

## 1.5 No secrets, API keys, or credentials hardcoded in code

**Requirement:** No secrets, API keys, or credentials hardcoded.

**What is done:**
- **Main 1Stop app:** `src/config/keys.ts` reads Firebase and Stripe from env (`VITE_*`); no hardcoded values.
- **Functions:** HMRC and encryption secrets via `defineSecret()`; no hardcoded secrets in functions.
- **`.env.example`** and **`.gitignore`** exclude `.env` and credentials.

**Pending / gaps / errors:**
- **Done (fixed).** Hardcoded Firebase config removed:
  - **pwf-loor-app:** `firebase.ts` reads from `VITE_PWF_LOOR_*` env vars; validates required fields and throws if missing (no hardcoded API key or URLs).
  - **YourStop:** `firebase.ts` reads from `VITE_YOURSTOP_FIREBASE_*` with fallback to `VITE_FIREBASE_*`; throws if apiKey/projectId missing.
  - **OldYourStop:** `firebase.ts` reads from same env (Vite + process.env for Next); same validation.
  - **firebase-customer.ts:** Placeholder values (`AIzaSyCustomerKey123`, `G-CUSTOMER123`, etc.) are never used in production; in PROD, missing or placeholder customer config forces use of main app config (`APP_KEYS.firebase`). `.env.example` documents all optional vars.

---

## 1.6 Secrets stored in vault / env manager

**Requirement:** Secrets stored in vault or env manager (e.g. AWS Secrets Manager, Vault).

**What is done:**
- **Firebase Functions:** Secrets in Firebase Secrets (Google Cloud Secret Manager).
- **Main app:** Firebase and Stripe from `.env` / build env (`VITE_*`); documented in `ENV_CONFIGURATION.md`.

**Pending / gaps / errors:**
- **Done.** Hardcoded config removed in 1.5; all client Firebase config now from env (`VITE_*`). Functions use Firebase Secrets. No secrets in repo. 
---

## 1.7 Passwords hashed using bcrypt / argon2 / scrypt

**Requirement:** Passwords hashed with bcrypt, argon2, or scrypt.

**What is done:**
- **Main 1Stop app:** Firebase Authentication — passwords hashed by Firebase (scrypt).
- **YourStop backend:** `src/yourstop/backend/lib/auth-service.ts` — bcrypt (e.g. `bcryptjs`) for registration.
- **OldYourStop backend:** `src/oldyourstop/backend/lib/auth-service.ts` — bcrypt.

**Pending / gaps / errors:**
- **None.** No pending work for this item.

---

## 1.8 Token signing uses strong algorithms (RS256 / ES256)

**Requirement:** Token signing uses strong algorithms (RS256 or ES256).

**What is done:**
- **Main 1Stop app:** Uses Firebase ID tokens (signed by Google with RS256); no custom JWT in main app.
- **YourStop backend:** `src/yourstop/backend/lib/auth-service.ts` — RS256 when `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (RSA) are set; otherwise fallback to HS256 with `JWT_SECRET`.

**Pending / gaps / errors:**
- **GAP:** YourStop can fall back to HS256 if RSA keys are not set. For compliance, RS256 should be required in production and HS256 fallback removed or disabled in prod.
- **GAP:** OldYourStop uses HS256 only (`JWT_SECRET`); no RS256.
- **Action:**  
  1. YourStop: Require RSA keys in production; fail fast if missing; remove or gate HS256 fallback for prod.  
  2. OldYourStop: Document as legacy and/or plan migration to RS256 if in scope for certification.

**Files to touch:**
- `src/yourstop/backend/lib/auth-service.ts` — enforce RS256 in production; no HS256 in prod.
- `src/oldyourstop/backend/lib/auth-service.ts` — document or change to RS256 if in scope.

---

## Summary: pending work, errors, gaps, incomplete

### Must fix (errors)
- Remove hardcoded Firebase config (API key, authDomain, databaseURL, etc.) from:
  - `src/frontend/pages/tools/originals/pwf-loor-app/src/services/firebase.ts`
  - `src/yourstop/frontend/src/lib/firebase.ts`
  - `src/oldyourstop/frontend/src/lib/firebase.ts`
- Ensure `firebase-customer.ts` uses only env/placeholders and never production secrets in code.

### Gaps to fill
- **HSTS for main app:** Add HSTS to main 1Stop (Vite) app (e.g. via Vite plugin or hosting config) and document.
- **KMS/HSM:** Document that client-side encryption key is env-based; prefer server-side encryption with keys in Firebase Secrets for full alignment.
- **Dev encryption fallback:** Confirm production never writes unencrypted sensitive data; document or narrow dev-only fallback (e.g. Company.tsx).
- **Token signing:** YourStop — require RS256 in production and remove/disable HS256 for prod; OldYourStop — document or migrate to RS256 if in scope.

### Already complete (no action)
- Internal service-to-service encryption.
- Data at rest AES-256 (app layer + Firebase + backups).
- Passwords hashed (Firebase scrypt, YourStop/OldYourStop bcrypt).
- Main 1Stop app: no hardcoded secrets (keys from env); Functions: secrets in Firebase Secrets.

### Optional / documentation
- Add a short “Encryption & secrets” section to `ENV_CONFIGURATION.md` or `ENGINEERING_CONTROLS_VERIFICATION.md` that maps each checklist item to the correct file or config (for auditors).

---

## How to use this document

- **Auditors:** Use the checklist table and subsections to see what is implemented vs pending.
- **Engineers:** Use “Must fix” and “Gaps to fill” as the ordered list of work; fix errors first, then close gaps.
- **Review:** After each fix, update this document (e.g. change status to ✅ and move item to “Already complete”).

Once Section 1 is approved, the same process can be applied to Section 2 (Identity, Auth & Access Control).

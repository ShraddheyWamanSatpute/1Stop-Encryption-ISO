# Engineering Controls — Compliance Notes (Auditor Reference)

Short, provable notes for controls that are implemented but need a single reference.

---

## MFA (Multi-Factor Authentication)

- **Enforcement:** Server-side in Firebase Functions. `functions/src/guards/secureRequestGuard.ts` defines `MFA_ROLES` and `MFA_REQUIRED_ACTIONS`; privileged roles and sensitive actions require MFA. If MFA is not satisfied, the request is rejected and the event is logged to `auditLogs` via `logMfaRejection`.
- **Enrollment:** There is no in-app MFA enrollment flow in 1Stop. Admins and privileged users must enable MFA in **Firebase Console → Authentication → Sign-in method → Multi-factor authentication**. Once enabled, the Firebase ID token carries the second-factor claim and passes the guard.
- **Evidence:** `functions/src/guards/secureRequestGuard.ts`, `functions/src/utils/auditLogger.ts` (MFA rejection logging).

---

## Soft-Delete vs Hard-Delete

- **Soft-delete:** Used where retention or recoverability is required (e.g. some HR or booking records). Records are marked deleted (e.g. `deletedAt`, `isDeleted`) and excluded from normal reads; retention and purge run on a schedule.
- **Hard-delete:** Used for full erasure (e.g. GDPR right to erasure, user account deletion). `UserAccountDeletionService.ts` and `DataRetentionService.ts` perform hard delete or anonymization where required by policy or request.
- **Evidence:** `src/backend/services/gdpr/UserAccountDeletionService.ts`, `src/backend/services/gdpr/DataRetentionService.ts`, `src/backend/services/gdpr/DataRetentionService.ts` (retention categories and delete/anonymize logic).

---

## Test vs Production Environment Separation

- **CI/CD:** Production deployment runs only on `refs/heads/main` and uses `environment: production` and separate secrets (e.g. `FIREBASE_SERVICE_ACCOUNT_PRODUCTION`, `FIREBASE_PROJECT_ID_PRODUCTION`). Staging uses staging-specific secrets and project IDs.
- **Firebase:** Use separate Firebase projects for development/staging and production. No test credentials or staging project IDs should be used in production env vars or secrets.
- **Evidence:** `.github/workflows/ci-cd.yml` (deploy-production job, `if: github.ref == 'refs/heads/main'`, environment and secrets).

---

## Feature Flags

- **Current state:** No dedicated feature-flag service is implemented. Risky or phased changes can be controlled via environment variables or Firebase Remote Config if introduced later.
- **Recommendation:** For high-risk changes, use a dedicated feature-flag system or at least env-based toggles and document the process in change management.

---

## Rate Limiting (Main 1Stop App)

- **Main app (Firebase Auth):** Login and auth are handled by Firebase; Google applies its own abuse and quota limits. There is no additional application-level rate limit on the main 1Stop login UI.
- **YourStop / OldYourStop backends:** Express rate limiters are applied (e.g. `authLimiter` on auth routes in `src/yourstop/backend/index.ts` and `src/oldyourstop/backend/index.ts`).
- **Evidence:** YourStop/OldYourStop: `express-rate-limit` in backend `index.ts`. Main app: rely on Firebase Auth quotas; add app-level rate limiting if required by policy.

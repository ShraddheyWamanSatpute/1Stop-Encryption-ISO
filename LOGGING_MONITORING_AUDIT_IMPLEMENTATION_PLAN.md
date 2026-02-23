# Logging, Monitoring & Audit Trails – Implementation Plan

**Standards:** ISO 27001 A.12, SOC 2 CC7, GDPR  
**Scope:** 1Stop main app (YourStop excluded)  
**Date:** Feb 2025

---

## Decisions (from product owner)

| Item | Decision |
|------|----------|
| Auth log location | Option B: `authEvents/{logId}` (separate top-level path) |
| Auth log access | Super-admin only; not visible to company admins or frontend |
| Log retention | HMRC/Financial: 6 years; Auth: 12 months; Admin/Sensitive: 24 months |
| Alerts | No alerting in this phase – logging only |
| MFA | Policy exists in secure guard; no enrollment UI – log MFA rejections only |
| Immutability | Append-only for auditLogs |

---

## Codebase findings

### Monitoring/alerting tools in use
- **Stripe webhook** – payment events only (not audit)
- **No** BigQuery, PagerDuty, Datadog, Slack in current setup
- Alerts can be added later via webhooks or Cloud Functions

### MFA status
- `secureRequestGuard` enforces MFA for privileged roles/actions
- Uses Firebase token: `sign_in_second_factor` or `mfa` / `mfa_enrolled` claims
- No MFA enrollment flow in 1Stop
- **Action:** Log when MFA is required but not satisfied (security event)

---

## Implementation specification

### 1. Auth events – `authEvents/{logId}`

**Events to log:**
- `login_success` – after successful login
- `login_failure` – failed login (email masked, error code)
- `logout` – when user logs out

**Storage:** Firebase RTDB `authEvents/{logId}`

**Access control (database rules):**
- `.read`: false for all clients (no frontend access)
- `.write`: Admin SDK only (writes via Cloud Functions)
- Super-admin dashboard will read via a Cloud Function that checks `auth.token.superAdmin === true` (or similar claim)

**How events are written:**
- **login_success, logout:** Callable Cloud Function `logAuthEvent` called by client after auth action; Function reads uid/email from token and writes to `authEvents`
- **login_failure:** HTTP Cloud Function `logAuthEventPublic` (no auth) called by Login page; accepts masked email + error code; optional rate limiting later

**Retention:** 12 months (`expiresAt` set accordingly)

---

### 2. Audit logs – `auditLogs/{companyId}/{logId}` (existing path)

**Admin actions to add:**
- `role_change` – when `updateRolePermissions` or `updateUserPermissions` is called
- `user_remove` – when `removeCompanyFromUser` is called
- `permission_change` – when role/user permissions change
- `data_export` – when CSV/PDF export is performed

**Sensitive access (already partial):**
- Secure callable access – add structured log in guard (action, userId, companyId, domain)

**Retention by type:**
- HMRC/Financial: 6 years (existing)
- Admin actions: 24 months
- Sensitive access: 24 months

---

### 3. Immutability

**Database rules for `auditLogs/$companyId/$logId`:**
- Append-only: allow write only when `!data.exists()` (create only, no update/delete)
- Retention cleanup will use Admin SDK (bypasses rules) in a scheduled Function

---

### 4. Super-admin definition

- Use Firebase custom claim: `superAdmin: true`
- Set via Admin SDK: `admin.auth().setCustomUserClaims(uid, { superAdmin: true })`
- Document how to grant/revoke super-admin

---

## Files to create/modify

| File | Action |
|------|--------|
| `functions/src/logAuthEvent.ts` | NEW – callable + HTTP for auth events |
| `functions/src/index.ts` | Export new functions |
| `database.rules.json` | Add `authEvents` (deny client read/write); make `auditLogs` append-only |
| `src/backend/context/SettingsContext.tsx` | Call `logAuthEvent` on login/logout |
| `src/frontend/pages/Login.tsx` | Call `logAuthEventPublic` on login failure |
| `src/backend/services/gdpr/AuditTrailService.ts` | Retention constants; `logAuthEvent` helper |
| `src/backend/functions/Company.tsx` | Audit log for `updateRolePermissions`, `updateUserPermissions`, `removeCompanyFromUser` |
| `src/backend/rtdatabase/Company.tsx` | Wire audit calls (or via Company context) |
| `functions/src/guards/secureRequestGuard.ts` | Add audit log on secure access; log MFA rejection |
| Report/export components | Add `data_export` audit log where CSV/PDF generated |

---

## Checklist after implementation

- [x] Auth events (login success, failure, logout) logged to `authEvents`
- [x] Admin actions (role/permission change) logged to `auditLogs`
- [x] Sensitive access (secure callables) logged to `auditLogs`
- [x] MFA rejection logged to `auditLogs`
- [x] Data export (employees CSV) logged to `auditLogs`
- [x] Logs immutable (append-only rules for auditLogs)
- [x] Retention: 6y HMRC, 12mo auth, 24mo admin/sensitive
- [x] Auth logs not readable by company admins or frontend (authEvents .read false)

---

## Future (out of scope for this phase)

- Alerting (Cloud Function → webhook/email/Slack)
- BigQuery export for analysis
- Super-admin dashboard UI for viewing auth logs

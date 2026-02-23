# Secure Function Pattern – Do Not Bypass

This document defines the mandatory pattern for all secure Functions. **Any deviation is not acceptable.**

## Guard Usage

- All Functions that decrypt sensitive data MUST use `withSecureGuard`
- `withSecureGuard` is the ONLY approved entry point for secure Functions
- Handlers MUST NOT load secrets directly; only the guard provides encryption keys

## No Direct Secret Access

- **❗ Handlers must never call defineSecret or read secrets directly. Secrets may only be accessed inside guard wrappers.**
- Handlers receive the encryption key as the third argument from the guard
- Handlers MUST NOT call `defineSecret()` or `process.env` for encryption keys

## No List Decrypts

- List APIs (e.g. `fetchEmployeesSecure`) MUST return non-sensitive fields only
- Use `toEmployeeListItem` or equivalent whitelist – DTO must LITERALLY not include NI, bank, salary, etc.
- Full decrypt ONLY for detail/edit views via `*DetailSecure` or `*Secure` with explicit id

## No Client Writes to Sensitive Paths

- RTDB rules MUST block client writes to sensitive paths (employees, payrolls, bank accounts, etc.)
- Only Functions (Admin SDK) can write; clients call `httpsCallable` instead
- Lock rules only AFTER client is fully migrated to secure Functions

## Naming Conventions (*Secure)

- All Functions that decrypt MUST end with `Secure`
- Examples: `createEmployeeSecure`, `updateEmployeeSecure`, `fetchEmployeeDetailSecure`
- This helps reviewers instantly identify risk points

## Dual-Format Legacy Support

- During migration, support both existing encrypted records and new server-encrypted records
- Document retirement plan for legacy format
- Re-encryption job required before decommissioning old paths

---

## Client Wrappers

- Live under `backend/functions/*SecureClient.ts` (e.g. `hrSecureClient.ts`, `financeSecureClient.ts`, `settingsSecureClient.ts`)
- Mirror Function names exactly (e.g. `createEmployeeSecure` → `createEmployeeSecureCall`)
- Do not mix secure and legacy calls in the same file – secure-only namespace

---

**If you are adding a new secure Function:**

1. Use `withSecureGuard(encryptionKeySecret, handler, options)`
2. Add to the correct domain (HR, Finance, Payroll, Settings, Company)
3. Name it `*Secure`
4. For list APIs: return whitelist DTO only, never decrypt

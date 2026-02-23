# Re-encryption Job – Design Document

## Purpose

One-time migration job to re-encrypt legacy data (client-encrypted or old key) with server-side keys from Firebase Secrets. Run after all reads/writes go through secure Functions and RTDB rules are locked.

## Prerequisites

- All secure Functions deployed and client wired
- RTDB rules block client writes to sensitive paths
- Legacy data identified (encrypted with `VITE_GENERAL_ENCRYPTION_KEY` or old format)
- New domain keys in Firebase Secrets: `HR_ENCRYPTION_KEY`, `FINANCE_ENCRYPTION_KEY`, `USER_SETTINGS_KEY`

## Scope

| Domain | Path(s) | Encrypted Fields |
|--------|---------|------------------|
| HR Employees | `companies/*/sites/*/data/hr/employees` (and subsites) | NI, bank, tax, salary, DoB, etc. |
| Finance Bank Accounts | `companies/*/sites/*/data/finance/bankAccounts` | accountNumber |
| User Settings | `users/*/settings/personal` | bankDetails, niNumber, taxCode |

## Job Design

### Option A: Firebase Function (Scheduled)

- Trigger: `onSchedule` (e.g. one-off or manual invoke)
- Use Admin SDK to read all relevant paths
- For each record: decrypt with legacy key → encrypt with new key → write back
- Batch writes to avoid timeouts (Firebase Functions have execution limits)
- Log progress: record count, path, status (no plaintext)

### Option B: Standalone Node Script

- Run locally or in Cloud Run
- Use Admin SDK with service account
- Full control over batching and retries
- Recommended for large datasets

### Steps (High Level)

1. **Load keys**: Legacy key from env (one-time migration secret), new keys from Secret Manager
2. **Enumerate paths**: Query RTDB for all `companies`, `sites`, `subsites`, `users`
3. **For each record**:
   - Read raw value
   - Detect format: `ENC:` (v2) or legacy v1
   - Decrypt with legacy key
   - Encrypt with new domain key
   - Write back (overwrite)
4. **Idempotency**: Safe to re-run; re-encrypting already new-format data is a no-op (or skip if `_encVersion` present)
5. **Validation**: Spot-check a few records after run – fetch via secure Function, verify decryption

## Safety

- **Backup**: Export RTDB before run (Firebase Console or script)
- **Dry run**: Implement `--dry-run` that only reads and logs, no writes
- **Rollback**: Restore from backup if needed
- **Dual-format support**: Ensure secure Functions can still decrypt legacy format during migration window, then retire legacy key

## Retirement

After re-encryption completes and is validated:

1. Remove legacy key from env / Secret Manager
2. Remove dual-format decrypt support from encryption service (optional, for cleanup)
3. Document completion date for audit

## Implementation Notes

- Use the same `EncryptionService` and `SensitiveDataService` logic in the job (or shared package)
- Path discovery: `companies/{cid}/sites/{sid}/data/hr/employees`, etc. – match existing `getHRPaths` structure
- For `users/*/settings/personal`: iterate `users` ref, then `settings/personal` per user

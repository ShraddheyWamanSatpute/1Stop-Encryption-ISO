# Secure Functions – PR Review Checklist

Use this checklist when reviewing PRs that touch secure Functions, guards, or encryption.

## Before Merging

### Guard & Authorization

- [ ] All decrypt-capable Functions use `withSecureGuard` or `withUserScopedGuard`
- [ ] **❗ Handlers must never call defineSecret or read secrets directly. Secrets may only be accessed inside guard wrappers.**
- [ ] Auth is verified before any decrypt
- [ ] Company access verified for company-scoped data (path contains `companies/{id}`)
- [ ] User-scoped data (Settings) verifies `auth.uid === data.uid`

### List vs Detail

- [ ] List APIs return whitelist DTO only – no NI, bank, salary, tax code, DoB
- [ ] List DTO uses explicit type (e.g. `EmployeeListItem`) – not "delete from object"
- [ ] Full decrypt only in `*DetailSecure` or equivalent

### Naming

- [ ] All decrypt-capable Functions end with `Secure`
- [ ] No generic `encrypt()` / `decrypt()` callable endpoints

### Data Handling

- [ ] No plaintext, ciphertext, or keys in logs
- [ ] No sensitive data in error messages
- [ ] Encrypted payload format includes version metadata where applicable

### Client

- [ ] Client uses `httpsCallable` – no direct RTDB writes to sensitive paths
- [ ] Client does not use `VITE_GENERAL_ENCRYPTION_KEY` or client-side encrypt for new flows

---

## Quick Grep Checks (run before approve)

```bash
# No decrypt without guard
rg "decrypt\(" functions/src --glob "*.ts" | rg -v "Guard|decryptEmployeeData|decryptBankAccountData"

# No direct secret load in handlers
rg "\.value\(\)" functions/src --glob "*.ts" | rg -v "secureRequestGuard"

# List DTOs must not include sensitive fields
rg "nationalInsuranceNumber|accountNumber|salary" functions/src/encryption/SensitiveDataService.ts
# Should only appear in encrypt/decrypt field lists, NOT in *ListItem
```

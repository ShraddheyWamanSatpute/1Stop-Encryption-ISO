# Secure Functions Setup Guide

This document describes how to configure and deploy the server-side encryption Functions (Option B).

## Prerequisites

- Firebase project with Blaze (pay-as-you-go) plan
- Firebase CLI installed and logged in
- Node.js 20 (as specified in functions/package.json)

## 1. Create Firebase Secrets

Before deploying, create the encryption keys in Firebase Secret Manager:

```bash
cd functions

# HR employee data encryption
firebase functions:secrets:set HR_ENCRYPTION_KEY

# Finance bank accounts
firebase functions:secrets:set FINANCE_ENCRYPTION_KEY

# User personal settings (bank, NI, tax code)
firebase functions:secrets:set USER_SETTINGS_KEY

# Payroll records (financial data)
firebase functions:secrets:set PAYROLL_ENCRYPTION_KEY

# When prompted, enter a key of at least 32 characters
# Generate one: openssl rand -base64 32
```

**Required secrets for current implementation:**

| Secret | Domain | Used By |
|--------|--------|---------|
| `HR_ENCRYPTION_KEY` | HR (employees) | createEmployeeSecure, updateEmployeeSecure, fetchEmployeesSecure, fetchEmployeeDetailSecure |
| `FINANCE_ENCRYPTION_KEY` | Finance (bank accounts) | createBankAccountSecure, updateBankAccountSecure, fetchBankAccountsSecure, fetchBankAccountDetailSecure |
| `USER_SETTINGS_KEY` | User personal settings | updatePersonalSettingsSecure, fetchPersonalSettingsSecure |
| `PAYROLL_ENCRYPTION_KEY` | Payroll | fetchPayrollSecure, fetchPayrollDetailSecure |

**Pending (not yet implemented):**

- `COMPANY_ENCRYPTION_KEY`

## 2. Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

Or deploy only the secure Functions:

```bash
firebase deploy --only functions:createEmployeeSecure,functions:updateEmployeeSecure,functions:fetchEmployeesSecure,functions:fetchEmployeeDetailSecure
```

## 3. Client Integration

The client must call these Functions instead of writing directly to RTDB.

### Using Firebase `httpsCallable`

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app);

// Create employee
const createEmployeeSecure = httpsCallable(functions, 'createEmployeeSecure');
const result = await createEmployeeSecure({
  hrWritePath: getHRWritePath(),
  employee: { firstName: 'John', lastName: 'Doe', ... }
});
const { employeeId } = result.data;

// Fetch list (non-sensitive fields only)
const fetchEmployeesSecure = httpsCallable(functions, 'fetchEmployeesSecure');
const listResult = await fetchEmployeesSecure({ hrWritePath: getHRWritePath() });
const employees = listResult.data;

// Fetch detail (full decrypt)
const fetchEmployeeDetailSecure = httpsCallable(functions, 'fetchEmployeeDetailSecure');
const detailResult = await fetchEmployeeDetailSecure({
  hrWritePath: getHRWritePath(),
  employeeId: 'emp123'
});
const employee = detailResult.data;
```

## 4. RTDB Rules (After Client Migration)

Once the client uses secure Functions for all HR employee writes, update `database.rules.json` to deny client writes to sensitive paths:

```
"employees": {
  ".read": "auth != null && ...",  // Keep read for backward compat during migration
  ".write": false   // Block client writes - only Functions (Admin SDK) can write
}
```

**Note:** Admin SDK bypasses rules, so Functions will continue to work.

## 5. Guard Pattern

All secure Functions use `withSecureGuard` which enforces:

1. **Auth** – Firebase Auth token required
2. **Company access** – User must have access to company (users/{uid}/companies/{companyId})
3. **Role** – User must have required role (owner, admin, manager, etc.)
4. **Handler** – Only after all checks pass does the handler run (read + decrypt)

Handlers **never** load secrets directly; only the guard provides the encryption key.

## 6. Naming Convention

All Functions that decrypt must end with `Secure`:

- **HR:** createEmployeeSecure, updateEmployeeSecure, fetchEmployeesSecure, fetchEmployeeDetailSecure
- **Finance:** createBankAccountSecure, updateBankAccountSecure, fetchBankAccountsSecure, fetchBankAccountDetailSecure
- **Settings:** updatePersonalSettingsSecure, fetchPersonalSettingsSecure (user-scoped: auth.uid === data.uid)
- **Payroll:** fetchPayrollSecure, fetchPayrollDetailSecure (read-only; create/update/delete via handleHRAction)

## 7. List vs Detail (Option B)

- **List** (`fetchEmployeesSecure`): Returns non-sensitive fields only. No NI, bank details, salary, tax code.
- **Detail** (`fetchEmployeeDetailSecure`): Returns full decrypted employee for edit/detail view. Requires explicit call when user opens a record.

## 8. Coverage Status

**Implemented:** HR (employees), Finance (bank accounts), User Settings (personal), Payroll (list + detail fetch).

**Pending:** Payroll create/update/delete still go through handleHRAction; Company secure Functions.

## 9. Troubleshooting

### "Encryption key not configured"
- Ensure `HR_ENCRYPTION_KEY` is set: `firebase functions:secrets:access HR_ENCRYPTION_KEY`
- Redeploy Functions after setting secrets

### "Permission denied"
- Verify user has correct role in `users/{uid}/companies/{companyId}/role`
- Allowed roles for HR write: owner, admin, manager, administration
- Allowed roles for HR list: owner, admin, manager, administration, staff

### "Service configuration error"
- Key must be at least 32 characters for AES-256

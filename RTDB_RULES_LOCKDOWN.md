# RTDB Rules Lockdown – Secure Paths

After client migration to secure Functions, set `.write: false` on sensitive paths so only Functions (Admin SDK) can write.

## Paths to Lock

| Path | Purpose |
|------|---------|
| `companies/$companyId/sites/$siteId/data/hr/employees` | HR employees – use secure Functions |
| `companies/$companyId/sites/$siteId/subsites/$subsiteId/data/hr/employees` | HR employees (subsite) |
| `companies/$companyId/sites/$siteId/data/finance/bankAccounts` | Finance bank accounts |
| `companies/$companyId/sites/$siteId/subsites/$subsiteId/data/finance/bankAccounts` | Finance bank accounts (subsite) |
| `users/$userId/settings/personal` | User personal settings (bank, NI, tax) |
| `companies/$companyId/sites/$siteId/data/hr/payroll` | Payroll records |
| `companies/$companyId/sites/$siteId/subsites/$subsiteId/data/hr/payroll` | Payroll (subsite) |

## How to Apply

1. Open `database.rules.json`
2. For each path above, add or override with `".write": false`
3. Keep `.read` rules as-is (or restrict if desired – Functions bypass rules)
4. Deploy: `firebase deploy --only database`

## Example (employees)

Current:
```json
"employees": {
  ".read": "auth != null && ...",
  "$employeeId": {
    ".read": "...",
    ".write": "auth != null && ..."
  }
}
```

Locked:
```json
"employees": {
  ".read": "auth != null && ...",
  ".write": false,
  "$employeeId": {
    ".read": "...",
    ".write": false
  }
}
```

## Notes

- Admin SDK (Functions) bypasses rules – writes will still work
- Client direct RTDB writes will fail – intended
- Apply only after verifying all clients use secure Functions

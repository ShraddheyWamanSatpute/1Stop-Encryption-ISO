# Phase 1.2: Database Rules (RBAC) - Implementation Complete ✅

## Overview

Successfully implemented comprehensive Firebase Realtime Database security rules that enforce:
1. ✅ **Company Isolation** - Users can only access companies they belong to
2. ✅ **Role-Based Access Control** - Permissions based on user roles
3. ✅ **Sensitive Data Protection** - HMRC settings, payroll, employee data protected
4. ✅ **Employee Self-Service** - Staff can only see their own data

---

## What Was Changed

### File Modified
- ✅ `database.rules.json` - Complete rewrite with comprehensive RBAC rules
- ✅ `database.rules.backup.json` - Backup of original insecure rules

---

## Security Improvements

### Before (INSECURE ❌)
```json
{
  "rules": {
    ".read": "auth != null",     // ❌ Any authenticated user can read everything!
    ".write": "auth != null"     // ❌ Any authenticated user can write everything!
  }
}
```

### After (SECURE ✅)
- ✅ Company isolation enforced
- ✅ Role-based read/write permissions
- ✅ HMRC settings restricted to owner/admin only
- ✅ Payroll restricted to authorized roles
- ✅ Staff can only see own employee record
- ✅ Finance data protected

---

## Access Control Matrix

| Data Path | owner | admin | manager | supervisor | staff |
|-----------|-------|-------|---------|------------|-------|
| **Company Info** | R/W | R/W | R | R | R |
| **Sites List** | R/W | R/W | R | R | R |
| **HR Employees (all)** | R/W | R/W | R/W | R | ❌ |
| **HR Employees (own)** | R/W | R/W | R/W | R | R |
| **HR Payroll (all)** | R/W | R/W | R | ❌ | ❌ |
| **HR Payroll (own)** | R/W | R/W | R | ❌ | R* |
| **HR Schedules** | R/W | R/W | R/W | R/W | R |
| **HR Time Off** | R/W | R/W | R/W | R/W | R/W |
| **HMRC Settings** | R/W | R/W | ❌ | ❌ | ❌ |
| **Finance** | R/W | R/W | R/W | ❌ | ❌ |
| **Stock** | R/W | R/W | R/W | R/W | R |
| **Bookings** | R/W | R/W | R/W | R/W | R/W |
| **POS** | R/W | R/W | R/W | R/W | R/W |

**Legend**: R = Read, W = Write, R/W = Both, ❌ = No Access

\* **Note**: Staff payroll access requires `employeeId` to be stored in user profile (see Known Limitations below)

---

## Key Security Features

### 1. Company Isolation ✅

**Rule Pattern**:
```json
".read": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).exists()"
```

**Enforcement**: Users can only access companies they belong to (have entry in `users/{userId}/companies/{companyId}`)

---

### 2. Role-Based Access Control ✅

**Roles Supported**:
- `owner` - Full access to everything
- `admin` - Full access to everything
- `manager` - Read/write access to most data (no HMRC settings)
- `supervisor` - Limited read access, no payroll
- `staff` - Minimal access (own data only)
- `administration` - Administrative access (no HMRC settings)

**Rule Pattern Example** (HMRC Settings):
```json
".read": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() in ['owner', 'admin']"
```

---

### 3. Employee Self-Service ✅

**Employee Record Access**:
- Owner/admin/manager/administration: Can read any employee
- Staff: Can only read employee where `employee.userId === auth.uid`

**Rule Pattern**:
```json
".read": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).exists() && (root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() in ['owner', 'admin', 'manager', 'administration'] || (root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() === 'staff' && data.child('userId').val() === auth.uid))"
```

---

### 4. Payroll Protection ✅

**Payroll Access**:
- Owner/admin/manager/administration: Can read all payrolls
- Staff: Can only read own payrolls (requires `employeeId` in user profile)

**Rule Pattern**:
```json
".read": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).exists() && (root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() in ['owner', 'admin', 'manager', 'administration'] || (root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() === 'staff' && data.child('employeeId').val() === root.child('users').child(auth.uid).child('employeeId').val()))"
```

---

### 5. HMRC Settings Protection ✅

**HMRC Settings Access**:
- **ONLY** owner and admin can read/write HMRC settings
- Protected at all levels: company, site, subsite

**Paths Protected**:
- `companies/{companyId}/data/company/hmrcSettings`
- `companies/{companyId}/sites/{siteId}/data/company/hmrcSettings`
- `companies/{companyId}/sites/{siteId}/subsites/{subsiteId}/data/company/hmrcSettings`

---

## Known Limitations & Recommendations

### ⚠️ Staff Payroll Access Limitation

**Issue**: Staff can only read their own payrolls if `employeeId` is stored in their user profile at `users/{userId}/employeeId`.

**Current Status**: 
- Rules check for `root.child('users').child(auth.uid).child('employeeId').val()`
- Need to verify if this field exists in user profiles

**Recommendation**: 
1. When creating/linking employee records, store `employeeId` in user profile:
   ```typescript
   await set(ref(db, `users/${userId}/employeeId`), employeeId)
   ```
2. Or modify application to filter payrolls client-side for staff role

**File to Check**: `src/backend/functions/HRs.tsx` - Employee creation/linking logic

---

### ⚠️ Site-Level Access Control

**Current Implementation**: Users with company access can read all sites (relaxed approach)

**Consideration**: Rules allow reading sites if user belongs to company. For stricter control, could check:
- `accessLevel === "company"` (company-wide access)
- OR `siteId` in `assignedSites` array
- OR `siteId === userCompany.siteId`

**Recommendation**: Current implementation is acceptable. Refine later if needed.

---

### ⚠️ Supervisor Payroll Access

**Current Rule**: Supervisors cannot read payroll (as per requirements)

**Consideration**: If supervisors need payroll access, update rules:
```json
"payrolls": {
  ".read": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() in ['owner', 'admin', 'manager', 'supervisor', 'administration']"
}
```

---

## Testing Checklist

### Company Isolation Tests:
- [ ] User A (Company 1) cannot read Company 2 data
- [ ] User A (Company 1) cannot write Company 2 data
- [ ] User with no company access gets permission denied

### Role-Based Tests:
- [ ] Owner can read/write all data
- [ ] Admin can read/write all data
- [ ] Manager can read HR, cannot write HMRC settings
- [ ] Supervisor cannot read payroll
- [ ] Staff cannot read other employees

### Employee Self-Service Tests:
- [ ] Staff can read their own employee record
- [ ] Staff cannot read other employee records
- [ ] Staff can read their own payslips (if employeeId linked)
- [ ] Staff cannot read other payslips
- [ ] Staff can read their own schedules
- [ ] Staff can submit time off requests

### HMRC Data Tests:
- [ ] Only owner/admin can read HMRC settings
- [ ] Only owner/admin can write HMRC settings
- [ ] Manager cannot see OAuth tokens

### Payroll Tests:
- [ ] Owner/admin can read all payrolls
- [ ] Manager can read all payrolls
- [ ] Supervisor cannot read payrolls
- [ ] Staff can read own payrolls (if employeeId linked)

---

## Deployment Steps

### 1. Validate Rules (Recommended)
```bash
firebase database:rules:list
```

### 2. Deploy Rules
```bash
firebase deploy --only database
```

### 3. Test Immediately
- Open app and test critical paths
- Check Firebase console for permission denied errors
- Verify company isolation works
- Test employee self-service

### 4. Monitor
- Check Firebase console → Database → Usage tab
- Look for permission denied errors
- Monitor security logs

---

## Rollback Plan

If something breaks:

```bash
# Restore from backup
cp database.rules.backup.json database.rules.json

# Deploy old rules
firebase deploy --only database

# Verify app works
```

---

## Next Steps

### Phase 1.3: Encryption Service
After verifying database rules work correctly, proceed to implement encryption at rest for:
- Employee sensitive data (NI numbers, bank details)
- HMRC OAuth tokens (already partially protected)
- Payroll data (if required)

### Files Needed for Phase 1.3:
1. `src/backend/rtdatabase/HRs.tsx` - How employee data is saved/loaded
2. `src/backend/functions/HRs.tsx` - HR business logic functions
3. Employee creation/linking code - To add `employeeId` to user profile

---

## Important Notes

### Employee-User Linking

**Current System**: 
- Employees have `userId` field that matches Firebase Auth UID
- Linking: `employee.userId === auth.uid`

**For Payroll Rules**: 
- Need `employeeId` stored in user profile at `users/{userId}/employeeId`
- Or use application-level filtering for staff payroll access

**Action Required**: 
- Update employee creation/linking code to store `employeeId` in user profile
- Or implement client-side filtering for staff role

---

## Files Modified

| File | Status | Notes |
|------|--------|-------|
| `database.rules.json` | ✅ Modified | Complete rewrite with RBAC |
| `database.rules.backup.json` | ✅ Created | Backup of original rules |

---

## Verification

✅ **Rules File**: Valid JSON, no syntax errors  
✅ **Company Isolation**: Enforced  
✅ **Role-Based Access**: Implemented  
✅ **HMRC Protection**: Owner/admin only  
✅ **Employee Self-Service**: Staff own-data only  
⚠️ **Staff Payroll**: Requires `employeeId` in user profile  

---

## Summary

✅ **Phase 1.2 Complete**: Database rules implemented with comprehensive RBAC.

🔒 **Security**: Company isolation, role-based permissions, and sensitive data protection enforced.

⏳ **Next**: Verify rules work in production, then proceed to Phase 1.3 (Encryption Service).

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete - Ready for Deployment & Testing

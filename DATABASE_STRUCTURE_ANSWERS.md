# Database Structure & Access Control - Answers

## Question 1: Employee-User Linking

### ❌ **Answer: `employeeId` is NOT currently stored in user profile**

**Current System**:
- **Linking Method**: Employees have a `userId` field that matches Firebase Auth UID
- **Matching Logic**: `employee.userId === auth.uid`
- **Location**: Employee record at `companies/{companyId}/sites/{siteId}/data/hr/employees/{employeeId}` contains `userId` field

**Code Evidence**:
- **File**: `src/frontend/components/hr/EmployeeSelfService.tsx` (lines 241-244)
  ```typescript
  return hrState?.employees?.find((emp: any) => 
    String(emp.userId) === String(currentUserId) || 
    String(emp.id) === String(currentUserId)
  )
  ```

- **File**: `src/backend/interfaces/HRs.tsx` (line 34)
  ```typescript
  export interface Employee {
    id: string
    userId?: string  // Links to Firebase Auth UID
    // ... other fields
  }
  ```

**Problem with Current Database Rules**:
- The rules check for `users/{userId}/employeeId` (line 200 in database.rules.json)
- **This field does NOT exist** in the current system
- Staff payroll access will **FAIL** because the rule checks a non-existent field

**Required Fix**:
1. **Option A (Recommended)**: Store `employeeId` in user profile when employee is created/linked
   ```typescript
   // When creating/linking employee:
   await set(ref(db, `users/${userId}/employeeId`), employeeId)
   ```

2. **Option B**: Modify database rules to check `employee.userId === auth.uid` instead
   - This is more complex in Firebase rules (requires checking all employees)
   - Less efficient than storing employeeId in user profile

**Recommendation**: Implement Option A - Update employee creation/linking code to store `employeeId` in user profile.

---

## Question 2: Payroll Structure

### ✅ **Answer: Option A - Flat structure with `employeeId` field**

**Database Path**:
```
companies/{companyId}/sites/{siteId}/data/hr/payrolls/{payrollId}
```

**Structure**:
- Each payroll record is stored at `.../payrolls/{payrollId}`
- Each payroll record contains an `employeeId` field inside
- Payrolls are NOT nested under employees

**Code Evidence**:
- **File**: `src/backend/functions/PayrollCalculation.tsx` (line 235)
  ```typescript
  const payrollRef = ref(db, `companies/${companyId}/sites/${siteId}/data/hr/payrolls/${payrollId}`)
  await set(payrollRef, payrollRecord)
  ```

- **File**: `src/backend/functions/Finance.tsx` (lines 662-672)
  ```typescript
  const payrollsRef = ref(db, `companies/${companyId}/sites/${siteId}/data/hr/payrolls`)
  const snapshot = await get(payrollsRef)
  
  if (snapshot.exists()) {
    let payrolls = Object.entries(snapshot.val()).map(([id, data]: [string, any]) => ({
      id,
      ...data,
    }))
    
    if (employeeId) {
      payrolls = payrolls.filter((payroll) => payroll.employeeId === employeeId)
    }
  }
  ```

- **File**: `src/backend/interfaces/HRs.tsx` (line 545)
  ```typescript
  export interface Payroll {
    id: string
    employeeId: string  // Field inside payroll record
    employeeName: string
    // ... other fields
  }
  ```

**Current Database Rules Status**: ✅ **Correct**
- Rules check `data.child('employeeId').val() === root.child('users').child(auth.uid).child('employeeId').val()`
- This will work once `employeeId` is stored in user profile (see Question 1)

---

## Question 3: Site Access Strictness

### ⚠️ **Answer: Application uses STRICT, but database rules use RELAXED**

**Current Application Behavior (STRICT)**:
- Users with `accessLevel: "company"` → Can access ALL sites
- Users with `accessLevel: "site"` → Can ONLY access sites in `assignedSites` array
- Users with `accessLevel: "subsite"` → Can ONLY access specific subsites

**Code Evidence**:
- **File**: `src/backend/context/CompanyContext.tsx` (lines 1767-1796)
  ```typescript
  const accessLevel: string | undefined = association?.accessLevel
  const userRole = association?.role?.toLowerCase()
  const ownerLike = userRole === 'owner' || accessLevel === 'company'

  // Owner role has full access to all sites and subsites
  if (ownerLike || isOwner()) {
    return availableSites
  }

  // Determine allowed site IDs
  const allowedSiteIds = new Set<string>()
  if (typeof association?.siteId === 'string' && association.siteId) {
    allowedSiteIds.add(String(association.siteId))
  }
  const assocSites = association?.sites
  if (Array.isArray(assocSites)) {
    assocSites.forEach((s: any) => {
      if (s) allowedSiteIds.add(String(s))
    })
  }

  // Filter available sites to only allowed ones
  return (availableSites || []).filter((s) => allowedSiteIds.has(s.siteID))
  ```

**Current Database Rules (RELAXED)**:
- All company users can READ all sites (if they belong to company)
- Only owner/admin can WRITE sites

**Mismatch Issue**:
- **Application**: Filters sites client-side based on `accessLevel` and `assignedSites`
- **Database Rules**: Allow reading all sites if user belongs to company
- **Result**: Users can potentially access site data directly via Firebase SDK, bypassing application filters

**Recommendation**: **Update database rules to match application behavior (STRICT)**

**Required Database Rule Changes**:
```json
"sites": {
  "$siteId": {
    ".read": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).exists() && (root.child('users').child(auth.uid).child('companies').child($companyId).child('accessLevel').val() === 'company' || root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() === 'owner' || root.child('users').child(auth.uid).child('companies').child($companyId).child('assignedSites').hasChild($siteId) || root.child('users').child(auth.uid).child('companies').child($companyId).child('siteId').val() === $siteId)",
    ".write": "auth != null && root.child('users').child(auth.uid).child('companies').child($companyId).child('role').val() in ['owner', 'admin']"
  }
}
```

**Note**: Firebase rules have limitations checking arrays. The `assignedSites` check might need to be simplified or handled differently.

---

## Summary & Action Items

### ✅ Question 1: Employee-User Linking
- **Current**: Linking via `employee.userId === auth.uid`
- **Problem**: Database rules check for `users/{userId}/employeeId` which doesn't exist
- **Action Required**: 
  1. Update employee creation/linking code to store `employeeId` in user profile
  2. OR modify database rules to use a different approach

### ✅ Question 2: Payroll Structure
- **Current**: `companies/.../hr/payrolls/{payrollId}` with `employeeId` field inside
- **Status**: ✅ Correct structure, rules are compatible

### ⚠️ Question 3: Site Access Strictness
- **Application**: STRICT (filters by accessLevel and assignedSites)
- **Database Rules**: RELAXED (all company users can read all sites)
- **Action Required**: Update database rules to enforce strict site-level access

---

## Recommended Next Steps

### Priority 1: Fix Employee-User Linking
1. Find employee creation/linking code
2. Add code to store `employeeId` in user profile:
   ```typescript
   await set(ref(db, `users/${userId}/employeeId`), employeeId)
   ```
3. Update existing employees (migration script)

### Priority 2: Fix Site Access Rules
1. Update database rules to enforce strict site-level access
2. Test with users who have `accessLevel: "site"` and specific `assignedSites`
3. Verify they can only access their assigned sites

### Priority 3: Test Staff Payroll Access
1. After fixing employee-user linking, test staff can read their own payrolls
2. Verify staff cannot read other employees' payrolls

---

## Files to Modify

| File | Change Needed | Priority |
|------|---------------|----------|
| Employee creation/linking code | Add `employeeId` to user profile | **HIGH** |
| `database.rules.json` | Update site access rules to be strict | **MEDIUM** |
| Migration script | Add `employeeId` to existing user profiles | **MEDIUM** |

---

**Date**: January 2025  
**Status**: Answers provided - Action items identified

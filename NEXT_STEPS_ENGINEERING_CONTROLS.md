# Next Steps - Engineering Controls Implementation

**Date:** January 19, 2025  
**Status:** ✅ **Implementation Complete** - Ready for Testing & Deployment

---

## ✅ What's Been Completed

### 1. Encryption & Data Protection Controls
- ✅ **TLS 1.2+ Enforcement** - All external traffic uses HTTPS
- ✅ **HSTS Headers** - Implemented in Next.js and nginx configs
- ✅ **Internal Service Encryption** - All service-to-service traffic encrypted
- ✅ **Data at Rest (AES-256)** - Fully implemented with AES-256-GCM
- ✅ **Key Management (KMS)** - Firebase Secrets (Google Cloud Secret Manager)
- ✅ **No Hardcoded Secrets** - All issues fixed
- ✅ **Secrets in Vault** - Firebase Secrets & environment variables
- ✅ **Password Hashing** - scrypt (Firebase) & bcrypt (YourStop)
- ✅ **Token Signing (RS256)** - Upgraded from HS256 to RS256

### 2. Logging, Monitoring & Audit Trails (ISO 27001 A.12, SOC 2 CC7)
- ✅ **Auth events** – `authEvents/{logId}` (login success/failure, logout)
- ✅ **Admin actions** – role/permission/department changes → `auditLogs/{companyId}`
- ✅ **Sensitive access** – secure callable invocations + MFA rejections → `auditLogs`
- ✅ **Data export** – employees CSV export logged
- ✅ **Immutability** – auditLogs append-only (`!data.exists()`)
- ✅ **Retention** – HMRC 6y, auth 12mo, admin/sensitive 24mo

### 3. Data Isolation & Multi-Tenancy (ISO 27001 / SOC 2 / GDPR)
- ✅ **Tenant verification** – `src/backend/utils/tenantVerification.ts` validates company access
- ✅ **CompanyContext integration** – Verifies tenant access before loading company data (session restore)
- ✅ **Audit log path** – HMRC RTI logs to `auditLogs/{companyId}/hmrcSubmissions` (tenant-scoped)
- ✅ **Server-side** – `secureRequestGuard` and `requireFirebaseAuthAndHMRCRole` already enforce company access

### 4. Files Created/Modified
- ✅ `functions/src/logAuthEvent.ts` - Auth event logging (callable + HTTP)
- ✅ `functions/src/utils/auditLogger.ts` - Server-side audit (sensitive access, MFA rejection)
- ✅ `src/backend/services/audit/authAuditClient.ts` - Client auth audit
- ✅ `database.rules.json` - authEvents, append-only auditLogs
- ✅ `src/backend/utils/tenantVerification.ts` - Tenant verification utility
- ✅ `functions/src/hmrcRTISubmission.ts` - Tenant-scoped audit log path
- ✅ `src/backend/context/CompanyContext.tsx` - Tenant check in initializeCompanyData
- ✅ `src/yourstop/backend/lib/jwt-keys.ts` - RSA key management
- ✅ `src/yourstop/backend/scripts/generate-jwt-keys.ts` - Key generation script
- ✅ `src/yourstop/backend/lib/auth-service.ts` - RS256 implementation
- ✅ `src/yourstop/backend/.env` - Environment variables with RSA keys
- ✅ `src/yourstop/backend/JWT_RS256_MIGRATION_GUIDE.md` - Migration guide
- ✅ `ENGINEERING_CONTROLS_VERIFICATION.md` - Complete verification document
- ✅ HSTS headers in Next.js configs
- ✅ HSTS headers in nginx config
- ✅ Updated `.gitignore` files

---

## 🎯 Next Steps

### Step 1: Test the Implementation ⚠️ **REQUIRED**

#### 1.1 Test YourStop Backend
```bash
cd src/yourstop/backend

# Install dependencies (if not already installed)
npm install

# Start the backend server
npm run dev
```

**Expected Output:**
```
✅ JWT RSA keys loaded successfully (RS256 algorithm)
```

**If you see errors:**
- Verify `.env` file exists and contains `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`
- Check that keys are properly formatted (PEM format)
- Ensure no extra whitespace or characters

#### 1.2 Test Authentication
1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

3. **Verify JWT Token:**
   - Copy the token from the response
   - Visit https://jwt.io
   - Paste the token
   - Verify the algorithm shows **RS256** (not HS256)
   - Verify the token can be decoded with the public key

#### 1.3 Test Token Verification
```bash
# Use the token from login response
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 2: Update Production Environment Variables ⚠️ **REQUIRED**

#### 2.1 Firebase Secrets (Recommended)
```bash
# Set private key
firebase functions:secrets:set JWT_PRIVATE_KEY

# Set public key
firebase functions:secrets:set JWT_PUBLIC_KEY
```

#### 2.2 Deployment Platform Environment Variables

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add `JWT_PRIVATE_KEY` (paste full key)
3. Add `JWT_PUBLIC_KEY` (paste full key)
4. Set for Production, Preview, and Development

**Heroku:**
```bash
heroku config:set JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----"

heroku config:set JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----"
```

**AWS/Docker:**
- Add to Parameter Store, Secrets Manager, or docker-compose.yml
- Ensure keys are properly escaped in YAML/JSON

---

### Step 3: Verify Production Deployment ⚠️ **REQUIRED**

#### 3.1 Check Logs
After deployment, verify logs show:
```
✅ JWT RSA keys loaded successfully (RS256 algorithm)
```

#### 3.2 Test Production Endpoints
1. Test authentication endpoints
2. Verify tokens are signed with RS256
3. Check token verification works correctly

#### 3.3 Security Verification
- ✅ Verify `.env` is not committed to git
- ✅ Verify RSA key files (`.pem`) are not committed
- ✅ Verify keys are stored securely in production
- ✅ Test that system fails gracefully if keys are missing (production)

---

### Step 4: Documentation & Compliance ⚠️ **RECOMMENDED**

#### 4.1 Update Team Documentation
- Share `JWT_RS256_MIGRATION_GUIDE.md` with team
- Update deployment runbooks
- Document key rotation procedures

#### 4.2 Compliance Documentation
- ✅ `ENGINEERING_CONTROLS_VERIFICATION.md` - Complete
- Update compliance audit reports
- Document key management procedures

#### 4.3 Key Rotation Plan
- Document key rotation schedule (recommended: annually)
- Create procedure for key rotation
- Test key rotation process

---

### Step 5: Monitoring & Maintenance ⚠️ **RECOMMENDED**

#### 5.1 Set Up Monitoring
- Monitor JWT token generation/verification errors
- Alert on missing or invalid keys
- Track authentication failures

#### 5.2 Regular Security Audits
- Review key access logs
- Verify keys are stored securely
- Check for any hardcoded secrets
- Review compliance status quarterly

---

## 📋 Quick Checklist

### Immediate Actions (Before Deployment)
- [ ] Test backend server starts successfully
- [ ] Test user registration with RS256 tokens
- [ ] Test user login with RS256 tokens
- [ ] Verify tokens are signed with RS256 (check jwt.io)
- [ ] Verify token verification works
- [ ] Test error handling (missing keys, invalid keys)

### Pre-Production
- [ ] Set JWT_PRIVATE_KEY in production environment
- [ ] Set JWT_PUBLIC_KEY in production environment
- [ ] Verify keys are not in version control
- [ ] Test production deployment
- [ ] Verify production logs show RS256

### Post-Deployment
- [ ] Monitor authentication success rates
- [ ] Check for any JWT-related errors
- [ ] Verify compliance documentation is up to date
- [ ] Schedule key rotation review

---

## 🔒 Security Reminders

1. **Never commit:**
   - `.env` files
   - `*.pem` key files
   - Any files containing private keys

2. **Always:**
   - Use environment variables or secure vaults
   - Rotate keys periodically
   - Monitor key access
   - Use strong key sizes (2048-bit minimum, 4096-bit recommended)

3. **Production:**
   - Require RSA keys (no fallback)
   - Store keys in Firebase Secrets or secure vault
   - Use separate keys for dev/staging/production
   - Enable key rotation alerts

---

## 📚 Reference Documents

- `ENGINEERING_CONTROLS_VERIFICATION.md` - Complete compliance verification
- `JWT_RS256_MIGRATION_GUIDE.md` - Migration guide and troubleshooting
- `ENCRYPTION_AND_PRIVACY_ASSESSMENT.md` - GDPR compliance assessment
- `DATA_SECURITY_ENCRYPTION_GUIDE.md` - Encryption implementation guide

---

## 🆘 Troubleshooting

### Issue: "JWT RSA keys not found"
**Solution:** 
1. Verify `.env` file exists in `src/yourstop/backend/`
2. Check `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are set
3. Ensure keys are properly formatted (PEM format)

### Issue: "Invalid RSA key format"
**Solution:**
1. Verify keys start with `-----BEGIN PRIVATE KEY-----` and `-----BEGIN PUBLIC KEY-----`
2. Check for proper line breaks
3. Ensure no extra whitespace or characters

### Issue: Tokens still using HS256
**Solution:**
1. Verify RSA keys are loaded (check startup logs)
2. Restart the server after setting environment variables
3. Clear any cached tokens

### Issue: Token verification fails
**Solution:**
1. Verify public key matches private key
2. Check token algorithm is RS256
3. Ensure keys haven't been modified

---

## ✅ Success Criteria

Your implementation is successful when:
- ✅ Backend starts without errors
- ✅ Logs show: "✅ JWT RSA keys loaded successfully (RS256 algorithm)"
- ✅ Tokens are signed with RS256 (verify at jwt.io)
- ✅ Token verification works correctly
- ✅ Production deployment uses RS256
- ✅ All keys are stored securely
- ✅ No keys in version control

---

## Data Isolation & Multi-Tenancy – Compliance Verification

**Standards:** ISO 27001 A.8, SOC 2 CC6.6, GDPR  
**Scope:** 1Stop main app (YourStop excluded for now)

### Engineer Checklist

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | **Tenant/company isolation enforced at query level** | ✅ DONE | `database.rules.json`: all paths under `companies/$companyId`, `auditLogs/$companyId`, `compliance/$companyId` require `users/{uid}/companies/{companyId}.exists()` |
| 2 | **No cross-tenant access via ID manipulation** | ✅ DONE | RTDB rules block client ID manipulation. `secureRequestGuard` + `requireFirebaseAuthAndHMRCRole` validate companyId for callables/HMRC. `sendEmailWithGmail` and `sendTestEmail` now require `requireFirebaseAuthAndCompanyAccess`; frontend passes `Authorization: Bearer <token>` |
| 3 | **Background jobs respect tenant boundaries** | ✅ DONE | No Cloud Scheduler/cron/server-side jobs. Client-side lazy loading uses CompanyContext (verified companyId) for paths |
| 4 | **Logs and exports are tenant-scoped** | ✅ DONE | HMRC RTI: `auditLogs/{companyId}/hmrcSubmissions`. `AuditTrailService`: `auditLogs/{companyId}`. CSV/PDF exports use company-scoped data from context |
| 5 | **Test data cannot access prod data** | 📋 DEFERRED | Single Firebase project (`stop-test-8025f`) for dev/test. Separate prod project to be created when deploying production; env/config separation will be applied then |

### Gaps Addressed

- **sendEmailWithGmail** and **sendTestEmail**: Added `requireFirebaseAuthAndCompanyAccess` (auth + company membership) before accessing company-scoped data. Frontend (`TabbedBookingForm`, `BookingSettings`) passes `Authorization: Bearer <idToken>`.

---

## Data Isolation & Multi-Tenancy – Testing Guide

**Implemented:** Tenant verification layer, audit log path fix, CompanyContext integration  
**Purpose:** Verify ISO 27001 / SOC 2 / GDPR tenant isolation works correctly

### Test 1: Tenant verification on session restore

**Setup:** Use a user who belongs to Company A. Select Company A, then close the tab or refresh.

**Steps:**
1. Log in as User X.
2. Select Company A from the company dropdown.
3. Confirm HR/Finance/other data loads.
4. In Firebase Console → Realtime Database, remove User X from Company A:
   - Delete or change `users/{userX_uid}/companies/{companyA_id}`.
5. Refresh the page (session will restore Company A).

**Expected:**  
- Message: "You no longer have access to this company."  
- Company is cleared and company dropdown shows no selection (or another company).  
- No HR/Finance data for Company A is shown.

---

### Test 2: Audit log tenant scoping (HMRC RTI)

**Setup:** Firebase Functions deployed; user has owner/admin for a company.

**Steps:**
1. Submit an FPS/EPS/EYU from the Payroll HMRC submission UI for Company A.
2. In Firebase Console → Realtime Database, open `auditLogs`.

**Expected:**  
- Path `auditLogs/{companyA_id}/hmrcSubmissions` exists.  
- New entry with `submissionType`, `employerRef`, `status`, etc.  
- No entries under `auditLogs/hmrcSubmissions` for new submissions.

---

### Test 3: Normal flow (no regressions)

**Steps:**
1. Log in.
2. Select a company you belong to.
3. Open HR, Finance, Payroll, Company settings.
4. Switch between companies and sites.

**Expected:**  
- Data loads as before.  
- No console errors.  
- Company/site selection and navigation behave normally.

---

### Test 4: Secure callable (server-side tenant check)

**Purpose:** Ensure server-side guard still blocks access.

**Steps:**  
Call a secure function (e.g. HR/Payroll/Finance) with a `companyId` for a company the user does not belong to (e.g. via browser devtools or a small test script).

**Expected:**  
- Response: `permission-denied` or `Access denied to this company`.  
- No data returned.

---

### Quick verification checklist

- [ ] Tenant verification clears company when user loses access.
- [ ] HMRC audit logs write to `auditLogs/{companyId}/hmrcSubmissions`.
- [ ] No regressions in normal company/site switching.
- [ ] Secure callables reject requests for unauthorized companies.

---

**Status:** Ready for Testing → Deployment → Production

**Next Action:** Test the backend server (Step 1.1) and run Data Isolation tests above

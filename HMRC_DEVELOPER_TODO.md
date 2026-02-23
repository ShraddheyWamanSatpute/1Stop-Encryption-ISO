# HMRC Integration - Developer TODO List

## ✅ What's Already Complete

- ✅ Backend services (HMRCAuthService, HMRCAPIClient, RTIXMLGenerator, FraudPreventionService)
- ✅ RTI submission functions (FPS, EPS, EYU)
- ✅ Payroll calculation engine integration
- ✅ Multi-tenant data isolation (company/site/subsite)
- ✅ HMRC Settings UI components
- ✅ OAuth callback handler
- ✅ RTI Submission UI
- ✅ Connection guide and help documentation
- ✅ Validation services
- ✅ Error handling structure

---

## 🔴 Critical - Must Complete Before Production

### 1. SDST Registration (CRITICAL for RTI)
**Priority: CRITICAL**  
**Estimated Time: 1-2 weeks**

⚠️ **IMPORTANT:** RTI submissions use Transaction Engine (XML), not REST APIs!

- [ ] Email SDST at sdsteam@hmrc.gov.uk
- [ ] Request Vendor ID and test credentials
- [ ] Receive test credentials (SenderID, Password)
- [ ] Access to test services (TPVS, ETS)
- [ ] Review technical packs from SDST
- [ ] Document Vendor ID storage location

**See:** `HMRC_SDST_REGISTRATION_GUIDE.md` for complete details

---

### 2. HMRC Developer Hub Registration (For OAuth Testing)
**Priority: HIGH**  
**Estimated Time: 1-2 days**

- [x] Register master application at https://developer.service.hmrc.gov.uk/
- [x] Create Government Gateway account (if needed)
- [x] Register application (e.g., "1Stop HR Platform")
- [x] Subscribe to Hello World API ✅ (for OAuth testing)
- [x] Individual PAYE Test Support ✅ Subscribed
- [x] Test Fraud Prevention Headers ✅ Subscribed
- [x] Configure redirect URI: `http://localhost:5173/hmrc/callback` ✅
- [x] Test OAuth connection ✅ (ready to test with `hello` scope)

**Files Updated:**
- ✅ Environment configuration (`.env.local` created with Hello World credentials)
- ✅ `HMRCSettingsTab.tsx` - Environment variable support added, uses `hello` scope
- ✅ `OAuthCallback.tsx` - Environment variable support added

**Note:** OAuth is ready for testing with Hello World API. For actual RTI submissions, you need SDST registration and Transaction Engine implementation.

---

### 2. Environment Variable Support for Master App Credentials
**Priority: CRITICAL**  
**Estimated Time: 2-3 hours**

Currently, the code checks for credentials in company settings, but needs to fall back to environment variables for the master app.

**Tasks:**
- [ ] Add environment variables:
  - `HMRC_CLIENT_ID` (master app)
  - `HMRC_CLIENT_SECRET` (master app)
  - `HMRC_REDIRECT_URI` (optional, defaults to `/oauth/callback/hmrc`)
- [ ] Update `HMRCSettingsTab.tsx` to read from environment variables
- [ ] Update `OAuthCallback.tsx` to use environment variables
- [ ] Add fallback logic: env vars → company settings → error
- [ ] Document environment variable setup

**Files to Update:**
- `src/frontend/components/hr/settings/HMRCSettingsTab.tsx` (line ~231-240)
- `src/frontend/pages/hmrc/OAuthCallback.tsx` (line ~60-66)
- Create `.env.example` with HMRC variables

**Code Location:**
```typescript
// Current (needs update):
let clientId = hmrcSettings.hmrcClientId
let clientSecret = hmrcSettings.hmrcClientSecret

// Should be:
let clientId = process.env.REACT_APP_HMRC_CLIENT_ID || hmrcSettings.hmrcClientId
let clientSecret = process.env.REACT_APP_HMRC_CLIENT_SECRET || hmrcSettings.hmrcClientSecret
```

---

### 3. Token Encryption/Decryption
**Priority: HIGH**  
**Estimated Time: 4-6 hours**

Currently tokens are stored in plain text. Should be encrypted at rest.

- [ ] Implement encryption service for sensitive data
- [ ] Encrypt `hmrcAccessToken` before storing
- [ ] Encrypt `hmrcRefreshToken` before storing
- [ ] Encrypt `hmrcClientSecret` if stored per-company
- [ ] Decrypt tokens when reading from database
- [ ] Add encryption key management (environment variable)

**Files to Create/Update:**
- Create `src/backend/services/EncryptionService.ts`
- Update `HMRCSettings.tsx` - encrypt/decrypt on save/load
- Update `OAuthCallback.tsx` - encrypt tokens before saving

---

### 4. Conformance Testing with HMRC
**Priority: CRITICAL**  
**Estimated Time: 4-12 weeks (HMRC timeline)**

- [ ] Contact HMRC for conformance testing
- [ ] Prepare test scenarios:
  - [ ] Multiple employees
  - [ ] Different tax codes
  - [ ] Starters & leavers
  - [ ] Statutory Sick Pay (SSP)
  - [ ] Statutory Maternity Pay (SMP)
  - [ ] Pension deductions
  - [ ] Zero-pay periods
  - [ ] Corrections & adjustments
- [ ] Run all test scenarios in sandbox
- [ ] Submit test results to HMRC
- [ ] Address any HMRC feedback
- [ ] Pass conformance testing
- [ ] Get HMRC recognition approval

**Note:** This is the longest step and depends on HMRC's timeline.

---

## 🟡 High Priority - Should Complete Soon

### 5. Comprehensive Error Handling & Logging
**Priority: HIGH**  
**Estimated Time: 1-2 days**

- [ ] Add structured error logging for HMRC API calls
- [ ] Log all RTI submissions (success/failure)
- [ ] Add error notification system for failed submissions
- [ ] Create error recovery mechanisms
- [ ] Add retry logic for transient failures
- [ ] Log OAuth token refresh attempts
- [ ] Add monitoring/alerting for critical errors

**Files to Create/Update:**
- Create `src/backend/services/hmrc/ErrorHandler.ts`
- Update `HMRCAPIClient.ts` - add comprehensive error handling
- Update `HMRCRTISubmission.tsx` - add error logging

---

### 6. Submission History & Status Tracking
**Priority: HIGH**  
**Estimated Time: 2-3 days**

- [ ] Create submission history database structure
- [ ] Store all FPS/EPS submission records
- [ ] Track submission status (pending/success/failed)
- [ ] Add UI to view submission history
- [ ] Show submission details (date, status, errors)
- [ ] Add ability to resubmit failed submissions
- [ ] Add submission status polling (check HMRC for updates)

**Files to Create/Update:**
- Create `src/backend/interfaces/RTISubmissionHistory.ts`
- Create `src/frontend/components/hr/settings/SubmissionHistoryTab.tsx`
- Update `HMRCRTISubmission.tsx` - store submission records
- Add to `Settings.tsx` - new tab for history

---

### 7. Enhanced Validation & Data Quality Checks
**Priority: HIGH**  
**Estimated Time: 1-2 days**

- [ ] Validate PAYE reference format before saving
- [ ] Validate Accounts Office reference format
- [ ] Pre-submission validation checklist
- [ ] Employee data completeness checks
- [ ] NI number format validation
- [ ] Tax code validation
- [ ] Show validation errors in UI
- [ ] Block submission if validation fails

**Files to Update:**
- Update `RTIValidationService.ts` - add more validations
- Update `HMRCSettingsTab.tsx` - add format validation
- Create validation helper functions

---

## 🟢 Medium Priority - Nice to Have

### 8. Automated Testing
**Priority: MEDIUM**  
**Estimated Time: 3-5 days**

- [ ] Unit tests for HMRC services
- [ ] Integration tests for OAuth flow
- [ ] Integration tests for RTI submissions
- [ ] Mock HMRC API responses
- [ ] Test error scenarios
- [ ] Test multi-tenant isolation
- [ ] Test token refresh flow

**Files to Create:**
- `src/backend/services/hmrc/__tests__/HMRCAuthService.test.ts`
- `src/backend/services/hmrc/__tests__/HMRCAPIClient.test.ts`
- `src/backend/services/hmrc/__tests__/RTIXMLGenerator.test.ts`
- `src/backend/functions/__tests__/HMRCRTISubmission.test.ts`

---

### 9. Production Environment Setup
**Priority: MEDIUM**  
**Estimated Time: 1 day**

- [ ] Configure production HMRC environment
- [ ] Set up production redirect URI
- [ ] Update environment variables for production
- [ ] Test OAuth flow in production
- [ ] Verify production API endpoints
- [ ] Set up production monitoring

---

### 10. Documentation & Developer Guides
**Priority: MEDIUM**  
**Estimated Time: 1-2 days**

- [ ] API documentation for HMRC services
- [ ] Developer setup guide
- [ ] Troubleshooting guide
- [ ] Architecture diagrams
- [ ] Code comments and JSDoc
- [ ] Deployment guide updates

---

## 🔵 Low Priority - Future Enhancements

### 11. Advanced Features
**Priority: LOW**  
**Estimated Time: Variable**

- [ ] Batch submission optimization
- [ ] Submission scheduling
- [ ] Automated retry for failed submissions
- [ ] Submission analytics dashboard
- [ ] Email notifications for submissions
- [ ] P11D submission support
- [ ] CIS (Construction Industry Scheme) support
- [ ] Multi-currency support (if needed)

---

## 📋 Quick Reference Checklist

### Before First Company Can Use:
- [ ] HMRC Developer Hub registration
- [ ] Environment variables configured
- [ ] OAuth flow tested in sandbox
- [ ] Token encryption implemented
- [ ] Basic error handling in place

### Before Production Launch:
- [ ] Conformance testing passed
- [ ] Production environment configured
- [ ] Comprehensive error handling
- [ ] Submission history tracking
- [ ] Enhanced validation
- [ ] Monitoring/alerting set up

### Nice to Have:
- [ ] Automated tests
- [ ] Advanced features
- [ ] Enhanced documentation

---

## 🎯 Recommended Order of Completion

1. **Week 1-2:** HMRC Developer Hub registration + Environment variables
2. **Week 2-3:** Token encryption + Error handling
3. **Week 3-4:** Submission history + Enhanced validation
4. **Week 4-16:** Conformance testing (HMRC timeline)
5. **Week 16+:** Production setup + Launch

---

## 📝 Notes

- **Conformance Testing** is the longest step (4-12 weeks) and depends on HMRC
- **Environment Variables** are critical - must be done before any company can connect
- **Token Encryption** is important for security compliance
- All other items can be done in parallel or after launch

---

**Last Updated:** 2024  
**Status:** Core implementation complete, platform setup required


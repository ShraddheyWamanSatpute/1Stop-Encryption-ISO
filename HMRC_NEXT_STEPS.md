# HMRC Integration - Next Steps Guide

**⚠️ IMPORTANT: This is a MULTI-TENANT SaaS application**
- Multiple companies will use your software
- Each company has their own HMRC credentials and settings
- See `HMRC_MULTI_TENANT_GUIDE.md` for detailed multi-tenant setup

This document outlines the actionable next steps to complete your HMRC payroll software recognition integration.

---

## 🎯 Phase 1: Platform Setup - HMRC Developer Hub (Week 1-2)

### Step 1: Register Master Application with HMRC Developer Hub
**For YOUR platform (one-time setup):**
- [ ] Visit https://developer.service.hmrc.gov.uk/
- [ ] Create Government Gateway account (if you don't have one)
- [ ] Register ONE master application for your platform
- [ ] Note down your `client_id` and `client_secret`
- [ ] Set up redirect URI (e.g., `https://yourdomain.com/hmrc/callback`)
- [ ] Store credentials securely (environment variables or secure config)

**Note:** You can use ONE master application for all companies, OR each company can register their own. See `HMRC_MULTI_TENANT_GUIDE.md` for details.

**Estimated Time:** 1-2 days

### Step 2: Complete OAuth Setup (Platform Level)
- [ ] Configure OAuth redirect URI in your application
- [ ] Create OAuth callback handler (company-aware)
- [ ] Test OAuth authorization flow in sandbox
- [ ] Implement token storage per company (encrypted in database)
- [ ] Implement token refresh mechanism (per company)

**Estimated Time:** 2-3 days

---

## 🔧 Phase 2: Platform Configuration & Company Onboarding (Week 2-3)

### Step 3: Create Company HMRC Settings UI
**For YOUR platform (one-time development):**
- [ ] Create HMRC settings UI component (company-aware)
- [ ] Add form for company PAYE reference (format: `123/AB45678`)
- [ ] Add form for company Accounts Office reference (format: `123PA00012345`)
- [ ] Add "Connect to HMRC" button (triggers OAuth per company)
- [ ] Add OAuth callback handler (stores tokens per company)
- [ ] Add connection status indicator
- [ ] Add environment selector (sandbox/production)
- [ ] Add auto-submit toggle

**Location:** Create `src/frontend/components/hr/HMRCSettings.tsx`

**Database Path:** `companies/{companyId}/sites/{siteId}/data/company/hmrcSettings`

**Estimated Time:** 3-5 days

### Step 4: Per-Company Configuration Process
**For EACH company using your software:**
- [ ] Company admin enters their PAYE reference
- [ ] Company admin enters their Accounts Office reference
- [ ] Company admin clicks "Connect to HMRC"
- [ ] Company completes OAuth authorization (one-time)
- [ ] System stores company-specific tokens
- [ ] Set environment to `sandbox` for initial testing
- [ ] Set `autoSubmitFPS` if desired

**Note:** This process repeats for each new company. The UI you build handles this automatically.

**Estimated Time:** 5-10 minutes per company

### Step 5: Verify Employee Data Completeness (Per Company)
**For EACH company:**
- [ ] Ensure all employees have National Insurance Numbers
- [ ] Verify tax codes are set (default: `1257L`)
- [ ] Check NI categories are set (default: `A`)
- [ ] Verify student loan plans are configured (if applicable)
- [ ] Check pension scheme references (if applicable)

**Action Items (Platform Level):**
- [ ] Add validation to employee forms to require NI numbers
- [ ] Set defaults for missing tax codes/NI categories
- [ ] Create data audit tool for companies to check their employee data
- [ ] Add warnings in UI for incomplete employee data

**Estimated Time:** 2-3 days (development) + ongoing per company

---

## 🧪 Phase 3: Sandbox Testing (Week 3-6)

### Step 6: Test Payroll Calculation → HMRC Submission Flow (Per Company)
- [ ] Create a test payroll record using `createPayrollRecord()`
- [ ] Verify all calculations are correct (tax, NI, student loans, pensions)
- [ ] Approve the payroll record
- [ ] Verify FPS auto-submission triggers (if enabled)
- [ ] Check submission status in HMRC sandbox

**Test Scenarios:**
- [ ] Single employee payroll
- [ ] Multiple employees in same period
- [ ] Different tax codes
- [ ] Different NI categories
- [ ] Employees with student loans
- [ ] Employees with pensions
- [ ] Directors (annual NI calculation)

**Estimated Time:** 1-2 weeks

### Step 7: Test Manual FPS Submission (Per Company)
- [ ] Create UI button/function for manual FPS submission
- [ ] Test submitting approved payroll records
- [ ] Verify XML generation is correct
- [ ] Check HMRC response handling
- [ ] Test error scenarios (missing data, invalid formats)

**Code Example:**
```typescript
import { submitFPSForPayrollRun } from '../backend/functions/HMRCRTISubmission'

const result = await submitFPSForPayrollRun(
  companyId,
  siteId,
  [payrollId1, payrollId2],
  userId
)
```

**Estimated Time:** 3-5 days

### Step 8: Test EPS Submission (Per Company)
- [ ] Test monthly EPS submission
- [ ] Test Employment Allowance claims
- [ ] Test statutory payment recovery
- [ ] Test no payment periods

**Code Example:**
```typescript
import { submitEPS } from '../backend/functions/HMRCRTISubmission'

const result = await submitEPS(
  companyId,
  siteId,
  {
    periodNumber: 6,
    periodType: 'monthly',
    employmentAllowance: {
      claimed: true,
      amount: 5000
    }
  },
  userId
)
```

**Estimated Time:** 2-3 days

### Step 9: Validate XML Output
- [ ] Generate FPS XML for test data
- [ ] Validate XML against HMRC schema
- [ ] Check all required fields are present
- [ ] Verify data formatting (dates, amounts, NI numbers)
- [ ] Test with HMRC XML validation tools

**Estimated Time:** 2-3 days

---

## 🎨 Phase 4: UI Development (Week 4-8)

### Step 10: Create RTI Submission UI (Company-Aware)
**Location:** Create `src/frontend/components/hr/RTISubmission.tsx`

**Features Needed:**
- [ ] List of company's approved payroll records ready for submission
- [ ] Manual FPS submission button (company-specific)
- [ ] EPS submission form (company-specific)
- [ ] Submission status display (per company)
- [ ] Error message display (per company)
- [ ] Submission history view (company-specific)
- [ ] Retry failed submissions (per company)
- [ ] Multi-company isolation (only show current company's data)

**Estimated Time:** 5-7 days

### Step 11: Add Submission Status Indicators (Company-Aware)
- [ ] Add "Submitted to HMRC" badge on payroll records
- [ ] Show submission date and ID
- [ ] Display submission errors if any
- [ ] Add submission status to payroll list view

**Estimated Time:** 2-3 days

---

## 📋 Phase 5: HMRC Conformance Testing (Week 6-18)

**Note:** If using master application, conformance testing is done ONCE for your platform. If each company has their own app, each company must complete testing.

### Step 12: Prepare for Conformance Testing
- [ ] Review HMRC conformance testing requirements
- [ ] Prepare test scenarios covering all features
- [ ] Document your payroll calculation methods
- [ ] Prepare sample data sets

**HMRC Requirements:**
- Multiple employees
- Different tax codes
- Starters & leavers
- Statutory Sick Pay (SSP)
- Statutory Maternity Pay (SMP)
- Pension deductions
- Zero-pay periods
- Corrections & adjustments

**Estimated Time:** 1-2 weeks preparation

### Step 13: Submit Conformance Testing Request
**If using master application (recommended):**
- [ ] Contact HMRC to request conformance testing for YOUR platform
- [ ] Provide required documentation
- [ ] Set up test environment access
- [ ] Schedule testing sessions
- [ ] Once approved, all companies can use it

**If per-company applications:**
- [ ] Each company contacts HMRC separately
- [ ] Each company provides their own documentation
- [ ] Each company schedules their own testing

**Estimated Time:** 1-2 weeks (HMRC response time)

### Step 14: Complete Conformance Testing
**Master Application Approach:**
- [ ] Run all required test scenarios (once for platform)
- [ ] Fix any issues found
- [ ] Resubmit if needed
- [ ] Pass all HMRC checks
- [ ] Once approved, all companies benefit

**Per-Company Approach:**
- [ ] Each company runs test scenarios
- [ ] Each company fixes issues
- [ ] Each company completes testing independently

**Estimated Time:** 4-12 weeks (HMRC testing timeline)

---

## 🚀 Phase 6: Production Deployment (After Conformance)

### Step 15: Switch Company to Production Environment
**For EACH company (individually):**
- [ ] Company admin updates HMRC settings to `production`
- [ ] Use production OAuth credentials (master or company-specific)
- [ ] Use company's real PAYE references
- [ ] Test with small batch first
- [ ] Monitor initial submissions closely
- [ ] Enable auto-submit when ready

**Estimated Time:** 1 week per company

### Step 16: Company Go Live
**For EACH company:**
- [ ] Enable auto-submit for that company's payroll runs
- [ ] Monitor submission success rates (per company)
- [ ] Set up error alerts (company-specific)
- [ ] Train company staff on RTI process
- [ ] Document procedures

**Estimated Time:** Ongoing per company

---

## 📊 Phase 7: Ongoing Maintenance

### Step 17: Monitor & Maintain
- [ ] Monitor submission success rates
- [ ] Review HMRC error responses
- [ ] Update for new tax year changes
- [ ] Keep HMRC API integration updated
- [ ] Review and update calculations annually

**Ongoing Tasks:**
- [ ] Update tax year configurations each April
- [ ] Monitor HMRC API changes
- [ ] Update fraud prevention headers if needed
- [ ] Review and update employee data regularly

---

## 🔍 Quick Reference: Key Files

### Backend Services
- `src/backend/services/hmrc/HMRCAuthService.ts` - OAuth authentication
- `src/backend/services/hmrc/FraudPreventionService.ts` - Fraud headers
- `src/backend/services/hmrc/RTIXMLGenerator.ts` - XML generation
- `src/backend/services/hmrc/HMRCAPIClient.ts` - API client
- `src/backend/services/hmrc/RTIValidationService.ts` - Validation

### Backend Functions
- `src/backend/functions/HMRCRTISubmission.tsx` - Submission functions
- `src/backend/functions/PayrollCalculation.tsx` - Payroll calculation

### Interfaces
- `src/backend/interfaces/Company.tsx` - `HMRCSettings` interface
- `src/backend/interfaces/HRs.tsx` - `Payroll` and `Employee` interfaces

### Documentation
- `HMRC_INTEGRATION_COMPLETE.md` - Complete integration guide
- `HMRC_INTEGRATION_QUICK_START.md` - Quick reference
- `HMRC_INTEGRATION_VERIFICATION.md` - Verification details

---

## ⚠️ Important Reminders

1. **Always test in sandbox first** - Never test with production credentials
2. **Complete conformance testing** - Required before production use
3. **Keep credentials secure** - Encrypt OAuth tokens in database
4. **Monitor submissions** - Set up alerts for failures
5. **Update annually** - Tax year changes require updates

---

## 📞 Support Resources

- **HMRC Developer Hub:** https://developer.service.hmrc.gov.uk/
- **HMRC API Documentation:** https://developer.service.hmrc.gov.uk/api-documentation
- **HMRC Support:** Contact through Developer Hub

---

## ✅ Priority Checklist

### Platform Level (You - One Time):
**Immediate (This Week):**
- [ ] Register master application with HMRC Developer Hub
- [ ] Get OAuth credentials for platform
- [ ] Set up OAuth callback handler (company-aware)

**Short Term (Next 2 Weeks):**
- [ ] Create HMRC settings UI (company-aware)
- [ ] Create RTI submission UI (company-aware)
- [ ] Test OAuth flow with test company
- [ ] Test FPS submission in sandbox (with test company)

**Medium Term (Next Month):**
- [ ] Complete sandbox testing
- [ ] Prepare for conformance testing
- [ ] Create company onboarding documentation

**Long Term (3-6 Months):**
- [ ] Complete conformance testing (once for platform)
- [ ] Deploy to production
- [ ] Onboard first real company

### Per Company (Each Company):
**Onboarding:**
- [ ] Enter PAYE reference
- [ ] Enter Accounts Office reference
- [ ] Complete OAuth authorization
- [ ] Verify employee data completeness
- [ ] Test in sandbox
- [ ] Switch to production when ready

---

## 🎯 Success Criteria

### Platform Level:
- ✅ Master application registered
- ✅ OAuth flow working (company-aware)
- ✅ Settings UI created (multi-tenant)
- ✅ Submission UI created (multi-tenant)
- ✅ Conformance testing completed (once)
- ✅ First company successfully onboarded

### Per Company:
- ✅ Company OAuth completed
- ✅ Company settings configured
- ✅ Test FPS submissions succeed in sandbox
- ✅ XML validation passes
- ✅ Production credentials configured
- ✅ First production submission succeeds
- ✅ Auto-submit working correctly

---

## 📚 Related Documentation

- **`HMRC_MULTI_TENANT_GUIDE.md`** - Detailed multi-tenant architecture guide
- **`HMRC_INTEGRATION_COMPLETE.md`** - Complete integration documentation
- **`HMRC_INTEGRATION_QUICK_START.md`** - Quick reference guide
- **`HMRC_INTEGRATION_VERIFICATION.md`** - Verification details

---

**Current Status:** 
- ✅ Backend integration 100% complete
- ✅ Multi-tenant architecture implemented
- ✅ Company-specific data isolation verified

**Next Action:** 
1. Register master application with HMRC Developer Hub
2. Create company HMRC settings UI
3. Test with first company

Good luck with your multi-tenant HMRC integration! 🚀


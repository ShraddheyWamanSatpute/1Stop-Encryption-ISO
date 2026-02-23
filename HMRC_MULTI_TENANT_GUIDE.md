# HMRC Integration - Multi-Tenant Guide

This guide explains how the HMRC integration works in your **HR software platform** where:
- **You** provide the HR/payroll software (SaaS platform)
- **Multiple companies** use your software
- **Each company** manages their own employees
- **Each company** has their own HMRC credentials and settings
- **Each company** submits their own payroll to HMRC

---

## 🏢 Multi-Tenant Architecture

### Platform Structure

**Your Platform (HR Software):**
- Provides the software infrastructure
- Handles multi-tenant data isolation
- Manages OAuth flows
- Processes payroll calculations
- Generates RTI submissions

**Each Company Using Your Software:**
- Manages their own employees
- Configures their own HMRC settings
- Has their own PAYE reference
- Has their own Accounts Office reference
- Completes their own OAuth authorization
- Submits their own payroll to HMRC

### Key Points

✅ **Each company has their own:**
- **Employees** - Stored at `companies/{companyId}/sites/{siteId}/data/hr/employees/`
- **Payroll records** - Stored at `companies/{companyId}/sites/{siteId}/data/hr/payrolls/`
- **HMRC settings** - Stored at `companies/{companyId}/sites/{siteId}/data/company/hmrcSettings`
- **PAYE reference** - Company's own reference (e.g., `123/AB45678`)
- **Accounts Office reference** - Company's own reference (e.g., `123PA00012345`)
- **OAuth tokens** - Company-specific tokens (access token, refresh token)
- **Submission history** - Company-specific RTI submissions

✅ **Data Isolation:**
- All employee data stored per company/site
- All payroll data stored per company/site
- All HMRC settings stored per company/site
- Database path: `companies/{companyId}/sites/{siteId}/data/...`
- Each company's data is completely separate

✅ **Independent OAuth Flows:**
- Each company completes their own OAuth authorization
- Tokens stored per company
- Token refresh handled per company

---

## 📋 Setup Process Per Company

### For Each New Company Using Your Software:

#### Step 1: Company Onboarding
**When a new company signs up for your HR software:**

1. **Company creates account** in your platform
2. **Company sets up their employees** (using your employee management features)
3. **Company configures HMRC settings:**
   - Enters their PAYE reference
   - Enters their Accounts Office reference
   - Completes OAuth authorization (one-time)
4. **Company starts using payroll features**

**Note:** The company manages their own employees and HMRC credentials. You just provide the software platform.

#### Step 2: Company Sets Up Employees
**Each company uses your HR software to:**
- Add their employees
- Enter employee details (name, NI number, tax code, etc.)
- Set up payroll information
- All stored at: `companies/{companyId}/sites/{siteId}/data/hr/employees/`

#### Step 3: Company Configures HMRC Settings
**Each company configures their HMRC integration:**
- Enters their PAYE reference (e.g., `123/AB45678`)
- Enters their Accounts Office reference (e.g., `123PA00012345`)
- Completes OAuth authorization (one-time, using your master app or their own)
- Settings stored at: `companies/{companyId}/sites/{siteId}/data/company/hmrcSettings`

```typescript
// Each company's settings stored separately
companies/{companyId}/sites/{siteId}/data/company/hmrcSettings: {
  employerPAYEReference: "123/AB45678", // Company A's PAYE ref
  accountsOfficeReference: "123PA00012345", // Company A's AO ref
  hmrcEnvironment: "sandbox",
  hmrcClientId: "YOUR_MASTER_CLIENT_ID", // Or company-specific
  hmrcClientSecret: "YOUR_MASTER_CLIENT_SECRET", // Or company-specific
  hmrcAccessToken: "COMPANY_A_TOKEN", // Company-specific token
  hmrcRefreshToken: "COMPANY_A_REFRESH_TOKEN", // Company-specific
  autoSubmitFPS: true
}
```

#### Step 4: Company Runs Payroll
**Each company:**
- Creates payroll records for their employees
- Approves payroll (triggers HMRC submission if enabled)
- Submits RTI data to HMRC for their employees only
- All payroll data stored at: `companies/{companyId}/sites/{siteId}/data/hr/payrolls/`

---

## 🔧 Implementation Details

### Current Implementation (Already Multi-Tenant Ready)

✅ **Company-Specific Settings:**
```typescript
// HMRCRTISubmission.tsx
async function fetchHMRCSettings(companyId: string, siteId: string): Promise<HMRCSettings | null> {
  const settingsRef = ref(db, `companies/${companyId}/sites/${siteId}/data/company/hmrcSettings`)
  // ... fetches company-specific settings
}
```

✅ **Company-Specific Submissions:**
```typescript
// All submission functions take companyId and siteId
await submitFPSForPayrollRun(
  companyId,  // Company-specific
  siteId,     // Site-specific
  [payrollId],
  userId
)
```

✅ **Company-Specific OAuth:**
```typescript
// HMRCAuthService.ts
async getValidAccessToken(
  hmrcSettings: HMRCSettings, // Company-specific settings
  refreshCallback?: (newToken: HMRCTokenResponse) => Promise<void>
): Promise<string> {
  // Uses company's own tokens
}
```

---

## 🎯 Two Approaches for Multi-Tenant HMRC

### Approach 1: Master Application (Recommended for SaaS)

**How it works:**
- You register ONE application with HMRC Developer Hub
- All companies use YOUR application credentials
- Each company still has their own PAYE references
- Each company completes OAuth using YOUR app
- Tokens stored per company

**Pros:**
- Simpler setup (one registration)
- Easier to manage
- Faster onboarding for new companies
- You control the application

**Cons:**
- All companies share one application
- If one company has issues, might affect others
- Less flexibility per company

**Implementation:**
```typescript
// In HMRCSettings, use same client_id/secret for all companies
// But each company has their own tokens
{
  hmrcClientId: "YOUR_MASTER_CLIENT_ID", // Same for all
  hmrcClientSecret: "YOUR_MASTER_CLIENT_SECRET", // Same for all
  employerPAYEReference: "COMPANY_SPECIFIC", // Different per company
  accountsOfficeReference: "COMPANY_SPECIFIC", // Different per company
  hmrcAccessToken: "COMPANY_SPECIFIC_TOKEN", // Different per company
  hmrcRefreshToken: "COMPANY_SPECIFIC_TOKEN" // Different per company
}
```

### Approach 2: Per-Company Applications

**How it works:**
- Each company registers their own application
- Each company has their own credentials
- Complete independence per company

**Pros:**
- Complete isolation
- Company controls their own application
- More flexibility

**Cons:**
- More complex setup
- Each company must register
- More management overhead

**Implementation:**
```typescript
// Each company has completely different credentials
{
  hmrcClientId: "COMPANY_A_CLIENT_ID", // Different per company
  hmrcClientSecret: "COMPANY_A_CLIENT_SECRET", // Different per company
  employerPAYEReference: "COMPANY_A_PAYE", // Different per company
  // ... all company-specific
}
```

---

## 🚀 Recommended Setup for Your HR Software Platform

### Platform-Level Setup (You - One Time):

1. **Register Master Application**
   - Register ONE application with HMRC Developer Hub
   - Use this master app for all companies using your software
   - Store credentials securely (environment variables)
   - Complete conformance testing once for your platform

2. **Build Company Onboarding Flow:**
   ```
   New Company Signs Up →
   Company Adds Their Employees →
   Company Enters PAYE Reference →
   Company Enters Accounts Office Reference →
   Company Clicks "Connect to HMRC" →
   Company Completes OAuth (authorizes your master app) →
   Company Ready to Use Payroll & HMRC Features
   ```

3. **OAuth Flow Per Company:**
   - Each company authorizes YOUR master application
   - Each company gets their own OAuth tokens
   - Tokens stored per company in database
   - Each company's tokens are completely independent

4. **Company Settings UI:**
   - Company admin enters their PAYE/AO references
   - Company admin clicks "Connect to HMRC" button
   - Company completes OAuth flow (one-time)
   - System stores company-specific tokens
   - Company can then use payroll features

---

## 📝 Updated Next Steps (Multi-Tenant)

### Phase 1: Platform Setup (You - One Time)

1. **Register Master Application**
   - [ ] Register on HMRC Developer Hub
   - [ ] Create ONE application for your platform
   - [ ] Get `client_id` and `client_secret`
   - [ ] Store securely (environment variables or secure config)

2. **Configure Platform Settings**
   - [ ] Set up OAuth redirect URI
   - [ ] Configure callback handler
   - [ ] Test OAuth flow

### Phase 2: Per-Company Setup (Each Company)

3. **Company Configuration**
   - [ ] Company admin enters PAYE reference
   - [ ] Company admin enters Accounts Office reference
   - [ ] Company admin clicks "Connect to HMRC"
   - [ ] Company completes OAuth authorization
   - [ ] System stores company-specific tokens

4. **Company Testing**
   - [ ] Test FPS submission for that company
   - [ ] Verify company-specific data
   - [ ] Test in sandbox first

### Phase 3: Production (Per Company)

5. **Company Conformance Testing**
   - [ ] Each company completes conformance testing
   - [ ] OR use your master application (if approved)

6. **Company Go-Live**
   - [ ] Switch company to production
   - [ ] Enable auto-submit for that company
   - [ ] Monitor submissions

---

## 🔐 Security Considerations

### Token Storage
```typescript
// Store tokens per company, encrypted
companies/{companyId}/sites/{siteId}/data/company/hmrcSettings: {
  hmrcAccessToken: "ENCRYPTED_TOKEN", // Encrypt before storing
  hmrcRefreshToken: "ENCRYPTED_TOKEN", // Encrypt before storing
  hmrcTokenExpiry: timestamp
}
```

### Credential Management
- **Master credentials:** Store in environment variables or secure vault
- **Company tokens:** Encrypt in database
- **Never expose:** Client secrets in frontend or logs

---

## 🎨 UI Requirements (Multi-Tenant)

### Company Settings Page
**Location:** `src/frontend/components/hr/HMRCSettings.tsx`

**Features:**
- [ ] Company PAYE reference input
- [ ] Company Accounts Office reference input
- [ ] "Connect to HMRC" button (triggers OAuth)
- [ ] OAuth callback handler
- [ ] Connection status indicator
- [ ] Token expiry warning
- [ ] "Reconnect" button if token expired
- [ ] Environment selector (sandbox/production)
- [ ] Auto-submit toggle

### Submission Page
**Features:**
- [ ] Shows only company's payroll records
- [ ] Company-specific submission status
- [ ] Company-specific error messages
- [ ] Submission history per company

---

## 📊 Database Structure (Multi-Tenant HR Software)

```
companies/
  {companyId}/                    # Company A
    sites/
      {siteId}/
        data/
          company/
            hmrcSettings/          # Company A's HMRC settings
              employerPAYEReference: "123/AB45678"  # Company A's PAYE ref
              accountsOfficeReference: "123PA00012345"  # Company A's AO ref
              hmrcClientId: "YOUR_MASTER_CLIENT_ID"  # Your platform's app
              hmrcClientSecret: "YOUR_MASTER_CLIENT_SECRET"  # Your platform's app
              hmrcAccessToken: "COMPANY_A_TOKEN"  # Company A's token
              hmrcRefreshToken: "COMPANY_A_REFRESH_TOKEN"  # Company A's token
              hmrcTokenExpiry: timestamp
              autoSubmitFPS: true
          hr/
            employees/             # Company A's employees
              {employeeId}/
                firstName: "John"
                lastName: "Smith"
                nationalInsuranceNumber: "AB123456C"
                taxCode: "1257L"
                niCategory: "A"
                # ... all employee data
            payrolls/              # Company A's payroll records
              {payrollId}/
                employeeId: "..."
                grossPay: 2500.00
                taxDeductions: 500.00
                submittedToHMRC: true
                fpsSubmissionId: "..."
                # ... all payroll data

  {companyId}/                    # Company B (completely separate)
    sites/
      {siteId}/
        data/
          company/
            hmrcSettings/          # Company B's HMRC settings
              employerPAYEReference: "456/CD78901"  # Company B's PAYE ref
              accountsOfficeReference: "456PA00078901"  # Company B's AO ref
              hmrcAccessToken: "COMPANY_B_TOKEN"  # Company B's token
              # ... Company B's settings
          hr/
            employees/             # Company B's employees (separate from Company A)
            payrolls/              # Company B's payroll records (separate from Company A)
```

**Key Points:**
- Each company's data is completely isolated
- Each company manages their own employees
- Each company has their own HMRC credentials
- Each company submits their own payroll to HMRC
- Your platform just provides the software infrastructure

---

## ✅ Verification Checklist

### Platform Level (You):
- [ ] Master application registered
- [ ] OAuth flow working
- [ ] Settings UI created
- [ ] Multi-tenant data isolation verified

### Per Company:
- [ ] PAYE reference configured
- [ ] Accounts Office reference configured
- [ ] OAuth completed
- [ ] Tokens stored securely
- [ ] Test submission successful
- [ ] Production ready

---

## 🚨 Important Notes

1. **Each company is independent** - One company's issues don't affect others
2. **Tokens are per company** - Each company has their own OAuth tokens
3. **Settings are per company** - Each company configures their own settings
4. **Submissions are per company** - Each company submits their own payroll
5. **Conformance testing** - Can be done once for master app, or per company

---

## 📞 Support Model

### For Your Platform:
- You manage the master application
- You provide OAuth integration
- You handle token refresh logic
- You provide UI for company configuration

### For Each Company:
- Company provides their PAYE/AO references
- Company completes OAuth authorization
- Company manages their own employee data
- Company responsible for data accuracy

---

**Current Status:** ✅ Multi-tenant architecture already implemented  
**Next Action:** Register master application and create company settings UI


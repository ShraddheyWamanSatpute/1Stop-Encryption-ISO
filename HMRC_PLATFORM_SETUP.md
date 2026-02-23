# HMRC Integration - Platform Setup Guide

**For HR Software Platform Providers**

This guide is specifically for **you** (the HR software platform) setting up HMRC integration so that **your customers** (companies) can use it to manage their payroll and submit to HMRC.

**Related Documentation:**
- `HMRC_DEVELOPER_HUB_BEST_PRACTICES.md` - Technical requirements and compliance checklist
- `HMRC_API_INTEGRATION_GUIDE.md` - API endpoints and XML schemas
- `HMRC_QUICK_START.md` - Quick start guide for developers

---

## 🎯 Your Role vs. Company Role

### Your Platform (HR Software):
- ✅ Provides the software infrastructure
- ✅ Registers ONE master application with HMRC
- ✅ Handles OAuth flows for all companies
- ✅ Processes payroll calculations
- ✅ Generates RTI XML submissions
- ✅ Manages multi-tenant data isolation

### Each Company Using Your Software:
- ✅ Manages their own employees
- ✅ Enters their own PAYE reference
- ✅ Enters their own Accounts Office reference
- ✅ Completes OAuth authorization (one-time)
- ✅ Runs their own payroll
- ✅ Submits their own RTI data to HMRC

---

## 🚀 Platform Setup (You - One Time)

### Step 1: Register Master Application with HMRC

> ⚠️ **CRITICAL: SINGLE APPLICATION ONLY**
>
> HMRC Developer Hub requires **exactly ONE production application** per vendor.
> - Do NOT create multiple applications for different customers
> - Do NOT create separate applications for different features
> - Use OAuth tokens to isolate customer data (not separate apps)

**You register ONE application for your entire platform:**

1. Go to https://developer.service.hmrc.gov.uk/
2. Create Government Gateway account (if needed)
3. **Register your application with YOUR COMPANY NAME:**

   ```
   ┌──────────────────────────────────────────────────┐
   │ Application Name: [Your Company Name] HR Platform│
   │                                                  │
   │ Examples:                                        │
   │   ✅ 1Stop HR Platform                           │
   │   ✅ Acme Payroll Solutions                      │
   │   ✅ SmallBiz Payroll Pro                        │
   │                                                  │
   │ DO NOT use:                                      │
   │   ❌ Customer A Payroll                          │
   │   ❌ Test Application                            │
   │   ❌ HMRC Integration App                        │
   └──────────────────────────────────────────────────┘
   ```

4. Get `client_id` and `client_secret`
5. Set redirect URI: `https://yourdomain.com/hmrc/callback`
6. Store credentials securely in Firebase Secrets (NOT in code!)

**This ONE application will be used by ALL companies using your software.**

**Estimated Time:** 1-2 days

### Why Only One Application?

| Aspect | Single App (Correct) | Multiple Apps (Wrong) |
|--------|---------------------|----------------------|
| HMRC Approval | 1 approval process | Multiple lengthy approvals |
| Maintenance | Single credential set | Multiple credentials to manage |
| Updates | Update once | Update multiple times |
| Conformance Testing | Test once | Test each app separately |
| Customer Isolation | OAuth tokens | No benefit |

### Step 2: Build Company HMRC Settings UI

**Create UI for companies to configure their HMRC integration:**

**Location:** `src/frontend/components/hr/HMRCSettings.tsx`

**Features Needed:**
- [ ] Form for company PAYE reference
- [ ] Form for company Accounts Office reference
- [ ] "Connect to HMRC" button (triggers OAuth)
- [ ] OAuth callback handler (stores tokens per company)
- [ ] Connection status indicator
- [ ] Token expiry warning
- [ ] "Reconnect" button if needed
- [ ] Environment selector (sandbox/production)
- [ ] Auto-submit toggle

**How it works:**
1. Company admin enters their PAYE/AO references
2. Company clicks "Connect to HMRC"
3. Company is redirected to HMRC (using YOUR master app)
4. Company authorizes YOUR application
5. Company is redirected back to your platform
6. Your platform stores company-specific tokens
7. Company can now use HMRC features

**Estimated Time:** 3-5 days

### Step 3: Complete Conformance Testing

**You complete conformance testing ONCE for your platform:**

- [ ] Contact HMRC for conformance testing
- [ ] Run all required test scenarios
- [ ] Pass HMRC validation
- [ ] Once approved, ALL companies can use it

**Note:** Once your platform passes conformance testing, all companies using your software benefit. They don't need to do their own testing.

**Estimated Time:** 4-12 weeks (HMRC timeline)

---

## 🏢 Company Onboarding Process

### For Each New Company:

#### Step 1: Company Signs Up
- Company creates account in your platform
- Company gets their own `companyId`
- Company data is isolated from other companies

#### Step 2: Company Adds Employees
- Company uses your employee management features
- Company enters employee details:
  - Name, email, phone
  - **National Insurance Number** (required for HMRC)
  - Tax code (default: `1257L`)
  - NI category (default: `A`)
  - Student loan plan (if applicable)
  - Pension details (if applicable)
- All stored at: `companies/{companyId}/sites/{siteId}/data/hr/employees/`

#### Step 3: Company Configures HMRC
- Company admin goes to HMRC Settings page
- Enters their PAYE reference (e.g., `123/AB45678`)
- Enters their Accounts Office reference (e.g., `123PA00012345`)
- Clicks "Connect to HMRC"
- Completes OAuth authorization (one-time)
- Settings stored at: `companies/{companyId}/sites/{siteId}/data/company/hmrcSettings`

#### Step 4: Company Uses Payroll Features
- Company creates payroll records for their employees
- Company approves payroll
- System automatically submits to HMRC (if auto-submit enabled)
- Company can view submission status
- All payroll stored at: `companies/{companyId}/sites/{siteId}/data/hr/payrolls/`

---

## 🔐 Security & Data Isolation

### Token Storage (Per Company)
```typescript
// Each company's tokens stored separately
companies/{companyId}/sites/{siteId}/data/company/hmrcSettings: {
  hmrcAccessToken: "ENCRYPTED_COMPANY_A_TOKEN",
  hmrcRefreshToken: "ENCRYPTED_COMPANY_A_TOKEN",
  hmrcTokenExpiry: timestamp
}
```

### Credential Management
- **Master credentials (your platform):** Store in environment variables
- **Company tokens:** Encrypt in database, per company
- **Never expose:** Client secrets in frontend or logs

### Data Isolation
- ✅ Each company's employees are separate
- ✅ Each company's payroll is separate
- ✅ Each company's HMRC settings are separate
- ✅ Each company's submissions are separate
- ✅ One company cannot see another company's data

---

## 🌐 Network Configuration

> ⚠️ **CRITICAL: HMRC uses DYNAMIC IP addresses**
>
> HMRC API servers run on cloud infrastructure with changing IP addresses.
> **DO NOT** configure firewall rules based on IP addresses!

### Domain-Based Access (REQUIRED)

Configure your network/proxy/firewall to allow outbound HTTPS (port 443) to these domains:

```
┌─────────────────────────────────────────────────────────────┐
│ REQUIRED DOMAINS                                            │
├─────────────────────────────────────────────────────────────┤
│ Production:  api.service.hmrc.gov.uk                        │
│ Sandbox:     test-api.service.hmrc.gov.uk                   │
│                                                             │
│ ⚠️ DO NOT whitelist by IP address - IPs change!            │
└─────────────────────────────────────────────────────────────┘
```

### Certificate Management

```
┌─────────────────────────────────────────────────────────────┐
│ CERTIFICATES                                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Use system/OS root CA keystore (default in Node.js)     │
│ ❌ DO NOT import HMRC-specific certificates                │
│ ❌ DO NOT pin certificates                                  │
│                                                             │
│ HMRC uses standard TLS certificates from trusted CAs.       │
│ Your system's root CA store handles this automatically.     │
└─────────────────────────────────────────────────────────────┘
```

### CORS Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ CORS HANDLING                                               │
├─────────────────────────────────────────────────────────────┤
│ HMRC APIs do NOT support CORS headers.                     │
│                                                             │
│ ✅ All HMRC calls MUST go through Firebase Functions        │
│ ❌ Direct browser → HMRC calls will fail                    │
│                                                             │
│ Architecture:                                               │
│   Browser → Firebase Functions → HMRC API                   │
│             (server-side proxy)                             │
└─────────────────────────────────────────────────────────────┘
```

### Firewall Rules Example

If your organization requires explicit firewall rules:

```bash
# CORRECT: Domain-based rules
iptables -A OUTPUT -p tcp --dport 443 -d api.service.hmrc.gov.uk -j ACCEPT
iptables -A OUTPUT -p tcp --dport 443 -d test-api.service.hmrc.gov.uk -j ACCEPT

# WRONG: IP-based rules (DO NOT USE)
# iptables -A OUTPUT -p tcp --dport 443 -d 3.10.50.0/24 -j ACCEPT  # IPs change!
```

### Corporate Proxy Configuration

If behind a corporate proxy, configure your Firebase Functions or server:

```typescript
// For Node.js environments with proxy
import { HttpsProxyAgent } from 'https-proxy-agent'

const proxyAgent = new HttpsProxyAgent('http://corporate-proxy:8080')
const response = await fetch(hmrcUrl, { agent: proxyAgent })
```

---

## 📋 Implementation Checklist

### Platform Level (You):
- [ ] Register master application with HMRC
- [ ] Store master credentials securely
- [ ] Build company HMRC settings UI
- [ ] Implement OAuth callback handler
- [ ] Test OAuth flow with test company
- [ ] Complete conformance testing
- [ ] Deploy to production

### Per Company (Automatic via UI):
- [ ] Company enters PAYE reference
- [ ] Company enters Accounts Office reference
- [ ] Company completes OAuth
- [ ] Company adds employees
- [ ] Company runs payroll
- [ ] System submits to HMRC

---

## 🎨 UI Components Needed

### 1. HMRC Settings Page
**For company admins to configure HMRC:**
- PAYE reference input
- Accounts Office reference input
- "Connect to HMRC" button
- Connection status
- Token expiry warning

### 2. Payroll Submission Status
**Show company their submission status:**
- List of approved payrolls ready for submission
- Manual submission button
- Submission history
- Error messages (if any)

### 3. Employee Data Validation
**Ensure employees have required HMRC data:**
- NI number required
- Tax code default
- NI category default
- Warnings for incomplete data

---

## ✅ Current Implementation Status

**Already Complete:**
- ✅ Multi-tenant data isolation
- ✅ Company-specific HMRC settings storage
- ✅ Company-specific OAuth token handling
- ✅ Company-specific payroll submissions
- ✅ Backend RTI submission functions
- ✅ XML generation
- ✅ Validation

**Still Needed:**
- [ ] Master application registration
- [ ] Company HMRC settings UI
- [ ] OAuth callback handler
- [ ] Conformance testing

---

## 🚀 Next Steps

1. **Register master application** with HMRC Developer Hub
2. **Build company HMRC settings UI** so companies can configure their integration
3. **Test with first company** in sandbox
4. **Complete conformance testing** for your platform
5. **Onboard companies** - they configure their own settings

---

**Your platform provides the infrastructure. Each company manages their own employees and HMRC integration!** 🎯


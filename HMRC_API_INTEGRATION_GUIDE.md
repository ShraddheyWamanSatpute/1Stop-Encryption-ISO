# 🔗 HMRC API Integration Guide - Direct RTI Submission
**Future Implementation: Option 3 - Automated RTI Submissions**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [HMRC Developer Hub Setup](#hmrc-developer-hub-setup)
4. [OAuth 2.0 Authentication](#oauth-20-authentication)
5. [API Endpoints](#api-endpoints)
6. [FPS (Full Payment Submission)](#fps-full-payment-submission)
7. [EPS (Employer Payment Summary)](#eps-employer-payment-summary)
8. [Fraud Prevention Headers](#fraud-prevention-headers)
9. [XML Schema & Generation](#xml-schema--generation)
10. [Testing in Sandbox](#testing-in-sandbox)
11. [Production Deployment](#production-deployment)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Code Structure](#code-structure)
14. [Error Handling](#error-handling)
15. [Maintenance & Updates](#maintenance--updates)

---

## Overview

This guide outlines how to implement **direct HMRC API integration** for automated Real Time Information (RTI) submissions from your payroll system.

### What You'll Achieve:
- ✅ Automated FPS submission on payday (no manual entry)
- ✅ Automated EPS submission (monthly)
- ✅ Real-time validation from HMRC
- ✅ Immediate submission confirmations
- ✅ Automated error handling and retry logic
- ✅ Full audit trail with HMRC responses

### Current System Status:
Your payroll system **already has**:
- ✅ All HMRC-required data fields
- ✅ Correct calculations (tax, NI, pensions, loans)
- ✅ Data structures ready for API integration
- ✅ YTD tracking
- ✅ Audit logging infrastructure

**What's Missing:** Just the API connection layer (this guide)

---

## Prerequisites

### 1. Business Requirements
- [ ] **Active HMRC PAYE Scheme** - You must have an Employer PAYE Reference (e.g., 123/AB45678)
- [ ] **Accounts Office Reference** - Your HMRC reference (e.g., 123PA00012345)
- [ ] **Government Gateway Account** - For accessing HMRC services
- [ ] **PAYE Online Activation** - Must be registered for PAYE Online

### 2. Technical Requirements
- [ ] **HTTPS/TLS 1.2+** - Secure connection capability
- [ ] **Server Infrastructure** - For OAuth callbacks and token storage
- [ ] **Development Environment** - Separate from production
- [ ] **XML Generation Capability** - For FPS/EPS payloads
- [ ] **Secure Credential Storage** - Encrypted database for OAuth tokens

### 3. Knowledge Requirements
- Understanding of OAuth 2.0 flow
- XML schema validation
- RESTful API integration
- UK payroll and RTI concepts
- HMRC submission timelines

### 4. Estimated Time
- **Setup & Registration:** 2-4 weeks (HMRC approval)
- **Development:** 4-6 weeks
- **Testing:** 2-4 weeks (sandbox testing)
- **Go-Live:** 1 week (production transition)
- **Total:** 9-15 weeks

---

## HMRC Developer Hub Setup

### Step 1: Register for HMRC Developer Hub

1. **Create Account:**
   - Visit: https://developer.service.hmrc.gov.uk/
   - Click "Register"
   - Create developer account with email verification

2. **Create Application:**
   - Log in to Developer Hub
   - Click "Add an application to the sandbox"
   - Choose "Production" when ready
   - Application name: "1Stop Payroll System"
   - Description: "Hospitality payroll management with RTI submission"

3. **Subscribe to APIs:**
   - **Pay As You Earn (PAYE) API**
   - Specifically:
     - Full Payment Submission (FPS)
     - Employer Payment Summary (EPS)
     - Employment Information (optional)

4. **Get Credentials:**
   ```
   Client ID: [Will be provided by HMRC]
   Client Secret: [Will be provided by HMRC]
   Server Token: [For server-side authentication]
   ```

5. **Set Redirect URIs:**
   ```
   Development: http://localhost:3000/hmrc/callback
   Production: https://your-domain.com/hmrc/callback
   ```

### Step 2: Application Approval Process

**Sandbox (Immediate):**
- Instant access to test environment
- Use test credentials
- Test all scenarios

**Production (2-4 weeks):**
- Submit production access request
- HMRC reviews your application
- May require:
  - Company verification
  - Software demonstration
  - Fraud prevention compliance proof
- Approval typically takes 2-4 weeks

---

## OAuth 2.0 Authentication

### Flow Overview

```
User → Your App → HMRC Auth → Authorize → HMRC → Access Token → Your App
```

### Implementation Steps

#### 1. Authorization Request

```typescript
// src/backend/services/hmrc/HMRCAuth.ts

interface HMRCAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

class HMRCAuthService {
  private config: HMRCAuthConfig
  private baseUrl: string

  constructor(config: HMRCAuthConfig) {
    this.config = config
    this.baseUrl = config.environment === 'sandbox'
      ? 'https://test-api.service.hmrc.gov.uk'
      : 'https://api.service.hmrc.gov.uk'
  }

  /**
   * Step 1: Generate authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      scope: 'read:paye write:paye',
      redirect_uri: this.config.redirectUri,
      state: state // CSRF protection
    })

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`
  }

  /**
   * Step 2: Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<HMRCTokens> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
        code: code,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    const tokens: HMRCTokens = await response.json()
    
    // Store tokens securely (encrypted in database)
    await this.storeTokens(tokens)
    
    return tokens
  }

  /**
   * Step 3: Refresh access token when expired
   */
  async refreshAccessToken(refreshToken: string): Promise<HMRCTokens> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens: HMRCTokens = await response.json()
    await this.storeTokens(tokens)
    
    return tokens
  }

  /**
   * Store tokens securely (implement encryption)
   */
  private async storeTokens(tokens: HMRCTokens): Promise<void> {
    // TODO: Implement secure storage in Firebase with encryption
    // Store: access_token, refresh_token, expires_in, token_type
  }
}

interface HMRCTokens {
  access_token: string
  refresh_token: string
  expires_in: number // seconds
  token_type: 'Bearer'
}
```

#### 2. Token Management

```typescript
// src/backend/services/hmrc/TokenManager.ts

class HMRCTokenManager {
  async getValidAccessToken(): Promise<string> {
    // 1. Retrieve stored token from database
    const storedToken = await this.retrieveStoredToken()
    
    // 2. Check if expired
    if (this.isTokenExpired(storedToken)) {
      // 3. Refresh if needed
      const newTokens = await this.refreshAccessToken(storedToken.refresh_token)
      return newTokens.access_token
    }
    
    return storedToken.access_token
  }

  private isTokenExpired(token: StoredToken): boolean {
    const expiryTime = token.issuedAt + token.expiresIn
    const now = Date.now()
    // Refresh 5 minutes before actual expiry
    return now >= (expiryTime - 300000)
  }
}
```

---

## API Endpoints

### Base URLs

**Sandbox (Testing):**
```
https://test-api.service.hmrc.gov.uk
```

**Production (Live):**
```
https://api.service.hmrc.gov.uk
```

### Key Endpoints

#### 1. Full Payment Submission (FPS)

```
POST /paye/employers/{employerRef}/submissions/fps
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/xml
Gov-Client-Connection-Method: WEB_APP_VIA_SERVER
Gov-Client-Device-ID: {device_id}
Gov-Client-User-IDs: {user_ids}
Gov-Client-Timezone: UTC+00:00
Gov-Client-Local-IPs: {local_ips}
Gov-Client-Screens: {screen_details}
```

**Request Body:** FPS XML (see below)

#### 2. Employer Payment Summary (EPS)

```
POST /paye/employers/{employerRef}/submissions/eps
```

**Headers:** Same as FPS

**Request Body:** EPS XML (see below)

#### 3. Get Submission Status

```
GET /paye/employers/{employerRef}/submissions/{submissionId}
```

#### 4. List Recent Submissions

```
GET /paye/employers/{employerRef}/submissions?from={date}&to={date}
```

---

## FPS (Full Payment Submission)

### When to Submit

**Required:** On or **before** the payday for each pay run

### What to Submit

For **each** payroll run, submit:
- Employee details (name, NI number)
- Pay period information
- Gross pay, taxable pay
- Tax deducted
- NI contributions (employee + employer)
- Student loan deductions
- Pension contributions
- Statutory payments (SSP, SMP, SPP)
- Year-to-date figures

### FPS XML Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<IRenvelope xmlns="http://www.govtalk.gov.uk/taxation/PAYE/RTI/FullPaymentSubmission/14-15/1">
  <IRheader>
    <Keys>
      <Key Type="TaxOfficeNumber">123</Key>
      <Key Type="TaxOfficeReference">AB45678</Key>
    </Keys>
    <PeriodEnd>2024-10-31</PeriodEnd>
    <Sender>Software</Sender>
    <SenderID>1Stop Payroll v5</SenderID>
  </IRheader>
  
  <FullPaymentSubmission>
    <EmpRefs>
      <TaxOfficeNumber>123</TaxOfficeNumber>
      <TaxOfficeReference>AB45678</TaxOfficeReference>
      <AccountsOfficeRef>123PA00012345</AccountsOfficeRef>
    </EmpRefs>
    
    <RelatedTaxYear>24-25</RelatedTaxYear>
    
    <PaymentToNonEIOEmployee>
      <Employee>
        <EmployeeDetails>
          <NINO>AB123456C</NINO>
          <Name>
            <Surname>Smith</Surname>
            <Forename>John</Forename>
          </Name>
          <DateOfBirth>1985-06-15</DateOfBirth>
        </EmployeeDetails>
        
        <Employment>
          <PayrollID>EMP001</PayrollID>
          <NICategory>A</NICategory>
          <StartDate>2023-01-15</StartDate>
        </Employment>
        
        <Payment>
          <PayFrequency>M1</PayFrequency>
          <PeriodsCovered>1</PeriodsCovered>
          <AggregatedEarnings>2500.00</AggregatedEarnings>
          <TaxCode>1257L</TaxCode>
          <TaxCodeBasis>Cumulative</TaxCodeBasis>
          <TaxDeducted>250.00</TaxDeducted>
          <TaxablePayToDate>2500.00</TaxablePayToDate>
          <TaxDeductedToDate>250.00</TaxDeductedToDate>
          
          <NIContribution>
            <NICategory>A</NICategory>
            <NIableEarnings>2500.00</NIableEarnings>
            <EmployeeContribution>174.24</EmployeeContribution>
            <EmployerContribution>240.42</EmployerContribution>
            <NIableEarningsToDate>2500.00</NIableEarningsToDate>
            <EmployeeContributionToDate>174.24</EmployeeContributionToDate>
            <EmployerContributionToDate>240.42</EmployerContributionToDate>
          </NIContribution>
          
          <StudentLoan>
            <PlanType>2</PlanType>
            <DeductionAmount>20.34</DeductionAmount>
            <AmountDeductedToDate>20.34</AmountDeductedToDate>
          </StudentLoan>
          
          <Pension>
            <EmployeeContribution>125.00</EmployeeContribution>
            <EmployerContribution>75.00</EmployerContribution>
            <EmployeeContributionToDate>125.00</EmployeeContributionToDate>
            <EmployerContributionToDate>75.00</EmployerContributionToDate>
          </Pension>
          
          <PaymentDate>2024-10-31</PaymentDate>
          <TaxMonth>7</TaxMonth>
          <TaxWeek>30</TaxWeek>
        </Payment>
      </Employee>
    </PaymentToNonEIOEmployee>
    
  </FullPaymentSubmission>
</IRenvelope>
```

### FPS Generator Implementation

```typescript
// src/backend/services/hmrc/FPSGenerator.ts

interface FPSData {
  employerRef: string
  accountsOfficeRef: string
  taxYear: string
  employees: FPSEmployee[]
}

interface FPSEmployee {
  niNumber: string
  firstName: string
  lastName: string
  dateOfBirth: string
  payrollId: string
  niCategory: string
  taxCode: string
  taxCodeBasis: 'Cumulative' | 'Week1Month1'
  grossPay: number
  taxablePayThisPeriod: number
  taxablePayYTD: number
  taxDeductedThisPeriod: number
  taxDeductedYTD: number
  niablePayThisPeriod: number
  niablePayYTD: number
  employeeNIThisPeriod: number
  employeeNIYTD: number
  employerNIThisPeriod: number
  employerNIYTD: number
  studentLoan?: {
    plan: '1' | '2' | '4' | 'PG'
    deduction: number
    deductionYTD: number
  }
  pension?: {
    employeeContribution: number
    employerContribution: number
    employeeContributionYTD: number
    employerContributionYTD: number
  }
  paymentDate: string
  taxPeriod: number
}

class FPSGenerator {
  generateFPSXML(data: FPSData): string {
    // Build XML using template or XML builder library
    // Validate against HMRC schema
    // Return XML string
  }
  
  async validateXML(xml: string): Promise<boolean> {
    // Validate against official HMRC XSD schema
    // Return true if valid
  }
}
```

---

## EPS (Employer Payment Summary)

### When to Submit

**Required:** Monthly (or when needed to report specific items)

Submit by **19th of the month** following the tax month

### What to Submit

- Statutory payments (SSP, SMP, SPP recovery)
- Apprenticeship Levy
- Employment Allowance claims
- National Insurance Holiday claims
- Late reporting reasons
- No payment for period (if applicable)

### EPS XML Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<IRenvelope xmlns="http://www.govtalk.gov.uk/taxation/PAYE/RTI/EmployerPaymentSummary/14-15/1">
  <IRheader>
    <Keys>
      <Key Type="TaxOfficeNumber">123</Key>
      <Key Type="TaxOfficeReference">AB45678</Key>
    </Keys>
    <PeriodEnd>2024-10-31</PeriodEnd>
    <Sender>Software</Sender>
    <SenderID>1Stop Payroll v5</SenderID>
  </IRheader>
  
  <EmployerPaymentSummary>
    <EmpRefs>
      <TaxOfficeNumber>123</TaxOfficeNumber>
      <TaxOfficeReference>AB45678</TaxOfficeReference>
      <AccountsOfficeRef>123PA00012345</AccountsOfficeRef>
    </EmpRefs>
    
    <RelatedTaxYear>24-25</RelatedTaxYear>
    <RelatedTaxMonth>7</RelatedTaxMonth>
    
    <!-- If claiming employment allowance -->
    <EmploymentAllowanceIndicator>yes</EmploymentAllowanceIndicator>
    
    <!-- If paying apprenticeship levy -->
    <ApprenticeshipLevy>
      <LevyDueYTD>5000.00</LevyDueYTD>
      <AnnualAllowanceYTD>15000.00</AnnualAllowanceYTD>
    </ApprenticeshipLevy>
    
    <!-- If recovering statutory payments -->
    <StatutoryPaymentRecovery>
      <StatutoryMaternityPay>500.00</StatutoryMaternityPay>
      <StatutorySickPay>200.00</StatutorySickPay>
    </StatutoryPaymentRecovery>
    
    <!-- If no payment for period -->
    <NoPaymentForPeriod>no</NoPaymentForPeriod>
    
  </EmployerPaymentSummary>
</IRenvelope>
```

---

## Fraud Prevention Headers

**MANDATORY** - HMRC requires specific headers to prevent fraud

### Required Headers

```typescript
interface FraudPreventionHeaders {
  'Gov-Client-Connection-Method': string // e.g., 'WEB_APP_VIA_SERVER'
  'Gov-Client-Device-ID': string // Unique device identifier
  'Gov-Client-User-IDs': string // User identifiers
  'Gov-Client-Timezone': string // e.g., 'UTC+00:00'
  'Gov-Client-Local-IPs': string // Comma-separated IPs
  'Gov-Client-Screens': string // Screen resolution
  'Gov-Client-Window-Size': string // Window dimensions
  'Gov-Client-Browser-Plugins': string // Installed plugins
  'Gov-Client-Browser-JS-User-Agent': string // JS user agent
  'Gov-Client-Browser-Do-Not-Track': string // Do-not-track setting
  'Gov-Client-Multi-Factor': string // MFA methods used
}
```

### Implementation

```typescript
// src/backend/services/hmrc/FraudPrevention.ts

class FraudPreventionService {
  generateHeaders(req: Request): FraudPreventionHeaders {
    return {
      'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
      'Gov-Client-Device-ID': this.getDeviceId(req),
      'Gov-Client-User-IDs': this.getUserIds(req),
      'Gov-Client-Timezone': this.getTimezone(),
      'Gov-Client-Local-IPs': this.getLocalIPs(req),
      'Gov-Client-Screens': this.getScreenInfo(req),
      'Gov-Client-Window-Size': this.getWindowSize(req),
      'Gov-Client-Browser-Plugins': this.getBrowserPlugins(req),
      'Gov-Client-Browser-JS-User-Agent': req.headers['user-agent'] || '',
      'Gov-Client-Browser-Do-Not-Track': this.getDoNotTrack(req),
      'Gov-Client-Multi-Factor': this.getMFAMethods(req),
    }
  }

  private getDeviceId(req: Request): string {
    // Generate consistent device ID based on hardware/software fingerprint
    // Store in database per user/device
    return 'device-id-hash'
  }

  private getUserIds(req: Request): string {
    // Format: os=user123&app=emp456
    return `os=${req.userId}&app=${req.employerId}`
  }

  private getTimezone(): string {
    // Get server timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  private getLocalIPs(req: Request): string {
    // Get client IP addresses (IPv4 and IPv6 if available)
    const ips = [req.ip, req.headers['x-forwarded-for']]
    return ips.filter(Boolean).join(',')
  }

  // ... implement other methods
}
```

**Full specification:** https://developer.service.hmrc.gov.uk/guides/fraud-prevention/

---

## XML Schema & Generation

### Official XSD Schemas

Download from HMRC:
- FPS Schema: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/paye-online/1.0
- EPS Schema: (same location)

### XML Generation Options

#### Option 1: Template-based (Simple)

```typescript
// Use string templates
const fpsTemplate = `<?xml version="1.0"?>
<IRenvelope>
  <IRheader>...</IRheader>
  <FullPaymentSubmission>
    ${employees.map(emp => this.generateEmployeeXML(emp)).join('')}
  </FullPaymentSubmission>
</IRenvelope>`
```

#### Option 2: XML Builder Library (Recommended)

```typescript
import { create } from 'xmlbuilder2'

class XMLBuilder {
  buildFPS(data: FPSData): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('IRenvelope', {
        xmlns: 'http://www.govtalk.gov.uk/taxation/PAYE/RTI/FullPaymentSubmission/14-15/1'
      })
    
    // Add header
    const header = root.ele('IRheader')
    const keys = header.ele('Keys')
    keys.ele('Key', { Type: 'TaxOfficeNumber' }).txt(data.taxOfficeNumber)
    keys.ele('Key', { Type: 'TaxOfficeReference' }).txt(data.taxOfficeRef)
    
    // Add employees
    const fps = root.ele('FullPaymentSubmission')
    data.employees.forEach(emp => this.addEmployee(fps, emp))
    
    return root.end({ prettyPrint: true })
  }
}
```

#### Option 3: Use Existing Library

```bash
npm install @hmrc/paye-xml-builder
```

### XML Validation

```typescript
import { validateXML } from 'libxmljs2'
import fs from 'fs'

class XMLValidator {
  async validate(xml: string, schemaPath: string): Promise<ValidationResult> {
    const xsd = fs.readFileSync(schemaPath, 'utf8')
    const schema = libxmljs.parseXml(xsd)
    const doc = libxmljs.parseXml(xml)
    
    const isValid = doc.validate(schema)
    
    return {
      isValid,
      errors: doc.validationErrors
    }
  }
}
```

---

## Testing in Sandbox

### Sandbox Environment

**Base URL:** `https://test-api.service.hmrc.gov.uk`

### Test Credentials

HMRC provides test credentials:
- Test employer references
- Test NI numbers
- Test user accounts

### Testing Scenarios

#### 1. Successful FPS Submission
```typescript
const testData = {
  employerRef: '123/AB45678', // Test employer ref
  employees: [{
    niNumber: 'AA123456A', // Test NI number
    // ... other test data
  }]
}

const result = await hmrcClient.submitFPS(testData)
// Expected: HTTP 202 Accepted
```

#### 2. Validation Errors
Test with:
- Invalid NI numbers
- Invalid tax codes
- Missing required fields
- Incorrect date formats

#### 3. Authentication Errors
Test with:
- Expired tokens
- Invalid tokens
- Missing headers

#### 4. Rate Limiting
Test with:
- Multiple rapid submissions
- Should get HTTP 429 Too Many Requests

### Sandbox Testing Checklist

- [ ] OAuth flow works correctly
- [ ] FPS submission accepted
- [ ] EPS submission accepted
- [ ] Token refresh works
- [ ] Error handling works
- [ ] Fraud prevention headers accepted
- [ ] XML validation passes
- [ ] Submission status retrieval works
- [ ] All edge cases covered

---

## Production Deployment

### Pre-Production Checklist

#### Security
- [ ] OAuth credentials encrypted in database
- [ ] Access tokens encrypted at rest
- [ ] HTTPS/TLS 1.2+ enforced
- [ ] Fraud prevention headers implemented
- [ ] IP whitelist configured (if applicable)
- [ ] Security audit completed

#### Testing
- [ ] All sandbox scenarios passed
- [ ] Parallel run with existing system (1-2 months)
- [ ] Edge cases tested
- [ ] Error handling verified
- [ ] Rollback plan in place

#### Documentation
- [ ] API integration documented
- [ ] Error codes documented
- [ ] Troubleshooting guide created
- [ ] User training completed
- [ ] Support procedures defined

#### Compliance
- [ ] HMRC production access granted
- [ ] Software registered with HMRC
- [ ] Terms of use accepted
- [ ] Data protection compliance verified

### Go-Live Process

1. **Switch to Production URLs**
   ```typescript
   const config = {
     environment: 'production',
     baseUrl: 'https://api.service.hmrc.gov.uk',
     clientId: PROD_CLIENT_ID,
     clientSecret: PROD_CLIENT_SECRET,
   }
   ```

2. **Complete OAuth Authorization**
   - Get production access token
   - Test with one submission
   - Monitor response

3. **Gradual Rollout**
   - Week 1: Submit FPS manually + via API (verify match)
   - Week 2: API-only for test group
   - Week 3: Full rollout

4. **Monitor Closely**
   - Check all submissions accepted
   - Monitor error logs
   - Verify HMRC responses
   - Check PAYE online portal

---

## Implementation Roadmap

### Phase 1: Setup & Authentication (2-4 weeks)

**Week 1-2: Registration**
- [ ] Register with HMRC Developer Hub
- [ ] Create sandbox application
- [ ] Get test credentials
- [ ] Submit production access request

**Week 3-4: OAuth Implementation**
- [ ] Build OAuth authorization flow
- [ ] Implement token management
- [ ] Build token refresh logic
- [ ] Test authentication in sandbox

### Phase 2: FPS Implementation (3-4 weeks)

**Week 5-6: XML Generation**
- [ ] Study FPS XSD schema
- [ ] Build FPS XML generator
- [ ] Implement data mapping from your payroll records
- [ ] Build XML validator

**Week 7-8: API Integration**
- [ ] Build FPS submission service
- [ ] Implement fraud prevention headers
- [ ] Build error handling
- [ ] Test in sandbox

### Phase 3: EPS Implementation (2-3 weeks)

**Week 9-10: EPS Development**
- [ ] Study EPS XSD schema
- [ ] Build EPS XML generator
- [ ] Implement EPS submission service
- [ ] Test in sandbox

**Week 11: Additional Features**
- [ ] Build submission status checker
- [ ] Build submission history viewer
- [ ] Implement retry logic

### Phase 4: Testing & Refinement (2-3 weeks)

**Week 12-13: Comprehensive Testing**
- [ ] Test all scenarios in sandbox
- [ ] Security testing
- [ ] Performance testing
- [ ] Error handling testing

**Week 14: Documentation**
- [ ] Complete technical documentation
- [ ] Create user guides
- [ ] Prepare training materials

### Phase 5: Production Deployment (1-2 weeks)

**Week 15: Go-Live Preparation**
- [ ] Get production credentials
- [ ] Complete OAuth flow in production
- [ ] Parallel testing
- [ ] Staff training

**Week 16: Go-Live**
- [ ] Switch to production
- [ ] Monitor first submissions
- [ ] Support & fixes

---

## Code Structure

### Recommended File Organization

```
src/backend/services/hmrc/
├── HMRCClient.ts           # Main API client
├── HMRCAuth.ts             # OAuth 2.0 handler
├── TokenManager.ts         # Token storage & refresh
├── FPSGenerator.ts         # FPS XML generation
├── EPSGenerator.ts         # EPS XML generation
├── XMLValidator.ts         # Schema validation
├── FraudPrevention.ts      # Fraud prevention headers
├── SubmissionTracker.ts    # Track submission status
├── ErrorHandler.ts         # HMRC error handling
└── types/
    ├── FPSTypes.ts         # FPS data types
    ├── EPSTypes.ts         # EPS data types
    └── HMRCTypes.ts        # General HMRC types

src/backend/functions/
├── SubmitFPS.ts            # Firebase function for FPS
├── SubmitEPS.ts            # Firebase function for EPS
└── CheckSubmissionStatus.ts # Check HMRC submission status

src/frontend/components/hmrc/
├── HMRCAuth.tsx            # OAuth authorization UI
├── SubmissionStatus.tsx    # View submission status
├── SubmissionHistory.tsx   # View past submissions
└── HMRCSettings.tsx        # HMRC configuration UI
```

### Main Service Class

```typescript
// src/backend/services/hmrc/HMRCClient.ts

export class HMRCClient {
  private auth: HMRCAuthService
  private tokenManager: HMRCTokenManager
  private fpsGenerator: FPSGenerator
  private epsGenerator: EPSGenerator
  private fraudPrevention: FraudPreventionService
  
  constructor(config: HMRCConfig) {
    this.auth = new HMRCAuthService(config)
    this.tokenManager = new HMRCTokenManager(config)
    this.fpsGenerator = new FPSGenerator()
    this.epsGenerator = new EPSGenerator()
    this.fraudPrevention = new FraudPreventionService()
  }

  async submitFPS(payrollData: PayrollRecord[]): Promise<FPSSubmissionResult> {
    try {
      // 1. Get valid access token
      const token = await this.tokenManager.getValidAccessToken()
      
      // 2. Generate FPS XML from payroll data
      const xml = this.fpsGenerator.generate(payrollData)
      
      // 3. Validate XML
      const isValid = await this.fpsGenerator.validate(xml)
      if (!isValid) throw new Error('Invalid FPS XML')
      
      // 4. Get fraud prevention headers
      const headers = this.fraudPrevention.generateHeaders()
      
      // 5. Submit to HMRC
      const response = await this.makeAPIRequest({
        method: 'POST',
        endpoint: `/paye/employers/${this.employerRef}/submissions/fps`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/xml',
          ...headers
        },
        body: xml
      })
      
      // 6. Track submission
      await this.trackSubmission({
        type: 'FPS',
        status: response.status,
        submissionId: response.submissionId,
        timestamp: Date.now(),
        response: response.body
      })
      
      return response
    } catch (error) {
      // Handle errors
      await this.handleSubmissionError(error)
      throw error
    }
  }

  async submitEPS(epsData: EPSData): Promise<EPSSubmissionResult> {
    // Similar to submitFPS
  }

  async checkSubmissionStatus(submissionId: string): Promise<SubmissionStatus> {
    // Query HMRC for submission status
  }
}
```

---

## Error Handling

### HMRC Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success |
| 202 | Accepted | Submission queued |
| 400 | Bad Request | Fix XML/data |
| 401 | Unauthorized | Refresh token |
| 403 | Forbidden | Check permissions |
| 429 | Too Many Requests | Implement backoff |
| 500 | Server Error | Retry later |

### Error Handling Strategy

```typescript
class HMRCErrorHandler {
  async handleError(error: HMRCError): Promise<ErrorResponse> {
    switch (error.status) {
      case 400:
        // XML validation error - log details
        await this.logValidationError(error)
        return { retry: false, message: 'Fix data and resubmit' }
      
      case 401:
        // Token expired - refresh and retry
        await this.refreshToken()
        return { retry: true, delay: 0 }
      
      case 429:
        // Rate limited - exponential backoff
        const delay = this.calculateBackoff(error.retryAfter)
        return { retry: true, delay }
      
      case 500:
      case 503:
        // HMRC server error - retry with backoff
        return { retry: true, delay: 60000 }
      
      default:
        return { retry: false, message: 'Unknown error' }
    }
  }

  private calculateBackoff(retryAfter?: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return retryAfter || (Math.pow(2, this.attemptCount) * 1000)
  }
}
```

### Retry Logic

```typescript
async function submitWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const errorResponse = await errorHandler.handleError(error)
      
      if (!errorResponse.retry || attempt === maxRetries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, errorResponse.delay))
    }
  }
  
  throw new Error('Max retries exceeded')
}
```

---

## Maintenance & Updates

### Annual Updates

**Every March (Budget Day):**
- [ ] Check for new tax rates (announced in Budget)
- [ ] Update TaxYearConfiguration for new tax year
- [ ] Update NI thresholds
- [ ] Update student loan thresholds
- [ ] Update statutory payment rates
- [ ] Test changes in sandbox
- [ ] Deploy before April 6

### Ongoing Monitoring

**Weekly:**
- [ ] Check submission success rates
- [ ] Review error logs
- [ ] Monitor token expiry

**Monthly:**
- [ ] Review HMRC documentation for changes
- [ ] Check for API updates
- [ ] Verify all submissions accepted

**Quarterly:**
- [ ] Security audit
- [ ] Performance review
- [ ] Update dependencies

### HMRC Updates

**Stay Informed:**
- Subscribe to HMRC Developer Hub notifications
- Monitor: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/paye-online
- Join HMRC software developer community
- Review HMRC guidance updates

---

## Quick Reference

### Key URLs

**Developer Hub:**
- Main: https://developer.service.hmrc.gov.uk/
- API Docs: https://developer.service.hmrc.gov.uk/api-documentation/docs/api
- Fraud Prevention: https://developer.service.hmrc.gov.uk/guides/fraud-prevention/

**API Endpoints:**
- Sandbox: https://test-api.service.hmrc.gov.uk
- Production: https://api.service.hmrc.gov.uk

**Support:**
- Developer Hub Support: via developer portal
- Technical Issues: sdsteam@hmrc.gov.uk

### Configuration Checklist

```typescript
// Environment variables needed
HMRC_CLIENT_ID=your_client_id
HMRC_CLIENT_SECRET=your_client_secret
HMRC_REDIRECT_URI=https://yourdomain.com/hmrc/callback
HMRC_ENVIRONMENT=sandbox|production
HMRC_EMPLOYER_PAYE_REF=123/AB45678
HMRC_ACCOUNTS_OFFICE_REF=123PA00012345
```

---

## Next Steps

1. **Register with HMRC Developer Hub** (Start ASAP - 2-4 week approval)
2. **Study HMRC API Documentation** (1 week)
3. **Implement OAuth Flow** (1-2 weeks)
4. **Build XML Generators** (2-3 weeks)
5. **Test in Sandbox** (2-3 weeks)
6. **Get Production Access** (2-4 weeks approval)
7. **Deploy to Production** (1 week)

---

## Support & Questions

For implementation questions:
1. Check HMRC Developer Hub documentation
2. Review HMRC API forum
3. Contact HMRC software developer support
4. Consult UK payroll software developers community

---

**This guide covers everything needed to implement direct HMRC API integration. The system is ready - just needs the connection layer!**

**Estimated Total Time: 9-15 weeks from start to production**


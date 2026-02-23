# HMRC Developer Hub - Application Best Practices

**CRITICAL REQUIREMENTS FOR HMRC INTEGRATION**

This document outlines the mandatory requirements and best practices from the HMRC Developer Hub for integrating with HMRC APIs.

---

## Table of Contents

1. [Single Production Application](#1-single-production-application)
2. [OAuth Token-Based Customer Isolation](#2-oauth-token-based-customer-isolation)
3. [Loose Coupling Architecture](#3-loose-coupling-architecture)
4. [Certificate Management](#4-certificate-management)
5. [Network Configuration](#5-network-configuration)
6. [CORS and Firebase Proxy](#6-cors-and-firebase-proxy)
7. [Implementation Status](#7-implementation-status)

---

## 1. Single Production Application

### Requirement
> **Only 1 production application is needed. Name it after your company.**

### Why This Matters
- HMRC expects vendors to register **ONE application per software product**
- Creating multiple applications creates unnecessary complexity
- Application approval requires HMRC review; minimizing applications speeds deployment

### Implementation

**Application Naming Convention:**
When registering your application on HMRC Developer Hub, use your company name:

```
Application Name: [Your Company Name] HR Platform
Example: 1Stop HR Platform
Example: Acme Payroll Solutions
```

**DO NOT:**
- Create separate applications for each customer
- Create separate applications for each feature
- Create test and production versions as separate applications (use sandbox environment instead)

**Current Implementation:** ✅ IMPLEMENTED
- The platform uses Firebase Secrets (`HMRC_CLIENT_ID`, `HMRC_CLIENT_SECRET`) stored at platform level
- Single set of credentials shared across all customers
- Documentation in `HMRC_PLATFORM_SETUP.md` confirms single-application architecture

**Registration Location:**
- Developer Hub: https://developer.service.hmrc.gov.uk/
- Register once, use for all customers

---

## 2. OAuth Token-Based Customer Isolation

### Requirement
> **Do not create multiple applications for each customer; use OAuth tokens to isolate traffic.**

### Why This Matters
- Each customer authorizes YOUR single application to access THEIR HMRC account
- OAuth tokens provide secure, customer-specific access without needing separate apps
- Proper token isolation ensures one customer cannot access another's data

### Implementation

**Architecture:**
```
                    ┌─────────────────────────────────┐
                    │   Your Platform (1Stop HR)       │
                    │   Client ID: YOUR_APP_ID        │
                    │   Client Secret: YOUR_SECRET    │
                    └──────────────┬──────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
    ┌──────▼──────┐         ┌──────▼──────┐         ┌──────▼──────┐
    │  Company A   │         │  Company B   │         │  Company C   │
    │  PAYE: 123/A │         │  PAYE: 456/B │         │  PAYE: 789/C │
    │  Token: xxx  │         │  Token: yyy  │         │  Token: zzz  │
    └─────────────┘         └─────────────┘         └─────────────┘
```

**Token Storage (Per Company):**
```typescript
// Location: companies/{companyId}/sites/{siteId}/data/company/hmrcSettings
{
  hmrcAccessToken: "ENCRYPTED_TOKEN_FOR_THIS_COMPANY",
  hmrcRefreshToken: "ENCRYPTED_REFRESH_TOKEN",
  hmrcTokenExpiry: 1703548800,
  employerPAYEReference: "123/AB45678",  // Company-specific
  accountsOfficeReference: "123PA00012345"  // Company-specific
}
```

**Current Implementation:** ✅ IMPLEMENTED
- File: `src/backend/interfaces/Company.tsx` - `HMRCSettings` interface (lines 1122-1211)
- Each company stores their own tokens at their unique Firebase path
- OAuth flow generates company-specific tokens using platform credentials

**Flow:**
1. Platform stores `HMRC_CLIENT_ID` and `HMRC_CLIENT_SECRET` in Firebase Secrets
2. Customer clicks "Connect to HMRC"
3. Customer authorizes YOUR application on Government Gateway
4. HMRC returns authorization code
5. Platform exchanges code for customer-specific tokens
6. Tokens stored under that customer's Firebase path

---

## 3. Loose Coupling Architecture

### Requirement
> **Avoid tight coupling with HMRC APIs; use loose coupling to reduce breakage risk.**

### Why This Matters
- HMRC APIs may change endpoints, schemas, or behaviors
- Loose coupling allows your system to adapt without major rewrites
- Provides graceful degradation when HMRC is unavailable

### Implementation

**Service Abstraction Layer:**
```
src/backend/services/hmrc/
├── HMRCAPIClient.ts      # High-level abstraction (use this)
├── HMRCAuthService.ts    # Authentication abstraction
├── RTIXMLGenerator.ts    # XML generation abstraction
├── FraudPreventionService.ts
├── RTIValidationService.ts
└── types.ts              # Type definitions
```

**Key Loose Coupling Patterns:**

1. **Endpoint Configuration (Not Hardcoded):**
```typescript
// GOOD: Configurable endpoints
const baseUrl = environment === 'sandbox'
  ? 'https://test-api.service.hmrc.gov.uk'
  : 'https://api.service.hmrc.gov.uk'

// BAD: Hardcoded endpoints
const url = 'https://api.service.hmrc.gov.uk/paye/...'
```

2. **API Version Abstraction:**
```typescript
// API version should be configurable
interface HMRCAPIConfig {
  environment: 'sandbox' | 'production'
  apiVersion?: string  // Allow version override
  baseUrlOverride?: string  // Allow URL override for testing
  timeoutMs?: number  // Configurable timeout
}
```

3. **Retry and Circuit Breaker Patterns:**
```typescript
// Implement retry with exponential backoff
async function submitWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (!isRetryable(error) || attempt === maxRetries) throw error
      await delay(Math.pow(2, attempt) * 1000)  // 2s, 4s, 8s
    }
  }
  throw new Error('Max retries exceeded')
}
```

4. **Response Normalization:**
```typescript
// Normalize HMRC responses to internal format
interface NormalizedSubmissionResult {
  success: boolean
  submissionId?: string
  errors?: Array<{ code: string; message: string }>
  rawResponse?: unknown  // Keep raw for debugging
}
```

**Current Implementation:** ⚠️ PARTIALLY IMPLEMENTED
- Good: Service abstraction layers exist
- Good: Environment-configurable URLs
- To Improve: Add explicit retry patterns with backoff
- To Improve: Add circuit breaker for graceful degradation

**Recommended Enhancements:**
```typescript
// Add to HMRCAPIClient.ts
class HMRCAPIClient {
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000
  })

  async submitFPS(data: FPSSubmissionData, ...): Promise<FPSSubmissionResult> {
    return this.circuitBreaker.execute(async () => {
      return this.submitWithRetry(() => this.doSubmitFPS(data, ...))
    })
  }
}
```

---

## 4. Certificate Management

### Requirement
> **Do not import HMRC-specific certificates into keystores; use global root CA keystore.**

### Why This Matters
- HMRC uses standard SSL/TLS certificates from public Certificate Authorities
- Importing HMRC-specific certs creates maintenance burden when they rotate
- Global root CA stores are automatically updated by OS/runtime

### Implementation

**Current Implementation:** ✅ IMPLEMENTED (By Default)

The codebase correctly uses standard `fetch` API without custom certificate handling:

```typescript
// hmrcOAuth.ts - Line 108
const response = await fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json'
  },
  body: new URLSearchParams({...}).toString()
})
```

**DO NOT:**
```typescript
// BAD: Custom certificate handling
const agent = new https.Agent({
  ca: fs.readFileSync('hmrc-certificate.pem'),  // DON'T DO THIS
  rejectUnauthorized: true
})
```

**DO:**
```typescript
// GOOD: Use default system certificates
const response = await fetch(url, { method: 'POST', ... })
// Node.js/browser automatically use system root CA store
```

**Why This Works:**
- Node.js 20 (used in Firebase Functions) trusts Mozilla's root CA bundle
- Browser environments trust OS-level root CAs
- HMRC uses certificates signed by trusted CAs (DigiCert, etc.)

---

## 5. Network Configuration

### Requirement
> **IP addresses are not static; configure proxy for full domain access instead of firewall rules.**

### Why This Matters
- HMRC API servers use dynamic IP addresses (cloud infrastructure)
- Firewall rules based on IP addresses will break when IPs change
- Domain-based access ensures continuous connectivity

### Implementation

**Current Implementation:** ✅ IMPLEMENTED

The codebase uses full domain names, not IP addresses:

```typescript
// hmrcOAuth.ts - Lines 97-99
const baseUrl = environment === 'sandbox'
  ? 'https://test-api.service.hmrc.gov.uk'  // DOMAIN, not IP
  : 'https://api.service.hmrc.gov.uk'       // DOMAIN, not IP
```

**CRITICAL WARNINGS:**

1. **DO NOT** create firewall rules like:
```
# BAD: IP-based rules
ALLOW 3.10.50.* TO port 443  # HMRC IPs change!
```

2. **DO** configure proxy/firewall for domain access:
```
# GOOD: Domain-based rules
ALLOW *.service.hmrc.gov.uk TO port 443
ALLOW test-api.service.hmrc.gov.uk TO port 443
ALLOW api.service.hmrc.gov.uk TO port 443
```

**For Corporate Networks:**
If your application runs behind a corporate proxy:
```typescript
// Configure HTTP proxy if needed
const proxyAgent = new HttpsProxyAgent('http://corporate-proxy:8080')
const response = await fetch(url, { agent: proxyAgent })
```

**Firebase Functions:**
Firebase Functions have unrestricted outbound internet access by default. No special network configuration is needed for HMRC API access.

---

## 6. CORS and Firebase Proxy

### Requirement
> **HMRC APIs do not support CORS; use Firebase functions as a proxy.**

### Why This Matters
- HMRC APIs don't include CORS headers in responses
- Browser-based applications cannot directly call HMRC APIs
- Server-side proxy (Firebase Functions) bypasses CORS restrictions

### Implementation

**Current Implementation:** ✅ IMPLEMENTED

All HMRC API calls are proxied through Firebase Functions:

```typescript
// functions/src/index.ts
export { exchangeHMRCToken, refreshHMRCToken } from './hmrcOAuth'
export { submitRTI, checkRTIStatus, getHMRCAuthUrl } from './hmrcRTISubmission'
```

**Architecture:**
```
Browser (Client)
     │
     │ HTTPS (with CORS)
     ▼
Firebase Functions (Proxy)
     │
     │ HTTPS (server-to-server, no CORS)
     ▼
HMRC APIs
```

**Proxy Functions:**
| Function | Purpose | File |
|----------|---------|------|
| `exchangeHMRCToken` | Exchange auth code for tokens | `hmrcOAuth.ts` |
| `refreshHMRCToken` | Refresh expired tokens | `hmrcOAuth.ts` |
| `getHMRCAuthUrl` | Generate authorization URL | `hmrcRTISubmission.ts` |
| `submitRTI` | Submit FPS/EPS/EYU | `hmrcRTISubmission.ts` |
| `checkRTIStatus` | Check submission status | `hmrcRTISubmission.ts` |

**Client Usage:**
```typescript
// Client code calls Firebase Function, NOT HMRC directly
const FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL

// GOOD: Call via proxy
const response = await fetch(`${FUNCTIONS_URL}/submitRTI`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(submissionData)
})

// BAD: Direct HMRC call (will fail with CORS error)
const response = await fetch('https://api.service.hmrc.gov.uk/paye/...', {...})
```

---

## 7. Implementation Status

### Summary

| Requirement | Status | Notes |
|-------------|--------|-------|
| Single Production Application | ✅ Implemented | Firebase Secrets at platform level |
| OAuth Token Isolation | ✅ Implemented | Per-company token storage |
| Loose Coupling | ⚠️ Partial | Service layers exist; add retry/circuit breaker |
| No Custom Certificates | ✅ Implemented | Uses default system CA store |
| Domain-based Access | ✅ Implemented | Full domain URLs, no IP addresses |
| CORS Proxy | ✅ Implemented | All calls via Firebase Functions |

### Files Implementing These Requirements

```
functions/src/
├── hmrcOAuth.ts              # OAuth token exchange (proxy)
├── hmrcRTISubmission.ts      # RTI submission (proxy)
├── checkOAuthStatus.ts       # OAuth status check
└── index.ts                  # Exports all functions

src/backend/services/hmrc/
├── HMRCAPIClient.ts          # High-level client abstraction
├── HMRCAuthService.ts        # Auth service abstraction
├── RTIXMLGenerator.ts        # XML generation
├── FraudPreventionService.ts # Fraud headers
├── RTIValidationService.ts   # Validation
└── types.ts                  # Type definitions

src/backend/interfaces/
└── Company.tsx               # HMRCSettings interface (lines 1122-1211)
```

### Recommended Actions

1. **Document application naming** in setup guide (application should be named after company)
2. **Add retry patterns** with exponential backoff to `HMRCAPIClient.ts`
3. **Add circuit breaker** for graceful degradation
4. **Add network configuration notes** to deployment documentation

---

## Quick Checklist for Developers

Before deploying to production, verify:

- [ ] Single application registered on HMRC Developer Hub
- [ ] Application named after your company (e.g., "1Stop HR Platform")
- [ ] Client ID and Client Secret stored in Firebase Secrets (NOT in code)
- [ ] Each company has separate token storage path
- [ ] All HMRC calls go through Firebase Functions proxy
- [ ] Using domain names (not IP addresses) for HMRC endpoints
- [ ] No custom certificate imports
- [ ] Retry logic implemented for transient failures
- [ ] Error handling for HMRC API failures

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Applies To:** HMRC MTD PAYE Integration

# HMRC Integration Quick Start Guide

This is a quick reference for using the HMRC RTI integration in your payroll system.

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Register with HMRC Developer Hub
1. Go to https://developer.service.hmrc.gov.uk/
2. Create account with Government Gateway
3. Register your application
4. Get `client_id` and `client_secret`

### Step 2: Configure HMRC Settings
Add to your company settings:

```typescript
{
  employerPAYEReference: "123/AB45678",
  accountsOfficeReference: "123PA00012345",
  hmrcEnvironment: "sandbox", // Start with sandbox!
  hmrcClientId: "your-client-id",
  hmrcClientSecret: "your-client-secret",
  autoSubmitFPS: true
}
```

### Step 3: Complete OAuth Flow
1. Generate authorization URL using `HMRCAuthService.getAuthorizationUrl()`
2. User authorizes on HMRC website
3. Exchange code for tokens using `HMRCAuthService.exchangeCodeForToken()`
4. Store tokens in HMRC settings

### Step 4: Test in Sandbox
- Submit test FPS with sample data
- Verify responses
- Check submission status

### Step 5: Go Live (After Conformance Testing)
- Switch to production environment
- Use real PAYE references
- Enable auto-submit

---

## 📝 Common Tasks

### Submit FPS After Payroll Approval

```typescript
import { submitFPSForPayrollRun } from '../backend/functions/HMRCRTISubmission'

// Automatically happens when payroll is approved (if autoSubmitFPS is enabled)
// Or manually:
const result = await submitFPSForPayrollRun(
  companyId,
  siteId,
  [payrollId],
  userId
)
```

### Submit EPS (Monthly)

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

### Check Submission Status

```typescript
import { HMRCAPIClient } from '../backend/services/hmrc'

const client = new HMRCAPIClient()
const status = await client.checkSubmissionStatus(
  submissionId,
  hmrcSettings,
  userId
)
```

---

## 🔍 File Locations

| Component | Location |
|-----------|----------|
| OAuth Service | `src/backend/services/hmrc/HMRCAuthService.ts` |
| Fraud Prevention | `src/backend/services/hmrc/FraudPreventionService.ts` |
| XML Generator | `src/backend/services/hmrc/RTIXMLGenerator.ts` |
| API Client | `src/backend/services/hmrc/HMRCAPIClient.ts` |
| Backend Functions | `src/backend/functions/HMRCRTISubmission.tsx` |
| Types | `src/backend/services/hmrc/types.ts` |

---

## ⚠️ Important Reminders

1. **Always test in sandbox first**
2. **Complete HMRC conformance testing before production**
3. **Keep tokens secure and encrypted**
4. **Monitor submission status**
5. **Handle errors gracefully**

---

## 🐛 Troubleshooting

### "HMRC settings not configured"
→ Add HMRC settings to company configuration

### "Token expired"
→ System automatically refreshes, but check refresh token is valid

### "Submission rejected"
→ Check XML validation errors in response
→ Verify all required fields are present
→ Check PAYE reference format

### "Authentication failed"
→ Verify client_id and client_secret
→ Check OAuth flow completed
→ Ensure redirect URI matches

---

## 📚 Full Documentation

See `HMRC_INTEGRATION_COMPLETE.md` for complete details.


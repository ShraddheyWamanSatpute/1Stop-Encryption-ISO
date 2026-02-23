# OAuth Security Fix - Implementation Complete ✅

## Overview

Successfully implemented the OAuth security fix to ensure HMRC credentials are stored **server-side only** and never sent from the client to the server.

---

## Files Modified

### 1. ✅ `functions/src/hmrcOAuth.ts` - **MAJOR REWRITE**

**Changes Made**:
- ✅ Added Firebase Secrets support using `defineSecret()`
- ✅ Updated `exchangeHMRCToken` to read credentials from Firebase Secrets (NOT from request body)
- ✅ Added security check to REJECT any request containing `clientId` or `clientSecret` in body
- ✅ Removed `clientId` and `clientSecret` from request interface
- ✅ Updated validation to only check for `code` and `redirectUri`
- ✅ Created NEW `refreshHMRCToken` function with same security pattern
- ✅ Both functions now use Firebase Secrets instead of request body

**Security Improvements**:
- ✅ Credentials stored in Firebase Secrets (server-side only)
- ✅ Client cannot send credentials (rejected with 400 error)
- ✅ Server validates secrets are configured before processing

---

### 2. ✅ `functions/src/index.ts` - **ADDED EXPORT**

**Changes Made**:
- ✅ Added export for `refreshHMRCToken` function
- ✅ Now exports both `exchangeHMRCToken` and `refreshHMRCToken`

---

### 3. ✅ `src/frontend/pages/hmrc/OAuthCallback.tsx` - **REMOVED CREDENTIALS**

**Changes Made**:
- ✅ Removed all code that retrieves `clientId` and `clientSecret`
- ✅ Removed fallback to company settings for credentials
- ✅ Removed credential validation checks
- ✅ Updated request body to ONLY send: `code`, `redirectUri`, `environment`
- ✅ Removed `clientId` and `clientSecret` from request body
- ✅ Updated debug logging (removed credential status)

**Security Improvements**:
- ✅ Client no longer sends credentials to server
- ✅ Only sends authorization code (safe, one-time use)

---

### 4. ✅ `src/frontend/components/hr/settings/HMRCSettingsTab.tsx` - **REMOVED CREDENTIAL FALLBACK**

**Changes Made**:
- ✅ Added `isOAuthConfigured` check (only checks for `VITE_HMRC_CLIENT_ID`)
- ✅ Updated `handleConnectHMRC` to only use `clientId` from env vars (for auth URL)
- ✅ Removed fallback to `hmrcSettings.hmrcClientId` and `hmrcSettings.hmrcClientSecret`
- ✅ Removed `clientSecret` retrieval (not needed client-side)
- ✅ Added warning Alert if OAuth not configured
- ✅ Disabled "Connect to HMRC" button if OAuth not configured
- ✅ Updated `handleRefreshToken` to call Firebase Function instead of direct API call
- ✅ Updated `handleRefreshToken` to only send `refreshToken` and `environment` (NO credentials)
- ✅ Updated `handleSave` to explicitly delete credential fields before saving

**Security Improvements**:
- ✅ No fallback to company settings for credentials
- ✅ Credential fields removed before saving settings
- ✅ Clear UI indication if OAuth not configured

---

### 5. ✅ `src/backend/interfaces/Company.tsx` - **DEPRECATED FIELDS**

**Changes Made**:
- ✅ Added `@deprecated` JSDoc comments to `hmrcClientId` and `hmrcClientSecret` fields
- ✅ Added deprecation notes explaining they should use Firebase Secrets instead

**Note**: Fields remain in interface for backward compatibility but are marked as deprecated.

---

## Files Not Created (Blocked by .gitignore)

- ❌ `.env.local` - Blocked by `.gitignore` (correct behavior, should not be committed)
- ✅ `.gitignore` already includes `*.local` which covers `.env.local`

**Action Required**: You need to manually create `.env.local` file with your HMRC Client ID:

```env
VITE_HMRC_CLIENT_ID=your_hmrc_client_id_here
VITE_HMRC_REDIRECT_URI=http://localhost:5173/hmrc/callback
VITE_HMRC_OAUTH_SCOPE=hello
```

---

## Security Model Summary

### ✅ What the CLIENT knows (Safe):
- `VITE_HMRC_CLIENT_ID` - Used in authorization URL (public anyway)
- `VITE_HMRC_REDIRECT_URI` - Just a URL (public)
- `VITE_HMRC_OAUTH_SCOPE` - Just a string (public)

### ✅ What the CLIENT sends to server:
- `code` - Authorization code from HMRC (one-time use, safe)
- `redirectUri` - For validation (public)
- `environment` - Sandbox or production (public)
- `refreshToken` - For token refresh only (encrypted at rest)

### ✅ What the SERVER knows (Firebase Secrets):
- `HMRC_CLIENT_ID` - Stored in Firebase Secrets (server-side only)
- `HMRC_CLIENT_SECRET` - Stored in Firebase Secrets (server-side only)

### ✅ What the SERVER rejects:
- ❌ Any request containing `clientId` in body (400 error)
- ❌ Any request containing `clientSecret` in body (400 error)

---

## Next Steps Required (Manual Setup)

### 1. Set Firebase Secrets

**Using Firebase CLI** (Recommended):
```bash
cd functions
firebase functions:secrets:set HMRC_CLIENT_ID
# Enter your HMRC Client ID when prompted

firebase functions:secrets:set HMRC_CLIENT_SECRET
# Enter your HMRC Client Secret when prompted
```

**Using Firebase Console**:
1. Go to Firebase Console → Your Project → Functions
2. Click on a function or go to "Environment variables" / "Secrets" section
3. Add `HMRC_CLIENT_ID` and `HMRC_CLIENT_SECRET`

### 2. Create `.env.local` File

Create `.env.local` in project root:
```env
VITE_HMRC_CLIENT_ID=your_hmrc_client_id_here
VITE_HMRC_REDIRECT_URI=http://localhost:5173/hmrc/callback
VITE_HMRC_OAUTH_SCOPE=hello
```

### 3. Deploy Functions

After setting secrets:
```bash
cd functions
firebase deploy --only functions
```

### 4. Test the Flow

1. Ensure `.env.local` has `VITE_HMRC_CLIENT_ID`
2. Ensure Firebase Secrets are set
3. Start local emulator or deploy to production
4. Navigate to HR Settings → HMRC Settings Tab
5. Click "Connect to HMRC"
6. Verify OAuth flow works without errors

---

## Verification Checklist

### Code Verification:
- [x] `functions/src/hmrcOAuth.ts` does NOT accept credentials from request body
- [x] `functions/src/hmrcOAuth.ts` reads credentials from Firebase Secrets
- [x] `functions/src/hmrcOAuth.ts` rejects requests that contain credentials
- [x] `functions/src/index.ts` exports both `exchangeHMRCToken` and `refreshHMRCToken`
- [x] `OAuthCallback.tsx` does NOT send credentials in request body
- [x] `HMRCSettingsTab.tsx` does NOT fall back to company settings for credentials
- [x] `HMRCSettingsTab.tsx` shows warning if OAuth not configured
- [x] Credential fields deprecated in `Company.tsx` interface

### Manual Steps Required:
- [ ] Create `.env.local` with `VITE_HMRC_CLIENT_ID`
- [ ] Set Firebase Secret: `HMRC_CLIENT_ID`
- [ ] Set Firebase Secret: `HMRC_CLIENT_SECRET`
- [ ] Deploy functions with secrets
- [ ] Test OAuth flow end-to-end

---

## Security Improvements

### Before (INSECURE ❌):
- Client sent `clientSecret` to server
- Per-company credentials stored in database
- No validation of credential requests
- Credentials visible in network requests

### After (SECURE ✅):
- ✅ Client NEVER sends credentials
- ✅ Server reads credentials from Firebase Secrets only
- ✅ Server REJECTS any request containing credentials
- ✅ Single platform app (credentials stored server-side)
- ✅ Companies only store OAuth tokens (not credentials)
- ✅ Credential fields removed before saving settings

---

## Breaking Changes

### ⚠️ Important Notes:

1. **Existing per-company credentials**: If you have existing `hmrcClientId`/`hmrcClientSecret` in company settings, they will be ignored. You must use Firebase Secrets.

2. **Migration**: Existing OAuth tokens will continue to work. Only the credential storage changed.

3. **Deployment**: Functions MUST be deployed with secrets configured, otherwise token exchange will fail.

---

## Testing Recommendations

1. **Test OAuth Connection**:
   - Start with sandbox environment
   - Verify "Connect to HMRC" button works
   - Verify callback page completes successfully

2. **Test Token Refresh**:
   - After connecting, wait for token to expire (or manually trigger refresh)
   - Verify "Refresh Token" button works
   - Verify new tokens are saved correctly

3. **Test Security**:
   - Try to send credentials in request body (should be rejected)
   - Verify credentials are not logged in console
   - Verify credentials are not stored in company settings

---

## Linting Status

✅ **No linting errors found** in modified files.

---

## Summary

✅ **Implementation Complete**: All code changes have been made to secure OAuth credentials.

⏳ **Manual Steps Required**: You need to:
1. Create `.env.local` with client ID
2. Set Firebase Secrets for credentials
3. Deploy functions
4. Test the flow

🔒 **Security**: Credentials are now stored server-side only and never sent from client.

---

**Implementation Date**: January 2025  
**Status**: ✅ Code Complete - Manual Setup Required

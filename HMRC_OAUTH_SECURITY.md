# HMRC OAuth & API Authorization Security

**Implementation Guide for OAuth 2.0 Compliance**

This document outlines the security implementation for HMRC OAuth 2.0 integration, ensuring compliance with HMRC requirements for token handling and credential management.

---

## Table of Contents

1. [Requirements Summary](#1-requirements-summary)
2. [Server-Side OAuth Implementation](#2-server-side-oauth-implementation)
3. [Credential Storage](#3-credential-storage)
4. [Token Encryption](#4-token-encryption)
5. [Implementation Status](#5-implementation-status)
6. [Setup Instructions](#6-setup-instructions)

---

## 1. Requirements Summary

### HMRC OAuth & API Authorization Requirements

| Requirement | Description | Status |
|-------------|-------------|--------|
| Server-side OAuth | OAuth 2.0 must be implemented server-side via Firebase Functions | ✅ Implemented |
| No client-side credentials | Client ID and Client Secret must never be stored client-side | ✅ Implemented |
| Token encryption at rest | Tokens must be encrypted when stored in database | ✅ Implemented |
| Token encryption in transit | All communications must use HTTPS/TLS | ✅ Implemented |

---

## 2. Server-Side OAuth Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OAuth 2.0 Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser                Firebase Functions         HMRC     │
│  ───────                ──────────────────         ────     │
│     │                          │                    │       │
│     │  1. Get Auth URL         │                    │       │
│     │─────────────────────────>│                    │       │
│     │  (via getHMRCAuthUrl)    │                    │       │
│     │                          │                    │       │
│     │  2. Auth URL returned    │                    │       │
│     │<─────────────────────────│                    │       │
│     │                          │                    │       │
│     │  3. Redirect to HMRC     │                    │       │
│     │──────────────────────────────────────────────>│       │
│     │                          │                    │       │
│     │  4. User authorizes      │                    │       │
│     │<──────────────────────────────────────────────│       │
│     │  (redirect with code)    │                    │       │
│     │                          │                    │       │
│     │  5. Exchange code        │                    │       │
│     │─────────────────────────>│                    │       │
│     │  (via exchangeHMRCToken) │  6. Token request  │       │
│     │                          │───────────────────>│       │
│     │                          │  (with secrets)    │       │
│     │                          │                    │       │
│     │                          │  7. Tokens         │       │
│     │  8. Encrypted tokens     │<───────────────────│       │
│     │<─────────────────────────│                    │       │
│     │                          │                    │       │
│     │  9. Store encrypted      │                    │       │
│     │     tokens in Firebase   │                    │       │
│     │                          │                    │       │
└─────────────────────────────────────────────────────────────┘
```

### Firebase Functions

All OAuth operations are handled server-side:

| Function | Purpose | File |
|----------|---------|------|
| `getHMRCAuthUrl` | Generate HMRC authorization URL | `hmrcRTISubmission.ts` |
| `exchangeHMRCToken` | Exchange auth code for tokens | `hmrcOAuth.ts` |
| `refreshHMRCToken` | Refresh expired tokens | `hmrcOAuth.ts` |

### Security Features

1. **Credentials in Firebase Secrets**
   ```typescript
   // functions/src/hmrcOAuth.ts
   const hmrcClientId = defineSecret('HMRC_CLIENT_ID')
   const hmrcClientSecret = defineSecret('HMRC_CLIENT_SECRET')
   ```

2. **Credential Injection Prevention**
   ```typescript
   // Reject any request containing credentials
   if (req.body.clientId || req.body.clientSecret) {
     console.error('SECURITY VIOLATION: Client attempted to send credentials')
     res.status(400).json({ error: 'Security violation' })
     return
   }
   ```

3. **Server-Only Token Exchange**
   - Client only sends authorization code
   - Server adds credentials from Firebase Secrets
   - Tokens returned to client for storage

---

## 3. Credential Storage

### What Goes Where

| Data Type | Storage Location | Encryption |
|-----------|-----------------|------------|
| Client ID | Firebase Secrets | Managed by GCP |
| Client Secret | Firebase Secrets | Managed by GCP |
| Access Token | Firebase Realtime Database | AES-256-GCM |
| Refresh Token | Firebase Realtime Database | AES-256-GCM |
| Encryption Key | Firebase Secrets | Managed by GCP |

### Client-Side Security

**NEVER stored client-side:**
- Client ID
- Client Secret
- Unencrypted tokens

**Stored client-side (encrypted):**
- Encrypted access token (in Firebase Database)
- Encrypted refresh token (in Firebase Database)

---

## 4. Token Encryption

### Encryption at Rest

Tokens are encrypted using AES-256-GCM before storage:

```typescript
// src/backend/services/hmrc/HMRCTokenEncryption.ts

// Encrypt tokens before storing
const encryptedTokens = await hmrcTokenEncryption.encryptTokens({
  accessToken: 'plain_access_token',
  refreshToken: 'plain_refresh_token',
  expiresIn: 3600
})

// Result stored in Firebase:
{
  hmrcAccessToken: 'AES-256-GCM-ENCRYPTED-DATA',
  hmrcRefreshToken: 'AES-256-GCM-ENCRYPTED-DATA',
  hmrcTokenExpiry: 1703548800,
  isEncrypted: true,
  encryptionVersion: 'v1'
}
```

### Encryption Specification

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Derivation | PBKDF2 (100,000 iterations) |
| IV | 12 bytes, randomly generated |
| Output | Base64 encoded (IV + ciphertext) |

### Decryption for Use

```typescript
// Decrypt when needed for API calls
const decrypted = await hmrcTokenEncryption.decryptTokens({
  hmrcAccessToken: encryptedData.hmrcAccessToken,
  hmrcRefreshToken: encryptedData.hmrcRefreshToken,
  hmrcTokenExpiry: encryptedData.hmrcTokenExpiry,
  isEncrypted: true
})

// Use decrypted.accessToken for HMRC API calls
```

### Encryption in Transit

All communications use HTTPS/TLS:

| Connection | Protocol | Verified |
|------------|----------|----------|
| Browser ↔ Firebase Functions | HTTPS (TLS 1.2+) | ✅ |
| Firebase Functions ↔ HMRC API | HTTPS (TLS 1.2+) | ✅ |
| Browser ↔ Firebase Database | HTTPS (TLS 1.2+) | ✅ |

---

## 5. Implementation Status

### Files Implementing OAuth Security

```
functions/src/
├── hmrcOAuth.ts              # Server-side OAuth (token exchange/refresh)
└── hmrcRTISubmission.ts      # Server-side OAuth (auth URL generation)

src/backend/
├── services/hmrc/
│   ├── HMRCTokenEncryption.ts  # Token encryption service
│   └── HMRCAPIClient.ts        # Client-side API wrapper
├── functions/
│   └── HMRCSettings.tsx        # Token storage with encryption
└── utils/
    └── EncryptionService.ts    # Core encryption utilities
```

### Security Checklist

- [x] OAuth 2.0 implemented server-side
- [x] Client ID stored in Firebase Secrets
- [x] Client Secret stored in Firebase Secrets
- [x] Credential injection prevention
- [x] Token encryption service created
- [x] AES-256-GCM encryption implemented
- [x] Encryption key derivation (PBKDF2)
- [x] Token decryption for API use
- [x] HTTPS/TLS for all communications
- [x] Legacy unencrypted token handling

---

## 6. Setup Instructions

### Step 1: Configure Firebase Secrets

```bash
# Set HMRC OAuth credentials
firebase functions:secrets:set HMRC_CLIENT_ID
firebase functions:secrets:set HMRC_CLIENT_SECRET

# Set token encryption key (generate secure key first)
openssl rand -base64 32  # Generate key
firebase functions:secrets:set HMRC_ENCRYPTION_KEY
```

### Step 2: Initialize Encryption in Application

```typescript
// In your application startup (e.g., App.tsx or context provider)
import { initializeTokenEncryption } from './backend/functions/HMRCSettings'

// Initialize with key from secure source
// In production, fetch from authenticated server endpoint
initializeTokenEncryption(encryptionKey)
```

### Step 3: Deploy Firebase Functions

```bash
firebase deploy --only functions
```

### Step 4: Verify Configuration

```bash
# List configured secrets
firebase functions:secrets:access HMRC_CLIENT_ID
firebase functions:secrets:access HMRC_CLIENT_SECRET
firebase functions:secrets:access HMRC_ENCRYPTION_KEY
```

---

## Security Best Practices

### DO:
- ✅ Store OAuth credentials in Firebase Secrets
- ✅ Encrypt tokens before storing in database
- ✅ Use HTTPS for all communications
- ✅ Validate all inputs server-side
- ✅ Log security events (without sensitive data)
- ✅ Rotate encryption keys periodically

### DO NOT:
- ❌ Store credentials in client-side code
- ❌ Store credentials in .env files (use Secrets)
- ❌ Log tokens or credentials
- ❌ Accept credentials from client requests
- ❌ Store unencrypted tokens in database
- ❌ Hardcode encryption keys

---

## Compliance Summary

| HMRC Requirement | Implementation |
|------------------|----------------|
| Server-side OAuth 2.0 | Firebase Functions handle all OAuth operations |
| No client-side credentials | Credentials stored in Firebase Secrets only |
| Tokens encrypted at rest | AES-256-GCM encryption via HMRCTokenEncryption |
| Tokens encrypted in transit | HTTPS/TLS 1.2+ for all communications |

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Applies To:** HMRC MTD PAYE OAuth Integration

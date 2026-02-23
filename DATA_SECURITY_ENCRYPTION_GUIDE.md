# Data Security & Encryption Guide

**Developer Training Document for UK GDPR and HMRC Compliance**

This guide covers the implementation of data encryption for the HR/Payroll system, ensuring compliance with UK GDPR Article 32 and HMRC security requirements.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Encryption Requirements](#2-encryption-requirements)
3. [TLS/Transport Security](#3-tlstransport-security)
4. [Data at Rest Encryption](#4-data-at-rest-encryption)
5. [Key Management](#5-key-management)
6. [Sensitive Data Fields](#6-sensitive-data-fields)
7. [Usage Examples](#7-usage-examples)
8. [Developer Checklist](#8-developer-checklist)
9. [Security Best Practices](#9-security-best-practices)

---

## 1. Overview

### Compliance Requirements

| Requirement | Implementation |
|-------------|----------------|
| Encrypt sensitive data in Firebase | ✅ AES-256-GCM field-level encryption |
| Use TLS 1.3 for network communication | ✅ Firebase enforces TLS 1.2+ |
| Secure key management | ✅ Firebase Secrets (keys separate from data) |
| Developer encryption training | ✅ This document |

### Encryption Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA FLOW                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Application                      Firebase                   │
│  ──────────                       ────────                   │
│                                                              │
│  [Employee Data]                                             │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────┐                                        │
│  │ SensitiveData    │                                        │
│  │ Service          │                                        │
│  │ (AES-256-GCM)    │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  [Encrypted Data]   ───TLS 1.2+──>  [Firebase Database]      │
│                                      (Encrypted at rest)     │
│                                                              │
│  Encryption Key ◄─── Firebase ─────  [Secret Manager]        │
│  (In Memory)         Secrets         (Key storage)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Encryption Requirements

### What MUST Be Encrypted

| Data Type | Fields | Encryption Level |
|-----------|--------|-----------------|
| **Identity** | NI Number, DOB | CRITICAL |
| **Financial** | Bank account, Sort code, IBAN | CRITICAL |
| **Tax** | Tax code, Tax ID, PAYE Reference | CRITICAL |
| **OAuth** | Access tokens, Refresh tokens | CRITICAL |
| **Contact** | Email, Phone, Address | HIGH |
| **Salary** | Gross pay, Net pay, Deductions | HIGH |

### Encryption Specification

| Property | Value |
|----------|-------|
| Algorithm | AES-256-GCM |
| Key Derivation | PBKDF2 with SHA-256, 100,000 iterations |
| IV | 12 bytes, randomly generated per encryption |
| Key Length | 256 bits (32 characters minimum) |
| Output | Base64 encoded (marker + IV + ciphertext) |

---

## 3. TLS/Transport Security

### Firebase TLS Configuration

Firebase automatically enforces TLS for all connections:

| Connection | Protocol | Status |
|------------|----------|--------|
| Client ↔ Firebase Database | TLS 1.2+ | ✅ Enforced |
| Client ↔ Firebase Functions | TLS 1.2+ | ✅ Enforced |
| Firebase Functions ↔ HMRC API | TLS 1.2+ | ✅ Enforced |
| Client ↔ Firebase Auth | TLS 1.2+ | ✅ Enforced |

### Verification

Firebase does not allow unencrypted connections. All URLs must use `https://`:

```typescript
// ✅ CORRECT: HTTPS enforced
const FUNCTIONS_URL = 'https://us-central1-project.cloudfunctions.net'
const DATABASE_URL = 'https://project.firebaseio.com'

// ❌ WRONG: HTTP not supported
const FUNCTIONS_URL = 'http://us-central1-project.cloudfunctions.net'
```

### Certificate Management

- **DO NOT** import custom certificates
- **DO** use system root CA certificates (default)
- Firebase uses certificates from trusted CAs (DigiCert, etc.)

---

## 4. Data at Rest Encryption

### Available Services

```
src/backend/services/encryption/
├── SensitiveDataService.ts    # Employee/Payroll PII encryption
├── KeyManagementService.ts    # Secure key retrieval
└── index.ts                   # Service exports

src/backend/services/oauth/
└── SecureTokenStorage.ts      # OAuth token encryption

src/backend/services/hmrc/
└── HMRCTokenEncryption.ts     # HMRC-specific token encryption

src/backend/utils/
└── EncryptionService.ts       # Core encryption utilities
```

### Encryption Services

#### 1. SensitiveDataService (Employee/Payroll Data)

```typescript
import { sensitiveDataService } from '@/backend/services/encryption'

// Initialize with encryption key (from Firebase Secrets)
sensitiveDataService.initialize(encryptionKey)

// Encrypt employee data before storing
const encryptedEmployee = await sensitiveDataService.encryptEmployeeData(employee)
await saveToFirebase(encryptedEmployee)

// Decrypt employee data after retrieving
const encryptedData = await getFromFirebase(employeeId)
const employee = await sensitiveDataService.decryptEmployeeData(encryptedData)
```

#### 2. HMRCTokenEncryption (OAuth Tokens)

```typescript
import { hmrcTokenEncryption } from '@/backend/services/hmrc'

// Initialize
hmrcTokenEncryption.initialize(encryptionKey)

// Encrypt tokens before storing
const encryptedTokens = await hmrcTokenEncryption.encryptTokens({
  accessToken: 'abc123',
  refreshToken: 'xyz789',
  expiresIn: 3600
})
```

#### 3. SecureTokenStorage (General OAuth)

```typescript
import { secureTokenStorage } from '@/backend/services/encryption'

// Store encrypted token
await secureTokenStorage.storeToken(companyId, 'hmrc', token, { environment: 'production' })

// Retrieve decrypted token
const token = await secureTokenStorage.getToken(companyId, 'hmrc', { environment: 'production' })
```

---

## 5. Key Management

### Storage Locations

| Key Type | Storage | Access |
|----------|---------|--------|
| Encryption keys | Firebase Secrets | Server-side only |
| OAuth credentials | Firebase Secrets | Server-side only |
| Encrypted data | Firebase Database | Client + Server |

### Setup Instructions

#### 1. Generate Encryption Key

```bash
# Generate a secure 32-byte key
openssl rand -base64 32
# Output: xK7dP2mN8sL4fG6hJ9kR3tY5vW1cA2bE+z==
```

#### 2. Store in Firebase Secrets

```bash
# Store general encryption key
firebase functions:secrets:set GENERAL_ENCRYPTION_KEY

# Store HMRC-specific key (optional, can use general)
firebase functions:secrets:set HMRC_ENCRYPTION_KEY

# Store employee data key (optional, can use general)
firebase functions:secrets:set EMPLOYEE_DATA_KEY
```

#### 3. Access in Firebase Functions

```typescript
// functions/src/index.ts
import { defineSecret } from 'firebase-functions/params'

const encryptionKey = defineSecret('GENERAL_ENCRYPTION_KEY')

export const myFunction = onRequest(
  { secrets: [encryptionKey] },
  async (req, res) => {
    const key = encryptionKey.value()
    sensitiveDataService.initialize(key)
    // ... use encrypted data
  }
)
```

### Key Rotation

```typescript
import { sensitiveDataService } from '@/backend/services/encryption'

// Re-encrypt data with new key
const reEncrypted = await sensitiveDataService.rotateEncryptionKey(
  employeeData,
  oldKey,
  newKey,
  EMPLOYEE_ENCRYPTED_FIELDS
)
```

---

## 6. Sensitive Data Fields

### Employee Data (CRITICAL)

```typescript
const EMPLOYEE_ENCRYPTED_FIELDS = [
  'nationalInsuranceNumber',    // AB123456C
  'dateOfBirth',                // Unix timestamp
  'bankDetails.accountNumber',  // 12345678
  'bankDetails.routingNumber',  // 12-34-56
  'bankDetails.iban',           // GB29NWBK60161331926819
  'taxCode',                    // 1257L
  'taxInformation.taxId',       // Tax identifier
  'pensionSchemeReference',     // PSTR
]
```

### Employee Data (HIGH PRIORITY)

```typescript
const EMPLOYEE_SENSITIVE_FIELDS = [
  'email',                     // john@example.com
  'phone',                     // 07123456789
  'emergencyContact.phone',
  'address.street',
  'address.zipCode',
  'salary',                    // Annual salary
  'hourlyRate',                // Hourly rate
]
```

### Payroll Data

```typescript
const PAYROLL_ENCRYPTED_FIELDS = [
  'grossPay',
  'netPay',
  'taxDeductions',
  'employeeNIDeductions',
  'employerNIContributions',
  'studentLoanDeductions',
  'employeePensionDeductions',
  'ytdData.grossPayYTD',
  'ytdData.taxPaidYTD',
]
```

### Company Data

```typescript
const COMPANY_ENCRYPTED_FIELDS = [
  'business.taxId',
  'registrationDetails.vatNumber',
  'financialDetails.bankDetails.accountNumber',
  'financialDetails.bankDetails.sortCode',
]
```

---

## 7. Usage Examples

### Example 1: Saving an Employee

```typescript
import { sensitiveDataService } from '@/backend/services/encryption'
import { ref, set } from 'firebase/database'
import { db } from '@/backend/services/Firebase'

async function saveEmployee(companyId: string, employee: Employee) {
  // 1. Ensure encryption is initialized
  if (!sensitiveDataService.isInitialized()) {
    throw new Error('Encryption not initialized')
  }

  // 2. Encrypt sensitive fields
  const encryptedEmployee = await sensitiveDataService.encryptEmployeeData(employee)

  // 3. Save to Firebase (encrypted data)
  const employeeRef = ref(db, `companies/${companyId}/employees/${employee.id}`)
  await set(employeeRef, encryptedEmployee)

  console.log('Employee saved with encrypted PII')
}
```

### Example 2: Retrieving an Employee

```typescript
async function getEmployee(companyId: string, employeeId: string): Promise<Employee> {
  // 1. Get encrypted data from Firebase
  const employeeRef = ref(db, `companies/${companyId}/employees/${employeeId}`)
  const snapshot = await get(employeeRef)
  const encryptedData = snapshot.val()

  // 2. Decrypt sensitive fields
  const employee = await sensitiveDataService.decryptEmployeeData(encryptedData)

  return employee
}
```

### Example 3: Display with Masked Data

```typescript
async function getEmployeeForDisplay(companyId: string, employeeId: string) {
  const encryptedData = await getFromFirebase(employeeId)

  // Decrypt with masking for safe display
  const maskedEmployee = await sensitiveDataService.getEmployeeDataForDisplay(encryptedData)

  // Result:
  // {
  //   name: "John Smith",
  //   nationalInsuranceNumber: "AB****56C",  // Masked
  //   email: "j***h@example.com",             // Masked
  //   bankDetails: {
  //     accountNumber: "****5678",           // Masked
  //   }
  // }

  return maskedEmployee
}
```

### Example 4: Payroll Processing

```typescript
async function processPayroll(companyId: string, payrollId: string) {
  // Get encrypted payroll
  const encryptedPayroll = await getPayrollFromFirebase(payrollId)

  // Decrypt for calculations
  const payroll = await sensitiveDataService.decryptPayrollData(encryptedPayroll)

  // Process payroll calculations...
  const processedPayroll = calculatePayroll(payroll)

  // Encrypt and save
  const encryptedResult = await sensitiveDataService.encryptPayrollData(processedPayroll)
  await savePayrollToFirebase(encryptedResult)
}
```

---

## 8. Developer Checklist

### Before Writing Code

- [ ] Understand which fields are sensitive (see Section 6)
- [ ] Know which encryption service to use
- [ ] Ensure encryption key is available

### When Storing Data

- [ ] Initialize encryption service with key
- [ ] Encrypt sensitive fields BEFORE saving to Firebase
- [ ] Verify data is encrypted in Firebase Console

### When Retrieving Data

- [ ] Decrypt sensitive fields AFTER retrieving from Firebase
- [ ] Use masked display for UI when appropriate
- [ ] Never log decrypted sensitive data

### Key Management

- [ ] Never hardcode encryption keys
- [ ] Use Firebase Secrets for key storage
- [ ] Rotate keys periodically (annually recommended)

### Code Review

- [ ] Check for unencrypted sensitive data
- [ ] Verify encryption is initialized
- [ ] Ensure keys are from secure source

---

## 9. Security Best Practices

### DO ✅

```typescript
// ✅ Initialize encryption from Firebase Secrets
const key = await getKeyFromFirebaseSecrets()
sensitiveDataService.initialize(key)

// ✅ Encrypt before storing
const encrypted = await sensitiveDataService.encryptEmployeeData(employee)
await saveToFirebase(encrypted)

// ✅ Use masking for display
const masked = await sensitiveDataService.getEmployeeDataForDisplay(data)

// ✅ Check if data is encrypted
if (sensitiveDataService.isInitialized()) { ... }
```

### DO NOT ❌

```typescript
// ❌ Never hardcode encryption keys
const key = 'my-secret-key-123'  // WRONG!

// ❌ Never store sensitive data unencrypted
await saveToFirebase({ niNumber: 'AB123456C' })  // WRONG!

// ❌ Never log sensitive data
console.log(`Employee NI: ${employee.niNumber}`)  // WRONG!

// ❌ Never store keys in code or .env files
ENCRYPTION_KEY=abc123  // WRONG - use Firebase Secrets!

// ❌ Never expose keys to client-side
import.meta.env.VITE_ENCRYPTION_KEY  // WRONG for production!
```

### Logging Guidelines

```typescript
// ✅ Safe logging
console.log(`Processing employee: ${employee.id}`)
console.log(`Encrypted fields: ${EMPLOYEE_ENCRYPTED_FIELDS.length}`)

// ❌ Unsafe logging
console.log(`Employee NI: ${employee.nationalInsuranceNumber}`)  // NEVER!
console.log(`Bank account: ${employee.bankDetails.accountNumber}`)  // NEVER!
console.log(`Encryption key: ${key}`)  // NEVER!
```

### Error Handling

```typescript
try {
  const decrypted = await sensitiveDataService.decryptEmployeeData(data)
} catch (error) {
  // ✅ Safe error logging
  console.error('Failed to decrypt employee data:', error.message)

  // ❌ Never include sensitive data in errors
  console.error('Failed to decrypt:', data)  // WRONG!
}
```

---

## Quick Reference

### Service Initialization

```typescript
import {
  sensitiveDataService,
  hmrcTokenEncryption,
  secureTokenStorage,
  initializeAllEncryption
} from '@/backend/services/encryption'

// Initialize all services with one key
initializeAllEncryption(encryptionKey, {
  sensitiveDataService,
  hmrcTokenEncryption,
  secureTokenStorage
})
```

### Firebase Secrets Commands

```bash
# List secrets
firebase functions:secrets:access GENERAL_ENCRYPTION_KEY

# Set new secret
firebase functions:secrets:set GENERAL_ENCRYPTION_KEY

# Delete secret
firebase functions:secrets:destroy GENERAL_ENCRYPTION_KEY
```

### Encryption Key Requirements

| Requirement | Value |
|-------------|-------|
| Minimum length | 32 characters |
| Recommended | Base64 encoded 32 bytes |
| Storage | Firebase Secret Manager |
| Rotation | Annually or after breach |

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Compliance:** UK GDPR Article 32, HMRC Security Requirements

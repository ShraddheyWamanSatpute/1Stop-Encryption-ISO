/**
 * Encryption Services Index
 *
 * Exports all encryption-related services for data security compliance.
 *
 * Services:
 * - SensitiveDataService: Field-level encryption for PII
 * - SecureTokenStorage: OAuth token encryption
 * - KeyManagementService: Secure key retrieval and management
 * - EncryptionService: Core encryption utilities
 */

// Sensitive Data Encryption (Employee, Payroll, Company PII)
export {
  SensitiveDataService,
  sensitiveDataService,
  initializeSensitiveDataEncryption,
  isEncryptedField,
  EMPLOYEE_ENCRYPTED_FIELDS,
  EMPLOYEE_SENSITIVE_FIELDS,
  PAYROLL_ENCRYPTED_FIELDS,
  COMPANY_ENCRYPTED_FIELDS,
  USER_PERSONAL_ENCRYPTED_FIELDS,
  BANK_ACCOUNT_ENCRYPTED_FIELDS
} from './SensitiveDataService'

export type {
  EncryptedFieldResult,
  EncryptionOptions,
  DecryptionOptions
} from './SensitiveDataService'

// Key Management
export {
  KeyManagementService,
  keyManagementService,
  initializeAllEncryption,
  ENCRYPTION_KEY_ENV_VARS
} from './KeyManagementService'

export type {
  EncryptionKeyType,
  KeyMetadata,
  KeyRotationResult
} from './KeyManagementService'

// Re-export from oauth for convenience
export { SecureTokenStorage, secureTokenStorage } from '../oauth/SecureTokenStorage'
export type { OAuthToken, EncryptedTokenRecord, TokenMetadata } from '../oauth/SecureTokenStorage'

// Re-export core encryption utilities
export {
  EncryptionService,
  SensitiveDataEncryption,
  DataMasking,
  encryptionService,
  sensitiveDataEncryption
} from '../../utils/EncryptionService'

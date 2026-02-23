/**
 * Sensitive Data Encryption Service
 *
 * Provides field-level encryption for sensitive PII (Personally Identifiable Information)
 * stored in Firebase. Complies with UK GDPR and HMRC security requirements.
 *
 * Encrypted Fields (Critical):
 * - National Insurance Numbers
 * - Bank Account Details (account number, sort code, IBAN)
 * - Dates of Birth
 * - Tax Information
 * - Salary/Financial Data
 *
 * Security Features:
 * - AES-256-GCM encryption
 * - PBKDF2 key derivation (100,000 iterations)
 * - Random IV per encryption
 * - Key stored in Firebase Secrets (never with data)
 *
 * Production: Callers (Company, HRs, Finance, Settings rtdatabase modules) must
 * never persist sensitive data unencrypted in production: they throw if
 * encryption fails or the service is not initialized when import.meta.env.PROD
 * is true. Dev-only fallback (store without encryption) is scoped to non-PROD.
 *
 * Reference: ICO Encryption Guidance, UK GDPR Article 32
 */

import { EncryptionService, DataMasking } from '../../utils/EncryptionService'

// ============================================================================
// CONFIGURATION: Define which fields are sensitive and require encryption
// ============================================================================

/**
 * Employee fields that MUST be encrypted (Critical PII)
 */
export const EMPLOYEE_ENCRYPTED_FIELDS = [
  // Identity
  'nationalInsuranceNumber',
  'dateOfBirth',

  // Bank Details
  'bankDetails.accountNumber',
  'bankDetails.routingNumber',
  'bankDetails.iban',
  'bankDetails.swift',

  // Tax Information
  'taxInformation.taxId',
  'taxCode',

  // P45 Previous Employment
  'p45Data.previousEmployerPAYERef',
  'p45Data.taxCodeAtLeaving',
  'p45Data.payToDate',
  'p45Data.taxToDate',

  // Pension References
  'pensionSchemeReference',
] as const

/**
 * Employee fields that SHOULD be encrypted (High Priority PII)
 */
export const EMPLOYEE_SENSITIVE_FIELDS = [
  // Contact Information
  'email',
  'phone',
  'emergencyContact.phone',

  // Address
  'address.street',
  'address.zipCode',

  // Financial
  'salary',
  'hourlyRate',
] as const

/**
 * Payroll fields that MUST be encrypted (Financial Data)
 */
export const PAYROLL_ENCRYPTED_FIELDS = [
  'grossPay',
  'netPay',
  'taxDeductions',
  'employeeNIDeductions',
  'employerNIContributions',
  'studentLoanDeductions',
  'postgraduateLoanDeductions',
  'employeePensionDeductions',
  'employerPensionContributions',

  // YTD Data
  'ytdData.grossPayYTD',
  'ytdData.taxablePayYTD',
  'ytdData.taxPaidYTD',
  'ytdData.employeeNIPaidYTD',
  'ytdData.employerNIPaidYTD',
] as const

/**
 * Company fields that MUST be encrypted
 */
export const COMPANY_ENCRYPTED_FIELDS = [
  'business.taxId',
  'registrationDetails.vatNumber',
  'registrationDetails.corporationTaxReference',
  'financialDetails.bankDetails.accountNumber',
  'financialDetails.bankDetails.sortCode',
  'financialDetails.bankDetails.iban',
] as const

/**
 * User personal settings fields that MUST be encrypted
 * Used for users/{uid}/settings/personal (bankDetails, niNumber, taxCode)
 */
export const USER_PERSONAL_ENCRYPTED_FIELDS = [
  'bankDetails.accountNumber',
  'bankDetails.sortCode',
  'bankDetails.iban',
  'bankDetails.swift',
  'niNumber',
  'taxCode',
] as const

/**
 * Bank account fields (Finance module) - top-level fields
 * Used when encrypting BankAccount objects directly
 */
export const BANK_ACCOUNT_ENCRYPTED_FIELDS = [
  'accountNumber',
] as const

// ============================================================================
// TYPES
// ============================================================================

/**
 * Encryption result with metadata
 */
export interface EncryptedFieldResult {
  value: string           // Encrypted value (base64)
  isEncrypted: true       // Marker for encrypted fields
  encryptedAt: number     // Timestamp of encryption
  fieldPath: string       // Original field path for reference
}

/**
 * Encryption options
 */
export interface EncryptionOptions {
  /** Skip fields that are already encrypted */
  skipEncrypted?: boolean
  /** Include encryption metadata */
  includeMetadata?: boolean
  /** Fields to encrypt (overrides defaults) */
  fieldsToEncrypt?: string[]
}

/**
 * Decryption options
 */
export interface DecryptionOptions {
  /** Only decrypt specified fields */
  fieldsToDecrypt?: string[]
  /** Return masked values instead of full values for display */
  maskForDisplay?: boolean
}

// ============================================================================
// SENSITIVE DATA ENCRYPTION SERVICE
// ============================================================================

/**
 * SensitiveDataService
 *
 * Handles encryption/decryption of sensitive employee, payroll, and company data.
 * Uses AES-256-GCM encryption with keys stored in Firebase Secrets.
 */
export class SensitiveDataService {
  private encryptionService: EncryptionService
  private encryptionKey: string | null = null
  private static readonly ENCRYPTION_VERSION = 'v2'
  private static readonly ENCRYPTED_MARKER = 'ENC:'
  // Legacy marker for backward compatibility
  private static readonly LEGACY_ENCRYPTED_MARKER = '__encrypted__'

  constructor() {
    this.encryptionService = new EncryptionService()
  }

  /**
   * Initialize with encryption key
   *
   * IMPORTANT: The encryption key must come from Firebase Secrets.
   * Never hardcode or store the key in client-side code.
   *
   * @param key - AES-256 encryption key (minimum 32 characters)
   */
  initialize(key: string): void {
    if (!key) {
      throw new Error('Encryption key is required')
    }
    if (key.length < 32) {
      throw new Error('Encryption key must be at least 32 characters for AES-256')
    }
    this.encryptionKey = key
    console.log('[SensitiveDataService] Initialized with encryption key')
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.encryptionKey !== null
  }

  // ==========================================================================
  // EMPLOYEE DATA ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt sensitive fields in employee data before storing
   *
   * @param employee - Employee data object
   * @param options - Encryption options
   * @returns Employee data with sensitive fields encrypted
   */
  async encryptEmployeeData<T extends Record<string, unknown>>(
    employee: T,
    options: EncryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToEncrypt = options.fieldsToEncrypt || [
      ...EMPLOYEE_ENCRYPTED_FIELDS,
      ...EMPLOYEE_SENSITIVE_FIELDS
    ]

    return this.encryptFields(employee, fieldsToEncrypt, options)
  }

  /**
   * Decrypt sensitive fields in employee data after retrieving
   *
   * @param employee - Employee data with encrypted fields
   * @param options - Decryption options
   * @returns Employee data with sensitive fields decrypted
   */
  async decryptEmployeeData<T extends Record<string, unknown>>(
    employee: T,
    options: DecryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToDecrypt = options.fieldsToDecrypt || [
      ...EMPLOYEE_ENCRYPTED_FIELDS,
      ...EMPLOYEE_SENSITIVE_FIELDS
    ]

    return this.decryptFields(employee, fieldsToDecrypt, options)
  }

  // ==========================================================================
  // PAYROLL DATA ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt sensitive fields in payroll data before storing
   *
   * @param payroll - Payroll data object
   * @param options - Encryption options
   * @returns Payroll data with sensitive fields encrypted
   */
  async encryptPayrollData<T extends Record<string, unknown>>(
    payroll: T,
    options: EncryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToEncrypt = options.fieldsToEncrypt || [...PAYROLL_ENCRYPTED_FIELDS]

    return this.encryptFields(payroll, fieldsToEncrypt, options)
  }

  /**
   * Decrypt sensitive fields in payroll data after retrieving
   *
   * @param payroll - Payroll data with encrypted fields
   * @param options - Decryption options
   * @returns Payroll data with sensitive fields decrypted
   */
  async decryptPayrollData<T extends Record<string, unknown>>(
    payroll: T,
    options: DecryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToDecrypt = options.fieldsToDecrypt || [...PAYROLL_ENCRYPTED_FIELDS]

    return this.decryptFields(payroll, fieldsToDecrypt, options)
  }

  // ==========================================================================
  // COMPANY DATA ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt sensitive fields in company data before storing
   *
   * @param company - Company data object
   * @param options - Encryption options
   * @returns Company data with sensitive fields encrypted
   */
  async encryptCompanyData<T extends Record<string, unknown>>(
    company: T,
    options: EncryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToEncrypt = options.fieldsToEncrypt || [...COMPANY_ENCRYPTED_FIELDS]

    return this.encryptFields(company, fieldsToEncrypt, options)
  }

  /**
   * Decrypt sensitive fields in company data after retrieving
   *
   * @param company - Company data with encrypted fields
   * @param options - Decryption options
   * @returns Company data with sensitive fields decrypted
   */
  async decryptCompanyData<T extends Record<string, unknown>>(
    company: T,
    options: DecryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToDecrypt = options.fieldsToDecrypt || [...COMPANY_ENCRYPTED_FIELDS]

    return this.decryptFields(company, fieldsToDecrypt, options)
  }

  // ==========================================================================
  // USER PERSONAL SETTINGS ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt sensitive fields in user personal settings before storing
   * Used for users/{uid}/settings/personal (bankDetails, niNumber, taxCode)
   *
   * @param personal - Personal settings object
   * @param options - Encryption options
   * @returns Personal settings with sensitive fields encrypted
   */
  async encryptUserPersonalData<T extends Record<string, unknown>>(
    personal: T,
    options: EncryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToEncrypt = options.fieldsToEncrypt || [...USER_PERSONAL_ENCRYPTED_FIELDS]

    return this.encryptFields(personal, fieldsToEncrypt, options)
  }

  /**
   * Decrypt sensitive fields in user personal settings after retrieving
   *
   * @param personal - Personal settings with encrypted fields
   * @param options - Decryption options
   * @returns Personal settings with sensitive fields decrypted
   */
  async decryptUserPersonalData<T extends Record<string, unknown>>(
    personal: T,
    options: DecryptionOptions = {}
  ): Promise<T> {
    this.ensureInitialized()

    const fieldsToDecrypt = options.fieldsToDecrypt || [...USER_PERSONAL_ENCRYPTED_FIELDS]

    return this.decryptFields(personal, fieldsToDecrypt, options)
  }

  // ==========================================================================
  // SINGLE FIELD ENCRYPTION
  // ==========================================================================

  /**
   * Encrypt a single value
   *
   * @param value - Plain text value to encrypt
   * @returns Encrypted value (base64 encoded)
   */
  async encryptValue(value: string): Promise<string> {
    this.ensureInitialized()

    if (!value || value.length === 0) {
      return value
    }

    // Check if already encrypted
    if (this.isEncryptedValue(value)) {
      return value
    }

    const encrypted = await this.encryptionService.encrypt(value, this.encryptionKey!)
    return `${SensitiveDataService.ENCRYPTED_MARKER}${encrypted}`
  }

  /**
   * Decrypt a single value
   *
   * @param encryptedValue - Encrypted value to decrypt
   * @returns Decrypted plain text value
   */
  async decryptValue(encryptedValue: string): Promise<string> {
    this.ensureInitialized()

    if (!encryptedValue || encryptedValue.length === 0) {
      return encryptedValue
    }

    // Check if actually encrypted
    if (!this.isEncryptedValue(encryptedValue)) {
      console.warn('[SensitiveDataService] Value does not appear to be encrypted')
      return encryptedValue
    }

    // Remove marker and decrypt - handle both legacy and new markers
    let ciphertext = encryptedValue
    if (encryptedValue.startsWith(SensitiveDataService.ENCRYPTED_MARKER)) {
      ciphertext = encryptedValue.substring(SensitiveDataService.ENCRYPTED_MARKER.length)
    } else if (encryptedValue.startsWith(SensitiveDataService.LEGACY_ENCRYPTED_MARKER)) {
      ciphertext = encryptedValue.substring(SensitiveDataService.LEGACY_ENCRYPTED_MARKER.length)
    }
    return this.encryptionService.decrypt(ciphertext, this.encryptionKey!)
  }

  /**
   * Check if a value is encrypted (has encryption marker)
   * Supports both current (ENC:) and legacy (__encrypted__) markers
   */
  isEncryptedValue(value: string): boolean {
    return typeof value === 'string' && (
      value.startsWith(SensitiveDataService.ENCRYPTED_MARKER) ||
      value.startsWith(SensitiveDataService.LEGACY_ENCRYPTED_MARKER)
    )
  }

  // ==========================================================================
  // GENERIC FIELD ENCRYPTION/DECRYPTION
  // ==========================================================================

  /**
   * Encrypt specified fields in an object
   *
   * @param data - Object containing data to encrypt
   * @param fieldPaths - Array of field paths to encrypt (supports dot notation)
   * @param options - Encryption options
   */
  private async encryptFields<T extends Record<string, unknown>>(
    data: T,
    fieldPaths: readonly string[],
    options: EncryptionOptions
  ): Promise<T> {
    const result = this.deepClone(data)

    for (const fieldPath of fieldPaths) {
      try {
        const value = this.getNestedValue(result, fieldPath)

        if (value === undefined || value === null) {
          continue
        }

        // Skip if already encrypted and option set
        if (options.skipEncrypted && this.isEncryptedValue(String(value))) {
          continue
        }

        // Only encrypt strings and numbers
        if (typeof value !== 'string' && typeof value !== 'number') {
          continue
        }

        const stringValue = String(value)
        const encryptedValue = await this.encryptValue(stringValue)
        this.setNestedValue(result, fieldPath, encryptedValue)
      } catch (error) {
        console.warn(`[SensitiveDataService] Failed to encrypt field ${fieldPath}:`, error)
        // Continue with other fields
      }
    }

    // Add encryption metadata
    if (options.includeMetadata !== false) {
      (result as Record<string, unknown>).__encryptionMeta = {
        version: SensitiveDataService.ENCRYPTION_VERSION,
        encryptedAt: Date.now(),
        fieldsEncrypted: fieldPaths.length
      }
    }

    return result
  }

  /**
   * Decrypt specified fields in an object
   *
   * @param data - Object containing encrypted data
   * @param fieldPaths - Array of field paths to decrypt (supports dot notation)
   * @param options - Decryption options
   */
  private async decryptFields<T extends Record<string, unknown>>(
    data: T,
    fieldPaths: readonly string[],
    options: DecryptionOptions
  ): Promise<T> {
    const result = this.deepClone(data)

    for (const fieldPath of fieldPaths) {
      try {
        const value = this.getNestedValue(result, fieldPath)

        if (value === undefined || value === null) {
          continue
        }

        // Only decrypt encrypted values
        if (!this.isEncryptedValue(String(value))) {
          continue
        }

        const decryptedValue = await this.decryptValue(String(value))

        // Apply masking if requested
        if (options.maskForDisplay) {
          const maskedValue = this.maskValue(fieldPath, decryptedValue)
          this.setNestedValue(result, fieldPath, maskedValue)
        } else {
          this.setNestedValue(result, fieldPath, decryptedValue)
        }
      } catch (error) {
        console.warn(`[SensitiveDataService] Failed to decrypt field ${fieldPath}:`, error)
        // Leave field as-is on error
      }
    }

    return result
  }

  // ==========================================================================
  // MASKING FOR DISPLAY
  // ==========================================================================

  /**
   * Mask a value for safe display (without full decryption exposure)
   *
   * @param fieldPath - Field path to determine masking type
   * @param value - Decrypted value to mask
   */
  private maskValue(fieldPath: string, value: string): string {
    const lowerPath = fieldPath.toLowerCase()

    if (lowerPath.includes('nationalinsurance') || lowerPath.includes('ninumber')) {
      return DataMasking.maskNINumber(value)
    }
    if (lowerPath.includes('accountnumber') || lowerPath.includes('account')) {
      return DataMasking.maskBankAccount(value)
    }
    if (lowerPath.includes('sortcode') || lowerPath.includes('routingnumber')) {
      return DataMasking.maskSortCode(value)
    }
    if (lowerPath.includes('email')) {
      return DataMasking.maskEmail(value)
    }
    if (lowerPath.includes('phone')) {
      return DataMasking.maskPhone(value)
    }
    if (lowerPath.includes('payereference') || lowerPath.includes('paye')) {
      return DataMasking.maskPAYEReference(value)
    }
    if (lowerPath.includes('dateofbirth') || lowerPath.includes('dob')) {
      return DataMasking.maskDateOfBirth(value)
    }
    if (lowerPath.includes('address') || lowerPath.includes('street')) {
      return DataMasking.maskAddress(value)
    }

    // Default: mask middle portion
    if (value.length > 4) {
      return value.substring(0, 2) + '***' + value.slice(-2)
    }
    return '***'
  }

  /**
   * Get employee data with masked sensitive fields for display
   *
   * @param employee - Employee data (encrypted)
   * @returns Employee data with masked values
   */
  async getEmployeeDataForDisplay<T extends Record<string, unknown>>(employee: T): Promise<T> {
    return this.decryptEmployeeData(employee, { maskForDisplay: true })
  }

  /**
   * Get payroll data with masked sensitive fields for display
   *
   * @param payroll - Payroll data (encrypted)
   * @returns Payroll data with masked values
   */
  async getPayrollDataForDisplay<T extends Record<string, unknown>>(payroll: T): Promise<T> {
    return this.decryptPayrollData(payroll, { maskForDisplay: true })
  }

  // ==========================================================================
  // KEY ROTATION
  // ==========================================================================

  /**
   * Re-encrypt data with a new key (for key rotation)
   *
   * @param data - Data to re-encrypt
   * @param oldKey - Current encryption key
   * @param newKey - New encryption key
   * @param fieldPaths - Fields to re-encrypt
   */
  async rotateEncryptionKey<T extends Record<string, unknown>>(
    data: T,
    oldKey: string,
    newKey: string,
    fieldPaths: readonly string[]
  ): Promise<T> {
    // Temporarily use old key
    const savedKey = this.encryptionKey
    this.encryptionKey = oldKey

    // Decrypt with old key
    const decrypted = await this.decryptFields(data, fieldPaths, {})

    // Use new key
    this.encryptionKey = newKey

    // Encrypt with new key
    const reEncrypted = await this.encryptFields(decrypted, fieldPaths, { skipEncrypted: false })

    // Restore original key
    this.encryptionKey = savedKey

    return reEncrypted
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
        return (current as Record<string, unknown>)[key]
      }
      return undefined
    }, obj)
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!

    let current: Record<string, unknown> = obj
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[lastKey] = value
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.encryptionKey) {
      throw new Error('SensitiveDataService not initialized. Call initialize() with encryption key first.')
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance for sensitive data encryption
 */
export const sensitiveDataService = new SensitiveDataService()

/**
 * Helper function to initialize the service
 *
 * @param key - Encryption key from Firebase Secrets
 */
export function initializeSensitiveDataEncryption(key: string): void {
  sensitiveDataService.initialize(key)
}

/**
 * Check if a field path is in the list of encrypted fields
 *
 * @param fieldPath - Field path to check
 * @param dataType - Type of data (employee, payroll, company)
 */
export function isEncryptedField(
  fieldPath: string,
  dataType: 'employee' | 'payroll' | 'company'
): boolean {
  switch (dataType) {
    case 'employee':
      return [...EMPLOYEE_ENCRYPTED_FIELDS, ...EMPLOYEE_SENSITIVE_FIELDS].includes(fieldPath as never)
    case 'payroll':
      return PAYROLL_ENCRYPTED_FIELDS.includes(fieldPath as never)
    case 'company':
      return COMPANY_ENCRYPTED_FIELDS.includes(fieldPath as never)
    default:
      return false
  }
}

/**
 * Encryption Key Management Service
 *
 * Handles secure retrieval and management of encryption keys.
 * Keys are stored in Firebase Secrets (server-side) and never
 * stored alongside encrypted data.
 *
 * Security Requirements:
 * - Keys stored in Firebase Secret Manager
 * - Keys never exposed to client-side code
 * - Keys never logged or included in error messages
 * - Key rotation supported for compliance
 *
 * Reference: HMRC Security Requirements, UK GDPR Article 32
 */

/**
 * Available encryption key types
 */
export type EncryptionKeyType =
  | 'HMRC_ENCRYPTION_KEY'      // HMRC OAuth tokens
  | 'EMPLOYEE_DATA_KEY'        // Employee PII
  | 'PAYROLL_DATA_KEY'         // Payroll financial data
  | 'COMPANY_DATA_KEY'         // Company sensitive data
  | 'GENERAL_ENCRYPTION_KEY'   // General purpose encryption

/**
 * Key metadata (non-sensitive)
 */
export interface KeyMetadata {
  keyType: EncryptionKeyType
  version: string
  createdAt: number
  rotatedAt?: number
  expiresAt?: number
  isActive: boolean
}

/**
 * Key rotation result
 */
export interface KeyRotationResult {
  success: boolean
  oldKeyVersion: string
  newKeyVersion: string
  recordsReEncrypted: number
  errors?: string[]
}

/**
 * Key Management Service
 *
 * Provides secure access to encryption keys stored in Firebase Secrets.
 *
 * IMPORTANT: This service should only be instantiated server-side
 * (Firebase Functions) where secrets are accessible.
 */
export class KeyManagementService {
  private keyCache: Map<EncryptionKeyType, string> = new Map()
  private keyMetadata: Map<EncryptionKeyType, KeyMetadata> = new Map()
  private isServerSide: boolean

  constructor() {
    // Detect if running server-side (Node.js environment)
    this.isServerSide = typeof process !== 'undefined' && process.versions?.node !== undefined
  }

  /**
   * Get encryption key from secure storage
   *
   * For server-side (Firebase Functions):
   * - Retrieves from process.env (populated by Firebase Secrets)
   *
   * For client-side:
   * - Should fetch from authenticated server endpoint
   * - Never directly access secrets
   *
   * @param keyType - Type of encryption key to retrieve
   * @returns Encryption key or null if not available
   */
  async getKey(keyType: EncryptionKeyType): Promise<string | null> {
    // Check cache first
    if (this.keyCache.has(keyType)) {
      return this.keyCache.get(keyType)!
    }

    let key: string | null = null

    if (this.isServerSide) {
      // Server-side: Get from environment (Firebase Secrets)
      key = this.getKeyFromEnvironment(keyType)
    } else {
      // Client-side: Must fetch from server
      console.warn(
        `[KeyManagement] Client-side key access for ${keyType}. ` +
        'Keys should be retrieved via authenticated server endpoint.'
      )
      key = this.getKeyFromClientEnvironment(keyType)
    }

    if (key) {
      this.keyCache.set(keyType, key)
    }

    return key
  }

  /**
   * Initialize all encryption services with their keys
   *
   * @param services - Object containing encryption services to initialize
   */
  async initializeServices(services: {
    sensitiveDataService?: { initialize: (key: string) => void }
    hmrcTokenEncryption?: { initialize: (key: string) => void }
    secureTokenStorage?: { initialize: (key: string) => void }
  }): Promise<{ initialized: string[]; failed: string[] }> {
    const initialized: string[] = []
    const failed: string[] = []

    // Initialize sensitive data service
    if (services.sensitiveDataService) {
      const key = await this.getKey('EMPLOYEE_DATA_KEY') || await this.getKey('GENERAL_ENCRYPTION_KEY')
      if (key) {
        services.sensitiveDataService.initialize(key)
        initialized.push('sensitiveDataService')
      } else {
        failed.push('sensitiveDataService')
      }
    }

    // Initialize HMRC token encryption
    if (services.hmrcTokenEncryption) {
      const key = await this.getKey('HMRC_ENCRYPTION_KEY') || await this.getKey('GENERAL_ENCRYPTION_KEY')
      if (key) {
        services.hmrcTokenEncryption.initialize(key)
        initialized.push('hmrcTokenEncryption')
      } else {
        failed.push('hmrcTokenEncryption')
      }
    }

    // Initialize secure token storage
    if (services.secureTokenStorage) {
      const key = await this.getKey('GENERAL_ENCRYPTION_KEY')
      if (key) {
        services.secureTokenStorage.initialize(key)
        initialized.push('secureTokenStorage')
      } else {
        failed.push('secureTokenStorage')
      }
    }

    if (initialized.length > 0) {
      console.log(`[KeyManagement] Initialized services: ${initialized.join(', ')}`)
    }
    if (failed.length > 0) {
      console.warn(`[KeyManagement] Failed to initialize services: ${failed.join(', ')}`)
    }

    return { initialized, failed }
  }

  /**
   * Validate that all required keys are configured
   *
   * @param requiredKeys - Array of key types to validate
   * @returns Validation result
   */
  async validateKeys(requiredKeys: EncryptionKeyType[]): Promise<{
    valid: boolean
    missing: EncryptionKeyType[]
    configured: EncryptionKeyType[]
  }> {
    const missing: EncryptionKeyType[] = []
    const configured: EncryptionKeyType[] = []

    for (const keyType of requiredKeys) {
      const key = await this.getKey(keyType)
      if (key && key.length >= 32) {
        configured.push(keyType)
      } else {
        missing.push(keyType)
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      configured
    }
  }

  /**
   * Clear key cache (for testing or key rotation)
   */
  clearCache(): void {
    this.keyCache.clear()
    console.log('[KeyManagement] Key cache cleared')
  }

  /**
   * Get key from server environment (Firebase Secrets)
   */
  private getKeyFromEnvironment(keyType: EncryptionKeyType): string | null {
    // Map key type to environment variable name
    const envVarName = keyType

    // Try to get from process.env
    if (process.env[envVarName]) {
      return process.env[envVarName]!
    }

    // Fallback to general key
    if (keyType !== 'GENERAL_ENCRYPTION_KEY' && process.env.GENERAL_ENCRYPTION_KEY) {
      console.log(`[KeyManagement] Using GENERAL_ENCRYPTION_KEY as fallback for ${keyType}`)
      return process.env.GENERAL_ENCRYPTION_KEY
    }

    console.warn(`[KeyManagement] Key ${keyType} not found in environment`)
    return null
  }

  /**
   * Get key from client environment (Vite env variables)
   *
   * NOTE: This should only be used for development.
   * In production, keys should be fetched from authenticated server.
   */
  private getKeyFromClientEnvironment(keyType: EncryptionKeyType): string | null {
    // Try Vite environment variables
    const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env

    if (viteEnv) {
      // Map to VITE_ prefixed variables
      const viteVarName = `VITE_${keyType}`
      if (viteEnv[viteVarName]) {
        return viteEnv[viteVarName]
      }

      // Try general key
      if (viteEnv.VITE_GENERAL_ENCRYPTION_KEY) {
        return viteEnv.VITE_GENERAL_ENCRYPTION_KEY
      }
    }

    return null
  }

  /**
   * Generate key metadata
   */
  private generateKeyMetadata(keyType: EncryptionKeyType, version: string): KeyMetadata {
    return {
      keyType,
      version,
      createdAt: Date.now(),
      isActive: true
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Singleton instance for key management
 */
export const keyManagementService = new KeyManagementService()

/**
 * Helper to initialize all encryption with a single key
 *
 * @param key - Master encryption key
 * @param services - Services to initialize
 */
export async function initializeAllEncryption(
  key: string,
  services: {
    sensitiveDataService?: { initialize: (key: string) => void }
    hmrcTokenEncryption?: { initialize: (key: string) => void }
    secureTokenStorage?: { initialize: (key: string) => void }
  }
): Promise<void> {
  for (const [name, service] of Object.entries(services)) {
    if (service) {
      try {
        service.initialize(key)
        console.log(`[Encryption] Initialized ${name}`)
      } catch (error) {
        console.error(`[Encryption] Failed to initialize ${name}:`, error)
      }
    }
  }
}

/**
 * Environment variable names for encryption keys
 */
export const ENCRYPTION_KEY_ENV_VARS = {
  HMRC: 'HMRC_ENCRYPTION_KEY',
  EMPLOYEE: 'EMPLOYEE_DATA_KEY',
  PAYROLL: 'PAYROLL_DATA_KEY',
  COMPANY: 'COMPANY_DATA_KEY',
  GENERAL: 'GENERAL_ENCRYPTION_KEY'
} as const

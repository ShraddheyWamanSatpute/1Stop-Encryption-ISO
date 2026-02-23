/**
 * HMRC Token Encryption Service
 *
 * Provides encryption/decryption for OAuth tokens stored in Firebase.
 * Implements encryption at rest as required by HMRC OAuth & API Authorization requirements.
 *
 * Security Requirements:
 * - Tokens must be encrypted at rest (AES-256-GCM)
 * - Encryption key must be stored in Firebase Secrets, never in client code
 * - Tokens are already encrypted in transit (HTTPS/TLS)
 *
 * Reference: HMRC Development Practices, ICO Encryption Guidance
 */

import { EncryptionService, SensitiveDataEncryption } from '../../utils/EncryptionService'

// Fields that contain sensitive OAuth tokens
const HMRC_TOKEN_FIELDS = ['hmrcAccessToken', 'hmrcRefreshToken'] as const

/**
 * Interface for encrypted token storage
 */
export interface EncryptedHMRCTokens {
  hmrcAccessToken: string       // AES-256-GCM encrypted
  hmrcRefreshToken: string      // AES-256-GCM encrypted
  hmrcTokenExpiry: number       // Timestamp (not sensitive)
  lastHMRCAuthDate: number      // Timestamp (not sensitive)
  isEncrypted: true             // Marker to identify encrypted data
  encryptionVersion: string     // Version for future key rotation
}

/**
 * Interface for decrypted tokens (internal use only)
 */
export interface DecryptedHMRCTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

/**
 * HMRCTokenEncryption class
 *
 * Handles encryption and decryption of HMRC OAuth tokens.
 * Uses AES-256-GCM encryption with PBKDF2 key derivation.
 */
export class HMRCTokenEncryption {
  private encryptionService: EncryptionService
  private encryptionKey: string | null = null
  private static readonly ENCRYPTION_VERSION = 'v1'

  constructor() {
    this.encryptionService = new EncryptionService()
  }

  /**
   * Initialize with encryption key
   *
   * IMPORTANT: The encryption key should be:
   * - Retrieved from Firebase Secrets (server-side)
   * - At least 32 characters long
   * - Never hardcoded or stored in client code
   *
   * @param key - Encryption key from secure source
   */
  initialize(key: string): void {
    if (!key) {
      throw new Error('Encryption key is required')
    }
    if (key.length < 32) {
      throw new Error('Encryption key must be at least 32 characters for AES-256')
    }
    this.encryptionKey = key
    console.log('[HMRC Token Encryption] Service initialized')
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.encryptionKey !== null
  }

  /**
   * Encrypt OAuth tokens for storage
   *
   * @param tokens - Plain text tokens from HMRC OAuth response
   * @returns Encrypted tokens ready for Firebase storage
   */
  async encryptTokens(tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }): Promise<EncryptedHMRCTokens> {
    if (!this.encryptionKey) {
      throw new Error('Token encryption service not initialized. Call initialize() first.')
    }

    const now = Date.now()
    const expiryTime = now + (tokens.expiresIn * 1000)

    // Encrypt sensitive token values
    const encryptedAccessToken = await this.encryptionService.encrypt(
      tokens.accessToken,
      this.encryptionKey
    )
    const encryptedRefreshToken = await this.encryptionService.encrypt(
      tokens.refreshToken,
      this.encryptionKey
    )

    return {
      hmrcAccessToken: encryptedAccessToken,
      hmrcRefreshToken: encryptedRefreshToken,
      hmrcTokenExpiry: expiryTime,
      lastHMRCAuthDate: now,
      isEncrypted: true,
      encryptionVersion: HMRCTokenEncryption.ENCRYPTION_VERSION
    }
  }

  /**
   * Decrypt stored tokens for use
   *
   * @param encryptedTokens - Encrypted tokens from Firebase
   * @returns Decrypted tokens for API calls
   */
  async decryptTokens(encryptedTokens: {
    hmrcAccessToken: string
    hmrcRefreshToken: string
    hmrcTokenExpiry: number
    isEncrypted?: boolean
  }): Promise<DecryptedHMRCTokens> {
    if (!this.encryptionKey) {
      throw new Error('Token encryption service not initialized. Call initialize() first.')
    }

    // Check if tokens are actually encrypted
    if (!encryptedTokens.isEncrypted) {
      // Legacy unencrypted tokens - return as-is but log warning
      console.warn('[HMRC Token Encryption] Found unencrypted tokens - consider re-authenticating to encrypt')
      return {
        accessToken: encryptedTokens.hmrcAccessToken,
        refreshToken: encryptedTokens.hmrcRefreshToken,
        expiresAt: encryptedTokens.hmrcTokenExpiry
      }
    }

    // Decrypt token values
    const accessToken = await this.encryptionService.decrypt(
      encryptedTokens.hmrcAccessToken,
      this.encryptionKey
    )
    const refreshToken = await this.encryptionService.decrypt(
      encryptedTokens.hmrcRefreshToken,
      this.encryptionKey
    )

    return {
      accessToken,
      refreshToken,
      expiresAt: encryptedTokens.hmrcTokenExpiry
    }
  }

  /**
   * Check if tokens need re-encryption (e.g., after key rotation)
   */
  needsReEncryption(storedTokens: { encryptionVersion?: string; isEncrypted?: boolean }): boolean {
    // Needs re-encryption if:
    // 1. Not encrypted at all
    // 2. Encrypted with older version
    if (!storedTokens.isEncrypted) {
      return true
    }
    if (storedTokens.encryptionVersion !== HMRCTokenEncryption.ENCRYPTION_VERSION) {
      return true
    }
    return false
  }

  /**
   * Validate that tokens can be decrypted (for health checks)
   */
  async validateEncryption(encryptedTokens: {
    hmrcAccessToken: string
    hmrcRefreshToken: string
    hmrcTokenExpiry: number
    isEncrypted?: boolean
  }): Promise<{ valid: boolean; error?: string }> {
    if (!this.encryptionKey) {
      return { valid: false, error: 'Encryption service not initialized' }
    }

    if (!encryptedTokens.isEncrypted) {
      return { valid: true } // Unencrypted tokens are technically valid
    }

    try {
      // Try to decrypt - if it fails, encryption is invalid
      await this.decryptTokens(encryptedTokens)
      return { valid: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { valid: false, error: `Decryption failed: ${errorMessage}` }
    }
  }
}

/**
 * Singleton instance for token encryption
 *
 * Usage:
 * 1. Initialize with key: hmrcTokenEncryption.initialize(encryptionKey)
 * 2. Encrypt: const encrypted = await hmrcTokenEncryption.encryptTokens(tokens)
 * 3. Decrypt: const decrypted = await hmrcTokenEncryption.decryptTokens(encrypted)
 */
export const hmrcTokenEncryption = new HMRCTokenEncryption()

/**
 * Helper function to get encryption key from environment
 *
 * For client-side: Key should be passed from server during auth flow
 * For server-side (Firebase Functions): Use defineSecret('HMRC_ENCRYPTION_KEY')
 *
 * IMPORTANT: This is a placeholder. In production:
 * - Server-side: Use Firebase Secrets
 * - Client-side: Receive key securely from authenticated server endpoint
 */
export function getTokenEncryptionKey(): string | null {
  // Check environment variable (for development/testing)
  if (typeof process !== 'undefined' && process.env?.HMRC_ENCRYPTION_KEY) {
    return process.env.HMRC_ENCRYPTION_KEY
  }

  // Check Vite environment variable (for client-side builds)
  if (typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_HMRC_ENCRYPTION_KEY) {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_HMRC_ENCRYPTION_KEY ?? null
  }

  console.warn('[HMRC Token Encryption] No encryption key found in environment')
  return null
}

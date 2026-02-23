/**
 * Secure Token Storage Service
 *
 * Encrypts OAuth tokens before storing in Firebase to comply with
 * UK GDPR and HMRC security requirements.
 *
 * Reference: ICO Encryption Guidance, HMRC API Security Requirements
 *
 * Security Features:
 * - AES-256-GCM encryption for tokens at rest
 * - Encryption key stored in Firebase Secrets (server-side only)
 * - Automatic token refresh handling
 * - Audit logging of token operations
 */

import { ref, set, get, remove, update } from 'firebase/database';
import { db } from '../Firebase';
import { EncryptionService } from '../../utils/EncryptionService';

/**
 * OAuth Token structure
 */
export interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Encrypted token storage structure
 */
export interface EncryptedTokenRecord {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
  issuedAt: number;
  expiresAt: number;
  lastRefreshed?: number;
  provider: 'hmrc' | 'google' | 'microsoft';
  environment?: 'sandbox' | 'production';
  createdAt: number;
  updatedAt: number;
}

/**
 * Token metadata (non-sensitive info for queries)
 */
export interface TokenMetadata {
  provider: string;
  environment?: string;
  expiresAt: number;
  isValid: boolean;
  needsRefresh: boolean;
  lastRefreshed?: number;
}

/**
 * Secure Token Storage Service
 * Handles encrypted storage of OAuth tokens
 */
export class SecureTokenStorage {
  private encryptionService: EncryptionService;
  private basePath: string;
  private encryptionKey: string | null = null;
  private readonly TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

  constructor() {
    this.encryptionService = new EncryptionService();
    this.basePath = 'oauth/tokens';
  }

  /**
   * Initialize with encryption key
   * Key should be retrieved from Firebase Secrets on the server
   *
   * @param key - Encryption key (minimum 32 characters)
   */
  initialize(key: string): void {
    if (!key || key.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }
    this.encryptionKey = key;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Store OAuth token securely (encrypted)
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider (hmrc, google, microsoft)
   * @param token - OAuth token to store
   * @param options - Additional options
   */
  async storeToken(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    token: OAuthToken,
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<void> {
    this.ensureInitialized();

    // Generate storage key
    const tokenKey = this.generateTokenKey(companyId, provider, options);
    const tokenRef = ref(db, `${this.basePath}/${tokenKey}`);

    // Encrypt sensitive token data
    const encryptedAccessToken = await this.encryptionService.encrypt(
      token.accessToken,
      this.encryptionKey!
    );
    const encryptedRefreshToken = await this.encryptionService.encrypt(
      token.refreshToken,
      this.encryptionKey!
    );

    const now = Date.now();
    const record: EncryptedTokenRecord = {
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresIn: token.expiresIn,
      tokenType: token.tokenType,
      scope: token.scope,
      issuedAt: token.issuedAt || now,
      expiresAt: token.expiresAt || now + token.expiresIn * 1000,
      provider,
      environment: options.environment,
      createdAt: now,
      updatedAt: now,
    };

    await set(tokenRef, record);

    // Log token storage (without sensitive data)
    console.log(`[SecureTokenStorage] Stored encrypted ${provider} token for company ${companyId}`);
  }

  /**
   * Retrieve and decrypt OAuth token
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider
   * @param options - Additional options
   * @returns Decrypted token or null if not found
   */
  async getToken(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<OAuthToken | null> {
    this.ensureInitialized();

    const tokenKey = this.generateTokenKey(companyId, provider, options);
    const tokenRef = ref(db, `${this.basePath}/${tokenKey}`);

    const snapshot = await get(tokenRef);
    if (!snapshot.exists()) {
      return null;
    }

    const record = snapshot.val() as EncryptedTokenRecord;

    // Decrypt tokens
    const accessToken = await this.encryptionService.decrypt(
      record.encryptedAccessToken,
      this.encryptionKey!
    );
    const refreshToken = await this.encryptionService.decrypt(
      record.encryptedRefreshToken,
      this.encryptionKey!
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: record.expiresIn,
      tokenType: record.tokenType,
      scope: record.scope,
      issuedAt: record.issuedAt,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Get token metadata without decrypting sensitive data
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider
   * @param options - Additional options
   */
  async getTokenMetadata(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<TokenMetadata | null> {
    const tokenKey = this.generateTokenKey(companyId, provider, options);
    const tokenRef = ref(db, `${this.basePath}/${tokenKey}`);

    const snapshot = await get(tokenRef);
    if (!snapshot.exists()) {
      return null;
    }

    const record = snapshot.val() as EncryptedTokenRecord;
    const now = Date.now();

    return {
      provider: record.provider,
      environment: record.environment,
      expiresAt: record.expiresAt,
      isValid: record.expiresAt > now,
      needsRefresh: record.expiresAt - now < this.TOKEN_REFRESH_BUFFER_MS,
      lastRefreshed: record.lastRefreshed,
    };
  }

  /**
   * Update token after refresh
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider
   * @param newToken - New token from refresh
   * @param options - Additional options
   */
  async updateToken(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    newToken: OAuthToken,
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<void> {
    this.ensureInitialized();

    const tokenKey = this.generateTokenKey(companyId, provider, options);
    const tokenRef = ref(db, `${this.basePath}/${tokenKey}`);

    // Check if token exists
    const snapshot = await get(tokenRef);
    if (!snapshot.exists()) {
      // Store as new token if not exists
      await this.storeToken(companyId, provider, newToken, options);
      return;
    }

    // Encrypt new tokens
    const encryptedAccessToken = await this.encryptionService.encrypt(
      newToken.accessToken,
      this.encryptionKey!
    );
    const encryptedRefreshToken = await this.encryptionService.encrypt(
      newToken.refreshToken,
      this.encryptionKey!
    );

    const now = Date.now();
    await update(tokenRef, {
      encryptedAccessToken,
      encryptedRefreshToken,
      expiresIn: newToken.expiresIn,
      expiresAt: newToken.expiresAt || now + newToken.expiresIn * 1000,
      lastRefreshed: now,
      updatedAt: now,
    });

    console.log(`[SecureTokenStorage] Updated encrypted ${provider} token for company ${companyId}`);
  }

  /**
   * Delete stored token
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider
   * @param options - Additional options
   */
  async deleteToken(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<void> {
    const tokenKey = this.generateTokenKey(companyId, provider, options);
    const tokenRef = ref(db, `${this.basePath}/${tokenKey}`);

    await remove(tokenRef);
    console.log(`[SecureTokenStorage] Deleted ${provider} token for company ${companyId}`);
  }

  /**
   * Check if token exists and is valid
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider
   * @param options - Additional options
   */
  async hasValidToken(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<boolean> {
    const metadata = await this.getTokenMetadata(companyId, provider, options);
    return metadata !== null && metadata.isValid;
  }

  /**
   * Check if token needs refresh
   *
   * @param companyId - Company identifier
   * @param provider - OAuth provider
   * @param options - Additional options
   */
  async needsRefresh(
    companyId: string,
    provider: 'hmrc' | 'google' | 'microsoft',
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    } = {}
  ): Promise<boolean> {
    const metadata = await this.getTokenMetadata(companyId, provider, options);
    return metadata !== null && metadata.needsRefresh;
  }

  /**
   * Get all tokens for a company (metadata only)
   *
   * @param companyId - Company identifier
   */
  async getCompanyTokens(companyId: string): Promise<TokenMetadata[]> {
    const companyRef = ref(db, this.basePath);
    const snapshot = await get(companyRef);

    if (!snapshot.exists()) {
      return [];
    }

    const tokens: TokenMetadata[] = [];
    const data = snapshot.val();

    for (const key of Object.keys(data)) {
      if (key.startsWith(`${companyId}_`)) {
        const record = data[key] as EncryptedTokenRecord;
        const now = Date.now();
        tokens.push({
          provider: record.provider,
          environment: record.environment,
          expiresAt: record.expiresAt,
          isValid: record.expiresAt > now,
          needsRefresh: record.expiresAt - now < this.TOKEN_REFRESH_BUFFER_MS,
          lastRefreshed: record.lastRefreshed,
        });
      }
    }

    return tokens;
  }

  /**
   * Rotate encryption key (re-encrypt all tokens with new key)
   *
   * @param companyId - Company identifier
   * @param newKey - New encryption key
   */
  async rotateEncryptionKey(companyId: string, newKey: string): Promise<number> {
    if (!newKey || newKey.length < 32) {
      throw new Error('New encryption key must be at least 32 characters');
    }

    this.ensureInitialized();

    const companyRef = ref(db, this.basePath);
    const snapshot = await get(companyRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const data = snapshot.val();
    let rotatedCount = 0;
    const oldKey = this.encryptionKey!;

    for (const key of Object.keys(data)) {
      if (key.startsWith(`${companyId}_`)) {
        const record = data[key] as EncryptedTokenRecord;

        // Decrypt with old key
        const accessToken = await this.encryptionService.decrypt(
          record.encryptedAccessToken,
          oldKey
        );
        const refreshToken = await this.encryptionService.decrypt(
          record.encryptedRefreshToken,
          oldKey
        );

        // Re-encrypt with new key
        const newEncryptedAccessToken = await this.encryptionService.encrypt(
          accessToken,
          newKey
        );
        const newEncryptedRefreshToken = await this.encryptionService.encrypt(
          refreshToken,
          newKey
        );

        // Update record
        const tokenRef = ref(db, `${this.basePath}/${key}`);
        await update(tokenRef, {
          encryptedAccessToken: newEncryptedAccessToken,
          encryptedRefreshToken: newEncryptedRefreshToken,
          updatedAt: Date.now(),
        });

        rotatedCount++;
      }
    }

    // Update the stored encryption key
    this.encryptionKey = newKey;

    console.log(`[SecureTokenStorage] Rotated encryption key for ${rotatedCount} tokens`);
    return rotatedCount;
  }

  /**
   * Generate storage key for token
   */
  private generateTokenKey(
    companyId: string,
    provider: string,
    options: {
      siteId?: string;
      subsiteId?: string;
      environment?: 'sandbox' | 'production';
    }
  ): string {
    const parts = [companyId];

    if (options.siteId) {
      parts.push(options.siteId);
    }

    if (options.subsiteId) {
      parts.push(options.subsiteId);
    }

    parts.push(provider);

    if (options.environment) {
      parts.push(options.environment);
    }

    return parts.join('_');
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.encryptionKey) {
      throw new Error(
        'SecureTokenStorage not initialized. Call initialize() with encryption key first.'
      );
    }
  }
}

// Export singleton instance
export const secureTokenStorage = new SecureTokenStorage();

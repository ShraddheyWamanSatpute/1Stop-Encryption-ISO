/**
 * OAuth Services Index
 *
 * Secure OAuth token management with encryption at rest.
 *
 * References:
 * - HMRC API Security Requirements
 * - ICO Encryption Guidance
 */

export { SecureTokenStorage, secureTokenStorage } from './SecureTokenStorage';
export type { OAuthToken, EncryptedTokenRecord, TokenMetadata } from './SecureTokenStorage';

/**
 * JWT RSA Key Pair Management (OldYourStop)
 *
 * Mirrors the YourStop jwt-keys module for RS256 JWT signing.
 * Keys should be generated once and stored securely (Firebase Secrets or environment variables).
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface RSAKeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * Generate a new RSA key pair for JWT signing
 * @param keySize Key size in bits (default: 2048, minimum: 2048 for production)
 */
export function generateRSAKeyPair(keySize: number = 2048): RSAKeyPair {
  if (keySize < 2048) {
    throw new Error('RSA key size must be at least 2048 bits for production use');
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: keySize,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { privateKey, publicKey };
}

/**
 * Load RSA keys from environment variables
 */
export function loadRSAKeysFromEnv(): RSAKeyPair | null {
  const privateKey = process.env['JWT_PRIVATE_KEY'];
  const publicKey = process.env['JWT_PUBLIC_KEY'];

  if (!privateKey || !publicKey) {
    return null;
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY') || !publicKey.includes('BEGIN PUBLIC KEY')) {
    throw new Error('Invalid RSA key format. Keys must be in PEM format.');
  }

  return { privateKey, publicKey };
}

/**
 * Get RSA keys for JWT signing
 * Priority: Environment variables > File system > Generate new (dev only)
 */
export function getRSAKeys(): RSAKeyPair {
  const envKeys = loadRSAKeysFromEnv();
  if (envKeys) {
    return envKeys;
  }

  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  if (isDevelopment) {
    try {
      const privateKeyPath = path.join(process.cwd(), 'jwt-private-key.pem');
      const publicKeyPath = path.join(process.cwd(), 'jwt-public-key.pem');

      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
        return { privateKey, publicKey };
      }
    } catch {
      // Fall through to error
    }
  }

  throw new Error(
    'JWT RSA keys not found. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables, ' +
    'or place jwt-private-key.pem and jwt-public-key.pem in the project root (development only).'
  );
}

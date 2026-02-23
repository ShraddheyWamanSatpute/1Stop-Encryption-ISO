/**
 * JWT RSA Key Pair Management
 * 
 * This module handles RSA key pair generation and loading for RS256 JWT signing.
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
 * @returns RSA key pair (PEM format)
 */
export function generateRSAKeyPair(keySize: number = 2048): RSAKeyPair {
  if (keySize < 2048) {
    throw new Error('RSA key size must be at least 2048 bits for production use');
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: keySize,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { privateKey, publicKey };
}

/**
 * Load RSA keys from environment variables
 * @returns RSA key pair or null if not found
 */
export function loadRSAKeysFromEnv(): RSAKeyPair | null {
  const privateKey = process.env['JWT_PRIVATE_KEY'];
  const publicKey = process.env['JWT_PUBLIC_KEY'];

  if (!privateKey || !publicKey) {
    return null;
  }

  // Validate key format
  if (!privateKey.includes('BEGIN PRIVATE KEY') || !publicKey.includes('BEGIN PUBLIC KEY')) {
    throw new Error('Invalid RSA key format. Keys must be in PEM format.');
  }

  return { privateKey, publicKey };
}

/**
 * Load RSA keys from file system
 * @param privateKeyPath Path to private key file
 * @param publicKeyPath Path to public key file
 * @returns RSA key pair
 */
export function loadRSAKeysFromFile(
  privateKeyPath: string,
  publicKeyPath: string
): RSAKeyPair {
  try {
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    return { privateKey, publicKey };
  } catch (error) {
    throw new Error(`Failed to load RSA keys from files: ${error}`);
  }
}

/**
 * Save RSA keys to file system (for development only)
 * @param keyPair RSA key pair
 * @param outputDir Output directory (default: current directory)
 */
export function saveRSAKeysToFile(
  keyPair: RSAKeyPair,
  outputDir: string = process.cwd()
): void {
  const privateKeyPath = path.join(outputDir, 'jwt-private-key.pem');
  const publicKeyPath = path.join(outputDir, 'jwt-public-key.pem');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(privateKeyPath, keyPair.privateKey, { mode: 0o600 });
  fs.writeFileSync(publicKeyPath, keyPair.publicKey, { mode: 0o644 });

  console.log('✅ RSA keys generated and saved:');
  console.log(`   Private key: ${privateKeyPath}`);
  console.log(`   Public key: ${publicKeyPath}`);
  console.log('\n⚠️  IMPORTANT: Add these files to .gitignore!');
  console.log('⚠️  For production, store keys in Firebase Secrets or environment variables.');
}

/**
 * Get RSA keys for JWT signing
 * Priority: Environment variables > File system > Generate new (dev only)
 * @returns RSA key pair
 */
export function getRSAKeys(): RSAKeyPair {
  // Try environment variables first
  const envKeys = loadRSAKeysFromEnv();
  if (envKeys) {
    return envKeys;
  }

  // Try file system (development)
  const isDevelopment = process.env['NODE_ENV'] !== 'production';
  if (isDevelopment) {
    try {
      const privateKeyPath = path.join(process.cwd(), 'jwt-private-key.pem');
      const publicKeyPath = path.join(process.cwd(), 'jwt-public-key.pem');

      if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        return loadRSAKeysFromFile(privateKeyPath, publicKeyPath);
      }
    } catch (error) {
      // Fall through to error
    }
  }

  // Production: keys must be provided
  throw new Error(
    'JWT RSA keys not found. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables, ' +
    'or place jwt-private-key.pem and jwt-public-key.pem in the project root (development only).'
  );
}

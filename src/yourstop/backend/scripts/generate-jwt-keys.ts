#!/usr/bin/env tsx
/**
 * Generate RSA Key Pair for JWT Signing
 * 
 * This script generates a new RSA key pair for RS256 JWT signing.
 * 
 * Usage:
 *   tsx scripts/generate-jwt-keys.ts
 *   tsx scripts/generate-jwt-keys.ts --output-dir ./keys
 *   tsx scripts/generate-jwt-keys.ts --key-size 4096
 */

import { generateRSAKeyPair, saveRSAKeysToFile } from '../lib/jwt-keys';
import * as path from 'path';

const args = process.argv.slice(2);
let outputDir = process.cwd();
let keySize = 2048;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--key-size' && args[i + 1]) {
    keySize = parseInt(args[i + 1], 10);
    if (isNaN(keySize) || keySize < 2048) {
      console.error('❌ Key size must be at least 2048 bits');
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Generate RSA Key Pair for JWT Signing (RS256)

Usage:
  tsx scripts/generate-jwt-keys.ts [options]

Options:
  --output-dir <dir>    Output directory (default: current directory)
  --key-size <size>     Key size in bits (default: 2048, minimum: 2048)
  --help, -h            Show this help message

Examples:
  tsx scripts/generate-jwt-keys.ts
  tsx scripts/generate-jwt-keys.ts --output-dir ./keys
  tsx scripts/generate-jwt-keys.ts --key-size 4096

Output:
  - jwt-private-key.pem (keep secret!)
  - jwt-public-key.pem  (can be shared)

Next Steps:
  1. Add keys to .gitignore
  2. Set JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables
  3. For production, store keys in Firebase Secrets or secure vault
    `);
    process.exit(0);
  }
}

console.log('🔐 Generating RSA key pair for JWT signing...\n');
console.log(`   Key size: ${keySize} bits`);
console.log(`   Output directory: ${outputDir}\n`);

try {
  const keyPair = generateRSAKeyPair(keySize);
  saveRSAKeysToFile(keyPair, outputDir);

  console.log('\n📋 Environment Variables:');
  console.log('Add these to your .env file or deployment environment:');
  console.log('\nJWT_PRIVATE_KEY="');
  console.log(keyPair.privateKey);
  console.log('"');
  console.log('\nJWT_PUBLIC_KEY="');
  console.log(keyPair.publicKey);
  console.log('"');

  console.log('\n✅ Key generation complete!');
  console.log('\n⚠️  SECURITY REMINDERS:');
  console.log('   - Never commit private keys to version control');
  console.log('   - Store private keys in Firebase Secrets for production');
  console.log('   - Use environment variables or secure vault');
  console.log('   - Rotate keys periodically');
} catch (error) {
  console.error('❌ Failed to generate keys:', error);
  process.exit(1);
}

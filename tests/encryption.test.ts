/**
 * Encryption Service Tests
 *
 * Comprehensive tests for:
 * - AES-256-GCM encryption/decryption
 * - PBKDF2 key derivation
 * - Data masking functions
 * - Sensitive data field encryption
 * - OAuth token encryption
 *
 * Run with: npx ts-node tests/encryption.test.ts
 * Or: npx tsx tests/encryption.test.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Setup Node.js crypto for Web Crypto API compatibility
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as unknown as { crypto: Crypto }).crypto = webcrypto as unknown as Crypto;
}

// Import encryption utilities
import {
  EncryptionService,
  SensitiveDataEncryption,
  DataMasking,
} from '../src/backend/utils/EncryptionService';

// Test configuration
const TEST_ENCRYPTION_KEY = 'test-encryption-key-for-hmrc-compliance-32chars!';
const TEST_ENCRYPTION_KEY_SHORT = 'short-key';

// Test data
const TEST_DATA = {
  niNumber: 'AB123456C',
  payeRef: '123/AB45678',
  email: 'john.doe@example.com',
  phone: '07123456789',
  bankAccount: '12345678',
  sortCode: '12-34-56',
  ipAddress: '192.168.1.100',
  address: '123 High Street, London, SW1A 1AA',
  dob: '1990-05-15',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  refreshToken: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4gZm9yIHRlc3Rpbmc=',
  sensitivePayload: JSON.stringify({
    employeeId: 'EMP001',
    salary: 50000,
    niNumber: 'AB123456C',
    bankDetails: {
      accountNumber: '12345678',
      sortCode: '12-34-56',
    },
  }),
};

// Test results tracking
interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration?: number;
}

const results: TestResult[] = [];

// Helper function to run a test
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      details: 'Test passed',
      duration: Date.now() - start,
    });
    console.log(`✅ PASS: ${name} (${Date.now() - start}ms)`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      details: error.message || String(error),
      duration: Date.now() - start,
    });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Helper to assert equality
function assertEqual(actual: any, expected: any, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: Expected "${expected}", got "${actual}"`);
  }
}

function assertNotEqual(actual: any, expected: any, message: string): void {
  if (actual === expected) {
    throw new Error(`${message}: Values should not be equal`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// =====================================================
// ENCRYPTION SERVICE TESTS
// =====================================================

async function testBasicEncryptDecrypt(): Promise<void> {
  const service = new EncryptionService();
  const plaintext = 'Hello, this is a test message!';
  const key = TEST_ENCRYPTION_KEY;

  const encrypted = await service.encrypt(plaintext, key);
  const decrypted = await service.decrypt(encrypted, key);

  assertEqual(decrypted, plaintext, 'Decrypted text should match original');
  assertNotEqual(encrypted, plaintext, 'Encrypted text should differ from plaintext');
  assertTrue(encrypted.length > 0, 'Encrypted text should not be empty');
}

async function testEncryptionWithDifferentKeys(): Promise<void> {
  const service = new EncryptionService();
  const plaintext = 'Secret data';
  const key1 = 'key-one-for-encryption-testing!!';
  const key2 = 'key-two-for-encryption-testing!!';

  const encrypted1 = await service.encrypt(plaintext, key1);
  const encrypted2 = await service.encrypt(plaintext, key2);

  // Different keys should produce different ciphertexts
  assertNotEqual(encrypted1, encrypted2, 'Different keys should produce different ciphertexts');

  // Each key should only decrypt its own ciphertext
  const decrypted1 = await service.decrypt(encrypted1, key1);
  assertEqual(decrypted1, plaintext, 'Key1 should decrypt its ciphertext');

  // Wrong key should fail
  let wrongKeyFailed = false;
  try {
    await service.decrypt(encrypted1, key2);
  } catch {
    wrongKeyFailed = true;
  }
  assertTrue(wrongKeyFailed, 'Wrong key should fail to decrypt');
}

async function testRandomIVGeneration(): Promise<void> {
  const service = new EncryptionService();
  const plaintext = 'Same message every time';
  const key = TEST_ENCRYPTION_KEY;

  // Encrypt the same message multiple times
  const encrypted1 = await service.encrypt(plaintext, key);
  const encrypted2 = await service.encrypt(plaintext, key);
  const encrypted3 = await service.encrypt(plaintext, key);

  // Each encryption should be different due to random IV
  assertNotEqual(encrypted1, encrypted2, 'Each encryption should be unique (IV)');
  assertNotEqual(encrypted2, encrypted3, 'Each encryption should be unique (IV)');
  assertNotEqual(encrypted1, encrypted3, 'Each encryption should be unique (IV)');

  // But all should decrypt to the same plaintext
  assertEqual(await service.decrypt(encrypted1, key), plaintext, 'Should decrypt correctly');
  assertEqual(await service.decrypt(encrypted2, key), plaintext, 'Should decrypt correctly');
  assertEqual(await service.decrypt(encrypted3, key), plaintext, 'Should decrypt correctly');
}

async function testLargeDataEncryption(): Promise<void> {
  const service = new EncryptionService();
  const key = TEST_ENCRYPTION_KEY;

  // Create a large payload (simulating a full employee record)
  const largeData = JSON.stringify({
    employees: Array.from({ length: 100 }, (_, i) => ({
      id: `EMP${i.toString().padStart(3, '0')}`,
      name: `Employee ${i}`,
      niNumber: `AB${i.toString().padStart(6, '0')}C`,
      salary: 30000 + i * 1000,
      bankAccount: `${12345678 + i}`,
    })),
  });

  const encrypted = await service.encrypt(largeData, key);
  const decrypted = await service.decrypt(encrypted, key);

  assertEqual(decrypted, largeData, 'Large data should encrypt/decrypt correctly');
  assertTrue(encrypted.length > largeData.length, 'Encrypted should be larger (overhead)');
}

async function testSpecialCharacterEncryption(): Promise<void> {
  const service = new EncryptionService();
  const key = TEST_ENCRYPTION_KEY;

  const specialChars = [
    'Hello! @#$%^&*()_+-=[]{}|;:\'",.<>?/`~',
    '日本語テスト', // Japanese
    '中文测试', // Chinese
    'Ελληνικά', // Greek
    'العربية', // Arabic
    '🔐🔑🛡️', // Emojis
    '\n\t\r', // Control characters
    '<script>alert("XSS")</script>', // HTML/JS
  ];

  for (const text of specialChars) {
    const encrypted = await service.encrypt(text, key);
    const decrypted = await service.decrypt(encrypted, key);
    assertEqual(decrypted, text, `Special chars should work: ${text.substring(0, 20)}`);
  }
}

async function testHashFunction(): Promise<void> {
  const service = new EncryptionService();

  const data1 = 'password123';
  const data2 = 'password123';
  const data3 = 'password124';

  const hash1 = await service.hash(data1);
  const hash2 = await service.hash(data2);
  const hash3 = await service.hash(data3);

  // Same input should produce same hash
  assertEqual(hash1, hash2, 'Same input should produce same hash');

  // Different input should produce different hash
  assertNotEqual(hash1, hash3, 'Different input should produce different hash');

  // Hash should be 64 characters (SHA-256 hex)
  assertEqual(hash1.length, 64, 'SHA-256 hash should be 64 hex characters');
}

async function testEmptyAndNullInputs(): Promise<void> {
  const service = new EncryptionService();
  const key = TEST_ENCRYPTION_KEY;

  // Empty plaintext should fail (this is correct security behavior)
  let emptyPlaintextFailed = false;
  try {
    await service.encrypt('', key);
  } catch {
    emptyPlaintextFailed = true;
  }
  assertTrue(emptyPlaintextFailed, 'Empty plaintext should throw error');

  // Empty key should fail
  let emptyKeyFailed = false;
  try {
    await service.encrypt('test', '');
  } catch {
    emptyKeyFailed = true;
  }
  assertTrue(emptyKeyFailed, 'Empty key should throw error');
}

// =====================================================
// SENSITIVE DATA ENCRYPTION TESTS
// =====================================================

async function testSensitiveDataInitialization(): Promise<void> {
  const sde = new SensitiveDataEncryption();

  assertTrue(!sde.isInitialized(), 'Should not be initialized initially');

  // Short key should fail
  let shortKeyFailed = false;
  try {
    sde.initialize(TEST_ENCRYPTION_KEY_SHORT);
  } catch {
    shortKeyFailed = true;
  }
  assertTrue(shortKeyFailed, 'Short key should fail');

  // Valid key should work
  sde.initialize(TEST_ENCRYPTION_KEY);
  assertTrue(sde.isInitialized(), 'Should be initialized after valid key');
}

async function testFieldEncryption(): Promise<void> {
  const sde = new SensitiveDataEncryption();
  sde.initialize(TEST_ENCRYPTION_KEY);

  const niNumber = TEST_DATA.niNumber;
  const encrypted = await sde.encryptField(niNumber);
  const decrypted = await sde.decryptField(encrypted);

  assertEqual(decrypted, niNumber, 'NI number should decrypt correctly');
  assertNotEqual(encrypted, niNumber, 'Encrypted NI should differ');
}

async function testObjectFieldEncryption(): Promise<void> {
  const sde = new SensitiveDataEncryption();
  sde.initialize(TEST_ENCRYPTION_KEY);

  const employeeData = {
    id: 'EMP001',
    name: 'John Doe',
    niNumber: 'AB123456C',
    bankAccount: '12345678',
    email: 'john@example.com',
    department: 'Engineering',
  };

  const sensitiveFields: (keyof typeof employeeData)[] = ['niNumber', 'bankAccount'];

  const encrypted = await sde.encryptSensitiveFields(employeeData, sensitiveFields);

  // Non-sensitive fields should be unchanged
  assertEqual(encrypted.id, employeeData.id, 'ID should be unchanged');
  assertEqual(encrypted.name, employeeData.name, 'Name should be unchanged');
  assertEqual(encrypted.email, employeeData.email, 'Email should be unchanged');

  // Sensitive fields should be encrypted
  assertNotEqual(encrypted.niNumber, employeeData.niNumber, 'NI should be encrypted');
  assertNotEqual(encrypted.bankAccount, employeeData.bankAccount, 'Bank should be encrypted');

  // Decrypt and verify
  const decrypted = await sde.decryptSensitiveFields(encrypted, sensitiveFields);
  assertEqual(decrypted.niNumber, employeeData.niNumber, 'NI should decrypt');
  assertEqual(decrypted.bankAccount, employeeData.bankAccount, 'Bank should decrypt');
}

async function testOAuthTokenEncryption(): Promise<void> {
  const sde = new SensitiveDataEncryption();
  sde.initialize(TEST_ENCRYPTION_KEY);

  const tokens = {
    accessToken: TEST_DATA.accessToken,
    refreshToken: TEST_DATA.refreshToken,
    expiresIn: 3600,
    tokenType: 'Bearer',
  };

  const encrypted = await sde.encryptSensitiveFields(tokens, ['accessToken', 'refreshToken']);

  // Tokens should be encrypted
  assertNotEqual(encrypted.accessToken, tokens.accessToken, 'Access token should be encrypted');
  assertNotEqual(encrypted.refreshToken, tokens.refreshToken, 'Refresh token should be encrypted');

  // Non-token fields unchanged
  assertEqual(encrypted.expiresIn, tokens.expiresIn, 'expiresIn unchanged');
  assertEqual(encrypted.tokenType, tokens.tokenType, 'tokenType unchanged');

  // Decrypt
  const decrypted = await sde.decryptSensitiveFields(encrypted, ['accessToken', 'refreshToken']);
  assertEqual(decrypted.accessToken, tokens.accessToken, 'Access token should decrypt');
  assertEqual(decrypted.refreshToken, tokens.refreshToken, 'Refresh token should decrypt');
}

// =====================================================
// DATA MASKING TESTS
// =====================================================

async function testNINumberMasking(): Promise<void> {
  const masked = DataMasking.maskNINumber(TEST_DATA.niNumber);
  assertEqual(masked, 'AB****56C', 'NI masking format');
  assertTrue(!masked.includes('1234'), 'Middle digits should be hidden');
}

async function testPAYEReferenceMasking(): Promise<void> {
  const masked = DataMasking.maskPAYEReference(TEST_DATA.payeRef);
  assertEqual(masked, '123/***78', 'PAYE masking format');
}

async function testEmailMasking(): Promise<void> {
  const masked = DataMasking.maskEmail(TEST_DATA.email);
  assertEqual(masked, 'j***e@example.com', 'Email masking format');
}

async function testPhoneMasking(): Promise<void> {
  const masked = DataMasking.maskPhone(TEST_DATA.phone);
  assertEqual(masked, '07***6789', 'Phone masking format');
}

async function testBankAccountMasking(): Promise<void> {
  const masked = DataMasking.maskBankAccount(TEST_DATA.bankAccount);
  assertEqual(masked, '****5678', 'Bank account masking format');
}

async function testSortCodeMasking(): Promise<void> {
  const masked = DataMasking.maskSortCode(TEST_DATA.sortCode);
  assertEqual(masked, '**-**-56', 'Sort code masking format');
}

async function testIPAddressMasking(): Promise<void> {
  const masked = DataMasking.maskIPAddress(TEST_DATA.ipAddress);
  assertEqual(masked, '192.168.xxx.xxx', 'IP masking format');
}

async function testAddressMasking(): Promise<void> {
  const masked = DataMasking.maskAddress(TEST_DATA.address);
  assertEqual(masked, 'London, SW1A', 'Address masking format');
}

async function testDOBMasking(): Promise<void> {
  const masked = DataMasking.maskDateOfBirth(TEST_DATA.dob);
  assertEqual(masked, '1990-**-**', 'DOB masking format');
}

// =====================================================
// RUN ALL TESTS
// =====================================================

async function runAllTests(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('ENCRYPTION SERVICE TEST SUITE');
  console.log('='.repeat(60) + '\n');

  console.log('--- Basic Encryption Tests ---');
  await runTest('Basic encrypt/decrypt', testBasicEncryptDecrypt);
  await runTest('Different keys produce different results', testEncryptionWithDifferentKeys);
  await runTest('Random IV generation', testRandomIVGeneration);
  await runTest('Large data encryption', testLargeDataEncryption);
  await runTest('Special character encryption', testSpecialCharacterEncryption);
  await runTest('Hash function', testHashFunction);
  await runTest('Empty and null inputs', testEmptyAndNullInputs);

  console.log('\n--- Sensitive Data Encryption Tests ---');
  await runTest('Initialization validation', testSensitiveDataInitialization);
  await runTest('Field encryption', testFieldEncryption);
  await runTest('Object field encryption', testObjectFieldEncryption);
  await runTest('OAuth token encryption', testOAuthTokenEncryption);

  console.log('\n--- Data Masking Tests ---');
  await runTest('NI Number masking', testNINumberMasking);
  await runTest('PAYE Reference masking', testPAYEReferenceMasking);
  await runTest('Email masking', testEmailMasking);
  await runTest('Phone masking', testPhoneMasking);
  await runTest('Bank Account masking', testBankAccountMasking);
  await runTest('Sort Code masking', testSortCodeMasking);
  await runTest('IP Address masking', testIPAddressMasking);
  await runTest('Address masking', testAddressMasking);
  await runTest('DOB masking', testDOBMasking);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((acc, r) => acc + (r.duration || 0), 0);

  console.log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Total time: ${totalTime}ms`);
  console.log(`Pass rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.details}`);
      });
  }

  console.log('\n' + '='.repeat(60));

  // Demo output
  console.log('\n--- ENCRYPTION DEMO OUTPUT ---\n');

  const service = new EncryptionService();
  const sde = new SensitiveDataEncryption();
  sde.initialize(TEST_ENCRYPTION_KEY);

  const demoNI = 'AB123456C';
  const encryptedNI = await sde.encryptField(demoNI);
  const decryptedNI = await sde.decryptField(encryptedNI);
  const maskedNI = DataMasking.maskNINumber(demoNI);

  console.log('National Insurance Number:');
  console.log(`  Original:  ${demoNI}`);
  console.log(`  Encrypted: ${encryptedNI.substring(0, 50)}...`);
  console.log(`  Decrypted: ${decryptedNI}`);
  console.log(`  Masked:    ${maskedNI}`);

  const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token';
  const encryptedToken = await sde.encryptField(demoToken);
  const decryptedToken = await sde.decryptField(encryptedToken);

  console.log('\nOAuth Token:');
  console.log(`  Original:  ${demoToken.substring(0, 40)}...`);
  console.log(`  Encrypted: ${encryptedToken.substring(0, 50)}...`);
  console.log(`  Decrypted: ${decryptedToken.substring(0, 40)}...`);
  console.log(`  Match:     ${decryptedToken === demoToken ? '✅ YES' : '❌ NO'}`);

  console.log('\nHash Demo:');
  const hash = await service.hash('password123');
  console.log(`  Input:  "password123"`);
  console.log(`  SHA256: ${hash}`);

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);

/**
 * Browser Console Encryption Test Script
 *
 * Copy and paste this entire script into your browser console
 * after the app has loaded to test if encryption is working.
 *
 * Usage:
 * 1. Open your app in the browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(async function testEncryption() {
  console.log('='.repeat(60));
  console.log('🔐 ENCRYPTION TEST SUITE');
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}${details ? `: ${details}` : ''}`);
    results.tests.push({ name, passed, details });
    if (passed) results.passed++;
    else results.failed++;
  }

  // Test 1: Check if encryption status is exposed (development mode)
  console.log('\n--- Environment Checks ---');

  const encryptionStatus = window.__encryptionStatus;
  if (encryptionStatus) {
    logTest('Encryption status exposed in window', true, 'Development mode detected');
    logTest('SensitiveDataService initialized', encryptionStatus.sensitiveDataService?.isInitialized === true);
  } else {
    logTest('Encryption status in window', false, 'Not found (may be production mode)');
  }

  // Test 2: Try to import and check sensitiveDataService
  console.log('\n--- Service Initialization Checks ---');

  try {
    // Check if we can access the service through dynamic import
    const encryptionModule = await import('/src/backend/services/encryption/SensitiveDataService.ts');
    const sensitiveDataService = encryptionModule.sensitiveDataService;

    if (sensitiveDataService) {
      const isInit = sensitiveDataService.isInitialized();
      logTest('SensitiveDataService accessible', true);
      logTest('SensitiveDataService.isInitialized()', isInit, isInit ? 'Service is ready' : 'NOT INITIALIZED - encryption will not work!');

      if (isInit) {
        // Test 3: Try encrypting and decrypting a test value
        console.log('\n--- Encryption/Decryption Tests ---');

        try {
          const testValue = 'AB123456C'; // Sample NI number
          console.log(`Original value: "${testValue}"`);

          const encrypted = await sensitiveDataService.encryptValue(testValue);
          console.log(`Encrypted: "${encrypted.substring(0, 50)}..."`);
          logTest('Encrypt value', encrypted.startsWith('ENC:'), encrypted.startsWith('ENC:') ? 'Has ENC: prefix' : 'Missing ENC: prefix');

          const decrypted = await sensitiveDataService.decryptValue(encrypted);
          console.log(`Decrypted: "${decrypted}"`);
          logTest('Decrypt value', decrypted === testValue, decrypted === testValue ? 'Values match!' : `Mismatch: got "${decrypted}"`);

          // Test multiple encryptions produce different ciphertexts (random IV)
          const encrypted2 = await sensitiveDataService.encryptValue(testValue);
          logTest('Random IV (different ciphertext each time)', encrypted !== encrypted2, 'Security: Same input produces different output');

        } catch (encryptError) {
          logTest('Encryption test', false, encryptError.message);
        }

        // Test 4: Test employee data encryption
        console.log('\n--- Employee Data Encryption Tests ---');

        try {
          const testEmployee = {
            id: 'test-123',
            firstName: 'John',
            lastName: 'Doe',
            nationalInsuranceNumber: 'AB123456C',
            bankDetails: {
              accountNumber: '12345678',
              sortCode: '12-34-56'
            },
            salary: 50000,
            email: 'john.doe@example.com'
          };

          console.log('Test employee data:', JSON.stringify(testEmployee, null, 2));

          const encryptedEmployee = await sensitiveDataService.encryptEmployeeData(testEmployee);

          // Check sensitive fields are encrypted
          const niEncrypted = typeof encryptedEmployee.nationalInsuranceNumber === 'string' &&
                             encryptedEmployee.nationalInsuranceNumber.startsWith('ENC:');
          logTest('NI Number encrypted', niEncrypted);

          const bankEncrypted = encryptedEmployee.bankDetails?.accountNumber?.startsWith?.('ENC:');
          logTest('Bank account encrypted', bankEncrypted);

          // Non-sensitive fields should NOT be encrypted
          logTest('First name NOT encrypted', encryptedEmployee.firstName === 'John');
          logTest('Email NOT encrypted', encryptedEmployee.email === 'john.doe@example.com');

          // Decrypt and verify
          const decryptedEmployee = await sensitiveDataService.decryptEmployeeData(encryptedEmployee);
          logTest('Decrypted NI matches', decryptedEmployee.nationalInsuranceNumber === 'AB123456C');
          logTest('Decrypted bank account matches', decryptedEmployee.bankDetails?.accountNumber === '12345678');

        } catch (employeeError) {
          logTest('Employee data encryption', false, employeeError.message);
        }

      }
    } else {
      logTest('SensitiveDataService accessible', false, 'Service not found in module');
    }
  } catch (importError) {
    console.log('Could not import encryption module directly. Trying alternative method...');

    // Alternative: Check if there's a global reference
    if (window.sensitiveDataService) {
      logTest('SensitiveDataService (global)', window.sensitiveDataService.isInitialized());
    } else {
      logTest('Import encryption module', false, importError.message);
    }
  }

  // Test 5: Check environment variables
  console.log('\n--- Environment Variable Checks ---');

  if (import.meta?.env) {
    const hasKey = !!import.meta.env.VITE_GENERAL_ENCRYPTION_KEY ||
                   !!import.meta.env.VITE_HMRC_ENCRYPTION_KEY ||
                   !!import.meta.env.VITE_EMPLOYEE_DATA_KEY;
    logTest('Encryption key in environment', hasKey, hasKey ? 'Key configured' : 'NO KEY FOUND - add to .env file');

    if (import.meta.env.VITE_GENERAL_ENCRYPTION_KEY) {
      const keyLength = import.meta.env.VITE_GENERAL_ENCRYPTION_KEY.length;
      logTest('Key length >= 32', keyLength >= 32, `Length: ${keyLength} characters`);
    }
  } else {
    logTest('Vite environment', false, 'import.meta.env not available');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${results.passed + results.failed} | ✅ Passed: ${results.passed} | ❌ Failed: ${results.failed}`);
  console.log(`Pass rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  - ${t.name}: ${t.details}`);
    });
  }

  if (results.passed === results.passed + results.failed) {
    console.log('\n🎉 All tests passed! Encryption is working correctly.');
  } else if (results.failed > 0) {
    console.log('\n⚠️ Some tests failed. Check the issues above.');
    console.log('\nCommon fixes:');
    console.log('1. Ensure .env file exists with VITE_GENERAL_ENCRYPTION_KEY');
    console.log('2. Restart the dev server after adding .env');
    console.log('3. Check browser console for initialization errors');
  }

  console.log('\n' + '='.repeat(60));

  return results;
})();

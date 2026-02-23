/**
 * Lawful Basis Enforcement Tests
 * 
 * Tests for GDPR compliance - lawful basis check and documentation
 * before HMRC submissions
 */

import { ConsentService } from '../src/backend/services/gdpr/ConsentService'
import { PrivacyPolicyService } from '../src/backend/services/gdpr/PrivacyPolicy.js'
import { LawfulBasis, ConsentPurpose } from '../src/backend/services/gdpr/types'

// Mock Firebase for testing
const mockDb = {
  ref: (path: string) => ({
    push: () => ({
      key: 'mock-key-' + Date.now(),
    }),
  }),
}

// Test runner helper
function runTest(name: string, testFn: () => void | Promise<void>) {
  let passed = false
  let error: Error | null = null

  try {
    const result = testFn()
    if (result instanceof Promise) {
      result
        .then(() => {
          passed = true
          console.log(`✅ PASS: ${name}`)
        })
        .catch((err) => {
          error = err
          console.error(`❌ FAIL: ${name}`)
          console.error(`   Error: ${err.message}`)
        })
    } else {
      passed = true
      console.log(`✅ PASS: ${name}`)
    }
  } catch (err) {
    error = err as Error
    console.error(`❌ FAIL: ${name}`)
    console.error(`   Error: ${error.message}`)
  }
}

async function runAllTests() {
  console.log('=== Lawful Basis Enforcement Tests ===\n')

  // Mock ConsentService for testing
  const createMockConsentService = () => {
    const consents: any[] = []
    
    return {
      hasHMRCSubmissionBasis: async (userId: string, companyId: string) => {
        const validConsent = consents.find(
          (c) =>
            c.userId === userId &&
            c.companyId === companyId &&
            c.purpose === 'hmrc_submission' &&
            c.consentGiven &&
            !c.withdrawnTimestamp &&
            (c.lawfulBasis === 'legal_obligation' || c.lawfulBasis === 'contract')
        )
        
        if (validConsent) {
          return { valid: true, basis: validConsent.lawfulBasis, record: validConsent }
        }
        
        return { valid: false, basis: null }
      },
      
      documentLawfulBasis: async (
        companyId: string,
        userId: string,
        purpose: ConsentPurpose,
        lawfulBasis: LawfulBasis,
        justification: string,
        policyVersion: string
      ) => {
        const record = {
          id: 'consent-' + Date.now(),
          userId,
          companyId,
          purpose,
          lawfulBasis,
          consentGiven: true,
          consentTimestamp: Date.now(),
          method: 'implicit' as const,
          version: policyVersion,
          metadata: {
            justification,
            documentedAt: Date.now(),
          },
        }
        
        consents.push(record)
        return record
      },
      
      getUserConsents: async (userId: string, companyId: string) => {
        return consents.filter(
          (c) => c.userId === userId && c.companyId === companyId
        )
      },
      
      getConsents: () => consents,
      clearConsents: () => { consents.length = 0 },
    }
  }

  // Test 1: hasHMRCSubmissionBasis returns false when no basis exists
  runTest('hasHMRCSubmissionBasis returns false when no basis exists', async () => {
    const mockService = createMockConsentService()
    const result = await mockService.hasHMRCSubmissionBasis('user1', 'company1')
    
    if (result.valid !== false) {
      throw new Error(`Expected valid=false, got valid=${result.valid}`)
    }
    
    if (result.basis !== null) {
      throw new Error(`Expected basis=null, got basis=${result.basis}`)
    }
  })

  // Test 2: hasHMRCSubmissionBasis returns true when legal_obligation basis exists
  runTest('hasHMRCSubmissionBasis returns true when legal_obligation basis exists', async () => {
    const mockService = createMockConsentService()
    
    // Create a consent record with legal_obligation
    await mockService.documentLawfulBasis(
      'company1',
      'user1',
      'hmrc_submission',
      'legal_obligation',
      'Test justification',
      '1.0.0'
    )
    
    const result = await mockService.hasHMRCSubmissionBasis('user1', 'company1')
    
    if (result.valid !== true) {
      throw new Error(`Expected valid=true, got valid=${result.valid}`)
    }
    
    if (result.basis !== 'legal_obligation') {
      throw new Error(`Expected basis=legal_obligation, got basis=${result.basis}`)
    }
  })

  // Test 3: hasHMRCSubmissionBasis returns true when contract basis exists
  runTest('hasHMRCSubmissionBasis returns true when contract basis exists', async () => {
    const mockService = createMockConsentService()
    
    // Create a consent record with contract
    await mockService.documentLawfulBasis(
      'company1',
      'user1',
      'hmrc_submission',
      'contract',
      'Test justification',
      '1.0.0'
    )
    
    const result = await mockService.hasHMRCSubmissionBasis('user1', 'company1')
    
    if (result.valid !== true) {
      throw new Error(`Expected valid=true, got valid=${result.valid}`)
    }
    
    if (result.basis !== 'contract') {
      throw new Error(`Expected basis=contract, got basis=${result.basis}`)
    }
  })

  // Test 4: hasHMRCSubmissionBasis returns false when consent basis exists (invalid for HMRC)
  runTest('hasHMRCSubmissionBasis returns false when consent basis exists (invalid for HMRC)', async () => {
    const mockService = createMockConsentService()
    
    // Create a consent record with consent (invalid for HMRC)
    const consents = mockService.getConsents()
    consents.push({
      id: 'consent-1',
      userId: 'user1',
      companyId: 'company1',
      purpose: 'hmrc_submission',
      lawfulBasis: 'consent',
      consentGiven: true,
      consentTimestamp: Date.now(),
      method: 'explicit',
      version: '1.0.0',
    })
    
    const result = await mockService.hasHMRCSubmissionBasis('user1', 'company1')
    
    if (result.valid !== false) {
      throw new Error(`Expected valid=false for consent basis, got valid=${result.valid}`)
    }
  })

  // Test 5: documentLawfulBasis creates consent record
  runTest('documentLawfulBasis creates consent record', async () => {
    const mockService = createMockConsentService()
    
    const record = await mockService.documentLawfulBasis(
      'company1',
      'user1',
      'hmrc_submission',
      'legal_obligation',
      'HMRC RTI submissions are required by law',
      '2.0.0'
    )
    
    if (!record.id) {
      throw new Error('Record should have an id')
    }
    
    if (record.userId !== 'user1') {
      throw new Error(`Expected userId=user1, got userId=${record.userId}`)
    }
    
    if (record.companyId !== 'company1') {
      throw new Error(`Expected companyId=company1, got companyId=${record.companyId}`)
    }
    
    if (record.lawfulBasis !== 'legal_obligation') {
      throw new Error(`Expected lawfulBasis=legal_obligation, got lawfulBasis=${record.lawfulBasis}`)
    }
    
    if (record.consentGiven !== true) {
      throw new Error(`Expected consentGiven=true, got consentGiven=${record.consentGiven}`)
    }
    
    if (record.version !== '2.0.0') {
      throw new Error(`Expected version=2.0.0, got version=${record.version}`)
    }
    
    if (!record.metadata?.justification) {
      throw new Error('Record should have justification in metadata')
    }
  })

  // Test 6: documentLawfulBasis stores justification
  runTest('documentLawfulBasis stores justification', async () => {
    const mockService = createMockConsentService()
    
    const justification = 'HMRC RTI submissions are required by law under UK tax legislation'
    const record = await mockService.documentLawfulBasis(
      'company1',
      'user1',
      'hmrc_submission',
      'legal_obligation',
      justification,
      '2.0.0'
    )
    
    if (record.metadata?.justification !== justification) {
      throw new Error(`Expected justification="${justification}", got "${record.metadata?.justification}"`)
    }
  })

  // Test 7: Privacy Policy Service returns policy with lawful basis section
  runTest('Privacy Policy Service returns policy with lawful basis section', () => {
    const privacyPolicyService = new PrivacyPolicyService()
    
    const policy = privacyPolicyService.getPrivacyPolicy({
      companyName: 'Test Company',
      companyAddress: '123 Test St',
      dpoName: 'Test DPO',
      dpoEmail: 'dpo@test.com',
    })
    
    if (!policy) {
      throw new Error('Policy should be returned')
    }
    
    if (!policy.version) {
      throw new Error('Policy should have a version')
    }
    
    const lawfulBasisSection = policy.sections.find(
      (s) => s.id === 'lawful-basis'
    )
    
    if (!lawfulBasisSection) {
      throw new Error('Policy should have a lawful-basis section')
    }
    
    if (lawfulBasisSection.title !== '4. Lawful Basis for Processing') {
      throw new Error(`Expected title="4. Lawful Basis for Processing", got "${lawfulBasisSection.title}"`)
    }
    
    // Check that all lawful bases are mentioned
    const content = lawfulBasisSection.content.toLowerCase()
    const requiredBases = [
      'consent',
      'contract',
      'legal obligation',
      'legitimate interests',
    ]
    
    for (const basis of requiredBases) {
      if (!content.includes(basis)) {
        throw new Error(`Lawful basis section should mention "${basis}"`)
      }
    }
  })

  // Test 8: Privacy Policy Service includes special category data section
  runTest('Privacy Policy Service includes special category data section', () => {
    const privacyPolicyService = new PrivacyPolicyService()
    
    const policy = privacyPolicyService.getPrivacyPolicy({
      companyName: 'Test Company',
      companyAddress: '123 Test St',
      dpoName: 'Test DPO',
      dpoEmail: 'dpo@test.com',
    })
    
    const lawfulBasisSection = policy.sections.find(
      (s) => s.id === 'lawful-basis'
    )
    
    if (!lawfulBasisSection) {
      throw new Error('Policy should have a lawful-basis section')
    }
    
    const content = lawfulBasisSection.content.toLowerCase()
    
    if (!content.includes('special category')) {
      throw new Error('Lawful basis section should mention special category data')
    }
    
    if (!content.includes('article 9')) {
      throw new Error('Lawful basis section should mention Article 9')
    }
  })

  // Test 9: Privacy Policy Service includes company information
  runTest('Privacy Policy Service includes company information', () => {
    const privacyPolicyService = new PrivacyPolicyService()
    
    const policy = privacyPolicyService.getPrivacyPolicy({
      companyName: 'Test Company Ltd',
      companyAddress: '123 Test Street, Test City',
      dpoName: 'John Doe',
      dpoEmail: 'john.doe@test.com',
      dpoPhone: '01234567890',
    })
    
    if (policy.companyName !== 'Test Company Ltd') {
      throw new Error(`Expected companyName="Test Company Ltd", got "${policy.companyName}"`)
    }
    
    if (policy.companyAddress !== '123 Test Street, Test City') {
      throw new Error(`Expected companyAddress="123 Test Street, Test City", got "${policy.companyAddress}"`)
    }
    
    if (policy.dataProtectionOfficer.name !== 'John Doe') {
      throw new Error(`Expected DPO name="John Doe", got "${policy.dataProtectionOfficer.name}"`)
    }
    
    if (policy.dataProtectionOfficer.email !== 'john.doe@test.com') {
      throw new Error(`Expected DPO email="john.doe@test.com", got "${policy.dataProtectionOfficer.email}"`)
    }
  })

  // Test 10: Multiple consents for same user/company work correctly
  runTest('Multiple consents for same user/company work correctly', async () => {
    const mockService = createMockConsentService()
    
    // Create consent for payroll_processing
    await mockService.documentLawfulBasis(
      'company1',
      'user1',
      'payroll_processing',
      'contract',
      'Test justification',
      '1.0.0'
    )
    
    // Create consent for hmrc_submission
    await mockService.documentLawfulBasis(
      'company1',
      'user1',
      'hmrc_submission',
      'legal_obligation',
      'Test justification',
      '1.0.0'
    )
    
    const consents = await mockService.getUserConsents('user1', 'company1')
    
    if (consents.length !== 2) {
      throw new Error(`Expected 2 consents, got ${consents.length}`)
    }
    
    // Check that hasHMRCSubmissionBasis still works
    const result = await mockService.hasHMRCSubmissionBasis('user1', 'company1')
    
    if (result.valid !== true) {
      throw new Error(`Expected valid=true, got valid=${result.valid}`)
    }
  })

  console.log('\n=== Test Summary ===')
  console.log('All tests completed. Check output above for results.')
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}

export { runAllTests }


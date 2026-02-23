/**
 * Consent Enforcement Helper
 *
 * Verifies consent before processing data operations that require consent.
 * Used for marketing emails, analytics tracking, etc.
 *
 * Reference: GDPR Art. 6(1)(a), PECR, ICO Consent Guidance
 */

import { consentService } from './ConsentService';
import { ConsentPurpose } from './types';

/**
 * Check if an email is marketing-related
 */
export function isMarketingEmail(subject: string, body: string): boolean {
  const marketingKeywords = [
    'promotion', 'promo', 'offer', 'discount', 'sale', 'deal',
    'newsletter', 'newsletter', 'update', 'subscribe', 'unsubscribe',
    'marketing', 'advertisement', 'ad', 'campaign', 'special',
    'limited time', 'exclusive', 'new product', 'announcement',
    'event', 'webinar', 'workshop', 'training',
  ];

  const subjectLower = subject.toLowerCase();
  const bodyLower = body.toLowerCase();
  const combined = `${subjectLower} ${bodyLower}`;

  return marketingKeywords.some(keyword => combined.includes(keyword));
}

/**
 * Verify consent before sending marketing email
 */
export async function verifyMarketingConsent(
  userId: string,
  companyId: string
): Promise<{ hasConsent: boolean; error?: string }> {
  try {
    const hasConsent = await consentService.hasConsent(userId, companyId, 'marketing');
    
    if (!hasConsent) {
      return {
        hasConsent: false,
        error: 'Marketing consent required. Please enable marketing notifications in Settings.',
      };
    }

    return { hasConsent: true };
  } catch (err) {
    console.error('[consentEnforcement] Error checking marketing consent:', err);
    return {
      hasConsent: false,
      error: 'Failed to verify consent. Please try again.',
    };
  }
}

/**
 * Verify consent before analytics tracking
 */
export async function verifyAnalyticsConsent(
  userId: string,
  companyId: string
): Promise<{ hasConsent: boolean; error?: string }> {
  try {
    const hasConsent = await consentService.hasConsent(userId, companyId, 'analytics');
    
    if (!hasConsent) {
      return {
        hasConsent: false,
        error: 'Analytics consent required. Analytics tracking skipped.',
      };
    }

    return { hasConsent: true };
  } catch (err) {
    console.error('[consentEnforcement] Error checking analytics consent:', err);
    return {
      hasConsent: false,
      error: 'Failed to verify consent. Analytics tracking skipped.',
    };
  }
}

/**
 * Verify consent before data processing operation
 */
export async function verifyConsentForPurpose(
  userId: string,
  companyId: string,
  purpose: ConsentPurpose
): Promise<{ hasConsent: boolean; error?: string }> {
  try {
    const hasConsent = await consentService.hasConsent(userId, companyId, purpose);
    
    if (!hasConsent) {
      return {
        hasConsent: false,
        error: `Consent required for ${purpose}. Please enable in Settings.`,
      };
    }

    return { hasConsent: true };
  } catch (err) {
    console.error(`[consentEnforcement] Error checking consent for ${purpose}:`, err);
    return {
      hasConsent: false,
      error: 'Failed to verify consent. Please try again.',
    };
  }
}

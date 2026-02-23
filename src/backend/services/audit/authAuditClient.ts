/**
 * Auth Audit Client – logs auth events to Cloud Functions
 * ISO 27001 A.12, SOC 2 CC7
 */

import { functionsApp, httpsCallable } from '../Firebase';
import { APP_KEYS } from '../../../config/keys';

const projectId = APP_KEYS?.firebase?.projectId;
const region = 'us-central1';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return local.charAt(0) + '***@' + domain.charAt(0) + '***';
}

/**
 * Log login_success or logout (user must be authenticated)
 */
export async function logAuthEvent(action: 'login_success' | 'logout'): Promise<void> {
  if (!projectId) return;
  try {
    const fn = httpsCallable(functionsApp, 'logAuthEvent');
    await fn({ action });
  } catch (err) {
    console.warn('[AuthAudit] Failed to log', action, err);
  }
}

/**
 * Get auth events (super-admin only)
 * Requires custom claim auth.token.superAdmin === true
 */
export async function getAuthEvents(params?: {
  limit?: number;
  action?: 'login_success' | 'login_failure' | 'logout';
  startAt?: number;
  endAt?: number;
}): Promise<{ events: Array<Record<string, unknown>>; count: number }> {
  const fn = httpsCallable(functionsApp, 'getAuthEvents');
  const res = await fn(params || {});
  return (res.data as { events: Array<Record<string, unknown>>; count: number }) || { events: [], count: 0 };
}

/**
 * Log login_failure (no auth required – HTTP endpoint)
 */
export async function logLoginFailure(email: string, errorCode?: string): Promise<void> {
  if (!projectId) return;
  try {
    const url = `https://${region}-${projectId}.cloudfunctions.net/logAuthEventPublic`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login_failure',
        emailMasked: maskEmail(email),
        errorCode: errorCode?.substring(0, 50) || 'unknown',
      }),
    });
  } catch (err) {
    console.warn('[AuthAudit] Failed to log login_failure', err);
  }
}

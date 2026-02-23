/**
 * Auth Event Logging (ISO 27001 A.12, SOC 2 CC7)
 *
 * Writes to authEvents/{logId} - super-admin only access, not in frontend.
 * Retention: 12 months.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { db } from './admin';

const AUTH_EVENTS_RETENTION_DAYS = 365; // 12 months

type AuthEventAction = 'login_success' | 'login_failure' | 'logout';

interface AuthEventPayload {
  action: AuthEventAction;
  /** Masked email for login_failure (e.g. a***@b.com) */
  emailMasked?: string;
  /** Firebase error code for login_failure */
  errorCode?: string;
}

/**
 * Mask email for privacy (e.g. user@example.com -> u***@e***.com)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const maskedLocal = local.charAt(0) + '***';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0]?.charAt(0) + '***.' + (domainParts.slice(1).join('.') || '');
  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * logAuthEvent - Callable (for login_success, logout when user is authenticated)
 */
export const logAuthEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const data = request.data as AuthEventPayload;
  if (!data?.action || !['login_success', 'logout'].includes(data.action)) {
    throw new HttpsError('invalid-argument', 'Invalid action for authenticated log');
  }

  const uid = request.auth.uid;
  const email = (request.auth.token?.email as string) || undefined;
  const now = Date.now();
  const expiresAt = now + AUTH_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const entry = {
    action: data.action,
    userId: uid,
    userEmailMasked: email ? maskEmail(email) : undefined,
    timestamp: now,
    userAgent: typeof request.rawRequest?.headers?.['user-agent'] === 'string'
      ? request.rawRequest.headers['user-agent'].substring(0, 200) : undefined,
    retentionDays: AUTH_EVENTS_RETENTION_DAYS,
    expiresAt,
  };

  const ref = db.ref('authEvents').push();
  await ref.set(entry);

  return { success: true, id: ref.key };
});

/**
 * logAuthEventPublic - HTTP (for login_failure when user is NOT authenticated)
 */
export const logAuthEventPublic = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body as AuthEventPayload;
    if (!body?.action || body.action !== 'login_failure') {
      res.status(400).json({ error: 'Invalid payload: action must be login_failure' });
      return;
    }

    const now = Date.now();
    const expiresAt = now + AUTH_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    const entry = {
      action: 'login_failure',
      userId: null,
      userEmailMasked: body.emailMasked || '***',
      errorCode: typeof body.errorCode === 'string' ? body.errorCode.substring(0, 50) : undefined,
      timestamp: now,
      userAgent: typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent'].substring(0, 200) : undefined,
      retentionDays: AUTH_EVENTS_RETENTION_DAYS,
      expiresAt,
    };

    const ref = db.ref('authEvents').push();
    await ref.set(entry);

    res.status(200).json({ success: true, id: ref.key });
  } catch (error) {
    console.error('[logAuthEventPublic] Error:', error);
    res.status(500).json({ error: 'Failed to log auth event' });
  }
});

/**
 * Server-side audit logger for Cloud Functions
 * Writes to auditLogs/{companyId} - Admin SDK bypasses rules
 * ISO 27001 A.12, SOC 2 CC7
 */

import * as admin from 'firebase-admin';

const db = admin.database();

const SENSITIVE_ACCESS_RETENTION_DAYS = 24 * 30; // 24 months

/**
 * Log sensitive data access (secure callable invocation)
 */
export async function logSensitiveAccess(
  userId: string,
  companyId: string,
  domain: string,
  actions: string[],
  role: string
): Promise<void> {
  try {
    const ref = db.ref(`auditLogs/${companyId}`).push();
    const now = Date.now();
    const expiresAt = now + SENSITIVE_ACCESS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    await ref.set({
      id: ref.key,
      timestamp: now,
      action: 'data_view',
      userId,
      companyId,
      resourceType: 'secure_callable',
      resourceName: domain,
      description: `Secure access: ${domain} (role: ${role})`,
      metadata: { domain, actions: actions.join(','), role },
      success: true,
      retentionPeriod: SENSITIVE_ACCESS_RETENTION_DAYS,
      expiresAt,
    });
  } catch (err) {
    console.warn('[AuditLogger] Failed to log sensitive access:', err);
  }
}

/**
 * Log MFA rejection (security event)
 */
export async function logMfaRejection(
  userId: string,
  companyId: string,
  domain: string,
  role: string,
  actions: string[]
): Promise<void> {
  try {
    const ref = db.ref(`auditLogs/${companyId}`).push();
    const now = Date.now();
    const expiresAt = now + SENSITIVE_ACCESS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    await ref.set({
      id: ref.key,
      timestamp: now,
      action: 'login_failure',
      userId,
      companyId,
      resourceType: 'secure_callable_mfa_rejected',
      resourceName: domain,
      description: `MFA required but not satisfied: ${domain} (role: ${role})`,
      metadata: { domain, actions: actions.join(','), role },
      success: false,
      errorCode: 'mfa_required',
      retentionPeriod: SENSITIVE_ACCESS_RETENTION_DAYS,
      expiresAt,
    });
  } catch (err) {
    console.warn('[AuditLogger] Failed to log MFA rejection:', err);
  }
}

/**
 * Secure Request Guard
 *
 * Centralized authorization wrapper for all secure Functions.
 * ENFORCES: verifyAuth → verifyCompanyAccess → verifyRole → THEN handler (read + decrypt)
 *
 * Handlers MUST NOT load secrets directly; only withSecureGuard provides keys.
 * Handlers MUST NOT call decrypt before this guard completes all checks.
 *
 * Naming: All Functions that decrypt MUST end with "Secure"
 */

import { HttpsError, onCall, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { logSensitiveAccess, logMfaRejection } from '../utils/auditLogger';

type EncryptionKeySecret = ReturnType<typeof defineSecret>;

const db = admin.database();

/**
 * Authoritative role catalogue for secure Functions.
 *
 * NOTE:
 * - Keep this aligned with ENGINEERING_CONTROLS_VERIFICATION.md and product docs.
 * - Roles are stored at users/{uid}/companies/{companyId}/role.
 */
export type Role =
  | 'owner'
  | 'admin'
  | 'administration' // legacy alias, treated same as admin
  | 'payroll_admin'
  | 'finance_admin'
  | 'manager'
  | 'staff'
  | 'support'        // help-desk role, limited scope
  | 'support_limited';

/**
 * High‑level permission map (human‑readable for audits).
 * Enforcement still happens via requiredRoles/requiredActions in guard options.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: [
    '*', // Full access
  ],
  admin: [
    'hr:*',
    'finance:*',
    'payroll:*',
    'settings:*',
    'company:*',
  ],
  administration: [
    'hr:*',
    'finance:*',
    'payroll:*',
    'settings:*',
    'company:*',
  ],
  payroll_admin: [
    'payroll:read',
    'payroll:write',
    'payroll:submit_hmrc',
  ],
  finance_admin: [
    'finance:read',
    'finance:write',
    'finance:bank_change',
    'payroll:totals_read',
  ],
  manager: [
    'hr:team_read',
    'hr:team_limited_write',
  ],
  staff: [
    'self:profile_read',
    'self:profile_write',
    'self:payslips_read',
  ],
  support: [
    'support:read_config',
    'support:read_limited_hr',
    'support:resend_invite',
    'support:reset_mfa',
    'support:unlock_account',
  ],
  support_limited: [
    'support:read_config',
    'support:read_limited_hr',
    'support:resend_invite',
    'support:reset_mfa',
    'support:unlock_account',
  ],
};

/** Roles that MUST always use MFA when accessing secure Functions. */
export const MFA_ROLES: Role[] = [
  'owner',
  'admin',
  'payroll_admin',
  'finance_admin',
  'support_limited',
];

/**
 * Actions that require MFA regardless of role.
 * These are attached via SecureGuardOptions.requiredActions.
 */
export const MFA_REQUIRED_ACTIONS = new Set<string>([
  'finance:bank_change',
  'payroll:submit_hmrc',
  'payroll:view_full',
  'payroll:list',
  'hr:sensitive_update', // e.g. tax code, NI
  'admin:role_change',
  'support:assume_company',
]);

export interface SecureGuardOptions {
  /** Required roles (user must have at least one) - from users/{uid}/companies/{companyId}/role */
  requiredRoles: readonly (Role | string)[];
  /** Optional high‑level actions this handler performs (used for MFA policy checks) */
  requiredActions?: string[];
  /** Path in data object containing the base path (e.g. hrWritePath) - used to extract companyId */
  pathParamKey?: string;
  /** Alternative: direct companyId key in data */
  companyIdKey?: string;
  /** Domain name for logging (e.g. 'HR', 'PAYROLL', 'FINANCE') */
  domain: string;
}

export type SecureHandler<TData, TResult> = (
  data: TData,
  context: CallableRequest,
  encryptionKey: string
) => Promise<TResult>;

/**
 * Extract companyId from path or data
 * Path format: companies/{companyId}/sites/... or companies/{companyId}/data/...
 */
function extractCompanyId(data: Record<string, unknown>, options: SecureGuardOptions): string | null {
  if (options.companyIdKey && data[options.companyIdKey]) {
    return String(data[options.companyIdKey]);
  }
  const pathParam = options.pathParamKey ? data[options.pathParamKey] : null;
  if (typeof pathParam === 'string') {
    const match = pathParam.match(/companies\/([^/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Verify user has access to company (exists in users/{uid}/companies/{companyId})
 */
async function verifyCompanyAccess(uid: string, companyId: string): Promise<boolean> {
  const ref = db.ref(`users/${uid}/companies/${companyId}`);
  const snapshot = await ref.once('value');
  return snapshot.exists();
}

/**
 * Get user role for company
 */
async function getUserRole(uid: string, companyId: string): Promise<Role | null> {
  const ref = db.ref(`users/${uid}/companies/${companyId}/role`);
  const snapshot = await ref.once('value');
  const role = snapshot.val() as string | null;
  if (!role) return null;
  // Treat unknown roles as null – fail closed
  if (!['owner', 'admin', 'payroll_admin', 'finance_admin', 'manager', 'staff', 'support', 'support_limited'].includes(role)) {
    return null;
  }
  return role as Role;
}

/**
 * Determine whether the current auth token represents an MFA‑verified session.
 *
 * We intentionally support multiple signals so projects can evolve without code changes:
 * - Native Firebase multi‑factor: token.firebase.sign_in_second_factor
 * - Custom claims: token.mfa === true or token.mfa_enrolled === true
 */
function hasMfaFromToken(token: Record<string, unknown>): boolean {
  const firebaseInfo = (token['firebase'] || {}) as Record<string, unknown>;
  if (firebaseInfo['sign_in_second_factor']) return true;
  if (token['mfa'] === true || token['mfa_enrolled'] === true) return true;
  return false;
}

/**
 * withSecureGuard - Wraps a callable handler to enforce authorization before handler runs
 *
 * Order: 1) Auth 2) Company access 3) Role 4) Handler (which may read + decrypt)
 *
 * Handlers must NEVER load secrets directly; only this guard provides the encryption key.
 *
 * @param encryptionKeySecret - SecretParam for domain encryption key
 * @param handler - Handler that receives (data, context, encryptionKey)
 * @param options - Guard options (requiredRoles, pathParamKey, domain)
 */
export function withSecureGuard<TData extends Record<string, unknown>, TResult>(
  encryptionKeySecret: EncryptionKeySecret,
  handler: SecureHandler<TData, TResult>,
  options: SecureGuardOptions
) {
  return onCall(
    {
      secrets: [encryptionKeySecret],
      enforceAppCheck: false, // Set true in production if App Check is configured
    },
    async (request: CallableRequest): Promise<TResult> => {
      // 1. Verify Auth
      if (!request.auth) {
        console.warn(`[${options.domain}] Unauthenticated request attempted`);
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      const uid = request.auth.uid;
      const data = request.data as TData;

      if (!data || typeof data !== 'object') {
        throw new HttpsError('invalid-argument', 'Invalid request data');
      }

      // 2. Extract and verify company access
      const companyId = extractCompanyId(data as Record<string, unknown>, options);
      if (!companyId) {
        console.warn(`[${options.domain}] No companyId in request for user ${uid}`);
        throw new HttpsError('invalid-argument', 'Company context required');
      }

      const hasAccess = await verifyCompanyAccess(uid, companyId);
      if (!hasAccess) {
        console.warn(`[${options.domain}] User ${uid} lacks access to company ${companyId}`);
        throw new HttpsError('permission-denied', 'Access denied to this company');
      }

      // 3. Verify role
      const role = await getUserRole(uid, companyId);
      if (!role || !options.requiredRoles.includes(role)) {
        console.warn(
          `[${options.domain}] User ${uid} lacks required role for company ${companyId} (role: ${role || 'none'})`
        );
        throw new HttpsError('permission-denied', 'Insufficient permissions');
      }

      // 4. Enforce MFA policy (fail closed for privileged roles/actions)
      const token = request.auth.token as unknown as Record<string, unknown>;
      const actions = options.requiredActions ?? [];
      const needsMfaByRole = MFA_ROLES.includes(role);
      const needsMfaByAction = actions.some((a) => MFA_REQUIRED_ACTIONS.has(a));

      if ((needsMfaByRole || needsMfaByAction) && !hasMfaFromToken(token)) {
        console.warn(
          `[${options.domain}] MFA required but not satisfied for user ${uid} (role: ${role}, actions: ${actions.join(
            ','
          ) || 'none'})`
        );
        logMfaRejection(uid, companyId, options.domain, role, actions).catch(() => {});
        throw new HttpsError('permission-denied', 'Multi-factor authentication required');
      }

      // 5. Load encryption key (only the guard loads secrets - handlers never load directly)
      const encryptionKey = encryptionKeySecret.value();
      if (!encryptionKey || encryptionKey.length < 32) {
        console.error(`[${options.domain}] Encryption key not configured or invalid`);
        throw new HttpsError('failed-precondition', 'Service configuration error');
      }

      // 6. Log access (no plaintext, no ciphertext, no keys)
      console.log(
        `[${options.domain}] User ${uid} (role: ${role}) accessed company ${companyId} actions=[${actions.join(',')}]`
      );

      // 6b. Audit: log sensitive access (ISO 27001 A.12, SOC 2 CC7)
      logSensitiveAccess(uid, companyId, options.domain, actions, role).catch(() => {});

      // 7. Run handler - decrypt happens INSIDE handler, AFTER all checks
      return handler(data, request, encryptionKey);
    }
  );
}

/** Options for user-scoped data (e.g. personal settings) - user can only access own data */
export interface UserScopedGuardOptions {
  domain: string;
  /** Key in data containing the user ID (must match auth.uid) */
  uidParamKey?: string;
}

/**
 * withUserScopedGuard - For user personal data (e.g. settings/personal)
 * Verifies auth.uid === data.uid - user can ONLY access their own data
 */
export function withUserScopedGuard<TData extends Record<string, unknown>, TResult>(
  encryptionKeySecret: EncryptionKeySecret,
  handler: SecureHandler<TData, TResult>,
  options: UserScopedGuardOptions
) {
  return onCall(
    { secrets: [encryptionKeySecret], enforceAppCheck: false },
    async (request: CallableRequest): Promise<TResult> => {
      if (!request.auth) {
        console.warn(`[${options.domain}] Unauthenticated request`);
        throw new HttpsError('unauthenticated', 'Authentication required');
      }

      const uid = request.auth.uid;
      const data = request.data as TData;

      if (!data || typeof data !== 'object') {
        throw new HttpsError('invalid-argument', 'Invalid request data');
      }

      const dataUid = options.uidParamKey ? (data as Record<string, unknown>)[options.uidParamKey] : (data as Record<string, unknown>).uid;
      if (String(dataUid) !== uid) {
        console.warn(`[${options.domain}] User ${uid} attempted to access data for ${dataUid}`);
        throw new HttpsError('permission-denied', 'Access denied');
      }

      const encryptionKey = encryptionKeySecret.value();
      if (!encryptionKey || encryptionKey.length < 32) {
        console.error(`[${options.domain}] Encryption key not configured`);
        throw new HttpsError('failed-precondition', 'Service configuration error');
      }

      console.log(`[${options.domain}] User ${uid} accessed own data`);
      return handler(data, request, encryptionKey);
    }
  );
}

"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withUserScopedGuard = exports.withSecureGuard = exports.MFA_REQUIRED_ACTIONS = exports.MFA_ROLES = exports.ROLE_PERMISSIONS = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const auditLogger_1 = require("../utils/auditLogger");
const db = admin.database();
/**
 * High‑level permission map (human‑readable for audits).
 * Enforcement still happens via requiredRoles/requiredActions in guard options.
 */
exports.ROLE_PERMISSIONS = {
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
exports.MFA_ROLES = [
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
exports.MFA_REQUIRED_ACTIONS = new Set([
    'finance:bank_change',
    'payroll:submit_hmrc',
    'payroll:view_full',
    'payroll:list',
    'hr:sensitive_update',
    'admin:role_change',
    'support:assume_company',
]);
/**
 * Extract companyId from path or data
 * Path format: companies/{companyId}/sites/... or companies/{companyId}/data/...
 */
function extractCompanyId(data, options) {
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
async function verifyCompanyAccess(uid, companyId) {
    const ref = db.ref(`users/${uid}/companies/${companyId}`);
    const snapshot = await ref.once('value');
    return snapshot.exists();
}
/**
 * Get user role for company
 */
async function getUserRole(uid, companyId) {
    const ref = db.ref(`users/${uid}/companies/${companyId}/role`);
    const snapshot = await ref.once('value');
    const role = snapshot.val();
    if (!role)
        return null;
    // Treat unknown roles as null – fail closed
    if (!['owner', 'admin', 'payroll_admin', 'finance_admin', 'manager', 'staff', 'support', 'support_limited'].includes(role)) {
        return null;
    }
    return role;
}
/**
 * Determine whether the current auth token represents an MFA‑verified session.
 *
 * We intentionally support multiple signals so projects can evolve without code changes:
 * - Native Firebase multi‑factor: token.firebase.sign_in_second_factor
 * - Custom claims: token.mfa === true or token.mfa_enrolled === true
 */
function hasMfaFromToken(token) {
    const firebaseInfo = (token['firebase'] || {});
    if (firebaseInfo['sign_in_second_factor'])
        return true;
    if (token['mfa'] === true || token['mfa_enrolled'] === true)
        return true;
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
function withSecureGuard(encryptionKeySecret, handler, options) {
    return (0, https_1.onCall)({
        secrets: [encryptionKeySecret],
        enforceAppCheck: false, // Set true in production if App Check is configured
    }, async (request) => {
        var _a;
        // 1. Verify Auth
        if (!request.auth) {
            console.warn(`[${options.domain}] Unauthenticated request attempted`);
            throw new https_1.HttpsError('unauthenticated', 'Authentication required');
        }
        const uid = request.auth.uid;
        const data = request.data;
        if (!data || typeof data !== 'object') {
            throw new https_1.HttpsError('invalid-argument', 'Invalid request data');
        }
        // 2. Extract and verify company access
        const companyId = extractCompanyId(data, options);
        if (!companyId) {
            console.warn(`[${options.domain}] No companyId in request for user ${uid}`);
            throw new https_1.HttpsError('invalid-argument', 'Company context required');
        }
        const hasAccess = await verifyCompanyAccess(uid, companyId);
        if (!hasAccess) {
            console.warn(`[${options.domain}] User ${uid} lacks access to company ${companyId}`);
            throw new https_1.HttpsError('permission-denied', 'Access denied to this company');
        }
        // 3. Verify role
        const role = await getUserRole(uid, companyId);
        if (!role || !options.requiredRoles.includes(role)) {
            console.warn(`[${options.domain}] User ${uid} lacks required role for company ${companyId} (role: ${role || 'none'})`);
            throw new https_1.HttpsError('permission-denied', 'Insufficient permissions');
        }
        // 4. Enforce MFA policy (fail closed for privileged roles/actions)
        const token = request.auth.token;
        const actions = (_a = options.requiredActions) !== null && _a !== void 0 ? _a : [];
        const needsMfaByRole = exports.MFA_ROLES.includes(role);
        const needsMfaByAction = actions.some((a) => exports.MFA_REQUIRED_ACTIONS.has(a));
        if ((needsMfaByRole || needsMfaByAction) && !hasMfaFromToken(token)) {
            console.warn(`[${options.domain}] MFA required but not satisfied for user ${uid} (role: ${role}, actions: ${actions.join(',') || 'none'})`);
            (0, auditLogger_1.logMfaRejection)(uid, companyId, options.domain, role, actions).catch(() => { });
            throw new https_1.HttpsError('permission-denied', 'Multi-factor authentication required');
        }
        // 5. Load encryption key (only the guard loads secrets - handlers never load directly)
        const encryptionKey = encryptionKeySecret.value();
        if (!encryptionKey || encryptionKey.length < 32) {
            console.error(`[${options.domain}] Encryption key not configured or invalid`);
            throw new https_1.HttpsError('failed-precondition', 'Service configuration error');
        }
        // 6. Log access (no plaintext, no ciphertext, no keys)
        console.log(`[${options.domain}] User ${uid} (role: ${role}) accessed company ${companyId} actions=[${actions.join(',')}]`);
        // 6b. Audit: log sensitive access (ISO 27001 A.12, SOC 2 CC7)
        (0, auditLogger_1.logSensitiveAccess)(uid, companyId, options.domain, actions, role).catch(() => { });
        // 7. Run handler - decrypt happens INSIDE handler, AFTER all checks
        return handler(data, request, encryptionKey);
    });
}
exports.withSecureGuard = withSecureGuard;
/**
 * withUserScopedGuard - For user personal data (e.g. settings/personal)
 * Verifies auth.uid === data.uid - user can ONLY access their own data
 */
function withUserScopedGuard(encryptionKeySecret, handler, options) {
    return (0, https_1.onCall)({ secrets: [encryptionKeySecret], enforceAppCheck: false }, async (request) => {
        if (!request.auth) {
            console.warn(`[${options.domain}] Unauthenticated request`);
            throw new https_1.HttpsError('unauthenticated', 'Authentication required');
        }
        const uid = request.auth.uid;
        const data = request.data;
        if (!data || typeof data !== 'object') {
            throw new https_1.HttpsError('invalid-argument', 'Invalid request data');
        }
        const dataUid = options.uidParamKey ? data[options.uidParamKey] : data.uid;
        if (String(dataUid) !== uid) {
            console.warn(`[${options.domain}] User ${uid} attempted to access data for ${dataUid}`);
            throw new https_1.HttpsError('permission-denied', 'Access denied');
        }
        const encryptionKey = encryptionKeySecret.value();
        if (!encryptionKey || encryptionKey.length < 32) {
            console.error(`[${options.domain}] Encryption key not configured`);
            throw new https_1.HttpsError('failed-precondition', 'Service configuration error');
        }
        console.log(`[${options.domain}] User ${uid} accessed own data`);
        return handler(data, request, encryptionKey);
    });
}
exports.withUserScopedGuard = withUserScopedGuard;
//# sourceMappingURL=secureRequestGuard.js.map
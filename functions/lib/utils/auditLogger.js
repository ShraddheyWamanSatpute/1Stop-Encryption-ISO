"use strict";
/**
 * Server-side audit logger for Cloud Functions
 * Writes to auditLogs/{companyId} - Admin SDK bypasses rules
 * ISO 27001 A.12, SOC 2 CC7
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
exports.logMfaRejection = exports.logSensitiveAccess = void 0;
const admin = __importStar(require("firebase-admin"));
const db = admin.database();
const SENSITIVE_ACCESS_RETENTION_DAYS = 24 * 30; // 24 months
/**
 * Log sensitive data access (secure callable invocation)
 */
async function logSensitiveAccess(userId, companyId, domain, actions, role) {
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
    }
    catch (err) {
        console.warn('[AuditLogger] Failed to log sensitive access:', err);
    }
}
exports.logSensitiveAccess = logSensitiveAccess;
/**
 * Log MFA rejection (security event)
 */
async function logMfaRejection(userId, companyId, domain, role, actions) {
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
    }
    catch (err) {
        console.warn('[AuditLogger] Failed to log MFA rejection:', err);
    }
}
exports.logMfaRejection = logMfaRejection;
//# sourceMappingURL=auditLogger.js.map
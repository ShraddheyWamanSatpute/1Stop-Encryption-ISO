"use strict";
/**
 * Payroll Secure Functions
 *
 * Server-side encryption for payroll data.
 * Uses withSecureGuard - auth → company access → role → handler.
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
exports.fetchPayrollDetailSecure = exports.fetchPayrollSecure = void 0;
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const secureRequestGuard_1 = require("./guards/secureRequestGuard");
const SensitiveDataService_1 = require("./encryption/SensitiveDataService");
const db = admin.database();
const payrollEncryptionKey = (0, params_1.defineSecret)('PAYROLL_ENCRYPTION_KEY');
// Roles allowed to access payroll data
const PAYROLL_ROLES = ['owner', 'admin', 'payroll_admin', 'finance_admin', 'administration'];
exports.fetchPayrollSecure = (0, secureRequestGuard_1.withSecureGuard)(payrollEncryptionKey, async (data, _context, _encryptionKey) => {
    const { hrBasePath } = data;
    if (!hrBasePath)
        throw new Error('hrBasePath required');
    const ref = db.ref(`${hrBasePath}/payroll`);
    const snapshot = await ref.once('value');
    const val = snapshot.val();
    if (!val)
        return [];
    const items = Object.entries(val).map(([id, p]) => (Object.assign({ id }, p)));
    return items.map((p) => (0, SensitiveDataService_1.toPayrollListItem)(p));
}, {
    requiredRoles: PAYROLL_ROLES,
    requiredActions: ['payroll:list'],
    pathParamKey: 'hrBasePath',
    domain: 'PAYROLL',
});
exports.fetchPayrollDetailSecure = (0, secureRequestGuard_1.withSecureGuard)(payrollEncryptionKey, async (data, _context, encryptionKey) => {
    const { hrBasePath, payrollId } = data;
    if (!hrBasePath || !payrollId)
        throw new Error('Missing required params');
    const ref = db.ref(`${hrBasePath}/payroll/${payrollId}`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw)
        return null;
    const full = Object.assign({ id: payrollId }, raw);
    return (0, SensitiveDataService_1.decryptPayrollData)(full, encryptionKey);
}, {
    requiredRoles: PAYROLL_ROLES,
    requiredActions: ['payroll:view_full'],
    pathParamKey: 'hrBasePath',
    domain: 'PAYROLL',
});
//# sourceMappingURL=payrollSecure.js.map
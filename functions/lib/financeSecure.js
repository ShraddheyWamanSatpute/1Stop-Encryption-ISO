"use strict";
/**
 * Finance Secure Functions
 *
 * Server-side encryption for bank account data.
 * All Functions use withSecureGuard - auth → company access → role → handler.
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
exports.deleteBankAccountSecure = exports.fetchBankAccountDetailSecure = exports.fetchBankAccountsSecure = exports.updateBankAccountSecure = exports.createBankAccountSecure = void 0;
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const secureRequestGuard_1 = require("./guards/secureRequestGuard");
const SensitiveDataService_1 = require("./encryption/SensitiveDataService");
const db = admin.database();
const financeEncryptionKey = (0, params_1.defineSecret)('FINANCE_ENCRYPTION_KEY');
// Roles allowed to manage finance/bank accounts
const FINANCE_WRITE_ROLES = ['owner', 'admin', 'finance_admin', 'administration'];
const FINANCE_READ_ROLES = ['owner', 'admin', 'finance_admin', 'administration'];
exports.createBankAccountSecure = (0, secureRequestGuard_1.withSecureGuard)(financeEncryptionKey, async (data, _context, encryptionKey) => {
    const { financeBasePath, bankAccount } = data;
    if (!financeBasePath || !bankAccount)
        throw new Error('financeBasePath and bankAccount required');
    const ref = db.ref(`${financeBasePath}/bankAccounts`);
    const newRef = ref.push();
    const id = newRef.key;
    if (!id)
        throw new Error('Failed to generate ID');
    const newBA = Object.assign(Object.assign({}, bankAccount), { id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const encrypted = await (0, SensitiveDataService_1.encryptBankAccountData)(newBA, encryptionKey);
    await newRef.set(encrypted);
    return { bankAccountId: id };
}, {
    requiredRoles: FINANCE_WRITE_ROLES,
    requiredActions: ['finance:bank_change'],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
});
exports.updateBankAccountSecure = (0, secureRequestGuard_1.withSecureGuard)(financeEncryptionKey, async (data, _context, encryptionKey) => {
    const { financeBasePath, bankAccountId, updates } = data;
    if (!financeBasePath || !bankAccountId || !updates)
        throw new Error('Missing required params');
    const updateData = Object.assign(Object.assign({}, updates), { updatedAt: new Date().toISOString() });
    const encrypted = await (0, SensitiveDataService_1.encryptBankAccountData)(updateData, encryptionKey);
    const ref = db.ref(`${financeBasePath}/bankAccounts/${bankAccountId}`);
    await ref.update(encrypted);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw)
        return null;
    const full = Object.assign({ id: bankAccountId }, raw);
    return (0, SensitiveDataService_1.decryptBankAccountData)(full, encryptionKey);
}, {
    requiredRoles: FINANCE_WRITE_ROLES,
    requiredActions: ['finance:bank_change'],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
});
exports.fetchBankAccountsSecure = (0, secureRequestGuard_1.withSecureGuard)(financeEncryptionKey, async (data, _context, _encryptionKey) => {
    const { financeBasePath } = data;
    if (!financeBasePath)
        throw new Error('financeBasePath required');
    const ref = db.ref(`${financeBasePath}/bankAccounts`);
    const snapshot = await ref.once('value');
    const val = snapshot.val();
    if (!val)
        return [];
    const items = Object.entries(val).map(([id, ba]) => (Object.assign({ id }, ba)));
    return items.map((ba) => (0, SensitiveDataService_1.toBankAccountListItem)(ba));
}, {
    requiredRoles: FINANCE_READ_ROLES,
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
});
exports.fetchBankAccountDetailSecure = (0, secureRequestGuard_1.withSecureGuard)(financeEncryptionKey, async (data, _context, encryptionKey) => {
    const { financeBasePath, bankAccountId } = data;
    if (!financeBasePath || !bankAccountId)
        throw new Error('Missing required params');
    const ref = db.ref(`${financeBasePath}/bankAccounts/${bankAccountId}`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw)
        return null;
    const full = Object.assign({ id: bankAccountId }, raw);
    return (0, SensitiveDataService_1.decryptBankAccountData)(full, encryptionKey);
}, {
    requiredRoles: FINANCE_READ_ROLES,
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
});
exports.deleteBankAccountSecure = (0, secureRequestGuard_1.withSecureGuard)(financeEncryptionKey, async (data, _context, _encryptionKey) => {
    const { financeBasePath, bankAccountId } = data;
    if (!financeBasePath || !bankAccountId)
        throw new Error('Missing required params');
    const ref = db.ref(`${financeBasePath}/bankAccounts/${bankAccountId}`);
    await ref.remove();
    return { success: true };
}, {
    requiredRoles: FINANCE_WRITE_ROLES,
    requiredActions: ['finance:bank_change'],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
});
//# sourceMappingURL=financeSecure.js.map
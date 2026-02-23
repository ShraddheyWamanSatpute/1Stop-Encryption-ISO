"use strict";
/**
 * HR Secure Functions
 *
 * Server-side encryption for employee data.
 * All Functions use withSecureGuard - auth → company access → role → then handler.
 *
 * Naming: All decrypt-capable Functions end with "Secure"
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
exports.fetchEmployeeDetailSecure = exports.fetchEmployeesSecure = exports.updateEmployeeSecure = exports.createEmployeeSecure = void 0;
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const secureRequestGuard_1 = require("./guards/secureRequestGuard");
const SensitiveDataService_1 = require("./encryption/SensitiveDataService");
const db = admin.database();
// Domain-specific encryption key - only this module and guard reference it
const hrEncryptionKey = (0, params_1.defineSecret)('HR_ENCRYPTION_KEY');
// HR roles that can create/update employees
const HR_WRITE_ROLES = ['owner', 'admin', 'manager', 'administration'];
// HR roles that can view employee list (non-sensitive)
// NOTE: Staff cannot view other employees by policy; exclude 'staff' here.
const HR_LIST_ROLES = ['owner', 'admin', 'manager', 'administration'];
// HR roles that can view employee detail (full decrypt)
const HR_DETAIL_ROLES = ['owner', 'admin', 'manager', 'administration'];
/**
 * createEmployeeSecure - Create employee with server-side encryption
 */
exports.createEmployeeSecure = (0, secureRequestGuard_1.withSecureGuard)(hrEncryptionKey, async (data, _context, encryptionKey) => {
    const { hrWritePath, employee } = data;
    if (!hrWritePath || !employee) {
        throw new Error('hrWritePath and employee are required');
    }
    const ref = db.ref(`${hrWritePath}/employees`);
    const newRef = ref.push();
    const employeeId = newRef.key;
    if (!employeeId)
        throw new Error('Failed to generate employee ID');
    const newEmployee = Object.assign(Object.assign({}, employee), { id: employeeId, createdAt: Date.now(), updatedAt: Date.now() });
    const encrypted = await (0, SensitiveDataService_1.encryptEmployeeData)(newEmployee, encryptionKey);
    await newRef.set(encrypted);
    return { employeeId };
}, {
    requiredRoles: HR_WRITE_ROLES,
    pathParamKey: 'hrWritePath',
    domain: 'HR',
});
/**
 * updateEmployeeSecure - Update employee with server-side encryption
 */
exports.updateEmployeeSecure = (0, secureRequestGuard_1.withSecureGuard)(hrEncryptionKey, async (data, _context, encryptionKey) => {
    const { hrWritePath, employeeId, updates } = data;
    if (!hrWritePath || !employeeId || !updates) {
        throw new Error('hrWritePath, employeeId and updates are required');
    }
    const updateData = Object.assign(Object.assign({}, updates), { updatedAt: Date.now() });
    const encrypted = await (0, SensitiveDataService_1.encryptEmployeeData)(updateData, encryptionKey);
    const ref = db.ref(`${hrWritePath}/employees/${employeeId}`);
    await ref.update(encrypted);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw)
        return null;
    const full = Object.assign({ id: employeeId }, raw);
    const decrypted = await (0, SensitiveDataService_1.decryptEmployeeData)(full, encryptionKey);
    return decrypted;
}, {
    requiredRoles: HR_WRITE_ROLES,
    pathParamKey: 'hrWritePath',
    domain: 'HR',
});
/**
 * fetchEmployeesSecure - List employees (Option B: non-sensitive fields only, no decrypt)
 */
exports.fetchEmployeesSecure = (0, secureRequestGuard_1.withSecureGuard)(hrEncryptionKey, async (data, _context, _encryptionKey) => {
    const { hrWritePath } = data;
    if (!hrWritePath)
        throw new Error('hrWritePath is required');
    const ref = db.ref(`${hrWritePath}/employees`);
    const snapshot = await ref.once('value');
    const val = snapshot.val();
    if (!val)
        return [];
    const employees = Object.entries(val).map(([id, emp]) => (Object.assign({ id }, emp)));
    return employees.map((emp) => (0, SensitiveDataService_1.toEmployeeListItem)(emp));
}, {
    requiredRoles: HR_LIST_ROLES,
    pathParamKey: 'hrWritePath',
    domain: 'HR',
});
/**
 * fetchEmployeeDetailSecure - Single employee with full decrypt (for detail/edit view)
 */
exports.fetchEmployeeDetailSecure = (0, secureRequestGuard_1.withSecureGuard)(hrEncryptionKey, async (data, _context, encryptionKey) => {
    const { hrWritePath, employeeId } = data;
    if (!hrWritePath || !employeeId) {
        throw new Error('hrWritePath and employeeId are required');
    }
    const ref = db.ref(`${hrWritePath}/employees/${employeeId}`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw)
        return null;
    const full = Object.assign({ id: employeeId }, raw);
    const decrypted = await (0, SensitiveDataService_1.decryptEmployeeData)(full, encryptionKey);
    return decrypted;
}, {
    requiredRoles: HR_DETAIL_ROLES,
    pathParamKey: 'hrWritePath',
    domain: 'HR',
});
//# sourceMappingURL=hrSecure.js.map
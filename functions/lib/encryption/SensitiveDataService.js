"use strict";
/**
 * Sensitive Data Service (Node.js / Firebase Functions)
 *
 * Field-level encryption for employee, payroll, company data.
 * Uses AES-256-GCM. Keys from Firebase Secrets only.
 *
 * Encrypted payload versioning: { _encVersion, _encAlg } for future rotation.
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
exports.toPayrollListItem = exports.decryptPayrollData = exports.encryptPayrollData = exports.decryptUserPersonalData = exports.encryptUserPersonalData = exports.toBankAccountListItem = exports.decryptBankAccountData = exports.encryptBankAccountData = exports.toEmployeeListItem = exports.decryptEmployeeData = exports.encryptEmployeeData = void 0;
const encryption = __importStar(require("./EncryptionService"));
// Employee fields (must match client EMPLOYEE_ENCRYPTED_FIELDS + EMPLOYEE_SENSITIVE_FIELDS)
const EMPLOYEE_FIELDS = [
    'nationalInsuranceNumber', 'dateOfBirth',
    'bankDetails.accountNumber', 'bankDetails.routingNumber', 'bankDetails.iban', 'bankDetails.swift',
    'taxInformation.taxId', 'taxCode',
    'p45Data.previousEmployerPAYERef', 'p45Data.taxCodeAtLeaving', 'p45Data.payToDate', 'p45Data.taxToDate',
    'pensionSchemeReference',
    'email', 'phone', 'emergencyContact.phone',
    'address.street', 'address.zipCode',
    'salary', 'hourlyRate',
];
function getNested(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const p of parts) {
        if (current == null)
            return undefined;
        current = current[p];
    }
    return current;
}
function setNested(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!(p in current) || typeof current[p] !== 'object') {
            current[p] = {};
        }
        current = current[p];
    }
    current[parts[parts.length - 1]] = value;
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Encrypt employee data - returns object with sensitive fields encrypted
 */
async function encryptEmployeeData(employee, key) {
    const result = deepClone(employee);
    for (const fieldPath of EMPLOYEE_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (typeof value !== 'string' && typeof value !== 'number')
            continue;
        if (encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const encrypted = await encryption.encryptWithMarker(String(value), key);
            setNested(result, fieldPath, encrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to encrypt field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.encryptEmployeeData = encryptEmployeeData;
/**
 * Decrypt employee data - returns object with sensitive fields decrypted
 */
async function decryptEmployeeData(employee, key) {
    const result = deepClone(employee);
    for (const fieldPath of EMPLOYEE_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (!encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const decrypted = await encryption.decryptWithMarker(String(value), key);
            setNested(result, fieldPath, decrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to decrypt field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.decryptEmployeeData = decryptEmployeeData;
/** Safe keys - ONLY these may appear in list response. Sensitive fields are NOT in this list. */
const EMPLOYEE_LIST_SAFE_KEYS = [
    'id', 'employeeID', 'firstName', 'lastName', 'email', 'departmentId', 'roleId',
    'hireDate', 'status', 'jobTitle', 'position', 'department', 'employmentType',
    'payrollNumber', 'createdAt', 'updatedAt', 'companyId', 'siteId', 'userId', 'photo',
];
/**
 * Build list item from raw employee - WHITELIST ONLY.
 * Sensitive fields (NI, bank, salary, DoB, phone, tax, etc.) are never picked.
 */
function toEmployeeListItem(employee) {
    const result = {};
    for (const key of EMPLOYEE_LIST_SAFE_KEYS) {
        if (key in employee && employee[key] !== undefined) {
            result[key] = employee[key];
        }
    }
    return result;
}
exports.toEmployeeListItem = toEmployeeListItem;
// ============================================================================
// BANK ACCOUNT (Finance)
// ============================================================================
const BANK_ACCOUNT_FIELDS = ['accountNumber'];
async function encryptBankAccountData(bankAccount, key) {
    const result = deepClone(bankAccount);
    for (const fieldPath of BANK_ACCOUNT_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (typeof value !== 'string' && typeof value !== 'number')
            continue;
        if (encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const encrypted = await encryption.encryptWithMarker(String(value), key);
            setNested(result, fieldPath, encrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to encrypt bank field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.encryptBankAccountData = encryptBankAccountData;
async function decryptBankAccountData(bankAccount, key) {
    const result = deepClone(bankAccount);
    for (const fieldPath of BANK_ACCOUNT_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (!encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const decrypted = await encryption.decryptWithMarker(String(value), key);
            setNested(result, fieldPath, decrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to decrypt bank field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.decryptBankAccountData = decryptBankAccountData;
const BANK_ACCOUNT_LIST_SAFE_KEYS = [
    'id', 'accountName', 'bankName', 'sortCode', 'currency', 'balance', 'createdAt', 'updatedAt',
];
function toBankAccountListItem(ba) {
    const result = {};
    for (const key of BANK_ACCOUNT_LIST_SAFE_KEYS) {
        if (key in ba && ba[key] !== undefined) {
            result[key] = ba[key];
        }
    }
    return result;
}
exports.toBankAccountListItem = toBankAccountListItem;
// ============================================================================
// USER PERSONAL SETTINGS
// ============================================================================
const USER_PERSONAL_FIELDS = [
    'bankDetails.accountNumber', 'bankDetails.sortCode', 'bankDetails.iban', 'bankDetails.swift',
    'niNumber', 'taxCode',
];
async function encryptUserPersonalData(data, key) {
    const result = deepClone(data);
    for (const fieldPath of USER_PERSONAL_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (typeof value !== 'string' && typeof value !== 'number')
            continue;
        if (encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const encrypted = await encryption.encryptWithMarker(String(value), key);
            setNested(result, fieldPath, encrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to encrypt user personal field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.encryptUserPersonalData = encryptUserPersonalData;
async function decryptUserPersonalData(data, key) {
    const result = deepClone(data);
    for (const fieldPath of USER_PERSONAL_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (!encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const decrypted = await encryption.decryptWithMarker(String(value), key);
            setNested(result, fieldPath, decrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to decrypt user personal field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.decryptUserPersonalData = decryptUserPersonalData;
// ============================================================================
// PAYROLL
// ============================================================================
const PAYROLL_FIELDS = [
    'grossPay', 'netPay', 'taxDeductions', 'employeeNIDeductions', 'employerNIContributions',
    'studentLoanDeductions', 'postgraduateLoanDeductions', 'employeePensionDeductions', 'employerPensionContributions',
    'ytdData.grossPayYTD', 'ytdData.taxablePayYTD', 'ytdData.taxPaidYTD', 'ytdData.employeeNIPaidYTD', 'ytdData.employerNIPaidYTD',
];
async function encryptPayrollData(payroll, key) {
    const result = deepClone(payroll);
    for (const fieldPath of PAYROLL_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (typeof value !== 'string' && typeof value !== 'number')
            continue;
        if (encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const encrypted = await encryption.encryptWithMarker(String(value), key);
            setNested(result, fieldPath, encrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to encrypt payroll field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.encryptPayrollData = encryptPayrollData;
async function decryptPayrollData(payroll, key) {
    const result = deepClone(payroll);
    for (const fieldPath of PAYROLL_FIELDS) {
        const value = getNested(result, fieldPath);
        if (value === undefined || value === null)
            continue;
        if (!encryption.isEncryptedValue(String(value)))
            continue;
        try {
            const decrypted = await encryption.decryptWithMarker(String(value), key);
            setNested(result, fieldPath, decrypted);
        }
        catch (err) {
            console.warn(`[SensitiveDataService] Failed to decrypt payroll field ${fieldPath}:`, err);
        }
    }
    return result;
}
exports.decryptPayrollData = decryptPayrollData;
const PAYROLL_LIST_SAFE_KEYS = [
    'id', 'employeeId', 'employeeName', 'periodId', 'periodStartDate', 'periodEndDate',
    'payPeriodStart', 'payPeriodEnd', 'status', 'createdAt', 'updatedAt',
];
function toPayrollListItem(p) {
    const result = {};
    for (const key of PAYROLL_LIST_SAFE_KEYS) {
        if (key in p && p[key] !== undefined)
            result[key] = p[key];
    }
    return result;
}
exports.toPayrollListItem = toPayrollListItem;
//# sourceMappingURL=SensitiveDataService.js.map
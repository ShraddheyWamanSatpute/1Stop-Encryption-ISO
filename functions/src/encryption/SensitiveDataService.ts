/**
 * Sensitive Data Service (Node.js / Firebase Functions)
 *
 * Field-level encryption for employee, payroll, company data.
 * Uses AES-256-GCM. Keys from Firebase Secrets only.
 *
 * Encrypted payload versioning: { _encVersion, _encAlg } for future rotation.
 */

import * as encryption from './EncryptionService';

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

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const p of parts) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[p];
  }
  return current;
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in current) || typeof (current as Record<string, unknown>)[p] !== 'object') {
      (current as Record<string, unknown>)[p] = {};
    }
    current = (current as Record<string, unknown>)[p] as Record<string, unknown>;
  }
  (current as Record<string, unknown>)[parts[parts.length - 1]] = value;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Encrypt employee data - returns object with sensitive fields encrypted
 */
export async function encryptEmployeeData(
  employee: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(employee);
  for (const fieldPath of EMPLOYEE_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (encryption.isEncryptedValue(String(value))) continue;

    try {
      const encrypted = await encryption.encryptWithMarker(String(value), key);
      setNested(result, fieldPath, encrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to encrypt field ${fieldPath}:`, err);
    }
  }
  return result;
}

/**
 * Decrypt employee data - returns object with sensitive fields decrypted
 */
export async function decryptEmployeeData(
  employee: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(employee);
  for (const fieldPath of EMPLOYEE_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (!encryption.isEncryptedValue(String(value))) continue;

    try {
      const decrypted = await encryption.decryptWithMarker(String(value), key);
      setNested(result, fieldPath, decrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to decrypt field ${fieldPath}:`, err);
    }
  }
  return result;
}

/**
 * Whitelist of safe fields for list view - DTO literally cannot include sensitive data.
 * NI, bank, tax, salary, DoB, phone etc. are NEVER in this type.
 */
export interface EmployeeListItem {
  id?: string;
  employeeID?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentId?: string;
  roleId?: string;
  hireDate?: number;
  status?: string;
  jobTitle?: string;
  position?: string;
  department?: string;
  employmentType?: string;
  payrollNumber?: string;
  createdAt?: number;
  updatedAt?: number;
  companyId?: string;
  siteId?: string;
  userId?: string;
  photo?: string;
}

/** Safe keys - ONLY these may appear in list response. Sensitive fields are NOT in this list. */
const EMPLOYEE_LIST_SAFE_KEYS: (keyof EmployeeListItem)[] = [
  'id', 'employeeID', 'firstName', 'lastName', 'email', 'departmentId', 'roleId',
  'hireDate', 'status', 'jobTitle', 'position', 'department', 'employmentType',
  'payrollNumber', 'createdAt', 'updatedAt', 'companyId', 'siteId', 'userId', 'photo',
];

/**
 * Build list item from raw employee - WHITELIST ONLY.
 * Sensitive fields (NI, bank, salary, DoB, phone, tax, etc.) are never picked.
 */
export function toEmployeeListItem(employee: Record<string, unknown>): EmployeeListItem {
  const result: Record<string, unknown> = {};
  for (const key of EMPLOYEE_LIST_SAFE_KEYS) {
    if (key in employee && employee[key] !== undefined) {
      result[key] = employee[key];
    }
  }
  return result as unknown as EmployeeListItem;
}

// ============================================================================
// BANK ACCOUNT (Finance)
// ============================================================================

const BANK_ACCOUNT_FIELDS = ['accountNumber'];

export async function encryptBankAccountData(
  bankAccount: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(bankAccount);
  for (const fieldPath of BANK_ACCOUNT_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (encryption.isEncryptedValue(String(value))) continue;
    try {
      const encrypted = await encryption.encryptWithMarker(String(value), key);
      setNested(result, fieldPath, encrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to encrypt bank field ${fieldPath}:`, err);
    }
  }
  return result;
}

export async function decryptBankAccountData(
  bankAccount: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(bankAccount);
  for (const fieldPath of BANK_ACCOUNT_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (!encryption.isEncryptedValue(String(value))) continue;
    try {
      const decrypted = await encryption.decryptWithMarker(String(value), key);
      setNested(result, fieldPath, decrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to decrypt bank field ${fieldPath}:`, err);
    }
  }
  return result;
}

export interface BankAccountListItem {
  id?: string;
  accountName?: string;
  bankName?: string;
  sortCode?: string;
  currency?: string;
  balance?: number;
  createdAt?: string;
  updatedAt?: string;
}

const BANK_ACCOUNT_LIST_SAFE_KEYS: (keyof BankAccountListItem)[] = [
  'id', 'accountName', 'bankName', 'sortCode', 'currency', 'balance', 'createdAt', 'updatedAt',
];

export function toBankAccountListItem(ba: Record<string, unknown>): BankAccountListItem {
  const result: Record<string, unknown> = {};
  for (const key of BANK_ACCOUNT_LIST_SAFE_KEYS) {
    if (key in ba && ba[key] !== undefined) {
      result[key] = ba[key];
    }
  }
  return result as unknown as BankAccountListItem;
}

// ============================================================================
// USER PERSONAL SETTINGS
// ============================================================================

const USER_PERSONAL_FIELDS = [
  'bankDetails.accountNumber', 'bankDetails.sortCode', 'bankDetails.iban', 'bankDetails.swift',
  'niNumber', 'taxCode',
];

export async function encryptUserPersonalData(
  data: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(data);
  for (const fieldPath of USER_PERSONAL_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (encryption.isEncryptedValue(String(value))) continue;
    try {
      const encrypted = await encryption.encryptWithMarker(String(value), key);
      setNested(result, fieldPath, encrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to encrypt user personal field ${fieldPath}:`, err);
    }
  }
  return result;
}

export async function decryptUserPersonalData(
  data: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(data);
  for (const fieldPath of USER_PERSONAL_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (!encryption.isEncryptedValue(String(value))) continue;
    try {
      const decrypted = await encryption.decryptWithMarker(String(value), key);
      setNested(result, fieldPath, decrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to decrypt user personal field ${fieldPath}:`, err);
    }
  }
  return result;
}

// ============================================================================
// PAYROLL
// ============================================================================

const PAYROLL_FIELDS = [
  'grossPay', 'netPay', 'taxDeductions', 'employeeNIDeductions', 'employerNIContributions',
  'studentLoanDeductions', 'postgraduateLoanDeductions', 'employeePensionDeductions', 'employerPensionContributions',
  'ytdData.grossPayYTD', 'ytdData.taxablePayYTD', 'ytdData.taxPaidYTD', 'ytdData.employeeNIPaidYTD', 'ytdData.employerNIPaidYTD',
];

export async function encryptPayrollData(
  payroll: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(payroll);
  for (const fieldPath of PAYROLL_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (encryption.isEncryptedValue(String(value))) continue;
    try {
      const encrypted = await encryption.encryptWithMarker(String(value), key);
      setNested(result, fieldPath, encrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to encrypt payroll field ${fieldPath}:`, err);
    }
  }
  return result;
}

export async function decryptPayrollData(
  payroll: Record<string, unknown>,
  key: string
): Promise<Record<string, unknown>> {
  const result = deepClone(payroll);
  for (const fieldPath of PAYROLL_FIELDS) {
    const value = getNested(result, fieldPath);
    if (value === undefined || value === null) continue;
    if (!encryption.isEncryptedValue(String(value))) continue;
    try {
      const decrypted = await encryption.decryptWithMarker(String(value), key);
      setNested(result, fieldPath, decrypted);
    } catch (err) {
      console.warn(`[SensitiveDataService] Failed to decrypt payroll field ${fieldPath}:`, err);
    }
  }
  return result;
}

export interface PayrollListItem {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  periodId?: string;
  periodStartDate?: number;
  periodEndDate?: number;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PAYROLL_LIST_SAFE_KEYS: (keyof PayrollListItem)[] = [
  'id', 'employeeId', 'employeeName', 'periodId', 'periodStartDate', 'periodEndDate',
  'payPeriodStart', 'payPeriodEnd', 'status', 'createdAt', 'updatedAt',
];

export function toPayrollListItem(p: Record<string, unknown>): PayrollListItem {
  const result: Record<string, unknown> = {};
  for (const key of PAYROLL_LIST_SAFE_KEYS) {
    if (key in p && p[key] !== undefined) result[key] = p[key];
  }
  return result as unknown as PayrollListItem;
}

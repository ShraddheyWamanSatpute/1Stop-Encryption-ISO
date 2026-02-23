/**
 * HR Secure Functions
 *
 * Server-side encryption for employee data.
 * All Functions use withSecureGuard - auth → company access → role → then handler.
 *
 * Naming: All decrypt-capable Functions end with "Secure"
 */

import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { withSecureGuard } from './guards/secureRequestGuard';
import {
  encryptEmployeeData,
  decryptEmployeeData,
  toEmployeeListItem,
} from './encryption/SensitiveDataService';

const db = admin.database();

// Domain-specific encryption key - only this module and guard reference it
const hrEncryptionKey = defineSecret('HR_ENCRYPTION_KEY');

// HR roles that can create/update employees
const HR_WRITE_ROLES = ['owner', 'admin', 'manager', 'administration'] as const;
// HR roles that can view employee list (non-sensitive)
// NOTE: Staff cannot view other employees by policy; exclude 'staff' here.
const HR_LIST_ROLES = ['owner', 'admin', 'manager', 'administration'] as const;
// HR roles that can view employee detail (full decrypt)
const HR_DETAIL_ROLES = ['owner', 'admin', 'manager', 'administration'] as const;

interface CreateEmployeeRequest {
  hrWritePath: string;
  employee: Record<string, unknown>;
}

interface UpdateEmployeeRequest {
  hrWritePath: string;
  employeeId: string;
  updates: Record<string, unknown>;
}

interface FetchEmployeesRequest {
  hrWritePath: string;
}

interface FetchEmployeeDetailRequest {
  hrWritePath: string;
  employeeId: string;
}

/**
 * createEmployeeSecure - Create employee with server-side encryption
 */
export const createEmployeeSecure = withSecureGuard(
  hrEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { hrWritePath, employee } = data as unknown as CreateEmployeeRequest;
    if (!hrWritePath || !employee) {
      throw new Error('hrWritePath and employee are required');
    }

    const ref = db.ref(`${hrWritePath}/employees`);
    const newRef = ref.push();
    const employeeId = newRef.key;
    if (!employeeId) throw new Error('Failed to generate employee ID');

    const newEmployee: Record<string, unknown> = {
      ...employee,
      id: employeeId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const encrypted = await encryptEmployeeData(newEmployee, encryptionKey);
    await newRef.set(encrypted);

    return { employeeId };
  },
  {
    requiredRoles: HR_WRITE_ROLES as unknown as string[],
    pathParamKey: 'hrWritePath',
    domain: 'HR',
  }
);

/**
 * updateEmployeeSecure - Update employee with server-side encryption
 */
export const updateEmployeeSecure = withSecureGuard(
  hrEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { hrWritePath, employeeId, updates } = data as unknown as UpdateEmployeeRequest;
    if (!hrWritePath || !employeeId || !updates) {
      throw new Error('hrWritePath, employeeId and updates are required');
    }

    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: Date.now(),
    };
    const encrypted = await encryptEmployeeData(updateData, encryptionKey);

    const ref = db.ref(`${hrWritePath}/employees/${employeeId}`);
    await ref.update(encrypted);

    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw) return null;

    const full = { id: employeeId, ...raw };
    const decrypted = await decryptEmployeeData(full as Record<string, unknown>, encryptionKey);
    return decrypted;
  },
  {
    requiredRoles: HR_WRITE_ROLES as unknown as string[],
    pathParamKey: 'hrWritePath',
    domain: 'HR',
  }
);

/**
 * fetchEmployeesSecure - List employees (Option B: non-sensitive fields only, no decrypt)
 */
export const fetchEmployeesSecure = withSecureGuard(
  hrEncryptionKey,
  async (data, _context, _encryptionKey) => {
    const { hrWritePath } = data as unknown as FetchEmployeesRequest;
    if (!hrWritePath) throw new Error('hrWritePath is required');

    const ref = db.ref(`${hrWritePath}/employees`);
    const snapshot = await ref.once('value');
    const val = snapshot.val();
    if (!val) return [];

    const employees = Object.entries(val).map(([id, emp]) => ({
      id,
      ...(emp as Record<string, unknown>),
    }));

    return employees.map((emp) => toEmployeeListItem(emp));
  },
  {
    requiredRoles: HR_LIST_ROLES as unknown as string[],
    pathParamKey: 'hrWritePath',
    domain: 'HR',
  }
);

/**
 * fetchEmployeeDetailSecure - Single employee with full decrypt (for detail/edit view)
 */
export const fetchEmployeeDetailSecure = withSecureGuard(
  hrEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { hrWritePath, employeeId } = data as unknown as FetchEmployeeDetailRequest;
    if (!hrWritePath || !employeeId) {
      throw new Error('hrWritePath and employeeId are required');
    }

    const ref = db.ref(`${hrWritePath}/employees/${employeeId}`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw) return null;

    const full = { id: employeeId, ...raw };
    const decrypted = await decryptEmployeeData(full as Record<string, unknown>, encryptionKey);
    return decrypted;
  },
  {
    requiredRoles: HR_DETAIL_ROLES as unknown as string[],
    pathParamKey: 'hrWritePath',
    domain: 'HR',
  }
);

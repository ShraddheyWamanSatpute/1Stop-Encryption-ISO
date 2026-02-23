/**
 * Payroll Secure Functions
 *
 * Server-side encryption for payroll data.
 * Uses withSecureGuard - auth → company access → role → handler.
 */

import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { withSecureGuard } from './guards/secureRequestGuard';
import {
  decryptPayrollData,
  toPayrollListItem,
} from './encryption/SensitiveDataService';

const db = admin.database();

const payrollEncryptionKey = defineSecret('PAYROLL_ENCRYPTION_KEY');

// Roles allowed to access payroll data
const PAYROLL_ROLES = ['owner', 'admin', 'payroll_admin', 'finance_admin', 'administration'] as const;

interface FetchPayrollRequest {
  hrBasePath: string;
}

interface FetchPayrollDetailRequest {
  hrBasePath: string;
  payrollId: string;
}

export const fetchPayrollSecure = withSecureGuard(
  payrollEncryptionKey,
  async (data, _context, _encryptionKey) => {
    const { hrBasePath } = data as unknown as FetchPayrollRequest;
    if (!hrBasePath) throw new Error('hrBasePath required');

    const ref = db.ref(`${hrBasePath}/payroll`);
    const snapshot = await ref.once('value');
    const val = snapshot.val();
    if (!val) return [];

    const items = Object.entries(val).map(([id, p]) => ({ id, ...(p as Record<string, unknown>) }));
    return items.map((p) => toPayrollListItem(p));
  },
  {
    requiredRoles: PAYROLL_ROLES as unknown as string[],
    requiredActions: ['payroll:list'],
    pathParamKey: 'hrBasePath',
    domain: 'PAYROLL',
  }
);

export const fetchPayrollDetailSecure = withSecureGuard(
  payrollEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { hrBasePath, payrollId } = data as unknown as FetchPayrollDetailRequest;
    if (!hrBasePath || !payrollId) throw new Error('Missing required params');

    const ref = db.ref(`${hrBasePath}/payroll/${payrollId}`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw) return null;

    const full = { id: payrollId, ...raw };
    return decryptPayrollData(full as Record<string, unknown>, encryptionKey);
  },
  {
    requiredRoles: PAYROLL_ROLES as unknown as string[],
    requiredActions: ['payroll:view_full'],
    pathParamKey: 'hrBasePath',
    domain: 'PAYROLL',
  }
);

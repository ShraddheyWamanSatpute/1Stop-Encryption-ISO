/**
 * Payroll Secure Functions - Client
 *
 * Calls server-side secure Functions for payroll data.
 * Wire when Firebase access is available.
 */

import { functionsApp, httpsCallable } from '../services/Firebase';

const fetchPayrollSecure = httpsCallable(functionsApp, 'fetchPayrollSecure');
const fetchPayrollDetailSecure = httpsCallable(functionsApp, 'fetchPayrollDetailSecure');

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

export type PayrollDetail = Record<string, unknown>;

export async function fetchPayrollSecureCall(
  hrBasePath: string
): Promise<PayrollListItem[]> {
  const result = await fetchPayrollSecure({ hrBasePath });
  return (result.data as PayrollListItem[]) ?? [];
}

export async function fetchPayrollDetailSecureCall(
  hrBasePath: string,
  payrollId: string
): Promise<PayrollDetail | null> {
  const result = await fetchPayrollDetailSecure({ hrBasePath, payrollId });
  return (result.data as PayrollDetail | null) ?? null;
}

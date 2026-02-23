/**
 * HR Secure Functions - Client
 *
 * Calls server-side secure Functions via httpsCallable.
 * Replaces direct RTDB writes and client-side encryption.
 */

import { functionsApp, httpsCallable } from '../services/Firebase';

const createEmployeeSecure = httpsCallable<
  { hrWritePath: string; employee: Record<string, unknown> },
  { data: { employeeId: string } }
>(functionsApp, 'createEmployeeSecure');

const updateEmployeeSecure = httpsCallable<
  { hrWritePath: string; employeeId: string; updates: Record<string, unknown> },
  { data: EmployeeDetail | null }
>(functionsApp, 'updateEmployeeSecure');

const fetchEmployeesSecure = httpsCallable<
  { hrWritePath: string },
  { data: EmployeeListItem[] }
>(functionsApp, 'fetchEmployeesSecure');

const fetchEmployeeDetailSecure = httpsCallable<
  { hrWritePath: string; employeeId: string },
  { data: EmployeeDetail | null }
>(functionsApp, 'fetchEmployeeDetailSecure');

// List item - non-sensitive only
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

// Full detail - includes sensitive (decrypted server-side)
export type EmployeeDetail = Record<string, unknown>;

export async function createEmployeeSecureCall(
  hrWritePath: string,
  employee: Record<string, unknown>
): Promise<string> {
  const result = await createEmployeeSecure({ hrWritePath, employee });
  // Cloud Function returns nested data: { data: { employeeId } }
  const payload = result.data as { data: { employeeId: string } };
  return payload.data.employeeId;
}

export async function updateEmployeeSecureCall(
  hrWritePath: string,
  employeeId: string,
  updates: Record<string, unknown>
): Promise<EmployeeDetail | null> {
  const result = await updateEmployeeSecure({ hrWritePath, employeeId, updates });
  return (result.data as EmployeeDetail | null) ?? null;
}

export async function fetchEmployeesSecureCall(hrWritePath: string): Promise<EmployeeListItem[]> {
  const result = await fetchEmployeesSecure({ hrWritePath });
  const payload = result.data as { data: EmployeeListItem[] };
  return payload.data ?? [];
}

export async function fetchEmployeeDetailSecureCall(
  hrWritePath: string,
  employeeId: string
): Promise<EmployeeDetail | null> {
  const result = await fetchEmployeeDetailSecure({ hrWritePath, employeeId });
  return (result.data as EmployeeDetail | null) ?? null;
}

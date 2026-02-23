/**
 * Finance Secure Functions - Client
 *
 * Calls server-side secure Functions for bank account data.
 * Wire when Firebase access is available.
 */

import { functionsApp, httpsCallable } from '../services/Firebase';

const createBankAccountSecure = httpsCallable(functionsApp, 'createBankAccountSecure');
const updateBankAccountSecure = httpsCallable(functionsApp, 'updateBankAccountSecure');
const fetchBankAccountsSecure = httpsCallable(functionsApp, 'fetchBankAccountsSecure');
const fetchBankAccountDetailSecure = httpsCallable(functionsApp, 'fetchBankAccountDetailSecure');
const deleteBankAccountSecure = httpsCallable(functionsApp, 'deleteBankAccountSecure');

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

export type BankAccountDetail = Record<string, unknown>;

export async function createBankAccountSecureCall(
  financeBasePath: string,
  bankAccount: Record<string, unknown>
): Promise<string> {
  const result = await createBankAccountSecure({ financeBasePath, bankAccount });
  const data = result.data as { bankAccountId: string };
  return data.bankAccountId;
}

export async function updateBankAccountSecureCall(
  financeBasePath: string,
  bankAccountId: string,
  updates: Record<string, unknown>
): Promise<BankAccountDetail | null> {
  const result = await updateBankAccountSecure({
    financeBasePath,
    bankAccountId,
    updates,
  });
  return (result.data as BankAccountDetail | null) ?? null;
}

export async function fetchBankAccountsSecureCall(
  financeBasePath: string
): Promise<BankAccountListItem[]> {
  const result = await fetchBankAccountsSecure({ financeBasePath });
  return (result.data as BankAccountListItem[]) ?? [];
}

export async function fetchBankAccountDetailSecureCall(
  financeBasePath: string,
  bankAccountId: string
): Promise<BankAccountDetail | null> {
  const result = await fetchBankAccountDetailSecure({ financeBasePath, bankAccountId });
  return (result.data as BankAccountDetail | null) ?? null;
}

export async function deleteBankAccountSecureCall(
  financeBasePath: string,
  bankAccountId: string
): Promise<void> {
  await deleteBankAccountSecure({ financeBasePath, bankAccountId });
}

/**
 * Finance Secure Functions
 *
 * Server-side encryption for bank account data.
 * All Functions use withSecureGuard - auth → company access → role → handler.
 */

import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { withSecureGuard } from './guards/secureRequestGuard';
import {
  encryptBankAccountData,
  decryptBankAccountData,
  toBankAccountListItem,
} from './encryption/SensitiveDataService';

const db = admin.database();

const financeEncryptionKey = defineSecret('FINANCE_ENCRYPTION_KEY');

// Roles allowed to manage finance/bank accounts
const FINANCE_WRITE_ROLES = ['owner', 'admin', 'finance_admin', 'administration'] as const;
const FINANCE_READ_ROLES = ['owner', 'admin', 'finance_admin', 'administration'] as const;

interface CreateBankAccountRequest {
  financeBasePath: string;
  bankAccount: Record<string, unknown>;
}

interface UpdateBankAccountRequest {
  financeBasePath: string;
  bankAccountId: string;
  updates: Record<string, unknown>;
}

interface FetchBankAccountsRequest {
  financeBasePath: string;
}

interface FetchBankAccountDetailRequest {
  financeBasePath: string;
  bankAccountId: string;
}

export const createBankAccountSecure = withSecureGuard(
  financeEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { financeBasePath, bankAccount } = data as unknown as CreateBankAccountRequest;
    if (!financeBasePath || !bankAccount) throw new Error('financeBasePath and bankAccount required');

    const ref = db.ref(`${financeBasePath}/bankAccounts`);
    const newRef = ref.push();
    const id = newRef.key;
    if (!id) throw new Error('Failed to generate ID');

    const newBA: Record<string, unknown> = {
      ...bankAccount,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const encrypted = await encryptBankAccountData(newBA, encryptionKey);
    await newRef.set(encrypted);
    return { bankAccountId: id };
  },
  {
    requiredRoles: FINANCE_WRITE_ROLES as unknown as string[],
    requiredActions: ['finance:bank_change'],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
  }
);

export const updateBankAccountSecure = withSecureGuard(
  financeEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { financeBasePath, bankAccountId, updates } = data as unknown as UpdateBankAccountRequest;
    if (!financeBasePath || !bankAccountId || !updates) throw new Error('Missing required params');

    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const encrypted = await encryptBankAccountData(updateData, encryptionKey);

    const ref = db.ref(`${financeBasePath}/bankAccounts/${bankAccountId}`);
    await ref.update(encrypted);

    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw) return null;
    const full = { id: bankAccountId, ...raw };
    return decryptBankAccountData(full as Record<string, unknown>, encryptionKey);
  },
  {
    requiredRoles: FINANCE_WRITE_ROLES as unknown as string[],
    requiredActions: ['finance:bank_change'],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
  }
);

export const fetchBankAccountsSecure = withSecureGuard(
  financeEncryptionKey,
  async (data, _context, _encryptionKey) => {
    const { financeBasePath } = data as unknown as FetchBankAccountsRequest;
    if (!financeBasePath) throw new Error('financeBasePath required');

    const ref = db.ref(`${financeBasePath}/bankAccounts`);
    const snapshot = await ref.once('value');
    const val = snapshot.val();
    if (!val) return [];

    const items = Object.entries(val).map(([id, ba]) => ({ id, ...(ba as Record<string, unknown>) }));
    return items.map((ba) => toBankAccountListItem(ba));
  },
  {
    requiredRoles: FINANCE_READ_ROLES as unknown as string[],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
  }
);

export const fetchBankAccountDetailSecure = withSecureGuard(
  financeEncryptionKey,
  async (data, _context, encryptionKey) => {
    const { financeBasePath, bankAccountId } = data as unknown as FetchBankAccountDetailRequest;
    if (!financeBasePath || !bankAccountId) throw new Error('Missing required params');

    const ref = db.ref(`${financeBasePath}/bankAccounts/${bankAccountId}`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw) return null;

    const full = { id: bankAccountId, ...raw };
    return decryptBankAccountData(full as Record<string, unknown>, encryptionKey);
  },
  {
    requiredRoles: FINANCE_READ_ROLES as unknown as string[],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
  }
);

interface DeleteBankAccountRequest {
  financeBasePath: string;
  bankAccountId: string;
}

export const deleteBankAccountSecure = withSecureGuard(
  financeEncryptionKey,
  async (data, _context, _encryptionKey) => {
    const { financeBasePath, bankAccountId } = data as unknown as DeleteBankAccountRequest;
    if (!financeBasePath || !bankAccountId) throw new Error('Missing required params');
    const ref = db.ref(`${financeBasePath}/bankAccounts/${bankAccountId}`);
    await ref.remove();
    return { success: true };
  },
  {
    requiredRoles: FINANCE_WRITE_ROLES as unknown as string[],
    requiredActions: ['finance:bank_change'],
    pathParamKey: 'financeBasePath',
    domain: 'FINANCE',
  }
);

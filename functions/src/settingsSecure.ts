/**
 * Settings Secure Functions
 *
 * Server-side encryption for user personal settings (bank details, NI, tax code).
 * Uses withUserScopedGuard - user can ONLY access their own settings.
 */

import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { withUserScopedGuard } from './guards/secureRequestGuard';
import { encryptUserPersonalData, decryptUserPersonalData } from './encryption/SensitiveDataService';

const db = admin.database();

const userSettingsKey = defineSecret('USER_SETTINGS_KEY');

interface UpdatePersonalSettingsRequest {
  uid: string;
  personalSettings: Record<string, unknown>;
}

interface FetchPersonalSettingsRequest {
  uid: string;
}

export const updatePersonalSettingsSecure = withUserScopedGuard(
  userSettingsKey,
  async (data, _context, encryptionKey) => {
    const { uid, personalSettings } = data as unknown as UpdatePersonalSettingsRequest;
    if (!uid || !personalSettings) throw new Error('uid and personalSettings required');

    const encrypted = await encryptUserPersonalData(personalSettings, encryptionKey);
    const ref = db.ref(`users/${uid}/settings/personal`);
    await ref.update(encrypted);
    return { success: true };
  },
  { domain: 'SETTINGS', uidParamKey: 'uid' }
);

export const fetchPersonalSettingsSecure = withUserScopedGuard(
  userSettingsKey,
  async (data, _context, encryptionKey) => {
    const { uid } = data as unknown as FetchPersonalSettingsRequest;
    if (!uid) throw new Error('uid required');

    const ref = db.ref(`users/${uid}/settings/personal`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw) return {};

    const decrypted = await decryptUserPersonalData(raw as Record<string, unknown>, encryptionKey);
    return decrypted;
  },
  { domain: 'SETTINGS', uidParamKey: 'uid' }
);

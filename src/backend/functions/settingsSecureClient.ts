/**
 * Settings Secure Functions - Client
 *
 * Calls server-side secure Functions for user personal settings.
 * Wire when Firebase access is available.
 */

import { functionsApp, httpsCallable } from '../services/Firebase';

const updatePersonalSettingsSecure = httpsCallable(functionsApp, 'updatePersonalSettingsSecure');
const fetchPersonalSettingsSecure = httpsCallable(functionsApp, 'fetchPersonalSettingsSecure');

export async function updatePersonalSettingsSecureCall(
  uid: string,
  personalSettings: Record<string, unknown>
): Promise<void> {
  await updatePersonalSettingsSecure({ uid, personalSettings });
}

export async function fetchPersonalSettingsSecureCall(
  uid: string
): Promise<Record<string, unknown>> {
  const result = await fetchPersonalSettingsSecure({ uid });
  return (result.data as Record<string, unknown>) ?? {};
}

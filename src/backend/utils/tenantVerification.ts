/**
 * Tenant Verification Utility
 *
 * ISO 27001 / SOC 2 / GDPR: Ensures user can only access companies they belong to.
 * Tenant = company (users/{uid}/companies/{companyId}).
 * Site/subsite are data layout only, not access boundaries.
 *
 * Use before tenant-scoped operations (especially after session restore or when
 * companyId comes from external input). Database rules provide enforcement;
 * this adds defense-in-depth and clearer UX.
 */

import { db, ref, get } from "../services/Firebase";
import { auth } from "../services/Firebase";

/**
 * Verify that the user has access to the given company (tenant).
 * Checks users/{uid}/companies/{companyId} exists.
 *
 * @param uid - Firebase user ID
 * @param companyId - Company (tenant) ID
 * @returns true if user has access, false otherwise
 */
export async function verifyTenantAccess(uid: string, companyId: string): Promise<boolean> {
  if (!uid || !companyId || typeof uid !== "string" || typeof companyId !== "string") {
    return false;
  }
  try {
    const userCompanyRef = ref(db, `users/${uid}/companies/${companyId}`);
    const snapshot = await get(userCompanyRef);
    return snapshot.exists();
  } catch (error) {
    console.warn("[TenantVerification] Error checking company access:", error);
    return false;
  }
}

/**
 * Verify tenant access for the currently authenticated user.
 * Convenience wrapper when uid is auth.currentUser?.uid.
 *
 * @param companyId - Company (tenant) ID
 * @returns true if current user has access, false if not authenticated or no access
 */
export async function verifyCurrentUserTenantAccess(companyId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user?.uid) return false;
  return verifyTenantAccess(user.uid, companyId);
}

/**
 * Assert that the user has access to the company. Throws if not.
 * Use in contexts/handlers when you want to fail fast with a clear error.
 *
 * @param uid - Firebase user ID
 * @param companyId - Company (tenant) ID
 * @throws Error if user does not have access
 */
export async function assertTenantAccess(uid: string, companyId: string): Promise<void> {
  const hasAccess = await verifyTenantAccess(uid, companyId);
  if (!hasAccess) {
    throw new Error(`Access denied: User does not have access to company ${companyId}`);
  }
}

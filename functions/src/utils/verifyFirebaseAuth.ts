/**
 * Firebase ID Token verification for HTTP (onRequest) functions
 *
 * Extracts Bearer token from Authorization header and verifies with Firebase Admin.
 * Use for HMRC OAuth and RTI endpoints that must only accept authenticated users.
 */

import { Request } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

/** Minimal response interface for 401/403 responses */
interface HttpResponse {
  status: (code: number) => { json: (body: unknown) => void };
}

export interface DecodedToken {
  uid: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Extract and verify Firebase ID token from Authorization header.
 * Expects: Authorization: Bearer <firebaseIdToken>
 *
 * @returns Decoded token or null if invalid/missing
 */
export async function verifyFirebaseIdToken(req: Request): Promise<DecodedToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return null;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Middleware-style helper: verify auth and return 401 if missing/invalid.
 * Call at the start of an onRequest handler.
 *
 * @returns Decoded token, or sends 401 and returns null
 */
export async function requireFirebaseAuth(
  req: Request,
  res: HttpResponse
): Promise<DecodedToken | null> {
  const decoded = await verifyFirebaseIdToken(req);
  if (!decoded) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid Firebase ID token required. Include Authorization: Bearer <token> header.',
    });
    return null;
  }
  return decoded;
}

/** Roles allowed to submit RTI and access HMRC settings */
const HMRC_ALLOWED_ROLES = ['owner', 'admin'];

/**
 * Check if user has access to company (exists in users/{uid}/companies/{companyId}).
 * Used for tenant verification (ISO 27001 / SOC 2).
 */
export async function verifyCompanyAccess(uid: string, companyId: string): Promise<boolean> {
  const db = admin.database();
  const ref = db.ref(`users/${uid}/companies/${companyId}`);
  const snapshot = await ref.once('value');
  return snapshot.exists();
}

/**
 * Check if user has owner or admin role for the given company.
 */
export async function userHasHMRCRole(uid: string, companyId: string): Promise<boolean> {
  const db = admin.database();
  const roleRef = db.ref(`users/${uid}/companies/${companyId}/role`);
  const snapshot = await roleRef.once('value');
  const role = snapshot.val() as string | null;
  return role != null && HMRC_ALLOWED_ROLES.includes(role.toLowerCase());
}

/**
 * Require Firebase auth + company access (tenant verification).
 * Sends 401 if no/invalid token, 403 if user lacks access to company.
 */
export async function requireFirebaseAuthAndCompanyAccess(
  req: Request,
  res: HttpResponse,
  companyId: string
): Promise<DecodedToken | null> {
  const decoded = await requireFirebaseAuth(req, res);
  if (!decoded) return null;

  const hasAccess = await verifyCompanyAccess(decoded.uid, companyId);
  if (!hasAccess) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied to this company.',
    });
    return null;
  }
  return decoded;
}

/**
 * Require Firebase auth + owner/admin role for the given companyId.
 * Sends 401 if no/invalid token, 403 if not owner/admin.
 */
export async function requireFirebaseAuthAndHMRCRole(
  req: Request,
  res: HttpResponse,
  companyId: string
): Promise<DecodedToken | null> {
  const decoded = await requireFirebaseAuth(req, res);
  if (!decoded) return null;

  const hasRole = await userHasHMRCRole(decoded.uid, companyId);
  if (!hasRole) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only owner or admin can perform this action for this company.',
    });
    return null;
  }
  return decoded;
}

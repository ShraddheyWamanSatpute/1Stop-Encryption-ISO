"use strict";
/**
 * Firebase ID Token verification for HTTP (onRequest) functions
 *
 * Extracts Bearer token from Authorization header and verifies with Firebase Admin.
 * Use for HMRC OAuth and RTI endpoints that must only accept authenticated users.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFirebaseAuthAndHMRCRole = exports.requireFirebaseAuthAndCompanyAccess = exports.userHasHMRCRole = exports.verifyCompanyAccess = exports.requireFirebaseAuth = exports.verifyFirebaseIdToken = void 0;
const admin = __importStar(require("firebase-admin"));
/**
 * Extract and verify Firebase ID token from Authorization header.
 * Expects: Authorization: Bearer <firebaseIdToken>
 *
 * @returns Decoded token or null if invalid/missing
 */
async function verifyFirebaseIdToken(req) {
    var _a;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const idToken = (_a = authHeader.split('Bearer ')[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!idToken) {
        return null;
    }
    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        return decoded;
    }
    catch (_b) {
        return null;
    }
}
exports.verifyFirebaseIdToken = verifyFirebaseIdToken;
/**
 * Middleware-style helper: verify auth and return 401 if missing/invalid.
 * Call at the start of an onRequest handler.
 *
 * @returns Decoded token, or sends 401 and returns null
 */
async function requireFirebaseAuth(req, res) {
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
exports.requireFirebaseAuth = requireFirebaseAuth;
/** Roles allowed to submit RTI and access HMRC settings */
const HMRC_ALLOWED_ROLES = ['owner', 'admin'];
/**
 * Check if user has access to company (exists in users/{uid}/companies/{companyId}).
 * Used for tenant verification (ISO 27001 / SOC 2).
 */
async function verifyCompanyAccess(uid, companyId) {
    const db = admin.database();
    const ref = db.ref(`users/${uid}/companies/${companyId}`);
    const snapshot = await ref.once('value');
    return snapshot.exists();
}
exports.verifyCompanyAccess = verifyCompanyAccess;
/**
 * Check if user has owner or admin role for the given company.
 */
async function userHasHMRCRole(uid, companyId) {
    const db = admin.database();
    const roleRef = db.ref(`users/${uid}/companies/${companyId}/role`);
    const snapshot = await roleRef.once('value');
    const role = snapshot.val();
    return role != null && HMRC_ALLOWED_ROLES.includes(role.toLowerCase());
}
exports.userHasHMRCRole = userHasHMRCRole;
/**
 * Require Firebase auth + company access (tenant verification).
 * Sends 401 if no/invalid token, 403 if user lacks access to company.
 */
async function requireFirebaseAuthAndCompanyAccess(req, res, companyId) {
    const decoded = await requireFirebaseAuth(req, res);
    if (!decoded)
        return null;
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
exports.requireFirebaseAuthAndCompanyAccess = requireFirebaseAuthAndCompanyAccess;
/**
 * Require Firebase auth + owner/admin role for the given companyId.
 * Sends 401 if no/invalid token, 403 if not owner/admin.
 */
async function requireFirebaseAuthAndHMRCRole(req, res, companyId) {
    const decoded = await requireFirebaseAuth(req, res);
    if (!decoded)
        return null;
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
exports.requireFirebaseAuthAndHMRCRole = requireFirebaseAuthAndHMRCRole;
//# sourceMappingURL=verifyFirebaseAuth.js.map
"use strict";
/**
 * HMRC RTI Submission Firebase Functions
 *
 * Server-side proxy for HMRC API calls.
 * HMRC APIs do not support CORS, so all calls must go through Firebase Functions.
 *
 * Compliance Requirements:
 * - All HMRC API calls MUST go through server-side functions
 * - Credentials stored in Firebase Secrets only
 * - Firebase ID token verification required (owner/admin only for submit/check)
 * - Audit logging for all submissions
 * - No PII in logs
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
exports.getHMRCAuthUrl = exports.checkRTIStatus = exports.submitRTI = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const verifyFirebaseAuth_1 = require("./utils/verifyFirebaseAuth");
// Ensure admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
// Firebase Secrets
const hmrcClientId = (0, params_1.defineSecret)('HMRC_CLIENT_ID');
const hmrcClientSecret = (0, params_1.defineSecret)('HMRC_CLIENT_SECRET');
/**
 * Mask sensitive data for logging (GDPR compliant)
 */
function maskPAYEReference(ref) {
    if (!ref || ref.length < 4)
        return '***';
    return ref.substring(0, 3) + '/***' + ref.slice(-2);
}
/**
 * Log audit entry for RTI submission (no PII)
 * Tenant-scoped: writes to auditLogs/{companyId}/hmrcSubmissions per ISO 27001 / SOC 2
 */
async function logAuditEntry(entry) {
    try {
        if (!entry.companyId) {
            console.warn('[HMRC RTI] Cannot log audit entry: missing companyId');
            return;
        }
        const db = admin.database();
        const auditRef = db.ref(`auditLogs/${entry.companyId}/hmrcSubmissions`).push();
        await auditRef.set(Object.assign(Object.assign({}, entry), { id: auditRef.key }));
    }
    catch (error) {
        // Don't fail submission if audit logging fails, but log the error
        console.error('Failed to write audit log:', error);
    }
}
/**
 * Submit RTI to HMRC (FPS, EPS, or EYU)
 *
 * This function acts as a server-side proxy for HMRC API calls.
 * CORS is enabled but credentials are NEVER accepted from client.
 */
exports.submitRTI = (0, https_1.onRequest)({
    cors: true,
    secrets: [hmrcClientId, hmrcClientSecret],
    memory: '256MiB',
    timeoutSeconds: 60,
}, async (req, res) => {
    var _a, _b, _c;
    const startTime = Date.now();
    try {
        // Only allow POST
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // Validate request body first to get companyId for role check
        const body = req.body;
        if (!body.companyId) {
            res.status(400).json({ error: 'Missing required field: companyId' });
            return;
        }
        // SECURITY: Verify Firebase ID token and owner/admin role for this company
        const decoded = await (0, verifyFirebaseAuth_1.requireFirebaseAuthAndHMRCRole)(req, res, body.companyId);
        if (!decoded)
            return;
        if (!body.type || !['FPS', 'EPS', 'EYU'].includes(body.type)) {
            res.status(400).json({ error: 'Invalid submission type. Must be FPS, EPS, or EYU.' });
            return;
        }
        if (!body.employerPAYEReference || !body.accountsOfficeReference) {
            res.status(400).json({ error: 'Missing required fields: employerPAYEReference, accountsOfficeReference' });
            return;
        }
        if (!body.xmlPayload) {
            res.status(400).json({ error: 'Missing XML payload' });
            return;
        }
        if (!body.accessToken) {
            res.status(400).json({ error: 'Missing access token. Complete OAuth flow first.' });
            return;
        }
        // Determine HMRC API endpoint
        const environment = body.environment || 'sandbox';
        const baseUrl = environment === 'sandbox'
            ? 'https://test-api.service.hmrc.gov.uk'
            : 'https://api.service.hmrc.gov.uk';
        const employerRef = encodeURIComponent(body.employerPAYEReference);
        const submissionType = body.type.toLowerCase();
        const endpoint = `${baseUrl}/paye/employers/${employerRef}/submissions/${submissionType}`;
        // Build headers (include fraud prevention headers from client)
        const headers = Object.assign({ 'Authorization': `Bearer ${body.accessToken}`, 'Content-Type': 'application/xml', 'Accept': 'application/json' }, (body.fraudPreventionHeaders || {}));
        // Make API request to HMRC
        console.log(`[HMRC RTI] Submitting ${body.type} for company ${body.companyId} to ${environment}`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: body.xmlPayload,
        });
        // Parse response
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        let responseBody = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                responseBody = await response.json();
            }
            catch (_d) {
                responseBody = { raw: await response.text() };
            }
        }
        else {
            responseBody = { raw: await response.text() };
        }
        const correlationId = responseHeaders['x-correlation-id'] || undefined;
        const submissionId = (responseBody === null || responseBody === void 0 ? void 0 : responseBody.submissionId) || correlationId;
        // Build result
        const result = {
            success: response.status === 200 || response.status === 202,
            submissionId,
            correlationId,
            status: response.status === 200 || response.status === 202 ? 'accepted' : 'rejected',
            submittedAt: Date.now(),
            responseBody,
        };
        if (!result.success) {
            const errorBody = responseBody;
            result.errors = errorBody.errors || [{
                    code: errorBody.code || 'SUBMISSION_ERROR',
                    message: errorBody.message || `HTTP ${response.status}: ${response.statusText}`,
                }];
        }
        // Audit logging (no PII) - include userId from verified token
        await logAuditEntry({
            timestamp: Date.now(),
            action: `RTI_SUBMISSION_${body.type}`,
            userId: decoded.uid,
            companyId: body.companyId,
            siteId: body.siteId,
            submissionType: body.type,
            employerRef: maskPAYEReference(body.employerPAYEReference),
            status: result.success ? 'success' : 'failure',
            correlationId,
            errorCode: (_b = (_a = result.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.code,
            ipAddress: req.ip ? req.ip.substring(0, req.ip.lastIndexOf('.')) + '.xxx' : undefined,
            userAgent: (_c = req.headers['user-agent']) === null || _c === void 0 ? void 0 : _c.substring(0, 50), // Truncate user agent
        });
        console.log(`[HMRC RTI] ${body.type} submission ${result.success ? 'accepted' : 'rejected'} in ${Date.now() - startTime}ms`);
        res.status(result.success ? 200 : 400).json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[HMRC RTI] Submission error:', errorMessage);
        res.status(500).json({
            success: false,
            status: 'rejected',
            errors: [{
                    code: 'INTERNAL_ERROR',
                    message: 'An internal error occurred during submission',
                }],
            submittedAt: Date.now(),
        });
    }
});
/**
 * Check RTI submission status
 */
exports.checkRTIStatus = (0, https_1.onRequest)({
    cors: true,
    secrets: [hmrcClientId, hmrcClientSecret],
}, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const { submissionId, employerPAYEReference, environment, accessToken, companyId } = req.body;
        if (!submissionId || !employerPAYEReference || !accessToken || !companyId) {
            res.status(400).json({ error: 'Missing required fields: submissionId, employerPAYEReference, accessToken, companyId' });
            return;
        }
        // SECURITY: Verify Firebase ID token and owner/admin role for this company
        const decoded = await (0, verifyFirebaseAuth_1.requireFirebaseAuthAndHMRCRole)(req, res, companyId);
        if (!decoded)
            return;
        const baseUrl = environment === 'production'
            ? 'https://api.service.hmrc.gov.uk'
            : 'https://test-api.service.hmrc.gov.uk';
        const employerRef = encodeURIComponent(employerPAYEReference);
        const endpoint = `${baseUrl}/paye/employers/${employerRef}/submissions/${submissionId}`;
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            res.status(response.status).json({
                error: 'Failed to check submission status',
                details: errorText,
            });
            return;
        }
        const statusData = await response.json();
        res.status(200).json({ success: true, status: statusData });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[HMRC RTI] Status check error:', errorMessage);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * Get HMRC OAuth authorization URL
 * Client ID comes from Firebase Secrets, not from client
 */
exports.getHMRCAuthUrl = (0, https_1.onRequest)({
    cors: true,
    secrets: [hmrcClientId],
}, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // SECURITY: Verify Firebase ID token - only authenticated users can get HMRC auth URL
        const decoded = await (0, verifyFirebaseAuth_1.requireFirebaseAuth)(req, res);
        if (!decoded)
            return;
        const { redirectUri, environment, scope, state } = req.body;
        if (!redirectUri) {
            res.status(400).json({ error: 'Missing redirectUri' });
            return;
        }
        const clientId = hmrcClientId.value();
        if (!clientId) {
            res.status(500).json({ error: 'HMRC Client ID not configured on server' });
            return;
        }
        const baseUrl = environment === 'production'
            ? 'https://api.service.hmrc.gov.uk'
            : 'https://test-api.service.hmrc.gov.uk';
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            redirect_uri: redirectUri,
            scope: scope || 'write:paye-employer-paye-employer',
            state: state || Math.random().toString(36).substring(2, 15),
        });
        const authUrl = `${baseUrl}/oauth/authorize?${params.toString()}`;
        res.status(200).json({
            success: true,
            authUrl,
            state: params.get('state'),
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[HMRC Auth] Error generating auth URL:', errorMessage);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//# sourceMappingURL=hmrcRTISubmission.js.map
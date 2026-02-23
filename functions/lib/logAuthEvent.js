"use strict";
/**
 * Auth Event Logging (ISO 27001 A.12, SOC 2 CC7)
 *
 * Writes to authEvents/{logId} - super-admin only access, not in frontend.
 * Retention: 12 months.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuthEventPublic = exports.logAuthEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const admin_1 = require("./admin");
const AUTH_EVENTS_RETENTION_DAYS = 365; // 12 months
/**
 * Mask email for privacy (e.g. user@example.com -> u***@e***.com)
 */
function maskEmail(email) {
    var _a;
    if (!email || !email.includes('@'))
        return '***';
    const [local, domain] = email.split('@');
    if (!local || !domain)
        return '***';
    const maskedLocal = local.charAt(0) + '***';
    const domainParts = domain.split('.');
    const maskedDomain = ((_a = domainParts[0]) === null || _a === void 0 ? void 0 : _a.charAt(0)) + '***.' + (domainParts.slice(1).join('.') || '');
    return `${maskedLocal}@${maskedDomain}`;
}
/**
 * logAuthEvent - Callable (for login_success, logout when user is authenticated)
 */
exports.logAuthEvent = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const data = request.data;
    if (!(data === null || data === void 0 ? void 0 : data.action) || !['login_success', 'logout'].includes(data.action)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid action for authenticated log');
    }
    const uid = request.auth.uid;
    const email = ((_a = request.auth.token) === null || _a === void 0 ? void 0 : _a.email) || undefined;
    const now = Date.now();
    const expiresAt = now + AUTH_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const entry = {
        action: data.action,
        userId: uid,
        userEmailMasked: email ? maskEmail(email) : undefined,
        timestamp: now,
        userAgent: typeof ((_c = (_b = request.rawRequest) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['user-agent']) === 'string'
            ? request.rawRequest.headers['user-agent'].substring(0, 200) : undefined,
        retentionDays: AUTH_EVENTS_RETENTION_DAYS,
        expiresAt,
    };
    const ref = admin_1.db.ref('authEvents').push();
    await ref.set(entry);
    return { success: true, id: ref.key };
});
/**
 * logAuthEventPublic - HTTP (for login_failure when user is NOT authenticated)
 */
exports.logAuthEventPublic = (0, https_2.onRequest)({ cors: true }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const body = req.body;
        if (!(body === null || body === void 0 ? void 0 : body.action) || body.action !== 'login_failure') {
            res.status(400).json({ error: 'Invalid payload: action must be login_failure' });
            return;
        }
        const now = Date.now();
        const expiresAt = now + AUTH_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        const entry = {
            action: 'login_failure',
            userId: null,
            userEmailMasked: body.emailMasked || '***',
            errorCode: typeof body.errorCode === 'string' ? body.errorCode.substring(0, 50) : undefined,
            timestamp: now,
            userAgent: typeof req.headers['user-agent'] === 'string'
                ? req.headers['user-agent'].substring(0, 200) : undefined,
            retentionDays: AUTH_EVENTS_RETENTION_DAYS,
            expiresAt,
        };
        const ref = admin_1.db.ref('authEvents').push();
        await ref.set(entry);
        res.status(200).json({ success: true, id: ref.key });
    }
    catch (error) {
        console.error('[logAuthEventPublic] Error:', error);
        res.status(500).json({ error: 'Failed to log auth event' });
    }
});
//# sourceMappingURL=logAuthEvent.js.map
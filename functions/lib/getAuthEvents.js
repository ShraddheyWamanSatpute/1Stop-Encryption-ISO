"use strict";
/**
 * getAuthEvents - Callable Cloud Function for super-admins
 * Reads authEvents from RTDB (Admin SDK only). Clients cannot read authEvents directly.
 * Requires custom claim: auth.token.superAdmin === true
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthEvents = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("./admin");
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 2000;
exports.getAuthEvents = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const superAdmin = ((_a = request.auth.token) === null || _a === void 0 ? void 0 : _a.superAdmin) === true;
    if (!superAdmin) {
        throw new https_1.HttpsError('permission-denied', 'Super-admin access required to read auth events');
    }
    const params = (request.data || {});
    const limit = Math.min(typeof params.limit === 'number' ? params.limit : DEFAULT_LIMIT, MAX_LIMIT);
    const authEventsRef = admin_1.db.ref('authEvents');
    let query = authEventsRef.orderByChild('timestamp').limitToLast(limit);
    if (params.startAt != null || params.endAt != null) {
        const startAt = typeof params.startAt === 'number' ? params.startAt : 0;
        const endAt = typeof params.endAt === 'number' ? params.endAt : Date.now();
        query = authEventsRef.orderByChild('timestamp').startAt(startAt).endAt(endAt).limitToLast(limit);
    }
    const snapshot = await query.once('value');
    const raw = snapshot.val() || {};
    let events = Object.entries(raw).map(([id, v]) => (Object.assign({ id }, v)));
    if (params.action && ['login_success', 'login_failure', 'logout'].includes(params.action)) {
        events = events.filter((e) => e.action === params.action);
    }
    // Sort by timestamp descending (newest first)
    events.sort((a, b) => {
        var _a, _b;
        const ta = (_a = a.timestamp) !== null && _a !== void 0 ? _a : 0;
        const tb = (_b = b.timestamp) !== null && _b !== void 0 ? _b : 0;
        return tb - ta;
    });
    return {
        events,
        count: events.length,
    };
});
//# sourceMappingURL=getAuthEvents.js.map
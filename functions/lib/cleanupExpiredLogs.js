"use strict";
/**
 * Scheduled cleanup of expired audit logs and auth events
 * Runs daily at 3 AM UTC. Retention: auditLogs per company, authEvents 12 months.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredLogs = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin_1 = require("./admin");
const AUTH_EVENTS_RETENTION_MS = 365 * 24 * 60 * 60 * 1000; // 12 months
/**
 * Clean up expired auth events (authEvents)
 */
async function cleanupAuthEvents() {
    const now = Date.now();
    const cutoff = now - AUTH_EVENTS_RETENTION_MS;
    const snapshot = await admin_1.db.ref('authEvents').orderByChild('expiresAt').endAt(cutoff).once('value');
    const val = snapshot.val();
    if (!val)
        return 0;
    let deleted = 0;
    const updates = {};
    for (const key of Object.keys(val)) {
        updates[`authEvents/${key}`] = null;
        deleted++;
    }
    if (deleted > 0) {
        await admin_1.db.ref().update(updates);
    }
    return deleted;
}
/**
 * Clean up expired audit logs per company
 * auditLogs/$companyId/$logId - each entry has expiresAt
 */
async function cleanupAuditLogs() {
    const companiesSnapshot = await admin_1.db.ref('auditLogs').once('value');
    const companies = companiesSnapshot.val();
    if (!companies)
        return 0;
    const now = Date.now();
    let totalDeleted = 0;
    for (const companyId of Object.keys(companies)) {
        const logs = companies[companyId];
        if (!logs || typeof logs !== 'object')
            continue;
        const updates = {};
        for (const [logId, log] of Object.entries(logs)) {
            if (log && typeof log === 'object' && log.expiresAt != null && log.expiresAt < now) {
                updates[`auditLogs/${companyId}/${logId}`] = null;
                totalDeleted++;
            }
        }
        if (Object.keys(updates).length > 0) {
            await admin_1.db.ref().update(updates);
        }
    }
    return totalDeleted;
}
exports.cleanupExpiredLogs = (0, scheduler_1.onSchedule)({
    schedule: '0 3 * * *',
    timeZone: 'UTC',
}, async () => {
    const authDeleted = await cleanupAuthEvents();
    const auditDeleted = await cleanupAuditLogs();
    console.log(`[cleanupExpiredLogs] Deleted ${authDeleted} auth events, ${auditDeleted} audit logs`);
});
//# sourceMappingURL=cleanupExpiredLogs.js.map
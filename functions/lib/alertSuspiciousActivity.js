"use strict";
/**
 * Alerting for suspicious activity
 * Triggers on authEvents (login_failure) and optionally on auditLogs (e.g. permission_change).
 * Sends to configurable webhook URL (Slack, PagerDuty, etc.) via ALERT_WEBHOOK_URL env var.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAuthEventCreated = void 0;
const database_1 = require("firebase-functions/v2/database");
const params_1 = require("firebase-functions/params");
const alertWebhookUrl = (0, params_1.defineString)('ALERT_WEBHOOK_URL', { default: '' });
async function sendWebhookAlert(payload) {
    const url = alertWebhookUrl.value();
    if (!url)
        return;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            console.warn('[alertSuspiciousActivity] Webhook returned', res.status, await res.text());
        }
    }
    catch (err) {
        console.error('[alertSuspiciousActivity] Webhook failed:', err);
    }
}
/**
 * Slack-friendly format
 */
function formatSlackMessage(event) {
    const action = event.action || 'unknown';
    const text = action === 'login_failure'
        ? `:warning: *Login failure* - ${event.userEmailMasked || 'unknown'} (${event.errorCode || 'N/A'})`
        : `:eyes: *Auth event* - ${action}`;
    return {
        text: 'Security Alert',
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `${text}\nTimestamp: ${event.timestamp ? new Date(event.timestamp).toISOString() : 'N/A'}`,
                },
            },
        ],
    };
}
/**
 * Trigger on new auth events - alert on login_failure
 */
exports.onAuthEventCreated = (0, database_1.onValueCreated)({ ref: 'authEvents/{logId}' }, async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.val();
    if (!data || data.action !== 'login_failure')
        return;
    const payload = formatSlackMessage(data);
    await sendWebhookAlert(payload);
});
//# sourceMappingURL=alertSuspiciousActivity.js.map
/**
 * Alerting for suspicious activity
 * Triggers on authEvents (login_failure) and optionally on auditLogs (e.g. permission_change).
 * Sends to configurable webhook URL (Slack, PagerDuty, etc.) via ALERT_WEBHOOK_URL env var.
 */

import { onValueCreated } from 'firebase-functions/v2/database';
import { defineString } from 'firebase-functions/params';

const alertWebhookUrl = defineString('ALERT_WEBHOOK_URL', { default: '' });

async function sendWebhookAlert(payload: Record<string, unknown>): Promise<void> {
  const url = alertWebhookUrl.value();
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[alertSuspiciousActivity] Webhook returned', res.status, await res.text());
    }
  } catch (err) {
    console.error('[alertSuspiciousActivity] Webhook failed:', err);
  }
}

/**
 * Slack-friendly format
 */
function formatSlackMessage(event: Record<string, unknown>): Record<string, unknown> {
  const action = (event.action as string) || 'unknown';
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
          text: `${text}\nTimestamp: ${event.timestamp ? new Date(event.timestamp as number).toISOString() : 'N/A'}`,
        },
      },
    ],
  };
}

/**
 * Trigger on new auth events - alert on login_failure
 */
export const onAuthEventCreated = onValueCreated(
  { ref: 'authEvents/{logId}' },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.val();
    if (!data || data.action !== 'login_failure') return;

    const payload = formatSlackMessage(data);
    await sendWebhookAlert(payload);
  }
);

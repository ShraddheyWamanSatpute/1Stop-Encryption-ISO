# Uptime & Availability Monitoring Setup

**Standards:** ISO 27001 A.17, SOC 2 Availability
**Status:** Implemented — health check endpoints deployed; external monitoring to be configured.

---

## Implemented Health Check Endpoints

### 1. Firebase Functions Health Check
- **Endpoint:** `https://<region>-<project-id>.cloudfunctions.net/healthCheck`
- **File:** `functions/src/healthCheck.ts`
- **Checks:** Database connectivity, Storage availability, Functions status
- **Response:** `{ status: "healthy" | "degraded" | "unhealthy", checks: {...}, durationMs: ... }`
- **HTTP Status:** 200 (healthy/degraded), 503 (unhealthy)

### 2. Simple Ping Endpoint
- **Endpoint:** `https://<region>-<project-id>.cloudfunctions.net/ping`
- **File:** `functions/src/healthCheck.ts`
- **Response:** `{ status: "ok", timestamp: "...", service: "1Stop" }`
- **Use:** Basic uptime check (low latency, no downstream checks)

### 3. YourStop Backend Health Check
- **Endpoint:** `https://<yourstop-host>/health`
- **File:** `src/yourstop/backend/index.ts`
- **Response:** `{ status: "healthy", timestamp: "...", version: "..." }`

---

## Recommended External Monitoring Services

Configure one or more of the following to poll the health check endpoints:

| Service | Free Tier | Interval | Alerting |
|---------|-----------|----------|----------|
| UptimeRobot | 50 monitors, 5-min | 5 min | Email, Slack, webhook |
| Google Cloud Monitoring | Included with GCP | 1 min | Email, PagerDuty, Slack |
| Pingdom | Trial | 1 min | Email, SMS, Slack |
| Better Uptime | 10 monitors | 3 min | Email, Slack, PagerDuty |

### Recommended Configuration

1. **Primary monitor:** Poll `/healthCheck` every 5 minutes.
   - Alert if HTTP status is not 200 for 2 consecutive checks.
   - Alert channels: email + Slack (or PagerDuty for on-call).

2. **Secondary monitor:** Poll `/ping` every 1 minute (lightweight).
   - Alert if down for 3+ minutes.

3. **YourStop monitor:** Poll `/health` every 5 minutes.

---

## Google Cloud Monitoring (Built-in)

If using Firebase on GCP, enable uptime checks via Cloud Console:

1. Go to **Monitoring > Uptime checks** in Google Cloud Console.
2. Click **Create Uptime Check**.
3. Set:
   - **Resource type:** URL
   - **Hostname:** Your Cloud Functions URL
   - **Path:** `/healthCheck`
   - **Check frequency:** 5 minutes
   - **Response validation:** Status code 200
4. Configure alerting policy (email, Slack, PagerDuty).

---

## Alerting on Suspicious Activity

**File:** `functions/src/alertSuspiciousActivity.ts`

Triggers on `authEvents` (e.g., `login_failure`). Sends alerts to a configurable webhook URL (`ALERT_WEBHOOK_URL` environment variable). Supports Slack-compatible payloads.

### Setup:
```bash
firebase functions:secrets:set ALERT_WEBHOOK_URL
# Paste your Slack incoming webhook URL
```

---

## Monitoring Checklist (Auditor Reference)

- [x] Health check endpoint deployed (`healthCheck`, `ping`)
- [x] Database, storage, and functions health verified in endpoint
- [x] HTTP 503 returned on unhealthy status
- [x] Suspicious activity alerting implemented (`alertSuspiciousActivity`)
- [ ] External uptime monitor configured (UptimeRobot / GCP Monitoring)
- [ ] Alert channels configured (email + Slack/PagerDuty)
- [ ] Incident response runbook references monitoring alerts

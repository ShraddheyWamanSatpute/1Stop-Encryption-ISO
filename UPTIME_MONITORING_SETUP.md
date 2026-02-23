# Uptime Monitoring Setup Guide

**Purpose:** External uptime monitoring for ISO 27001 A.17, SOC 2 Availability  
**Tool:** UptimeRobot (Free Tier)  
**Date:** February 2025

---

## Overview

This guide sets up external uptime monitoring using UptimeRobot to monitor 1Stop application availability. External monitoring provides independent verification of uptime, which is required for SOC 2 Availability compliance.

---

## 1. Health Check Endpoints

### Endpoints Available

**Ping Endpoint (Simple):**
```
https://{region}-{project}.cloudfunctions.net/ping
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-02-06T10:00:00Z",
  "service": "1Stop"
}
```

**Health Check Endpoint (Full):**
```
https://{region}-{project}.cloudfunctions.net/healthCheck
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-06T10:00:00Z",
  "checks": {
    "database": { "status": "ok", "responseTimeMs": 45 },
    "storage": { "status": "ok" },
    "functions": { "status": "ok" }
  },
  "version": "dailyBackup"
}
```

**HTTP Status Codes:**
- `200` - Healthy or Degraded
- `503` - Unhealthy

---

## 2. UptimeRobot Setup

### Step 1: Create Account

1. Go to https://uptimerobot.com
2. Click "Sign Up" (free tier)
3. Verify email address

### Step 2: Add Ping Monitor

1. **Dashboard** → **Add New Monitor**

2. **Monitor Configuration:**
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `1Stop Ping`
   - **URL:** `https://{region}-{project}.cloudfunctions.net/ping`
     - Replace `{region}` with your Firebase Functions region (e.g., `europe-west1`)
     - Replace `{project}` with your Firebase project ID (e.g., `stop-test-8025f`)
     - Example: `https://europe-west1-stop-test-8025f.cloudfunctions.net/ping`
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** Add your email address

3. **Click "Create Monitor"**

### Step 3: Add Health Check Monitor

1. **Dashboard** → **Add New Monitor**

2. **Monitor Configuration:**
   - **Monitor Type:** HTTP(s) - Keyword
   - **Friendly Name:** `1Stop Health Check`
   - **URL:** `https://{region}-{project}.cloudfunctions.net/healthCheck`
   - **Keyword:** `"status":"healthy"`
   - **Keyword Type:** Exists
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** Add your email address

3. **Click "Create Monitor"**

### Step 4: Configure Alerts

1. **My Settings** → **Alert Contacts**
2. **Add Alert Contact:**
   - **Type:** Email
   - **Email:** Your email address
   - **Alert When:** Down, Up, Paused
3. **Save**

### Step 5: Test Monitoring

1. **Temporarily break health check** (for testing):
   - Modify health check endpoint to return error
   - Or stop Firebase Functions
2. **Wait 5 minutes** (monitoring interval)
3. **Verify alert received** via email
4. **Restore health check**
5. **Verify "Up" alert received**

---

## 3. Google Cloud Monitoring (Optional)

### Setup Uptime Check

1. **Google Cloud Console** → **Monitoring** → **Uptime Checks**

2. **Create Uptime Check:**
   - **Title:** `1Stop Health Check`
   - **Resource Type:** URL
   - **URL:** `https://{region}-{project}.cloudfunctions.net/healthCheck`
   - **Check Frequency:** 1 minute
   - **Regions:** Multiple regions (for redundancy)

3. **Create Alert Policy:**
   - **Condition:** Uptime check fails
   - **Notification Channels:** Email, SMS, PagerDuty, etc.
   - **Alert Name:** `1Stop Health Check Failure`

---

## 4. Monitoring Dashboard

### Metrics to Track

**Uptime Metrics:**
- Uptime percentage (target: 99.9%)
- Downtime incidents
- Average response time

**Health Check Metrics:**
- Database response time (target: < 200ms)
- Storage availability
- Functions availability

**Backup Metrics:**
- Backup success rate (target: 100%)
- Backup size trends
- Backup duration

### Dashboard Setup

**UptimeRobot Dashboard:**
- View uptime percentage
- View downtime history
- View response times
- Export reports

**Google Cloud Monitoring Dashboard:**
- Create custom dashboard
- Add uptime check metrics
- Add health check metrics
- Add backup metrics

---

## 5. Alerting Configuration

### UptimeRobot Alerts

**Free Tier Includes:**
- Email alerts
- 50 monitors
- 5-minute check interval

**Paid Tier Options:**
- SMS alerts
- Slack webhooks
- PagerDuty integration
- 1-minute check interval

### Alert Thresholds

**Critical Alerts:**
- Health check returns `503` (unhealthy)
- Health check timeout (> 30 seconds)
- Database check fails

**Warning Alerts:**
- Health check returns `200` but `"status":"degraded"`
- Database response time > 500ms
- Storage check fails

---

## 6. Monitoring Best Practices

### Regular Reviews

- **Daily:** Check uptime dashboard
- **Weekly:** Review downtime incidents
- **Monthly:** Review uptime percentage
- **Quarterly:** Review and optimize monitoring

### Documentation

- Document all downtime incidents
- Track root causes
- Document resolution steps
- Update DR plan based on incidents

### Continuous Improvement

- Optimize health check endpoints
- Add additional monitoring points
- Improve alerting thresholds
- Enhance monitoring dashboards

---

## 7. Compliance Evidence

### For Auditors

**Uptime Monitoring Evidence:**
- UptimeRobot dashboard screenshots
- Uptime percentage reports
- Downtime incident logs
- Alert logs

**Health Check Evidence:**
- Health check endpoint responses
- Health check logs
- Database connectivity logs
- Storage connectivity logs

**Backup Monitoring Evidence:**
- Backup success logs
- Backup metadata
- Restore test results

---

## 8. Troubleshooting

### Health Check Returns 503

**Possible Causes:**
- Database connectivity issue
- Storage connectivity issue
- Functions error

**Resolution:**
1. Check Firebase Console → Functions → Logs
2. Check database connectivity
3. Check storage bucket access
4. Review health check code

### UptimeRobot Not Receiving Responses

**Possible Causes:**
- Incorrect URL
- CORS issues
- Firewall blocking
- Function not deployed

**Resolution:**
1. Verify URL is correct
2. Test URL manually (curl)
3. Check CORS configuration
4. Verify function deployed

### False Alerts

**Possible Causes:**
- Temporary network issues
- Scheduled maintenance
- Health check timeout too short

**Resolution:**
1. Review alert logs
2. Adjust monitoring interval
3. Add alert cooldown period
4. Document false alerts

---

## 9. Maintenance

### Regular Tasks

- **Weekly:** Review uptime dashboard
- **Monthly:** Review downtime incidents
- **Quarterly:** Review monitoring configuration
- **Annually:** Review and update monitoring plan

### Updates

- Update monitoring URLs if functions change
- Update alert contacts if team changes
- Update thresholds based on performance
- Document all changes

---

## Summary

✅ **Setup Complete:**
- Health check endpoints deployed
- UptimeRobot monitors configured
- Alerts configured
- Monitoring dashboard accessible

**Next Steps:**
1. Test monitoring (temporarily break health check)
2. Verify alerts received
3. Review uptime dashboard regularly
4. Document downtime incidents

**Compliance Status:**
- ✅ ISO 27001 A.17: Uptime monitoring implemented
- ✅ SOC 2 Availability: External monitoring configured

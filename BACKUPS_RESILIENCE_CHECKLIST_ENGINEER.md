# Backups, Resilience & Availability — Engineer Confirmation Checklist

**Certs:** ISO 27001, SOC 2  
**Standards:** ISO 27001 A.17, SOC 2 Availability  
**Scope:** 1Stop main app (YourStop excluded)

Use this checklist to confirm each requirement. Tick when verified.

---

## 1. [ ] Automated encrypted backups

**Requirement:** Backups run automatically and are encrypted at rest.

**Implementation status:** ✅ Implemented in code

| Item | Status | Evidence |
|------|--------|----------|
| Automated schedule | ✅ | `functions/src/backupService.ts` — `dailyBackup` scheduled at **02:00 UTC** (`schedule: '0 2 * * *'`) |
| What is backed up | ✅ | Realtime Database (full), Storage manifest, Config metadata |
| Where stored | ✅ | Google Cloud Storage bucket `1stop-backups` |
| Encryption at rest | ✅ | GCS default: Google-managed encryption. Metadata `encrypted: 'true'` in backup files |
| Retention cleanup | ✅ | `backupRetentionCleanup.ts` — daily at 03:00 UTC (90d daily, 12mo monthly, 6y yearly) |

**Engineer confirmation:**

- [ ] GCS bucket `1stop-backups` created and configured (multi-region EU, encryption on)
- [ ] Functions deployed: `dailyBackup`, `backupRetentionCleanup`
- [ ] At least one successful backup run (check `backups/metadata/` in RTDB or GCS `backups/daily/`)

**Reference:** `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` §1, `BACKUPS_QUICK_START.md`

---

## 2. [ ] Backup restore tested

**Requirement:** Restore from backup has been tested (auditors will ask for evidence).

**Implementation status:** ✅ Procedure and code in place

| Item | Status | Evidence |
|------|--------|----------|
| Restore capability | ✅ | `functions/src/backupRestore.ts` — `restoreFromBackup`, `listAvailableBackups` (admin/super-admin only) |
| Dry-run support | ✅ | `restoreFromBackup({ backupPath, dryRun: true })` to validate without restoring |
| Procedure documented | ✅ | Quarterly restore test steps in `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` §3 |
| Restore logs | ✅ | Each restore written to `backups/restoreLogs` in RTDB |

**Engineer confirmation:**

- [ ] First restore test performed (e.g. list backups → dry run → optional restore to test path)
- [ ] Result documented (date, backup used, outcome, any issues)
- [ ] Quarterly restore test scheduled (e.g. calendar reminder every 3 months)

**Reference:** `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` §3, `DISASTER_RECOVERY_PLAN.md` §4

---

## 3. [ ] Disaster recovery procedures exist

**Requirement:** Documented DR plan and procedures.

**Implementation status:** ✅ Complete

| Item | Status | Evidence |
|------|--------|----------|
| DR plan document | ✅ | `DISASTER_RECOVERY_PLAN.md` — RTO 4h, RPO 24h, scope, review date |
| Scenarios covered | ✅ | 5 scenarios: DB corruption, accidental deletion, region outage, Firebase outage, ransomware |
| Step-by-step procedures | ✅ | Recovery steps per scenario with restore commands and verification |
| Testing schedule | ✅ | Quarterly restore tests, annual DR drill (or every 6 months) |

**Engineer confirmation:**

- [ ] `DISASTER_RECOVERY_PLAN.md` reviewed and contact/ownership sections updated if needed
- [ ] Team knows where the plan is and how to run a restore
- [ ] Annual (or 6‑monthly) DR drill planned and documented when done

**Reference:** `DISASTER_RECOVERY_PLAN.md`

---

## 4. [ ] Uptime / availability monitoring

**Requirement:** Uptime and availability are monitored.

**Implementation status:** ✅ Implemented in code and documented

| Item | Status | Evidence |
|------|--------|----------|
| Health endpoints | ✅ | `functions/src/healthCheck.ts` — `healthCheck` (full), `ping` (simple) |
| Database check | ✅ | `checkDatabase()` — RTDB `.info/serverTimeOffset` |
| Storage check | ✅ | `checkStorage()` — default bucket exists |
| HTTP status | ✅ | 200 healthy/degraded, 503 unhealthy |
| External monitoring | ✅ | `UPTIME_MONITORING_SETUP.md` — UptimeRobot setup (free tier) |
| Optional: GCP monitoring | ✅ | Doc mentions Cloud Monitoring uptime check + alerting |

**Engineer confirmation:**

- [ ] Functions deployed: `healthCheck`, `ping`
- [ ] Endpoints tested: e.g. `curl …/ping` and `curl …/healthCheck`
- [ ] UptimeRobot (or equivalent) configured: ping + health check monitors, alerts set
- [ ] (Optional) Google Cloud Monitoring uptime check and alert policy configured

**Reference:** `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` §5, `UPTIME_MONITORING_SETUP.md`

---

## 5. [ ] No single point of failure

**Requirement:** Single points of failure are identified and either mitigated or accepted with documentation.

**Implementation status:** ⚠️ Documented (not fully eliminated)

| Item | Status | Evidence |
|------|--------|----------|
| Risk documented | ✅ | Single project, single region, single DB, single bucket called out in implementation doc |
| Mitigations in place | ✅ | Automated backups, retention, restore procedure, health monitoring |
| Multi-region | ⚠️ | Recommended but optional; single region acceptable if risk is documented |
| Official position | ✅ | “Single region acceptable for current maturity; multi-region recommended when feasible” |

**Engineer confirmation:**

- [ ] Read “Single Point of Failure Assessment” in `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` §6
- [ ] Accept single-region/single-DB risk for now, or plan multi-region/multi-DB
- [ ] If staying single region: ensure risk acceptance is recorded (e.g. in DR plan or risk register)

**Reference:** `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` §6

---

## Summary for sign-off

| # | Requirement | Code/Docs | Engineer action |
|---|-------------|-----------|------------------|
| 1 | Automated encrypted backups | ✅ | Create bucket, deploy, verify one backup |
| 2 | Backup restore tested | ✅ | Run first restore test, document, schedule quarterly |
| 3 | Disaster recovery procedures exist | ✅ | Review DR plan, assign owner, schedule DR drill |
| 4 | Uptime / availability monitoring | ✅ | Deploy health endpoints, configure UptimeRobot (+ optional GCP) |
| 5 | No single point of failure | ⚠️ Documented | Confirm risk acceptance or plan multi-region |

**Standards reference:**  
- ISO 27001 A.17 (Information security aspects of business continuity management)  
- SOC 2 Availability (availability and monitoring criteria)

When all “Engineer confirmation” boxes above are done, the **Backups, Resilience & Availability** control set can be marked **complete** for ISO 27001 A.17 and SOC 2 Availability.

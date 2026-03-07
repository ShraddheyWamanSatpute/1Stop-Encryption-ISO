# Backup Restore Test Checklist (Engineer)

**Standards:** ISO 27001 A.17, SOC 2 Availability
**Schedule:** Quarterly (minimum), or after any backup infrastructure change.
**Owner:** Engineering lead or designated SRE.

---

## Pre-Test Preparation

- [ ] Identify the backup to test (latest daily backup recommended)
- [ ] Confirm test environment is available (separate Firebase project or isolated path)
- [ ] Ensure you have admin access to run `restoreFromBackup` callable
- [ ] Document the backup timestamp and source path

---

## Test Procedure

### Step 1: List Available Backups

```bash
# Via Firebase callable (or Firebase Console)
firebase functions:call listAvailableBackups --data '{}'
```

- [ ] Backups are listed with timestamps and sizes
- [ ] Latest backup is within expected schedule (e.g., last 24 hours)

### Step 2: Dry-Run Restore

```bash
# Restore to a test path WITHOUT overwriting production data
firebase functions:call restoreFromBackup --data '{
  "backupId": "<backup-id>",
  "dryRun": true,
  "targetPath": "restore_test/<timestamp>"
}'
```

- [ ] Dry run completes without errors
- [ ] Output shows what would be restored (path, record counts)

### Step 3: Actual Restore to Test Path

```bash
firebase functions:call restoreFromBackup --data '{
  "backupId": "<backup-id>",
  "dryRun": false,
  "targetPath": "restore_test/<timestamp>"
}'
```

- [ ] Restore completes successfully
- [ ] Restore log entry created at `backups/restoreLogs`
- [ ] Restored data matches expected structure

### Step 4: Verify Restored Data

- [ ] Spot-check 3-5 records in the restored path (e.g., companies, users, HR data)
- [ ] Verify encrypted fields are still properly encrypted (not corrupted)
- [ ] Verify tenant/company isolation is maintained in restored data
- [ ] Confirm record counts match source backup

### Step 5: Cleanup

- [ ] Delete test restore path: `restore_test/<timestamp>`
- [ ] Verify no test data remains in production paths

---

## Post-Test Documentation

Record the following for audit evidence:

| Field | Value |
|-------|-------|
| Test date | |
| Backup ID / timestamp | |
| Backup source | |
| Dry-run result | Pass / Fail |
| Restore result | Pass / Fail |
| Data verification result | Pass / Fail |
| Records verified (count) | |
| Time to restore (minutes) | |
| Tester name | |
| Next scheduled test | |

---

## Backup Infrastructure Summary

| Component | Implementation | File |
|-----------|----------------|------|
| Automated backups | Firebase scheduled function | `functions/src/backupService.ts` |
| Backup storage | Google Cloud Storage (AES-256 at rest) | GCS bucket |
| Backup restore | Firebase callable function | `functions/src/backupRestore.ts` |
| Retention cleanup | Scheduled cleanup function | `functions/src/backupRetentionCleanup.ts` |
| DR plan | Documented procedures | `DISASTER_RECOVERY_PLAN.md` |

---

## Failure Scenarios to Test (Annually)

- [ ] Restore after simulated database corruption (restore full backup)
- [ ] Restore after accidental deletion of a company's data (selective restore)
- [ ] Verify backup encryption integrity (download raw backup, confirm encrypted)
- [ ] Test RTO compliance (restore within 4 hours as per DR plan)

---

## Escalation

If restore fails:
1. Check Cloud Functions logs for error details
2. Verify backup file exists in GCS bucket
3. Check IAM permissions for the restore function
4. Contact Firebase support if GCS access issues persist
5. Follow `DISASTER_RECOVERY_PLAN.md` escalation procedures

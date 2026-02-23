# Backups, Resilience & Availability - Quick Start

**Standards:** ISO 27001 A.17, SOC 2 Availability  
**Estimated Setup Time:** 30-45 minutes

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Google Cloud Storage Bucket

```bash
# Create multi-region bucket with encryption
gsutil mb -p stop-test-8025f -c STANDARD -l EU gs://1stop-backups

# Enable versioning
gsutil versioning set on gs://1stop-backups

# Set lifecycle policy (optional - for cost optimization)
gsutil lifecycle set lifecycle.json gs://1stop-backups
```

**Note:** Replace `stop-test-8025f` with your Firebase project ID.

### Step 2: Install Dependencies

```bash
cd functions
npm install
```

This installs `@google-cloud/storage` package.

### Step 3: Configure Backup Bucket Name (Optional)

If using a different bucket name:

```bash
firebase functions:secrets:set BACKUP_BUCKET_NAME
# Enter: 1stop-backups
```

Or set environment variable in Firebase Console → Functions → Configuration.

### Step 4: Deploy Functions

```bash
cd functions
npm run build
firebase deploy --only functions:dailyBackup,functions:backupRetentionCleanup,functions:healthCheck,functions:ping,functions:restoreFromBackup,functions:listAvailableBackups
```

### Step 5: Verify Deployment

1. **Check Scheduled Functions:**
   - Firebase Console → Functions → Scheduled
   - Verify `dailyBackup` scheduled (02:00 UTC daily)
   - Verify `backupRetentionCleanup` scheduled (03:00 UTC daily)

2. **Test Health Check:**
   ```bash
   curl https://europe-west1-stop-test-8025f.cloudfunctions.net/ping
   # Expected: {"status":"ok","timestamp":"...","service":"1Stop"}
   ```

3. **Test Full Health Check:**
   ```bash
   curl https://europe-west1-stop-test-8025f.cloudfunctions.net/healthCheck
   # Expected: {"status":"healthy","checks":{...}}
   ```

4. **Verify First Backup:**
   - Wait for 02:00 UTC (or trigger manually)
   - Check Google Cloud Storage: `gs://1stop-backups/backups/daily/`
   - Check backup metadata: Firebase Console → Realtime Database → `backups/metadata/`

---

## 📊 Setup UptimeRobot (10 Minutes)

### 1. Create Account
- Go to https://uptimerobot.com
- Sign up (free tier)

### 2. Add Ping Monitor
- **Monitor Type:** HTTP(s)
- **URL:** `https://{region}-{project}.cloudfunctions.net/ping`
- **Interval:** 5 minutes
- **Alerts:** Your email

### 3. Add Health Check Monitor
- **Monitor Type:** HTTP(s) - Keyword
- **URL:** `https://{region}-{project}.cloudfunctions.net/healthCheck`
- **Keyword:** `"status":"healthy"`
- **Interval:** 5 minutes
- **Alerts:** Your email

### 4. Test Alerts
- Temporarily break health check
- Wait 5 minutes
- Verify alert received
- Restore health check

---

## ✅ Verification Checklist

- [ ] Google Cloud Storage bucket created (`1stop-backups`)
- [ ] Bucket configured as multi-region
- [ ] Functions deployed successfully
- [ ] Scheduled functions visible in Firebase Console
- [ ] Health check endpoint responds (`/ping` and `/healthCheck`)
- [ ] First backup completed (check after 02:00 UTC)
- [ ] Backup files visible in Google Cloud Storage
- [ ] UptimeRobot monitors configured
- [ ] Alerts tested and working

---

## 🔧 Manual Backup Trigger (Testing)

To test backup immediately without waiting for schedule:

```bash
# Via Firebase Console
# Functions → dailyBackup → Test → Trigger

# Or via gcloud CLI
gcloud functions call dailyBackup --region=europe-west1
```

---

## 📝 Next Steps

1. **Perform First Restore Test:**
   - Call `listAvailableBackups()` to see backups
   - Perform dry run restore
   - Document results

2. **Schedule Quarterly Restore Tests:**
   - Set calendar reminder (every 3 months)
   - Document test results
   - Update DR plan if needed

3. **Monitor Backup Success:**
   - Check `backups/metadata/` daily
   - Set up alerts for backup failures
   - Review backup sizes and trends

4. **Annual DR Drill:**
   - Schedule annual DR test
   - Test full database restore
   - Document recovery time
   - Update DR plan

---

## 🆘 Troubleshooting

### Backup Not Running

**Check:**
- Scheduled function exists in Firebase Console
- Function logs for errors
- Google Cloud Storage permissions
- Bucket name configuration

### Health Check Returns 503

**Check:**
- Database connectivity
- Storage bucket access
- Function logs for errors
- Network connectivity

### Backup Files Not Appearing

**Check:**
- Google Cloud Storage bucket exists
- Bucket name matches configuration
- IAM permissions for Cloud Functions
- Function logs for errors

---

## 📚 Documentation

- **Full Implementation:** `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md`
- **DR Plan:** `DISASTER_RECOVERY_PLAN.md`
- **Monitoring Setup:** `UPTIME_MONITORING_SETUP.md`

---

**Status:** ✅ Ready for deployment

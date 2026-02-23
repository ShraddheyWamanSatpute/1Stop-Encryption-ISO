# HMRC Connection - Quick Start (2 Minutes)

## 🚀 Fast Track Connection

### Step 1: Open Settings
**HR** → **Settings** → **HMRC Integration** tab

### Step 2: Enter Details
- **PAYE Reference**: `123/AB45678` (from HMRC letters/payslips)
- **Accounts Office Reference**: `123PA00012345` (from HMRC letters)
- Click **"Save Settings"**

### Step 3: Connect
- Click **"Connect to HMRC"**
- You'll be redirected to **Government Gateway** (HMRC's login system)
- **For Testing:** Use your test user credentials from HMRC Developer Hub
  - Go to https://developer.service.hmrc.gov.uk/api-test-user to create test users
  - Use the **User ID** and **Password** provided for your test user
- **For Production:** Use your real Government Gateway credentials (same as HMRC online services)
- Click **"Authorize"** on the permission screen
- Done! ✅

**Important Notes:**

1. **JavaScript Errors on Test Login Page:** If you see JavaScript errors on the Government Gateway test login page (like 404 errors for govuk-frontend/all.js), these are known issues on HMRC's test environment. The login should still work - just ignore the console errors and try logging in.

2. **CORS Error Fix:** The OAuth token exchange must happen server-side (via Firebase Functions) because HMRC's token endpoint doesn't support CORS from browsers. The code automatically uses a Firebase Cloud Function for this. Make sure your Firebase Functions are deployed or the emulator is running for development.

---

## 📍 Where to Find Your Details

| Detail | Where to Find |
|--------|---------------|
| **PAYE Reference** | HMRC letters, payslips, HMRC online account |
| **Accounts Office Reference** | HMRC letters, HMRC online account |
| **Government Gateway Login** | **Test:** Create test users at https://developer.service.hmrc.gov.uk/api-test-user<br>**Production:** Your existing Government Gateway account (same as HMRC online services) |

---

## 🔐 What is Government Gateway?

**Government Gateway** is HMRC's authentication system used to securely log into HMRC services. It's the same login system used for:
- HMRC online services
- Self Assessment
- VAT returns
- PAYE Online

**For Testing:**
- Create test users at: https://developer.service.hmrc.gov.uk/api-test-user
- Select "Organisation" user type (for PAYE/RTI testing)
- Use the provided **User ID** and **Password** on the Government Gateway login page

**For Production:**
- Use your existing Government Gateway account (the same one you use for HMRC online services)
- Must have access to your PAYE scheme

## ⚠️ About JavaScript Errors on Test Login Page

If you see errors like:
- `404 (Not Found)` for `govuk-frontend/all.js`
- `MIME type ('text/html') is not executable`
- JavaScript initialization errors

**These are known issues on HMRC's test environment** and won't prevent you from logging in. The page may look broken, but the login form should still work. Simply:
1. Ignore the browser console errors
2. Enter your User ID and Password
3. Click "Sign in"
4. The login should proceed normally

## ❓ Need Help?

Click the **"Connection Guide"** button in the top-right of the HMRC Settings page for detailed instructions.

---

**That's it!** Your payroll will now automatically submit to HMRC. 🎉


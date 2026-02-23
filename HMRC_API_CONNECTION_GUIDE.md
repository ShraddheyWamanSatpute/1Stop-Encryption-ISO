# HMRC API Connection Guide - Easy Step-by-Step

## 🎯 Quick Start

This guide will help you connect your HMRC account to our payroll software in **5 simple steps**.

---

## ✅ Prerequisites

Before you start, make sure you have:
- ✅ Your **PAYE Reference** (format: `123/AB45678`)
- ✅ Your **Accounts Office Reference** (format: `123PA00012345`)
- ✅ Access to your **HMRC Government Gateway** account
- ✅ Admin access to your company's HR settings

---

## 📋 Step-by-Step Connection

### Step 1: Navigate to HMRC Settings

1. Go to **HR** → **Settings** → **HMRC Integration** tab
2. You'll see the HMRC Integration Settings page

### Step 2: Choose Configuration Level

1. In the **"Configuration Level"** section, select where to store your settings:
   - **Company**: Apply to all sites/subsites
   - **Site**: Apply to this site only
   - **Subsite**: Apply to this subsite only

2. The system will show where your current settings are stored (if any)

### Step 3: Enter Your HMRC Details

Fill in the **"Employer Identification"** section:

1. **PAYE Reference**
   - Format: `###/AB######` (e.g., `123/AB45678`)
   - Found on your HMRC correspondence
   - The office number (first 3 digits) will be extracted automatically

2. **Accounts Office Reference**
   - Format: `###PA########` (e.g., `123PA00012345`)
   - Found on your HMRC correspondence

3. **HMRC Office Number**
   - Auto-filled from your PAYE Reference
   - First 3 digits of your PAYE Reference

4. **Optional Fields** (if applicable):
   - Corporation Tax Reference (CT UTR)
   - VAT Registration Number

### Step 4: Save Your Settings

1. Click the **"Save Settings"** button at the bottom of the page
2. Wait for the success message: "HMRC settings saved successfully!"
3. Your basic settings are now saved

### Step 5: Connect to HMRC

1. In the **"HMRC Connection"** section, click **"Connect to HMRC"**
2. You'll be redirected to HMRC's authorization page
3. **Log in** with your Government Gateway credentials
4. **Authorize** our application to access your PAYE data
5. You'll be redirected back to our system
6. You'll see: **"Successfully Connected!"**

---

## 🎉 You're Done!

Once connected, you'll see:
- ✅ **Green "Connected"** status in the HMRC Connection section
- ✅ Your payroll can now be automatically submitted to HMRC
- ✅ RTI submissions (FPS/EPS) will work automatically

---

## 📸 Visual Guide

### Settings Page Layout

```
┌─────────────────────────────────────────┐
│  HMRC Integration Settings               │
├─────────────────────────────────────────┤
│                                          │
│  [Configuration Level]                  │
│  ┌─────────────────────────────────┐    │
│  │ Settings Level: [Subsite ▼]    │    │
│  │ ✓ Settings found at: subsite   │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [HMRC Connection]                      │
│  ┌─────────────────────────────────┐    │
│  │ Status: [Connected ✓]            │    │
│  │ [Connect to HMRC] [Refresh Token]│    │
│  └─────────────────────────────────┘    │
│                                          │
│  [Employer Identification]               │
│  ┌─────────────────────────────────┐    │
│  │ PAYE Reference: [123/AB45678]  │    │
│  │ AO Reference: [123PA00012345]   │    │
│  └─────────────────────────────────┘    │
│                                          │
│  [Save Settings]                        │
└─────────────────────────────────────────┘
```

---

## 🔍 Finding Your HMRC Details

### Where to Find Your PAYE Reference

Your PAYE Reference is usually found on:
- HMRC correspondence letters
- Your payslips (as employer reference)
- HMRC online account
- P60 forms

**Format:** `123/AB45678`
- First part: Office number (3 digits)
- Second part: Employer reference (letters and numbers)

### Where to Find Your Accounts Office Reference

Your Accounts Office Reference is usually found on:
- HMRC correspondence letters
- Your HMRC online account
- Employer Payment Summary (EPS) forms

**Format:** `123PA00012345`
- First 3 digits: Office number
- "PA" prefix
- Followed by numbers

---

## ⚠️ Common Issues & Solutions

### Issue: "HMRC settings not configured"

**Solution:**
1. Make sure you've completed Step 3 (Enter Your HMRC Details)
2. Click "Save Settings" before connecting
3. Verify all required fields are filled

### Issue: "OAuth credentials not configured"

**Solution:**
- This is a platform-level setting
- Contact your platform administrator
- They need to set up the master HMRC application credentials

### Issue: "Authorization failed"

**Solution:**
1. Make sure you're using the correct Government Gateway account
2. The account must have access to your PAYE scheme
3. Try logging out and back into Government Gateway
4. Clear your browser cache and try again

### Issue: "Token expired"

**Solution:**
1. Click the **"Refresh Token"** button
2. This will automatically renew your connection
3. No need to re-authorize

### Issue: "PAYE Reference format incorrect"

**Solution:**
- Check the format: `###/AB######`
- Make sure there's a forward slash `/` in the middle
- No spaces allowed
- Example: `123/AB45678` ✅ (correct)
- Example: `123 AB45678` ❌ (incorrect - has space)

### Issue: "Can't select Subsite level"

**Solution:**
- Make sure you've selected a Site first
- Then select a Subsite
- The Subsite option will only be available when a subsite is selected

---

## 🔐 Security & Privacy

### What We Access

When you connect to HMRC, you authorize us to:
- ✅ Submit RTI data (FPS/EPS) on your behalf
- ✅ Read your PAYE scheme information
- ✅ Submit payroll data to HMRC

### What We DON'T Access

We **cannot**:
- ❌ Access your personal tax information
- ❌ View your bank account details
- ❌ Make payments on your behalf
- ❌ Change your HMRC account settings

### Token Security

- Your OAuth tokens are **encrypted** and stored securely
- Tokens are **company-specific** (each company has their own)
- Tokens **expire automatically** and can be refreshed
- You can **disconnect** at any time

---

## 🔄 Reconnecting After Disconnection

If you need to reconnect:

1. Go to **HR** → **Settings** → **HMRC Integration**
2. Click **"Connect to HMRC"** again
3. Follow the authorization steps
4. Your connection will be restored

---

## 📞 Need Help?

### Support Resources

1. **In-App Help**: Click the `?` icon next to any field for tooltips
2. **HMRC Help**: Visit [HMRC Developer Hub](https://developer.service.hmrc.gov.uk/)
3. **Platform Support**: Contact your platform administrator

### Before Contacting Support

Please have ready:
- Your PAYE Reference
- Your Accounts Office Reference
- Screenshot of any error messages
- What step you were on when the issue occurred

---

## ✅ Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Selected configuration level (Company/Site/Subsite)
- [ ] Entered PAYE Reference (format: `###/AB######`)
- [ ] Entered Accounts Office Reference (format: `###PA########`)
- [ ] Saved settings (saw success message)
- [ ] Clicked "Connect to HMRC"
- [ ] Logged into Government Gateway
- [ ] Authorized the application
- [ ] Saw "Successfully Connected!" message
- [ ] Green "Connected" status displayed

---

## 🎓 Advanced Settings

### Environment Selection

- **Sandbox**: For testing (recommended for first-time setup)
- **Production**: For live payroll submissions

**Note:** Start with Sandbox to test, then switch to Production when ready.

### Auto-Submit Settings

- **Auto-Submit FPS**: Automatically submit payroll to HMRC after approval
- **Require Approval**: Require manual approval before submission

**Recommendation:** Enable "Require Approval" for the first few submissions to verify everything works correctly.

---

## 🚀 Next Steps After Connection

Once connected, you can:

1. **Run Payroll**: Calculate payroll as normal
2. **Approve Payroll**: Approve payroll records
3. **Auto-Submit**: Payroll automatically submits to HMRC (if enabled)
4. **Manual Submit**: Or submit manually from RTI Submission tab
5. **View Submissions**: Check submission status and history

---

## 📝 Quick Reference

### Required Information
- PAYE Reference: `123/AB45678`
- Accounts Office Reference: `123PA00012345`

### Connection Steps
1. Settings → HMRC Integration
2. Enter HMRC details
3. Save settings
4. Connect to HMRC
5. Authorize

### Status Indicators
- 🟢 **Connected**: Ready to submit
- 🟡 **Expired**: Click "Refresh Token"
- ⚪ **Not Connected**: Click "Connect to HMRC"

---

## 🎉 Success!

You've successfully connected your HMRC account! Your payroll can now be automatically submitted to HMRC, ensuring compliance with UK payroll regulations.

**Need help?** Check the troubleshooting section above or contact support.

---

*Last updated: 2024*


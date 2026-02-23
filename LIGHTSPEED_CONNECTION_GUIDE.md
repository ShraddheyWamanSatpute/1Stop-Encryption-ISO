# Lightspeed Connection Guide - Quick Start

This guide will walk you through connecting your Lightspeed Retail account to 1Stop in just 5 simple steps.

---

## 🚀 Quick Connection (5 Steps)

### Step 1: Register as a Developer

1. Go to [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
2. Click **"Sign Up"** or **"Register"**
3. Create your developer account
   - **Note:** This is separate from your Lightspeed Retail account
   - Use any email address
4. Verify your email address

**Time:** ~2 minutes

---

### Step 2: Create Your Application

1. After logging in, go to **"Applications"** or **"My Apps"**
2. Click **"Create New Application"** or **"Add Application"**
3. Select **"Lightspeed Retail (X-Series)"** as the platform
4. Fill in the details:
   - **Application Name:** `1Stop Integration` (or any name you prefer)
   - **Description:** (Optional) `Integration with 1Stop business management system`
5. Click **"Create"** or **"Save"**

**Time:** ~1 minute

---

### Step 3: Configure Redirect URI

1. In your application settings, find the **"Redirect URI"** or **"Callback URL"** field
2. Copy this exact URL from your 1Stop settings page:
   ```
   https://yourdomain.com/oauth/callback/lightspeed
   ```
   Or for local development:
   ```
   http://localhost:5173/oauth/callback/lightspeed
   ```
3. Paste it into the Redirect URI field in Lightspeed
4. Click **"Save"** or **"Update"**

**⚠️ Important:** The redirect URI must match **exactly** (including http/https and port number)

**Time:** ~1 minute

---

### Step 4: Get Your Credentials

1. In your Lightspeed application page, you'll see:
   - **Client ID** - Usually visible immediately
   - **Client Secret** - May need to click "Show" or "Reveal" to see it

2. **Copy both values** - You'll need them in the next step

**🔒 Security Note:** Keep your Client Secret secure! Don't share it publicly.

**Time:** ~30 seconds

---

### Step 5: Connect in 1Stop

1. Go to **Stock Settings** or **POS Settings** in 1Stop
2. Find the **"Lightspeed Retail Integration"** section
3. Enter your credentials:
   - Paste your **Client ID** into the first field
   - Paste your **Client Secret** into the second field
   - Verify the **Redirect URI** matches what you set in Lightspeed
4. Click **"Connect to Lightspeed"**
5. You'll be redirected to Lightspeed to authorize
6. Click **"Authorize"** or **"Allow"** in Lightspeed
7. You'll be redirected back to 1Stop automatically
8. You should see **"Connected"** status

**Time:** ~2 minutes

---

## ✅ You're Done!

Once connected, you can:
- Configure what to sync (products, sales, inventory, customers)
- Set up automatic syncing
- Click "Sync Now" to perform a manual sync

---

## 🎯 Visual Guide

### Where to Find Credentials in Lightspeed

```
Lightspeed Developer Portal
└── Applications
    └── Your Application Name
        ├── Client ID: [visible here]
        ├── Client Secret: [click "Show" to reveal]
        └── Redirect URI: [paste your URI here]
```

### Where to Enter Credentials in 1Stop

```
1Stop Application
└── Stock Settings (or POS Settings)
    └── Lightspeed Retail Integration
        ├── Client ID: [paste here]
        ├── Client Secret: [paste here]
        └── Redirect URI: [auto-filled, verify it matches]
```

---

## ❓ Common Issues & Solutions

### Issue: "Invalid redirect_uri"

**Solution:**
- Make sure the redirect URI in Lightspeed matches exactly what's shown in 1Stop
- Check for http vs https
- Check for port numbers (localhost:5173 vs localhost:3000)
- Make sure there are no extra spaces or characters

### Issue: "Invalid client_id"

**Solution:**
- Double-check you copied the Client ID correctly
- Make sure there are no extra spaces before/after
- Try copying again from Lightspeed Developer Portal

### Issue: "Invalid client_secret"

**Solution:**
- Make sure you clicked "Show" or "Reveal" to see the full secret
- Copy the entire secret (it's usually long)
- Check for any hidden characters or spaces

### Issue: Authorization page doesn't appear

**Solution:**
- Make sure you clicked "Connect to Lightspeed" button
- Check your browser isn't blocking popups
- Try in a different browser
- Make sure you're logged into Lightspeed Developer Portal

### Issue: "Connection failed" after authorization

**Solution:**
- Check your internet connection
- Try disconnecting and reconnecting
- Make sure your redirect URI is set correctly
- Contact support if the issue persists

---

## 🔐 Security Best Practices

1. **Never share your Client Secret** publicly or in emails
2. **Use different applications** for development and production
3. **Rotate secrets** if you suspect they've been compromised
4. **Keep credentials secure** - treat them like passwords

---

## 📞 Need Help?

### Lightspeed Support
- [Lightspeed Developer Portal](https://developers.lightspeedhq.com)
- [Lightspeed API Documentation](https://developers.lightspeedhq.com/retail/endpoints/)
- [Lightspeed Support](https://support.lightspeedhq.com)

### 1Stop Support
- Check the in-app guide (click "Step-by-Step Connection Guide")
- Review error messages for specific issues
- Contact your system administrator

---

## 🎓 Understanding the Connection

### What Happens When You Connect?

1. **Authorization Request:** 1Stop sends you to Lightspeed to authorize
2. **You Authorize:** You grant 1Stop permission to access your Lightspeed data
3. **Token Exchange:** Lightspeed gives 1Stop access tokens
4. **Connection Established:** 1Stop can now sync data from your Lightspeed account

### What Data Can Be Synced?

- ✅ **Products** - Import products from Lightspeed to your stock system
- ✅ **Sales** - Import sales transactions to your POS system
- ✅ **Inventory** - Sync inventory levels
- ⬜ **Customers** - (Coming soon)

### Is My Data Safe?

- Yes! The connection uses OAuth 2.0, an industry-standard secure authentication method
- 1Stop only accesses data you explicitly authorize
- You can disconnect at any time
- Your credentials are stored securely

---

## 🔄 After Connection

### Configure Sync Settings

1. Choose what to sync:
   - ✅ Products
   - ✅ Sales
   - ✅ Inventory
   - ⬜ Customers (optional)

2. Set up automatic syncing (optional):
   - Enable auto-sync
   - Choose sync interval (15 min, 30 min, 1 hour, 4 hours, daily)

3. Click **"Save Settings"**

### Perform Your First Sync

1. Click **"Sync Now"** button
2. Wait for sync to complete
3. Check sync results:
   - Number of products synced
   - Number of sales synced
   - Any errors (if any)

### Monitor Sync Status

- **Idle** - Not currently syncing
- **Syncing** - Sync in progress
- **Success** - Last sync completed successfully
- **Error** - Last sync had errors (check error message)

---

## 📋 Checklist

Use this checklist to ensure you've completed all steps:

- [ ] Registered at Lightspeed Developer Portal
- [ ] Created a Lightspeed Retail (X-Series) application
- [ ] Set redirect URI in Lightspeed app settings
- [ ] Copied Client ID from Lightspeed
- [ ] Copied Client Secret from Lightspeed
- [ ] Entered Client ID in 1Stop
- [ ] Entered Client Secret in 1Stop
- [ ] Verified redirect URI matches
- [ ] Clicked "Connect to Lightspeed"
- [ ] Authorized the connection in Lightspeed
- [ ] Confirmed "Connected" status in 1Stop
- [ ] Configured sync settings
- [ ] Performed first sync

---

**Last Updated:** [Current Date]
**Estimated Total Time:** ~7 minutes

---

## 🎉 Success!

If you see the "Connected" status with a green checkmark, you're all set! Your Lightspeed account is now connected and ready to sync data.


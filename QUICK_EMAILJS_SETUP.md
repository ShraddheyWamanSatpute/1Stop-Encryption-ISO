# ⚡ Quick EmailJS Setup - 5 Minutes

## 🎯 The 400 Error You're Seeing

That's because EmailJS isn't configured yet! Here's how to fix it:

## 🚀 Super Fast Setup

### Step 1: Create FREE Account (2 minutes)
1. Go to: **https://www.emailjs.com/**
2. Click **"Sign Up"** (FREE!)
3. Verify your email

### Step 2: Add Email Service (1 minute)
1. In dashboard, click **"Email Services"**
2. Click **"Add New Service"**
3. Choose **Gmail** (easiest)
4. Click "Connect Account" and sign in
5. **Copy the Service ID** (looks like: `service_abc123`)

### Step 3: Create Template (1 minute)
1. Click **"Email Templates"**
2. Click **"Create New Template"**
3. Paste this template:

```
To: {{to_email}}
From: {{from_name}}
Subject: {{subject}}

{{message}}
```

4. Save it
5. **Copy the Template ID** (looks like: `template_xyz456`)

### Step 4: Get Public Key (30 seconds)
1. Click **"Account"** in sidebar
2. Find **"General"** tab
3. **Copy your Public Key** (looks like: `pk_abc123def456`)

### Step 5: Update Your Code (30 seconds)

Open: `src/backend/utils/emailSender.ts`

Find this:
```typescript
const EMAILJS_CONFIG = {
  serviceId: 'your_service_id',
  templateId: 'your_template_id',
  publicKey: 'your_public_key'
};
```

Replace with YOUR values:
```typescript
const EMAILJS_CONFIG = {
  serviceId: 'service_abc123',      // Your Service ID here
  templateId: 'template_xyz456',    // Your Template ID here
  publicKey: 'pk_abc123def456'      // Your Public Key here
};
```

### Step 6: Test! (immediate)
1. **Save the file**
2. **Refresh your browser**
3. Go to **Bookings → Settings**
4. Scroll to **"Send Test Email"**
5. Enter your email
6. Click **"Send Test"**
7. ✅ **Done!**

## 📝 Example Configuration

```typescript
const EMAILJS_CONFIG = {
  serviceId: 'service_9k2l4m6',
  templateId: 'template_h7j9k2l',
  publicKey: 'pk_xY7Zw3Uv5'
};
```

## ❓ Where to Find Things

| Item | Location in EmailJS Dashboard |
|------|-------------------------------|
| Service ID | Email Services → Click on your service |
| Template ID | Email Templates → Click on your template |
| Public Key | Account → General → Public Key section |

## 🎉 That's It!

No more:
- ❌ 400 errors
- ❌ Configuration needed
- ❌ OAuth complexity
- ❌ Firestore setup

Just:
- ✅ 5-minute setup
- ✅ FREE account
- ✅ Works immediately

## 💡 Current Status

You'll see this error until you configure:
```
EmailJS not configured yet! 

Please follow these steps:
1. Sign up FREE at https://www.emailjs.com/
2. Create an email service and template
3. Update the config in src/backend/utils/emailSender.ts
```

After configuration, it just works! 🚀

## 📊 What You Get

- 500 emails/month (FREE)
- No credit card required
- Simple 3-line config
- Works immediately
- No backend needed

## 🔗 Quick Link

Start here: **https://www.emailjs.com/**

**Total time: 5 minutes**
**Cost: FREE**
**Complexity: Super simple**


# 🔧 Firebase Authentication Fix Guide

## 🚨 Current Issue
**Error**: `auth/configuration-not-found` when trying to sign in with Google, Apple, or Facebook.

## 🔍 Root Cause
The authentication providers are not properly configured in your Firebase Console. This is a common issue when setting up Firebase authentication for the first time.

## ✅ Step-by-Step Fix

### 1. Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `studio-3045449262-19c49`
3. Navigate to **Authentication** in the left sidebar

### 2. Enable Authentication Providers

#### **Google Sign-In**
1. Click on **Sign-in method** tab
2. Find **Google** in the provider list
3. Click on **Google** to configure
4. Toggle **Enable** to ON
5. Add your **Project support email** (required)
6. Click **Save**

#### **Apple Sign-In**
1. Find **Apple** in the provider list
2. Click on **Apple** to configure
3. Toggle **Enable** to ON
4. You'll need:
   - **Services ID** (from Apple Developer Console)
   - **Apple Team ID** (from Apple Developer Console)
   - **Key ID** (from Apple Developer Console)
   - **Private Key** (from Apple Developer Console)
5. Click **Save**

#### **Facebook Login**
1. Find **Facebook** in the provider list
2. Click on **Facebook** to configure
3. Toggle **Enable** to ON
4. You'll need:
   - **App ID** (from Facebook Developer Console)
   - **App Secret** (from Facebook Developer Console)
5. Click **Save**

### 3. Configure Authorized Domains
1. In Authentication → Settings → Authorized domains
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (when deployed)
   - `studio-3045449262-19c49.firebaseapp.com`

### 4. Test the Configuration

#### **Quick Test (Google Only)**
1. Go to your app: `http://localhost:9002/auth`
2. Click **Continue with Google**
3. You should see a Google sign-in popup

#### **If Google Still Doesn't Work**
1. Check browser console for detailed error messages
2. Ensure popups are allowed in your browser
3. Try in an incognito/private window

## 🛠️ Alternative: Use Email/Password Only

If you want to test the app without setting up social logins:

### 1. Enable Email/Password Authentication
1. In Firebase Console → Authentication → Sign-in method
2. Find **Email/Password**
3. Toggle **Enable** to ON
4. Click **Save**

### 2. Test Email/Password Login
1. Go to `http://localhost:9002/auth`
2. Use the email/password form
3. Create a new account or sign in

## 🔧 Development Workaround

For immediate testing, you can temporarily disable social login buttons:

### Option 1: Hide Social Login Buttons
Edit `src/app/auth/page.tsx` and comment out the social login buttons:

```tsx
{/* Temporarily hide social login for testing */}
{/* 
<div className="space-y-3">
  <Button onClick={() => handleSocialLogin(googleProvider, 'Google')}>
    Continue with Google
  </Button>
  // ... other social buttons
</div>
*/}
```

### Option 2: Use Phone Authentication
Phone authentication should work without additional configuration:
1. Go to `http://localhost:9002/auth`
2. Click "Or continue with phone number"
3. Enter your phone number
4. Complete SMS verification

## 📱 Testing Checklist

- [ ] Firebase Console → Authentication → Sign-in method
- [ ] Google provider enabled with support email
- [ ] Authorized domains include `localhost`
- [ ] Browser allows popups
- [ ] No ad blockers interfering
- [ ] Test in incognito mode

## 🚀 Production Setup

When you're ready for production:

### 1. Get OAuth Credentials

#### **Google OAuth**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://yourdomain.com`
   - `https://studio-3045449262-19c49.firebaseapp.com`

#### **Facebook OAuth**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs
5. Get App ID and App Secret

#### **Apple OAuth**
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Create Services ID
3. Configure Sign in with Apple
4. Generate private key
5. Get Team ID and Key ID

### 2. Update Firebase Configuration
Add the OAuth credentials to your Firebase Console for each provider.

## 🆘 Still Having Issues?

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for detailed error messages
4. Share the error details for further help

### Common Solutions
1. **Clear browser cache** and try again
2. **Disable browser extensions** temporarily
3. **Try different browser** (Chrome, Firefox, Safari)
4. **Check network connectivity**
5. **Verify Firebase project is active**

### Debug Mode
Add this to your `firebase.ts` for detailed logging:

```typescript
// Add this for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase config:', firebaseConfig);
  console.log('Auth domain:', firebaseConfig.authDomain);
}
```

## ✅ Success Indicators

When properly configured, you should see:
- Google sign-in popup opens
- Apple sign-in popup opens (on supported devices)
- Facebook sign-in popup opens
- No `auth/configuration-not-found` errors
- Successful authentication and redirect to homepage

Your authentication should work perfectly after following these steps! 🎉
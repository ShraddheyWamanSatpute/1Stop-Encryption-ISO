# 🔥 Complete Firebase Setup Guide for BookMyTable

This guide will help you set up Firebase for Authentication, Hosting, Notifications, and Realtime Database.

## 📋 Prerequisites

1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Google account
3. Node.js and npm installed

## 🚀 Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Project name: `BookMyTable`
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Enable Required Services

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable the following providers:
   - ✅ Email/Password
   - ✅ Google
   - ✅ Facebook
   - ✅ Apple (if needed)
   - ✅ Phone (optional)

#### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to your users

#### Realtime Database
1. Go to Realtime Database
2. Click "Create database"
3. Choose "Start in test mode"
4. Select a location close to your users

#### Storage
1. Go to Storage
2. Click "Get started"
3. Choose "Start in test mode"
4. Select a location close to your users

#### Cloud Messaging (Notifications)
1. Go to Cloud Messaging
2. No additional setup needed for basic notifications

## 🔧 Step 2: Get Firebase Configuration

### 2.1 Web App Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" > Web app
4. App nickname: `BookMyTable Web`
5. Copy the configuration object

### 2.2 Update Configuration
Replace the placeholder values in `src/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  projectId: 'bookmytable-ea37d',
  appId: 'your-actual-app-id',
  storageBucket: 'bookmytable-ea37d.firebasestorage.app',
  apiKey: 'your-actual-api-key',
  authDomain: 'bookmytable-ea37d.firebaseapp.com',
  databaseURL: 'https://bookmytable-ea37d-default-rtdb.firebaseio.com',
  measurementId: 'your-measurement-id', // Optional
  messagingSenderId: '1049141485409',
};
```

## 🔐 Step 3: Security Rules Setup

### 3.1 Firestore Rules
The rules are already configured in `firestore.rules`. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### 3.2 Realtime Database Rules
The rules are already configured in `database.rules.json`. Deploy them:

```bash
firebase deploy --only database
```

### 3.3 Storage Rules
The rules are already configured in `storage.rules`. Deploy them:

```bash
firebase deploy --only storage
```

## 📱 Step 4: Push Notifications Setup

### 4.1 Service Worker
The service worker is already configured in `public/firebase-messaging-sw.js`.

### 4.2 VAPID Keys
1. Go to Project Settings > Cloud Messaging
2. Scroll down to "Web configuration"
3. Generate a new key pair
4. Copy the key pair

### 4.3 Update Service Worker
Add your VAPID key to `public/firebase-messaging-sw.js`:

```javascript
// Replace with your actual VAPID key
const vapidKey = 'your-vapid-key-here';
```

## 🚀 Step 5: Deploy Everything

### 5.1 Build and Deploy
```bash
# Build the app
npm run build

# Deploy all services
firebase deploy

# Or deploy individually
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only database
firebase deploy --only storage
```

## 🧪 Step 6: Testing

### 6.1 Local Testing with Emulators
```bash
# Start all emulators
firebase emulators:start

# Or start specific emulators
firebase emulators:start --only auth,firestore,database,storage
```

### 6.2 Test URLs
- **App**: http://localhost:5000
- **Emulator UI**: http://localhost:4000
- **Auth Emulator**: http://localhost:9099
- **Firestore Emulator**: http://localhost:8080
- **Database Emulator**: http://localhost:9000
- **Storage Emulator**: http://localhost:9199

## 📊 Step 7: Monitoring and Analytics

### 7.1 Firebase Analytics
1. Go to Analytics > Events
2. Monitor user interactions
3. Set up custom events

### 7.2 Performance Monitoring
1. Go to Performance
2. Monitor app performance
3. Set up custom traces

### 7.3 Crashlytics
1. Go to Crashlytics
2. Monitor app crashes
3. Set up crash reporting

## 🔧 Step 8: Environment Variables

Create a `.env.local` file for sensitive configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bookmytable-ea37d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bookmytable-ea37d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bookmytable-ea37d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1049141485409
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://bookmytable-ea37d-default-rtdb.firebaseio.com
```

## 🎯 Step 9: Features You Can Use

### Authentication
- ✅ Email/Password login
- ✅ Google OAuth
- ✅ Facebook OAuth
- ✅ Apple OAuth
- ✅ Phone authentication
- ✅ Password reset
- ✅ Email verification

### Database
- ✅ Firestore for structured data (restaurants, bookings, users)
- ✅ Realtime Database for real-time features (live availability, notifications)
- ✅ Offline support
- ✅ Real-time listeners

### Storage
- ✅ Image uploads
- ✅ File storage
- ✅ CDN delivery

### Notifications
- ✅ Push notifications
- ✅ In-app notifications
- ✅ Email notifications (with Functions)

### Hosting
- ✅ Static site hosting
- ✅ Custom domain
- ✅ SSL certificates
- ✅ CDN

## 🚨 Important Security Notes

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Test security rules** thoroughly
4. **Monitor usage** and set up billing alerts
5. **Regular security audits** of your rules

## 📞 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Review security rules
3. Check browser console for client-side errors
4. Use Firebase Emulator for local debugging

## 🎉 You're All Set!

Your BookMyTable app now has:
- ✅ User authentication
- ✅ Real-time database
- ✅ Push notifications
- ✅ File storage
- ✅ Secure hosting
- ✅ Scalable infrastructure

Happy coding! 🚀

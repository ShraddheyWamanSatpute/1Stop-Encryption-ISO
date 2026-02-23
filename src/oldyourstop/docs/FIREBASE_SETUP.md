# 🔥 Firebase Setup Guide for DineEase

This guide will help you set up Firebase for authentication, hosting, notifications, and real-time database for your DineEase restaurant booking platform.

## 📋 Prerequisites

1. **Firebase Account**: Create a free account at [firebase.google.com](https://firebase.google.com)
2. **Node.js**: Version 18 or higher
3. **Firebase CLI**: Install globally with `npm install -g firebase-tools`

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Project
```bash
firebase init
```

Select the following services:
- ✅ **Firestore**: Database for real-time data
- ✅ **Storage**: File uploads (profile pictures, ID documents)
- ✅ **Hosting**: Web app deployment
- ✅ **Functions**: Server-side logic (optional)
- ✅ **Emulators**: Local development

### 4. Configure Firebase Services

#### Firestore Database
- **Rules**: Use the provided `firestore.rules`
- **Indexes**: Use the provided `firestore.indexes.json`

#### Storage
- **Rules**: Use the provided `storage.rules`

#### Hosting
- **Public directory**: `out` (for Next.js static export)
- **Single Page App**: Yes
- **Automatic builds**: No (we'll build manually)

## 🔧 Configuration Files

### Firebase Configuration (`src/lib/firebase.ts`)
✅ **Already configured** with your project settings:
- Project ID: `studio-3045449262-19c49`
- Authentication providers: Google, Apple, Facebook, Phone
- Firestore, Storage, Functions, and Messaging initialized

### Security Rules
✅ **Already created**:
- `firestore.rules` - Database security rules
- `storage.rules` - File upload security rules

### Hosting Configuration
✅ **Already created**:
- `firebase.json` - Hosting and deployment configuration
- Service worker for notifications

## 🛠️ Development Commands

### Start Development Server
```bash
npm run dev
```

### Start Firebase Emulators (Optional)
```bash
npm run firebase:emulators
```
This starts local emulators for:
- Authentication (port 9099)
- Firestore (port 8080)
- Storage (port 9199)
- Functions (port 5001)
- Hosting (port 5000)
- Emulator UI (port 4000)

## 🚀 Deployment Commands

### Build for Production
```bash
npm run build
```

### Deploy to Firebase
```bash
# Deploy everything
npm run firebase:deploy

# Deploy specific services
npm run firebase:deploy:hosting
npm run firebase:deploy:firestore
npm run firebase:deploy:storage
npm run firebase:deploy:functions
```

## 📱 Firebase Services Setup

### 1. Authentication
✅ **Already configured** with:
- Email/Password authentication
- Google Sign-In
- Apple Sign-In
- Facebook Login
- Phone number authentication

**To enable social logins:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google, Apple, Facebook providers
3. Add your OAuth credentials

### 2. Firestore Database
✅ **Already configured** with:
- Security rules for user data protection
- Indexes for optimal query performance
- Real-time listeners for live updates

**Collections structure:**
- `users` - User profiles and preferences
- `restaurants` - Restaurant information
- `bookings` - Reservation data
- `favorites` - User favorite restaurants
- `reviews` - Restaurant reviews
- `paymentMethods` - Saved payment methods
- `ageVerifications` - Age verification documents
- `notifications` - Push notifications

### 3. Storage
✅ **Already configured** for:
- Profile picture uploads
- Age verification document uploads
- Restaurant image uploads

**Storage structure:**
```
/users/{userId}/profile/ - Profile pictures
/users/{userId}/verification/ - ID documents
/restaurants/{restaurantId}/ - Restaurant images
/uploads/{userId}/ - General uploads
```

### 4. Cloud Messaging (Notifications)
✅ **Service worker created** for push notifications

**To enable notifications:**
1. Go to Firebase Console → Project Settings → Cloud Messaging
2. Generate a VAPID key
3. Update `src/lib/firebase-service.ts` with your VAPID key
4. Configure notification permissions in your app

### 5. Hosting
✅ **Already configured** for:
- Static site hosting
- Custom domain support
- CDN distribution
- HTTPS by default

## 🔒 Security Features

### Firestore Security Rules
- Users can only access their own data
- Public read access for restaurants and reviews
- Admin-only access for sensitive operations
- Real-time validation

### Storage Security Rules
- File type validation (images only)
- Size limits (5MB for profiles, 10MB for documents)
- User-specific access control
- Admin upload capabilities

## 📊 Monitoring & Analytics

### Firebase Analytics (Optional)
To enable analytics, add to your `firebase.ts`:
```typescript
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);
```

### Performance Monitoring
Monitor your app's performance with Firebase Performance Monitoring.

## 🧪 Testing

### Local Testing
1. Start emulators: `npm run firebase:emulators`
2. Update `firebase.ts` to use emulators in development
3. Test all features locally

### Production Testing
1. Deploy to staging: `firebase hosting:channel:deploy preview`
2. Test on staging environment
3. Deploy to production: `npm run firebase:deploy`

## 🚨 Important Notes

### Environment Variables
Create a `.env.local` file for sensitive configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

### VAPID Key for Notifications
Generate a VAPID key in Firebase Console and update the service.

### Domain Configuration
Configure your custom domain in Firebase Hosting for production.

## 🆘 Troubleshooting

### Common Issues
1. **Authentication not working**: Check OAuth credentials in Firebase Console
2. **Storage uploads failing**: Verify storage rules and file types
3. **Notifications not received**: Check VAPID key and service worker
4. **Build errors**: Ensure all dependencies are installed

### Support
- Firebase Documentation: [firebase.google.com/docs](https://firebase.google.com/docs)
- Firebase Console: [console.firebase.google.com](https://console.firebase.google.com)

## ✅ Verification Checklist

- [ ] Firebase project created and configured
- [ ] Authentication providers enabled
- [ ] Firestore database created with rules
- [ ] Storage bucket created with rules
- [ ] Hosting configured
- [ ] Service worker for notifications
- [ ] Local development working
- [ ] Production deployment successful

Your DineEase platform is now ready for production with full Firebase integration! 🎉
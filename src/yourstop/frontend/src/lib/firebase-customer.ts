// Separate Firebase configuration for customer authentication and database
// This is completely separate from the main app's Firebase instance

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { APP_KEYS } from '../../../../config/keys';

// Helper to read environment variables (same pattern as keys.ts)
const readEnv = (key: string, fallback?: string): string => {
  const env = (import.meta as { env?: Record<string, string> })?.env || {};
  return String(env[key] ?? fallback ?? '');
};

// Get customer Firebase config from environment variables
const customerApiKey = readEnv('VITE_CUSTOMER_FIREBASE_API_KEY') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_API_KEY');
const isPlaceholderKey = !customerApiKey || customerApiKey === 'AIzaSyCustomerKey123';

// Placeholder/default values that must never be used in production (Section 1.5)
const PLACEHOLDER_VALUES = new Set([
  'AIzaSyCustomerKey123', 'bookmytable-customers', '1:1049141485409:web:customer123',
  'G-CUSTOMER123', 'bookmytable-customers.firebaseapp.com', 'bookmytable-customers.firebasestorage.app',
  'https://bookmytable-customers-default-rtdb.firebaseio.com',
]);
const isProd = (import.meta as { env?: { PROD?: boolean } })?.env?.PROD === true;
const isPlaceholderOrUnset = (v: string) => !v || PLACEHOLDER_VALUES.has(v);

// In production, never use placeholder/default secrets; use main app config when customer config is missing or placeholder
const useMainAppConfig = isPlaceholderKey || (isProd && (
  isPlaceholderOrUnset(readEnv('VITE_CUSTOMER_FIREBASE_PROJECT_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_PROJECT_ID')) ||
  isPlaceholderOrUnset(readEnv('VITE_CUSTOMER_FIREBASE_APP_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_APP_ID'))
));

const customerFirebaseConfig = useMainAppConfig ? {
  ...APP_KEYS.firebase,
  projectId: readEnv('VITE_CUSTOMER_FIREBASE_PROJECT_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_PROJECT_ID') || APP_KEYS.firebase.projectId,
  appId: readEnv('VITE_CUSTOMER_FIREBASE_APP_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_APP_ID') || APP_KEYS.firebase.appId,
} : {
  projectId: readEnv('VITE_CUSTOMER_FIREBASE_PROJECT_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_PROJECT_ID') || 'bookmytable-customers',
  appId: readEnv('VITE_CUSTOMER_FIREBASE_APP_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_APP_ID') || '1:1049141485409:web:customer123',
  storageBucket: readEnv('VITE_CUSTOMER_FIREBASE_STORAGE_BUCKET') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_STORAGE_BUCKET') || 'bookmytable-customers.firebasestorage.app',
  apiKey: customerApiKey,
  authDomain: readEnv('VITE_CUSTOMER_FIREBASE_AUTH_DOMAIN') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_AUTH_DOMAIN') || 'bookmytable-customers.firebaseapp.com',
  databaseURL: readEnv('VITE_CUSTOMER_FIREBASE_DATABASE_URL') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_DATABASE_URL') || 'https://bookmytable-customers-default-rtdb.firebaseio.com',
  measurementId: readEnv('VITE_CUSTOMER_FIREBASE_MEASUREMENT_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_MEASUREMENT_ID') || 'G-CUSTOMER123',
  messagingSenderId: readEnv('VITE_CUSTOMER_FIREBASE_MESSAGING_SENDER_ID') || readEnv('NEXT_PUBLIC_CUSTOMER_FIREBASE_MESSAGING_SENDER_ID') || '1049141485409',
};

// Initialize Firebase with a unique name for customers
const customerAppName = 'customer-firebase-app';
const customerApp = !getApps().find(app => app.name === customerAppName) 
  ? initializeApp(customerFirebaseConfig, customerAppName) 
  : getApp(customerAppName);

// Initialize Firebase Services for customers
export const customerAuth = getAuth(customerApp);
export const customerDb = getFirestore(customerApp);
export const customerRtdb = getDatabase(customerApp); // Realtime Database for customers
export const customerStorage = getStorage(customerApp);
export const customerFunctions = getFunctions(customerApp);

// Initialize messaging (only in browser and if supported)
// Firebase Messaging requires service worker and HTTPS (or localhost)
// It's optional functionality, so we silently handle failures
let customerMessaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  // Check if service workers are supported first
  const hasServiceWorker = 'serviceWorker' in navigator;
  const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  
  if (hasServiceWorker && isSecureContext) {
    isSupported()
      .then((supported) => {
        if (supported) {
          try {
            customerMessaging = getMessaging(customerApp);
          } catch (error) {
            // Silently fail - messaging is optional
            // Only log in development mode
            const env = (import.meta as { env?: { DEV?: boolean } })?.env;
            if (env?.DEV) {
              console.debug('Firebase Messaging not available (this is normal in some environments)');
            }
          }
        }
      })
      .catch(() => {
        // Silently fail - messaging is optional
      });
  }
}

// Initialize Auth Providers for customers
export const customerGoogleProvider = new GoogleAuthProvider();
export const customerFacebookProvider = new FacebookAuthProvider();
export const customerAppleProvider = new OAuthProvider('apple.com');

// Configure providers
customerGoogleProvider.addScope('email');
customerGoogleProvider.addScope('profile');
customerGoogleProvider.setCustomParameters({
  'hd': undefined // Allow any domain
});
customerFacebookProvider.addScope('email');
customerAppleProvider.addScope('email');
customerAppleProvider.addScope('name');

// Development emulator setup (only in development)
if ((import.meta as { env?: { MODE?: string } })?.env?.MODE === 'development' && typeof window !== 'undefined') {
  try {
    // Uncomment these lines if you want to use Firebase emulators in development
    // connectFirestoreEmulator(customerDb, 'localhost', 8081); // Different port from main app
    // connectDatabaseEmulator(customerRtdb, 'localhost', 9001); // Different port from main app
    // connectStorageEmulator(customerStorage, 'localhost', 9199);
    // connectFunctionsEmulator(customerFunctions, 'localhost', 5002); // Different port from main app
  } catch (error) {
    console.log('Customer Firebase emulators not running or already connected');
  }
}

export { 
  customerApp, 
  customerMessaging,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
};

// Database paths for customer data (separate from main app)
export const CUSTOMER_DB_PATHS = {
  users: 'customers/users',
  bookings: 'customers/bookings',
  favorites: 'customers/favorites',
  reviews: 'customers/reviews',
  payments: 'customers/payments',
  notifications: 'customers/notifications',
} as const;

// Firestore collections for customer data
export const CUSTOMER_COLLECTIONS = {
  users: 'customers',
  bookings: 'customerBookings',
  favorites: 'customerFavorites',
  reviews: 'customerReviews',
  payments: 'customerPayments',
  notifications: 'customerNotifications',
} as const;


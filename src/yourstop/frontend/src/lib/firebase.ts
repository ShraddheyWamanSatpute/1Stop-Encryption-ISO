// Import the functions you need from the SDKs you need
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

// YourStop Firebase config from environment (no hardcoded secrets — Section 1.5 compliance)
// Prefer VITE_YOURSTOP_FIREBASE_*; fall back to main app VITE_FIREBASE_* when not set.
const env = (import.meta as { env?: Record<string, string> })?.env ?? {};
const read = (primary: string, fallback: string): string =>
  String(env[primary] ?? env[fallback] ?? '').trim();

const firebaseConfig = {
  projectId: read('VITE_YOURSTOP_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  appId: read('VITE_YOURSTOP_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'),
  storageBucket: read('VITE_YOURSTOP_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
  apiKey: read('VITE_YOURSTOP_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: read('VITE_YOURSTOP_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: read('VITE_YOURSTOP_FIREBASE_DATABASE_URL', 'VITE_FIREBASE_DATABASE_URL'),
  measurementId: read('VITE_YOURSTOP_FIREBASE_MEASUREMENT_ID', 'VITE_FIREBASE_MEASUREMENT_ID'),
  messagingSenderId: read('VITE_YOURSTOP_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
};

// Require minimum config so we never initialize with empty credentials
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error('[YourStop] Set VITE_YOURSTOP_FIREBASE_* (or VITE_FIREBASE_*) in .env. See .env.example.');
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app); // Realtime Database
const storage = getStorage(app);
const functions = getFunctions(app);

// Initialize messaging (only in browser and if supported)
// Firebase Messaging requires service worker and HTTPS (or localhost)
// It's optional functionality, so we silently handle failures
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined') {
  // Check if service workers are supported first
  const hasServiceWorker = 'serviceWorker' in navigator;
  const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
  
  if (hasServiceWorker && isSecureContext) {
    isSupported()
      .then((supported) => {
        if (supported) {
          try {
            messaging = getMessaging(app);
          } catch (error) {
            // Silently fail - messaging is optional
            // Only log in development mode
            if ((import.meta as { env?: { DEV?: boolean } })?.env?.DEV) {
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

// Initialize Auth Providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure providers
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  'hd': '', // Allow any domain
} as Record<string, string>);
facebookProvider.addScope('email');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Development emulator setup (only in development)
if ((import.meta as { env?: { MODE?: string } })?.env?.MODE === 'development' && typeof window !== 'undefined') {
  try {
    // Uncomment these lines if you want to use Firebase emulators in development
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectDatabaseEmulator(rtdb, 'localhost', 9000);
    // connectStorageEmulator(storage, 'localhost', 9199);
    // connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Firebase emulators not running or already connected');
  }
}

export { 
  app, 
  auth, 
  db,
  rtdb, // Realtime Database
  storage,
  functions,
  messaging,
  googleProvider, 
  facebookProvider, 
  appleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
};

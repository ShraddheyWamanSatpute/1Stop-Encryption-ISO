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
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Your web app's Firebase configuration
// IMPORTANT: This is a public configuration and is safe to expose.
// Security is handled by Firebase Security Rules.
const firebaseConfig = {
  projectId: 'bookmytable-ea37d',
  appId: '1:1049141485409:web:6e8dbad1eaf713d3046f20',
  storageBucket: 'bookmytable-ea37d.firebasestorage.app',
  apiKey: 'AIzaSyDtqWWLKIF7ZMi2X21NhxkiCgoVUPIsV5I',
  authDomain: 'bookmytable-ea37d.firebaseapp.com',
  databaseURL: 'https://bookmytable-ea37d-default-rtdb.firebaseio.com',
  measurementId: 'G-EYMZ6KB690', // Analytics
  messagingSenderId: '1049141485409',
};

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
let messaging: any = null;
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
            if (import.meta.env.DEV) {
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
  'hd': undefined // Allow any domain
});
facebookProvider.addScope('email');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Development emulator setup (only in development)
if (import.meta.env.MODE === 'development' && typeof window !== 'undefined') {
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

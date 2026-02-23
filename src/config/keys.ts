/**
 * Centralized configuration for app keys (Firebase, Stripe, GCP)
 *
 * All values are read from environment variables at build time.
 * Vite exposes vars prefixed with VITE_ via import.meta.env.
 *
 * Required: Copy .env.example to .env and fill in your values.
 * See ENV_CONFIGURATION.md for setup instructions.
 */

interface FirebaseKeys {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

interface StripeKeys {
  publishableKey?: string
}

interface AppKeysShape {
  firebase: FirebaseKeys
  stripe: StripeKeys
}

const read = (key: string): string => {
  // Vite exposes import.meta.env - only VITE_* vars are exposed to client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any)?.env || {};
  return String(env[key] ?? '').trim();
}

export const APP_KEYS: AppKeysShape = {
  firebase: {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    databaseURL: read('VITE_FIREBASE_DATABASE_URL'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: read('VITE_FIREBASE_APP_ID'),
    measurementId: read('VITE_FIREBASE_MEASUREMENT_ID') || undefined,
  },
  stripe: {
    publishableKey: read('VITE_STRIPE_PUBLISHABLE_KEY') || undefined,
  },
}

export default APP_KEYS

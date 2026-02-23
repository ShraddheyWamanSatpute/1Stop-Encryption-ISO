/**
 * Shared Firebase Admin initialization
 * Initialize once and reuse across all functions
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin only once
if (getApps().length === 0) {
  try {
    // Use default credentials (automatically available in Cloud Functions)
    initializeApp();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

// Export initialized services
export const db = getDatabase();
export const firestore = getFirestore();
export const storage = getStorage();


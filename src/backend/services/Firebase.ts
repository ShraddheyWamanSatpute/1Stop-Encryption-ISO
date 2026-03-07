import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, User, sendEmailVerification, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, where, updateDoc, serverTimestamp, onSnapshot,collection, query, orderBy  } from 'firebase/firestore';
import { getDatabase, ref, set, remove, update, get, push, onValue, DatabaseReference, off  } from 'firebase/database';
import 'firebase/database';
import { useAuthState } from "react-firebase-hooks/auth";
import { useDocument, useCollection, useCollectionData  } from "react-firebase-hooks/firestore";
import 'firebase/firestore';
import 'firebase/analytics';
import { addDoc } from 'firebase/firestore';
import 'firebase/storage';
import { getStorage, ref as ref1, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { child, orderByChild, equalTo, limitToLast, query as rtdbQuery } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAI, getGenerativeModel, VertexAIBackend } from 'firebase/ai';

// Centralized app keys – import from a single module to manage GCP/Firebase/Stripe keys
import { APP_KEYS } from '../../config/keys';
const firebaseConfig = APP_KEYS.firebase;

// Only initialize when we have a non-empty API key and project ID (avoids auth/invalid-api-key white screen)
const hasFirebaseConfig =
  !!firebaseConfig?.apiKey?.trim() &&
  !!firebaseConfig?.projectId?.trim();

let app: ReturnType<typeof initializeApp> | ReturnType<typeof getApp> | null = null;
if (hasFirebaseConfig) {
  try {
    app = !getApps().length
      ? initializeApp(firebaseConfig as unknown as Record<string, unknown>)
      : getApp();
  } catch (err) {
    console.error('[Firebase] initializeApp failed. Check VITE_FIREBASE_* in .env.local and restart dev server.', err);
    app = null;
  }
} else {
  console.warn('[Firebase] Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in .env.local. Running without Firebase.');
}

export const storage = app ? getStorage(app) : (null as unknown as ReturnType<typeof getStorage>);
export const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
export const dbs = app ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);

// OPTIMIZED: Initialize database with connection pooling
export const db = app ? getDatabase(app) : (null as unknown as ReturnType<typeof getDatabase>);

export const functionsApp = app ? getFunctions(app) : (null as unknown as ReturnType<typeof getFunctions>);

// Initialize Vertex AI only when app exists
export const ai = app ? getAI(app, { backend: new VertexAIBackend() }) : (null as unknown as ReturnType<typeof getAI>);

export { ref, child, set, ref1, storageRef, orderByChild,
  equalTo,
  limitToLast,
   getDocs, where,off, rtdbQuery, updateDoc, uploadBytes, getDownloadURL, addDoc, useCollection,query, orderBy, serverTimestamp, onSnapshot,collection, useCollectionData, onValue, remove, update, get, push, doc, setDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, useAuthState, useDocument, signOut, httpsCallable, getGenerativeModel, VertexAIBackend };
export type {User, DatabaseReference}

export interface ExtendedDatabaseReference extends DatabaseReference {
  orderByChild(childPath: string): DatabaseReference; // TypeScript does not provide typings, but we can use DatabaseReference
  equalTo(value: unknown, key?: string): DatabaseReference;
}

export const uploadFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref1(storage, `files/${file.name}`);
    uploadBytes(storageRef, file).then((snapshot: { ref: ReturnType<typeof ref1> }) => {
      getDownloadURL(snapshot.ref).then((downloadURL: string | PromiseLike<string>) => {
        resolve(downloadURL);
      }).catch((error: unknown) => {
        reject(error);
      });
    }).catch((error: unknown) => {
      reject(error);
    });
  });
};

export const fetchTables = async () => {
  const tablesRef = ref(db, "path/to/tables"); // Ensure `db` is passed here
  const snapshot = await get(tablesRef);

  if (snapshot.exists()) {
    console.log(snapshot.val());
  }
};
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

// Initialize Firebase - check if app already exists to prevent duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig as unknown as Record<string, unknown>) : getApp();

export const storage = getStorage(app);
export const auth = getAuth(app);
export const dbs = getFirestore(app);

// OPTIMIZED: Initialize database with connection pooling
// Firebase Realtime Database automatically manages connections, but we can optimize
export const db = getDatabase(app);

// Enable offline persistence for better performance (caching)
// Note: This is handled automatically by Firebase SDK v9+
// The SDK caches data locally and syncs when online

export const functionsApp = getFunctions(app);

// Initialize Vertex AI
export const ai = getAI(app, { backend: new VertexAIBackend() });

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
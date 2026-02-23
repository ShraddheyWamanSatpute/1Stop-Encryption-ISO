import { initializeApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
  sendEmailVerification,
  signOut,
} from "firebase/auth"
import {
  doc,
  setDoc,
  getDocs,
  where,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  orderBy,
} from "firebase/firestore"
import { getDatabase, ref, set, remove, update, get, push, onValue, type DatabaseReference } from "firebase/database"
import "firebase/database"
import { useAuthState } from "react-firebase-hooks/auth"
import { useDocument, useCollection, useCollectionData } from "react-firebase-hooks/firestore"
import "firebase/firestore"
import "firebase/analytics"
import { addDoc } from "firebase/firestore"
import "firebase/storage"
import { getStorage, ref as ref1, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

// Firebase config from environment (no hardcoded secrets — Section 1.5 compliance)
const env = (import.meta as { env?: Record<string, string> })?.env ?? {}
const read = (key: string): string => String(env[key] ?? "").trim()

const firebaseConfig = {
  apiKey: read("VITE_PWF_LOOR_API_KEY"),
  authDomain: read("VITE_PWF_LOOR_AUTH_DOMAIN"),
  databaseURL: read("VITE_PWF_LOOR_DATABASE_URL"),
  projectId: read("VITE_PWF_LOOR_PROJECT_ID"),
  storageBucket: read("VITE_PWF_LOOR_STORAGE_BUCKET"),
  messagingSenderId: read("VITE_PWF_LOOR_MESSAGING_SENDER_ID"),
  appId: read("VITE_PWF_LOOR_APP_ID"),
  measurementId: read("VITE_PWF_LOOR_MEASUREMENT_ID") || undefined,
}

// Validate required config so we never initialize with wrong/missing config
const required = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"] as const
const missing = required.filter((k) => !firebaseConfig[k])
if (missing.length > 0) {
  const envKey = (k: string) => `VITE_PWF_LOOR_${k.replace(/([A-Z])/g, "_$1").toUpperCase()}`
  throw new Error(`[pwf-loor-app] Missing Firebase env: ${missing.map(envKey).join(", ")}. Add to .env (see .env.example).`)
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
const storage = getStorage(app)

export {
  ref,
  set,
  ref1,
  storageRef,
  getDocs,
  where,
  updateDoc,
  uploadBytes,
  getDownloadURL,
  addDoc,
  useCollection,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  collection,
  useCollectionData,
  onValue,
  remove,
  update,
  get,
  push,
  doc,
  setDoc,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  useAuthState,
  useDocument,
  signOut,
}
export type { User, DatabaseReference }

// File upload function
export const uploadFile = async (file: File) => {
  const storageRef = ref1(storage, "uploads/" + file.name)
  await uploadBytes(storageRef, file)
  return storageRef.fullPath
}

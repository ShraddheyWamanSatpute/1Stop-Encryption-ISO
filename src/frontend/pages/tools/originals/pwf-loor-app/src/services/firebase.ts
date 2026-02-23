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

const firebaseConfig = {
  apiKey: "AIzaSyAu5zAe1Ft2jVKj7pBKzJ0MemZ-Ld52v0I",
  authDomain: "pw-manager-198d3.firebaseapp.com",
  databaseURL: "https://pw-manager-198d3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pw-manager-198d3",
  storageBucket: "pw-manager-198d3.firebasestorage.app",
  messagingSenderId: "123936786602",
  appId: "1:123936786602:web:1da0c3bbe22c802ac0e8d3",
  measurementId: "G-YCN56HRWHC",
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

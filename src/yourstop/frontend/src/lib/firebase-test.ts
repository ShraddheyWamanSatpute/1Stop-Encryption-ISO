// Firebase Configuration Test
// This file helps debug Firebase authentication issues

import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection...');
  
  try {
    // Test 1: Check if auth is initialized
    console.log('✅ Firebase Auth initialized:', !!auth);
    console.log('✅ Auth app:', auth.app.name);
    console.log('✅ Auth domain:', auth.app.options.authDomain);
    
    // Test 2: Check current user
    console.log('✅ Current user:', auth.currentUser?.email || 'No user logged in');
    
    // Test 3: Check auth state
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        console.log('✅ Auth state changed:', user ? `User: ${user.email}` : 'No user');
        unsubscribe();
        resolve(user);
      });
    });
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    throw error;
  }
}

export async function testEmailPasswordAuth(email: string, password: string) {
  console.log('🔐 Testing Email/Password Authentication...');
  
  try {
    // Try to create a test user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ User created successfully:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ User already exists, trying to sign in...');
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ User signed in successfully:', userCredential.user.email);
        return userCredential.user;
      } catch (signInError: any) {
        console.error('❌ Sign in failed:', signInError.message);
        throw signInError;
      }
    } else {
      console.error('❌ Authentication failed:', error.message);
      throw error;
    }
  }
}

// Test function to run in browser console
export function runFirebaseTests() {
  console.log('🧪 Running Firebase Tests...');
  
  // Test basic connection
  testFirebaseConnection().then(() => {
    console.log('✅ Firebase connection test completed');
  }).catch((error) => {
    console.error('❌ Firebase connection test failed:', error);
  });
  
  // Test email/password auth with test credentials
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword123';
  
  testEmailPasswordAuth(testEmail, testPassword).then((user) => {
    console.log('✅ Email/Password authentication test completed');
    console.log('User:', user);
  }).catch((error) => {
    console.error('❌ Email/Password authentication test failed:', error);
  });
}

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runFirebaseTests = runFirebaseTests;
  (window as any).testFirebaseConnection = testFirebaseConnection;
  (window as any).testEmailPasswordAuth = testEmailPasswordAuth;
}
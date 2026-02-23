import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  AuthError
} from "firebase/auth";
import { customerAuth, customerGoogleProvider, customerFacebookProvider } from "@/lib/firebase-customer";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { customerDb, CUSTOMER_COLLECTIONS } from "@/lib/firebase-customer";
import { toast } from "@/hooks/use-toast";
import { 
  validateLogin, 
  validateSignup, 
  validatePasswordReset,
  createRateLimiter,
  type LoginFormData,
  type SignupFormData,
  type PasswordResetFormData
} from "@/lib/auth-validation";

interface CustomerAuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (data: LoginFormData, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignupFormData, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (data: PasswordResetFormData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: (rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

// Rate limiters for customer auth
const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const signupRateLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
const passwordResetRateLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(customerAuth, async (user) => {
      if (user) {
        // Create or update customer profile in Firestore
        await createOrUpdateCustomerProfile(user);
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Create or update customer profile in Firestore
  const createOrUpdateCustomerProfile = async (user: User) => {
    try {
      const userRef = doc(customerDb, CUSTOMER_COLLECTIONS.users, user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new customer profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          phoneNumber: user.phoneNumber || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          role: 'customer',
          isActive: true,
          preferences: {
            notifications: true,
            emailUpdates: true,
            smsUpdates: false,
          },
          stats: {
            totalBookings: 0,
            totalSpent: 0,
            favoriteRestaurants: [],
          }
        });
      } else {
        // Update existing profile
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || userSnap.data().displayName,
          photoURL: user.photoURL || userSnap.data().photoURL,
          phoneNumber: user.phoneNumber || userSnap.data().phoneNumber,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error creating/updating customer profile:', error);
    }
  };

  const getFirebaseErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  };

  const signIn = async (data: LoginFormData, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const validation = validateLogin(data);
      if (!validation.success) {
        const error = validation.error.errors[0]?.message || 'Invalid input';
        return { success: false, error };
      }

      if (!loginRateLimiter.isAllowed(data.email)) {
        return { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        };
      }

      const userCredential = await signInWithEmailAndPassword(customerAuth, data.email, data.password);
      await createOrUpdateCustomerProfile(userCredential.user);

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (data: SignupFormData, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const validation = validateSignup(data);
      if (!validation.success) {
        const error = validation.error.errors[0]?.message || 'Invalid input';
        return { success: false, error };
      }

      if (!signupRateLimiter.isAllowed(data.email)) {
        return { 
          success: false, 
          error: 'Too many signup attempts. Please try again later.' 
        };
      }

      const userCredential = await createUserWithEmailAndPassword(customerAuth, data.email, data.password);
      
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      await createOrUpdateCustomerProfile(userCredential.user);

      toast({
        title: "Account created successfully!",
        description: "Welcome to Book My Table. You can now start making reservations.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (data: PasswordResetFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const validation = validatePasswordReset(data);
      if (!validation.success) {
        const error = validation.error.errors[0]?.message || 'Invalid input';
        return { success: false, error };
      }

      if (!passwordResetRateLimiter.isAllowed(data.email)) {
        return { 
          success: false, 
          error: 'Too many password reset attempts. Please try again later.' 
        };
      }

      await sendPasswordResetEmail(customerAuth, data.email);

      toast({
        title: "Password reset email sent",
        description: "Please check your email for instructions to reset your password.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async (rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(customerAuth, customerGoogleProvider);
      await createOrUpdateCustomerProfile(result.user);

      toast({
        title: "Signed in with Google",
        description: "Welcome back!",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      toast({
        title: "Google sign in failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const signInWithFacebook = async (rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(customerAuth, customerFacebookProvider);
      await createOrUpdateCustomerProfile(result.user);

      toast({
        title: "Signed in with Facebook",
        description: "Welcome back!",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      toast({
        title: "Facebook sign in failed",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(customerAuth);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        signIn,
        signUp,
        resetPassword,
        signInWithGoogle,
        signInWithFacebook,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}


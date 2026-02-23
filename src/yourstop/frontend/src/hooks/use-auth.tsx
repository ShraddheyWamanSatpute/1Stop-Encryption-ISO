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
import { auth } from "@/lib/firebase";
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
import {
  logLoginSuccess,
  logLoginFailure,
  logSignupSuccess,
  logSignupFailure,
  logLogout,
  logPasswordResetRequest,
  logPasswordResetSuccess,
  logPasswordResetFailure,
  logRateLimitExceeded,
  logSuspiciousActivity,
  authLogger
} from "@/lib/auth-logger";
import { 
  sessionManager, 
  createUserSession, 
  clearUserSession,
  getCurrentSession 
} from "@/lib/session-manager";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signIn: (data: LoginFormData, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignupFormData, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (data: PasswordResetFormData) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: (rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiters
const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const signupRateLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
const passwordResetRateLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Validate existing session or create new one
        const existingSession = getCurrentSession();
        if (!existingSession || existingSession.uid !== user.uid) {
          await createUserSession(user, false); // Default to session storage
        } else {
          // Refresh session if needed
          await sessionManager.validateSession();
        }
      } else {
        clearUserSession();
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getFirebaseErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked. Please allow pop-ups and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const signIn = async (data: LoginFormData, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate input
      const validation = validateLogin(data);
      if (!validation.success) {
        const error = validation.error.errors[0]?.message || 'Invalid input';
        logLoginFailure(data.email, error);
        return { success: false, error };
      }

      // Check rate limiting
      if (!loginRateLimiter.isAllowed(data.email)) {
        logRateLimitExceeded(data.email);
        return { 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        };
      }

      // Check for suspicious activity
      if (authLogger.checkSuspiciousActivity(data.email)) {
        logSuspiciousActivity(data.email, { action: 'login_attempt' });
        return { 
          success: false, 
          error: 'Suspicious activity detected. Please try again later or contact support.' 
        };
      }

      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await createUserSession(userCredential.user, rememberMe);
      
      logLoginSuccess(userCredential.user.uid, data.email, 'email');
      
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      logLoginFailure(data.email, authError.code);
      
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
      // Validate input
      const validation = validateSignup(data);
      if (!validation.success) {
        const error = validation.error.errors[0]?.message || 'Invalid input';
        logSignupFailure(data.email, error);
        return { success: false, error };
      }

      // Check rate limiting
      if (!signupRateLimiter.isAllowed(data.email)) {
        logRateLimitExceeded(data.email);
        return { 
          success: false, 
          error: 'Too many signup attempts. Please try again later.' 
        };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      await createUserSession(userCredential.user, rememberMe);

      logSignupSuccess(userCredential.user.uid, data.email);
      
      toast({
        title: "Account created successfully!",
        description: "Welcome to Book My Table. You can now start making reservations.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      logSignupFailure(data.email, authError.code);
      
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
      // Validate input
      const validation = validatePasswordReset(data);
      if (!validation.success) {
        const error = validation.error.errors[0]?.message || 'Invalid email';
        return { success: false, error };
      }

      // Check rate limiting
      if (!passwordResetRateLimiter.isAllowed(data.email)) {
        logRateLimitExceeded(data.email);
        return { 
          success: false, 
          error: 'Too many password reset attempts. Please try again later.' 
        };
      }

      logPasswordResetRequest(data.email);
      
      // Configure custom action code settings for better UX
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/reset-password`,
        handleCodeInApp: true,
      };
      
      await sendPasswordResetEmail(auth, data.email, actionCodeSettings);
      
      logPasswordResetSuccess(data.email);
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password. The link will expire in 1 hour.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      logPasswordResetFailure(data.email, authError.code);
      
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
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      await createUserSession(result.user, rememberMe);
      
      logLoginSuccess(result.user.uid, result.user.email || '', 'google');
      
      toast({
        title: "Welcome!",
        description: "You have been signed in with Google successfully.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      logLoginFailure('', authError.code);
      
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
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      await createUserSession(result.user, rememberMe);
      
      logLoginSuccess(result.user.uid, result.user.email || '', 'facebook');
      
      toast({
        title: "Welcome!",
        description: "You have been signed in with Facebook successfully.",
      });

      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getFirebaseErrorMessage(authError);
      
      logLoginFailure('', authError.code);
      
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
      await firebaseSignOut(auth);
      clearUserSession();
      logLogout(user?.uid || 'unknown', user?.email || '');
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signOut, 
      signIn, 
      signUp, 
      resetPassword, 
      signInWithGoogle, 
      signInWithFacebook 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

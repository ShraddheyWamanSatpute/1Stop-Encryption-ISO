import {
    auth,
    db,
    ref,
    set,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
  } from "../services/firebase";
  import { Dispatch } from "react";
  import { LogInAction } from "../context/LogInContext";
  
  interface RegisterUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }
  
  // Register a new user
  export const register = async (userData: RegisterUserData) => {
    const { email, password, firstName, lastName, role } = userData;
  
    try {
      console.log("Starting user registration...");
  
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      console.log("User created:", user);
  
      if (user) {
        // Send email verification
        try {
          await sendEmailVerification(user);
          console.log("Verification email sent.");
        } catch (verificationError) {
          console.error("Verification email error:", verificationError);
          throw new Error("Failed to send verification email. Please try again.");
        }
  
        // Save user data in Realtime Database
        const userDataToSave = {
          email,
          uid: user.uid,
          firstName,
          lastName,
          role,
        };
        await set(ref(db, `/users/${user.uid}`), userDataToSave);
        console.log("User data saved to database.");
      }
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("An unknown error occurred during registration.");
      }
    }
  };
  
  // Log in an existing user
  export const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (user && !user.emailVerified) {
        throw new Error("Your email is not verified. Please verify your email before logging in.");
      }
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };
  
  // Password reset
  export const passwordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  };
  
  // Logout
  export const logout = async (
    logInDispatch: Dispatch<LogInAction>,
  ) => {
    try {
      await signOut(auth);
      console.log("User logged out.");
  
      // Clear the LogInContext state
      logInDispatch({ type: "LOGOUT" });
  
  
      // Remove related items from localStorage
      localStorage.removeItem("logInState");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { ref, set, get, update, onValue, off } from 'firebase/database';
import { db } from "../services/Firebase";
import { 
  User, 
  UserCompany, 
  PersonalSettings, 
  PreferencesSettings, 
  BusinessSettings, 
  Settings
} from "../interfaces/Settings";

// ========== FIREBASE AUTHENTICATION FUNCTIONS ==========

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 * @returns User ID and email
 */
export const signInWithEmail = async (email: string, password: string): Promise<{ uid: string; email: string }> => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { uid, email: userEmail } = userCredential.user;
    
    // Check if email is verified (optional - remove this check if you want to allow unverified logins)
    // if (!userCredential.user.emailVerified) {
    //   throw new Error("Please verify your email before logging in. Check your inbox for a verification email.");
    // }
    
    return { uid, email: userEmail || email };
  } catch (error: unknown) {
    // Provide more specific error messages
    let errorMessage = "Authentication failed";
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : '';
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorCode === "auth/user-not-found") {
      errorMessage = "No account found with this email address";
    } else if (errorCode === "auth/wrong-password") {
      errorMessage = "Incorrect password";
    } else if (errorCode === "auth/invalid-credential") {
      errorMessage = "Invalid email or password";
    } else if (errorCode === "auth/user-disabled") {
      errorMessage = "This account has been disabled";
    } else if (errorCode === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later";
    } else if (errorCode === "auth/network-request-failed") {
      errorMessage = "Network error. Please check your connection";
    }
    
    throw new Error(`${errorMessage}: ${errorMsg}`);
  }
};

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 * @returns User ID and email
 */
export const signUpWithEmail = async (email: string, password: string): Promise<{ uid: string; email: string }> => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid, email: userEmail } = userCredential.user;
    
    return { uid, email: userEmail || email };
  } catch (error) {
    throw new Error(`Registration failed: ${error}`);
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    const auth = getAuth();
    await signOut(auth);
  } catch (error) {
    throw new Error(`Sign out failed: ${error}`);
  }
};

/**
 * Resend email verification
 * @param user Firebase user object
 */
export const resendEmailVerification = async (user: FirebaseUser): Promise<void> => {
  try {
    await sendEmailVerification(user);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to resend verification email: ${errorMsg}`);
  }
};

/**
 * Send password reset email
 * @param email User email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(`Password reset failed: ${error}`);
  }
};

/**
 * Update user profile
 * @param updates Profile updates
 */
export const updateUserFirebaseProfile = async (updates: { displayName?: string; photoURL?: string }): Promise<void> => {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, updates);
    } else {
      throw new Error('No authenticated user');
    }
  } catch (error) {
    throw new Error(`Profile update failed: ${error}`);
  }
};

/**
 * Get current authenticated user
 * @returns FirebaseUser or null
 */
export const getCurrentFirebaseUser = (): FirebaseUser | null => {
  const auth = getAuth();
  return auth.currentUser;
};

/**
 * Login user with email and password
 * @param email User email
 * @param password User password
 * @returns User credential with uid and email
 */
export const loginWithEmailAndPassword = async (email: string, password: string): Promise<{ uid: string; email: string }> => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { uid, email: userEmail } = userCredential.user;
    
    return { uid, email: userEmail || email };
  } catch (error) {
    throw new Error(`Login failed: ${error}`);
  }
};

/**
 * Register new user with email and password
 * @param email User email
 * @param password User password
 * @param displayName Optional display name
 * @returns User credential with uid and email
 */
export const registerWithEmailAndPassword = async (email: string, password: string, displayName?: string): Promise<{ uid: string; email: string }> => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid, email: userEmail } = userCredential.user;
    
    // Update Firebase Auth profile if displayName provided
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Send email verification
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verificationError) {
      console.warn("Email verification could not be sent:", verificationError);
      // Don't fail registration if email verification fails
    }
    
    return { uid, email: userEmail || email };
  } catch (error: unknown) {
    // Provide more specific error messages for registration
    let errorMessage = "Registration failed";
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : '';
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorCode === "auth/email-already-in-use") {
      errorMessage = "An account with this email already exists";
    } else if (errorCode === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (errorCode === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters";
    } else if (errorCode === "auth/operation-not-allowed") {
      errorMessage = "Email/password accounts are not enabled";
    }
    
    throw new Error(`${errorMessage}: ${errorMsg}`);
  }
};

/**
 * Create user profile in database
 * @param userProfile User profile data
 */
export const createUserProfileInDb = async (userProfile: Record<string, unknown>): Promise<void> => {
  try {
    const userRef = ref(db, `users/${userProfile.uid}`);
    await set(userRef, userProfile);
  } catch (error) {
    throw new Error(`Error creating user profile: ${error}`);
  }
};

/**
 * Update user avatar
 * @param uid User ID
 * @param avatarUrl Avatar URL
 */
export const updateAvatarInDb = async (uid: string, avatarUrl: string): Promise<void> => {
  try {
    const avatarRef = ref(db, `users/${uid}/settings/personal/avatar`);
    await set(avatarRef, avatarUrl);
  } catch (error) {
    throw new Error(`Error updating avatar: ${error}`);
  }
};

/**
 * Update user theme
 * @param uid User ID
 * @param theme Theme setting
 */
export const updateThemeInDb = async (uid: string, theme: string): Promise<void> => {
  try {
    const themeRef = ref(db, `users/${uid}/settings/preferences/theme`);
    await set(themeRef, theme);
  } catch (error) {
    throw new Error(`Error updating theme: ${error}`);
  }
};

/**
 * Update business logo
 * @param companyId Company ID
 * @param logoUrl Logo URL
 */
export const updateBusinessLogoInDb = async (companyId: string, logoUrl: string): Promise<void> => {
  try {
    const logoRef = ref(db, `companies/${companyId}/businessInfo/logo`);
    await set(logoRef, logoUrl);
  } catch (error) {
    throw new Error(`Error updating business logo: ${error}`);
  }
};

// ========== USER AUTHENTICATION DATABASE FUNCTIONS ==========

/**
 * Get user data from database
 * @param uid User ID
 * @returns User object or null if not found
 */
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as User;
    }
    return null;
  } catch (error) {
    throw new Error(`Error fetching user data: ${error}`);
  }
};

/**
 * Update user data in database
 * @param uid User ID
 * @param userData Partial user data to update
 */
export const updateUserData = async (uid: string, userData: Partial<User>): Promise<void> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, userData);
  } catch (error) {
    throw new Error(`Error updating user data: ${error}`);
  }
};

/**
 * Set current company for user
 * @param uid User ID
 * @param companyID Company ID
 */
export const setCurrentCompany = async (uid: string, companyID: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${uid}/currentCompanyID`);
    await set(userRef, companyID);
  } catch (error) {
    throw new Error(`Error setting current company: ${error}`);
  }
};

/**
 * Add company to user's companies list
 * @param uid User ID
 * @param company Company object
 */
export const addCompanyToUser = async (uid: string, company: UserCompany): Promise<void> => {
  try {
    const userCompaniesRef = ref(db, `users/${uid}/companies`);
    const snapshot = await get(userCompaniesRef);
    
    let companies: UserCompany[] = [];
    if (snapshot.exists()) {
      companies = Object.values(snapshot.val());
    }
    
    // Add new company
    companies.push(company);
    
    await set(userCompaniesRef, companies);
  } catch (error) {
    throw new Error(`Error adding company to user: ${error}`);
  }
};

/**
 * Remove company from user's companies list
 * @param uid User ID
 * @param companyID Company ID
 */
export const removeCompanyFromUser = async (uid: string, companyID: string): Promise<void> => {
  try {
    const userCompaniesRef = ref(db, `users/${uid}/companies`);
    const snapshot = await get(userCompaniesRef);
    
    if (snapshot.exists()) {
      const companies: UserCompany[] = Object.values(snapshot.val());
      const updatedCompanies = companies.filter(company => company.companyID !== companyID);
      
      await set(userCompaniesRef, updatedCompanies);
    }
  } catch (error) {
    throw new Error(`Error removing company from user: ${error}`);
  }
};

// ========== PERSONAL SETTINGS DATABASE FUNCTIONS ==========

/**
 * Fetch user's personal settings from user root level
 * @param uid User ID
 * @returns Personal settings object
 */
export const fetchUserPersonalSettings = async (uid: string): Promise<PersonalSettings> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        jobTitle: userData.jobTitle || "",
        avatar: userData.avatar || "",
      };
    }
    
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      avatar: "",
    };
  } catch (error) {
    throw new Error(`Error fetching user personal settings: ${error}`);
  }
};

/**
 * Fetch user's personal settings from settings path
 * @param uid User ID
 * @returns Personal settings object
 */
export const fetchPersonalSettings = async (uid: string): Promise<PersonalSettings> => {
  try {
    const personalRef = ref(db, `users/${uid}/settings/personal`);
    const snapshot = await get(personalRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as PersonalSettings;
    }
    
    // Return default personal settings if not found
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      avatar: "",
    };
  } catch (error) {
    throw new Error(`Error fetching personal settings: ${error}`);
  }
};

/**
 * Update user's personal settings
 * @param uid User ID
 * @param personalSettings Personal settings object
 */
export const updatePersonalSettings = async (uid: string, personalSettings: Partial<PersonalSettings>): Promise<void> => {
  try {
    const personalRef = ref(db, `users/${uid}/settings/personal`);
    await update(personalRef, personalSettings);
  } catch (error) {
    throw new Error(`Error updating personal settings: ${error}`);
  }
};

/**
 * Update user's avatar
 * @param uid User ID
 * @param avatarUrl URL of the avatar image
 */
export const updateAvatar = async (uid: string, avatarUrl: string): Promise<void> => {
  try {
    const avatarRef = ref(db, `users/${uid}/settings/personal/avatar`);
    await set(avatarRef, avatarUrl);
  } catch (error) {
    throw new Error(`Error updating avatar: ${error}`);
  }
};

// ========== PREFERENCES SETTINGS DATABASE FUNCTIONS ==========

/**
 * Fetch user's preferences settings from user settings path
 * @param uid User ID
 * @returns Preferences settings object
 */
export const fetchUserPreferencesSettings = async (uid: string): Promise<PreferencesSettings> => {
  try {
    const userRef = ref(db, `users/${uid}/settings`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const settingsData = snapshot.val();
      return {
        theme: settingsData.theme || "light",
        notifications: {
          email: settingsData.notifications?.email ?? true,
          push: settingsData.notifications?.push ?? true,
          sms: settingsData.notifications?.sms ?? false,
        },
        emailPreferences: {
          lowStock: settingsData.emailPreferences?.lowStock ?? true,
          orderUpdates: settingsData.emailPreferences?.orderUpdates ?? true,
          systemNotifications: settingsData.emailPreferences?.systemNotifications ?? true,
          marketing: settingsData.emailPreferences?.marketing ?? false,
        },
        language: settingsData.language || "en",
      };
    }
    
    return {
      theme: "light",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      emailPreferences: {
        lowStock: true,
        orderUpdates: true,
        systemNotifications: true,
        marketing: false,
      },
      language: "en",
    };
  } catch (error) {
    throw new Error(`Error fetching user preferences settings: ${error}`);
  }
};

/**
 * Fetch user's preferences settings from preferences path
 * @param uid User ID
 * @returns Preferences settings object
 */
export const fetchPreferencesSettings = async (uid: string): Promise<PreferencesSettings> => {
  try {
    const preferencesRef = ref(db, `users/${uid}/settings/preferences`);
    const snapshot = await get(preferencesRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as PreferencesSettings;
    }
    
    // Return default preferences settings if not found
    return {
      theme: "light",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      emailPreferences: {
        lowStock: true,
        orderUpdates: true,
        systemNotifications: true,
        marketing: false,
      },
      language: "en",
    };
  } catch (error) {
    throw new Error(`Error fetching preferences settings: ${error}`);
  }
};

/**
 * Update user's preferences settings
 * @param uid User ID
 * @param preferencesSettings Preferences settings object
 */
export const updatePreferencesSettings = async (uid: string, preferencesSettings: Partial<PreferencesSettings>): Promise<void> => {
  try {
    const preferencesRef = ref(db, `users/${uid}/settings/preferences`);
    await update(preferencesRef, preferencesSettings);
  } catch (error) {
    throw new Error(`Error updating preferences settings: ${error}`);
  }
};

/**
 * Update user's theme preference
 * @param uid User ID
 * @param theme Theme preference (light or dark)
 */
export const updateTheme = async (uid: string, theme: "light" | "dark"): Promise<void> => {
  try {
    const themeRef = ref(db, `users/${uid}/settings/preferences/theme`);
    await set(themeRef, theme);
  } catch (error) {
    throw new Error(`Error updating theme: ${error}`);
  }
};

// ========== BUSINESS SETTINGS DATABASE FUNCTIONS ==========

/**
 * Fetch company's business settings from businessInfo path
 * @param companyId Company ID
 * @returns Business settings object
 */
export const fetchCompanyBusinessSettings = async (companyId: string): Promise<BusinessSettings> => {
  try {
    const businessRef = ref(db, `companies/${companyId}/businessInfo`);
    const snapshot = await get(businessRef);
    
    if (snapshot.exists()) {
      const businessData = snapshot.val();
      return {
        businessName: businessData.businessName || "",
        businessAddress: businessData.businessAddress || "",
        businessPhone: businessData.businessPhone || "",
        businessEmail: businessData.businessEmail || "",
        taxNumber: businessData.taxNumber || "",
        businessLogo: businessData.businessLogo || "",
        industry: businessData.industry || "",
      };
    }
    
    return {
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      taxNumber: "",
      businessLogo: "",
      industry: "",
    };
  } catch (error) {
    throw new Error(`Error fetching company business settings: ${error}`);
  }
};

/**
 * Fetch user's business settings from business path
 * @param companyId Company ID
 * @returns Business settings object
 */
export const fetchBusinessSettings = async (companyId: string): Promise<BusinessSettings> => {
  try {
    const businessRef = ref(db, `companies/${companyId}/settings/business`);
    const snapshot = await get(businessRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as BusinessSettings;
    }
    
    // Return default business settings if not found
    return {
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      taxNumber: "",
      businessLogo: "",
      industry: "",
    };
  } catch (error) {
    throw new Error(`Error fetching business settings: ${error}`);
  }
};

/**
 * Update company's business settings
 * @param companyId Company ID
 * @param businessSettings Business settings object
 */
export const updateBusinessSettings = async (companyId: string, businessSettings: Partial<BusinessSettings>): Promise<void> => {
  try {
    const businessRef = ref(db, `companies/${companyId}/settings/business`);
    await update(businessRef, businessSettings);
  } catch (error) {
    throw new Error(`Error updating business settings: ${error}`);
  }
};

/**
 * Update company's business logo
 * @param companyId Company ID
 * @param logoUrl URL of the business logo image
 */
export const updateBusinessLogo = async (companyId: string, logoUrl: string): Promise<void> => {
  try {
    const logoRef = ref(db, `companies/${companyId}/settings/business/businessLogo`);
    await set(logoRef, logoUrl);
  } catch (error) {
    throw new Error(`Error updating business logo: ${error}`);
  }
};

// ========== COMBINED SETTINGS DATABASE FUNCTIONS ==========

/**
 * Fetch all user settings
 * @param uid User ID
 * @param companyId Company ID
 * @returns Combined settings object
 */
export const fetchAllSettings = async (uid: string, companyId: string): Promise<Settings> => {
  try {
    const personal = await fetchPersonalSettings(uid);
    const preferences = await fetchPreferencesSettings(uid);
    const business = await fetchBusinessSettings(companyId);
    
    return {
      personal,
      preferences,
      business,
    };
  } catch (error) {
    throw new Error(`Error fetching all settings: ${error}`);
  }
};

/**
 * Subscribe to settings changes
 * @param uid User ID
 * @param companyId Company ID
 * @param callback Callback function to handle settings changes
 * @returns Unsubscribe function
 */
export const subscribeToSettings = (
  uid: string, 
  companyId: string, 
  callback: (settings: Settings) => void
): (() => void) => {
  // Create refs for each settings section
  const personalRef = ref(db, `users/${uid}/settings/personal`);
  const preferencesRef = ref(db, `users/${uid}/settings/preferences`);
  const businessRef = ref(db, `companies/${companyId}/settings/business`);
  
  // Current state of settings
  const currentSettings: Settings = {
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      avatar: "",
    },
    preferences: {
      theme: "light",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      emailPreferences: {
        lowStock: true,
        orderUpdates: true,
        systemNotifications: true,
        marketing: false,
      },
      language: "en",
    },
    business: {
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      taxNumber: "",
      businessLogo: "",
      industry: "",
    },
  };
  
  // Set up listeners for each section
  const personalListener = onValue(personalRef, (snapshot) => {
    if (snapshot.exists()) {
      currentSettings.personal = snapshot.val() as PersonalSettings;
      callback(currentSettings);
    }
  });
  
  const preferencesListener = onValue(preferencesRef, (snapshot) => {
    if (snapshot.exists()) {
      currentSettings.preferences = snapshot.val() as PreferencesSettings;
      callback(currentSettings);
    }
  });
  
  const businessListener = onValue(businessRef, (snapshot) => {
    if (snapshot.exists()) {
      currentSettings.business = snapshot.val() as BusinessSettings;
      callback(currentSettings);
    }
  });
  
  // Return unsubscribe function
  return () => {
    off(personalRef, 'value', personalListener);
    off(preferencesRef, 'value', preferencesListener);
    off(businessRef, 'value', businessListener);
  };
};

// ========== USER PROFILE DATABASE FUNCTIONS ==========

/**
 * Fetch user profile from database
 * @param uid User ID
 * @returns UserProfile object or null if not found
 */
export const fetchUserProfileFromDb = async (uid: string): Promise<Record<string, unknown> | null> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return null;
  } catch (error) {
    throw new Error(`Error fetching user profile: ${error}`);
  }
};

/**
 * Update user profile in database
 * @param uid User ID
 * @param updates Profile updates
 */
export const updateUserProfileInDb = async (uid: string, updates: Record<string, unknown>): Promise<void> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const updateData = {
      ...updates,
      updatedAt: Date.now()
    };
    
    await update(userRef, updateData);
  } catch (error) {
    throw new Error(`Error updating user profile: ${error}`);
  }
};

/**
 * Check if user exists in database
 * @param uid User ID
 * @returns Boolean indicating if user exists
 */
export const checkUserExists = async (uid: string): Promise<boolean> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists();
  } catch (error) {
    throw new Error(`Error checking user existence: ${error}`);
  }
};

/**
 * Initialize user settings in database
 * @param uid User ID
 * @param email User email
 */
export const initializeUserSettingsInDb = async (uid: string, email: string): Promise<void> => {
  try {
    const userRef = ref(db, `users/${uid}`);
    const userData = {
      uid,
      email,
      firstName: "",
      lastName: "",
      phone: "",
      jobTitle: "",
      avatar: "",
      companies: [],
      currentCompanyID: "",
      settings: {
        personal: {
          firstName: "",
          lastName: "",
          email,
          phone: "",
          jobTitle: "",
          avatar: "",
        },
        preferences: {
          theme: "light",
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
          emailPreferences: {
            lowStock: true,
            orderUpdates: true,
            systemNotifications: true,
            marketing: false,
          },
          language: "en",
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    await set(userRef, userData);
  } catch (error) {
    throw new Error(`Error initializing user settings: ${error}`);
  }
};

// ========== PERMISSION FUNCTIONS ==========

/**
 * Check if user has permission to access settings
 * @param uid User ID
 * @param companyId Company ID
 * @returns Boolean indicating if user has permission
 */
export const checkSettingsPermission = async (uid: string, companyId: string): Promise<boolean> => {
  try {
    // Check if user is a member of the company
    const userCompaniesRef = ref(db, `users/${uid}/companies`);
    const snapshot = await get(userCompaniesRef);
    
    if (snapshot.exists()) {
      const companies: UserCompany[] = Object.values(snapshot.val());
      const company = companies.find(c => c.companyID === companyId);
      
      if (company) {
        // Check if user has admin role or is owner
        if (company.role === 'admin' || company.role === 'owner') {
          return true;
        }
        
        // Check specific permissions if needed
        const permissionsRef = ref(db, `companies/${companyId}/permissions/users/${uid}/settings`);
        const permSnapshot = await get(permissionsRef);
        
        if (permSnapshot.exists() && permSnapshot.val() === true) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    throw new Error(`Error checking settings permission: ${error}`);
  }
};

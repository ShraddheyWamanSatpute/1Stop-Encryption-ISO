import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, ref, get, set, rtdbQuery, orderByChild, equalTo } from "../services/Firebase";
import {
  User,
  UserCompany,
  PersonalSettings,
  PreferencesSettings,
  BusinessSettings,
  Settings,
  AuthState} from "../interfaces/Settings";
import {
  signIn,
  signUp,
  logOut,
  passwordReset as sendPasswordResetEmail,
  setCurrentCompanyForUser,
  updateUserPersonalSettings,
  updateUserAvatar,
  updateUserAvatarWithFile,
  updateUserPreferencesSettings,
  updateUserTheme,
  updateCompanyBusinessSettings,
  updateCompanyLogo,
  updateCompanyLogoWithFile,
  getAllSettings,
  checkUserSettingsPermission,
  initializeUserSettings
} from "../functions/Settings";
import { SessionPersistence } from "../../frontend/utils/sessionPersistence";
import { logAuthEvent } from "../services/audit/authAuditClient";

// Define the settings state interface
interface SettingsState {
  auth: AuthState;
  user: User | null;
  settings: {
    personal: PersonalSettings;
    preferences: PreferencesSettings;
    business: BusinessSettings;
  };
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
}

// Initial state
const initialState: SettingsState = {
  auth: {
    isLoggedIn: false,
    uid: null,
    email: null,
    displayName: null,
  },
  user: null,
  settings: {
    personal: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      avatar: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      },
      bankDetails: {
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        sortCode: "",
        iban: "",
      },
      niNumber: "",
      taxCode: "",
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
        email: "",
      },
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
  },
  loading: true,
  error: null,
  hasPermission: false,
};

// Define action types
export type SettingsAction =
  // Auth actions
  | { type: "LOGIN"; payload: { uid: string; email: string; displayName?: string } }
  | { type: "LOGOUT" }
  // User actions
  | { type: "SET_USER"; payload: User }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "SET_CURRENT_COMPANY"; payload: string }
  | { type: "ADD_COMPANY"; payload: UserCompany }
  | { type: "REMOVE_COMPANY"; payload: string }
  // Settings actions
  | { type: "SET_SETTINGS"; payload: Settings }
  | { type: "UPDATE_PERSONAL"; payload: Partial<PersonalSettings> }
  | { type: "UPDATE_PREFERENCES"; payload: Partial<PreferencesSettings> }
  | { type: "UPDATE_BUSINESS"; payload: Partial<BusinessSettings> }
  // UI state actions
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PERMISSION"; payload: boolean }
  | { type: "CLEAR_ERROR" };

// Reducer function
const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        auth: {
          isLoggedIn: true,
          uid: action.payload.uid,
          email: action.payload.email,
          displayName: action.payload.displayName || null,
        },
        loading: false,
      };
    case "LOGOUT":
      return {
        ...initialState,
        loading: false,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case "SET_CURRENT_COMPANY":
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              currentCompanyID: action.payload,
              companies: state.user.companies.map((company) => ({
                ...company,
                isDefault: company.companyID === action.payload,
              })),
            }
          : null,
      };
    case "ADD_COMPANY":
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              companies: [...state.user.companies, action.payload],
            }
          : null,
      };
    case "REMOVE_COMPANY":
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              companies: state.user.companies.filter(
                (company) => company.companyID !== action.payload
              ),
              currentCompanyID:
                state.user.currentCompanyID === action.payload
                  ? state.user.companies.find(
                      (c) => c.companyID !== action.payload
                    )?.companyID || ""
                  : state.user.currentCompanyID,
            }
          : null,
      };
    case "SET_SETTINGS":
      return {
        ...state,
        settings: action.payload,
        loading: false,
      };
    case "UPDATE_PERSONAL":
      return {
        ...state,
        settings: {
          ...state.settings,
          personal: { ...state.settings.personal, ...action.payload },
        },
      };
    case "UPDATE_PREFERENCES":
      return {
        ...state,
        settings: {
          ...state.settings,
          preferences: { ...state.settings.preferences, ...action.payload },
        },
      };
    case "UPDATE_BUSINESS":
      return {
        ...state,
        settings: {
          ...state.settings,
          business: { ...state.settings.business, ...action.payload },
        },
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "SET_PERMISSION":
      return { ...state, hasPermission: action.payload };
    default:
      return state;
  }
};

// Define context type
interface SettingsContextType {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  passwordReset: (email: string) => Promise<void>;
  // User methods
  setCurrentCompany: (companyID: string) => Promise<void>;
  removeCompany: (companyID: string) => Promise<void>;
  joinCompanyByCode: (code: string) => Promise<boolean>;
  getCurrentCompany: () => UserCompany | undefined;
  // Settings methods
  updatePersonal: (settings: Partial<PersonalSettings>) => Promise<void>;
  updatePreferences: (settings: Partial<PreferencesSettings>) => Promise<void>;
  updateBusiness: (settings: Partial<BusinessSettings>) => Promise<void>;
  setTheme: (theme: "light" | "dark") => Promise<void>;
  // File upload methods
  uploadAvatar: (avatarUrl: string) => Promise<void>;
  uploadBusinessLogo: (logoUrl: string) => Promise<void>;
  updateAvatar: (file: File) => Promise<string | undefined>;
  updateBusinessLogo: (file: File) => Promise<string | undefined>;
  // Utility methods
  refreshSettings: () => Promise<void>;
  clearError: () => void;
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Log initialization only once (reduced logging for performance)
  if (process.env.NODE_ENV === 'development') {
    console.log('⚡ SettingsContext: Initializing...');
  }
  
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Get current company ID
  const getCurrentCompanyId = useCallback(() => {
    if (state.user?.currentCompanyID) {
      return state.user.currentCompanyID;
    }
    return localStorage.getItem("companyID") || "";
  }, [state.user?.currentCompanyID]);

  // Authentication methods
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      console.log(`🔐 Attempting login for: ${email}`);
      const { uid, email: userEmail } = await signIn(email, password);
      console.log(`✅ Firebase Auth successful - UID: ${uid}, Email: ${userEmail}`);
      
      // Check if user data exists in database
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);
      console.log(`📊 User data exists in DB: ${snapshot.exists()}`);
      
      let userData = null;
      
      if (snapshot.exists()) {
        // User data exists in new format
        userData = snapshot.val();
        console.log(`✅ Found user data in new format`);
      } else {
        console.warn(`⚠️ User data not found in database for UID: ${uid}`);
        // Try to find user by email in the old format
        const usersRef = ref(db, "users");
        const emailQuery = rtdbQuery(usersRef, orderByChild("email"), equalTo(userEmail));
        const emailSnapshot = await get(emailQuery);
        console.log(`📊 User found by email query: ${emailSnapshot.exists()}`);
        
        if (emailSnapshot.exists()) {
          console.log(`🔄 Found user in old format, migrating data...`);
          const userEntries = Object.values(emailSnapshot.val()) as any[];
          const oldUserData = userEntries[0];
          
          // Migrate user data to new format
          userData = {
            ...oldUserData,
            uid: uid,
            email: userEmail,
            migratedAt: Date.now()
          };
          
          await set(userRef, userData);
          console.log(`✅ User data migrated successfully`);
        } else {
          console.error(`❌ User data not found in any format for email: ${userEmail}`);
          throw new Error("User profile not found. Please contact support.");
        }
      }
      
      // Ensure user data has required fields
      if (!userData) {
        throw new Error("Failed to load user data");
      }
      
      // Ensure user has companies array
      if (!userData.companies || !Array.isArray(userData.companies)) {
        userData.companies = [];
      }
      
      // Ensure user has currentCompanyID
      if (!userData.currentCompanyID && userData.companies.length > 0) {
        userData.currentCompanyID = userData.companies[0].companyID;
      }
      
      dispatch({
        type: "LOGIN",
        payload: { uid, email: userEmail },
      });

      // Audit: log login_success (ISO 27001 A.12, SOC 2 CC7)
      logAuthEvent('login_success').catch(() => {});

      // Load user profile data
      dispatch({
        type: "SET_USER",
        payload: userData,
      });
      
      console.log(`✅ Settings Context: User logged in - ${userEmail}`);
    } catch (error) {
      console.error("Login error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Login failed: ${error}`,
      });
      // Re-throw the error so the calling component can handle it
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const register = async (email: string, password: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const { uid, email: userEmail } = await signUp(email, password);
      dispatch({
        type: "LOGIN",
        payload: { uid, email: userEmail },
      });
      // Initialize user settings
      await initializeUserSettings(uid, userEmail);
      console.log(`✅ Settings Context: User registered and logged in - ${userEmail}`);
    } catch (error) {
      console.error("Registration error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Registration failed: ${error}`,
      });
      // Re-throw the error so the calling component can handle it
      throw error;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const logout = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      // Audit: log logout before signOut (ISO 27001 A.12, SOC 2 CC7)
      await logAuthEvent('logout').catch(() => {});
      await logOut();
      dispatch({ type: "LOGOUT" });
      // Clear all session data on logout
      SessionPersistence.clearSessionState();
      localStorage.removeItem("settingsState");
      console.log(`✅ Settings Context: User logged out`);
    } catch (error) {
      console.error("Logout error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Logout failed: ${error}`,
      });
    }
  };

  const passwordReset = async (email: string): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      // Use the renamed imported function to avoid naming conflict
      await sendPasswordResetEmail(email);
      dispatch({ type: "SET_LOADING", payload: false });
      console.log(`✅ Settings Context: Password reset email sent to ${email}`);
    } catch (error) {
      console.error("Password reset error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Password reset failed: ${error}`,
      });
      throw error;
    }
  };

  // User methods
  const setCurrentCompany = async (companyID: string) => {
    if (!state.auth.uid) return;

    try {
      await setCurrentCompanyForUser(state.auth.uid, companyID);
      dispatch({ type: "SET_CURRENT_COMPANY", payload: companyID });
      localStorage.setItem("companyID", companyID);
      
      // Refresh settings for the new company
      refreshSettings();
    } catch (error) {
      console.error("Error setting current company:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to set current company: ${error}`,
      });
    }
  };

  // Company management functions removed - these should be handled by Company context
  // const addCompany and removeCompany functions have been moved to Company context

  const removeCompany = async (companyID: string) => {
    if (!state.auth.uid) return;

    try {
      // Company removal should be handled by Company context
      dispatch({ type: "REMOVE_COMPANY", payload: companyID });
    } catch (error) {
      console.error("Error removing company:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to remove company: ${error}`,
      });
    }
  };

  const joinCompanyByCode = async (code: string): Promise<boolean> => {
    if (!state.auth.uid || !state.auth.email) return false;

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Look up the invite code in Firebase
      const invitesRef = ref(db, `invites`);
      const snapshot = await get(invitesRef);

      if (snapshot.exists()) {
        const invites = snapshot.val();
        const invite = Object.values(invites).find(
          (inv: any) => 
            inv.code === code && 
            inv.status === "pending" && 
            inv.email === state.auth.email
        ) as {
          inviteID: string;
          companyID: string;
          companyName: string;
          role: string;
          department: string;
          status: string;
          siteID?: string;
          siteName?: string;
          subsiteID?: string;
          subsiteName?: string;
        } | undefined;

        if (invite) {
          // Add company to user

          // Company addition should be handled by Company context
          // await addCompany(newCompany); // Moved to Company context

          // Update invite status
          const inviteRef = ref(db, `invites/${invite.inviteID}`);
          await set(inviteRef, { ...invite, status: "accepted" });

          dispatch({ type: "SET_LOADING", payload: false });
          return true;
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: "Invalid or expired invite code",
          });
          return false;
        }
      } else {
        dispatch({ type: "SET_ERROR", payload: "No invites found" });
        return false;
      }
    } catch (error) {
      console.error("Error joining company:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to join company: ${error}`,
      });
      return false;
    }
  };

  const getCurrentCompany = (): UserCompany | undefined => {
    if (!state.user) return undefined;
    return state.user.companies.find(
      (company) => company.companyID === state.user?.currentCompanyID
    );
  };

  // Settings methods
  const updatePersonal = async (settings: Partial<PersonalSettings>) => {
    if (!state.auth.uid) return;

    try {
      await updateUserPersonalSettings(state.auth.uid, settings);
      dispatch({ type: "UPDATE_PERSONAL", payload: settings });
    } catch (error) {
      console.error("Error updating personal settings:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update personal settings: ${error}`,
      });
    }
  };

  const updatePreferences = async (settings: Partial<PreferencesSettings>) => {
    if (!state.auth.uid) return;

    try {
      await updateUserPreferencesSettings(state.auth.uid, settings);
      dispatch({ type: "UPDATE_PREFERENCES", payload: settings });
    } catch (error) {
      console.error("Error updating preferences settings:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update preferences settings: ${error}`,
      });
    }
  };

  const updateBusiness = async (settings: Partial<BusinessSettings>) => {
    const companyId = getCurrentCompanyId();
    if (!companyId) return;

    try {
      await updateCompanyBusinessSettings(companyId, settings);
      dispatch({ type: "UPDATE_BUSINESS", payload: settings });
    } catch (error) {
      console.error("Error updating business settings:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update business settings: ${error}`,
      });
    }
  };

  const setTheme = async (theme: "light" | "dark") => {
    if (!state.auth.uid) return;

    try {
      await updateUserTheme(state.auth.uid, theme);
      dispatch({
        type: "UPDATE_PREFERENCES",
        payload: { theme },
      });
    } catch (error) {
      console.error("Error updating theme:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update theme: ${error}`,
      });
    }
  };

  // File upload methods - Legacy URL-based methods
  const uploadAvatar = async (avatarUrl: string) => {
    if (!state.auth.uid) return;

    try {
      await updateUserAvatar(state.auth.uid, avatarUrl);
      dispatch({
        type: "UPDATE_PERSONAL",
        payload: { avatar: avatarUrl },
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to upload avatar: ${error}`,
      });
    }
  };

  const uploadBusinessLogo = async (logoUrl: string) => {
    const companyId = getCurrentCompanyId();
    if (!companyId) return;

    try {
      await updateCompanyLogo(companyId, logoUrl);
      dispatch({
        type: "UPDATE_BUSINESS",
        payload: { businessLogo: logoUrl },
      });
    } catch (error) {
      console.error("Error uploading business logo:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to upload business logo: ${error}`,
      });
    }
  };

  // File upload methods - File-based methods
  const updateAvatar = async (file: File): Promise<string | undefined> => {
    if (!state.auth.uid) return undefined;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const avatarUrl = await updateUserAvatarWithFile(state.auth.uid, file);
      dispatch({
        type: "UPDATE_PERSONAL",
        payload: { avatar: avatarUrl },
      });
      dispatch({ type: "SET_LOADING", payload: false });
      return avatarUrl;
    } catch (error) {
      console.error("Error updating avatar:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update avatar: ${error}`,
      });
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  };

  const updateBusinessLogo = async (file: File): Promise<string | undefined> => {
    const companyId = getCurrentCompanyId();
    if (!companyId) return undefined;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const logoUrl = await updateCompanyLogoWithFile(companyId, file);
      dispatch({
        type: "UPDATE_BUSINESS",
        payload: { businessLogo: logoUrl },
      });
      dispatch({ type: "SET_LOADING", payload: false });
      return logoUrl;
    } catch (error) {
      console.error("Error updating business logo:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to update business logo: ${error}`,
      });
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  };

  // Utility methods
  const refreshSettings = useCallback(async () => {
    if (!state.auth.uid || state.loading) return;

    const companyId = getCurrentCompanyId();
    if (!companyId) return;

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Fetch all settings
      const settings = await getAllSettings(state.auth.uid, companyId);
      dispatch({ type: "SET_SETTINGS", payload: settings });

      // Check permission
      const hasPermission = await checkUserSettingsPermission(state.auth.uid, companyId);
      dispatch({ type: "SET_PERMISSION", payload: hasPermission });
    } catch (error) {
      console.error("Error fetching settings:", error);
      dispatch({
        type: "SET_ERROR",
        payload: `Failed to load settings: ${error}`,
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.auth.uid, state.loading]);

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Initialize state from Firebase Auth with priority loading
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Step 1: Immediate login action for quick UI feedback
          dispatch({
            type: "LOGIN",
            payload: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || undefined,
            },
          });

          // Step 1.5: Load companies from cache FIRST for instant dropdown display
          try {
            const cachedState = localStorage.getItem('settingsState')
            if (cachedState) {
              const parsed = JSON.parse(cachedState)
              if (parsed.user?.companies && Array.isArray(parsed.user.companies)) {
                // Immediately set user with cached companies for instant dropdown
                const cachedUser: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: parsed.user.displayName || firebaseUser.displayName || "",
                  photoURL: parsed.user.photoURL || firebaseUser.photoURL || "",
                  companies: parsed.user.companies,
                  currentCompanyID: parsed.user.currentCompanyID || parsed.currentCompanyID,
                  createdAt: parsed.user.createdAt || Date.now(),
                  lastLogin: Date.now(),
                  settings: parsed.user.settings || { theme: "light", notifications: true, language: "en" },
                }
                dispatch({ type: "SET_USER", payload: cachedUser })
                // Reduced logging for performance
                if (process.env.NODE_ENV === 'development') {
                  console.log(`⚡ SettingsContext: Loaded ${cachedUser.companies.length} companies from cache (INSTANT)`)
                }
              }
            }
          } catch (cacheError) {
            console.warn('Failed to load from cache:', cacheError)
          }

          // Step 2 & 3: Load companies AND full user data in PARALLEL for maximum speed
          // OPTIMIZED: Use get() for one-time reads - Firebase SDK handles connection pooling
          try {
            const [companiesSnapshot, userSnapshot] = await Promise.all([
              get(ref(db, `users/${firebaseUser.uid}/companies`)),
              get(ref(db, `users/${firebaseUser.uid}`))
            ]);
            
            // Process companies first (for instant dropdown)
            let companies: UserCompany[] = [];
            if (companiesSnapshot.exists()) {
              const companiesData = companiesSnapshot.val();
              if (Array.isArray(companiesData)) {
                companies = companiesData;
              } else {
                companies = Object.values(companiesData);
              }
            }
            
            // IMMEDIATELY update user with companies for instant dropdown
            const sessionState = SessionPersistence.getSessionState();
            const currentCompanyID = sessionState.companyID || 
              (companies.length > 0 ? companies[0].companyID : undefined);
            
            const userWithCompanies: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "",
              photoURL: firebaseUser.photoURL || "",
              companies: companies,
              currentCompanyID,
              createdAt: Date.now(),
              lastLogin: Date.now(),
              settings: { theme: "light", notifications: true, language: "en" },
            };
            
            dispatch({ type: "SET_USER", payload: userWithCompanies });
            // Reduced logging for performance
            if (process.env.NODE_ENV === 'development') {
              console.log(`⚡ SettingsContext: Loaded ${companies.length} companies from Firebase (PARALLEL)`);
            }
            
            // Step 3: Process full user data (already loaded in parallel above)
            if (userSnapshot.exists()) {
              // Process in background to not block UI
              Promise.resolve().then(async () => {
                try {
                  const userData = userSnapshot.val();

                // Convert companies object to array if needed (use fresh data)
                let fullCompanies: UserCompany[] = [];
                if (userData.companies) {
                  if (Array.isArray(userData.companies)) {
                    fullCompanies = userData.companies;
                  } else {
                    fullCompanies = Object.values(userData.companies);
                  }
                }

                // Restore last selected company/site/subsite from session persistence
                const sessionState = SessionPersistence.getSessionState();
                const currentCompanyID = sessionState.companyID || userData.currentCompanyID || 
                  (fullCompanies.length > 0 ? fullCompanies[0].companyID : undefined);

                // Create user object with restored session data
                const user: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName || userData.displayName || "",
                  photoURL: firebaseUser.photoURL || userData.photoURL || "",
                  companies: fullCompanies,
                  currentCompanyID,
                  createdAt: userData.createdAt || Date.now(),
                  lastLogin: Date.now(),
                  settings: userData.settings || {
                    theme: "light",
                    notifications: true,
                    language: "en",
                  },
                };

                // Update user with full data (background update)
                dispatch({ type: "SET_USER", payload: user });

                // Set personal settings from user data
                const personalSettings = {
                  firstName: userData.firstName || userData.personal?.firstName || "",
                  middleName: userData.middleName || userData.personal?.middleName || "",
                  lastName: userData.lastName || userData.personal?.lastName || "",
                  email: firebaseUser.email || "",
                  phone: userData.phone || userData.personal?.phone || "",
                  avatar: userData.photoURL || userData.personal?.avatar || "",
                  address: userData.address || userData.personal?.address || {
                    street: "",
                    city: "",
                    state: "",
                    zipCode: "",
                    country: "",
                  },
                  bankDetails: userData.bankDetails || userData.personal?.bankDetails || {
                    accountHolderName: "",
                    bankName: "",
                    accountNumber: "",
                    sortCode: "",
                    iban: "",
                  },
                  niNumber: userData.niNumber || userData.personal?.niNumber || "",
                  taxCode: userData.taxCode || userData.personal?.taxCode || "",
                  emergencyContact: userData.emergencyContact || userData.personal?.emergencyContact || {
                    name: "",
                    relationship: "",
                    phone: "",
                    email: "",
                  },
                };

                dispatch({ type: "UPDATE_PERSONAL", payload: personalSettings });

                // Persist current session immediately using new session persistence
                if (currentCompanyID) {
                  SessionPersistence.saveSessionState({
                    companyID: currentCompanyID,
                    userPreferences: {
                      theme: user.settings?.theme as 'light' | 'dark' || 'light',
                      language: user.settings?.language || 'en',
                    },
                  });
                }

                // Update last login timestamp in background (non-blocking)
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                  requestIdleCallback(() => {
                    try {
                      set(ref(db, `users/${firebaseUser.uid}/lastLogin`), Date.now());
                    } catch (error) {
                      console.error("Error updating last login:", error);
                    }
                  }, { timeout: 5000 });
                } else {
                  setTimeout(() => {
                    try {
                      set(ref(db, `users/${firebaseUser.uid}/lastLogin`), Date.now());
                    } catch (error) {
                      console.error("Error updating last login:", error);
                    }
                  }, 0);
                }
                
                  console.log(`✅ SettingsContext: READY - Session restored for ${user.email}`);
                } catch (error) {
                  console.error("Error processing full user data:", error);
                  // Don't block UI if background update fails
                }
              }).catch((error) => {
                console.error("Error in background user data load:", error);
              });
            } else {
              // Create new user if doesn't exist
              Promise.resolve().then(async () => {
                try {
                  await initializeUserSettings(firebaseUser.uid, firebaseUser.email || "");
                  console.log(`✅ SettingsContext: READY - New user initialized: ${firebaseUser.email}`);
                } catch (error) {
                  console.error("Error initializing new user:", error);
                }
              });
            }
          } catch (parallelError) {
            console.warn('Failed to load data from Firebase in parallel:', parallelError);
            // Fallback: try loading companies separately
            try {
              const companiesRef = ref(db, `users/${firebaseUser.uid}/companies`);
              const companiesSnapshot = await get(companiesRef);
              if (companiesSnapshot.exists()) {
                const companiesData = companiesSnapshot.val();
                const companies = Array.isArray(companiesData) ? companiesData : Object.values(companiesData);
                const sessionState = SessionPersistence.getSessionState();
                const currentCompanyID = sessionState.companyID || (companies.length > 0 ? companies[0].companyID : undefined);
                
                const userWithCompanies: User = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName || "",
                  photoURL: firebaseUser.photoURL || "",
                  companies: companies,
                  currentCompanyID,
                  createdAt: Date.now(),
                  lastLogin: Date.now(),
                  settings: { theme: "light", notifications: true, language: "en" },
                };
                
                dispatch({ type: "SET_USER", payload: userWithCompanies });
                console.log(`⚡ SettingsContext: Loaded ${companies.length} companies from Firebase (FALLBACK)`);
              }
            } catch (companiesError) {
              console.warn('Failed to load companies from Firebase:', companiesError);
            }
          }
        } catch (error) {
          console.error("Error restoring session:", error);
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
        console.log(`✅ SettingsContext: READY - No user session (logged out)`);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  // Sync state with localStorage - OPTIMIZED: Cache companies for instant dropdown loading
  useEffect(() => {
    if (!state.loading) {
      if (state.auth.isLoggedIn && state.user) {
        // Cache full user data including companies for instant dropdown loading
        localStorage.setItem("settingsState", JSON.stringify({
          auth: state.auth,
          user: {
            uid: state.user.uid,
            email: state.user.email,
            displayName: state.user.displayName,
            companies: state.user.companies, // Cache companies for instant dropdown
            currentCompanyID: state.user.currentCompanyID
          },
          currentCompanyID: state.user.currentCompanyID
        }));
      } else {
        localStorage.removeItem("settingsState");
      }
    }
  }, [state.auth, state.user, state.loading]);

  // Context value
  const contextValue: SettingsContextType = {
    state,
    dispatch,
    // Auth methods
    login,
    register,
    logout,
    passwordReset,
    // User methods
    setCurrentCompany,
    removeCompany,
    joinCompanyByCode,
    getCurrentCompany,
    // Settings methods
    updatePersonal,
    updatePreferences,
    updateBusiness,
    setTheme,
    // File upload methods
    uploadAvatar,
    uploadBusinessLogo,
    updateAvatar,
    updateBusinessLogo,
    // Utility methods
    refreshSettings,
    clearError,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

// Export types for frontend consumption
export type { 
  User, 
  UserCompany, 
  PersonalSettings, 
  PreferencesSettings, 
  BusinessSettings, 
  Settings, 
  AuthState
} from "../interfaces/Settings"

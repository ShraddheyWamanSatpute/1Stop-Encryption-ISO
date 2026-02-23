// Unified interfaces for User, Settings, and Authentication

/**
 * Interface for user profile data
 */
export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  firstName?: string
  lastName?: string
  role?: string
  department?: string
  companyID?: string | Record<string, boolean>
  photoURL?: string
  phoneNumber?: string
  createdAt?: number
  updatedAt?: number
  lastLogin?: number
  settings?: UserSettings
  preferences?: UserPreferences
}

/**
 * Interface for user settings
 */
export interface UserSettings {
  notifications: boolean
  theme: "light" | "dark" | "system"
  language: string
}

/**
 * Interface for user preferences
 */
export interface UserPreferences {
  dashboardLayout?: string
  favoriteModules?: string[]
  recentlyViewed?: string[]
  dashboardSettings?: {
    layouts: Array<Record<string, unknown>>
    activeLayout: string
    globalSettings: {
      refreshInterval: number
      autoRefresh: boolean
      theme: 'light' | 'dark' | 'auto'
      cardSpacing: number
      showGrid: boolean
      showCardBorders: boolean
    }
    moduleSettings: {
      [module: string]: {
        defaultLayout: string
        customCards: Array<Record<string, unknown>>
        filters: Record<string, unknown>
        groupBy?: Record<string, unknown>
      }
    }
    lastUpdated: number
  }
}


// User Company interface
export interface UserCompany {
  companyID: string;
  companyName: string;
  role: string;
  department: string;
  joinedAt: number;
  isDefault?: boolean;
  siteId?: string;
  siteName?: string;
  subsiteId?: string;
  subsiteName?: string;
  accessLevel: "company" | "site" | "subsite";
}

// User interface
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  companies: UserCompany[];
  currentCompanyID?: string;
  createdAt: number;
  lastLogin: number;
  settings?: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
    language: string;
  };
}

// User invite interface
export interface UserInvite {
  inviteID: string;
  companyID: string;
  companyName: string;
  role: string;
  department: string;
  email: string;
  invitedBy: string;
  invitedAt: number;
  expiresAt: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  code: string;
}

// Site invite interface
export interface SiteInvite {
  inviteID: string;
  companyID: string;
  companyName: string;
  siteID: string;
  siteName: string;
  subsiteID?: string;
  subsiteName?: string;
  role: string;
  department: string;
  email: string;
  invitedBy: string;
  invitedAt: number;
  expiresAt: number;
  status: "pending" | "accepted" | "rejected" | "expired";
  code: string;
}

// Personal profile settings
export interface PersonalSettings {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phone: string
  jobTitle?: string
  avatar: string
  // Address information
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  // Bank details for payments
  bankDetails?: {
    accountHolderName: string
    bankName: string
    accountNumber: string
    sortCode: string
    iban: string
  }
  // Tax and identification
  niNumber?: string
  taxCode?: string
  // Emergency contact
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email: string
  }
}

// Preferences settings
export interface PreferencesSettings {
  theme: "light" | "dark";
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  emailPreferences: {
    lowStock: boolean;
    orderUpdates: boolean;
    systemNotifications: boolean;
    marketing: boolean;
  };
  language: string;
}

// Business profile settings
export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  taxNumber: string;
  businessLogo: string;
  industry: string;
}

// Combined settings interface
export interface Settings {
  personal: PersonalSettings;
  preferences: PreferencesSettings;
  business: BusinessSettings;
}

// Authentication state interface
export interface AuthState {
  isLoggedIn: boolean;
  uid: string | null;
  email: string | null;
  displayName?: string | null;
}

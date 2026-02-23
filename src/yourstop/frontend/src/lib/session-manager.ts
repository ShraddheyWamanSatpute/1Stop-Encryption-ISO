import { User } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Session storage keys
const SESSION_KEYS = {
  USER_SESSION: 'book_my_table_user_session',
  AUTH_TOKEN: 'book_my_table_auth_token',
  REFRESH_TOKEN: 'book_my_table_refresh_token',
  SESSION_EXPIRY: 'book_my_table_session_expiry',
  REMEMBER_ME: 'book_my_table_remember_me',
} as const;

// Session duration constants (in milliseconds)
const SESSION_DURATION = {
  DEFAULT: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days
  REFRESH_THRESHOLD: 60 * 60 * 1000, // 1 hour before expiry
} as const;

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
  provider: string;
}

export class SessionManager {
  private static instance: SessionManager;
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSessionCheck();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // Initialize periodic session validation
  private initializeSessionCheck(): void {
    if (typeof window === 'undefined') return;

    // Check session every 5 minutes
    this.sessionCheckInterval = setInterval(() => {
      this.validateSession();
    }, 5 * 60 * 1000);
  }

  // Create a new session
  public async createSession(user: User, rememberMe: boolean = false): Promise<void> {
    try {
      const token = await user.getIdToken();
      const refreshToken = user.refreshToken;
      
      const sessionDuration = rememberMe ? SESSION_DURATION.REMEMBER_ME : SESSION_DURATION.DEFAULT;
      const expiryTime = Date.now() + sessionDuration;

      const userSession: UserSession = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime || new Date().toISOString(),
        lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
        provider: user.providerData[0]?.providerId || 'email',
      };

      // Store session data
      this.setStorageItem(SESSION_KEYS.USER_SESSION, JSON.stringify(userSession));
      this.setStorageItem(SESSION_KEYS.AUTH_TOKEN, token);
      this.setStorageItem(SESSION_KEYS.REFRESH_TOKEN, refreshToken);
      this.setStorageItem(SESSION_KEYS.SESSION_EXPIRY, expiryTime.toString());
      this.setStorageItem(SESSION_KEYS.REMEMBER_ME, rememberMe.toString());

      console.log('Session created successfully', { uid: user.uid, rememberMe });
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  // Get current session
  public getSession(): UserSession | null {
    try {
      const sessionData = this.getStorageItem(SESSION_KEYS.USER_SESSION);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as UserSession;
      
      // Check if session is expired
      if (this.isSessionExpired()) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      this.clearSession();
      return null;
    }
  }

  // Check if session is expired
  public isSessionExpired(): boolean {
    const expiryTime = this.getStorageItem(SESSION_KEYS.SESSION_EXPIRY);
    if (!expiryTime) return true;

    return Date.now() > parseInt(expiryTime);
  }

  // Check if session needs refresh
  public needsRefresh(): boolean {
    const expiryTime = this.getStorageItem(SESSION_KEYS.SESSION_EXPIRY);
    if (!expiryTime) return true;

    const timeUntilExpiry = parseInt(expiryTime) - Date.now();
    return timeUntilExpiry < SESSION_DURATION.REFRESH_THRESHOLD;
  }

  // Refresh session token
  public async refreshSession(): Promise<boolean> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        this.clearSession();
        return false;
      }

      // Force token refresh
      const newToken = await currentUser.getIdToken(true);
      const rememberMe = this.getStorageItem(SESSION_KEYS.REMEMBER_ME) === 'true';
      
      // Update session with new token and extended expiry
      const sessionDuration = rememberMe ? SESSION_DURATION.REMEMBER_ME : SESSION_DURATION.DEFAULT;
      const newExpiryTime = Date.now() + sessionDuration;

      this.setStorageItem(SESSION_KEYS.AUTH_TOKEN, newToken);
      this.setStorageItem(SESSION_KEYS.SESSION_EXPIRY, newExpiryTime.toString());

      console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      this.clearSession();
      return false;
    }
  }

  // Validate current session
  public async validateSession(): Promise<boolean> {
    try {
      const session = this.getSession();
      if (!session) return false;

      // Check if we need to refresh the token
      if (this.needsRefresh()) {
        return await this.refreshSession();
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      this.clearSession();
      return false;
    }
  }

  // Clear session data
  public clearSession(): void {
    Object.values(SESSION_KEYS).forEach(key => {
      this.removeStorageItem(key);
    });
    console.log('Session cleared');
  }

  // Get auth token
  public getAuthToken(): string | null {
    return this.getStorageItem(SESSION_KEYS.AUTH_TOKEN);
  }

  // Update session data
  public updateSession(updates: Partial<UserSession>): void {
    const currentSession = this.getSession();
    if (!currentSession) return;

    const updatedSession = { ...currentSession, ...updates };
    this.setStorageItem(SESSION_KEYS.USER_SESSION, JSON.stringify(updatedSession));
  }

  // Storage helpers (handles both localStorage and sessionStorage)
  private setStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;

    const rememberMe = this.getStorageItem(SESSION_KEYS.REMEMBER_ME) === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    
    try {
      storage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set storage item:', error);
    }
  }

  private getStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // Try localStorage first, then sessionStorage
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get storage item:', error);
      return null;
    }
  }

  private removeStorageItem(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove storage item:', error);
    }
  }

  // Cleanup on destroy
  public destroy(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Utility functions
export const createUserSession = (user: User, rememberMe?: boolean) => 
  sessionManager.createSession(user, rememberMe);

export const getCurrentSession = () => sessionManager.getSession();

export const clearUserSession = () => sessionManager.clearSession();

export const isSessionValid = () => sessionManager.validateSession();

export const getAuthToken = () => sessionManager.getAuthToken();
// Authentication event types
export enum AuthEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  SIGNUP_SUCCESS = 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE = 'SIGNUP_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PASSWORD_RESET_FAILURE = 'PASSWORD_RESET_FAILURE',
  SOCIAL_LOGIN_SUCCESS = 'SOCIAL_LOGIN_SUCCESS',
  SOCIAL_LOGIN_FAILURE = 'SOCIAL_LOGIN_FAILURE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

// Authentication event interface
export interface AuthEvent {
  type: AuthEventType;
  userId?: string;
  email?: string;
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
  provider?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Logger class
export class AuthLogger {
  private static instance: AuthLogger;
  private events: AuthEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory

  private constructor() {}

  public static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  // Log authentication event
  public logEvent(event: Omit<AuthEvent, 'timestamp'>): void {
    const fullEvent: AuthEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    // Add to in-memory storage
    this.events.push(fullEvent);
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH EVENT]', fullEvent);
    }

    // In production, you would send this to your logging service
    // Example: this.sendToLoggingService(fullEvent);
  }

  // Get events for a specific user
  public getUserEvents(userId: string): AuthEvent[] {
    return this.events.filter(event => event.userId === userId);
  }

  // Get events by type
  public getEventsByType(type: AuthEventType): AuthEvent[] {
    return this.events.filter(event => event.type === type);
  }

  // Get recent events
  public getRecentEvents(limit: number = 50): AuthEvent[] {
    return this.events.slice(-limit);
  }

  // Check for suspicious activity
  public checkSuspiciousActivity(email: string, timeWindowMs: number = 300000): boolean {
    const now = Date.now();
    const recentFailures = this.events.filter(
      event =>
        event.email === email &&
        event.type === AuthEventType.LOGIN_FAILURE &&
        now - event.timestamp < timeWindowMs
    );

    return recentFailures.length >= 5; // 5 failures in time window
  }

  // Get failure count for rate limiting
  public getFailureCount(email: string, timeWindowMs: number = 900000): number {
    const now = Date.now();
    return this.events.filter(
      event =>
        event.email === email &&
        (event.type === AuthEventType.LOGIN_FAILURE || 
         event.type === AuthEventType.SIGNUP_FAILURE) &&
        now - event.timestamp < timeWindowMs
    ).length;
  }

  // Clear events (for testing or privacy)
  public clearEvents(): void {
    this.events = [];
  }

  // Export events for analysis
  public exportEvents(): AuthEvent[] {
    return [...this.events];
  }

  // Private method to send to logging service (implement based on your needs)
  private async sendToLoggingService(event: AuthEvent): Promise<void> {
    // Example implementation:
    // try {
    //   await fetch('/api/auth/log', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(event),
    //   });
    // } catch (error) {
    //   console.error('Failed to send auth event to logging service:', error);
    // }
  }
}

// Convenience functions
export const authLogger = AuthLogger.getInstance();

export const logAuthEvent = (event: Omit<AuthEvent, 'timestamp'>) => {
  authLogger.logEvent(event);
};

export const logLoginSuccess = (userId: string, email: string, provider?: string) => {
  logAuthEvent({
    type: AuthEventType.LOGIN_SUCCESS,
    userId,
    email,
    provider,
  });
};

export const logLoginFailure = (email: string, error: string) => {
  logAuthEvent({
    type: AuthEventType.LOGIN_FAILURE,
    email,
    error,
  });
};

export const logSignupSuccess = (userId: string, email: string) => {
  logAuthEvent({
    type: AuthEventType.SIGNUP_SUCCESS,
    userId,
    email,
  });
};

export const logSignupFailure = (email: string, error: string) => {
  logAuthEvent({
    type: AuthEventType.SIGNUP_FAILURE,
    email,
    error,
  });
};

export const logLogout = (userId: string, email: string) => {
  logAuthEvent({
    type: AuthEventType.LOGOUT,
    userId,
    email,
  });
};

export const logPasswordResetRequest = (email: string) => {
  logAuthEvent({
    type: AuthEventType.PASSWORD_RESET_REQUEST,
    email,
  });
};

export const logPasswordResetSuccess = (email: string) => {
  logAuthEvent({
    type: AuthEventType.PASSWORD_RESET_SUCCESS,
    email,
  });
};

export const logPasswordResetFailure = (email: string, error: string) => {
  logAuthEvent({
    type: AuthEventType.PASSWORD_RESET_FAILURE,
    email,
    error,
  });
};

export const logRateLimitExceeded = (email: string) => {
  logAuthEvent({
    type: AuthEventType.RATE_LIMIT_EXCEEDED,
    email,
  });
};

export const logSuspiciousActivity = (email: string, metadata?: Record<string, any>) => {
  logAuthEvent({
    type: AuthEventType.SUSPICIOUS_ACTIVITY,
    email,
    metadata,
  });
};
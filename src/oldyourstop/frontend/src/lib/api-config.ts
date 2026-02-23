// API Configuration for restaurant data services

export const API_CONFIG = {
  // ✅ WORKING API Keys (Configured and Ready)
  GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY, // ✅ Working
  YELP_API_KEY: process.env.NEXT_PUBLIC_YELP_API_KEY || process.env.YELP_API_KEY, // ✅ Working
  FOURSQUARE_API_KEY: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY || process.env.FOURSQUARE_API_KEY, // ✅ Working
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, // ✅ Working
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY, // ✅ Working
  
  // Firebase Configuration - ✅ Working
  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  
  // ❌ NOT CONFIGURED API Keys (Future expansion)
  OPENTABLE_API_KEY: process.env.NEXT_PUBLIC_OPENTABLE_API_KEY, // ❌ Not configured
  RESY_API_KEY: process.env.NEXT_PUBLIC_RESY_API_KEY, // ❌ Not configured
  TOAST_API_KEY: process.env.NEXT_PUBLIC_TOAST_API_KEY, // ❌ Not configured
  SQUARE_API_KEY: process.env.NEXT_PUBLIC_SQUARE_API_KEY, // ❌ Not configured
  TRIPADVISOR_API_KEY: process.env.NEXT_PUBLIC_TRIPADVISOR_API_KEY, // ❌ Not configured

  // API Base URLs
  GOOGLE_PLACES_BASE_URL: 'https://maps.googleapis.com/maps/api/place',
  YELP_BASE_URL: 'https://api.yelp.com/v3',
  OPENTABLE_BASE_URL: 'https://platform.opentable.com/api',
  RESY_BASE_URL: 'https://api.resy.com',
  TOAST_BASE_URL: 'https://ws-api.toasttab.com',
  SQUARE_BASE_URL: 'https://connect.squareup.com/v2',
  TRIPADVISOR_BASE_URL: 'https://api.content.tripadvisor.com/api/v1',
  FOURSQUARE_BASE_URL: 'https://api.foursquare.com/v3',

  // Cache TTL (Time To Live) in milliseconds
  CACHE_TTL: {
    AVAILABILITY: 5 * 60 * 1000,      // 5 minutes
    MENU: 24 * 60 * 60 * 1000,        // 24 hours
    BASIC_INFO: 7 * 24 * 60 * 60 * 1000, // 7 days
    PHOTOS: 30 * 24 * 60 * 60 * 1000, // 30 days
    REVIEWS: 24 * 60 * 60 * 1000,     // 24 hours
  },

  // Refresh intervals
  REFRESH_INTERVALS: {
    AVAILABILITY: 5 * 60 * 1000,      // 5 minutes
    MENU: 60 * 60 * 1000,             // 1 hour
    BASIC_INFO: 24 * 60 * 60 * 1000,  // 24 hours
  },

  // Rate limiting
  RATE_LIMITS: {
    GOOGLE_PLACES: 1000, // requests per day
    YELP: 500,           // requests per day
    OPENTABLE: 100,      // requests per hour
    RESY: 100,           // requests per hour
    TOAST: 1000,         // requests per hour
    SQUARE: 1000,        // requests per hour
  },

  // London coordinates and search radius
  LONDON: {
    LATITUDE: 51.5074,
    LONGITUDE: -0.1278,
    RADIUS: 10000, // 10km radius
  },

  // Data quality thresholds
  QUALITY_THRESHOLDS: {
    MIN_RATING: 3.0,
    MIN_REVIEW_COUNT: 5,
    MAX_IMAGE_AGE_DAYS: 365,
    MAX_MENU_AGE_DAYS: 30,
  },
};

// Helper function to check if API key is configured
export function isApiKeyConfigured(service: keyof typeof API_CONFIG): boolean {
  const key = API_CONFIG[service];
  return key !== undefined && key !== null && key !== '';
}

// Get API key with fallback
export function getApiKey(service: keyof typeof API_CONFIG): string | null {
  const key = API_CONFIG[service];
  // Only return string values (API keys), not objects (config objects)
  return typeof key === 'string' && key !== '' ? key : null;
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(service: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(service) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(service, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

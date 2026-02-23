// API Keys Setup and Testing System
import { API_CONFIG, isApiKeyConfigured, getApiKey } from './api-config';

export interface ApiKeyStatus {
  service: string;
  configured: boolean;
  key: string | null;
  lastTested?: string;
  status: 'working' | 'error' | 'not_tested';
  error?: string;
}

export class ApiKeysManager {
  private apiStatus: Map<string, ApiKeyStatus> = new Map();

  constructor() {
    this.initializeApiStatus();
  }

  private initializeApiStatus() {
    const services = [
      // Essential APIs (priority for launch)
      'GOOGLE_PLACES_API_KEY',
      'YELP_API_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      
      // Optional APIs (for future expansion)
      'OPENTABLE_API_KEY',
      'RESY_API_KEY',
      'TOAST_API_KEY',
      'SQUARE_API_KEY',
      'TRIPADVISOR_API_KEY',
      'FOURSQUARE_API_KEY'
    ];

    services.forEach(service => {
      this.apiStatus.set(service, {
        service,
        configured: isApiKeyConfigured(service as keyof typeof API_CONFIG),
        key: getApiKey(service as keyof typeof API_CONFIG),
        status: 'not_tested'
      });
    });
  }

  // Test all configured API keys
  async testAllApis(): Promise<ApiKeyStatus[]> {
    const results: ApiKeyStatus[] = [];
    
    // Use Array.from to iterate over Map entries
    for (const [service, status] of Array.from(this.apiStatus.entries())) {
      if (status.configured) {
        const testResult = await this.testApiKey(service);
        results.push(testResult);
        this.apiStatus.set(service, testResult);
      } else {
        results.push(status);
      }
    }

    return results;
  }

  // Test individual API key
  async testApiKey(service: string): Promise<ApiKeyStatus> {
    const key = getApiKey(service as keyof typeof API_CONFIG);
    if (!key) {
      return {
        service,
        configured: false,
        key: null,
        status: 'error',
        error: 'No API key configured'
      };
    }

    try {
      const result = await this.performApiTest(service, key);
      return {
        service,
        configured: true,
        key: key.substring(0, 8) + '...', // Mask the key
        lastTested: new Date().toISOString(),
        status: result.success ? 'working' : 'error',
        error: result.error
      };
    } catch (error) {
      return {
        service,
        configured: true,
        key: key.substring(0, 8) + '...',
        lastTested: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async performApiTest(service: string, key: string): Promise<{ success: boolean; error?: string }> {
    switch (service) {
      // Essential APIs
      case 'GOOGLE_PLACES_API_KEY':
        return await this.testGooglePlaces(key);
      case 'YELP_API_KEY':
        return await this.testYelp(key);
      case 'STRIPE_PUBLISHABLE_KEY':
        return await this.testStripePublishable(key);
      case 'STRIPE_SECRET_KEY':
        return await this.testStripeSecret(key);
      
      // Optional APIs
      case 'OPENTABLE_API_KEY':
        return await this.testOpenTable(key);
      case 'RESY_API_KEY':
        return await this.testResy(key);
      case 'TOAST_API_KEY':
        return await this.testToast(key);
      case 'SQUARE_API_KEY':
        return await this.testSquare(key);
      case 'TRIPADVISOR_API_KEY':
        return await this.testTripAdvisor(key);
      case 'FOURSQUARE_API_KEY':
        return await this.testFoursquare(key);
      default:
        return { success: false, error: 'Unknown service' };
    }
  }

  private async testGooglePlaces(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${API_CONFIG.GOOGLE_PLACES_BASE_URL}/nearbysearch/json?location=${API_CONFIG.LONDON.LATITUDE},${API_CONFIG.LONDON.LONGITUDE}&radius=1000&type=restaurant&key=${key}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK') {
        return { success: true };
      } else {
        return { success: false, error: data.error_message || 'API error' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  private async testYelp(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `${API_CONFIG.YELP_BASE_URL}/businesses/search?location=London&categories=restaurants&limit=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: error || 'API error' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  private async testOpenTable(key: string): Promise<{ success: boolean; error?: string }> {
    // Mock test for now - OpenTable requires partner approval
    return { success: false, error: 'Requires partner approval' };
  }

  private async testResy(key: string): Promise<{ success: boolean; error?: string }> {
    // Mock test for now - Resy requires special setup
    return { success: false, error: 'Requires special setup' };
  }

  private async testToast(key: string): Promise<{ success: boolean; error?: string }> {
    // Mock test for now - Toast requires restaurant partnership
    return { success: false, error: 'Requires restaurant partnership' };
  }

  private async testSquare(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Test Square API by fetching locations (this is a basic test endpoint)
      const url = `${API_CONFIG.SQUARE_BASE_URL}/locations`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        }
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: error || 'API error' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  private async testTripAdvisor(key: string): Promise<{ success: boolean; error?: string }> {
    // Mock test for now - TripAdvisor requires special access
    return { success: false, error: 'Requires special access' };
  }

  private async testFoursquare(key: string): Promise<{ success: boolean; error?: string }> {
    // Mock test for now - Foursquare requires app setup
    return { success: false, error: 'Requires app setup' };
  }

  private async testStripePublishable(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Test Stripe publishable key by attempting to load Stripe
      if (typeof window !== 'undefined') {
        const { loadStripe } = await import('@stripe/stripe-js');
        const stripe = await loadStripe(key);
        return { success: !!stripe };
      }
      return { success: true }; // Server-side validation
    } catch (error) {
      return { success: false, error: 'Invalid Stripe publishable key' };
    }
  }

  private async testStripeSecret(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Test Stripe secret key by making a test API call
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: error || 'Invalid Stripe secret key' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Get API status summary
  getApiStatusSummary(): {
    total: number;
    configured: number;
    working: number;
    errors: number;
  } {
    const statuses = Array.from(this.apiStatus.values());
    return {
      total: statuses.length,
      configured: statuses.filter(s => s.configured).length,
      working: statuses.filter(s => s.status === 'working').length,
      errors: statuses.filter(s => s.status === 'error').length
    };
  }

  // Get configuration instructions
  getConfigurationInstructions(): { [key: string]: string } {
    return {
      // Essential APIs (priority for launch)
      'GOOGLE_PLACES_API_KEY': 'Get from Google Cloud Console > APIs & Services > Credentials (Free tier available)',
      'YELP_API_KEY': 'Get from Yelp Developers > Create App (Free tier available)',
      'STRIPE_PUBLISHABLE_KEY': 'Get from Stripe Dashboard > Developers > API Keys (Test mode)',
      'STRIPE_SECRET_KEY': 'Get from Stripe Dashboard > Developers > API Keys (Test mode)',
      
      // Optional APIs (for future expansion)
      'OPENTABLE_API_KEY': 'Apply for OpenTable Partner Program',
      'RESY_API_KEY': 'Contact Resy for API access',
      'TOAST_API_KEY': 'Partner with Toast POS restaurants',
      'SQUARE_API_KEY': 'Create Square Developer account (for menu data only)',
      'TRIPADVISOR_API_KEY': 'Apply for TripAdvisor Content API',
      'FOURSQUARE_API_KEY': 'Create Foursquare Developer account (Free tier available)'
    };
  }
}

export const apiKeysManager = new ApiKeysManager();

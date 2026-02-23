// Search Analytics and Autocomplete Service
interface SearchEvent {
  query: string;
  timestamp: number;
  resultsCount: number;
  filters?: Record<string, any>;
  location?: string;
  userId?: string;
  sessionId: string;
}

interface SearchSuggestion {
  text: string;
  type: 'restaurant' | 'cuisine' | 'location' | 'feature';
  popularity: number;
  lastUsed: number;
  count: number;
}

interface SearchAnalytics {
  totalSearches: number;
  popularQueries: Array<{ query: string; count: number }>;
  popularCuisines: Array<{ cuisine: string; count: number }>;
  popularLocations: Array<{ location: string; count: number }>;
  averageResultsCount: number;
  searchSuccessRate: number;
}

class SearchAnalyticsService {
  private events: SearchEvent[] = [];
  private suggestions: Map<string, SearchSuggestion> = new Map();
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  // Track search event
  trackSearch(event: Omit<SearchEvent, 'sessionId' | 'timestamp'>) {
    const searchEvent: SearchEvent = {
      ...event,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.events.push(searchEvent);
    this.updateSuggestions(searchEvent);
    this.saveToStorage();
  }

  // Update search suggestions based on event
  private updateSuggestions(event: SearchEvent) {
    const query = event.query.toLowerCase().trim();
    if (query.length < 2) return;

    // Update query suggestion
    const queryKey = `query:${query}`;
    const existingQuery = this.suggestions.get(queryKey);
    
    if (existingQuery) {
      existingQuery.count++;
      existingQuery.lastUsed = event.timestamp;
      existingQuery.popularity = this.calculatePopularity(existingQuery);
    } else {
      this.suggestions.set(queryKey, {
        text: query,
        type: 'restaurant',
        popularity: 1,
        lastUsed: event.timestamp,
        count: 1,
      });
    }

    // Update location suggestion if provided
    if (event.location) {
      const locationKey = `location:${event.location.toLowerCase()}`;
      const existingLocation = this.suggestions.get(locationKey);
      
      if (existingLocation) {
        existingLocation.count++;
        existingLocation.lastUsed = event.timestamp;
        existingLocation.popularity = this.calculatePopularity(existingLocation);
      } else {
        this.suggestions.set(locationKey, {
          text: event.location,
          type: 'location',
          popularity: 1,
          lastUsed: event.timestamp,
          count: 1,
        });
      }
    }

    // Extract and update cuisine suggestions from filters
    if (event.filters?.cuisine) {
      const cuisines = Array.isArray(event.filters.cuisine) 
        ? event.filters.cuisine 
        : [event.filters.cuisine];
      
      cuisines.forEach(cuisine => {
        const cuisineKey = `cuisine:${cuisine.toLowerCase()}`;
        const existingCuisine = this.suggestions.get(cuisineKey);
        
        if (existingCuisine) {
          existingCuisine.count++;
          existingCuisine.lastUsed = event.timestamp;
          existingCuisine.popularity = this.calculatePopularity(existingCuisine);
        } else {
          this.suggestions.set(cuisineKey, {
            text: cuisine,
            type: 'cuisine',
            popularity: 1,
            lastUsed: event.timestamp,
            count: 1,
          });
        }
      });
    }
  }

  // Calculate popularity score
  private calculatePopularity(suggestion: SearchSuggestion): number {
    const recency = Date.now() - suggestion.lastUsed;
    const recencyScore = Math.max(0, 1 - (recency / (30 * 24 * 60 * 60 * 1000))); // 30 days
    const frequencyScore = Math.log(suggestion.count + 1);
    
    return recencyScore * 0.3 + frequencyScore * 0.7;
  }

  // Get search suggestions
  getSuggestions(query: string, limit: number = 10): SearchSuggestion[] {
    if (query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const suggestions: SearchSuggestion[] = [];

    // Find matching suggestions
    for (const [key, suggestion] of this.suggestions) {
      if (suggestion.text.includes(normalizedQuery)) {
        suggestions.push(suggestion);
      }
    }

    // Sort by popularity and relevance
    suggestions.sort((a, b) => {
      const aRelevance = a.text.startsWith(normalizedQuery) ? 1 : 0;
      const bRelevance = b.text.startsWith(normalizedQuery) ? 1 : 0;
      
      if (aRelevance !== bRelevance) {
        return bRelevance - aRelevance;
      }
      
      return b.popularity - a.popularity;
    });

    return suggestions.slice(0, limit);
  }

  // Get search analytics
  getAnalytics(): SearchAnalytics {
    const totalSearches = this.events.length;
    const successfulSearches = this.events.filter(e => e.resultsCount > 0).length;
    
    // Popular queries
    const queryCounts = new Map<string, number>();
    this.events.forEach(event => {
      const query = event.query.toLowerCase();
      queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
    });
    
    const popularQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Popular cuisines
    const cuisineCounts = new Map<string, number>();
    this.events.forEach(event => {
      if (event.filters?.cuisine) {
        const cuisines = Array.isArray(event.filters.cuisine) 
          ? event.filters.cuisine 
          : [event.filters.cuisine];
        
        cuisines.forEach(cuisine => {
          cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + 1);
        });
      }
    });
    
    const popularCuisines = Array.from(cuisineCounts.entries())
      .map(([cuisine, count]) => ({ cuisine, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Popular locations
    const locationCounts = new Map<string, number>();
    this.events.forEach(event => {
      if (event.location) {
        locationCounts.set(event.location, (locationCounts.get(event.location) || 0) + 1);
      }
    });
    
    const popularLocations = Array.from(locationCounts.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average results count
    const averageResultsCount = totalSearches > 0 
      ? this.events.reduce((sum, event) => sum + event.resultsCount, 0) / totalSearches
      : 0;

    // Search success rate
    const searchSuccessRate = totalSearches > 0 
      ? (successfulSearches / totalSearches) * 100
      : 0;

    return {
      totalSearches,
      popularQueries,
      popularCuisines,
      popularLocations,
      averageResultsCount,
      searchSuccessRate,
    };
  }

  // Get search history for user
  getSearchHistory(limit: number = 20): string[] {
    const recentSearches = this.events
      .filter(event => event.userId === this.userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(event => event.query);

    // Remove duplicates while preserving order
    return [...new Set(recentSearches)];
  }

  // Clear search history
  clearSearchHistory() {
    this.events = this.events.filter(event => event.userId !== this.userId);
    this.saveToStorage();
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save to localStorage
  private saveToStorage() {
    try {
      const data = {
        events: this.events.slice(-1000), // Keep only last 1000 events
        suggestions: Array.from(this.suggestions.entries()),
        sessionId: this.sessionId,
        userId: this.userId,
      };
      localStorage.setItem('search_analytics', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save search analytics:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage() {
    try {
      const data = localStorage.getItem('search_analytics');
      if (data) {
        const parsed = JSON.parse(data);
        this.events = parsed.events || [];
        this.suggestions = new Map(parsed.suggestions || []);
        this.sessionId = parsed.sessionId || this.sessionId;
        this.userId = parsed.userId;
      }
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    }
  }

  // Export analytics data
  exportAnalytics() {
    return {
      events: this.events,
      suggestions: Array.from(this.suggestions.entries()),
      analytics: this.getAnalytics(),
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  // Import analytics data
  importAnalytics(data: any) {
    try {
      this.events = data.events || [];
      this.suggestions = new Map(data.suggestions || []);
      this.sessionId = data.sessionId || this.sessionId;
      this.userId = data.userId;
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to import search analytics:', error);
    }
  }
}

// Create singleton instance
export const searchAnalyticsService = new SearchAnalyticsService();

// Hook for search analytics
export function useSearchAnalytics() {
  const trackSearch = useCallback((event: Omit<SearchEvent, 'sessionId' | 'timestamp'>) => {
    searchAnalyticsService.trackSearch(event);
  }, []);

  const getSuggestions = useCallback((query: string, limit?: number) => {
    return searchAnalyticsService.getSuggestions(query, limit);
  }, []);

  const getAnalytics = useCallback(() => {
    return searchAnalyticsService.getAnalytics();
  }, []);

  const getSearchHistory = useCallback((limit?: number) => {
    return searchAnalyticsService.getSearchHistory(limit);
  }, []);

  const clearSearchHistory = useCallback(() => {
    searchAnalyticsService.clearSearchHistory();
  }, []);

  const setUserId = useCallback((userId: string) => {
    searchAnalyticsService.setUserId(userId);
  }, []);

  return {
    trackSearch,
    getSuggestions,
    getAnalytics,
    getSearchHistory,
    clearSearchHistory,
    setUserId,
  };
}

// Geolocation service for location-based search
class GeolocationService {
  private currentLocation: { lat: number; lng: number } | null = null;
  private watchId: number | null = null;

  // Get current location
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // Watch location changes
  watchLocation(callback: (location: { lat: number; lng: number }) => void) {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.currentLocation = location;
        callback(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
      }
    );
  }

  // Stop watching location
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get cached location
  getCachedLocation() {
    return this.currentLocation;
  }

  // Calculate distance between two points
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const geolocationService = new GeolocationService();

// Hook for geolocation
export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await geolocationService.getCurrentLocation();
      setLocation(loc);
      return loc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const watchLocation = useCallback((callback?: (location: { lat: number; lng: number }) => void) => {
    geolocationService.watchLocation((loc) => {
      setLocation(loc);
      callback?.(loc);
    });
  }, []);

  const stopWatching = useCallback(() => {
    geolocationService.stopWatching();
  }, []);

  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number) => {
      return geolocationService.calculateDistance(lat1, lng1, lat2, lng2);
    },
    []
  );

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    calculateDistance,
  };
}

// Import required hooks
import { useCallback, useState } from 'react';

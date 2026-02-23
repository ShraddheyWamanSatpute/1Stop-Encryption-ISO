// Advanced Search and Filtering Service
export interface SearchFilters {
  // Location-based filters
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
  postcode?: string;
  borough?: string;
  area?: string;

  // Restaurant characteristics
  cuisine?: string[];
  priceRange?: string[]; // ['£', '££', '£££', '££££']
  rating?: {
    min: number;
    max: number;
  };
  
  // Availability and booking
  date?: string;
  time?: string;
  partySize?: number;
  availableNow?: boolean;

  // Features and amenities
  features?: string[];
  accessibility?: string[];
  dietaryOptions?: string[];

  // Menu-specific filters
  hasMenu?: boolean;
  menuItems?: string[];
  allergenFree?: string[];

  // Business details
  openNow?: boolean;
  acceptsReservations?: boolean;
  hasOutdoorSeating?: boolean;
  hasWifi?: boolean;
  hasParking?: boolean;

  // Advanced filters
  newRestaurants?: boolean; // opened in last 6 months
  trending?: boolean; // high recent booking activity
  verified?: boolean; // verified by platform
  hasPhotos?: boolean;
  hasReviews?: boolean;

  // Sorting options
  sortBy?: 'distance' | 'rating' | 'price' | 'popularity' | 'newest' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

export interface SearchResult {
  restaurants: any[];
  total: number;
  page: number;
  totalPages: number;
  filters: SearchFilters;
  searchTime: number;
  suggestions?: string[];
  facets?: SearchFacets;
}

export interface SearchFacets {
  cuisines: { name: string; count: number }[];
  priceRanges: { range: string; count: number }[];
  ratings: { rating: number; count: number }[];
  features: { feature: string; count: number }[];
  boroughs: { borough: string; count: number }[];
}

export interface SearchSuggestion {
  type: 'restaurant' | 'cuisine' | 'location' | 'dish';
  text: string;
  count?: number;
}

export class AdvancedSearchService {
  private readonly SEARCH_CACHE = new Map<string, { result: SearchResult, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for search results
  private readonly SUGGESTION_CACHE = new Map<string, SearchSuggestion[]>();

  // Main search method with advanced filtering
  async searchRestaurants(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    console.log('🔍 Advanced restaurant search with filters:', filters);

    // Generate cache key
    const cacheKey = this.generateCacheKey(filters);
    
    // Check cache
    const cached = this.SEARCH_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('📋 Using cached search results');
      return cached.result;
    }

    try {
      // Get base restaurant data
      const baseResults = await this.getBaseRestaurantData();
      
      // Apply all filters
      let filteredResults = baseResults;
      
      // Location-based filtering
      if (filters.location) {
        filteredResults = this.filterByLocation(filteredResults, filters.location);
      }
      
      if (filters.postcode) {
        filteredResults = this.filterByPostcode(filteredResults, filters.postcode);
      }
      
      if (filters.borough) {
        filteredResults = this.filterByBorough(filteredResults, filters.borough);
      }

      // Restaurant characteristics
      if (filters.cuisine && filters.cuisine.length > 0) {
        filteredResults = this.filterByCuisine(filteredResults, filters.cuisine);
      }
      
      if (filters.priceRange && filters.priceRange.length > 0) {
        filteredResults = this.filterByPriceRange(filteredResults, filters.priceRange);
      }
      
      if (filters.rating) {
        filteredResults = this.filterByRating(filteredResults, filters.rating);
      }

      // Availability filters
      if (filters.availableNow) {
        filteredResults = this.filterByAvailability(filteredResults, filters.date, filters.time, filters.partySize);
      }

      // Feature filters
      if (filters.features && filters.features.length > 0) {
        filteredResults = this.filterByFeatures(filteredResults, filters.features);
      }

      if (filters.accessibility && filters.accessibility.length > 0) {
        filteredResults = this.filterByAccessibility(filteredResults, filters.accessibility);
      }

      if (filters.dietaryOptions && filters.dietaryOptions.length > 0) {
        filteredResults = this.filterByDietaryOptions(filteredResults, filters.dietaryOptions);
      }

      // Business detail filters
      if (filters.openNow) {
        filteredResults = this.filterByOpenNow(filteredResults);
      }

      if (filters.hasOutdoorSeating) {
        filteredResults = this.filterByOutdoorSeating(filteredResults);
      }

      // Advanced filters
      if (filters.newRestaurants) {
        filteredResults = this.filterByNewRestaurants(filteredResults);
      }

      if (filters.trending) {
        filteredResults = this.filterByTrending(filteredResults);
      }

      if (filters.verified) {
        filteredResults = this.filterByVerified(filteredResults);
      }

      // Sort results
      filteredResults = this.sortResults(filteredResults, filters.sortBy || 'rating', filters.sortOrder || 'desc');

      // Generate facets for refinement
      const facets = this.generateFacets(baseResults, filteredResults);

      // Paginate results
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(filters, filteredResults);

      const searchResult: SearchResult = {
        restaurants: paginatedResults,
        total: filteredResults.length,
        page,
        totalPages: Math.ceil(filteredResults.length / limit),
        filters,
        searchTime: Date.now() - startTime,
        suggestions,
        facets
      };

      // Cache the result
      this.SEARCH_CACHE.set(cacheKey, { result: searchResult, timestamp: Date.now() });

      return searchResult;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed');
    }
  }

  // Get base restaurant data from your existing API
  private async getBaseRestaurantData(): Promise<any[]> {
    try {
      const { apiFetch } = await import('./api-client');
      const response = await apiFetch('/api/restaurants');
      const data = await response.json();
      return data.restaurants || [];
    } catch (error) {
      console.error('Failed to get base restaurant data:', error);
      return [];
    }
  }

  // Location-based filtering with distance calculation
  private filterByLocation(restaurants: any[], location: { latitude: number; longitude: number; radius: number }): any[] {
    return restaurants.filter(restaurant => {
      if (!restaurant.location?.latitude || !restaurant.location?.longitude) {
        return false;
      }

      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        restaurant.location.latitude,
        restaurant.location.longitude
      );

      // Add distance to restaurant object for sorting
      restaurant.distance = distance;
      
      return distance <= location.radius;
    });
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Filter by postcode
  private filterByPostcode(restaurants: any[], postcode: string): any[] {
    const postcodePrefix = postcode.toUpperCase().split(' ')[0];
    return restaurants.filter(restaurant => 
      restaurant.location?.postcode?.toUpperCase().startsWith(postcodePrefix)
    );
  }

  // Filter by borough
  private filterByBorough(restaurants: any[], borough: string): any[] {
    return restaurants.filter(restaurant => 
      restaurant.location?.area?.toLowerCase().includes(borough.toLowerCase()) ||
      restaurant.address?.toLowerCase().includes(borough.toLowerCase())
    );
  }

  // Filter by cuisine types
  private filterByCuisine(restaurants: any[], cuisines: string[]): any[] {
    return restaurants.filter(restaurant => {
      const restaurantCuisine = restaurant.cuisine?.toLowerCase() || '';
      return cuisines.some(cuisine => 
        restaurantCuisine.includes(cuisine.toLowerCase())
      );
    });
  }

  // Filter by price range
  private filterByPriceRange(restaurants: any[], priceRanges: string[]): any[] {
    return restaurants.filter(restaurant => 
      priceRanges.includes(restaurant.priceRange)
    );
  }

  // Filter by rating
  private filterByRating(restaurants: any[], rating: { min: number; max: number }): any[] {
    return restaurants.filter(restaurant => {
      const restaurantRating = restaurant.rating || 0;
      return restaurantRating >= rating.min && restaurantRating <= rating.max;
    });
  }

  // Filter by availability (placeholder - would integrate with booking system)
  private filterByAvailability(restaurants: any[], date?: string, time?: string, partySize?: number): any[] {
    // This would integrate with your real-time booking system
    // For now, return restaurants that accept reservations
    return restaurants.filter(restaurant => 
      restaurant.acceptsReservations !== false
    );
  }

  // Filter by features
  private filterByFeatures(restaurants: any[], features: string[]): any[] {
    return restaurants.filter(restaurant => {
      const restaurantFeatures = restaurant.features || [];
      return features.every(feature => 
        restaurantFeatures.some((f: string) => 
          f.toLowerCase().includes(feature.toLowerCase())
        )
      );
    });
  }

  // Filter by accessibility options
  private filterByAccessibility(restaurants: any[], accessibility: string[]): any[] {
    return restaurants.filter(restaurant => {
      const restaurantFeatures = restaurant.features || [];
      return accessibility.every(option => 
        restaurantFeatures.some((f: string) => 
          f.toLowerCase().includes(option.toLowerCase()) ||
          f.toLowerCase().includes('wheelchair') ||
          f.toLowerCase().includes('accessible')
        )
      );
    });
  }

  // Filter by dietary options
  private filterByDietaryOptions(restaurants: any[], dietaryOptions: string[]): any[] {
    return restaurants.filter(restaurant => {
      const features = restaurant.features || [];
      const specialties = restaurant.specialties || [];
      const allOptions = [...features, ...specialties].join(' ').toLowerCase();
      
      return dietaryOptions.every(option => 
        allOptions.includes(option.toLowerCase()) ||
        allOptions.includes('vegetarian') ||
        allOptions.includes('vegan') ||
        allOptions.includes('gluten-free')
      );
    });
  }

  // Filter by currently open restaurants
  private filterByOpenNow(restaurants: any[]): any[] {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()]; // Get correct day name
    const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 1430 for 2:30 PM

    return restaurants.filter(restaurant => {
      const hours = restaurant.operatingHours?.[currentDay];
      if (!hours || hours.isClosed) return false;

      const openTime = this.timeStringToNumber(hours.open);
      const closeTime = this.timeStringToNumber(hours.close);

      return currentTime >= openTime && currentTime <= closeTime;
    });
  }

  private timeStringToNumber(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  // Filter by outdoor seating
  private filterByOutdoorSeating(restaurants: any[]): any[] {
    return restaurants.filter(restaurant => {
      const features = restaurant.features || [];
      return features.some((f: string) => 
        f.toLowerCase().includes('outdoor') ||
        f.toLowerCase().includes('terrace') ||
        f.toLowerCase().includes('patio') ||
        f.toLowerCase().includes('garden')
      );
    });
  }

  // Filter by new restaurants (opened in last 6 months)
  private filterByNewRestaurants(restaurants: any[]): any[] {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return restaurants.filter(restaurant => {
      const lastUpdated = new Date(restaurant.lastUpdated || restaurant.dataSource?.lastSync);
      return lastUpdated > sixMonthsAgo;
    });
  }

  // Filter by trending restaurants
  private filterByTrending(restaurants: any[]): any[] {
    // This would integrate with booking analytics
    // For now, filter by high ratings and recent activity
    return restaurants.filter(restaurant => 
      restaurant.rating >= 4.2 && restaurant.reviewCount > 50
    );
  }

  // Filter by verified restaurants
  private filterByVerified(restaurants: any[]): any[] {
    return restaurants.filter(restaurant => 
      restaurant.dataSource?.reliability >= 80 ||
      restaurant.dataSource?.primary === 'google_places'
    );
  }

  // Sort results by various criteria
  private sortResults(restaurants: any[], sortBy: string, sortOrder: string): any[] {
    const sortedRestaurants = [...restaurants];

    sortedRestaurants.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'distance':
          comparison = (a.distance || 0) - (b.distance || 0);
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'price':
          const priceOrder = { '£': 1, '££': 2, '£££': 3, '££££': 4 };
          comparison = (priceOrder[a.priceRange as keyof typeof priceOrder] || 2) - 
                      (priceOrder[b.priceRange as keyof typeof priceOrder] || 2);
          break;
        case 'popularity':
          comparison = (b.reviewCount || 0) - (a.reviewCount || 0);
          break;
        case 'alphabetical':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'newest':
          const aDate = new Date(a.lastUpdated || a.dataSource?.lastSync || 0);
          const bDate = new Date(b.lastUpdated || b.dataSource?.lastSync || 0);
          comparison = bDate.getTime() - aDate.getTime();
          break;
        default:
          comparison = (b.rating || 0) - (a.rating || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sortedRestaurants;
  }

  // Generate search facets for refinement
  private generateFacets(allRestaurants: any[], filteredRestaurants: any[]): SearchFacets {
    const facets: SearchFacets = {
      cuisines: [],
      priceRanges: [],
      ratings: [],
      features: [],
      boroughs: []
    };

    // Generate cuisine facets
    const cuisineCount = new Map<string, number>();
    filteredRestaurants.forEach(restaurant => {
      const cuisine = restaurant.cuisine || 'Other';
      cuisineCount.set(cuisine, (cuisineCount.get(cuisine) || 0) + 1);
    });
    facets.cuisines = Array.from(cuisineCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Generate price range facets
    const priceCount = new Map<string, number>();
    filteredRestaurants.forEach(restaurant => {
      const price = restaurant.priceRange || '££';
      priceCount.set(price, (priceCount.get(price) || 0) + 1);
    });
    facets.priceRanges = Array.from(priceCount.entries())
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => a.range.length - b.range.length);

    // Generate rating facets
    const ratingCount = new Map<number, number>();
    filteredRestaurants.forEach(restaurant => {
      const rating = Math.floor(restaurant.rating || 0);
      ratingCount.set(rating, (ratingCount.get(rating) || 0) + 1);
    });
    facets.ratings = Array.from(ratingCount.entries())
      .map(([rating, count]) => ({ rating, count }))
      .sort((a, b) => b.rating - a.rating);

    return facets;
  }

  // Generate search suggestions
  private async generateSearchSuggestions(filters: SearchFilters, results: any[]): Promise<string[]> {
    const suggestions: string[] = [];

    // Suggest popular cuisines if none selected
    if (!filters.cuisine || filters.cuisine.length === 0) {
      const topCuisines = results
        .map(r => r.cuisine)
        .filter(Boolean)
        .reduce((acc: Record<string, number>, cuisine: string) => {
          acc[cuisine] = (acc[cuisine] || 0) + 1;
          return acc;
        }, {});

      Object.entries(topCuisines)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .forEach(([cuisine]) => suggestions.push(`Try ${cuisine} restaurants`));
    }

    // Suggest nearby areas
    if (results.length > 0) {
      const areas = results
        .map(r => r.location?.area)
        .filter(Boolean)
        .slice(0, 2);
      areas.forEach(area => suggestions.push(`Restaurants in ${area}`));
    }

    return suggestions;
  }

  // Generate cache key from filters
  private generateCacheKey(filters: SearchFilters): string {
    return JSON.stringify(filters);
  }

  // Clear search cache
  clearCache(): void {
    this.SEARCH_CACHE.clear();
    this.SUGGESTION_CACHE.clear();
  }

  // Get popular search terms
  getPopularSearchTerms(): string[] {
    return [
      'Italian restaurants near me',
      'Best rated restaurants',
      'Restaurants with outdoor seating',
      'Vegetarian friendly',
      'Open now',
      'Fine dining',
      'Casual dining',
      'Family friendly',
      'Date night restaurants',
      'Business lunch venues'
    ];
  }
}

export const advancedSearchService = new AdvancedSearchService();

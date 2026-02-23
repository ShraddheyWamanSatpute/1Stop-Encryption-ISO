'use client';

import { RestaurantData } from './restaurant-data-types';

export interface UnifiedFilterState {
  // Search
  searchQuery: string;
  locationQuery: string;
  
  // Basic filters
  cuisine: string[];
  priceRange: string[];
  rating: {
    min: number;
    max: number;
  };
  
  // Location filters
  region: string;
  area: string;
  distance: string;
  
  // Advanced filters
  dietary: string[];
  features: string[];
  amenities: string[];
  
  // Availability
  openNow: boolean;
  hasAvailability: boolean;
  
  // Sorting
  sortBy: 'rating' | 'name' | 'price' | 'distance' | 'reviews' | 'newest';
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  page: number;
  limit: number;
}

export interface FilterOptions {
  cuisines: string[];
  priceRanges: string[];
  regions: string[];
  areas: string[];
  dietaryOptions: string[];
  features: string[];
  amenities: string[];
}

export interface FilterResult {
  restaurants: RestaurantData[];
  total: number;
  facets: {
    cuisines: { [key: string]: number };
    priceRanges: { [key: string]: number };
    ratings: { [key: string]: number };
    areas: { [key: string]: number };
  };
}

export class UnifiedFilterService {
  private static instance: UnifiedFilterService;
  
  public static getInstance(): UnifiedFilterService {
    if (!UnifiedFilterService.instance) {
      UnifiedFilterService.instance = new UnifiedFilterService();
    }
    return UnifiedFilterService.instance;
  }

  // Default filter state
  getDefaultFilters(): UnifiedFilterState {
    return {
      searchQuery: '',
      locationQuery: '',
      cuisine: [],
      priceRange: [],
      rating: { min: 0, max: 5 },
      region: 'all',
      area: 'all',
      distance: 'all',
      dietary: [],
      features: [],
      amenities: [],
      openNow: false,
      hasAvailability: false,
      sortBy: 'rating',
      sortOrder: 'desc',
      page: 1,
      limit: 20
    };
  }

  // Get available filter options from restaurant data
  getFilterOptions(restaurants: RestaurantData[]): FilterOptions {
    const cuisines = new Set<string>();
    const priceRanges = new Set<string>();
    const regions = new Set<string>();
    const areas = new Set<string>();
    const dietaryOptions = new Set<string>();
    const features = new Set<string>();
    const amenities = new Set<string>();

    restaurants.forEach(restaurant => {
      // Extract cuisines
      if (restaurant.cuisine) {
        const cuisineList = Array.isArray(restaurant.cuisine) 
          ? restaurant.cuisine 
          : restaurant.cuisine.split(',').map(c => c.trim());
        cuisineList.forEach(c => cuisines.add(c));
      }

      // Extract price ranges
      if (restaurant.priceRange) {
        priceRanges.add(restaurant.priceRange);
      }

      // Extract regions and areas from address
      if (restaurant.address) {
        const addressParts = restaurant.address.split(',').map(p => p.trim());
        if (addressParts.length > 1) {
          areas.add(addressParts[1]);
        }
        if (addressParts.length > 2) {
          regions.add(addressParts[2]);
        }
      }

      // Extract dietary options from description or features
      if (restaurant.description) {
        const description = restaurant.description.toLowerCase();
        if (description.includes('vegetarian') || description.includes('vegan')) {
          dietaryOptions.add('vegetarian');
        }
        if (description.includes('gluten-free') || description.includes('gluten free')) {
          dietaryOptions.add('gluten-free');
        }
        if (description.includes('halal')) {
          dietaryOptions.add('halal');
        }
        if (description.includes('kosher')) {
          dietaryOptions.add('kosher');
        }
      }

      // Extract features and amenities
      if (restaurant.features) {
        restaurant.features.forEach(feature => features.add(feature));
      }

      if (restaurant.amenities) {
        restaurant.amenities.forEach(amenity => amenities.add(amenity));
      }
    });

    return {
      cuisines: Array.from(cuisines).sort(),
      priceRanges: Array.from(priceRanges).sort(),
      regions: Array.from(regions).sort(),
      areas: Array.from(areas).sort(),
      dietaryOptions: Array.from(dietaryOptions).sort(),
      features: Array.from(features).sort(),
      amenities: Array.from(amenities).sort()
    };
  }

  // Apply filters to restaurant data
  applyFilters(restaurants: RestaurantData[], filters: UnifiedFilterState): FilterResult {
    let filtered = [...restaurants];

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisine.toLowerCase().includes(query) ||
        restaurant.description?.toLowerCase().includes(query) ||
        restaurant.address.toLowerCase().includes(query)
      );
    }

    // Location query filter
    if (filters.locationQuery) {
      const location = filters.locationQuery.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.address.toLowerCase().includes(location)
      );
    }

    // Cuisine filter
    if (filters.cuisine.length > 0) {
      filtered = filtered.filter(restaurant => {
        const restaurantCuisines = Array.isArray(restaurant.cuisine) 
          ? restaurant.cuisine 
          : restaurant.cuisine.split(',').map(c => c.trim().toLowerCase());
        return filters.cuisine.some(filterCuisine => 
          restaurantCuisines.some(restaurantCuisine => 
            restaurantCuisine.includes(filterCuisine.toLowerCase())
          )
        );
      });
    }

    // Price range filter
    if (filters.priceRange.length > 0) {
      filtered = filtered.filter(restaurant => 
        filters.priceRange.includes(restaurant.priceRange)
      );
    }

    // Rating filter
    filtered = filtered.filter(restaurant => 
      restaurant.rating >= filters.rating.min && restaurant.rating <= filters.rating.max
    );

    // Region filter
    if (filters.region !== 'all') {
      filtered = filtered.filter(restaurant => 
        restaurant.address.toLowerCase().includes(filters.region.toLowerCase())
      );
    }

    // Area filter
    if (filters.area !== 'all') {
      filtered = filtered.filter(restaurant => 
        restaurant.address.toLowerCase().includes(filters.area.toLowerCase())
      );
    }

    // Dietary filter
    if (filters.dietary.length > 0) {
      filtered = filtered.filter(restaurant => {
        const description = (restaurant.description || '').toLowerCase();
        return filters.dietary.some(dietary => {
          switch (dietary) {
            case 'vegetarian':
              return description.includes('vegetarian') || description.includes('vegan');
            case 'gluten-free':
              return description.includes('gluten-free') || description.includes('gluten free');
            case 'halal':
              return description.includes('halal');
            case 'kosher':
              return description.includes('kosher');
            default:
              return false;
          }
        });
      });
    }

    // Features filter
    if (filters.features.length > 0) {
      filtered = filtered.filter(restaurant => 
        filters.features.some(feature => 
          restaurant.features?.includes(feature)
        )
      );
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(restaurant => 
        filters.amenities.some(amenity => 
          restaurant.amenities?.includes(amenity)
        )
      );
    }

    // Open now filter
    if (filters.openNow) {
      filtered = filtered.filter(restaurant => 
        restaurant.isOpen === true
      );
    }

    // Sort results
    filtered = this.sortRestaurants(filtered, filters.sortBy, filters.sortOrder);

    // Generate facets
    const facets = this.generateFacets(restaurants, filtered);

    return {
      restaurants: filtered,
      total: filtered.length,
      facets
    };
  }

  // Sort restaurants
  private sortRestaurants(restaurants: RestaurantData[], sortBy: string, sortOrder: 'asc' | 'desc'): RestaurantData[] {
    return [...restaurants].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = this.getPriceValue(a.priceRange) - this.getPriceValue(b.priceRange);
          break;
        case 'reviews':
          comparison = (a.reviewCount || 0) - (b.reviewCount || 0);
          break;
        case 'newest':
          comparison = new Date(a.lastUpdated || 0).getTime() - new Date(b.lastUpdated || 0).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  // Get numeric value for price range sorting
  private getPriceValue(priceRange: string): number {
    const priceMap: { [key: string]: number } = {
      '£': 1,
      '££': 2,
      '£££': 3,
      '££££': 4,
      '$': 1,
      '$$': 2,
      '$$$': 3,
      '$$$$': 4
    };
    return priceMap[priceRange] || 0;
  }

  // Generate facets for filtering
  private generateFacets(allRestaurants: RestaurantData[], filteredRestaurants: RestaurantData[]): any {
    const facets = {
      cuisines: {} as { [key: string]: number },
      priceRanges: {} as { [key: string]: number },
      ratings: {} as { [key: string]: number },
      areas: {} as { [key: string]: number }
    };

    // Count facets from filtered results
    filteredRestaurants.forEach(restaurant => {
      // Cuisine facets
      const cuisines = Array.isArray(restaurant.cuisine) 
        ? restaurant.cuisine 
        : restaurant.cuisine.split(',').map(c => c.trim());
      cuisines.forEach(cuisine => {
        facets.cuisines[cuisine] = (facets.cuisines[cuisine] || 0) + 1;
      });

      // Price range facets
      facets.priceRanges[restaurant.priceRange] = (facets.priceRanges[restaurant.priceRange] || 0) + 1;

      // Rating facets
      const ratingRange = Math.floor(restaurant.rating);
      facets.ratings[`${ratingRange}-${ratingRange + 1}`] = (facets.ratings[`${ratingRange}-${ratingRange + 1}`] || 0) + 1;

      // Area facets
      const addressParts = restaurant.address.split(',').map(p => p.trim());
      if (addressParts.length > 1) {
        const area = addressParts[1];
        facets.areas[area] = (facets.areas[area] || 0) + 1;
      }
    });

    return facets;
  }

  // Clear all filters
  clearFilters(): UnifiedFilterState {
    return this.getDefaultFilters();
  }

  // Update specific filter
  updateFilter(filters: UnifiedFilterState, key: keyof UnifiedFilterState, value: any): UnifiedFilterState {
    return {
      ...filters,
      [key]: value
    };
  }

  // Get filter summary
  getFilterSummary(filters: UnifiedFilterState): string[] {
    const summary: string[] = [];

    if (filters.searchQuery) {
      summary.push(`Search: "${filters.searchQuery}"`);
    }

    if (filters.locationQuery) {
      summary.push(`Location: "${filters.locationQuery}"`);
    }

    if (filters.cuisine.length > 0) {
      summary.push(`Cuisines: ${filters.cuisine.join(', ')}`);
    }

    if (filters.priceRange.length > 0) {
      summary.push(`Price: ${filters.priceRange.join(', ')}`);
    }

    if (filters.rating.min > 0 || filters.rating.max < 5) {
      summary.push(`Rating: ${filters.rating.min}-${filters.rating.max} stars`);
    }

    if (filters.region !== 'all') {
      summary.push(`Region: ${filters.region}`);
    }

    if (filters.area !== 'all') {
      summary.push(`Area: ${filters.area}`);
    }

    if (filters.dietary.length > 0) {
      summary.push(`Dietary: ${filters.dietary.join(', ')}`);
    }

    if (filters.features.length > 0) {
      summary.push(`Features: ${filters.features.join(', ')}`);
    }

    if (filters.openNow) {
      summary.push('Open Now');
    }

    return summary;
  }
}

export const unifiedFilterService = UnifiedFilterService.getInstance();

// Real-time restaurant data service for London restaurants
import { 
  RestaurantData, 
  RestaurantSearchResult, 
  RestaurantSearchFilters,
  GooglePlacesResponse,
  YelpBusinessResponse,
  DataFreshness,
  RealTimeAvailability,
  MenuData,
  ReviewData
} from './restaurant-data-types';
import { API_CONFIG, isApiKeyConfigured, getApiKey, rateLimiter } from './api-config';
import { mockRestaurants, mockAvailability, mockMenu, mockReviews, generateMockAvailability } from './mock-restaurant-data';
import { freeRestaurantDataService } from './free-restaurant-apis';
import { enhancedMenuService } from './enhanced-menu-service';

class RestaurantDataService {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // Use cache TTL from config
  private readonly CACHE_TTL = API_CONFIG.CACHE_TTL;

  // Get restaurants with real-time data and pagination support
  async getRestaurants(filters?: RestaurantSearchFilters & { page?: number; limit?: number }): Promise<RestaurantSearchResult> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 30;
    const cacheKey = `restaurants_${JSON.stringify(filters)}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.BASIC_INFO);
    
    // For pagination, we need to fetch all data first, then paginate
    // Cache the full dataset separately
    const fullDataCacheKey = `restaurants_full_${JSON.stringify({ ...filters, page: undefined, limit: undefined })}`;
    let allRestaurants: RestaurantData[] = [];
    
    // Try to get full dataset from cache
    const cachedFull = this.getCachedData(fullDataCacheKey, this.CACHE_TTL.BASIC_INFO);
    if (cachedFull && Array.isArray(cachedFull)) {
      allRestaurants = cachedFull;
    } else {
      try {
        // Check if any API keys are configured
        const hasGooglePlaces = isApiKeyConfigured('GOOGLE_PLACES_API_KEY');
        const hasYelp = isApiKeyConfigured('YELP_API_KEY');
        const hasOpenTable = isApiKeyConfigured('OPENTABLE_API_KEY');

        // Try the comprehensive free data service first
        console.log('🚀 Using comprehensive free restaurant data service');
        const comprehensiveData = await freeRestaurantDataService.getComprehensiveRestaurantData('London, UK', 10000);
        
        if (comprehensiveData.length > 0) {
          console.log(`✅ Free service returned ${comprehensiveData.length} comprehensive restaurants`);
          allRestaurants = comprehensiveData.map(data => this.transformComprehensiveData(data));
        } else if (hasGooglePlaces || hasYelp || hasOpenTable) {
          // Fallback to individual APIs
          const promises = [];
          
          if (hasGooglePlaces) {
            console.log('🔍 Fallback: Fetching from Google Places API');
            promises.push(this.fetchGooglePlacesData(filters));
          }
          
          if (hasYelp) {
            console.log('🔍 Fallback: Fetching from Yelp API');
            promises.push(this.fetchYelpData(filters));
          }
          
          if (hasOpenTable) {
            console.log('🔍 Fallback: Fetching from OpenTable API');
            promises.push(this.fetchOpenTableData(filters));
          }

          const results = await Promise.allSettled(promises);
          
          // Merge data from successful API calls
          const apiRestaurants: RestaurantData[] = [];
          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
              apiRestaurants.push(...result.value);
              console.log(`✅ Fallback API ${index + 1} returned ${result.value.length} restaurants`);
            } else if (result.status === 'rejected') {
              console.warn(`⚠️ Fallback API ${index + 1} failed:`, result.reason);
            }
          });

          allRestaurants = this.mergeRestaurantData(apiRestaurants, [], []);
        } else {
          // Use mock data when no API keys are configured
          console.log('No API keys configured, using mock data');
          allRestaurants = this.filterMockRestaurants(mockRestaurants, filters);
        }

        // Cache the full dataset
        this.setCachedData(fullDataCacheKey, allRestaurants, this.CACHE_TTL.BASIC_INFO);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        // Fallback to mock data on error
        allRestaurants = this.filterMockRestaurants(mockRestaurants, filters);
        this.setCachedData(fullDataCacheKey, allRestaurants, this.CACHE_TTL.BASIC_INFO);
      }
    }

    // Apply filters (excluding pagination params)
    const { page: _, limit: __, ...filterParams } = filters || {};
    let filteredRestaurants = allRestaurants;
    
    if (filterParams) {
      filteredRestaurants = this.filterMockRestaurants(allRestaurants, filterParams);
    }

    // Apply pagination
    const total = filteredRestaurants.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRestaurants = filteredRestaurants.slice(startIndex, endIndex);
    const totalPages = Math.ceil(total / limit);

    const result: RestaurantSearchResult = {
      restaurants: paginatedRestaurants,
      total,
      page,
      limit,
      totalPages,
      filters: filters || {},
      lastUpdated: new Date().toISOString()
    };

    return result;
  }

  // Get real-time availability for a restaurant
  async getRealTimeAvailability(restaurantId: string, date: string): Promise<RealTimeAvailability> {
    const cacheKey = `availability_${restaurantId}_${date}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.AVAILABILITY);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if booking APIs are configured
      const hasBookingApis = isApiKeyConfigured('OPENTABLE_API_KEY') || 
                            isApiKeyConfigured('RESY_API_KEY') || 
                            isApiKeyConfigured('TOAST_API_KEY');

      let availability: RealTimeAvailability;

      if (hasBookingApis) {
        // Try multiple booking APIs
        const [opentable, resy, toast] = await Promise.allSettled([
          this.fetchOpenTableAvailability(restaurantId, date),
          this.fetchResyAvailability(restaurantId, date),
          this.fetchToastAvailability(restaurantId, date)
        ]);

        // Merge availability data
        availability = this.mergeAvailabilityData(
          opentable.status === 'fulfilled' ? opentable.value : null,
          resy.status === 'fulfilled' ? resy.value : null,
          toast.status === 'fulfilled' ? toast.value : null,
          restaurantId,
          date
        );
      } else {
        // Use mock availability data
        console.log('No booking APIs configured, using mock availability');
        availability = generateMockAvailability(restaurantId, date);
      }

      this.setCachedData(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
      return availability;
    } catch (error) {
      console.error('Error fetching availability:', error);
      // Fallback to mock data
      const availability = generateMockAvailability(restaurantId, date);
      this.setCachedData(cacheKey, availability, this.CACHE_TTL.AVAILABILITY);
      return availability;
    }
  }

  // Get menu data
  async getMenuData(restaurantId: string): Promise<MenuData> {
    const cacheKey = `menu_${restaurantId}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.MENU);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if POS APIs are configured
      const hasPosApis = isApiKeyConfigured('TOAST_API_KEY') || 
                        isApiKeyConfigured('SQUARE_API_KEY');

      let menuData: MenuData;

      if (hasPosApis) {
        const response = await fetch(`${this.baseUrl}/restaurants/${restaurantId}/menu`);
        if (!response.ok) {
          throw new Error('Failed to fetch menu data');
        }
        menuData = await response.json();
      } else {
        // Use mock menu data
        console.log('No POS APIs configured, using mock menu data');
        menuData = { ...mockMenu, restaurantId };
      }

      this.setCachedData(cacheKey, menuData, this.CACHE_TTL.MENU);
      return menuData;
    } catch (error) {
      console.error('Error fetching menu:', error);
      // Fallback to mock data
      const menuData = { ...mockMenu, restaurantId };
      this.setCachedData(cacheKey, menuData, this.CACHE_TTL.MENU);
      return menuData;
    }
  }

  // Get reviews from multiple sources
  async getReviews(restaurantId: string): Promise<ReviewData[]> {
    const cacheKey = `reviews_${restaurantId}`;
    const cached = this.getCachedData(cacheKey, this.CACHE_TTL.REVIEWS);
    
    if (cached) {
      return cached;
    }

    try {
      // Check if review APIs are configured
      const hasReviewApis = isApiKeyConfigured('GOOGLE_PLACES_API_KEY') || 
                           isApiKeyConfigured('YELP_API_KEY') || 
                           isApiKeyConfigured('TRIPADVISOR_API_KEY');

      let reviews: ReviewData[];

      if (hasReviewApis) {
        const [google, yelp, tripadvisor] = await Promise.allSettled([
          this.fetchGoogleReviews(restaurantId),
          this.fetchYelpReviews(restaurantId),
          this.fetchTripAdvisorReviews(restaurantId)
        ]);

        reviews = [
          ...(google.status === 'fulfilled' ? google.value : []),
          ...(yelp.status === 'fulfilled' ? yelp.value : []),
          ...(tripadvisor.status === 'fulfilled' ? tripadvisor.value : [])
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        // Use mock review data
        console.log('No review APIs configured, using mock review data');
        reviews = mockReviews;
      }

      this.setCachedData(cacheKey, reviews, this.CACHE_TTL.REVIEWS);
      return reviews;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to mock data
      const reviews = mockReviews;
      this.setCachedData(cacheKey, reviews, this.CACHE_TTL.REVIEWS);
      return reviews;
    }
  }

  // Data source specific methods
  private async fetchGooglePlacesData(filters?: RestaurantSearchFilters): Promise<RestaurantData[]> {
    if (!isApiKeyConfigured('GOOGLE_PLACES_API_KEY')) {
      console.warn('Google Places API key not configured');
      return [];
    }

    // Check rate limiting
    if (!rateLimiter.canMakeRequest('google', 100, 24 * 60 * 60 * 1000)) {
      console.warn('Google Places API rate limit exceeded');
      return [];
    }

    const location = `${API_CONFIG.LONDON.LATITUDE},${API_CONFIG.LONDON.LONGITUDE}`;
    const radius = API_CONFIG.LONDON.RADIUS;
    const type = 'restaurant';
    const apiKey = getApiKey('GOOGLE_PLACES_API_KEY');

    // Use text search for better restaurant results and exclude hotels
    const query = 'restaurant London -hotel -inn -lodge -hostel';
    const url = `${API_CONFIG.GOOGLE_PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;

    try {
      console.log('🔍 Fetching from Google Places:', url);
      const response = await fetch(url);
      const data: GooglePlacesResponse = await response.json();

      console.log('🏪 Google Places raw results:', data.results?.length || 0);

      // Filter out hotels and non-restaurant establishments
      const filteredResults = data.results?.filter(place => {
        const name = place.name.toLowerCase();
        const types = place.types?.map(t => t.toLowerCase()) || [];

        // Exclude hotels, accommodation, etc.
        const excludeKeywords = ['hotel', 'inn', 'lodge', 'hostel', 'motel', 'b&b', 'guesthouse', 'accommodation'];
        const excludeTypes = ['lodging', 'tourist_attraction', 'travel_agency'];

        const hasExcludedKeyword = excludeKeywords.some(keyword => name.includes(keyword));
        const hasExcludedType = excludeTypes.some(type => types.includes(type));

        // Must have restaurant-related types
        const restaurantTypes = ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'];
        const hasRestaurantType = restaurantTypes.some(type => types.includes(type));

        return !hasExcludedKeyword && !hasExcludedType && hasRestaurantType;
      }) || [];

      console.log('🍽️ Filtered restaurant results:', filteredResults.length);

      return filteredResults.map(place => this.transformGooglePlace(place));
    } catch (error) {
      console.error('Error fetching Google Places data:', error);
      return [];
    }
  }

  private async fetchYelpData(filters?: RestaurantSearchFilters): Promise<RestaurantData[]> {
    const apiKey = process.env.NEXT_PUBLIC_YELP_API_KEY;
    if (!apiKey) {
      console.warn('Yelp API key not configured');
      return [];
    }

    const location = 'London, UK';
    const url = `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&categories=restaurants&limit=50`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data: YelpBusinessResponse = await response.json();
      return data.businesses?.map(business => this.transformYelpBusiness(business)) || [];
    } catch (error) {
      console.error('Error fetching Yelp data:', error);
      return [];
    }
  }

  private async fetchOpenTableData(filters?: RestaurantSearchFilters): Promise<RestaurantData[]> {
    // Mock OpenTable data for now
    return [];
  }

  private async fetchOpenTableAvailability(restaurantId: string, date: string): Promise<RealTimeAvailability | null> {
    // Mock OpenTable availability
    return null;
  }

  private async fetchResyAvailability(restaurantId: string, date: string): Promise<RealTimeAvailability | null> {
    // Mock Resy availability
    return null;
  }

  private async fetchToastAvailability(restaurantId: string, date: string): Promise<RealTimeAvailability | null> {
    // Mock Toast availability
    return null;
  }

  private async fetchGoogleReviews(restaurantId: string): Promise<ReviewData[]> {
    // Mock Google reviews
    return [];
  }

  private async fetchYelpReviews(restaurantId: string): Promise<ReviewData[]> {
    // Mock Yelp reviews
    return [];
  }

  private async fetchTripAdvisorReviews(restaurantId: string): Promise<ReviewData[]> {
    // Mock TripAdvisor reviews
    return [];
  }

  // Data transformation methods
  private transformGooglePlace(place: any): RestaurantData {
    // Generate cuisine from types
    const cuisineTypes = place.types?.filter((type: string) =>
      ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(type)
    ) || [];
    let cuisine = 'Modern European';

    // Try to extract cuisine from types
    if (place.types?.includes('meal_takeaway')) cuisine = 'Takeaway';
    else if (place.types?.includes('cafe')) cuisine = 'Cafe';
    else if (place.types?.includes('bar')) cuisine = 'Bar & Grill';
    else if (place.name?.toLowerCase().includes('indian')) cuisine = 'Indian';
    else if (place.name?.toLowerCase().includes('italian')) cuisine = 'Italian';
    else if (place.name?.toLowerCase().includes('chinese')) cuisine = 'Chinese';
    else if (place.name?.toLowerCase().includes('thai')) cuisine = 'Thai';
    else if (place.name?.toLowerCase().includes('japanese')) cuisine = 'Japanese';
    else if (place.name?.toLowerCase().includes('french')) cuisine = 'French';
    else if (place.name?.toLowerCase().includes('mexican')) cuisine = 'Mexican';

    // Generate some sample special offers based on rating
    const specialOffers = [];
    if (place.rating >= 4.0) {
      specialOffers.push({
        id: `offer_${place.place_id}_1`,
        title: 'Happy Hour',
        description: 'Special prices on drinks 5-7 PM',
        type: 'promotion' as const,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount: { type: 'percentage' as const, value: 20 }
      });
    }
    if (place.rating >= 4.5) {
      specialOffers.push({
        id: `offer_${place.place_id}_2`,
        title: 'Weekend Special',
        description: 'Complimentary dessert with main course',
        type: 'event' as const,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      phone: place.formatted_phone_number || '',
      cuisine,
      description: place.editorial_summary?.overview || `Experience authentic ${cuisine} cuisine in the heart of London. Our restaurant offers a warm, welcoming atmosphere with carefully crafted dishes using the finest ingredients.`,
      rating: place.rating || 4.0,
      reviewCount: place.user_ratings_total || 0, // Keep consistent with types
      priceRange: this.mapPriceLevel(place.price_level),
      location: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        postcode: this.extractPostcode(place.formatted_address || place.vicinity || ''),
        area: this.extractArea(place.formatted_address || place.vicinity || '')
      },
      images: place.photos?.map((photo: any, index: number) => ({
        id: `${place.place_id}_${index}`,
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`,
        alt: `${place.name} - Photo ${index + 1}`,
        source: 'google' as const,
        isPrimary: index === 0,
        uploadedAt: new Date().toISOString()
      })) || [],
      operatingHours: this.parseGoogleHours(place.opening_hours),
      availability: {
        restaurantId: place.place_id,
        date: new Date().toISOString().split('T')[0],
        timeSlots: [],
        lastUpdated: new Date().toISOString(),
        source: 'google'
      },
      menu: {
        restaurantId: place.place_id,
        categories: [],
        lastUpdated: new Date().toISOString(),
        source: 'manual'
      },
      reviews: [],
      specialOffers,
      lastUpdated: new Date().toISOString(),
      dataSource: {
        primary: 'google',
        lastSync: new Date().toISOString(),
        reliability: 85
      }
    };
  }

  private transformYelpBusiness(business: any): RestaurantData {
    return {
      id: business.id,
      name: business.name,
      address: business.location.display_address.join(', '),
      phone: business.display_phone,
      cuisine: business.categories?.map((c: any) => c.title).join(', ') || 'Restaurant',
      description: '',
      rating: business.rating,
      reviewCount: business.review_count,
      priceRange: this.mapYelpPrice(business.price),
      location: {
        latitude: business.coordinates.latitude,
        longitude: business.coordinates.longitude,
        postcode: business.location.zip_code,
        area: business.location.city
      },
      images: business.photos?.map((url: string, index: number) => ({
        id: `${business.id}_${index}`,
        url,
        alt: `${business.name} - Photo ${index + 1}`,
        source: 'manual' as const,
        isPrimary: index === 0,
        uploadedAt: new Date().toISOString()
      })) || [],
      operatingHours: this.parseYelpHours(business.hours),
      availability: {
        restaurantId: business.id,
        date: new Date().toISOString().split('T')[0],
        timeSlots: [],
        lastUpdated: new Date().toISOString(),
        source: 'yelp'
      },
      menu: {
        restaurantId: business.id,
        categories: [],
        lastUpdated: new Date().toISOString(),
        source: 'manual'
      },
      reviews: [],
      specialOffers: [],
      lastUpdated: new Date().toISOString(),
      dataSource: {
        primary: 'manual',
        lastSync: new Date().toISOString(),
        reliability: 80
      }
    };
  }

  // Helper methods
  private mapPriceLevel(level: number): '£' | '££' | '£££' | '££££' {
    switch (level) {
      case 0: return '£';
      case 1: return '££';
      case 2: return '£££';
      case 3: return '££££';
      default: return '££';
    }
  }

  private mapYelpPrice(price: string): '£' | '££' | '£££' | '££££' {
    switch (price) {
      case '£': return '£';
      case '££': return '££';
      case '£££': return '£££';
      case '££££': return '££££';
      default: return '££';
    }
  }

  private extractPostcode(address: string | undefined): string {
    if (!address) return '';
    const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2}/;
    const match = address.match(postcodeRegex);
    return match ? match[0] : '';
  }

  private extractArea(address: string | undefined): string {
    if (!address) return '';
    const parts = address.split(',');
    return parts[parts.length - 2]?.trim() || '';
  }

  private parseGoogleHours(hours: any): any {
    // Parse Google Places hours format
    return {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '23:00', isClosed: false },
      saturday: { open: '09:00', close: '23:00', isClosed: false },
      sunday: { open: '10:00', close: '22:00', isClosed: false }
    };
  }

  private parseYelpHours(hours: any): any {
    // Parse Yelp hours format
    return {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '23:00', isClosed: false },
      saturday: { open: '09:00', close: '23:00', isClosed: false },
      sunday: { open: '10:00', close: '22:00', isClosed: false }
    };
  }

  private mergeRestaurantData(google: RestaurantData[], yelp: RestaurantData[], opentable: RestaurantData[]): RestaurantData[] {
    // Merge and deduplicate restaurant data from multiple sources
    const restaurantMap = new Map<string, RestaurantData>();
    
    [...google, ...yelp, ...opentable].forEach(restaurant => {
      const existing = restaurantMap.get(restaurant.id);
      if (existing) {
        // Merge data, prioritizing more reliable sources
        restaurantMap.set(restaurant.id, this.mergeRestaurantInfo(existing, restaurant));
      } else {
        restaurantMap.set(restaurant.id, restaurant);
      }
    });
    
    return Array.from(restaurantMap.values());
  }

  private mergeRestaurantInfo(existing: RestaurantData, newData: RestaurantData): RestaurantData {
    // Merge restaurant information, prioritizing more complete data
    return {
      ...existing,
      name: newData.name || existing.name,
      address: newData.address || existing.address,
      phone: newData.phone || existing.phone,
      cuisine: newData.cuisine || existing.cuisine,
      description: newData.description || existing.description,
      rating: newData.rating || existing.rating,
      reviewCount: newData.reviewCount || existing.reviewCount,
      priceRange: newData.priceRange || existing.priceRange,
      images: [...existing.images, ...newData.images].slice(0, 10), // Limit to 10 images
      operatingHours: newData.operatingHours || existing.operatingHours,
      reviews: [...existing.reviews, ...newData.reviews].slice(0, 50), // Limit to 50 reviews
      lastUpdated: new Date().toISOString()
    };
  }

  private mergeAvailabilityData(opentable: RealTimeAvailability | null, resy: RealTimeAvailability | null, toast: RealTimeAvailability | null, restaurantId: string, date: string): RealTimeAvailability {
    // Merge availability data from multiple sources
    const allTimeSlots = [
      ...(opentable?.timeSlots || []),
      ...(resy?.timeSlots || []),
      ...(toast?.timeSlots || [])
    ];

    // Deduplicate and merge time slots
    const timeSlotMap = new Map<string, any>();
    allTimeSlots.forEach(slot => {
      const existing = timeSlotMap.get(slot.time);
      if (existing) {
        timeSlotMap.set(slot.time, {
          ...slot,
          available: existing.available || slot.available,
          tableTypes: [...(existing.tableTypes || []), ...(slot.tableTypes || [])]
        });
      } else {
        timeSlotMap.set(slot.time, slot);
      }
    });

    return {
      restaurantId,
      date,
      timeSlots: Array.from(timeSlotMap.values()),
      lastUpdated: new Date().toISOString(),
      source: 'merged'
    };
  }

  // Cache management
  private getCachedData(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get data freshness status
  getDataFreshness(): DataFreshness {
    return {
      availability: 'real-time',
      menu: 'daily',
      basicInfo: 'weekly',
      photos: 'as-needed',
      reviews: 'daily'
    };
  }

  // Transform comprehensive data to RestaurantData format
  private transformComprehensiveData(data: any): RestaurantData {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      phone: data.phone || '',
      cuisine: Array.isArray(data.cuisine) ? data.cuisine.join(', ') : (data.cuisine || 'Modern European'),
      description: `Experience authentic ${Array.isArray(data.cuisine) ? data.cuisine[0] : data.cuisine} cuisine in the heart of London. Our restaurant offers a warm, welcoming atmosphere with carefully crafted dishes using the finest ingredients.`,
      rating: data.rating || 4.0,
      reviewCount: data.reviewCount || 0,
      priceRange: data.priceRange || '££',
      location: {
        latitude: data.location?.latitude || 51.5074,
        longitude: data.location?.longitude || -0.1278,
        postcode: data.location?.postcode || '',
        area: data.location?.area || ''
      },
      images: data.photos?.map((photo: any, index: number) => ({
        id: photo.id,
        url: photo.url,
        alt: photo.alt,
        source: photo.source,
        isPrimary: index === 0,
        uploadedAt: new Date().toISOString()
      })) || [],
      operatingHours: data.openingHours || this.getDefaultHours(),
      availability: {
        restaurantId: data.id,
        date: new Date().toISOString().split('T')[0],
        timeSlots: [],
        lastUpdated: new Date().toISOString(),
        source: data.dataSources?.primary || 'comprehensive'
      },
      menu: data.menu || {
        restaurantId: data.id,
        categories: [],
        lastUpdated: new Date().toISOString(),
        source: 'manual'
      },
      reviews: [],
      specialOffers: data.specialties?.map((specialty: string, index: number) => ({
        id: `specialty_${data.id}_${index}`,
        title: specialty,
        description: `Try our signature ${specialty}`,
        type: 'specialty' as const,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })) || [],
      lastUpdated: new Date().toISOString(),
      dataSource: {
        primary: data.dataSources?.primary || 'comprehensive',
        lastSync: new Date().toISOString(),
        reliability: data.dataSources?.reliability || 85
      }
    };
  }

  private getDefaultHours(): any {
    return {
      monday: { open: '09:00', close: '22:00', isClosed: false },
      tuesday: { open: '09:00', close: '22:00', isClosed: false },
      wednesday: { open: '09:00', close: '22:00', isClosed: false },
      thursday: { open: '09:00', close: '22:00', isClosed: false },
      friday: { open: '09:00', close: '23:00', isClosed: false },
      saturday: { open: '09:00', close: '23:00', isClosed: false },
      sunday: { open: '10:00', close: '22:00', isClosed: false }
    };
  }

  // Filter mock restaurants based on search criteria
  private filterMockRestaurants(restaurants: RestaurantData[], filters?: RestaurantSearchFilters): RestaurantData[] {
    if (!filters) return restaurants;

    return restaurants.filter(restaurant => {
      // Cuisine filter
      if (filters.cuisine && filters.cuisine.length > 0) {
        const restaurantCuisines = restaurant.cuisine.toLowerCase().split(',').map(c => c.trim());
        const hasMatchingCuisine = filters.cuisine.some(filterCuisine => 
          restaurantCuisines.some(cuisine => 
            cuisine.includes(filterCuisine.toLowerCase())
          )
        );
        if (!hasMatchingCuisine) return false;
      }

      // Price range filter
      if (filters.priceRange && filters.priceRange.length > 0) {
        if (!filters.priceRange.includes(restaurant.priceRange)) return false;
      }

      // Rating filter
      if (filters.rating && restaurant.rating < filters.rating) return false;

      // Area filter
      if (filters.area && filters.area.length > 0) {
        const restaurantArea = restaurant.location.area.toLowerCase();
        const hasMatchingArea = filters.area.some(filterArea => 
          restaurantArea.includes(filterArea.toLowerCase())
        );
        if (!hasMatchingArea) return false;
      }

      // Features filter
      if (filters.features && filters.features.length > 0) {
        const restaurantFeatures = restaurant.specialOffers?.map(offer => offer.title).join(' ').toLowerCase() || '';
        const hasMatchingFeature = filters.features.some(filterFeature => 
          restaurantFeatures.includes(filterFeature.toLowerCase())
        );
        if (!hasMatchingFeature) return false;
      }

      return true;
    });
  }
}

export const restaurantDataService = new RestaurantDataService();

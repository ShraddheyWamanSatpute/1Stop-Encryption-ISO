// Real-time restaurant data types for London restaurants

export interface RestaurantData {
  id: string;
  name: string;
  address: string;
  phone: string;
  cuisine: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: '£' | '££' | '£££' | '££££';
  location: {
    latitude: number;
    longitude: number;
    postcode: string;
    area: string;
  };
  images: RestaurantImage[];
  operatingHours: OperatingHours;
  availability: RealTimeAvailability;
  menu: MenuData;
  reviews: ReviewData[];
  specialOffers: SpecialOffer[];
  lastUpdated: string;
  dataSource: DataSource;
  features?: string[];
  amenities?: string[];
  isOpen?: boolean;
}

export interface RestaurantImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  source: 'google' | 'foursquare' | 'yelp' | 'tripadvisor' | 'manual';
  isPrimary: boolean;
  uploadedAt: string;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  specialHours?: SpecialHours[];
}

export interface DayHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  isClosed: boolean;
}

export interface SpecialHours {
  date: string; // YYYY-MM-DD format
  hours: DayHours;
  reason: string; // e.g., "Holiday", "Private Event"
}

export interface RealTimeAvailability {
  restaurantId: string;
  date: string; // YYYY-MM-DD format
  timeSlots: TimeSlot[];
  lastUpdated: string;
  source: 'opentable' | 'resy' | 'toast' | 'square' | 'manual' | 'google' | 'yelp' | 'merged';
}

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  tableTypes: TableType[];
  maxPartySize: number;
  minPartySize: number;
  price?: number; // per person if applicable
  estimatedWaitTime?: number; // Estimated wait time in minutes
}

export interface TableType {
  type: 'standard' | 'booth' | 'bar' | 'outdoor' | 'private';
  available: boolean;
  capacity: number;
  price?: number;
}

export interface BookingRequest {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  tableType?: string;
  specialRequests?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  confirmationCode?: string;
  error?: string;
  estimatedWaitTime?: number;
  alternativeSlots?: TimeSlot[];
}

export interface AvailabilityFilters {
  date: string;
  partySize: number;
  timeRange?: {
    start: string;
    end: string;
  };
  tableTypes?: string[];
  specialRequests?: string[];
}

export interface MenuFilters {
  category?: string;
  dietary?: string[]; // ['vegetarian', 'vegan', 'gluten-free', 'dairy-free']
  priceRange?: {
    min: number;
    max: number;
  };
  allergens?: string[]; // Allergens to exclude
  availability?: boolean; // Only show available items
}

export interface MenuUpdate {
  restaurantId: string;
  categoryId: string;
  itemId: string;
  changes: Partial<MenuItem>;
  timestamp: string;
}

export interface MenuData {
  restaurantId: string;
  categories: MenuCategory[];
  lastUpdated: string;
  source: 'toast' | 'square' | 'manual' | 'scraped';
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'GBP';
  category: string;
  allergens: string[];
  dietaryInfo: string[]; // vegetarian, vegan, gluten-free, etc.
  isAvailable: boolean;
  imageUrl?: string;
  lastUpdated: string;
}

export interface ReviewData {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  source: 'google' | 'tripadvisor' | 'yelp' | 'foursquare' | 'opentable';
  verified: boolean;
  helpful: number;
  response?: {
    text: string;
    author: string;
    date: string;
  };
}

export interface ReviewFilters {
  minRating?: number;
  sources?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  verified?: boolean;
  keywords?: string[];
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentTrend: 'up' | 'down' | 'stable';
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'event' | 'promotion' | 'seasonal';
  validFrom: string;
  validTo: string;
  conditions?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface DataSource {
  primary: 'opentable' | 'resy' | 'toast' | 'square' | 'google' | 'manual';
  secondary?: string[];
  lastSync: string;
  reliability: number; // 0-100
}

// API Response types
export interface GooglePlacesResponse {
  results: GooglePlace[];
  status: string;
}

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  user_ratings_total: number;
  price_level: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  types: string[];
}

export interface YelpBusinessResponse {
  businesses: YelpBusiness[];
  total: number;
}

export interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  rating: number;
  price: string;
  phone: string;
  display_phone: string;
  distance: number;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  hours: Array<{
    open: Array<{
      day: number;
      start: string;
      end: string;
      is_overnight: boolean;
    }>;
    is_open_now: boolean;
  }>;
  categories: Array<{
    alias: string;
    title: string;
  }>;
}

// Data freshness tracking
export interface DataFreshness {
  availability: 'real-time' | '5min' | '15min' | '1hour' | 'stale';
  menu: 'daily' | 'weekly' | 'monthly' | 'stale';
  basicInfo: 'weekly' | 'monthly' | 'stale';
  photos: 'as-needed' | 'monthly' | 'stale';
  reviews: 'daily' | 'weekly' | 'stale';
}

// Search and filter types
export interface RestaurantSearchFilters {
  cuisine?: string[];
  priceRange?: string[];
  rating?: number;
  area?: string[];
  availability?: {
    date: string;
    time: string;
    partySize: number;
  };
  features?: string[];
  distance?: number; // in miles
  sortBy?: 'rating' | 'distance' | 'price' | 'newest';
}

export interface RestaurantSearchResult {
  page?: number;
  limit?: number;
  totalPages?: number;
  restaurants: RestaurantData[];
  total: number;
  filters: RestaurantSearchFilters;
  lastUpdated: string;
}

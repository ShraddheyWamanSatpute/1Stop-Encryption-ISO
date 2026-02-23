/**
 * Backend restaurant type definitions
 */

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  priceRange: '£' | '££' | '£££' | '££££';
  description: string;
  imageUrl?: string;
  images?: RestaurantImage[];
  location: {
    latitude: number;
    longitude: number;
    postcode: string;
    area: string;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isClosed: boolean;
    };
  };
  capacity: number;
  features: string[];
  amenities: string[];
  isOpen: boolean;
  lastUpdated: string;
}

export interface RestaurantImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface RestaurantAvailability {
  restaurantId: string;
  date: string;
  timeSlots: TimeSlot[];
  totalCapacity: number;
  availableCapacity: number;
}

export interface TimeSlot {
  time: string;
  availableTables: number;
  isAvailable: boolean;
  maxPartySize: number;
}

export interface RestaurantSearchParams {
  query?: string;
  location?: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
  features?: string[];
  limit?: number;
  offset?: number;
}

export interface RestaurantResponse {
  restaurants: Restaurant[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

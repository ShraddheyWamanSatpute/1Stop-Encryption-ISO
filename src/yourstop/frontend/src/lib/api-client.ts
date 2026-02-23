/**
 * Client-side API service to replace Next.js API routes
 * These functions call the services directly instead of going through API routes
 */

import { restaurantDataService } from './restaurant-data-service';
import { freeRestaurantDataService } from './free-restaurant-apis';

// Restaurant API
export async function getRestaurants(filters?: {
  query?: string;
  location?: string;
  cuisine?: string;
  priceRange?: string;
  rating?: string;
  features?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const result = await restaurantDataService.getRestaurants({
      cuisine: filters?.cuisine ? filters.cuisine.split(',') : [],
      priceRange: filters?.priceRange ? filters.priceRange.split(',') : [],
      rating: filters?.rating ? parseFloat(filters.rating) : undefined,
      features: filters?.features ? filters.features.split(',') : [],
    });
    
    return {
      ok: true,
      json: async () => result,
    };
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    };
  }
}

export async function getRestaurantById(id: string) {
  try {
    if (!id) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Restaurant ID is required' }),
      };
    }

    // Get all restaurants using the same service as the explore page
    const restaurants = await freeRestaurantDataService.getComprehensiveRestaurantData('London, UK', 10000);
    const restaurant = restaurants.find(r => r.id === id);
    
    if (!restaurant) {
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'Restaurant not found' }),
      };
    }
    
    // Transform the comprehensive data to match the expected format
    const enhancedRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone || '',
      website: restaurant.website || '',
      cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine || 'International',
      rating: restaurant.rating || 4.0,
      reviewCount: restaurant.reviewCount || 0,
      priceRange: restaurant.priceRange || '££',
      imageUrl: restaurant.photos?.[0]?.url || '/placeholder-restaurant.jpg',
      images: restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos : [
        {
          url: '/placeholder-restaurant.jpg',
          alt: restaurant.name
        }
      ],
      description: `Experience ${Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine || 'International'} cuisine at ${restaurant.name}. Located in ${restaurant.address}, this restaurant offers a unique dining experience with a ${restaurant.rating || 4.0} star rating.`,
      features: restaurant.features || ['Fine Dining', 'Wine Selection', 'Private Dining'],
      openingHours: transformOpeningHours(restaurant.openingHours) || {
        'Monday': '12:00 PM - 10:00 PM',
        'Tuesday': '12:00 PM - 10:00 PM',
        'Wednesday': '12:00 PM - 10:00 PM',
        'Thursday': '12:00 PM - 10:00 PM',
        'Friday': '12:00 PM - 11:00 PM',
        'Saturday': '12:00 PM - 11:00 PM',
        'Sunday': '12:00 PM - 9:00 PM'
      },
      amenities: restaurant.features || [
        'WiFi',
        'Parking',
        'Credit Cards Accepted',
        'Wheelchair Accessible',
        'Pet Friendly',
        'Live Music',
        'Outdoor Seating'
      ],
      location: {
        lat: restaurant.location?.latitude || 51.5074,
        lng: restaurant.location?.longitude || -0.1278
      },
      latitude: restaurant.location?.latitude || 51.5074,
      longitude: restaurant.location?.longitude || -0.1278,
      isOpen: restaurant.isOpen || true,
      distance: 0.5 // Default distance, can be calculated if needed
    };

    return {
      ok: true,
      json: async () => enhancedRestaurant,
    };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    };
  }
}

// Helper function to transform opening hours from object format to string format
function transformOpeningHours(openingHours: any): { [key: string]: string } | null {
  if (!openingHours) return null;
  
  const transformed: { [key: string]: string } = {};
  
  Object.entries(openingHours).forEach(([day, hours]: [string, any]) => {
    if (typeof hours === 'string') {
      // Already in string format
      transformed[day] = hours;
    } else if (typeof hours === 'object' && hours !== null) {
      // Object format with {open, close, isClosed}
      if (hours.isClosed) {
        transformed[day] = 'Closed';
      } else if (hours.open && hours.close) {
        transformed[day] = `${hours.open} - ${hours.close}`;
      } else {
        transformed[day] = 'Hours not available';
      }
    }
  });
  
  return Object.keys(transformed).length > 0 ? transformed : null;
}

// Wrapper function to mimic fetch API for easy migration
export async function apiFetch(url: string, options?: RequestInit) {
  // Parse URL to determine which API function to call
  const urlObj = new URL(url, window.location.origin);
  const pathname = urlObj.pathname;
  
  // Handle GET requests for restaurants
  if (pathname.startsWith('/api/restaurants/')) {
    // Extract ID from path like /api/restaurants/[id]
    const id = pathname.split('/api/restaurants/')[1];
    return getRestaurantById(id);
  } else if (pathname === '/api/restaurants') {
    // Parse query params
    const params = urlObj.searchParams;
    const filters = {
      query: params.get('query') || undefined,
      location: params.get('location') || undefined,
      cuisine: params.get('cuisine') || undefined,
      priceRange: params.get('priceRange') || undefined,
      rating: params.get('rating') || undefined,
      features: params.get('features') || undefined,
      page: params.get('page') ? parseInt(params.get('page')!) : undefined,
      limit: params.get('limit') ? parseInt(params.get('limit')!) : undefined,
    };
    return getRestaurants(filters);
  }
  
  // For other API routes, make actual HTTP requests to backend
  // This allows the app to work with a separate backend server
  // In production, these should point to your actual backend API
  const backendUrl = (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_BACKEND_URL) || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const fullUrl = backendUrl ? `${backendUrl}${pathname}` : url;
  
  try {
    const response = await fetch(fullUrl, options);
    return response;
  } catch (error) {
    console.error(`Error calling API ${pathname}:`, error);
    return {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Network error', message: error instanceof Error ? error.message : 'Unknown error' }),
    };
  }
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  RestaurantData, 
  RestaurantSearchResult, 
  RestaurantSearchFilters,
  RealTimeAvailability,
  MenuData,
  ReviewData
} from '@/lib/restaurant-data-types';

interface UseRestaurantDataReturn {
  restaurants: RestaurantData[];
  loading: boolean;
  error: string | null;
  total: number;
  searchRestaurants: (filters?: RestaurantSearchFilters) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useRestaurantData(initialFilters?: RestaurantSearchFilters): UseRestaurantDataReturn {
  console.log('🚀 useRestaurantData hook called with initialFilters:', initialFilters);
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(false); // Start with loading false
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const searchRestaurants = async (filters?: RestaurantSearchFilters) => {
    console.log('🔍 searchRestaurants called with filters:', filters);
    setLoading(true);
    setError(null);
    
    try {
      console.log('🌐 Making fetch request to /api/restaurants');
      const response = await fetch('/api/restaurants');
      console.log('📡 Response status:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Received data:', result);
      console.log('📊 Data structure check:', {
        hasRestaurants: !!result.restaurants,
        isArray: Array.isArray(result.restaurants),
        length: result.restaurants?.length,
        total: result.total
      });
      
      if (result.restaurants && Array.isArray(result.restaurants)) {
        setRestaurants(result.restaurants);
        setTotal(result.total || result.restaurants.length);
        console.log('✅ State updated successfully - restaurants:', result.restaurants.length, 'total:', result.total);
      } else {
        console.error('❌ Invalid data structure:', result);
        setRestaurants([]);
        setTotal(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('❌ Error fetching restaurants:', err);
      setRestaurants([]);
      setTotal(0);
    } finally {
      setLoading(false);
      console.log('🏁 searchRestaurants completed, loading set to false');
    }
  };

  const refreshData = async () => {
    await searchRestaurants();
  };

  // Initial load - run once on mount
  useEffect(() => {
    console.log('🚀 useRestaurantData hook mounted, calling searchRestaurants');
    console.log('🌍 Window object available:', typeof window !== 'undefined');
    searchRestaurants(initialFilters);
  }, []); // Empty dependency array to run only once

  // Debug state changes
  useEffect(() => {
    console.log('🔄 State changed:', { restaurants: restaurants.length, loading, error, total });
  }, [restaurants, loading, error, total]);

  return {
    restaurants,
    loading,
    error,
    total,
    searchRestaurants,
    refreshData
  };
}

interface UseRestaurantAvailabilityReturn {
  availability: RealTimeAvailability | null;
  loading: boolean;
  error: string | null;
  fetchAvailability: (restaurantId: string, date: string) => Promise<void>;
}

export function useRestaurantAvailability(): UseRestaurantAvailabilityReturn {
  const [availability, setAvailability] = useState<RealTimeAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async (restaurantId: string, date: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/availability?date=${date}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      
      const data: RealTimeAvailability = await response.json();
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    availability,
    loading,
    error,
    fetchAvailability
  };
}

interface UseRestaurantMenuReturn {
  menu: MenuData | null;
  loading: boolean;
  error: string | null;
  fetchMenu: (restaurantId: string) => Promise<void>;
}

export function useRestaurantMenu(): UseRestaurantMenuReturn {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async (restaurantId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/menu`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu');
      }
      
      const data: MenuData = await response.json();
      setMenu(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    menu,
    loading,
    error,
    fetchMenu
  };
}

interface UseRestaurantReviewsReturn {
  reviews: ReviewData[];
  loading: boolean;
  error: string | null;
  fetchReviews: (restaurantId: string) => Promise<void>;
}

export function useRestaurantReviews(): UseRestaurantReviewsReturn {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (restaurantId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reviews`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data: ReviewData[] = await response.json();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reviews,
    loading,
    error,
    fetchReviews
  };
}

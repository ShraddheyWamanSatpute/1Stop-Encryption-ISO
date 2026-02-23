'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// Inline debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
import { unifiedFilterService, UnifiedFilterState, FilterResult, FilterOptions } from '@/lib/unified-filter-service';
import { RestaurantData } from '@/lib/restaurant-data-types';

interface UseAdvancedFiltersProps {
  initialFilters?: Partial<UnifiedFilterState>;
  enableRealTimeSearch?: boolean;
  searchDelay?: number;
}

interface UseAdvancedFiltersReturn {
  // State
  filters: UnifiedFilterState;
  filteredRestaurants: RestaurantData[];
  totalResults: number;
  loading: boolean;
  error: string | null;
  
  // Filter options
  filterOptions: FilterOptions;
  facets: any;
  
  // Actions
  updateFilter: (key: keyof UnifiedFilterState, value: any) => void;
  updateFilters: (newFilters: Partial<UnifiedFilterState>) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  
  // Search
  setSearchQuery: (query: string) => void;
  setLocationQuery: (query: string) => void;
  
  // Utility
  getFilterSummary: () => string[];
  hasActiveFilters: boolean;
}

export function useAdvancedFilters({
  initialFilters = {},
  enableRealTimeSearch = true,
  searchDelay = 300
}: UseAdvancedFiltersProps = {}): UseAdvancedFiltersReturn {
  
  // Initialize filters with defaults and initial values
  const [filters, setFilters] = useState<UnifiedFilterState>(() => ({
    ...unifiedFilterService.getDefaultFilters(),
    ...initialFilters
  }));

  // Restaurant data state
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search queries for real-time search
  const debouncedSearchQuery = useDebounce(filters.searchQuery, searchDelay);
  const debouncedLocationQuery = useDebounce(filters.locationQuery, searchDelay);

  // Fetch restaurants data
  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use relative URL since frontend and API are on the same port
      const response = await fetch('/api/restaurants');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.restaurants && Array.isArray(result.restaurants)) {
        setRestaurants(result.restaurants);
      } else {
        setRestaurants([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters and get results
  const filterResult = useMemo((): FilterResult => {
    if (restaurants.length === 0) {
      return {
        restaurants: [],
        total: 0,
        facets: {
          cuisines: {},
          priceRanges: {},
          ratings: {},
          areas: {}
        }
      };
    }

    // Use debounced queries for real-time search
    const filtersToApply = enableRealTimeSearch ? {
      ...filters,
      searchQuery: debouncedSearchQuery,
      locationQuery: debouncedLocationQuery
    } : filters;

    return unifiedFilterService.applyFilters(restaurants, filtersToApply);
  }, [restaurants, filters, debouncedSearchQuery, debouncedLocationQuery, enableRealTimeSearch]);

  // Get filter options from current restaurant data
  const filterOptions = useMemo((): FilterOptions => {
    return unifiedFilterService.getFilterOptions(restaurants);
  }, [restaurants]);

  // Check if there are any active filters
  const hasActiveFilters = useMemo(() => {
    const defaultFilters = unifiedFilterService.getDefaultFilters();
    return Object.keys(filters).some(key => {
      const filterKey = key as keyof UnifiedFilterState;
      const currentValue = filters[filterKey];
      const defaultValue = defaultFilters[filterKey];
      
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return currentValue.length !== defaultValue.length;
      }
      
      if (typeof currentValue === 'object' && typeof defaultValue === 'object') {
        return JSON.stringify(currentValue) !== JSON.stringify(defaultValue);
      }
      
      return currentValue !== defaultValue;
    });
  }, [filters]);

  // Update single filter
  const updateFilter = useCallback((key: keyof UnifiedFilterState, value: any) => {
    setFilters(prev => unifiedFilterService.updateFilter(prev, key, value));
  }, []);

  // Update multiple filters
  const updateFilters = useCallback((newFilters: Partial<UnifiedFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(unifiedFilterService.clearFilters());
  }, []);

  // Reset to initial filters
  const resetFilters = useCallback(() => {
    setFilters({
      ...unifiedFilterService.getDefaultFilters(),
      ...initialFilters
    });
  }, [initialFilters]);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    updateFilter('searchQuery', query);
  }, [updateFilter]);

  // Set location query
  const setLocationQuery = useCallback((query: string) => {
    updateFilter('locationQuery', query);
  }, [updateFilter]);

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    return unifiedFilterService.getFilterSummary(filters);
  }, [filters]);

  // Load restaurants on mount
  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    // State
    filters,
    filteredRestaurants: filterResult.restaurants,
    totalResults: filterResult.total,
    loading,
    error,
    
    // Filter options
    filterOptions,
    facets: filterResult.facets,
    
    // Actions
    updateFilter,
    updateFilters,
    clearFilters,
    resetFilters,
    
    // Search
    setSearchQuery,
    setLocationQuery,
    
    // Utility
    getFilterSummary,
    hasActiveFilters
  };
}

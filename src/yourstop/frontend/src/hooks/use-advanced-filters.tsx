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
  
  // Pagination
  currentPage: number;
  hasMore: boolean;
  totalPages: number;
  loadMoreRestaurants: () => Promise<void>;
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

  // Fetch restaurants data with pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const RESTAURANTS_PER_PAGE = 30; // 3 pages = 90 items initially
  const INITIAL_PAGES = 3; // Load 3 pages initially

  const fetchRestaurants = useCallback(async (page: number = 1, append: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', RESTAURANTS_PER_PAGE.toString());
      
      // Add filter params if needed
      if (filters.searchQuery) params.set('query', filters.searchQuery);
      if (filters.locationQuery) params.set('location', filters.locationQuery);
      if (filters.cuisine.length > 0) params.set('cuisine', filters.cuisine.join(','));
      if (filters.priceRange.length > 0) params.set('priceRange', filters.priceRange.join(','));
      if (filters.rating.min > 0) params.set('rating', filters.rating.min.toString());
      
      // Use apiFetch instead of fetch for Vite compatibility
      const { apiFetch } = await import('@/lib/api-client');
      const response = await apiFetch(`/api/restaurants?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.status || 500}`);
      }
      
      const result = await response.json();
      
      if (result.restaurants && Array.isArray(result.restaurants)) {
        if (append) {
          setRestaurants(prev => [...prev, ...result.restaurants]);
        } else {
          setRestaurants(result.restaurants);
        }
        setHasMore(result.page < (result.totalPages || 1));
        setTotalPages(result.totalPages || 1);
        setCurrentPage(page);
      } else {
        setRestaurants([]);
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRestaurants([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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

  // Load initial 3 pages of restaurants on mount
  useEffect(() => {
    const loadInitialPages = async () => {
      setLoading(true);
      try {
        // Load first 3 pages in parallel
        const pages = Array.from({ length: INITIAL_PAGES }, (_, i) => i + 1);
        const promises = pages.map(async (page) => {
          const params = new URLSearchParams();
          params.set('page', page.toString());
          params.set('limit', RESTAURANTS_PER_PAGE.toString());
          if (filters.searchQuery) params.set('query', filters.searchQuery);
          if (filters.locationQuery) params.set('location', filters.locationQuery);
          const { apiFetch } = await import('@/lib/api-client');
          const response = await apiFetch(`/api/restaurants?${params.toString()}`);
          if (response.ok) {
            return await response.json();
          }
          throw new Error('Failed to fetch restaurants');
        });
        
        const results = await Promise.all(promises);
        const allRestaurants = results.flatMap(r => r.restaurants || []);
        
        setRestaurants(allRestaurants);
        if (results[0]) {
          setTotalPages(results[0].totalPages || 1);
          setHasMore(results[0].page < (results[0].totalPages || 1));
          setCurrentPage(INITIAL_PAGES);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialPages();
  }, []); // Only on mount

  // Load more restaurants function
  const loadMoreRestaurants = useCallback(async () => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    await fetchRestaurants(nextPage, true);
  }, [hasMore, loading, currentPage, fetchRestaurants]);

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
    hasActiveFilters,
    
    // Pagination
    currentPage,
    hasMore,
    totalPages,
    loadMoreRestaurants
  };
}

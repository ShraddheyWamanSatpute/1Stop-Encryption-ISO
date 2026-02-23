'use client';

import { useState, useEffect, useCallback } from 'react';
import { MenuData, MenuCategory, MenuItem, MenuFilters } from '@/lib/restaurant-data-types';
import { menuService } from '@/lib/menu-service';

export function useMenu(restaurantId: string, initialFilters?: MenuFilters) {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MenuFilters>(initialFilters || {});

  const fetchMenu = useCallback(async (currentFilters: MenuFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await menuService.getMenu(restaurantId, currentFilters);
      setMenu(data);
    } catch (err: any) {
      setError(err.message);
      setMenu(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchMenu(filters);
    }
  }, [restaurantId, filters, fetchMenu]);

  const updateFilters = useCallback((newFilters: Partial<MenuFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refreshMenu = useCallback(() => {
    fetchMenu(filters);
  }, [filters, fetchMenu]);

  return {
    menu,
    loading,
    error,
    filters,
    updateFilters,
    refreshMenu
  };
}

export function useMenuCategories(restaurantId: string) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await menuService.getMenuCategories(restaurantId);
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      fetchCategories();
    }
  }, [restaurantId, fetchCategories]);

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories
  };
}

export function useMenuItems(restaurantId: string, categoryId: string, filters?: MenuFilters) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await menuService.getMenuItems(restaurantId, categoryId, filters);
      setItems(data);
    } catch (err: any) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, categoryId, filters]);

  useEffect(() => {
    if (restaurantId && categoryId) {
      fetchItems();
    }
  }, [restaurantId, categoryId, filters, fetchItems]);

  return {
    items,
    loading,
    error,
    refresh: fetchItems
  };
}

export function useMenuSearch(restaurantId: string) {
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchItems = useCallback(async (query: string, filters?: MenuFilters) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await menuService.searchMenuItems(restaurantId, query, filters);
      setSearchResults(data);
    } catch (err: any) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchItems,
    clearSearch
  };
}

export function useItemAvailability(restaurantId: string, itemId: string) {
  const [availability, setAvailability] = useState<{
    available: boolean;
    estimatedPrepTime?: number;
    lastUpdated: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await menuService.getItemAvailability(restaurantId, itemId);
      setAvailability(data);
    } catch (err: any) {
      setError(err.message);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, itemId]);

  useEffect(() => {
    if (restaurantId && itemId) {
      fetchAvailability();
      
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchAvailability, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [restaurantId, itemId, fetchAvailability]);

  return {
    availability,
    loading,
    error,
    refresh: fetchAvailability
  };
}

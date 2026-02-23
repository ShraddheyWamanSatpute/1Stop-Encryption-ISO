'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';
import type { Restaurant } from '@/lib/types';

interface FavoritesContextType {
  favorites: Restaurant[];
  addToFavorites: (restaurant: Restaurant) => void;
  removeFromFavorites: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurant: Restaurant) => void;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Load favorites from localStorage (in a real app, this would be from a database)
      const savedFavorites = localStorage.getItem(`favorites_${user.uid}`);
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      }
    } else {
      setFavorites([]);
    }
    setLoading(false);
  }, [user]);

  const saveFavorites = (newFavorites: Restaurant[]) => {
    if (user) {
      localStorage.setItem(`favorites_${user.uid}`, JSON.stringify(newFavorites));
    }
    setFavorites(newFavorites);
  };

  const addToFavorites = (restaurant: Restaurant) => {
    if (!isFavorite(restaurant.id)) {
      const newFavorites = [...favorites, restaurant];
      saveFavorites(newFavorites);
    }
  };

  const removeFromFavorites = (restaurantId: string) => {
    const newFavorites = favorites.filter(restaurant => restaurant.id !== restaurantId);
    saveFavorites(newFavorites);
  };

  const isFavorite = (restaurantId: string) => {
    return favorites.some(restaurant => restaurant.id === restaurantId);
  };

  const toggleFavorite = (restaurant: Restaurant) => {
    if (isFavorite(restaurant.id)) {
      removeFromFavorites(restaurant.id);
    } else {
      addToFavorites(restaurant);
    }
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
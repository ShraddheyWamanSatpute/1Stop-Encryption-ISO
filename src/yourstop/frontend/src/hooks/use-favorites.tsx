import { useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from './use-customer-auth';
import { customerFavoritesService, CustomerFavorite, CreateFavoriteData } from '@/lib/customer-favorites-service';
import { toast } from '@/hooks/use-toast';

export function useFavorites() {
  const { user } = useCustomerAuth();
  const [favorites, setFavorites] = useState<CustomerFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load user favorites
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const userFavorites = await customerFavoritesService.getUserFavorites(user.uid);
      setFavorites(userFavorites);
      setFavoriteIds(new Set(userFavorites.map(f => f.restaurantId)));
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: 'Error loading favorites',
        description: 'Failed to load your favorite restaurants.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if restaurant is favorited
  const isFavorite = useCallback((restaurantId: string): boolean => {
    return favoriteIds.has(restaurantId);
  }, [favoriteIds]);

  // Add favorite
  const addFavorite = useCallback(async (data: CreateFavoriteData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add favorites.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const favorite = await customerFavoritesService.addFavorite({
        ...data,
        userId: user.uid,
      });
      
      setFavorites(prev => [favorite, ...prev]);
      setFavoriteIds(prev => new Set([...prev, favorite.restaurantId]));
      
      toast({
        title: 'Added to favorites',
        description: `${favorite.restaurantName} has been added to your favorites.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast({
        title: 'Error adding favorite',
        description: 'Failed to add restaurant to favorites.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  // Remove favorite
  const removeFavorite = useCallback(async (restaurantId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await customerFavoritesService.removeFavoriteByRestaurant(user.uid, restaurantId);
      
      if (success) {
        setFavorites(prev => prev.filter(f => f.restaurantId !== restaurantId));
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        
        const favorite = favorites.find(f => f.restaurantId === restaurantId);
        toast({
          title: 'Removed from favorites',
          description: `${favorite?.restaurantName || 'Restaurant'} has been removed from your favorites.`,
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Error removing favorite',
        description: 'Failed to remove restaurant from favorites.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, favorites]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (data: CreateFavoriteData): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to manage favorites.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await customerFavoritesService.toggleFavorite({
        ...data,
        userId: user.uid,
      });

      if (result.isFavorite && result.favorite) {
        setFavorites(prev => [result.favorite!, ...prev]);
        setFavoriteIds(prev => new Set([...prev, result.favorite!.restaurantId]));
        toast({
          title: 'Added to favorites',
          description: `${result.favorite.restaurantName} has been added to your favorites.`,
        });
      } else {
        setFavorites(prev => prev.filter(f => f.restaurantId !== data.restaurantId));
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.restaurantId);
          return newSet;
        });
        toast({
          title: 'Removed from favorites',
          description: `${data.restaurantName} has been removed from your favorites.`,
        });
      }

      return result.isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error updating favorite',
        description: 'Failed to update favorite status.',
        variant: 'destructive',
      });
      return false;
    }
  }, [user]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    favoriteIds,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refreshFavorites: loadFavorites,
  };
}

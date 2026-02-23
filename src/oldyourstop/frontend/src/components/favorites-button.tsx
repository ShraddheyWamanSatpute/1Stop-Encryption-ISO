'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';

interface FavoritesButtonProps {
  restaurantId: string;
  restaurantName: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export function FavoritesButton({ 
  restaurantId, 
  restaurantName, 
  size = 'sm',
  variant = 'outline',
  className = ''
}: FavoritesButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if restaurant is in favorites (localStorage for demo)
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(restaurantId));
  }, [restaurantId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = favorites.filter((id: string) => id !== restaurantId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setIsFavorite(false);
        toast.success(`${restaurantName} removed from favorites`);
      } else {
        // Add to favorites
        const updatedFavorites = [...favorites, restaurantId];
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        setIsFavorite(true);
        toast.success(`${restaurantName} added to favorites`);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`${className} ${isFavorite ? 'text-red-500 hover:text-red-600 border-red-300' : ''}`}
    >
      <Heart 
        className={`h-3 w-3 mr-1 ${isFavorite ? 'fill-current' : ''}`} 
      />
      {isLoading ? 'Saving...' : isFavorite ? 'Saved' : 'Save'}
    </Button>
  );
}

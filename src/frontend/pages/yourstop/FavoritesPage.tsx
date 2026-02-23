import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../yourstop/frontend/src/components/ui/card';
import { Button } from '../../../yourstop/frontend/src/components/ui/button';
import { Badge } from '../../../yourstop/frontend/src/components/ui/badge';
import { Heart, MapPin, Star, Clock, Users, ExternalLink, Trash2 } from 'lucide-react';
import { EnhancedRestaurantCard as RestaurantCard } from '../../../yourstop/frontend/src/components/enhanced-restaurant-card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface FavoriteRestaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  cuisine: string;
  rating: number;
  reviewCount?: number;
  priceRange: string;
  imageUrl?: string;
  yelpUrl?: string;
  isOpen?: boolean;
  distance?: number;
  dataSource: {
    primary: string;
    reliability?: number;
  };
  yelpData?: any;
  description?: string;
  features?: string[];
}

export default function FavoritesPage() {
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteRestaurants();
  }, []);

  const loadFavoriteRestaurants = async () => {
    setLoading(true);
    try {
      // Get favorite IDs from localStorage
      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      if (favoriteIds.length === 0) {
        setFavoriteRestaurants([]);
        setLoading(false);
        return;
      }

      // Fetch restaurant details for each favorite using apiFetch
      const { apiFetch } = await import('../../../yourstop/frontend/src/lib/api-client');
      const restaurants = await Promise.all(
        favoriteIds.map(async (id: string) => {
          try {
            const response = await apiFetch(`/api/restaurants/${id}`);
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (error) {
            console.error(`Error fetching restaurant ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out null results
      const validRestaurants = restaurants.filter(restaurant => restaurant !== null);
      setFavoriteRestaurants(validRestaurants);
    } catch (error) {
      console.error('Error loading favorite restaurants:', error);
      toast.error('Failed to load favorite restaurants');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = (restaurantId: string) => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      const updatedFavorites = favorites.filter((id: string) => id !== restaurantId);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      
      setFavoriteRestaurants(prev => 
        prev.filter(restaurant => restaurant.id !== restaurantId)
      );
      
      toast.success('Restaurant removed from favorites');
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  const clearAllFavorites = () => {
    try {
      localStorage.setItem('favorites', JSON.stringify([]));
      setFavoriteRestaurants([]);
      toast.success('All favorites cleared');
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast.error('Failed to clear favorites');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Your Favorite Restaurants
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                {favoriteRestaurants.length} restaurant{favoriteRestaurants.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            {favoriteRestaurants.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFavorites}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {favoriteRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No favorites yet</h3>
            <p className="text-gray-500 mb-6">
              Start exploring restaurants and add them to your favorites
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/YourStop/restaurants">Browse Restaurants</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/YourStop">Go Home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorites Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {favoriteRestaurants.map((restaurant, index) => (
                <div key={`${restaurant.dataSource.primary}-${restaurant.id}-${index}`} className="relative">
                  <RestaurantCard restaurant={restaurant} />
                  
                  {/* Remove from Favorites Button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeFromFavorites(restaurant.id)}
                    className="absolute top-2 right-2 z-10 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/YourStop/restaurants">Discover More Restaurants</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/YourStop">Back to Home</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



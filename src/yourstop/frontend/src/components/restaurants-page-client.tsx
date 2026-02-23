import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Restaurant } from '@/types/restaurant';
import { RestaurantCard } from '@/components/restaurant-card';
import { AdvancedFilters } from '@/components/advanced-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/use-advanced-filters';

export default function RestaurantsPageClient() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);

  const {
    filters,
    updateFilter,
    clearFilters,
    filteredRestaurants,
    loading,
    error,
    setSearchQuery,
    setLocationQuery
  } = useAdvancedFilters();

  // Calculate total count for display
  const totalCount = filteredRestaurants.length;

  // Initialize search queries from URL params
  useEffect(() => {
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    setSearchQuery(query);
    setLocationQuery(location);
  }, [searchParams, setSearchQuery, setLocationQuery]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.searchQuery) params.set('query', filters.searchQuery);
    if (filters.locationQuery) params.set('location', filters.locationQuery);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    navigate(`/YourStop/restaurants${newUrl}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error}
          </h1>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Restaurants
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find the perfect dining experience with our curated selection of restaurants
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search restaurants, cuisines, or dishes..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Location, city, or postcode..."
                  value={filters.locationQuery || ''}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-12 px-6 sm:hidden"
                variant="outline"
              >
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72">
            <div className="sticky top-8">
              <AdvancedFilters
                filters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
                totalCount={totalCount}
              />
            </div>
          </div>

          {/* Restaurant Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  {totalCount} restaurants found
                </h2>
              </div>
            </div>

            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No restaurants found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

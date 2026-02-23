import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EnhancedRestaurantCard as RestaurantCard } from '../../../yourstop/frontend/src/components/enhanced-restaurant-card';
import { RestaurantFilters } from '../../../yourstop/frontend/src/components/restaurant-filters';
import { LoadingSkeleton } from '../../../yourstop/frontend/src/components/loading-skeleton';
import { useAdvancedFilters } from '../../../yourstop/frontend/src/hooks/use-advanced-filters';
import { Button } from '../../../yourstop/frontend/src/components/ui/button';
import { Input } from '../../../yourstop/frontend/src/components/ui/input';
import { Badge } from '../../../yourstop/frontend/src/components/ui/badge';
import { 
  Search, 
  Filter, 
  MapPin, 
  Grid3X3,
  List,
  X
} from 'lucide-react';

export default function RestaurantsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Get initial filters from URL params
  const initialFilters = useMemo(() => {
    const filters: any = {};
    if (searchParams.get('search')) filters.searchQuery = searchParams.get('search');
    if (searchParams.get('location')) filters.locationQuery = searchParams.get('location');
    if (searchParams.get('cuisine')) filters.cuisine = [searchParams.get('cuisine')!];
    if (searchParams.get('priceRange')) filters.priceRange = [searchParams.get('priceRange')!];
    if (searchParams.get('rating')) filters.rating = { min: parseFloat(searchParams.get('rating')!), max: 5 };
    if (searchParams.get('region')) filters.region = searchParams.get('region');
    if (searchParams.get('area')) filters.area = searchParams.get('area');
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy');
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [searchParams]);

  const {
    filters,
    filteredRestaurants,
    totalResults,
    loading,
    error,
    filterOptions,
    updateFilter,
    updateFilters,
    clearFilters,
    setSearchQuery,
    setLocationQuery,
    getFilterSummary,
    hasActiveFilters
  } = useAdvancedFilters({
    initialFilters,
    enableRealTimeSearch: true,
    searchDelay: 300
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.searchQuery) params.set('search', filters.searchQuery);
    if (filters.locationQuery) params.set('location', filters.locationQuery);
    if (filters.cuisine.length > 0) params.set('cuisine', filters.cuisine.join(','));
    if (filters.priceRange.length > 0) params.set('priceRange', filters.priceRange.join(','));
    if (filters.rating.min > 0) params.set('rating', filters.rating.min.toString());
    if (filters.region !== 'all') params.set('region', filters.region);
    if (filters.area !== 'all') params.set('area', filters.area);
    if (filters.sortBy !== 'rating') params.set('sortBy', filters.sortBy);
    
    const newUrl = params.toString() ? `/YourStop/restaurants?${params.toString()}` : '/YourStop/restaurants';
    navigate(newUrl, { replace: true });
  }, [filters, navigate]);

  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleLocationChange = (query: string) => {
    setLocationQuery(query);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-16">
            <div className="text-red-600 mb-4">
              <X className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Restaurants</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurants</h1>
          <p className="text-gray-600">
            Discover amazing restaurants and book your perfect dining experience
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Inputs */}
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search restaurants, cuisines, or dishes..."
                  value={filters.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Location, area, or postcode..."
                  value={filters.locationQuery}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter and View Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {getFilterSummary().length}
                  </Badge>
                )}
              </Button>

              <div className="flex items-center border border-gray-200 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {getFilterSummary().map((filter, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {filter}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-600" 
                      onClick={() => {
                        handleClearFilters();
                      }}
                    />
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block sticky top-24`}>
              <RestaurantFilters
                filters={filters}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                totalResults={totalResults}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{totalResults}</span> restaurants found
                {filters.searchQuery && (
                  <span> for "<span className="font-medium">{filters.searchQuery}</span>"</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name A-Z</option>
                  <option value="price">Price Low to High</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
            
            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <LoadingSkeleton key={index} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && filteredRestaurants.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear all filters
                  </Button>
                )}
              </div>
            )}

            {/* Results Grid */}
            {!loading && filteredRestaurants.length > 0 && (
              <div className={`grid gap-8 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => navigate(`/YourStop/restaurants/${restaurant.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Load More Button (if needed) */}
            {!loading && filteredRestaurants.length > 0 && filteredRestaurants.length < totalResults && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  Load More Restaurants
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCustomerAuth } from "../../../yourstop/frontend/src/hooks/use-customer-auth";
import { useAdvancedFilters } from "../../../yourstop/frontend/src/hooks/use-advanced-filters";
import { SimpleRestaurantCard as RestaurantCard } from "../../../yourstop/frontend/src/components/simple-restaurant-card";
import { SearchSuggestions } from "../../../yourstop/frontend/src/components/search-suggestions";
import { Button } from "../../../yourstop/frontend/src/components/ui/button";
import { Input } from "../../../yourstop/frontend/src/components/ui/input";
import { 
  Search, 
  MapPin, 
  Grid3X3,
  List,
  ChevronUp
} from "lucide-react";
import { Skeleton } from "../../../yourstop/frontend/src/components/ui/skeleton";

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useCustomerAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination state - matching original
  const [displayedRestaurants, setDisplayedRestaurants] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const RESTAURANTS_PER_PAGE = 30;

  // Get initial filters from URL params
  const initialFilters = useMemo(() => {
    const filters: any = {};
    if (searchParams.get('search')) filters.searchQuery = searchParams.get('search');
    if (searchParams.get('location')) filters.locationQuery = searchParams.get('location');
    if (searchParams.get('cuisine')) filters.cuisine = [searchParams.get('cuisine')!];
    if (searchParams.get('priceRange')) filters.priceRange = [searchParams.get('priceRange')!];
    if (searchParams.get('rating')) filters.rating = { min: parseFloat(searchParams.get('rating')!), max: 5 };
    return Object.keys(filters).length > 0 ? filters : undefined;
  }, [searchParams]);

  const {
    filteredRestaurants: restaurants,
    loading,
    error,
    setSearchQuery: setSearchQueryFilter,
    setLocationQuery: setLocationQueryFilter,
    updateFilters,
    totalResults,
    hasActiveFilters,
    clearFilters
  } = useAdvancedFilters({
    initialFilters,
    enableRealTimeSearch: true,
    searchDelay: 500
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || locationQuery.trim()) {
      setIsSearching(true);
      setShowSearchSuggestions(false);
      
      updateFilters({
        searchQuery: searchQuery.trim(),
        locationQuery: locationQuery.trim()
      });
      
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery);
      if (locationQuery.trim()) params.set('location', locationQuery);
      
      navigate(`/YourStop/explore?${params.toString()}`);
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'restaurant') {
      setSearchQuery(suggestion.text);
    } else if (suggestion.type === 'cuisine') {
      setSearchQuery(suggestion.text);
    } else if (suggestion.type === 'location') {
      setLocationQuery(suggestion.text);
    }
    setShowSearchSuggestions(false);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (searchQuery.length >= 2) {
      setShowSearchSuggestions(true);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchQueryFilter(value);
    if (value.length >= 2) {
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const handleRestaurantClick = (restaurantId: string) => {
    navigate(`/YourStop/restaurants/${restaurantId}?from=explore`);
  };

  // Pagination logic with performance optimization - matching original
  useEffect(() => {
    if (restaurants.length > 0) {
      const startIndex = 0;
      const endIndex = currentPage * RESTAURANTS_PER_PAGE;
      setDisplayedRestaurants(restaurants.slice(startIndex, endIndex));
    } else {
      setDisplayedRestaurants([]);
    }
  }, [restaurants, currentPage]);

  // Reset pagination when restaurants change (e.g., new search)
  useEffect(() => {
    setCurrentPage(1);
  }, [restaurants]);

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Use requestAnimationFrame for smoother loading
    requestAnimationFrame(() => {
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 300); // Reduced delay for better UX
    });
  };

  const hasMoreRestaurants = displayedRestaurants.length < restaurants.length;
  const totalPages = Math.ceil(restaurants.length / RESTAURANTS_PER_PAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Explore Restaurants</h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Discover amazing restaurants with real-time data and book your perfect dining experience
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search restaurants, cuisines..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
                <SearchSuggestions
                  query={searchQuery}
                  onSelect={handleSuggestionSelect}
                  isVisible={showSearchSuggestions && searchFocused}
                  onClose={() => setShowSearchSuggestions(false)}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Location, city, or area..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base"
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="text-xs sm:text-sm text-gray-600">
            <span className="font-medium">{totalResults}</span> restaurants found
            {searchQuery && (
              <span> for "<span className="font-medium">{searchQuery}</span>"</span>
            )}
            {displayedRestaurants.length > 0 && (
              <span className="block sm:inline sm:ml-2 text-blue-600 mt-1 sm:mt-0">
                (Showing {displayedRestaurants.length} of {totalResults})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none h-8 w-8 sm:h-9 sm:w-9"
              >
                <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none h-8 w-8 sm:h-9 sm:w-9"
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* No Results */}
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
              Try adjusting your search criteria or filters
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="text-xs sm:text-sm">
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Results Grid - matching original */}
        {!loading && displayedRestaurants.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className={`grid gap-4 sm:gap-6 ${
                'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {displayedRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    onBook={() => handleRestaurantClick(restaurant.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    onBook={() => handleRestaurantClick(restaurant.id)}
                  />
                ))}
              </div>
            )}

            {/* Load More Button - matching original */}
            {hasMoreRestaurants && (
              <div className="text-center mt-8 sm:mt-12">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  size="lg"
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 text-sm sm:text-base"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                      <span className="hidden sm:inline">Loading {RESTAURANTS_PER_PAGE} more restaurants...</span>
                      <span className="sm:hidden">Loading more...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Load More Restaurants ({RESTAURANTS_PER_PAGE} more)</span>
                      <span className="sm:hidden">Load More ({RESTAURANTS_PER_PAGE})</span>
                    </>
                  )}
                </Button>
                <p className="text-xs sm:text-sm text-gray-500 mt-3">
                  Showing {displayedRestaurants.length} of {totalResults} restaurants
                </p>
                {isLoadingMore && (
                  <div className="mt-4">
                    <div className="flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 rounded-full w-10 h-10 sm:w-12 sm:h-12 shadow-lg hover:shadow-xl transition-all duration-200"
            size="icon"
          >
            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}

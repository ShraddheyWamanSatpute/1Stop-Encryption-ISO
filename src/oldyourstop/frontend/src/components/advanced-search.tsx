'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useRestaurantData } from '@/hooks/use-restaurant-data';
import { RestaurantData, RestaurantSearchFilters } from '@/lib/restaurant-data-types';
import { Search, Filter, MapPin, Clock, Star, Utensils, Wifi, Car, Users, X, SlidersHorizontal } from 'lucide-react';

interface AdvancedSearchProps {
  onResultsChange?: (results: RestaurantData[]) => void;
  onFiltersChange?: (filters: RestaurantSearchFilters) => void;
}

export function AdvancedSearch({ onResultsChange, onFiltersChange }: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<RestaurantSearchFilters>({
    area: [],
    priceRange: [],
    rating: undefined,
    cuisine: [],
    features: [],
    distance: undefined
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 5]);
  const [distance, setDistance] = useState<number>(5);

  const { restaurants, loading, error, searchRestaurants } = useRestaurantData(filters);

  const cuisineOptions = [
    'Italian', 'French', 'Indian', 'Chinese', 'Japanese', 'Mexican', 'Thai',
    'Mediterranean', 'American', 'British', 'Vegan', 'Vegetarian', 'Seafood',
    'Steakhouse', 'Pizza', 'Sushi', 'Korean', 'Vietnamese', 'Middle Eastern'
  ];

  const featureOptions = [
    'Outdoor Seating', 'Wi-Fi', 'Pet-Friendly', 'Live Music', 'Private Dining',
    'Wheelchair Accessible', 'Parking', 'Takeaway', 'Delivery', 'Bar',
    'Wine List', 'Cocktails', 'Desserts', 'Brunch', 'Late Night'
  ];

  const regionOptions = [
    'All Areas', 'Central London', 'West End', 'East London', 'North London',
    'South London', 'Soho', 'Covent Garden', 'Shoreditch', 'Mayfair',
    'Camden', 'Notting Hill', 'Greenwich', 'Canary Wharf'
  ];

  const priceRangeOptions = [
    { value: 'all', label: 'All Prices' },
    { value: '£', label: '£ (Under £20)' },
    { value: '££', label: '££ (£20-£40)' },
    { value: '£££', label: '£££ (£40-£60)' },
    { value: '££££', label: '££££ (Over £60)' }
  ];

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.0', label: '4.0+ Stars' },
    { value: '3.5', label: '3.5+ Stars' },
    { value: '3.0', label: '3.0+ Stars' }
  ];

  const distanceOptions = [
    { value: 'all', label: 'Any Distance' },
    { value: '1', label: 'Within 1 mile' },
    { value: '2', label: 'Within 2 miles' },
    { value: '5', label: 'Within 5 miles' },
    { value: '10', label: 'Within 10 miles' }
  ];

  useEffect(() => {
    const newFilters: RestaurantSearchFilters = {
      ...filters,
      cuisine: selectedCuisines.length > 0 ? selectedCuisines : undefined,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      priceRange: priceRange[0] > 0 || priceRange[1] < 100 ? [`£${priceRange[0]}-£${priceRange[1]}`] : undefined,
      rating: ratingRange[0] > 0 ? ratingRange[0] : undefined,
      distance: distance > 0 ? distance : undefined
    };
    
    setFilters(newFilters);
    searchRestaurants(newFilters);
    onFiltersChange?.(newFilters);
  }, [selectedCuisines, selectedFeatures, priceRange, ratingRange, distance, searchRestaurants, onFiltersChange]);

  useEffect(() => {
    onResultsChange?.(restaurants);
  }, [restaurants, onResultsChange]);

  const handleSearch = () => {
    const searchFilters: RestaurantSearchFilters = {
      ...filters
    };
    searchRestaurants(searchFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCuisines([]);
    setSelectedFeatures([]);
    setPriceRange([0, 100]);
    setRatingRange([0, 5]);
    setDistance(5);
    setFilters({
      area: [],
      priceRange: [],
      rating: undefined,
      cuisine: [],
      features: [],
      distance: undefined
    });
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCuisines.length > 0) count++;
    if (selectedFeatures.length > 0) count++;
    if (priceRange[0] > 0 || priceRange[1] < 100) count++;
    if (ratingRange[0] > 0) count++;
    if (distance !== 5) count++;
    return count;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Perfect Restaurant
          </CardTitle>
          <CardDescription>
            Search by location, cuisine, price, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search restaurants, cuisines, or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.area?.[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, area: value === 'all' ? [] : [value] }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Area" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map(region => (
                    <SelectItem key={region} value={region.toLowerCase().replace(' ', '-')}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.priceRange?.[0] || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value === 'all' ? [] : [value] }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  {priceRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.rating?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value === 'all' ? undefined : parseFloat(value) }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  {ratingOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Advanced Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>

              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cuisine Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Cuisine Types</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cuisineOptions.map(cuisine => (
                    <label key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedCuisines.includes(cuisine)}
                        onCheckedChange={() => handleCuisineToggle(cuisine)}
                      />
                      <span className="text-sm">{cuisine}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Features</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {featureOptions.map(feature => (
                    <label key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedFeatures.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                      />
                      <span className="text-sm">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">
                      £{priceRange[0]} - £{priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange([value[0], value[1]])}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Rating Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Minimum Rating</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">
                      {ratingRange[0]} stars and above
                    </label>
                    <Slider
                      value={[ratingRange[0]]}
                      onValueChange={(value) => setRatingRange([value[0], 5])}
                      max={5}
                      min={0}
                      step={0.5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Distance */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Distance</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block">
                      Within {distance} miles
                    </label>
                    <Slider
                      value={[distance]}
                      onValueChange={(value) => setDistance(value[0])}
                      max={20}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCuisines(['Italian', 'French', 'Mediterranean']);
                    }}
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    European Cuisine
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedFeatures(['Outdoor Seating', 'Wi-Fi', 'Parking']);
                    }}
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    Business Friendly
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedFeatures(['Pet-Friendly', 'Outdoor Seating']);
                    }}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Pet Friendly
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setRatingRange([4.5, 5]);
                      setPriceRange([40, 100]);
                    }}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Fine Dining
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              {restaurants.length} restaurants found
            </p>
            {getActiveFiltersCount() > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCuisines.map(cuisine => (
                  <Badge key={cuisine} variant="secondary" className="text-xs">
                    {cuisine}
                    <button
                      onClick={() => handleCuisineToggle(cuisine)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {selectedFeatures.map(feature => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                    <button
                      onClick={() => handleFeatureToggle(feature)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Relevance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching restaurants...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleSearch}>Try Again</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

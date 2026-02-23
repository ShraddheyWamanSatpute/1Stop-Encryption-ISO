'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  Star,
  DollarSign,
  MapPin,
  Clock,
  Users,
  Utensils
} from 'lucide-react';
import { UnifiedFilterState, FilterOptions } from '@/lib/unified-filter-service';

interface RestaurantFiltersProps {
  filters: UnifiedFilterState;
  filterOptions: FilterOptions;
  onFilterChange: (newFilters: Partial<UnifiedFilterState>) => void;
  totalResults: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function RestaurantFilters({ 
  filters, 
  filterOptions,
  onFilterChange, 
  totalResults,
  hasActiveFilters,
  onClearFilters
}: RestaurantFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
    'cuisine', 'priceRange', 'rating'
  ]));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCuisineChange = (cuisine: string, checked: boolean) => {
    if (checked) {
      onFilterChange({ cuisine: [...filters.cuisine, cuisine] });
    } else {
      onFilterChange({ cuisine: filters.cuisine.filter(c => c !== cuisine) });
    }
  };

  const handlePriceRangeChange = (priceRange: string, checked: boolean) => {
    if (checked) {
      onFilterChange({ priceRange: [...filters.priceRange, priceRange] });
    } else {
      onFilterChange({ priceRange: filters.priceRange.filter(p => p !== priceRange) });
    }
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      onFilterChange({ features: [...filters.features, feature] });
    } else {
      onFilterChange({ features: filters.features.filter(f => f !== feature) });
    }
  };

  const FilterSection = ({ 
    title, 
    section, 
    children, 
    icon: Icon 
  }: { 
    title: string; 
    section: string; 
    children: React.ReactNode; 
    icon: any;
  }) => {
    const isExpanded = expandedSections.has(section);
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {totalResults} restaurants found
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Cuisine */}
        <FilterSection title="Cuisine" section="cuisine" icon={Utensils}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filterOptions.cuisines.map((cuisine) => (
              <label key={cuisine} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.cuisine.includes(cuisine)}
                  onCheckedChange={(checked) => handleCuisineChange(cuisine, checked as boolean)}
                />
                <span className="text-sm text-gray-700">{cuisine}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" section="priceRange" icon={DollarSign}>
          <div className="space-y-2">
            {filterOptions.priceRanges.map((priceRange) => (
              <label key={priceRange} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.priceRange.includes(priceRange)}
                  onCheckedChange={(checked) => handlePriceRangeChange(priceRange, checked as boolean)}
                />
                <span className="text-sm text-gray-700">{priceRange}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Minimum Rating" section="rating" icon={Star}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Rating: {filters.rating.min}</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < filters.rating.min
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <Slider
              value={[filters.rating.min]}
              onValueChange={([value]) => onFilterChange({ rating: { ...filters.rating, min: value } })}
              max={5}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        </FilterSection>

        {/* Features */}
        <FilterSection title="Features" section="features" icon={Clock}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filterOptions.features.map((feature) => (
              <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.features.includes(feature)}
                  onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {filters.cuisine.map(cuisine => (
                <Badge key={cuisine} variant="secondary" className="text-xs">
                  {cuisine}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange({ cuisine: filters.cuisine.filter(c => c !== cuisine) })}
                  />
                </Badge>
              ))}
              {filters.priceRange.map(price => (
                <Badge key={price} variant="secondary" className="text-xs">
                  {price}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange({ priceRange: filters.priceRange.filter(p => p !== price) })}
                  />
                </Badge>
              ))}
              {filters.rating.min > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.rating.min}+ stars
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange({ rating: { min: 0, max: 5 } })}
                  />
                </Badge>
              )}
              {filters.features.map(feature => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange({ features: filters.features.filter(f => f !== feature) })}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
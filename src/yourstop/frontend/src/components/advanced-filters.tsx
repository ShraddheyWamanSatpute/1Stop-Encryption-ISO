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

interface AdvancedFiltersProps {
  filters: UnifiedFilterState;
  onFilterChange: (key: keyof UnifiedFilterState, value: any) => void;
  onClearFilters: () => void;
  totalCount: number;
}

export function AdvancedFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  totalCount 
}: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
    'cuisine', 'priceRange', 'rating', 'features'
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

  const cuisineOptions = [
    'Italian', 'Chinese', 'Indian', 'Japanese', 'Mexican', 'Thai', 
    'French', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Lebanese'
  ];

  const priceRangeOptions = [
    { value: '£', label: '£ (Budget)', icon: '£' },
    { value: '££', label: '££ (Moderate)', icon: '££' },
    { value: '£££', label: '£££ (Expensive)', icon: '£££' },
    { value: '££££', label: '££££ (Very Expensive)', icon: '££££' }
  ];

  const featureOptions = [
    'Outdoor Seating', 'Takeaway', 'Delivery', 'WiFi', 'Parking',
    'Wheelchair Accessible', 'Pet Friendly', 'Live Music', 'Private Dining',
    'Bar', 'Wine List', 'Vegetarian Options', 'Vegan Options', 'Gluten Free'
  ];

  const hasActiveFilters = () => {
    return filters.cuisine.length > 0 || 
           filters.priceRange.length > 0 || 
           filters.rating.min > 0 || 
           filters.features.length > 0 ||
           filters.searchQuery !== '' ||
           filters.locationQuery !== '';
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
          {hasActiveFilters() && (
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
          {totalCount} restaurants found
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Search & Location */}
        <FilterSection title="Search & Location" section="search" icon={MapPin}>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Restaurant Name
              </label>
              <input
                type="text"
                placeholder="Search restaurants..."
                value={filters.searchQuery}
                onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Location
              </label>
              <input
                type="text"
                placeholder="City, area, or postcode..."
                value={filters.locationQuery}
                onChange={(e) => onFilterChange('locationQuery', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </FilterSection>

        {/* Cuisine */}
        <FilterSection title="Cuisine" section="cuisine" icon={Utensils}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cuisineOptions.map((cuisine) => (
              <label key={cuisine} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.cuisine.includes(cuisine)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange('cuisine', [...filters.cuisine, cuisine]);
                    } else {
                      onFilterChange('cuisine', filters.cuisine.filter(c => c !== cuisine));
                    }
                  }}
                />
                <span className="text-sm text-gray-700">{cuisine}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" section="priceRange" icon={DollarSign}>
          <div className="space-y-2">
            {priceRangeOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.priceRange.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange('priceRange', [...filters.priceRange, option.value]);
                    } else {
                      onFilterChange('priceRange', filters.priceRange.filter(p => p !== option.value));
                    }
                  }}
                />
                <span className="text-sm text-gray-700">{option.label}</span>
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
              onValueChange={([value]) => onFilterChange('rating', { ...filters.rating, min: value })}
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
            {featureOptions.map((feature) => (
              <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={filters.features.includes(feature)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange('features', [...filters.features, feature]);
                    } else {
                      onFilterChange('features', filters.features.filter(f => f !== feature));
                    }
                  }}
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Active Filters Summary */}
        {hasActiveFilters() && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-2">
              {filters.cuisine.map(cuisine => (
                <Badge key={cuisine} variant="secondary" className="text-xs">
                  {cuisine}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('cuisine', filters.cuisine.filter(c => c !== cuisine))}
                  />
                </Badge>
              ))}
              {filters.priceRange.map(price => (
                <Badge key={price} variant="secondary" className="text-xs">
                  {price}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('priceRange', filters.priceRange.filter(p => p !== price))}
                  />
                </Badge>
              ))}
              {filters.rating.min > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.rating.min}+ stars
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('rating', { min: 0, max: 5 })}
                  />
                </Badge>
              )}
              {filters.features.map(feature => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => onFilterChange('features', filters.features.filter(f => f !== feature))}
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

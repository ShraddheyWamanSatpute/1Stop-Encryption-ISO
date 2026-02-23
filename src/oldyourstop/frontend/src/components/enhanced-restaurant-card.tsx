// Enhanced Restaurant Card with Foursquare Integration
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  ChefHat,
  MessageSquare,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface EnhancedRestaurantCardProps {
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone?: string;
    cuisine: string;
    rating: number;
    reviewCount?: number;
    priceRange?: string;
    dataSource?: {
      primary: string;
      reliability: number;
    };
    // Enhanced data from our services
    menu?: {
      categories: any[];
      analytics: {
        dataSource: string;
        reliability: number;
        totalItems: number;
        averagePrice: number;
      };
    };
    availability?: {
      availableSlots: number;
      nextAvailable: string;
      alternatives: number;
    };
    reviews?: {
      summary: {
        totalReviews: number;
        averageRating: number;
        sentiment: {
          positive: number;
          negative: number;
        };
        topTopics: Array<{
          topic: string;
          mentions: number;
        }>;
        recentTrend: 'improving' | 'declining' | 'stable';
      };
      sources: Array<{
        source: string;
        count: number;
      }>;
    };
    // Foursquare-specific data
    foursquareData?: {
      fsq_id: string;
      categories: Array<{
        id: number;
        name: string;
      }>;
      verified: boolean;
      website?: string;
      social_media?: any;
      hours?: any;
    };
    enhancements?: {
      hasMenu: boolean;
      hasAvailability: boolean;
      hasReviews: boolean;
      lastEnhanced: string;
    };
  };
  onBookNow?: (restaurantId: string) => void;
  onViewMenu?: (restaurantId: string) => void;
}

export function EnhancedRestaurantCard({ 
  restaurant, 
  onBookNow, 
  onViewMenu 
}: EnhancedRestaurantCardProps) {
  const {
    id,
    name,
    address,
    phone,
    cuisine,
    rating,
    reviewCount,
    priceRange,
    dataSource,
    menu,
    availability,
    reviews,
    foursquareData,
    enhancements
  } = restaurant;

  // Determine data source badges
  const getDataSourceBadge = () => {
    const badges = [];
    
    if (dataSource?.primary === 'google_places') {
      badges.push(
        <Badge key="google" variant="secondary" className="text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Google Verified
        </Badge>
      );
    }
    
    if (foursquareData?.verified) {
      badges.push(
        <Badge key="foursquare" variant="default" className="text-xs bg-purple-600">
          <Sparkles className="w-3 h-3 mr-1" />
          Foursquare Verified
        </Badge>
      );
    }
    
    if (dataSource?.reliability && dataSource.reliability >= 90) {
      badges.push(
        <Badge key="reliable" variant="outline" className="text-xs border-green-500 text-green-600">
          High Quality Data
        </Badge>
      );
    }
    
    return badges;
  };

  // Get enhancement indicators
  const getEnhancementIndicators = () => {
    const indicators = [];
    
    if (menu?.categories && menu.categories.length > 0) {
      indicators.push(
        <div key="menu" className="flex items-center text-xs text-green-600">
          <ChefHat className="w-3 h-3 mr-1" />
          Menu ({menu.categories.length} categories)
        </div>
      );
    }
    
    if (availability?.availableSlots && availability.availableSlots > 0) {
      indicators.push(
        <div key="availability" className="flex items-center text-xs text-blue-600">
          <Clock className="w-3 h-3 mr-1" />
          Available Now
        </div>
      );
    }
    
    if (reviews?.summary?.totalReviews && reviews.summary.totalReviews > 0) {
      indicators.push(
        <div key="reviews" className="flex items-center text-xs text-orange-600">
          <MessageSquare className="w-3 h-3 mr-1" />
          {reviews.summary.totalReviews} Reviews
        </div>
      );
    }
    
    return indicators;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 relative">
      {/* Foursquare Enhancement Badge */}
      {foursquareData && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-purple-600 text-white text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Enhanced
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{name}</CardTitle>
            
            {/* Data Source Badges */}
            <div className="flex flex-wrap gap-1 mb-2">
              {getDataSourceBadge()}
            </div>
            
            {/* Basic Info */}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{address}</span>
              </div>
              
              {phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{phone}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rating}</span>
                  {reviewCount && (
                    <span className="text-gray-500 ml-1">({reviewCount})</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{cuisine}</Badge>
                  {priceRange && (
                    <Badge variant="outline">{priceRange}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Enhancement Indicators */}
        {enhancements && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-2">Enhanced Features:</div>
            <div className="grid grid-cols-1 gap-1">
              {getEnhancementIndicators()}
            </div>
          </div>
        )}

        {/* Enhanced Data Preview */}
        {(menu || availability || reviews) && (
          <div className="mb-4 space-y-2">
            {/* Menu Preview */}
            {menu && menu.analytics && (
              <div className="text-xs">
                <span className="font-medium">Menu:</span> {menu.analytics.totalItems || 0} items, 
                avg £{(menu.analytics.averagePrice || 0).toFixed(2)}
                <span className="text-gray-500 ml-1">
                  ({menu.analytics.dataSource || 'Unknown'})
                </span>
              </div>
            )}
            
            {/* Availability Preview */}
            {availability && (
              <div className="text-xs">
                <span className="font-medium">Next Available:</span> {availability.nextAvailable || 'Not available'}
                <span className="text-green-600 ml-1">
                  ({availability.availableSlots || 0} slots today)
                </span>
              </div>
            )}
            
            {/* Reviews Preview */}
            {reviews && reviews.summary && (
              <div className="text-xs">
                <span className="font-medium">Reviews:</span> 
                <span className="text-green-600 ml-1">
                  {Math.round(reviews.summary.sentiment?.positive || 0)}% positive
                </span>
                <span className="text-gray-500 ml-1">
                  from {reviews.sources?.length || 0} sources
                </span>
              </div>
            )}
          </div>
        )}

        {/* Foursquare Categories */}
        {foursquareData?.categories && (
          <div className="mb-4">
            <div className="text-xs font-medium text-purple-700 mb-1">Foursquare Categories:</div>
            <div className="flex flex-wrap gap-1">
              {foursquareData.categories.slice(0, 3).map((category) => (
                <Badge 
                  key={category.id} 
                  variant="outline" 
                  className="text-xs border-purple-200 text-purple-600"
                >
                  {category.name}
                </Badge>
              ))}
              {foursquareData.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{foursquareData.categories.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onBookNow?.(id)}
            className="flex-1"
            size="sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Book Now
          </Button>
          
          {menu && (
            <Button 
              onClick={() => onViewMenu?.(id)}
              variant="outline"
              size="sm"
            >
              <ChefHat className="w-4 h-4 mr-2" />
              View Menu
            </Button>
          )}
        </div>

        {/* Data Source Footer */}
        <div className="mt-3 pt-2 border-t text-xs text-gray-500 flex justify-between items-center">
          <span>
            Data: {dataSource?.primary} 
            {dataSource?.reliability && ` (${dataSource.reliability}% reliable)`}
          </span>
          {enhancements && (
            <span>
              Enhanced {new Date(enhancements.lastEnhanced).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EnhancedRestaurantCard;

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  ExternalLink,
  Heart,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface SimpleRestaurantCardProps {
  restaurant: any;
  onClick?: () => void;
  onBook?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  className?: string;
}

export function SimpleRestaurantCard({ 
  restaurant, 
  onClick, 
  onBook,
  onFavorite,
  isFavorite = false,
  className = '' 
}: SimpleRestaurantCardProps) {
  const formatPrice = (price: number) => {
    return '£'.repeat(Math.min(price, 4));
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card 
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-t-lg">
          {(() => {
            // Get the primary image or first available image
            const primaryImage = restaurant.images?.find((img: any) => img.isPrimary) || restaurant.images?.[0];
            const imageUrl = primaryImage?.url || restaurant.imageUrl || restaurant.image;
            
            return imageUrl ? (
              <Image
                src={imageUrl}
                alt={primaryImage?.alt || restaurant.name || 'Restaurant image'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
            );
          })()}
          
          {/* Favorite Button */}
          {onFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavorite();
              }}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`h-3 w-3 sm:h-4 sm:w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
              />
            </button>
          )}

          {/* Rating Badge */}
          {restaurant.rating && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 flex items-center gap-0.5 sm:gap-1">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3 sm:p-4">
          {/* Restaurant Name */}
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 line-clamp-1">
            {restaurant.name}
          </h3>

          {/* Cuisine Type */}
          {restaurant.cuisine && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-1">
              {restaurant.cuisine}
            </p>
          )}

          {/* Location */}
          {restaurant.location?.address && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="line-clamp-1">
                {restaurant.location.address}
              </span>
            </div>
          )}

          {/* Price Range */}
          {restaurant.priceRange && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
              <span className="font-medium">Price:</span>
              <span className="text-green-600 font-medium">
                {formatPrice(restaurant.priceRange)}
              </span>
            </div>
          )}

          {/* Distance */}
          {restaurant.distance && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{formatDistance(restaurant.distance)} away</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (onBook) onBook();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-8 sm:h-9"
              size="sm"
            >
              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">View Details</span>
              <span className="xs:hidden">View</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

const defaultBlurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIyeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjNmNGY2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlNWU3ZWI7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWQxKSIvPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwgMTUwKSI+CiAgICA8Y2lyY2xlIGN4PSIwIiBjeT0iMCIgcj0iNDAiIGZpbGw9IiNkMWQ1ZGIiIG9wYWNpdHk9IjAuOCIvPgogICAgPHBhdGggZD0iTS0yNSwtMTUgTDI1LC0xNSBMMjAsMTUgTC0yMCwxNSBaIiBmaWxsPSIjOWNhM2FmIiBvcGFjaXR5PSIwLjYiLz4KICAgIDxwYXRoIGQ9Ik0tMTUsLTI1IEwxNSwtMjUgTDEyLDUgTC0xMiw1IFoiIGZpbGw9IiM2YjcyODAiIG9wYWNpdHk9IjAuNyIvPgogICAgPGNpcmNsZSBjeD0iLTEwIiBjeT0iLTUiIHI9IjMiIGZpbGw9IiM0YjU1NjMiLz4KICAgIDxjaXJjbGUgY3g9IjEwIiBjeT0iLTUiIHI9IjMiIGZpbGw9IiM0YjU1NjMiLz4KICA8L2c+CiAgPHRleHQgeD0iMjAwIiB5PSIyMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZiNzI4MCI+UmVzdGF1cmFudCBJbWFnZTwvdGV4dD4KPC9zdmc+';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  placeholder = 'blur',
  blurDataURL = defaultBlurDataURL,
  fill = false,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete) {
      setIsLoaded(true);
    }
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Fallback for broken images
  if (hasError) {
    return (
      <div
        className={cn(
          'bg-gray-200 flex items-center justify-center text-gray-500',
          className
        )}
        style={fill ? {} : { width, height }}
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  // Check if this is a Google Places API URL that needs special handling
  const isGooglePlacesUrl = src.includes('maps.googleapis.com/maps/api/place/photo');
  
  if (isGooglePlacesUrl) {
    // Use proxy endpoint for Google Places URLs to avoid CORS issues
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    console.log('🖼️ Using proxy for Google Places URL:', proxyUrl);
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <img
          ref={imgRef}
          src={proxyUrl}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down',
            fill && 'w-full h-full'
          )}
          style={fill ? { objectFit: objectFit } : {}}
          onLoad={() => {
            console.log('✅ Google Places image loaded successfully via proxy');
            handleLoad();
          }}
          onError={(e) => {
            console.error('❌ Google Places image failed to load via proxy:', e);
            handleError();
          }}
        />
        
        {/* Loading skeleton */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Restaurant-specific image component with optimized settings
export function RestaurantImage({
  src,
  alt,
  className,
  priority = false,
  ...props
}: Omit<OptimizedImageProps, 'sizes' | 'quality' | 'placeholder'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      quality={90}
      placeholder="blur"
      {...props}
    />
  );
}

// Thumbnail image component for cards
export function ThumbnailImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'sizes' | 'quality' | 'placeholder'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
      quality={80}
      placeholder="blur"
      {...props}
    />
  );
}

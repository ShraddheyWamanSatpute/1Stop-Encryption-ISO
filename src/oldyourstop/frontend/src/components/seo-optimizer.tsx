'use client';

import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'restaurant';
  restaurant?: {
    name: string;
    address: string;
    cuisine: string;
    rating: number;
    priceRange: string;
    phone?: string;
    website?: string;
    latitude?: number;
    longitude?: number;
  };
  structuredData?: any;
}

export function SEOOptimizer({
  title = 'Book My Table - Discover & Reserve Amazing Restaurants',
  description = 'Find and book the best restaurants in London with real-time availability, reviews, and exclusive deals. Discover your next dining experience today.',
  keywords = ['restaurants', 'dining', 'reservations', 'London', 'food', 'booking'],
  image = '/og-image.jpg',
  url,
  type = 'website',
  restaurant,
  structuredData,
}: SEOProps) {
  const router = useRouter();
  const currentUrl = url || `https://bookmytable.com${router.asPath}`;
  const siteName = 'Book My Table';

  // Generate structured data for restaurants
  const generateRestaurantStructuredData = () => {
    if (!restaurant) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: restaurant.name,
      description: `${restaurant.cuisine} restaurant in ${restaurant.address}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: restaurant.address,
        addressLocality: 'London',
        addressCountry: 'GB',
      },
      telephone: restaurant.phone,
      url: restaurant.website,
      geo: restaurant.latitude && restaurant.longitude ? {
        '@type': 'GeoCoordinates',
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      } : undefined,
      servesCuisine: restaurant.cuisine,
      priceRange: restaurant.priceRange,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: restaurant.rating,
        reviewCount: 100, // This would come from actual data
      },
      image: image,
      sameAs: restaurant.website ? [restaurant.website] : [],
    };
  };

  // Generate breadcrumb structured data
  const generateBreadcrumbStructuredData = () => {
    const breadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://bookmytable.com',
      },
    ];

    if (router.pathname.includes('/explore')) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: 2,
        name: 'Explore Restaurants',
        item: 'https://bookmytable.com/explore',
      });
    }

    if (restaurant) {
      breadcrumbs.push({
        '@type': 'ListItem',
        position: breadcrumbs.length + 1,
        name: restaurant.name,
        item: currentUrl,
      });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs,
    };
  };

  // Generate organization structured data
  const generateOrganizationStructuredData = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteName,
      url: 'https://bookmytable.com',
      logo: 'https://bookmytable.com/logo.png',
      description: 'Discover and book amazing restaurants in London',
      sameAs: [
        'https://twitter.com/bookmytable',
        'https://facebook.com/bookmytable',
        'https://instagram.com/bookmytable',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+44-20-1234-5678',
        contactType: 'customer service',
        availableLanguage: 'English',
      },
    };
  };

  // Combine all structured data
  const allStructuredData = [
    generateOrganizationStructuredData(),
    generateBreadcrumbStructuredData(),
    restaurant ? generateRestaurantStructuredData() : null,
    structuredData,
  ].filter(Boolean);

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={siteName} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@bookmytable" />
      <meta name="twitter:creator" content="@bookmytable" />

      {/* Restaurant-specific meta tags */}
      {restaurant && (
        <>
          <meta property="restaurant:name" content={restaurant.name} />
          <meta property="restaurant:cuisine" content={restaurant.cuisine} />
          <meta property="restaurant:price_range" content={restaurant.priceRange} />
          <meta property="restaurant:rating" content={restaurant.rating.toString()} />
          <meta property="restaurant:address" content={restaurant.address} />
          {restaurant.phone && <meta property="restaurant:phone" content={restaurant.phone} />}
          {restaurant.website && <meta property="restaurant:website" content={restaurant.website} />}
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Alternate language versions */}
      <link rel="alternate" hrefLang="en" href={currentUrl} />
      <link rel="alternate" hrefLang="x-default" href={currentUrl} />

      {/* Favicon and app icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Theme color */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://maps.googleapis.com" />

      {/* DNS prefetch for performance */}
      <link rel="dns-prefetch" href="//api.yelp.com" />
      <link rel="dns-prefetch" href="//api.foursquare.com" />

      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Additional meta tags for mobile */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* Additional meta tags for search engines */}
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="slurp" content="index, follow" />

      {/* Geo tags for location-based SEO */}
      <meta name="geo.region" content="GB-LND" />
      <meta name="geo.placename" content="London" />
      <meta name="geo.position" content="51.5074;-0.1278" />
      <meta name="ICBM" content="51.5074, -0.1278" />
    </Head>
  );
}

// Hook for dynamic SEO updates
export function useSEO() {
  const updateTitle = (title: string) => {
    document.title = title;
  };

  const updateDescription = (description: string) => {
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  };

  const updateImage = (image: string) => {
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    
    if (ogImage) {
      ogImage.setAttribute('content', image);
    }
    if (twitterImage) {
      twitterImage.setAttribute('content', image);
    }
  };

  return {
    updateTitle,
    updateDescription,
    updateImage,
  };
}

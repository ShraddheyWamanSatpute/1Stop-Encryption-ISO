import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const currentUrl = url || `https://bookmytable.com${location.pathname}${location.search}`;
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

    if (location.pathname.includes('/explore')) {
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

  // Update document head directly (Vite/React approach)
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', siteName);
    updateMetaTag('robots', 'index, follow');

    // Open Graph
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:site_name', siteName, true);
    updateMetaTag('og:locale', 'en_GB', true);

    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Restaurant-specific
    if (restaurant) {
      updateMetaTag('restaurant:name', restaurant.name, true);
      updateMetaTag('restaurant:cuisine', restaurant.cuisine, true);
      updateMetaTag('restaurant:price_range', restaurant.priceRange, true);
      updateMetaTag('restaurant:rating', restaurant.rating.toString(), true);
      updateMetaTag('restaurant:address', restaurant.address, true);
      if (restaurant.phone) {
        updateMetaTag('restaurant:phone', restaurant.phone, true);
      }
      if (restaurant.website) {
        updateMetaTag('restaurant:website', restaurant.website, true);
      }
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Add structured data
    allStructuredData.forEach((data, index) => {
      const scriptId = `structured-data-${index}`;
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(data);
    });
  }, [title, description, keywords, image, url, type, restaurant, currentUrl, allStructuredData]);

  return null; // This component doesn't render anything
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

/**
 * Consolidated utility functions for restaurant-related operations
 */

/**
 * Formats price range for display
 * @param priceRange - The price range string (e.g., "$$", "$$$")
 * @returns Formatted price range string
 */
export function formatPriceRange(priceRange: string): string {
  const priceMap: { [key: string]: string } = {
    '$': 'Under £15',
    '$$': '£15 - £30',
    '$$$': '£30 - £50',
    '$$$$': '£50+',
    '£': 'Under £15',
    '££': '£15 - £30',
    '£££': '£30 - £50',
    '££££': '£50+',
  };
  
  return priceMap[priceRange] || '£15 - £30';
}

/**
 * Gets the appropriate price range color class for Tailwind CSS
 * @param priceRange - The price range string
 * @returns Tailwind CSS color class
 */
export function getPriceRangeClass(priceRange: string): string {
  switch (priceRange) {
    case '£':
    case '$':
      return 'bg-green-100 text-green-800 border-green-200';
    case '££':
    case '$$':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case '£££':
    case '$$$':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case '££££':
    case '$$$$':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}

/**
 * Formats currency for display
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'GBP')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Formats rating for display
 * @param rating - The rating number
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted rating string
 */
export function formatRating(rating: number, decimals: number = 1): string {
  return rating.toFixed(decimals);
}

/**
 * Gets the appropriate rating color class for Tailwind CSS
 * @param rating - The rating number
 * @returns Tailwind CSS color class
 */
export function getRatingClass(rating: number): string {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-yellow-600';
  if (rating >= 3.0) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Generates a placeholder image URL for restaurants
 * @param restaurantName - The name of the restaurant
 * @param width - Image width (default: 400)
 * @param height - Image height (default: 300)
 * @returns Placeholder image URL
 */
export function getPlaceholderImageUrl(restaurantName: string, width: number = 400, height: number = 300): string {
  return `/placeholder-restaurant.svg`;
}

/**
 * Truncates text to a specified length
 * @param text - The text to truncate
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Capitalizes the first letter of each word
 * @param text - The text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Formats address for display
 * @param address - The full address
 * @returns Formatted address
 */
export function formatAddress(address: string): string {
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts[1].trim() || parts[0].trim();
  }
  return address.trim();
}

/**
 * Gets cuisine type from comma-separated string
 * @param cuisine - The cuisine string
 * @returns First cuisine type
 */
export function getPrimaryCuisine(cuisine: string): string {
  return cuisine.split(',')[0].trim();
}

/**
 * Generates a unique ID for components
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Debounces a function call
 * @param func - The function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttles a function call
 * @param func - The function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Validates email format
 * @param email - The email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format
 * @param phone - The phone number to validate
 * @returns True if valid phone format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Formats phone number for display
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Gets distance text for display
 * @param distance - Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}

/**
 * Gets time ago text for display
 * @param date - The date to format
 * @returns Time ago string
 */
export function getTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

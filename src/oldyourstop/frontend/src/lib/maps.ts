/**
 * Google Maps utility functions for restaurant locations
 */

/**
 * Opens Google Maps with directions to a restaurant
 * @param address - The restaurant address
 * @param restaurantName - The name of the restaurant for better context
 */
export function openGoogleMapsDirections(address: string, restaurantName?: string): void {
  const encodedAddress = encodeURIComponent(address);
  const encodedName = restaurantName ? encodeURIComponent(restaurantName) : '';
  
  // Create Google Maps URL with directions
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
  
  // Open in new tab
  window.open(mapsUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Opens Google Maps with the restaurant location pinned
 * @param address - The restaurant address
 * @param restaurantName - The name of the restaurant
 */
export function openGoogleMapsLocation(address: string, restaurantName?: string): void {
  const encodedAddress = encodeURIComponent(address);
  const encodedName = restaurantName ? encodeURIComponent(restaurantName) : '';
  
  // Create Google Maps URL with location pin
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  // Open in new tab
  window.open(mapsUrl, '_blank', 'noopener,noreferrer');
}


/**
 * Gets the appropriate price range color class
 * @param pricing - The pricing string
 * @returns Tailwind CSS color class
 */
export function getPriceRangeColor(pricing: string): string {
  const colorMap: { [key: string]: string } = {
    '$': 'text-green-600 bg-green-50 border-green-200',
    '$$': 'text-blue-600 bg-blue-50 border-blue-200',
    '$$$': 'text-orange-600 bg-orange-50 border-orange-200',
    '$$$$': 'text-red-600 bg-red-50 border-red-200',
    '£': 'text-green-600 bg-green-50 border-green-200',
    '££': 'text-blue-600 bg-blue-50 border-blue-200',
    '£££': 'text-orange-600 bg-orange-50 border-orange-200',
    '££££': 'text-red-600 bg-red-50 border-red-200',
  };
  
  return colorMap[pricing] || 'text-gray-600 bg-gray-50 border-gray-200';
}

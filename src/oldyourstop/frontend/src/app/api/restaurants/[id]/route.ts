import { NextRequest, NextResponse } from 'next/server';
import { freeRestaurantDataService } from '@/lib/free-restaurant-apis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 Looking for restaurant with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Get all restaurants using the same service as the explore page
    const restaurants = await freeRestaurantDataService.getComprehensiveRestaurantData('London, UK', 10000);
    console.log(`📊 Found ${restaurants.length} restaurants total`);
    
    const restaurant = restaurants.find(r => r.id === id);
    
    if (!restaurant) {
      console.log(`❌ Restaurant with ID ${id} not found`);
      console.log(`Available IDs: ${restaurants.slice(0, 5).map(r => r.id).join(', ')}...`);
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Found restaurant: ${restaurant.name}`);
    console.log('📸 Restaurant photos:', restaurant.photos);
    console.log('📸 First photo URL:', restaurant.photos?.[0]?.url);
    console.log('🖼️ Restaurant imageUrl:', restaurant.imageUrl);

    // Transform the comprehensive data to match the expected format
    const enhancedRestaurant = {
      id: restaurant.id,
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone || '',
      website: restaurant.website || '',
      cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine || 'International',
      rating: restaurant.rating || 4.0,
      reviewCount: restaurant.reviewCount || 0,
      priceRange: restaurant.priceRange || '££',
      imageUrl: restaurant.photos?.[0]?.url || restaurant.imageUrl || '/placeholder-restaurant.jpg',
      images: restaurant.photos && restaurant.photos.length > 0 ? restaurant.photos : [
        {
          url: '/placeholder-restaurant.jpg',
          alt: restaurant.name
        }
      ],
      description: restaurant.description || `Experience ${Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine || 'International'} cuisine at ${restaurant.name}. Located in ${restaurant.address}, this restaurant offers a unique dining experience with a ${restaurant.rating || 4.0} star rating.`,
      features: restaurant.features || ['Fine Dining', 'Wine Selection', 'Private Dining'],
      openingHours: transformOpeningHours(restaurant.openingHours) || {
        'Monday': '12:00 PM - 10:00 PM',
        'Tuesday': '12:00 PM - 10:00 PM',
        'Wednesday': '12:00 PM - 10:00 PM',
        'Thursday': '12:00 PM - 10:00 PM',
        'Friday': '12:00 PM - 11:00 PM',
        'Saturday': '12:00 PM - 11:00 PM',
        'Sunday': '12:00 PM - 9:00 PM'
      },
      amenities: restaurant.amenities || [
        'WiFi',
        'Parking',
        'Credit Cards Accepted',
        'Wheelchair Accessible',
        'Pet Friendly',
        'Live Music',
        'Outdoor Seating'
      ],
      location: {
        lat: restaurant.location?.latitude || 51.5074,
        lng: restaurant.location?.longitude || -0.1278
      },
      latitude: restaurant.location?.latitude || 51.5074,
      longitude: restaurant.location?.longitude || -0.1278,
      isOpen: restaurant.isOpen || true,
      distance: restaurant.distance || 0.5
    };

    console.log('🎯 Final imageUrl:', enhancedRestaurant.imageUrl);
    console.log('🎯 Final images array length:', enhancedRestaurant.images.length);

    return NextResponse.json(enhancedRestaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

}

// Helper function to transform opening hours from object format to string format
function transformOpeningHours(openingHours: any): { [key: string]: string } | null {
  if (!openingHours) return null;
  
  const transformed: { [key: string]: string } = {};
  
  Object.entries(openingHours).forEach(([day, hours]: [string, any]) => {
    if (typeof hours === 'string') {
      // Already in string format
      transformed[day] = hours;
    } else if (typeof hours === 'object' && hours !== null) {
      // Object format with {open, close, isClosed}
      if (hours.isClosed) {
        transformed[day] = 'Closed';
      } else if (hours.open && hours.close) {
        transformed[day] = `${hours.open} - ${hours.close}`;
      } else {
        transformed[day] = 'Hours not available';
      }
    }
  });
  
  return Object.keys(transformed).length > 0 ? transformed : null;
}

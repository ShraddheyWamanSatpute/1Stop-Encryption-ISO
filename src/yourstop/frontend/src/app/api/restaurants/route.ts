import { NextRequest, NextResponse } from 'next/server';
import { restaurantDataService } from '@/lib/restaurant-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const cuisine = searchParams.get('cuisine') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const rating = searchParams.get('rating') || '';
    const features = searchParams.get('features') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30'); // Default to 30 per page (3 pages = 90 items)

    const filters = {
      query,
      location,
      cuisine: cuisine ? cuisine.split(',') : [],
      priceRange: priceRange ? priceRange.split(',') : [],
      rating: rating ? parseFloat(rating) : undefined,
      features: features ? features.split(',') : [],
      page,
      limit,
    };

    const result = await restaurantDataService.getRestaurants(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

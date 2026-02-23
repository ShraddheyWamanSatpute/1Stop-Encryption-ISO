import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock restaurant data for testing
    const testRestaurants = [
      {
        id: 'test-1',
        name: 'Test Restaurant 1',
        description: 'A test restaurant for development',
        address: '123 Test Street',
        city: 'Test City',
        country: 'Test Country',
        cuisine: ['Test Cuisine'],
        priceRange: '$$',
        rating: 4.5,
        reviewCount: 100,
        imageUrl: '/placeholder-restaurant.jpg',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      restaurants: testRestaurants,
      total: testRestaurants.length,
      page: 1,
      limit: 20,
      totalPages: 1
    });
  } catch (error) {
    console.error('Error in test-restaurants route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
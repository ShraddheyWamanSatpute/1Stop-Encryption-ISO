import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude') || '51.5074';
    const longitude = searchParams.get('longitude') || '-0.1278';
    const radius = Math.min(parseInt(searchParams.get('radius') || '10000'), 40000); // Max 40km
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50); // Max 50 (Yelp's limit)
    const categories = searchParams.get('categories') || 'restaurants';

    // For now, return empty results since we don't have Yelp API key
    // In production, this would call the actual Yelp API
    console.log(`🔍 Yelp API called with lat=${latitude}, lng=${longitude}, radius=${radius}, limit=${limit}, categories=${categories}`);
    
    return NextResponse.json({
      businesses: []
    });
  } catch (error) {
    console.error('Error in yelp search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

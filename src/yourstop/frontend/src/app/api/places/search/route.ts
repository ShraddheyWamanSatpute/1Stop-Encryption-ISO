import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categories = searchParams.get('categories') || '13000';
    const radius = searchParams.get('radius') || '10000';
    const limit = searchParams.get('limit') || '100';
    const ll = searchParams.get('ll') || '51.5074,-0.1278';

    // For now, return empty results since we don't have Foursquare API key
    // In production, this would call the actual Foursquare API
    console.log(`🔍 Foursquare API called with categories=${categories}, radius=${radius}, limit=${limit}, ll=${ll}`);
    
    return NextResponse.json({
      results: []
    });
  } catch (error) {
    console.error('Error in places search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

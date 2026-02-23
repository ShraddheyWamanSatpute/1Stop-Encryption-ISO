import { NextRequest, NextResponse } from 'next/server';

interface SearchSuggestion {
  text: string;
  type: 'restaurant' | 'cuisine' | 'location' | 'trending';
  description?: string;
  popularity?: number;
}

// Mock data - in production, this would come from your database
const mockSuggestions: SearchSuggestion[] = [
  // Restaurants
  { text: 'One Aldwych', type: 'restaurant', description: 'Modern European • Covent Garden', popularity: 0.9 },
  { text: 'The Clermont London', type: 'restaurant', description: 'British • Charing Cross', popularity: 0.8 },
  { text: 'Dishoom', type: 'restaurant', description: 'Indian • Shoreditch', popularity: 0.9 },
  { text: 'The Wolseley', type: 'restaurant', description: 'European • Mayfair', popularity: 0.8 },
  { text: 'Sketch', type: 'restaurant', description: 'Modern European • Mayfair', popularity: 0.7 },
  { text: 'Hawksmoor', type: 'restaurant', description: 'Steakhouse • Covent Garden', popularity: 0.8 },
  { text: 'Duck & Waffle', type: 'restaurant', description: 'British • City of London', popularity: 0.7 },
  { text: 'The River Café', type: 'restaurant', description: 'Italian • Hammersmith', popularity: 0.9 },
  
  // Cuisines
  { text: 'Italian Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.8 },
  { text: 'Japanese Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.7 },
  { text: 'Indian Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.8 },
  { text: 'Chinese Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.6 },
  { text: 'French Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.7 },
  { text: 'Thai Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.6 },
  { text: 'Mexican Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.5 },
  { text: 'Mediterranean Restaurants', type: 'cuisine', description: 'Cuisine type', popularity: 0.6 },
  
  // Locations
  { text: 'Covent Garden', type: 'location', description: 'Area in London', popularity: 0.8 },
  { text: 'Soho', type: 'location', description: 'Area in London', popularity: 0.7 },
  { text: 'Mayfair', type: 'location', description: 'Area in London', popularity: 0.8 },
  { text: 'Shoreditch', type: 'location', description: 'Area in London', popularity: 0.7 },
  { text: 'Notting Hill', type: 'location', description: 'Area in London', popularity: 0.6 },
  { text: 'Clerkenwell', type: 'location', description: 'Area in London', popularity: 0.5 },
  { text: 'Fitzrovia', type: 'location', description: 'Area in London', popularity: 0.5 },
  { text: 'King\'s Cross', type: 'location', description: 'Area in London', popularity: 0.6 },
  
  // Trending
  { text: 'Rooftop Restaurants', type: 'trending', description: 'Trending search', popularity: 0.9 },
  { text: 'Romantic Restaurants', type: 'trending', description: 'Trending search', popularity: 0.8 },
  { text: 'Business Lunch', type: 'trending', description: 'Trending search', popularity: 0.7 },
  { text: 'Family Friendly', type: 'trending', description: 'Trending search', popularity: 0.6 },
  { text: 'Outdoor Seating', type: 'trending', description: 'Trending search', popularity: 0.8 },
  { text: 'Live Music', type: 'trending', description: 'Trending search', popularity: 0.5 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Filter suggestions based on query
    const filteredSuggestions = mockSuggestions
      .filter(suggestion => 
        suggestion.text.toLowerCase().includes(query.toLowerCase()) ||
        suggestion.description?.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.text.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
        const bExact = b.text.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
        
        if (aExact !== bExact) {
          return bExact - aExact;
        }
        
        // Then sort by popularity
        return (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(0, limit);

    // Add location-based suggestions if location is provided
    if (location) {
      const locationSuggestions = mockSuggestions
        .filter(suggestion => 
          suggestion.type === 'location' &&
          suggestion.text.toLowerCase().includes(location.toLowerCase())
        )
        .slice(0, 3);
      
      filteredSuggestions.unshift(...locationSuggestions);
    }

    // Remove duplicates
    const uniqueSuggestions = filteredSuggestions.reduce((acc, current) => {
      const exists = acc.find(item => item.text.toLowerCase() === current.text.toLowerCase());
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as SearchSuggestion[]);

    return NextResponse.json({ 
      suggestions: uniqueSuggestions.slice(0, limit),
      query,
      location,
      total: uniqueSuggestions.length
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

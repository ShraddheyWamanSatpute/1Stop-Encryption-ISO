import { NextRequest, NextResponse } from 'next/server';

// Mock reviews summarization function
const summarizeReviews = async (restaurantId: string, reviews: any[]) => {
  // Mock implementation - replace with actual AI summarization logic
  const positiveKeywords = ['excellent', 'great', 'amazing', 'delicious', 'fantastic'];
  const negativeKeywords = ['poor', 'bad', 'terrible', 'disappointing', 'awful'];
  
  return {
    summary: 'This restaurant receives generally positive reviews for its food quality and service.',
    sentiment: 'positive',
    keyPoints: [
      'Great food quality',
      'Excellent service',
      'Nice atmosphere',
      'Good value for money'
    ],
    averageRating: 4.2,
    totalReviews: reviews.length
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, reviews } = body;

    if (!restaurantId || !reviews) {
      return NextResponse.json(
        { error: 'Restaurant ID and reviews are required' },
        { status: 400 }
      );
    }

    const result = await summarizeReviews(restaurantId, reviews);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error summarizing reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

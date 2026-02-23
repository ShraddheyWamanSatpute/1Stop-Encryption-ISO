import { NextRequest, NextResponse } from 'next/server';

// Mock booking slots suggestion function
const suggestBookingSlots = async (restaurantId: string, date: string, partySize: number, preferences?: any) => {
  // Mock implementation - replace with actual slot suggestion logic
  const baseTime = new Date(`${date}T18:00:00`);
  const suggestedSlots = [];
  
  for (let i = 0; i < 6; i++) {
    const time = new Date(baseTime.getTime() + (i * 30 * 60 * 1000));
    const available = Math.random() > 0.3; // Random availability
    suggestedSlots.push({
      dateTime: time.toISOString(),
      available: available,
      reason: available ? 'Available' : 'Fully booked'
    });
  }
  
  return { 
    suggestedSlots,
    reasoning: `Found ${suggestedSlots.filter(s => s.available).length} available slots for ${partySize} people on ${date}`
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, date, partySize, preferences } = body;

    if (!restaurantId || !date || !partySize) {
      return NextResponse.json(
        { error: 'Restaurant ID, date, and party size are required' },
        { status: 400 }
      );
    }

    const result = await suggestBookingSlots(restaurantId, date, partySize, preferences);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error suggesting booking slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

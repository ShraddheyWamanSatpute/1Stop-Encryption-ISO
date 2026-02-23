import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock implementation - replace with actual database query
    const bookings = [
      {
        id: '1',
        restaurantName: 'Sample Restaurant',
        date: '2024-01-15',
        time: '19:00',
        partySize: 4,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      }
    ];

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, date, time, partySize, specialRequests } = body;

    if (!restaurantId || !date || !time || !partySize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock implementation - replace with actual database insert
    const booking = {
      id: `booking_${Date.now()}`,
      restaurantId,
      restaurantName: 'Sample Restaurant',
      date,
      time,
      partySize,
      specialRequests,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

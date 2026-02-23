import type { Restaurant, Booking } from './types';
import bookingsData from './bookings.json';

// Real restaurants from Foursquare API - this will be populated by the API
export const restaurants: Restaurant[] = [
  {
    id: 'real_1',
    name: 'The London Grill',
    cuisine: 'Modern British',
    address: '123 High Street, London SW1A 1AA',
    rating: 4.5,
    reviewsCount: 245,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400',
    imageHint: 'Modern British restaurant interior',
    menu: [],
    reviews: [],
    description: 'A contemporary British restaurant serving seasonal dishes with a modern twist.',
    pricing: '£££',
    specials: ['Sunday Roast', 'Fish & Chips', 'Seasonal Menu']
  }
];

export const bookings: Booking[] = bookingsData.bookings;

// Mock restaurant data for fallback when APIs are not available
import { RestaurantData, RealTimeAvailability, MenuData, ReviewData } from './restaurant-data-types';

export const mockRestaurants: RestaurantData[] = [
  {
    id: 'mock_1',
    name: 'The London Grill',
    address: '123 High Street, London SW1A 1AA',
    phone: '+44 20 1234 5678',
    cuisine: 'Modern British',
    description: 'A contemporary British restaurant serving seasonal dishes with a modern twist.',
    rating: 4.5,
    reviewCount: 245,
    priceRange: '£££',
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      postcode: 'SW1A 1AA',
      area: 'Westminster'
    },
    images: [{
      id: 'mock_img_1',
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      alt: 'The London Grill interior',
      source: 'manual' as const,
      isPrimary: true,
      uploadedAt: new Date().toISOString()
    }],
    operatingHours: {
      monday: { open: '12:00', close: '22:00', isClosed: false },
      tuesday: { open: '12:00', close: '22:00', isClosed: false },
      wednesday: { open: '12:00', close: '22:00', isClosed: false },
      thursday: { open: '12:00', close: '22:00', isClosed: false },
      friday: { open: '12:00', close: '23:00', isClosed: false },
      saturday: { open: '12:00', close: '23:00', isClosed: false },
      sunday: { open: '12:00', close: '21:00', isClosed: false }
    },
    availability: {
      restaurantId: 'mock_1',
      date: new Date().toISOString().split('T')[0],
      timeSlots: [],
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    },
    menu: {
      restaurantId: 'mock_1',
      categories: [],
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    },
    reviews: [],
    specialOffers: [{
      id: 'offer_mock_1',
      title: 'Early Bird Special',
      description: '20% off all mains before 7 PM',
      type: 'promotion' as const,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      discount: { type: 'percentage' as const, value: 20 }
    }],
    lastUpdated: new Date().toISOString(),
    dataSource: {
      primary: 'manual',
      lastSync: new Date().toISOString(),
      reliability: 50
    }
  }
];

export const mockAvailability: RealTimeAvailability = {
  restaurantId: 'mock_1',
  date: new Date().toISOString().split('T')[0],
  timeSlots: [
    { time: '18:00', available: true, tableTypes: [{ type: 'standard', available: true, capacity: 4 }], maxPartySize: 2, minPartySize: 1 },
    { time: '19:00', available: true, tableTypes: [{ type: 'standard', available: true, capacity: 4 }], maxPartySize: 4, minPartySize: 1 },
    { time: '20:00', available: false, tableTypes: [], maxPartySize: 0, minPartySize: 0 }
  ],
  lastUpdated: new Date().toISOString(),
  source: 'manual'
};

export const mockMenu: MenuData = {
  restaurantId: 'mock_1',
  categories: [{
    id: 'starters',
    name: 'Starters',
    items: [{
      id: 'starter_1',
      name: 'Soup of the Day',
      description: 'Chef\'s daily selection served with crusty bread',
      price: 7.50,
      currency: 'GBP',
      category: 'Starters',
      dietaryInfo: ['vegetarian'],
      allergens: ['gluten'],
      isAvailable: true,
      lastUpdated: new Date().toISOString()
    }],
    order: 1
  }],
  lastUpdated: new Date().toISOString(),
  source: 'manual'
};

export const mockReviews: ReviewData[] = [{
  id: 'review_1',
  author: 'John D.',
  rating: 5,
  comment: 'Excellent food and service!',
  date: new Date().toISOString(),
  source: 'google',
  verified: true,
  helpful: 5
}];

export function generateMockAvailability(restaurantId: string, date: string): RealTimeAvailability {
  return {
    restaurantId,
    date,
    timeSlots: [
      { time: '18:00', available: true, tableTypes: [{ type: 'standard', available: true, capacity: 4 }], maxPartySize: 2, minPartySize: 1 },
      { time: '19:00', available: true, tableTypes: [{ type: 'standard', available: true, capacity: 4 }], maxPartySize: 4, minPartySize: 1 },
      { time: '20:00', available: Math.random() > 0.5, tableTypes: [{ type: 'standard', available: true, capacity: 4 }], maxPartySize: 2, minPartySize: 1 }
    ],
    lastUpdated: new Date().toISOString(),
    source: 'manual'
  };
}

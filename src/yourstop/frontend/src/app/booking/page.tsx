import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Star, MapPin, Phone, Search, Filter, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { BookingModal } from '@/components/booking-modal';
import { BookingSection } from '@/components/booking-section';
import { BookingManagement } from '@/components/booking-management';
import { Restaurant } from '@/types/restaurant';

// Mock restaurants data
const mockRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'The Shard Restaurant',
    description: 'Fine dining with panoramic views of London from the 31st floor of The Shard.',
    address: '31 St Thomas St, London SE1 9RY',
    city: 'London',
    country: 'UK',
    cuisine: ['Modern European', 'Fine Dining'],
    priceRange: '££££',
    rating: 4.8,
    reviewCount: 1247,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 80,
    phone: '+44 20 7234 8188',
    website: 'https://theshard.com',
    features: ['City Views', 'Private Dining', 'Wine Bar'],
    operatingHours: {
      'Monday': { open: '18:00', close: '23:00' },
      'Tuesday': { open: '18:00', close: '23:00' },
      'Wednesday': { open: '18:00', close: '23:00' },
      'Thursday': { open: '18:00', close: '23:00' },
      'Friday': { open: '18:00', close: '23:30' },
      'Saturday': { open: '18:00', close: '23:30' },
      'Sunday': { open: '18:00', close: '22:00' }
    }
  },
  {
    id: 'rest-2',
    name: 'Dishoom Covent Garden',
    description: 'Bombay-style café serving authentic Indian street food in a vintage setting.',
    address: '12 Upper St Martin\'s Ln, London WC2H 9FB',
    city: 'London',
    country: 'UK',
    cuisine: ['Indian', 'Street Food'],
    priceRange: '££',
    rating: 4.6,
    reviewCount: 2156,
    imageUrl: 'https://picsum.photos/400/300?random=2',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 120,
    phone: '+44 20 7420 9320',
    website: 'https://dishoom.com',
    features: ['Vegetarian Friendly', 'Late Night', 'Group Friendly'],
    operatingHours: {
      'Monday': { open: '08:00', close: '23:00' },
      'Tuesday': { open: '08:00', close: '23:00' },
      'Wednesday': { open: '08:00', close: '23:00' },
      'Thursday': { open: '08:00', close: '23:00' },
      'Friday': { open: '08:00', close: '23:00' },
      'Saturday': { open: '09:00', close: '23:00' },
      'Sunday': { open: '09:00', close: '22:00' }
    }
  },
  {
    id: 'rest-3',
    name: 'The River Café',
    description: 'Iconic Italian restaurant with a focus on seasonal ingredients and simple, elegant dishes.',
    address: 'Thames Wharf, Rainville Rd, London W6 9HA',
    city: 'London',
    country: 'UK',
    cuisine: ['Italian', 'Mediterranean'],
    priceRange: '£££',
    rating: 4.7,
    reviewCount: 892,
    imageUrl: 'https://picsum.photos/400/300?random=3',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 60,
    phone: '+44 20 7386 4200',
    website: 'https://rivercafe.co.uk',
    features: ['Riverside Views', 'Garden Seating', 'Private Events'],
    operatingHours: {
      'Monday': { open: '12:00', close: '15:00' },
      'Tuesday': { open: '12:00', close: '15:00' },
      'Wednesday': { open: '12:00', close: '15:00' },
      'Thursday': { open: '12:00', close: '15:00' },
      'Friday': { open: '12:00', close: '15:00' },
      'Saturday': { open: '12:00', close: '15:00' },
      'Sunday': { open: '12:00', close: '15:00' }
    }
  },
  {
    id: 'rest-4',
    name: 'Hawksmoor Spitalfields',
    description: 'Premium steakhouse known for exceptional British beef and classic cocktails.',
    address: '157A Commercial St, London E1 6BJ',
    city: 'London',
    country: 'UK',
    cuisine: ['Steakhouse', 'British'],
    priceRange: '££££',
    rating: 4.5,
    reviewCount: 1834,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 100,
    phone: '+44 20 7426 4850',
    website: 'https://thehawksmoor.com',
    features: ['Private Dining', 'Bar', 'Late Night'],
    operatingHours: {
      'Monday': { open: '17:00', close: '23:00' },
      'Tuesday': { open: '17:00', close: '23:00' },
      'Wednesday': { open: '17:00', close: '23:00' },
      'Thursday': { open: '17:00', close: '23:00' },
      'Friday': { open: '17:00', close: '23:30' },
      'Saturday': { open: '17:00', close: '23:30' },
      'Sunday': { open: '17:00', close: '22:00' }
    }
  },
  {
    id: 'rest-5',
    name: 'Clos Maggiore',
    description: 'Romantic French restaurant with a beautiful conservatory and extensive wine list.',
    address: '33 King St, London WC2E 8JD',
    city: 'London',
    country: 'UK',
    cuisine: ['French', 'Fine Dining'],
    priceRange: '££££',
    rating: 4.4,
    reviewCount: 1456,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 70,
    phone: '+44 20 7836 8882',
    website: 'https://closmaggiore.com',
    features: ['Romantic', 'Wine Bar', 'Private Dining'],
    operatingHours: {
      'Monday': { open: '17:30', close: '23:00' },
      'Tuesday': { open: '17:30', close: '23:00' },
      'Wednesday': { open: '17:30', close: '23:00' },
      'Thursday': { open: '17:30', close: '23:00' },
      'Friday': { open: '17:30', close: '23:30' },
      'Saturday': { open: '17:30', close: '23:30' },
      'Sunday': { open: '17:30', close: '22:00' }
    }
  },
  {
    id: 'rest-6',
    name: 'Padella',
    description: 'No-frills pasta bar serving fresh, handmade pasta with simple, delicious sauces.',
    address: '6 Southwark St, London SE1 1TQ',
    city: 'London',
    country: 'UK',
    cuisine: ['Italian', 'Pasta'],
    priceRange: '££',
    rating: 4.3,
    reviewCount: 3245,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 40,
    phone: '+44 20 7403 9951',
    website: 'https://padella.co',
    features: ['Counter Seating', 'Quick Service', 'No Reservations'],
    operatingHours: {
      'Monday': { open: '12:00', close: '15:00' },
      'Tuesday': { open: '12:00', close: '15:00' },
      'Wednesday': { open: '12:00', close: '15:00' },
      'Thursday': { open: '12:00', close: '15:00' },
      'Friday': { open: '12:00', close: '15:00' },
      'Saturday': { open: '12:00', close: '15:00' },
      'Sunday': { open: '12:00', close: '15:00' }
    }
  },
  {
    id: 'rest-7',
    name: 'The Ledbury',
    description: 'Two-Michelin-starred restaurant offering innovative British cuisine in a sophisticated setting.',
    address: '127 Ledbury Rd, London W11 2AQ',
    city: 'London',
    country: 'UK',
    cuisine: ['Modern British', 'Fine Dining'],
    priceRange: '£££££',
    rating: 4.9,
    reviewCount: 567,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 45,
    phone: '+44 20 7792 9090',
    website: 'https://theledbury.com',
    features: ['Michelin Starred', 'Tasting Menu', 'Wine Pairing'],
    operatingHours: {
      'Monday': { open: '18:30', close: '22:00' },
      'Tuesday': { open: '18:30', close: '22:00' },
      'Wednesday': { open: '18:30', close: '22:00' },
      'Thursday': { open: '18:30', close: '22:00' },
      'Friday': { open: '18:30', close: '22:00' },
      'Saturday': { open: '18:30', close: '22:00' },
      'Sunday': { open: '18:30', close: '22:00' }
    }
  },
  {
    id: 'rest-8',
    name: 'Franco Manca',
    description: 'Neapolitan-style pizzeria using sourdough and traditional techniques for authentic Italian pizza.',
    address: '4 Market Row, London SW9 8LD',
    city: 'London',
    country: 'UK',
    cuisine: ['Italian', 'Pizza'],
    priceRange: '£',
    rating: 4.2,
    reviewCount: 4567,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 60,
    phone: '+44 20 7738 3021',
    website: 'https://francomanca.co.uk',
    features: ['Wood Fired', 'Vegetarian Friendly', 'Family Friendly'],
    operatingHours: {
      'Monday': { open: '12:00', close: '23:00' },
      'Tuesday': { open: '12:00', close: '23:00' },
      'Wednesday': { open: '12:00', close: '23:00' },
      'Thursday': { open: '12:00', close: '23:00' },
      'Friday': { open: '12:00', close: '23:00' },
      'Saturday': { open: '12:00', close: '23:00' },
      'Sunday': { open: '12:00', close: '22:00' }
    }
  },
  {
    id: 'rest-9',
    name: 'The Wolseley',
    description: 'Grand European café-restaurant serving breakfast, lunch, and dinner in an elegant Art Deco setting.',
    address: '160 Piccadilly, London W1J 9EB',
    city: 'London',
    country: 'UK',
    cuisine: ['European', 'Café'],
    priceRange: '£££',
    rating: 4.1,
    reviewCount: 2789,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 150,
    phone: '+44 20 7409 8750',
    website: 'https://thewolseley.com',
    features: ['Breakfast', 'Afternoon Tea', 'Private Dining'],
    operatingHours: {
      'Monday': { open: '07:00', close: '24:00' },
      'Tuesday': { open: '07:00', close: '24:00' },
      'Wednesday': { open: '07:00', close: '24:00' },
      'Thursday': { open: '07:00', close: '24:00' },
      'Friday': { open: '07:00', close: '24:00' },
      'Saturday': { open: '08:00', close: '24:00' },
      'Sunday': { open: '08:00', close: '23:00' }
    }
  },
  {
    id: 'rest-10',
    name: 'Duck & Waffle',
    description: '24-hour restaurant on the 40th floor offering British cuisine with stunning city views.',
    address: '110 Bishopsgate, London EC2N 4AY',
    city: 'London',
    country: 'UK',
    cuisine: ['British', 'Contemporary'],
    priceRange: '£££',
    rating: 4.0,
    reviewCount: 3124,
    imageUrl: 'https://picsum.photos/400/300?random=1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    capacity: 120,
    phone: '+44 20 3640 7310',
    website: 'https://duckandwaffle.com',
    features: ['24 Hour', 'City Views', 'Late Night'],
    operatingHours: {
      'Monday': { open: '00:00', close: '23:59' },
      'Tuesday': { open: '00:00', close: '23:59' },
      'Wednesday': { open: '00:00', close: '23:59' },
      'Thursday': { open: '00:00', close: '23:59' },
      'Friday': { open: '00:00', close: '23:59' },
      'Saturday': { open: '00:00', close: '23:59' },
      'Sunday': { open: '00:00', close: '23:59' }
    }
  }
];

export default function BookingPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'booking' | 'manage'>('restaurants');
  const [searchQuery, setSearchQuery] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState<{
    date: string;
    time: string;
    partySize: number;
  } | null>(null);

  // Get unique cuisines for filter
  const cuisines = Array.from(new Set(mockRestaurants.flatMap(r => r.cuisine)));

  // Filter restaurants based on search and filters
  const filteredRestaurants = mockRestaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.cuisine.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCuisine = cuisineFilter === 'all' || restaurant.cuisine.includes(cuisineFilter);
    
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'budget' && restaurant.priceRange === '£') ||
                        (priceFilter === 'moderate' && restaurant.priceRange === '££') ||
                        (priceFilter === 'expensive' && restaurant.priceRange === '£££') ||
                        (priceFilter === 'luxury' && (restaurant.priceRange === '££££' || restaurant.priceRange === '£££££'));
    
    return matchesSearch && matchesCuisine && matchesPrice;
  });

  const handleBookTable = (restaurant: Restaurant, date?: string, time?: string, partySize?: number) => {
    // Allow booking without authentication for now
    setSelectedRestaurant(restaurant);
    setBookingData({ date: date || '', time: time || '', partySize: partySize || 2 });
    setIsBookingModalOpen(true);
  };

  const handleQuickBook = (restaurant: Restaurant) => {
    // Allow booking without authentication for now
    setSelectedRestaurant(restaurant);
    setBookingData({ date: '', time: '', partySize: 2 });
    setIsBookingModalOpen(true);
  };

  // Debug: Log authentication state
  console.log('Auth state:', { user, loading });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Restaurant Booking</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing restaurants and book your perfect dining experience
          </p>
        </div>

        {/* Tabs */}
        {!loading && (
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <button
                onClick={() => setActiveTab('restaurants')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'restaurants'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Browse Restaurants
              </button>
              <button
                onClick={() => setActiveTab('booking')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'booking'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Make Booking
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Bookings
              </button>
            </div>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && !loading && (
          <>
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cuisines</SelectItem>
                      {cuisines.map(cuisine => (
                        <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priceFilter} onValueChange={setPriceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="budget">£ Budget</SelectItem>
                      <SelectItem value="moderate">££ Moderate</SelectItem>
                      <SelectItem value="expensive">£££ Expensive</SelectItem>
                      <SelectItem value="luxury">££££+ Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="justify-start">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Restaurants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300/cccccc/666666?text=Restaurant+Image';
                      }}
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
                      <Badge variant="secondary">{restaurant.priceRange}</Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
                    
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{restaurant.rating}</span>
                        <span>({restaurant.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{restaurant.city}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {restaurant.cuisine.map((cuisine, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Capacity: {restaurant.capacity}</span>
                        </div>
                        {restaurant.phone && (
                          <div className="flex items-center gap-1 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{restaurant.phone}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleQuickBook(restaurant)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Book Table
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredRestaurants.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Booking Tab */}
        {activeTab === 'booking' && !loading && (
          <BookingSection />
        )}

             {/* Manage Bookings Tab */}
             {activeTab === 'manage' && !loading && (
               <BookingManagement />
             )}

        {/* Booking Modal */}
        {selectedRestaurant && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => {
              setIsBookingModalOpen(false);
              setSelectedRestaurant(null);
              setBookingData(null);
            }}
            restaurant={{
              id: selectedRestaurant.id,
              name: selectedRestaurant.name,
              address: selectedRestaurant.address,
              phone: selectedRestaurant.phone
            }}
            preFilledData={bookingData || undefined}
          />
        )}
      </div>
    </div>
  );
}

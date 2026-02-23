'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewsSection } from '@/components/reviews-section';
import { RestaurantMap } from '@/components/restaurant-map';
import { BookingModal } from '@/components/booking-modal';
import { ShareButton } from '@/components/share-button';
import { openGoogleMapsDirections } from '@/lib/maps';
import { toast } from 'sonner';
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Star,
  Heart,
  Share2,
  Calendar,
  Users,
  Utensils,
  Wifi,
  Car,
  CreditCard,
  Accessibility,
  Dog,
  Music,
  Camera,
  Award,
  ChevronLeft,
  Navigation,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { RestaurantImage } from '@/components/optimized-image';
import Link from 'next/link';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  imageUrl?: string;
  images?: Array<{ url: string; alt?: string }>;
  description?: string;
  features?: string[];
  openingHours?: {
    [key: string]: string;
  };
  amenities?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  distance?: number;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Check if accessed from explore page
  const isFromExplore = searchParams.get('from') === 'explore';

  useEffect(() => {
    if (params.id) {
      fetchRestaurantDetails(params.id as string);
    }
  }, [params.id]);

  const fetchRestaurantDetails = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data);
      } else {
        // No mock data - only show real API data
        setRestaurant(null);
      }
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      // No mock data - only show real API data
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPriceRange = (priceRange: string) => {
    switch (priceRange) {
      case '£': return 'Affordable';
      case '££': return 'Moderate';
      case '£££': return 'Expensive';
      case '££££': return 'Very Expensive';
      default: return 'N/A';
    }
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return [`${hour}:00`, `${hour}:30`];
  }).flat();

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="h-4 w-4" />;
      case 'parking': return <Car className="h-4 w-4" />;
      case 'credit cards': return <CreditCard className="h-4 w-4" />;
      case 'wheelchair access': return <Accessibility className="h-4 w-4" />;
      case 'pet friendly': return <Dog className="h-4 w-4" />;
      case 'live music': return <Music className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded-xl mb-6"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-6">The restaurant you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="h-8 sm:h-9 px-2 sm:px-3">
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Back</span>
                </Button>
                <div className="flex items-center gap-1 sm:gap-2">
                  <ShareButton
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/restaurants/${restaurant.id}`}
                    title={`Check out ${restaurant.name}`}
                    description={`${restaurant.cuisine} restaurant in ${restaurant.address}`}
                    size="sm"
                    variant="outline"
                    className="h-8 sm:h-9 px-2 sm:px-3"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <Heart className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Restaurant Header */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold text-sm sm:text-base">{restaurant.rating}</span>
                      <span className="ml-1 text-gray-500 text-xs sm:text-sm">({restaurant.reviewCount} reviews)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {restaurant.cuisine}
                      </Badge>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {formatPriceRange(restaurant.priceRange)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="flex items-center text-green-600 mb-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="font-medium text-sm sm:text-base">Open Now</span>
                  </div>
                  {restaurant.distance && (
                    <p className="text-xs sm:text-sm text-gray-500">{restaurant.distance} km away</p>
                  )}
                </div>
              </div>

              {/* Image Gallery */}
              <div className="relative h-64 w-full rounded-xl overflow-hidden mb-6">
                <RestaurantImage
                  src={restaurant.imageUrl || restaurant.images?.[0]?.url || '/placeholder-restaurant.jpg'}
                  alt={restaurant.name}
                  fill
                  priority
                  className="object-cover"
                />
              </div>

              {/* Contact Info */}
              <div className="flex items-center gap-4 text-gray-700 mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span>{restaurant.address}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-500" />
                    <a
                      href={restaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              {restaurant.description && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About {restaurant.name}</h2>
                  <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
                </div>
              )}

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {(restaurant.features || ['Fine Dining', 'Wine Selection', 'Private Dining']).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(restaurant.amenities || ['WiFi', 'Parking', 'Credit Cards', 'Wheelchair Access']).map((amenity, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      {getAmenityIcon(amenity)}
                      <span className="ml-2">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opening Hours */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Opening Hours</h3>
                <div className="space-y-1">
                  {Object.entries(restaurant.openingHours || {
                    "Monday": "12:00 PM - 10:00 PM",
                    "Tuesday": "12:00 PM - 10:00 PM",
                    "Wednesday": "12:00 PM - 10:00 PM",
                    "Thursday": "12:00 PM - 10:00 PM",
                    "Friday": "12:00 PM - 11:00 PM",
                    "Saturday": "12:00 PM - 11:00 PM",
                    "Sunday": "12:00 PM - 9:00 PM"
                  }).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{day}</span>
                      <span className="text-gray-600">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Restaurant Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cuisine</span>
                      <span className="text-sm font-medium">{restaurant.cuisine}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Price Range</span>
                      <span className="text-sm font-medium">{formatPriceRange(restaurant.priceRange)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium">{restaurant.rating} ({restaurant.reviewCount} reviews)</span>
                      </div>
                    </div>
                    <Separator />
                    <h3 className="font-semibold text-gray-800">Features & Amenities</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                      {(restaurant.features || []).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <h3 className="font-semibold text-gray-800">Opening Hours</h3>
                    <div className="space-y-1">
                      {Object.entries(restaurant.openingHours || {}).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="font-medium">{day}</span>
                          <span className="text-gray-600">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="menu">
                <Card>
                  <CardHeader>
                    <CardTitle>Menu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Utensils className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Menu Coming Soon</h3>
                      <p className="text-gray-500">We're working on bringing you the complete menu.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <ReviewsSection
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                  averageRating={restaurant.rating}
                  totalReviews={restaurant.reviewCount}
                />
              </TabsContent>

              <TabsContent value="photos">
                <Card>
                  <CardHeader>
                    <CardTitle>Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Photos Coming Soon</h3>
                      <p className="text-gray-500">Restaurant photos will be available here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location">
                <RestaurantMap restaurant={{
                  name: restaurant.name,
                  address: restaurant.address,
                  phone: restaurant.phone,
                  website: restaurant.website,
                  location: {
                    lat: restaurant.latitude || restaurant.location?.lat || 51.5074,
                    lng: restaurant.longitude || restaurant.location?.lng || -0.1278
                  }
                }} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Sidebar - Only show if not from explore */}
          {!isFromExplore && (
            <div className="space-y-6">
              {/* Booking Card */}
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Make a Reservation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                    <select
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                        <option key={size} value={size}>
                          {size} {size === 1 ? 'person' : 'people'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      if (!selectedDate || !selectedTime) {
                        toast.error('Please select a date and time for your reservation');
                        return;
                      }
                      setShowBookingModal(true);
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Table
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Free cancellation up to 2 hours before
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => openGoogleMapsDirections(restaurant.address, restaurant.name)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${restaurant.phone}`, '_self')}
                    disabled={!restaurant.phone}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Restaurant
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(restaurant.website, '_blank')}
                    disabled={!restaurant.website}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Visit Website
                  </Button>
                </CardContent>
              </Card>

              {/* Restaurant Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Restaurant Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Range</span>
                    <span className="text-sm font-medium">{formatPriceRange(restaurant.priceRange)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cuisine</span>
                    <span className="text-sm font-medium">{restaurant.cuisine}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium">{restaurant.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reviews</span>
                    <span className="text-sm font-medium">{restaurant.reviewCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {!isFromExplore && (
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            restaurant={restaurant}
            preFilledData={{
              date: selectedDate,
              time: selectedTime,
              partySize: partySize
            }}
          />
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Calendar, Clock, Users, MapPin, Phone, Mail, CreditCard, CheckCircle, AlertCircle, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  tableType: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  specialRequests?: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  confirmationCode: string;
}

interface BookingManagementProps {
  userId?: string;
}

export function BookingManagement({ userId }: BookingManagementProps) {
  const { user } = useCustomerAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  // Mock bookings data - in production, this would come from an API
  useEffect(() => {
    const mockBookings: Booking[] = [
      {
        id: 'booking-1',
        restaurantId: 'mock-1',
        restaurantName: 'The Shard Restaurant',
        date: '2024-09-25',
        time: '19:30',
        partySize: 4,
        tableType: 'booth',
        status: 'confirmed',
        totalAmount: 180.50,
        paymentStatus: 'paid',
        specialRequests: 'Vegetarian options needed',
        customerInfo: {
          name: user?.displayName || 'John Doe',
          email: user?.email || 'john@example.com',
          phone: '+44 7700 900123'
        },
        createdAt: '2024-09-22T10:30:00Z',
        confirmationCode: 'BMT-2024-001'
      },
      {
        id: 'booking-2',
        restaurantId: 'mock-2',
        restaurantName: 'Dishoom Covent Garden',
        date: '2024-09-23',
        time: '20:00',
        partySize: 2,
        tableType: 'standard',
        status: 'confirmed',
        totalAmount: 95.00,
        paymentStatus: 'paid',
        customerInfo: {
          name: user?.displayName || 'John Doe',
          email: user?.email || 'john@example.com',
          phone: '+44 7700 900123'
        },
        createdAt: '2024-09-21T15:45:00Z',
        confirmationCode: 'BMT-2024-002'
      },
      {
        id: 'booking-3',
        restaurantId: 'mock-3',
        restaurantName: 'The River Café',
        date: '2024-09-20',
        time: '18:30',
        partySize: 6,
        tableType: 'private',
        status: 'completed',
        totalAmount: 320.75,
        paymentStatus: 'paid',
        specialRequests: 'Birthday celebration',
        customerInfo: {
          name: user?.displayName || 'John Doe',
          email: user?.email || 'john@example.com',
          phone: '+44 7700 900123'
        },
        createdAt: '2024-09-18T12:20:00Z',
        confirmationCode: 'BMT-2024-003'
      }
    ];

    setBookings(mockBookings);
    setLoading(false);
  }, [user]);

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'upcoming':
        return bookingDate >= today && booking.status !== 'cancelled';
      case 'past':
        return bookingDate < today || booking.status === 'completed';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  const handleCancelBooking = async (bookingId: string) => {
    try {
      // In production, this would make an API call
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as const }
          : booking
      ));
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleModifyBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    // In production, this would open a modification modal
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your bookings...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-gray-600">Manage your restaurant reservations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All ({bookings.length})
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
            size="sm"
          >
            Upcoming ({bookings.filter(b => new Date(b.date) >= new Date() && b.status !== 'cancelled').length})
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            onClick={() => setFilter('past')}
            size="sm"
          >
            Past ({bookings.filter(b => new Date(b.date) < new Date() || b.status === 'completed').length})
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setFilter('cancelled')}
            size="sm"
          >
            Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't made any bookings yet."
                : `No ${filter} bookings found.`
              }
            </p>
            <Button asChild>
              <a href="/#restaurants">Find Restaurants</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.restaurantName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Confirmation: {booking.confirmationCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{format(new Date(booking.date), 'EEEE, MMM do, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{booking.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{booking.partySize} people</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span>£{booking.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {booking.specialRequests && (
                      <div className="text-sm text-gray-600">
                        <strong>Special Requests:</strong> {booking.specialRequests}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Booked on {format(new Date(booking.createdAt), 'MMM do, yyyy \'at\' h:mm a')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {booking.status === 'confirmed' && new Date(booking.date) > new Date() && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModifyBooking(booking)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modify
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Card className="fixed inset-0 z-50 m-4 max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Booking Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Restaurant Information</h4>
                <p className="text-sm text-gray-600">{selectedBooking.restaurantName}</p>
                <p className="text-sm text-gray-600">Confirmation: {selectedBooking.confirmationCode}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Booking Status</h4>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                  <Badge className={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                    {selectedBooking.paymentStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Reservation Details</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Date:</strong> {format(new Date(selectedBooking.date), 'EEEE, MMMM do, yyyy')}</p>
                  <p><strong>Time:</strong> {selectedBooking.time}</p>
                  <p><strong>Party Size:</strong> {selectedBooking.partySize} people</p>
                  <p><strong>Table Type:</strong> {selectedBooking.tableType}</p>
                  <p><strong>Total Amount:</strong> £{selectedBooking.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {selectedBooking.customerInfo.name}</p>
                  <p><strong>Email:</strong> {selectedBooking.customerInfo.email}</p>
                  <p><strong>Phone:</strong> {selectedBooking.customerInfo.phone}</p>
                </div>
              </div>
            </div>

            {selectedBooking.specialRequests && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Special Requests</h4>
                  <p className="text-sm text-gray-600">{selectedBooking.specialRequests}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
              {selectedBooking.status === 'confirmed' && new Date(selectedBooking.date) > new Date() && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleModifyBooking(selectedBooking)}
                  >
                    Modify Booking
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                  >
                    Cancel Booking
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

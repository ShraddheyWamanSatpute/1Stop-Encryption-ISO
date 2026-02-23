'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAvailability, useBooking } from '@/hooks/use-availability';
import { useAuth } from '@/hooks/use-auth';
import { paymentService } from '@/lib/payment-service';
import { notificationService } from '@/lib/notification-service';
import { Calendar, Clock, Users, MapPin, Phone, Mail, CreditCard, CheckCircle, AlertCircle, Loader2, Bell, BellOff } from 'lucide-react';
import { format } from 'date-fns';

interface EnhancedBookingProps {
  restaurantId: string;
  restaurantName: string;
  onBookingSuccess?: (bookingId: string) => void;
}

export function EnhancedBooking({ restaurantId, restaurantName, onBookingSuccess }: EnhancedBookingProps) {
  const { user } = useAuth();
  const { availability, loading, error, filters, updateFilters, refreshAvailability } = useAvailability(restaurantId);
  const { booking, loading: bookingLoading, error: bookingError, bookTable } = useBooking();

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedTableType, setSelectedTableType] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: ''
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
      const enabled = await notificationService.areNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };
    initNotifications();
  }, []);

  const handleDateChange = (date: string) => {
    updateFilters({ date });
    setSelectedTime('');
    setSelectedTableType('');
  };

  const handlePartySizeChange = (partySize: number) => {
    updateFilters({ partySize });
    setSelectedTime('');
    setSelectedTableType('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedTableType('');
  };

  const handleTableTypeSelect = (tableType: string) => {
    setSelectedTableType(tableType);
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      const permission = await notificationService.requestPermission();
      setNotificationsEnabled(permission.granted);
    }
  };

  const handleBooking = async () => {
    if (!selectedTime || !selectedTableType) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const bookingRequest = {
        restaurantId,
        date: filters.date,
        time: selectedTime,
        partySize: filters.partySize,
        tableType: selectedTableType,
        specialRequests,
        customerInfo
      };

      // Calculate total amount
      const basePrice = 40; // Base price per person
      const totalAmount = paymentService.calculateBookingTotal(bookingRequest, basePrice);

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(bookingRequest, totalAmount);
      
      // Initialize Stripe
      const stripe = await paymentService.initializeStripe();
      if (!stripe) {
        throw new Error('Payment system not available');
      }

      // Confirm payment
      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret: paymentIntent.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success?booking_id=${bookingRequest.restaurantId}`,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Process booking
      const result = await bookTable(bookingRequest);
      
      if (result.success && 'bookingId' in result && result.bookingId) {
        // Send notifications
        if (notificationsEnabled) {
          await notificationService.sendBookingConfirmation(
            result.bookingId,
            restaurantName,
            filters.date,
            selectedTime
          );
          await notificationService.sendPaymentSuccess(
            result.bookingId,
            totalAmount
          );
        }

        onBookingSuccess?.(result.bookingId);
      } else {
        throw new Error('error' in result ? result.error : 'Booking failed');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      setPaymentError(error.message);
      
      // Send failure notification
      if (notificationsEnabled) {
        await notificationService.sendPaymentFailure('temp-booking-id', error.message);
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const getAvailableTimeSlots = () => {
    if (!availability) return [];
    return availability.timeSlots.filter(slot => slot.available);
  };

  const getAvailableTableTypes = (time: string) => {
    const slot = availability?.timeSlots.find(s => s.time === time);
    return slot?.tableTypes.filter(t => t.available) || [];
  };

  const calculateTotal = () => {
    if (!selectedTime || !selectedTableType) return 0;
    
    const basePrice = 40;
    const bookingRequest = {
      restaurantId,
      date: filters.date,
      time: selectedTime,
      partySize: filters.partySize,
      tableType: selectedTableType,
      specialRequests,
      customerInfo
    };
    
    return paymentService.calculateBookingTotal(bookingRequest, basePrice);
  };

  const formatPrice = (price: number) => {
    return paymentService.formatCurrency(price);
  };

  if (booking?.success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600 mb-4">
            Your table at {restaurantName} has been reserved successfully.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Confirmation Code:</strong> {booking.confirmationCode}</p>
              <p><strong>Date:</strong> {format(new Date(filters.date), 'EEEE, MMMM do, yyyy')}</p>
              <p><strong>Time:</strong> {selectedTime}</p>
              <p><strong>Party Size:</strong> {filters.partySize} people</p>
              <p><strong>Table Type:</strong> {selectedTableType}</p>
              <p><strong>Total Paid:</strong> {formatPrice(calculateTotal())}</p>
            </div>
          </div>
          {notificationsEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                📱 You'll receive notifications about your booking
              </p>
            </div>
          )}
          <Button onClick={() => window.location.reload()} className="w-full">
            Make Another Booking
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Book a Table at {restaurantName}
          </CardTitle>
          <CardDescription>
            Select your preferred date, time, and party size to see real-time availability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date and Party Size Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partySize">Party Size</Label>
              <Select
                value={filters.partySize.toString()}
                onValueChange={(value) => handlePartySizeChange(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select party size" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Input
              id="specialRequests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special dietary requirements or requests?"
            />
          </div>

          {/* Notifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-gray-600">Receive updates about your booking</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNotificationToggle}
                className="flex items-center gap-2"
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="w-4 h-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    Enable
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability Display */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading availability...</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshAvailability} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {availability && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Available Times
            </CardTitle>
            <CardDescription>
              Select your preferred time slot. Availability updates in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getAvailableTimeSlots().length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No availability for the selected date and party size.</p>
                <p className="text-sm text-gray-500 mt-2">Try selecting a different date or party size.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {getAvailableTimeSlots().map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    onClick={() => handleTimeSelect(slot.time)}
                    className="h-12 flex flex-col items-center justify-center"
                  >
                    <span className="font-semibold">{slot.time}</span>
                    {slot.price && (
                      <span className="text-xs text-gray-500">
                        from {formatPrice(slot.price)}
                      </span>
                    )}
                    {slot.estimatedWaitTime && (
                      <span className="text-xs text-orange-500">
                        ~{slot.estimatedWaitTime}min wait
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table Type Selection */}
      {selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle>Select Table Type</CardTitle>
            <CardDescription>
              Choose your preferred table type for {selectedTime}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAvailableTableTypes(selectedTime).map((tableType) => (
                <Button
                  key={tableType.type}
                  variant={selectedTableType === tableType.type ? "default" : "outline"}
                  onClick={() => handleTableTypeSelect(tableType.type)}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <span className="font-semibold capitalize">{tableType.type}</span>
                  <span className="text-sm text-gray-500">
                    Up to {tableType.capacity} people
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      {selectedTime && selectedTableType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Base Price ({filters.partySize} people)</span>
                <span>{formatPrice(40 * filters.partySize)}</span>
              </div>
              {filters.partySize > 4 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Additional guests ({(filters.partySize - 4)} × £10)</span>
                  <span>{formatPrice((filters.partySize - 4) * 10)}</span>
                </div>
              )}
              {selectedTableType === 'private' && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Private dining premium</span>
                  <span>{formatPrice(50)}</span>
                </div>
              )}
              {selectedTableType === 'outdoor' && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Outdoor seating premium</span>
                  <span>{formatPrice(20)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Service charge (12.5%)</span>
                <span>{formatPrice(calculateTotal() * 0.125)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT (20%)</span>
                <span>{formatPrice(calculateTotal() * 0.20)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Button */}
      {selectedTime && selectedTableType && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Ready to Book?</h4>
                <p className="text-sm text-gray-600">
                  {format(new Date(filters.date), 'EEEE, MMMM do, yyyy')} at {selectedTime}
                </p>
                <p className="text-sm text-gray-600">
                  {filters.partySize} people • {selectedTableType} table
                </p>
              </div>
              <Button
                onClick={handleBooking}
                disabled={bookingLoading || paymentLoading}
                className="px-8 py-3"
              >
                {(bookingLoading || paymentLoading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay & Book
                  </>
                )}
              </Button>
            </div>
            {(bookingError || paymentError) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{bookingError || paymentError}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Real-time Status */}
      {availability && (
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live availability • Last updated: {format(new Date(availability.lastUpdated), 'HH:mm:ss')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

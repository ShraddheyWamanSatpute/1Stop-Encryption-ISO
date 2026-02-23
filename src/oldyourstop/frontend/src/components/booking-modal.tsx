'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone?: string;
  };
  preFilledData?: {
    date: string;
    time: string;
    partySize: number;
  };
}

export function BookingModal({ isOpen, onClose, restaurant, preFilledData }: BookingModalProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    partySize: 2,
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const timeSlots = [
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
    "9:00 PM", "9:30 PM", "10:00 PM"
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isOpen && !loading && !user) {
      onClose();
      router.push('/auth?redirect=/restaurants/' + restaurant.id);
      toast.error('Please sign in to make a reservation');
    }
  }, [isOpen, loading, user, onClose, router, restaurant.id]);

  // Pre-fill user data and booking data when authenticated and modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        // Pre-fill booking data from sidebar
        date: preFilledData?.date || prev.date,
        time: preFilledData?.time || prev.time,
        partySize: preFilledData?.partySize || prev.partySize,
        // Pre-fill user data if authenticated
        name: user?.displayName || prev.name,
        email: user?.email || prev.email
      }));
    }
  }, [user, isOpen, preFilledData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save booking to localStorage for demo
      const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
      const newBooking = {
        id: Date.now().toString(),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        ...formData,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };
      
      bookings.push(newBooking);
      localStorage.setItem('bookings', JSON.stringify(bookings));
      
      setIsSuccess(true);
      toast.success('Reservation confirmed! You will receive a confirmation email shortly.');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          date: '',
          time: '',
          partySize: 2,
          name: '',
          email: '',
          phone: '',
          specialRequests: ''
        });
        setIsSuccess(false);
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to make reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Make a Reservation</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {isSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reservation Confirmed!</h3>
              <p className="text-gray-600 mb-4">
                Your table at {restaurant.name} has been reserved for {formData.date} at {formData.time}.
              </p>
              <p className="text-sm text-gray-500">
                You will receive a confirmation email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
                {restaurant.phone && (
                  <p className="text-sm text-gray-600">{restaurant.phone}</p>
                )}
              </div>

              {/* Booking Details Input */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Reservation Details</h4>
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="time">Time</Label>
                  <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="partySize">Party Size</Label>
                  <Select 
                    value={formData.partySize.toString()} 
                    onValueChange={(value) => handleInputChange('partySize', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select party size" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} {size === 1 ? 'person' : 'people'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  placeholder="Any dietary requirements, celebration details, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.date || !formData.time || !formData.name || !formData.email || !formData.phone}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Confirm Reservation
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Free cancellation up to 2 hours before your reservation time.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

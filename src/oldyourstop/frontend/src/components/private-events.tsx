'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, Clock, Users, MapPin, Phone, Mail, CreditCard, CheckCircle, AlertCircle, Loader2, Star, Utensils, Wine, Music, Camera, Gift } from 'lucide-react';
import { format } from 'date-fns';

interface PrivateEventPackage {
  id: string;
  name: string;
  description: string;
  minGuests: number;
  maxGuests: number;
  basePrice: number;
  pricePerPerson: number;
  duration: number; // in hours
  includes: string[];
  addOns: {
    id: string;
    name: string;
    price: number;
    description: string;
  }[];
  availableDays: string[];
  availableTimes: string[];
  images: string[];
  popular: boolean;
}

interface PrivateEventBooking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  packageId: string;
  packageName: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  selectedAddOns: string[];
  createdAt: string;
  confirmationCode: string;
}

interface PrivateEventsProps {
  restaurantId: string;
  restaurantName: string;
}

export function PrivateEvents({ restaurantId, restaurantName }: PrivateEventsProps) {
  const { user } = useAuth();
  const [packages, setPackages] = useState<PrivateEventPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PrivateEventPackage | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock packages data - in production, this would come from an API
  useEffect(() => {
    const mockPackages: PrivateEventPackage[] = [
      {
        id: 'package-1',
        name: 'Intimate Dinner',
        description: 'Perfect for small gatherings, anniversaries, or business dinners. Includes 3-course meal and wine pairing.',
        minGuests: 8,
        maxGuests: 20,
        basePrice: 200,
        pricePerPerson: 85,
        duration: 3,
        includes: [
          'Private dining room',
          '3-course dinner',
          'Wine pairing',
          'Dedicated server',
          'Custom menu design'
        ],
        addOns: [
          { id: 'addon-1', name: 'Live Music', price: 300, description: 'Acoustic guitarist for 2 hours' },
          { id: 'addon-2', name: 'Photography', price: 200, description: 'Professional photographer for 2 hours' },
          { id: 'addon-3', name: 'Flower Arrangements', price: 150, description: 'Custom floral centerpieces' },
          { id: 'addon-4', name: 'Champagne Toast', price: 100, description: 'Premium champagne for all guests' }
        ],
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableTimes: ['18:00', '18:30', '19:00', '19:30', '20:00'],
        images: ['https://source.unsplash.com/random/800x600?private-dining&sig=1'],
        popular: true
      },
      {
        id: 'package-2',
        name: 'Corporate Event',
        description: 'Ideal for business meetings, team building, or client entertainment. Includes AV equipment and presentation setup.',
        minGuests: 15,
        maxGuests: 50,
        basePrice: 500,
        pricePerPerson: 65,
        duration: 4,
        includes: [
          'Private function room',
          'AV equipment',
          'Presentation setup',
          'Coffee breaks',
          'Lunch or dinner',
          'Event coordinator'
        ],
        addOns: [
          { id: 'addon-5', name: 'AV Upgrade', price: 200, description: 'Professional sound system and lighting' },
          { id: 'addon-6', name: 'Catering Upgrade', price: 300, description: 'Premium menu options' },
          { id: 'addon-7', name: 'Team Building Activities', price: 400, description: 'Guided team building exercises' }
        ],
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTimes: ['09:00', '10:00', '11:00', '12:00', '13:00', '18:00', '19:00'],
        images: ['https://source.unsplash.com/random/800x600?corporate-event&sig=2'],
        popular: false
      },
      {
        id: 'package-3',
        name: 'Celebration Party',
        description: 'Perfect for birthdays, anniversaries, or special celebrations. Includes entertainment and custom decorations.',
        minGuests: 20,
        maxGuests: 100,
        basePrice: 800,
        pricePerPerson: 75,
        duration: 5,
        includes: [
          'Private event space',
          'Custom decorations',
          'Entertainment',
          'Cocktail reception',
          '3-course dinner',
          'Dance floor',
          'Event coordinator'
        ],
        addOns: [
          { id: 'addon-8', name: 'DJ Service', price: 500, description: 'Professional DJ for 4 hours' },
          { id: 'addon-9', name: 'Open Bar', price: 800, description: 'Unlimited drinks for 3 hours' },
          { id: 'addon-10', name: 'Photo Booth', price: 300, description: 'Photo booth with props and instant prints' },
          { id: 'addon-11', name: 'Custom Cake', price: 200, description: 'Custom designed celebration cake' }
        ],
        availableDays: ['Friday', 'Saturday', 'Sunday'],
        availableTimes: ['18:00', '19:00', '20:00'],
        images: ['https://source.unsplash.com/random/800x600?celebration-party&sig=3'],
        popular: true
      }
    ];

    setPackages(mockPackages);
    setLoading(false);
  }, [restaurantId]);

  const handleSelectPackage = (pkg: PrivateEventPackage) => {
    setSelectedPackage(pkg);
    setShowBookingForm(true);
  };

  const handleBookingSubmit = async (bookingData: Partial<PrivateEventBooking>) => {
    // In production, this would make an API call
    console.log('Private event booking submitted:', bookingData);
    setShowBookingForm(false);
    setSelectedPackage(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading private event packages...</p>
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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Private Events</h2>
        <p className="text-gray-600 text-lg">
          Host your special occasion at {restaurantName}
        </p>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Package Image */}
                {pkg.images.length > 0 && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={pkg.images[0]}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Package Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">{pkg.name}</h3>
                    {pkg.popular && (
                      <Badge className="bg-blue-100 text-blue-800">Popular</Badge>
                    )}
                  </div>

                  <p className="text-gray-600">{pkg.description}</p>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="font-semibold">£{pkg.basePrice}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Per Person:</span>
                      <span className="font-semibold">£{pkg.pricePerPerson}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Duration:</span>
                      <span className="font-semibold">{pkg.duration} hours</span>
                    </div>
                  </div>

                  {/* Guest Capacity */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{pkg.minGuests} - {pkg.maxGuests} guests</span>
                  </div>

                  {/* What's Included */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">What's Included:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {pkg.includes.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                      {pkg.includes.length > 3 && (
                        <li className="text-xs text-gray-500">
                          +{pkg.includes.length - 3} more items
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleSelectPackage(pkg)}
                    className="w-full"
                  >
                    Book This Package
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && selectedPackage && (
        <PrivateEventBookingForm
          package={selectedPackage}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          onSubmit={handleBookingSubmit}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
}

interface PrivateEventBookingFormProps {
  package: PrivateEventPackage;
  restaurantId: string;
  restaurantName: string;
  onSubmit: (bookingData: Partial<PrivateEventBooking>) => void;
  onClose: () => void;
}

function PrivateEventBookingForm({ package: pkg, restaurantId, restaurantName, onSubmit, onClose }: PrivateEventBookingFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    eventDate: '',
    eventTime: '',
    guestCount: pkg.minGuests,
    specialRequests: '',
    contactInfo: {
      name: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      company: ''
    },
    selectedAddOns: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const totalPrice = pkg.basePrice + (pkg.pricePerPerson * formData.guestCount) +
      pkg.addOns
        .filter(addon => formData.selectedAddOns.includes(addon.id))
        .reduce((sum, addon) => sum + addon.price, 0);

    const bookingData: Partial<PrivateEventBooking> = {
      restaurantId,
      restaurantName,
      packageId: pkg.id,
      packageName: pkg.name,
      eventDate: formData.eventDate,
      eventTime: formData.eventTime,
      guestCount: formData.guestCount,
      totalPrice,
      specialRequests: formData.specialRequests,
      contactInfo: formData.contactInfo,
      selectedAddOns: formData.selectedAddOns,
      status: 'pending',
      confirmationCode: `PEV-${Date.now()}`
    };

    await onSubmit(bookingData);
    setLoading(false);
  };

  const handleAddOnToggle = (addonId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAddOns: prev.selectedAddOns.includes(addonId)
        ? prev.selectedAddOns.filter(id => id !== addonId)
        : [...prev.selectedAddOns, addonId]
    }));
  };

  const calculateTotal = () => {
    const baseTotal = pkg.basePrice + (pkg.pricePerPerson * formData.guestCount);
    const addOnTotal = pkg.addOns
      .filter(addon => formData.selectedAddOns.includes(addon.id))
      .reduce((sum, addon) => sum + addon.price, 0);
    return baseTotal + addOnTotal;
  };

  return (
    <Card className="fixed inset-0 z-50 m-4 max-h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Book {pkg.name}
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardTitle>
        <CardDescription>
          {restaurantName} • {pkg.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event Date</label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event Time</label>
              <Select
                value={formData.eventTime}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eventTime: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {pkg.availableTimes.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Number of Guests</label>
            <Input
              type="number"
              min={pkg.minGuests}
              max={pkg.maxGuests}
              value={formData.guestCount}
              onChange={(e) => setFormData(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum {pkg.minGuests}, maximum {pkg.maxGuests} guests
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name</label>
                <Input
                  value={formData.contactInfo.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, name: e.target.value }
                  }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                <Input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, email: e.target.value }
                  }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Phone</label>
                <Input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, phone: e.target.value }
                  }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Company (Optional)</label>
                <Input
                  value={formData.contactInfo.company}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, company: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Add-ons (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pkg.addOns.map((addon) => (
                <div key={addon.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={addon.id}
                    checked={formData.selectedAddOns.includes(addon.id)}
                    onCheckedChange={() => handleAddOnToggle(addon.id)}
                  />
                  <div className="flex-1">
                    <label htmlFor={addon.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                      {addon.name} - £{addon.price}
                    </label>
                    <p className="text-xs text-gray-600">{addon.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Special Requests</label>
            <Textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Any special dietary requirements, decorations, or other requests..."
              rows={3}
            />
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Pricing Summary</h3>
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span>£{pkg.basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Per Person ({formData.guestCount} guests):</span>
              <span>£{pkg.pricePerPerson * formData.guestCount}</span>
            </div>
            {formData.selectedAddOns.length > 0 && (
              <div className="flex justify-between">
                <span>Add-ons:</span>
                <span>£{pkg.addOns
                  .filter(addon => formData.selectedAddOns.includes(addon.id))
                  .reduce((sum, addon) => sum + addon.price, 0)
                }</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>£{calculateTotal()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Booking Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

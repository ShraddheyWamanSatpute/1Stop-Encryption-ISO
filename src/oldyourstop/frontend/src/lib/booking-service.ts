'use client';

import { toast } from 'sonner';

interface GuestInfo {
  name: string;
  email: string;
  phone?: string;
  specialRequests?: string;
}

interface Booking {
  bookingId: string;
  restaurantId: string;
  restaurantName: string;
  dateTime: string;
  partySize: number;
  guestInfo: GuestInfo;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata: {
    bookingId: string;
    restaurantId: string;
    guestEmail: string;
  };
}

interface PaymentConfirmationResult {
  success: boolean;
  transactionId?: string;
  status: string;
  error?: string;
}

export class BookingService {
  static async createBooking(
    restaurantId: string,
    restaurantName: string,
    dateTime: string,
    partySize: number,
    guestInfo: GuestInfo
  ): Promise<Booking> {
    console.log('Client-side BookingService: Creating booking', { restaurantId, dateTime, partySize, guestInfo });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newBooking: Booking = {
      bookingId: `mock-bk-${Date.now()}`,
      restaurantId,
      restaurantName,
      dateTime,
      partySize,
      guestInfo,
      status: 'confirmed', // Directly confirm for client-side mock
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for persistence in static site
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    toast.success('Booking created successfully (client-side mock).');
    return newBooking;
  }

  static async getBookings(): Promise<Booking[]> {
    console.log('Client-side BookingService: Fetching bookings');
    await new Promise(resolve => setTimeout(resolve, 500));
    return JSON.parse(localStorage.getItem('bookings') || '[]');
  }

  static async getBookingById(bookingId: string): Promise<Booking | undefined> {
    console.log('Client-side BookingService: Fetching booking by ID', bookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    const bookings: Booking[] = JSON.parse(localStorage.getItem('bookings') || '[]');
    return bookings.find(b => b.bookingId === bookingId);
  }
}

export class PaymentService {
  static async createPaymentIntent(amount: number, currency: string, metadata: Record<string, any>): Promise<PaymentIntent> {
    console.log('Client-side PaymentService: Creating payment intent', { amount, currency, metadata });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const client_secret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 9)}`;
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      id: paymentIntentId,
      client_secret: client_secret,
      amount: amount,
      currency: currency,
      status: 'requires_payment_method',
      metadata: metadata,
    };
  }

  static async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentConfirmationResult> {
    console.log('Client-side PaymentService: Confirming payment', { paymentIntentId, paymentMethodId });
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isSuccess = Math.random() > 0.1; // 90% success rate

    if (isSuccess) {
      return {
        success: true,
        transactionId: `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status: 'succeeded',
      };
    } else {
      return {
        success: false,
        error: 'Payment failed - insufficient funds or card declined',
        status: 'failed',
      };
    }
  }
}

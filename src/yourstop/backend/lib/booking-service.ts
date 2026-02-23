import { createLogger } from './logger';

const logger = createLogger();

export interface Booking {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  userId: string;
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookingFilters {
  page: number;
  limit: number;
  status?: string;
}

class BookingService {
  private bookings: Map<string, Booking> = new Map();

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const booking: Booking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      restaurantName: 'Sample Restaurant', // This should be fetched from restaurant service
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.bookings.set(booking.id, booking);
    
    logger.info('Booking created', { 
      bookingId: booking.id, 
      userId: data.userId, 
      restaurantId: data.restaurantId 
    });

    return booking;
  }

  async getBookingById(id: string, userId: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    
    if (!booking || booking.userId !== userId) {
      return null;
    }

    return booking;
  }

  async getUserBookings(userId: string, filters: BookingFilters): Promise<Booking[]> {
    const allBookings = Array.from(this.bookings.values())
      .filter(booking => booking.userId === userId);

    let filteredBookings = allBookings;

    if (filters.status) {
      filteredBookings = filteredBookings.filter(booking => booking.status === filters.status);
    }

    // Sort by creation date (newest first)
    filteredBookings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;

    return filteredBookings.slice(startIndex, endIndex);
  }

  async updateBooking(id: string, userId: string, updateData: Partial<Booking>): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    
    if (!booking || booking.userId !== userId) {
      return null;
    }

    const updatedBooking = {
      ...booking,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    this.bookings.set(id, updatedBooking);
    
    logger.info('Booking updated', { bookingId: id, userId });
    return updatedBooking;
  }

  async cancelBooking(id: string, userId: string): Promise<boolean> {
    const booking = this.bookings.get(id);
    
    if (!booking || booking.userId !== userId) {
      return false;
    }

    const updatedBooking = {
      ...booking,
      status: 'cancelled' as const,
      updatedAt: new Date().toISOString()
    };

    this.bookings.set(id, updatedBooking);
    
    logger.info('Booking cancelled', { bookingId: id, userId });
    return true;
  }

  async confirmBooking(id: string, paymentIntentId: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    
    if (!booking) {
      return null;
    }

    const updatedBooking = {
      ...booking,
      status: 'confirmed' as const,
      updatedAt: new Date().toISOString()
    };

    this.bookings.set(id, updatedBooking);
    
    logger.info('Booking confirmed', { bookingId: id, paymentIntentId });
    return updatedBooking;
  }
}

export const bookingService = new BookingService();

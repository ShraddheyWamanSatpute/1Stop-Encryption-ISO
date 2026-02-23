// Customer booking service using separate customer Firebase database
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { customerDb, CUSTOMER_COLLECTIONS } from './firebase-customer';

export interface CustomerBooking {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  tableType?: 'standard' | 'booth' | 'bar' | 'outdoor' | 'private';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  specialRequests?: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  totalAmount?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
}

export interface CreateBookingData {
  userId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  date: string;
  time: string;
  partySize: number;
  tableType?: 'standard' | 'booth' | 'bar' | 'outdoor' | 'private';
  specialRequests?: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookingFilters {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show' | 'all';
  dateFrom?: string;
  dateTo?: string;
  restaurantId?: string;
}

class CustomerBookingService {
  private generateConfirmationCode(): string {
    const prefix = 'BMT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async createBooking(data: CreateBookingData): Promise<CustomerBooking> {
    try {
      const confirmationCode = this.generateConfirmationCode();
      const now = new Date().toISOString();

      const bookingData = {
        userId: data.userId,
        restaurantId: data.restaurantId,
        restaurantName: data.restaurantName,
        restaurantAddress: data.restaurantAddress || '',
        restaurantPhone: data.restaurantPhone || '',
        date: data.date,
        time: data.time,
        partySize: data.partySize,
        tableType: data.tableType || 'standard',
        status: 'pending' as const,
        specialRequests: data.specialRequests || '',
        contactInfo: data.contactInfo,
        confirmationCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        paymentStatus: 'pending' as const,
      };

      const docRef = await addDoc(
        collection(customerDb, CUSTOMER_COLLECTIONS.bookings),
        bookingData
      );

      const booking: CustomerBooking = {
        id: docRef.id,
        ...bookingData,
        createdAt: now,
        updatedAt: now,
      };

      return booking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  async getBookingById(bookingId: string, userId: string): Promise<CustomerBooking | null> {
    try {
      const docRef = doc(customerDb, CUSTOMER_COLLECTIONS.bookings, bookingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Verify the booking belongs to the user
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to booking');
      }

      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        cancelledAt: data.cancelledAt?.toDate?.()?.toISOString() || data.cancelledAt,
      } as CustomerBooking;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  async getUserBookings(
    userId: string, 
    filters?: BookingFilters
  ): Promise<CustomerBooking[]> {
    try {
      const bookingsRef = collection(customerDb, CUSTOMER_COLLECTIONS.bookings);
      let q = query(
        bookingsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        orderBy('time', 'desc')
      );

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        q = query(q, where('status', '==', filters.status));
      }

      // Apply date range filters
      if (filters?.dateFrom) {
        q = query(q, where('date', '>=', filters.dateFrom));
      }
      if (filters?.dateTo) {
        q = query(q, where('date', '<=', filters.dateTo));
      }

      // Apply restaurant filter
      if (filters?.restaurantId) {
        q = query(q, where('restaurantId', '==', filters.restaurantId));
      }

      const querySnapshot = await getDocs(q);
      const bookings: CustomerBooking[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
          cancelledAt: data.cancelledAt?.toDate?.()?.toISOString() || data.cancelledAt,
        } as CustomerBooking);
      });

      return bookings;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  async updateBooking(
    bookingId: string, 
    userId: string, 
    updates: Partial<CustomerBooking>
  ): Promise<CustomerBooking> {
    try {
      const docRef = doc(customerDb, CUSTOMER_COLLECTIONS.bookings, bookingId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Booking not found');
      }

      const data = docSnap.data();
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to booking');
      }

      // Prepare update data
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.userId;
      delete updateData.createdAt;
      delete updateData.confirmationCode;

      // If cancelling, add cancellation timestamp
      if (updates.status === 'cancelled' && data.status !== 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
      }

      await updateDoc(docRef, updateData);

      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt || new Date().toISOString(),
        updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt || new Date().toISOString(),
        cancelledAt: updatedData.cancelledAt?.toDate?.()?.toISOString() || updatedData.cancelledAt,
      } as CustomerBooking;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  async cancelBooking(
    bookingId: string, 
    userId: string, 
    reason?: string
  ): Promise<boolean> {
    try {
      await this.updateBooking(bookingId, userId, {
        status: 'cancelled',
        cancellationReason: reason,
      });
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  }

  async confirmBooking(bookingId: string, userId: string): Promise<CustomerBooking> {
    try {
      return await this.updateBooking(bookingId, userId, {
        status: 'confirmed',
      });
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  async getUpcomingBookings(userId: string): Promise<CustomerBooking[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await this.getUserBookings(userId, {
        status: 'all',
        dateFrom: today,
      });
    } catch (error) {
      console.error('Error fetching upcoming bookings:', error);
      throw error;
    }
  }

  async getPastBookings(userId: string): Promise<CustomerBooking[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookings = await this.getUserBookings(userId, {
        status: 'all',
        dateTo: today,
      });
      
      // Filter out future bookings that might have been included
      return bookings.filter(booking => {
        const bookingDate = new Date(`${booking.date}T${booking.time}`);
        return bookingDate < new Date();
      });
    } catch (error) {
      console.error('Error fetching past bookings:', error);
      throw error;
    }
  }

  // Real-time subscription to user bookings
  subscribeToUserBookings(
    userId: string,
    callback: (bookings: CustomerBooking[]) => void,
    filters?: BookingFilters
  ): Unsubscribe {
    const bookingsRef = collection(customerDb, CUSTOMER_COLLECTIONS.bookings);
    let q = query(
      bookingsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      orderBy('time', 'desc')
    );

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.dateFrom) {
      q = query(q, where('date', '>=', filters.dateFrom));
    }
    if (filters?.dateTo) {
      q = query(q, where('date', '<=', filters.dateTo));
    }
    if (filters?.restaurantId) {
      q = query(q, where('restaurantId', '==', filters.restaurantId));
    }

    return onSnapshot(q, (querySnapshot) => {
      const bookings: CustomerBooking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
          cancelledAt: data.cancelledAt?.toDate?.()?.toISOString() || data.cancelledAt,
        } as CustomerBooking);
      });
      callback(bookings);
    }, (error) => {
      console.error('Error in real-time booking subscription:', error);
    });
  }

  // Real-time subscription to single booking
  subscribeToBooking(
    bookingId: string,
    userId: string,
    callback: (booking: CustomerBooking | null) => void
  ): Unsubscribe {
    const bookingRef = doc(customerDb, CUSTOMER_COLLECTIONS.bookings, bookingId);
    
    return onSnapshot(bookingRef, (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }

      const data = docSnap.data();
      if (data.userId !== userId) {
        console.warn('Unauthorized access to booking');
        callback(null);
        return;
      }

      const booking: CustomerBooking = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || new Date().toISOString(),
        cancelledAt: data.cancelledAt?.toDate?.()?.toISOString() || data.cancelledAt,
      } as CustomerBooking;

      callback(booking);
    }, (error) => {
      console.error('Error in real-time booking subscription:', error);
      callback(null);
    });
  }
}

export const customerBookingService = new CustomerBookingService();


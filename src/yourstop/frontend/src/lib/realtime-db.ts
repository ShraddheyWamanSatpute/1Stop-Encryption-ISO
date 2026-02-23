import { 
  ref, 
  set, 
  get, 
  push, 
  update, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  serverTimestamp 
} from 'firebase/database';
import { rtdb } from './firebase';

// Types for Realtime Database
export interface RealtimeBooking {
  id: string;
  restaurantId: string;
  userId: string;
  partySize: number;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealtimeNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'promotion' | 'system' | 'reminder';
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface RestaurantAvailability {
  restaurantId: string;
  date: string;
  timeSlots: {
    [time: string]: {
      available: boolean;
      capacity: number;
      booked: number;
    };
  };
}

// Booking operations
export class RealtimeBookingService {
  private static basePath = 'bookings';

  // Create a new booking
  static async createBooking(booking: Omit<RealtimeBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const bookingRef = push(ref(rtdb, this.basePath));
      const bookingId = bookingRef.key!;
      
      const newBooking: RealtimeBooking = {
        ...booking,
        id: bookingId,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await set(bookingRef, newBooking);
      return bookingId;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  // Get booking by ID
  static async getBooking(bookingId: string): Promise<RealtimeBooking | null> {
    try {
      const bookingRef = ref(rtdb, `${this.basePath}/${bookingId}`);
      const snapshot = await get(bookingRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting booking:', error);
      throw error;
    }
  }

  // Get user's bookings
  static async getUserBookings(userId: string): Promise<RealtimeBooking[]> {
    try {
      const bookingsRef = ref(rtdb, this.basePath);
      const userBookingsQuery = query(
        bookingsRef,
        orderByChild('userId'),
        equalTo(userId)
      );
      
      const snapshot = await get(userBookingsQuery);
      const bookings: RealtimeBooking[] = [];
      
      snapshot.forEach((childSnapshot) => {
        bookings.push(childSnapshot.val());
      });
      
      return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user bookings:', error);
      throw error;
    }
  }

  // Update booking status
  static async updateBookingStatus(bookingId: string, status: RealtimeBooking['status']): Promise<void> {
    try {
      const bookingRef = ref(rtdb, `${this.basePath}/${bookingId}`);
      await update(bookingRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Listen to user's bookings in real-time
  static listenToUserBookings(
    userId: string, 
    callback: (bookings: RealtimeBooking[]) => void
  ): () => void {
    const bookingsRef = ref(rtdb, this.basePath);
    const userBookingsQuery = query(
      bookingsRef,
      orderByChild('userId'),
      equalTo(userId)
    );

    const unsubscribe = onValue(userBookingsQuery, (snapshot) => {
      const bookings: RealtimeBooking[] = [];
      snapshot.forEach((childSnapshot) => {
        bookings.push(childSnapshot.val());
      });
      callback(bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => off(userBookingsQuery, 'value', unsubscribe);
  }
}

// Notification operations
export class RealtimeNotificationService {
  private static basePath = 'notifications';

  // Create a notification
  static async createNotification(notification: Omit<RealtimeNotification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationRef = push(ref(rtdb, `${this.basePath}/${notification.userId}`));
      const notificationId = notificationRef.key!;
      
      const newNotification: RealtimeNotification = {
        ...notification,
        id: notificationId,
        createdAt: serverTimestamp() as any,
      };

      await set(notificationRef, newNotification);
      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get user's notifications
  static async getUserNotifications(userId: string): Promise<RealtimeNotification[]> {
    try {
      const notificationsRef = ref(rtdb, `${this.basePath}/${userId}`);
      const snapshot = await get(notificationsRef);
      
      const notifications: RealtimeNotification[] = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push(childSnapshot.val());
      });
      
      return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(rtdb, `${this.basePath}/${userId}/${notificationId}`);
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Listen to user's notifications in real-time
  static listenToUserNotifications(
    userId: string, 
    callback: (notifications: RealtimeNotification[]) => void
  ): () => void {
    const notificationsRef = ref(rtdb, `${this.basePath}/${userId}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const notifications: RealtimeNotification[] = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push(childSnapshot.val());
      });
      callback(notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });

    return () => off(notificationsRef, 'value', unsubscribe);
  }
}

// Restaurant availability operations
export class RestaurantAvailabilityService {
  private static basePath = 'restaurants';

  // Update restaurant availability
  static async updateAvailability(
    restaurantId: string, 
    date: string, 
    availability: RestaurantAvailability['timeSlots']
  ): Promise<void> {
    try {
      const availabilityRef = ref(rtdb, `${this.basePath}/${restaurantId}/availability/${date}`);
      await set(availabilityRef, {
        timeSlots: availability,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  // Get restaurant availability for a date
  static async getAvailability(restaurantId: string, date: string): Promise<RestaurantAvailability | null> {
    try {
      const availabilityRef = ref(rtdb, `${this.basePath}/${restaurantId}/availability/${date}`);
      const snapshot = await get(availabilityRef);
      
      if (snapshot.exists()) {
        return {
          restaurantId,
          date,
          timeSlots: snapshot.val().timeSlots
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting availability:', error);
      throw error;
    }
  }

  // Listen to restaurant availability in real-time
  static listenToAvailability(
    restaurantId: string, 
    date: string,
    callback: (availability: RestaurantAvailability | null) => void
  ): () => void {
    const availabilityRef = ref(rtdb, `${this.basePath}/${restaurantId}/availability/${date}`);

    const unsubscribe = onValue(availabilityRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({
          restaurantId,
          date,
          timeSlots: snapshot.val().timeSlots
        });
      } else {
        callback(null);
      }
    });

    return () => off(availabilityRef, 'value', unsubscribe);
  }
}

// Utility functions
export const RealtimeDBUtils = {
  // Generate time slots for a restaurant
  generateTimeSlots: (openingTime: string, closingTime: string, slotDuration: number = 30): { [time: string]: { available: boolean; capacity: number; booked: number } } => {
    const slots: { [time: string]: { available: boolean; capacity: number; booked: number } } = {};
    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    for (let minutes = openMinutes; minutes < closeMinutes; minutes += slotDuration) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      slots[timeString] = {
        available: true,
        capacity: 20, // Default capacity
        booked: 0
      };
    }
    
    return slots;
  },

  // Check if a time slot is available
  isTimeSlotAvailable: (availability: RestaurantAvailability, time: string): boolean => {
    const slot = availability.timeSlots[time];
    return slot ? slot.available && slot.booked < slot.capacity : false;
  },

  // Book a time slot
  bookTimeSlot: async (restaurantId: string, date: string, time: string): Promise<boolean> => {
    try {
      const availability = await RestaurantAvailabilityService.getAvailability(restaurantId, date);
      if (!availability) return false;

      const slot = availability.timeSlots[time];
      if (!slot || !slot.available || slot.booked >= slot.capacity) return false;

      // Update the slot
      const updatedSlots = { ...availability.timeSlots };
      updatedSlots[time] = {
        ...slot,
        booked: slot.booked + 1,
        available: slot.booked + 1 < slot.capacity
      };

      await RestaurantAvailabilityService.updateAvailability(restaurantId, date, updatedSlots);
      return true;
    } catch (error) {
      console.error('Error booking time slot:', error);
      return false;
    }
  }
};

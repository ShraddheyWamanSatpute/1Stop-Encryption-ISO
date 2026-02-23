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
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  getToken, 
  onMessage 
} from 'firebase/messaging';
import { db, storage, messaging } from './firebase';
import type { Restaurant, Booking, Review } from './types';

// Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  RESTAURANTS: 'restaurants',
  BOOKINGS: 'bookings',
  FAVORITES: 'favorites',
  REVIEWS: 'reviews',
  PAYMENT_METHODS: 'paymentMethods',
  AGE_VERIFICATIONS: 'ageVerifications',
  NOTIFICATIONS: 'notifications'
} as const;

// User Service
export class UserService {
  static async createUser(userId: string, userData: any) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  static async getUser(userId: string) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  }

  static async updateUser(userId: string, userData: any) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
  }
}

// Restaurant Service
export class RestaurantService {
  static async getRestaurants(filters?: {
    cuisine?: string;
    priceRange?: string;
    minRating?: number;
  }) {
    let q = query(collection(db, COLLECTIONS.RESTAURANTS));
    
    if (filters?.cuisine) {
      q = query(q, where('cuisine', '==', filters.cuisine));
    }
    if (filters?.priceRange) {
      q = query(q, where('pricing', '==', filters.priceRange));
    }
    if (filters?.minRating) {
      q = query(q, where('rating', '>=', filters.minRating));
    }
    
    q = query(q, orderBy('rating', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getRestaurant(restaurantId: string) {
    const restaurantRef = doc(db, COLLECTIONS.RESTAURANTS, restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    return restaurantSnap.exists() ? { id: restaurantSnap.id, ...restaurantSnap.data() } : null;
  }
}

// Booking Service
export class BookingService {
  static async createBooking(bookingData: Omit<Booking, 'bookingId'>) {
    const bookingRef = await addDoc(collection(db, COLLECTIONS.BOOKINGS), {
      ...bookingData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return bookingRef.id;
  }

  static async getUserBookings(userId: string) {
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('userId', '==', userId),
      orderBy('dateTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getRestaurantBookings(restaurantId: string, date: string) {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('restaurantId', '==', restaurantId),
      where('dateTime', '>=', Timestamp.fromDate(startOfDay)),
      where('dateTime', '<=', Timestamp.fromDate(endOfDay))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async updateBooking(bookingId: string, updates: Partial<Booking>) {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    await updateDoc(bookingRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async cancelBooking(bookingId: string) {
    const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

// Favorites Service
export class FavoritesService {
  static async addFavorite(userId: string, restaurantId: string) {
    const favoriteRef = await addDoc(collection(db, COLLECTIONS.FAVORITES), {
      userId,
      restaurantId,
      createdAt: serverTimestamp()
    });
    return favoriteRef.id;
  }

  static async removeFavorite(userId: string, restaurantId: string) {
    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId),
      where('restaurantId', '==', restaurantId)
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  static async getUserFavorites(userId: string) {
    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async isFavorite(userId: string, restaurantId: string) {
    const q = query(
      collection(db, COLLECTIONS.FAVORITES),
      where('userId', '==', userId),
      where('restaurantId', '==', restaurantId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
}

// Review Service
export class ReviewService {
  static async createReview(reviewData: Omit<Review, 'id'>) {
    const reviewRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
      ...reviewData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return reviewRef.id;
  }

  static async getRestaurantReviews(restaurantId: string) {
    const q = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

// Storage Service
export class StorageService {
  static async uploadFile(
    path: string, 
    file: File, 
    metadata?: any
  ): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
  }

  static async deleteFile(path: string) {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }

  static async uploadProfilePicture(userId: string, file: File) {
    const path = `users/${userId}/profile/${file.name}`;
    return await this.uploadFile(path, file);
  }

  static async uploadVerificationDocument(userId: string, file: File, type: string) {
    const path = `users/${userId}/verification/${type}_${file.name}`;
    return await this.uploadFile(path, file);
  }
}

// Notification Service
export class NotificationService {
  static async requestPermission() {
    if (!messaging) return null;
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY' // You'll need to generate this
        });
        return token;
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
    }
    return null;
  }

  static onMessage(callback: (payload: any) => void) {
    if (!messaging) return;
    
    onMessage(messaging, callback);
  }

  static async createNotification(userId: string, notification: {
    title: string;
    body: string;
    data?: any;
  }) {
    const notificationRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
      userId,
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
    return notificationRef.id;
  }

  static async getUserNotifications(userId: string) {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async markNotificationAsRead(notificationId: string) {
    const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  }
}

// Real-time listeners
export class RealtimeService {
  static subscribeToUserBookings(userId: string, callback: (bookings: any[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('userId', '==', userId),
      orderBy('dateTime', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(bookings);
    });
  }

  static subscribeToRestaurantBookings(restaurantId: string, callback: (bookings: any[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.BOOKINGS),
      where('restaurantId', '==', restaurantId),
      orderBy('dateTime', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(bookings);
    });
  }

  static subscribeToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(notifications);
    });
  }
}
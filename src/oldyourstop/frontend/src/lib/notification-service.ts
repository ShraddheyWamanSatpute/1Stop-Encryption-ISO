// Real-time notification service for booking confirmations
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    bookingId?: string;
    restaurantId?: string;
    type?: 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'payment_success' | 'payment_failed';
    [key: string]: any;
  };
}

export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class NotificationService {
  private messaging: any = null;
  private vapidKey = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY;
  private isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  constructor() {
    if (this.isSupported && this.vapidKey) {
      this.initializeFirebase();
    }
  }

  private async initializeFirebase() {
    try {
      // Initialize Firebase
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);

      // Listen for messages
      onMessage(this.messaging, (payload) => {
        this.handleMessage(payload);
      });
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return { granted: false, denied: false, default: true };
    }

    try {
      const permission = await Notification.requestPermission();
      return {
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default',
      };
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return { granted: false, denied: true, default: false };
    }
  }

  // Get FCM token
  async getToken(): Promise<string | null> {
    if (!this.messaging || !this.vapidKey) {
      console.warn('Firebase messaging not initialized or VAPID key not configured');
      return null;
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Send notification to user
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this environment');
      return false;
    }

    try {
      // Check if we have permission
      const permission = await this.requestPermission();
      if (!permission.granted) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Create notification
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        data: payload.data,
        tag: payload.data?.bookingId || 'booking-notification',
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate to booking details if available
        if (payload.data?.bookingId) {
          window.location.href = `/bookings/${payload.data.bookingId}`;
        }
      };

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Send booking confirmation notification
  async sendBookingConfirmation(bookingId: string, restaurantName: string, date: string, time: string): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Booking Confirmed! 🎉',
      body: `Your table at ${restaurantName} is confirmed for ${date} at ${time}`,
      icon: '/favicon.ico',
      data: {
        bookingId,
        type: 'booking_confirmed',
        restaurantName,
        date,
        time,
      },
    };

    return await this.sendNotification(payload);
  }

  // Send booking cancellation notification
  async sendBookingCancellation(bookingId: string, restaurantName: string, date: string, time: string): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Booking Cancelled',
      body: `Your booking at ${restaurantName} for ${date} at ${time} has been cancelled`,
      icon: '/favicon.ico',
      data: {
        bookingId,
        type: 'booking_cancelled',
        restaurantName,
        date,
        time,
      },
    };

    return await this.sendNotification(payload);
  }

  // Send payment success notification
  async sendPaymentSuccess(bookingId: string, amount: number, currency: string = 'GBP'): Promise<boolean> {
    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);

    const payload: NotificationPayload = {
      title: 'Payment Successful! 💳',
      body: `Your payment of ${formattedAmount} has been processed successfully`,
      icon: '/favicon.ico',
      data: {
        bookingId,
        type: 'payment_success',
        amount,
        currency,
      },
    };

    return await this.sendNotification(payload);
  }

  // Send payment failure notification
  async sendPaymentFailure(bookingId: string, error: string): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Payment Failed ❌',
      body: `Your payment could not be processed: ${error}`,
      icon: '/favicon.ico',
      data: {
        bookingId,
        type: 'payment_failed',
        error,
      },
    };

    return await this.sendNotification(payload);
  }

  // Send booking reminder notification
  async sendBookingReminder(bookingId: string, restaurantName: string, date: string, time: string, hoursBefore: number = 24): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Booking Reminder ⏰',
      body: `Don't forget! Your table at ${restaurantName} is tomorrow at ${time}`,
      icon: '/favicon.ico',
      data: {
        bookingId,
        type: 'booking_reminder',
        restaurantName,
        date,
        time,
        hoursBefore,
      },
    };

    return await this.sendNotification(payload);
  }

  // Handle incoming messages
  private handleMessage(payload: any) {
    console.log('Message received:', payload);
    
    // Show notification
    if (payload.notification) {
      this.sendNotification({
        title: payload.notification.title,
        body: payload.notification.body,
        icon: payload.notification.icon,
        data: payload.data,
      });
    }
  }

  // Subscribe to topic
  async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          topic,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    if (!this.isSupported) return false;
    
    const permission = await this.requestPermission();
    return permission.granted;
  }
}

export const notificationService = new NotificationService();

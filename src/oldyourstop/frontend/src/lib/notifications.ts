import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebase';

// Request permission for notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Get FCM token for push notifications
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging) {
      console.log('Messaging not supported');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'your-vapid-key-here'
    });

    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    console.log('Messaging not supported');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    callback(payload);
  });
}

// Show notification
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
}

// Subscribe to topic
export async function subscribeToTopic(topic: string): Promise<boolean> {
  try {
    const token = await getFCMToken();
    if (!token) return false;

    const response = await fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`, {
      method: 'POST',
      headers: {
        'Authorization': `key=${process.env.NEXT_PUBLIC_FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return false;
  }
}

// Unsubscribe from topic
export async function unsubscribeFromTopic(topic: string): Promise<boolean> {
  try {
    const token = await getFCMToken();
    if (!token) return false;

    const response = await fetch(`https://iid.googleapis.com/iid/v1/${token}/rel/topics/${topic}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `key=${process.env.NEXT_PUBLIC_FIREBASE_SERVER_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return false;
  }
}

// Initialize notifications
export async function initializeNotifications(): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    const token = await getFCMToken();
    if (!token) return false;

    // Subscribe to general notifications
    await subscribeToTopic('general');
    
    // Listen for foreground messages
    onForegroundMessage((payload) => {
      const notification = payload.notification;
      if (notification) {
        showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/favicon.ico'
        });
      }
    });

    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
}

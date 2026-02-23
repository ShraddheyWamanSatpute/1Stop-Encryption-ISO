import { ref, push, get, set, update, remove } from "firebase/database"
import { db } from "../services/Firebase"
import { Notification, NotificationFilter, NotificationSettings } from "../interfaces/Notifications"

// Create a new notification
export const createNotificationInDb = async (basePath: string, notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const newNotificationRef = push(notificationsRef)
    
    const notificationData: Notification = {
      ...notification,
      id: newNotificationRef.key!,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    await set(newNotificationRef, notificationData)
    return newNotificationRef.key!
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Get all notifications for a user
export const fetchNotificationsFromDb = async (basePath: string, userId: string, limit?: number): Promise<Notification[]> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val()
      let notifications: Notification[] = Object.values(notificationsData)
        .filter((notification): notification is Notification => (notification as Notification).userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp)
      
      if (limit) {
        notifications = notifications.slice(0, limit)
      }
      
      return notifications
    }
    return []
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

// Get notifications with filters
export const fetchFilteredNotificationsFromDb = async (basePath: string, filter: NotificationFilter): Promise<Notification[]> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (!snapshot.exists()) {
      return []
    }
    
    const notificationsData = snapshot.val()
    let notifications: Notification[] = Object.values(notificationsData)
    
    // Apply filters
    if (filter.userId) {
      notifications = notifications.filter(n => n.userId === filter.userId)
    }
    
    if (filter.companyId) {
      notifications = notifications.filter(n => n.companyId === filter.companyId)
    }
    
    if (filter.siteId) {
      notifications = notifications.filter(n => n.siteId === filter.siteId)
    }
    
    if (filter.subsiteId) {
      notifications = notifications.filter(n => n.subsiteId === filter.subsiteId)
    }
    
    if (filter.type && filter.type.length > 0) {
      notifications = notifications.filter(n => filter.type!.includes(n.type))
    }
    
    if (filter.action && filter.action.length > 0) {
      notifications = notifications.filter(n => filter.action!.includes(n.action))
    }
    
    if (filter.priority && filter.priority.length > 0) {
      notifications = notifications.filter(n => filter.priority!.includes(n.priority))
    }
    
    if (filter.category && filter.category.length > 0) {
      notifications = notifications.filter(n => filter.category!.includes(n.category))
    }
    
    if (filter.read !== undefined) {
      notifications = notifications.filter(n => n.read === filter.read)
    }
    
    if (filter.dateFrom) {
      notifications = notifications.filter(n => n.timestamp >= filter.dateFrom!)
    }
    
    if (filter.dateTo) {
      notifications = notifications.filter(n => n.timestamp <= filter.dateTo!)
    }
    
    return notifications.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error("Error fetching filtered notifications:", error)
    throw error
  }
}

// Mark notification as read
export const markNotificationAsReadInDb = async (basePath: string, notificationId: string): Promise<void> => {
  try {
    const notificationRef = ref(db, `${basePath}/notifications/${notificationId}`)
    await update(notificationRef, {
      read: true,
      updatedAt: Date.now()
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// Mark all notifications as read for a user
export const markAllNotificationsAsReadInDb = async (basePath: string, userId: string): Promise<void> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val()
      const updates: Record<string, unknown> = {}
      
      const entries = notificationsData as Record<string, Notification>
      Object.entries(entries).forEach(([id, notification]) => {
        if (notification.userId === userId && !notification.read) {
          updates[`${id}/read`] = true
          updates[`${id}/updatedAt`] = Date.now()
        }
      })
      
      if (Object.keys(updates).length > 0) {
        await update(notificationsRef, updates)
      }
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// Delete notification
export const deleteNotificationFromDb = async (basePath: string, notificationId: string): Promise<void> => {
  try {
    const notificationRef = ref(db, `${basePath}/notifications/${notificationId}`)
    await remove(notificationRef)
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

// Delete all notifications for a user
export const deleteAllNotificationsFromDb = async (basePath: string, userId: string): Promise<void> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val() as Record<string, Notification>
      const updates: Record<string, unknown> = {}
      
      Object.entries(notificationsData).forEach(([id, notification]) => {
        if (notification.userId === userId) {
          updates[id] = null
        }
      })
      
      if (Object.keys(updates).length > 0) {
        await update(notificationsRef, updates)
      }
    }
  } catch (error) {
    console.error("Error deleting all notifications:", error)
    throw error
  }
}

// Get notification settings for a user
export const fetchNotificationSettingsFromDb = async (basePath: string, userId: string): Promise<NotificationSettings | null> => {
  try {
    const settingsRef = ref(db, `${basePath}/notificationSettings/${userId}`)
    const snapshot = await get(settingsRef)
    
    if (snapshot.exists()) {
      return snapshot.val()
    }
    return null
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    throw error
  }
}

// Save notification settings for a user
export const saveNotificationSettingsToDb = async (basePath: string, settings: NotificationSettings): Promise<void> => {
  try {
    const settingsRef = ref(db, `${basePath}/notificationSettings/${settings.userId}`)
    await set(settingsRef, settings)
  } catch (error) {
    console.error("Error saving notification settings:", error)
    throw error
  }
}

// Mark notification as read for specific user
export const markNotificationAsReadForUserInDb = async (basePath: string, notificationId: string, userId: string): Promise<void> => {
  try {
    const readByRef = ref(db, `${basePath}/notifications/${notificationId}/readBy/${userId}`)
    await set(readByRef, {
      readAt: Date.now(),
      seen: true
    })
  } catch (error) {
    console.error("Error marking notification as read for user:", error)
    throw error
  }
}

// Get unread count for specific user
export const getUnreadCountForUserFromDb = async (basePath: string, userId: string): Promise<number> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val()
      let unreadCount = 0
      
      Object.values(notificationsData).forEach((notification: any) => {
        // Check if user hasn't read this notification
        if (!notification.readBy || !notification.readBy[userId] || !notification.readBy[userId].seen) {
          unreadCount++
        }
      })
      
      return unreadCount
    }
    return 0
  } catch (error) {
    console.error("Error getting unread count for user:", error)
    throw error
  }
}

// Get user notification history with read status
export const getUserNotificationHistoryFromDb = async (basePath: string, userId: string, filter?: NotificationFilter): Promise<Notification[]> => {
  try {
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val() as Record<string, Notification>
      type NotifWithReadBy = Notification & { readBy?: Record<string, { seen?: boolean; readAt?: number }> }
      let notifications = Object.entries(notificationsData).map(([id, data]) => {
        const d = data as NotifWithReadBy
        return {
          ...(data as Omit<Notification, 'id'>),
          id,
          isReadByUser: d.readBy?.[userId]?.seen ?? false,
          readAtByUser: d.readBy?.[userId]?.readAt ?? null
        }
      })
      
      // Apply filters if provided
      if (filter) {
        if (filter.read !== undefined) {
          notifications = notifications.filter(n => n.isReadByUser === filter.read)
        }
        if (filter.type != null && filter.type.length > 0) {
          notifications = notifications.filter(n => filter.type!.includes(n.type))
        }
        if (filter.dateFrom != null) {
          notifications = notifications.filter(n => n.timestamp >= filter.dateFrom!)
        }
        if (filter.dateTo != null) {
          notifications = notifications.filter(n => n.timestamp <= filter.dateTo!)
        }
      }
      
      // Sort by timestamp descending
      notifications.sort((a, b) => b.timestamp - a.timestamp)
      
      return notifications
    }
    return []
  } catch (error) {
    console.error("Error getting user notification history:", error)
    throw error
  }
}

// Get unread notification count for a user (legacy function)
export const getUnreadNotificationCountFromDb = async (basePath: string, userId: string): Promise<number> => {
  return await getUnreadCountForUserFromDb(basePath, userId)
}

// Clean up old notifications (older than specified days)
export const cleanupOldNotificationsFromDb = async (basePath: string, daysOld: number = 30): Promise<void> => {
  try {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
    const notificationsRef = ref(db, `${basePath}/notifications`)
    const snapshot = await get(notificationsRef)
    
    if (snapshot.exists()) {
      const notificationsData = snapshot.val() as Record<string, Notification>
      const updates: Record<string, unknown> = {}
      
      Object.entries(notificationsData).forEach(([id, notification]) => {
        if (notification.timestamp < cutoffTime) {
          updates[id] = null
        }
      })
      
      if (Object.keys(updates).length > 0) {
        await update(notificationsRef, updates)
      }
    }
  } catch (error) {
    console.error("Error cleaning up old notifications:", error)
    throw error
  }
}

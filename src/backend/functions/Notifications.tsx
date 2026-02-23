import {
  createNotificationInDb,
  fetchNotificationsFromDb,
  fetchFilteredNotificationsFromDb,
  markNotificationAsReadInDb,
  markAllNotificationsAsReadInDb,
  deleteNotificationFromDb,
  deleteAllNotificationsFromDb,
  fetchNotificationSettingsFromDb,
  saveNotificationSettingsToDb,
  getUnreadNotificationCountFromDb,
  cleanupOldNotificationsFromDb,
  markNotificationAsReadForUserInDb,
  getUnreadCountForUserFromDb,
  getUserNotificationHistoryFromDb
} from "../rtdatabase/Notifications"
import {
  Notification,
  NotificationFilter,
  NotificationSettings,
  NotificationType,
  NotificationAction,
  NotificationPriority,
  NotificationCategory,
  NotificationDetails,
  NotificationStats
} from "../interfaces/Notifications"

// Helper function to get base path for notifications
const getNotificationBasePath = (companyId: string, siteId?: string, subsiteId?: string): string => {
  if (subsiteId && siteId) {
    return `companies/${companyId}/sites/${siteId}/subsites/${subsiteId}`
  } else if (siteId) {
    return `companies/${companyId}/sites/${siteId}`
  } else {
    return `companies/${companyId}`
  }
}

// Create a notification
export const createNotification = async (
  companyId: string,
  userId: string,
  type: NotificationType,
  action: NotificationAction,
  title: string,
  message: string,
  options?: {
    siteId?: string
    subsiteId?: string
    priority?: NotificationPriority
    category?: NotificationCategory
    details?: NotificationDetails
    metadata?: Record<string, any>
  }
): Promise<string> => {
  try {
    const basePath = getNotificationBasePath(companyId, options?.siteId, options?.subsiteId)
    
    const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
      timestamp: Date.now(),
      userId,
      companyId,
      type,
      action,
      title,
      message,
      read: false,
      priority: options?.priority || 'medium',
      category: options?.category || 'info',
      // Only include optional fields if they have values (not undefined)
      ...(options?.siteId && { siteId: options.siteId }),
      ...(options?.subsiteId && { subsiteId: options.subsiteId }),
      ...(options?.details && { details: options.details }),
      ...(options?.metadata && { metadata: options.metadata })
    }
    
    return await createNotificationInDb(basePath, notification)
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Get notifications for a user
export const getNotifications = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string,
  limit?: number
): Promise<Notification[]> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    return await fetchNotificationsFromDb(basePath, userId, limit)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

// Get filtered notifications
export const getFilteredNotifications = async (
  companyId: string,
  filter: NotificationFilter,
  siteId?: string,
  subsiteId?: string
): Promise<Notification[]> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    return await fetchFilteredNotificationsFromDb(basePath, filter)
  } catch (error) {
    console.error("Error fetching filtered notifications:", error)
    throw error
  }
}

// Mark notification as read
export const markNotificationAsRead = async (
  companyId: string,
  notificationId: string,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await markNotificationAsReadInDb(basePath, notificationId)
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// Mark notification as read for specific user
export const markNotificationAsReadForUser = async (
  companyId: string,
  notificationId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await markNotificationAsReadForUserInDb(basePath, notificationId, userId)
  } catch (error) {
    console.error("Error marking notification as read for user:", error)
    throw error
  }
}

// Get unread count for specific user
export const getUnreadCountForUser = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<number> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    return await getUnreadCountForUserFromDb(basePath, userId)
  } catch (error) {
    console.error("Error getting unread count for user:", error)
    return 0
  }
}

// Get user notification history with read status
export const getUserNotificationHistory = async (
  companyId: string,
  userId: string,
  filter?: NotificationFilter,
  siteId?: string,
  subsiteId?: string
): Promise<Notification[]> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    return await getUserNotificationHistoryFromDb(basePath, userId, filter)
  } catch (error) {
    console.error("Error getting user notification history:", error)
    throw error
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await markAllNotificationsAsReadInDb(basePath, userId)
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

// Delete notification
export const deleteNotification = async (
  companyId: string,
  notificationId: string,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await deleteNotificationFromDb(basePath, notificationId)
  } catch (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
}

// Delete all notifications for a user
export const deleteAllNotifications = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await deleteAllNotificationsFromDb(basePath, userId)
  } catch (error) {
    console.error("Error deleting all notifications:", error)
    throw error
  }
}

// Get notification settings
export const getNotificationSettings = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<NotificationSettings | null> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    return await fetchNotificationSettingsFromDb(basePath, userId)
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    throw error
  }
}

// Save notification settings
export const saveNotificationSettings = async (
  companyId: string,
  settings: NotificationSettings,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await saveNotificationSettingsToDb(basePath, settings)
  } catch (error) {
    console.error("Error saving notification settings:", error)
    throw error
  }
}

// Get unread notification count
export const getUnreadNotificationCount = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<number> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    return await getUnreadNotificationCountFromDb(basePath, userId)
  } catch (error) {
    console.error("Error getting unread notification count:", error)
    throw error
  }
}

// Get notification statistics
export const getNotificationStats = async (
  companyId: string,
  userId: string,
  siteId?: string,
  subsiteId?: string
): Promise<NotificationStats> => {
  try {
    const notifications = await getNotifications(companyId, userId, siteId, subsiteId)
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byCategory: {} as Record<NotificationCategory, number>
    }
    
    // Initialize counters
    const types: NotificationType[] = ['company', 'site', 'subsite', 'checklist', 'stock', 'finance', 'hr', 'booking', 'messenger', 'user', 'system']
    const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']
    const categories: NotificationCategory[] = ['info', 'warning', 'error', 'success', 'alert']
    
    types.forEach(type => stats.byType[type] = 0)
    priorities.forEach(priority => stats.byPriority[priority] = 0)
    categories.forEach(category => stats.byCategory[category] = 0)
    
    // Count notifications
    notifications.forEach(notification => {
      stats.byType[notification.type]++
      stats.byPriority[notification.priority]++
      stats.byCategory[notification.category]++
    })
    
    return stats
  } catch (error) {
    console.error("Error getting notification stats:", error)
    throw error
  }
}

// Clean up old notifications
export const cleanupOldNotifications = async (
  companyId: string,
  daysOld: number = 30,
  siteId?: string,
  subsiteId?: string
): Promise<void> => {
  try {
    const basePath = getNotificationBasePath(companyId, siteId, subsiteId)
    await cleanupOldNotificationsFromDb(basePath, daysOld)
  } catch (error) {
    console.error("Error cleaning up old notifications:", error)
    throw error
  }
}

// Helper functions for creating specific types of notifications

export const createCompanyNotification = async (
  companyId: string,
  userId: string,
  action: NotificationAction,
  entityName: string,
  details?: NotificationDetails
): Promise<string> => {
  const actionMessages = {
    created: `Company "${entityName}" was created`,
    updated: `Company "${entityName}" was updated`,
    deleted: `Company "${entityName}" was deleted`,
    invited: `You were invited to join "${entityName}"`,
    joined: `User joined "${entityName}"`,
    left: `User left "${entityName}"`
  }
  
  return await createNotification(
    companyId,
    userId,
    'company',
    action,
    'Company Update',
    actionMessages[action as keyof typeof actionMessages] || `Company action: ${action}`,
    {
      category: action === 'deleted' ? 'warning' : 'info',
      details
    }
  )
}

export const createSiteNotification = async (
  companyId: string,
  siteId: string,
  userId: string,
  action: NotificationAction,
  entityName: string,
  details?: NotificationDetails
): Promise<string> => {
  const actionMessages = {
    created: `Site "${entityName}" was created`,
    updated: `Site "${entityName}" was updated`,
    deleted: `Site "${entityName}" was deleted`,
    assigned: `You were assigned to site "${entityName}"`
  }
  
  return await createNotification(
    companyId,
    userId,
    'site',
    action,
    'Site Update',
    actionMessages[action as keyof typeof actionMessages] || `Site action: ${action}`,
    {
      siteId,
      category: action === 'deleted' ? 'warning' : 'info',
      details
    }
  )
}

export const createChecklistNotification = async (
  companyId: string,
  userId: string,
  action: NotificationAction,
  checklistName: string,
  options?: {
    siteId?: string
    subsiteId?: string
    priority?: NotificationPriority
    details?: NotificationDetails
  }
): Promise<string> => {
  const actionMessages = {
    created: `Checklist "${checklistName}" was created`,
    updated: `Checklist "${checklistName}" was updated`,
    completed: `Checklist "${checklistName}" was completed`,
    assigned: `You were assigned checklist "${checklistName}"`,
    overdue: `Checklist "${checklistName}" is overdue`
  }
  
  return await createNotification(
    companyId,
    userId,
    'checklist',
    action,
    'Checklist Update',
    actionMessages[action as keyof typeof actionMessages] || `Checklist action: ${action}`,
    {
      siteId: options?.siteId,
      subsiteId: options?.subsiteId,
      priority: options?.priority || (action === 'overdue' ? 'high' : 'medium'),
      category: action === 'overdue' ? 'warning' : action === 'completed' ? 'success' : 'info',
      details: options?.details
    }
  )
}

export const createStockNotification = async (
  companyId: string,
  siteId: string,
  userId: string,
  action: NotificationAction,
  itemName: string,
  options?: {
    subsiteId?: string
    priority?: NotificationPriority
    details?: NotificationDetails
  }
): Promise<string> => {
  const actionMessages = {
    low_stock: `${itemName} is running low on stock`,
    created: `Stock item "${itemName}" was added`,
    updated: `Stock item "${itemName}" was updated`,
    deleted: `Stock item "${itemName}" was removed`
  }
  
  return await createNotification(
    companyId,
    userId,
    'stock',
    action,
    'Stock Update',
    actionMessages[action as keyof typeof actionMessages] || `Stock action: ${action}`,
    {
      siteId,
      subsiteId: options?.subsiteId,
      priority: options?.priority || (action === 'low_stock' ? 'high' : 'medium'),
      category: action === 'low_stock' ? 'warning' : 'info',
      details: options?.details
    }
  )
}

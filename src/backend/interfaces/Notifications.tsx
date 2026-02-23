export interface Notification {
  id: string
  timestamp: number
  userId: string
  companyId: string
  siteId?: string
  subsiteId?: string
  type: NotificationType
  action: NotificationAction
  title: string
  message: string
  details?: NotificationDetails
  read: boolean
  priority: NotificationPriority
  category: NotificationCategory
  metadata?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export type NotificationType = 
  | 'company' 
  | 'site' 
  | 'subsite' 
  | 'checklist' 
  | 'stock' 
  | 'finance' 
  | 'hr' 
  | 'booking' 
  | 'messenger' 
  | 'user' 
  | 'system'

export type NotificationAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'completed' 
  | 'assigned' 
  | 'approved' 
  | 'rejected' 
  | 'invited' 
  | 'joined' 
  | 'left' 
  | 'low_stock' 
  | 'overdue' 
  | 'reminder'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type NotificationCategory = 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success' 
  | 'alert'

export interface NotificationDetails {
  entityId?: string
  entityName?: string
  oldValue?: unknown
  newValue?: unknown
  changes?: Record<string, { from: unknown; to: unknown }>
  additionalInfo?: Record<string, unknown>
}

export interface NotificationFilter {
  type?: NotificationType[]
  action?: NotificationAction[]
  priority?: NotificationPriority[]
  category?: NotificationCategory[]
  read?: boolean
  dateFrom?: number
  dateTo?: number
  userId?: string
  companyId?: string
  siteId?: string
  subsiteId?: string
}

export interface NotificationSettings {
  userId: string
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
  notificationTypes: {
    [key in NotificationType]: boolean
  }
  notificationActions: {
    [key in NotificationAction]: boolean
  }
  quietHours?: {
    enabled: boolean
    startTime: string // HH:MM format
    endTime: string // HH:MM format
  }
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
  byCategory: Record<NotificationCategory, number>
}

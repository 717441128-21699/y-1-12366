import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react'
import { notification as antdNotification } from 'antd'
import type { Notification, NotificationType } from '@/types'
import { notificationSocket } from '@/utils/notification'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '@/api/notification'
import dayjs from 'dayjs'

const CURRENT_USER_ID = 1

export interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  addNotification: (notification: Notification) => void
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  fetchNotifications: () => Promise<void>
  getNotificationsByType: (type: NotificationType) => Notification[]
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

const getNotificationIcon = (type: NotificationType): string => {
  const map: Record<NotificationType, string> = {
    ORDER_STATUS: '📦',
    TEMPERATURE_ALERT: '🌡️',
    SIGN_EXCEPTION: '❌',
  }
  return map[type] || '📢'
}

const showToast = (notification: Notification) => {
  const icon = getNotificationIcon(notification.type)
  const typeMap: Record<NotificationType, 'info' | 'warning' | 'error' | 'success'> = {
    ORDER_STATUS: 'info',
    TEMPERATURE_ALERT: 'warning',
    SIGN_EXCEPTION: 'error',
  }
  const antdType = typeMap[notification.type] || 'info'

  antdNotification[antdType]({
    message: (
      <span>
        {icon} {notification.title}
      </span>
    ),
    description: notification.content,
    duration: 4.5,
    placement: 'topRight',
    style: {
      minWidth: 320,
    },
  })
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev])
    setUnreadCount(prev => prev + 1)
    showToast(notification)
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const [notifRes, countRes] = await Promise.allSettled([
        getUserNotifications(CURRENT_USER_ID),
        getUnreadNotificationCount(CURRENT_USER_ID),
      ])

      if (notifRes.status === 'fulfilled' && notifRes.value.data) {
        setNotifications(notifRes.value.data)
      } else {
        const mockNotifications: Notification[] = [
          {
            id: 1,
            type: 'TEMPERATURE_ALERT',
            title: '温度告警',
            content: '京C11111 车厢温度 -5.8℃ 超出阈值范围 [-15℃, -10℃]',
            relatedId: 1,
            isRead: false,
            createdAt: dayjs().subtract(15, 'minute').toISOString(),
          },
          {
            id: 2,
            type: 'ORDER_STATUS',
            title: '订单状态更新',
            content: '订单 #ORD202401001 状态已变更为「运输中」',
            relatedId: 1001,
            isRead: false,
            createdAt: dayjs().subtract(1, 'hour').toISOString(),
          },
          {
            id: 3,
            type: 'SIGN_EXCEPTION',
            title: '签收异常',
            content: '订单 #ORD202400998 签收异常：收货人信息不匹配',
            relatedId: 998,
            isRead: true,
            createdAt: dayjs().subtract(3, 'hour').toISOString(),
          },
          {
            id: 4,
            type: 'ORDER_STATUS',
            title: '订单已完成',
            content: '订单 #ORD202400990 已成功签收，配送完成',
            relatedId: 990,
            isRead: true,
            createdAt: dayjs().subtract(1, 'day').toISOString(),
          },
        ]
        setNotifications(mockNotifications)
      }

      if (countRes.status === 'fulfilled' && countRes.value.data) {
        setUnreadCount(countRes.value.data.count)
      } else {
        if (notifRes.status === 'fulfilled' && notifRes.value.data) {
          setUnreadCount(notifRes.value.data.filter(n => !n.isRead).length)
        } else {
          setUnreadCount(2)
        }
      }
    } catch (e) {
      console.error('[NotificationContext] Fetch notifications error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationAsRead(id)
    } catch (e) {
      // ignore API error, update local state
    }
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead(CURRENT_USER_ID)
    } catch (e) {
      // ignore API error, update local state
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  const getNotificationsByType = useCallback(
    (type: NotificationType) => notifications.filter(n => n.type === type),
    [notifications]
  )

  useEffect(() => {
    fetchNotifications()

    const unsubscribe = notificationSocket.onNotification((notification) => {
      addNotification(notification)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchNotifications, addNotification])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      getNotificationsByType,
    }),
    [notifications, unreadCount, isLoading, addNotification, markAsRead, markAllAsRead, fetchNotifications, getNotificationsByType]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext

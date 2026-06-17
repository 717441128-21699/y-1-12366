import request from '@/utils/request'
import type { Notification, PaginationResponse } from '@/types'

export const getUserNotifications = (userId: number) => {
  return request.get<Notification[]>(`/notifications/user/${userId}`)
}

export const getNotificationList = (params: {
  userId: number
  page?: number
  pageSize?: number
  isRead?: boolean
  type?: string
}) => {
  return request.get<PaginationResponse<Notification>>('/notifications', { params })
}

export const markNotificationAsRead = (id: number) => {
  return request.put(`/notifications/${id}/read`)
}

export const markAllNotificationsAsRead = (userId: number) => {
  return request.put(`/notifications/user/${userId}/read-all`)
}

export const getUnreadNotificationCount = (userId: number) => {
  return request.get<{ count: number }>(`/notifications/user/${userId}/unread-count`)
}

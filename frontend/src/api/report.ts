import request from '@/utils/request'
import type { DashboardStats, OrderStatusDistribution, RecentAlarm, ReportStats, ReportSearchParams, RouteOption } from '@/types'

export const getDashboardStats = () => {
  return request.get<DashboardStats>('/dashboard/stats')
}

export const getOrderStatusDistribution = () => {
  return request.get<OrderStatusDistribution[]>('/dashboard/order-status-distribution')
}

export const getTemperatureTrend = () => {
  return request.get<{ time: string; temperature: number }[]>('/dashboard/temperature-trend')
}

export const getRecentAlarms = () => {
  return request.get<RecentAlarm[]>('/dashboard/recent-alarms')
}

export const getReportStats = (params: ReportSearchParams) => {
  return request.get<ReportStats>('/reports/stats', { params })
}

export const getRouteOptions = () => {
  return request.get<RouteOption[]>('/reports/routes')
}

export const exportReport = (params: ReportSearchParams) => {
  return request.get<Blob>('/reports/export', { params, responseType: 'blob' })
}

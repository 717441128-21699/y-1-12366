import request from '@/utils/request'
import type { DashboardStats, OrderStatusDistribution, RecentAlarm, ReportStats, ReportSearchParams, RouteOption, PaginationResponse } from '@/types'

export interface ReportItem {
  id: number
  reportDate: string
  line?: string
  lineName?: string
  onTimeRate: number
  temperaturePassRate: number
  vehicleUtilization: number
  totalOrders: number
  totalDistance: number
  averageDeliveryTime: number
  createdAt: string
}

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

export const getReportList = (params: ReportSearchParams & { page?: number; pageSize?: number }) => {
  return request.get<PaginationResponse<ReportItem>>('/reports', { params })
}

export const getRouteOptions = () => {
  return request.get<RouteOption[]>('/reports/routes')
}

export const exportReport = (params: ReportSearchParams) => {
  return request.get<Blob>('/reports/export', { params, responseType: 'blob' })
}

export const generateReport = (params: ReportSearchParams) => {
  return request.post<ReportItem>('/reports/generate', params)
}

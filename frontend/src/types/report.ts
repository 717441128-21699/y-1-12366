export interface DashboardStats {
  todayOrders: number
  vehiclesInTransit: number
  pendingAlarms: number
  vehicleUtilization: number
}

export interface OrderStatusDistribution {
  status: string
  count: number
  value: number
}

export interface TemperatureTrendData {
  time: string
  temperature: number
  humidity?: number
}

export interface RecentAlarm {
  id: number
  vehiclePlate: string
  level: string
  message: string
  time: string
}

export interface ReportStats {
  onTimeRate: number
  temperaturePassRate: number
  vehicleUtilization: number
  totalOrders: number
  totalDistance: number
  averageDeliveryTime: number
}

export interface ReportSearchParams {
  startDate: string
  endDate: string
  route?: string
  vehicleId?: number
}

export interface RouteOption {
  id: number
  name: string
  code: string
}

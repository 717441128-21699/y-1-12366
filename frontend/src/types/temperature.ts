import type { Sensor } from './vehicle'

export type AlarmLevel = 'info' | 'warning' | 'danger'

export interface AlarmRecord {
  id: number
  vehicleId: number
  vehiclePlate: string
  orderId?: number
  orderNo?: string
  sensorNo: string
  sensorName: string
  alarmType: string
  level: AlarmLevel
  message: string
  currentValue?: number
  thresholdMin?: number
  thresholdMax?: number
  timestamp: string
  handled: boolean
  handledBy?: string
  handledAt?: string
  handleRemark?: string
}

export interface TemperatureData {
  timestamp: string
  value: number
}

export interface VehicleTemperature {
  vehicleId: number
  plateNo: string
  sensorNo: string
  currentTemperature: number
  minTemperature: number
  maxTemperature: number
  status: 'normal' | 'warning' | 'alarm'
  lastUpdate: string
  sensors?: Sensor[]
}

export interface SensorReading {
  id: number
  sensorId: number
  value: number
  timestamp: string
}

export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'

export interface TemperatureAlert {
  id: number
  orderId: number
  vehicleId: number
  sensorId: number
  alertLevel: AlertLevel
  currentTemp: number
  thresholdMin: number
  thresholdMax: number
  description: string
  isResolved: boolean
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolveRemark?: string
}

export type NotificationType = 'ORDER_STATUS' | 'TEMPERATURE_ALERT' | 'SIGN_EXCEPTION'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  content: string
  relatedId?: number
  isRead: boolean
  createdAt: string
}

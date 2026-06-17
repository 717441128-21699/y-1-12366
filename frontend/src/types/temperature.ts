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
}

import type { TemperatureZone } from './order'

export type VehicleStatus = 'IDLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'DISABLED'
export type InsulationLevel = 'A' | 'B' | 'C'

export interface Sensor {
  id: number
  sensorNo: string
  name: string
  type: 'temperature' | 'humidity'
  currentValue?: number
  unit: string
  status: 'normal' | 'warning' | 'alarm'
  lastUpdate?: string
}

export interface Vehicle {
  id: number
  plateNo: string
  model: string
  temperatureZone: TemperatureZone
  loadCapacity: number
  status: VehicleStatus
  insulationLevel: InsulationLevel
  currentLocation: string
  driverId?: number
  driverName?: string
  driverPhone?: string
  temperatureMin?: number
  temperatureMax?: number
  sensors?: Sensor[]
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface VehicleSearchParams {
  plateNo?: string
  status?: VehicleStatus
  temperatureZone?: TemperatureZone
  page?: number
  pageSize?: number
}

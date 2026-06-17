import request from '@/utils/request'
import type { VehicleTemperature, AlarmRecord, TemperatureData, AlarmLevel, PaginationResponse, SensorReading, Sensor, TemperatureAlert } from '@/types'

export const getVehicleTemperatures = () => {
  return request.get<VehicleTemperature[]>('/temperature/current')
}

export const getTemperatureHistory = (vehicleId: number, startTime?: string, endTime?: string) => {
  return request.get<TemperatureData[]>('/temperature/history', {
    params: { vehicleId, startTime, endTime },
  })
}

export const getSensorReadings = (sensorId: number, params?: { startTime?: string; endTime?: string }) => {
  return request.get<SensorReading[]>(`/temperature/sensor/${sensorId}/readings`, { params })
}

export const getVehicleSensors = (vehicleId: number) => {
  return request.get<Sensor[]>(`/temperature/vehicle/${vehicleId}/sensors`)
}

export const getOrderAlerts = (orderId: number) => {
  return request.get<TemperatureAlert[]>(`/temperature/order/${orderId}/alerts`)
}

export const uploadTemperatureData = (data: { sensorId: number; value: number; timestamp?: string }) => {
  return request.post('/temperature/upload', data)
}

export const getAlarmList = (params: {
  level?: AlarmLevel
  handled?: boolean
  vehicleId?: number
  page?: number
  pageSize?: number
}) => {
  return request.get<PaginationResponse<AlarmRecord>>('/alarms', { params })
}

export const getAlertsByVehicle = (vehicleId: number) => {
  return request.get<TemperatureAlert[]>(`/temperature/vehicle/${vehicleId}/alerts`)
}

export const resolveAlert = (id: number, remark?: string) => {
  return request.put(`/temperature/alerts/${id}/resolve`, { remark })
}

export const handleAlarm = (id: number, remark: string) => {
  return request.put(`/alarms/${id}/handle`, { remark })
}

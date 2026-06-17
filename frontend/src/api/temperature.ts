import request from '@/utils/request'
import type { VehicleTemperature, AlarmRecord, TemperatureData, AlarmLevel, PaginationResponse } from '@/types'

export const getVehicleTemperatures = () => {
  return request.get<VehicleTemperature[]>('/temperature/current')
}

export const getTemperatureHistory = (vehicleId: number, startTime?: string, endTime?: string) => {
  return request.get<TemperatureData[]>('/temperature/history', {
    params: { vehicleId, startTime, endTime },
  })
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

export const handleAlarm = (id: number, remark: string) => {
  return request.put(`/alarms/${id}/handle`, { remark })
}

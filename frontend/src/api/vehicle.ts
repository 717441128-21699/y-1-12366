import request from '@/utils/request'
import type { Vehicle, VehicleSearchParams, PaginationResponse, Sensor } from '@/types'

export const getVehicleList = (params: VehicleSearchParams) => {
  return request.get<PaginationResponse<Vehicle>>('/vehicles', { params })
}

export const getVehicleById = (id: number) => {
  return request.get<Vehicle>(`/vehicles/${id}`)
}

export const createVehicle = (data: Partial<Vehicle>) => {
  return request.post<Vehicle>('/vehicles', data)
}

export const updateVehicle = (id: number, data: Partial<Vehicle>) => {
  return request.put<Vehicle>(`/vehicles/${id}`, data)
}

export const deleteVehicle = (id: number) => {
  return request.delete(`/vehicles/${id}`)
}

export const getVehicleSensors = (vehicleId: number) => {
  return request.get<Sensor[]>(`/vehicles/${vehicleId}/sensors`)
}

import request from '@/utils/request'
import type { Order, OrderSearchParams, PaginationResponse } from '@/types'

export const getOrderList = (params: OrderSearchParams) => {
  return request.get<PaginationResponse<Order>>('/orders', { params })
}

export const getOrderById = (id: number) => {
  return request.get<Order>(`/orders/${id}`)
}

export const createOrder = (data: Partial<Order>) => {
  return request.post<Order>('/orders', data)
}

export const updateOrder = (id: number, data: Partial<Order>) => {
  return request.patch<Order>(`/orders/${id}`, data)
}

export const deleteOrder = (id: number) => {
  return request.delete(`/orders/${id}`)
}

export const assignVehicle = (data: { orderId: number; vehicleId?: number }) => {
  return request.post<{ vehicleId: number; plateNo: string }>('/orders/assign-vehicle', data)
}

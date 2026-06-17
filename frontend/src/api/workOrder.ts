import request from '@/utils/request'
import type { WorkOrder, WorkOrderSearchParams, PaginationResponse, WorkOrderLog } from '@/types'

interface UserItem {
  id: number
  name: string
}

export const getWorkOrderList = (params: WorkOrderSearchParams) => {
  return request.get<PaginationResponse<WorkOrder>>('/work-orders', { params })
}

export const getWorkOrderById = (id: number) => {
  return request.get<WorkOrder>(`/work-orders/${id}`)
}

export const getWorkOrderLogs = (id: number) => {
  return request.get<WorkOrderLog[]>(`/work-orders/${id}/logs`)
}

export const createWorkOrder = (data: Partial<WorkOrder>) => {
  return request.post<WorkOrder>('/work-orders', data)
}

export const updateWorkOrder = (id: number, data: Partial<WorkOrder>) => {
  return request.patch<WorkOrder>(`/work-orders/${id}`, data)
}

export const processWorkOrder = (id: number, data: { remark?: string; status?: string }) => {
  return request.patch(`/work-orders/${id}/process`, data)
}

export const assignWorkOrder = (id: number, assigneeId: number) => {
  return request.patch(`/work-orders/${id}/assign/${assigneeId}`)
}

export const escalateWorkOrder = (id: number, data: { remark?: string }) => {
  return request.patch(`/work-orders/${id}/escalate`, data)
}

export const getUsers = () => {
  return request.get<UserItem[]>('/users')
}

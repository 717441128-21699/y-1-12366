import request from '@/utils/request'
import type { WorkOrder, WorkOrderSearchParams, PaginationResponse, WorkOrderLog } from '@/types'

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

export const processWorkOrder = (id: number, remark: string) => {
  return request.put(`/work-orders/${id}/process`, { remark })
}

export const resolveWorkOrder = (id: number, remark: string) => {
  return request.put(`/work-orders/${id}/resolve`, { remark })
}

export const closeWorkOrder = (id: number, remark: string) => {
  return request.put(`/work-orders/${id}/close`, { remark })
}

export const escalateWorkOrder = (id: number, remark: string) => {
  return request.put(`/work-orders/${id}/escalate`, { remark })
}

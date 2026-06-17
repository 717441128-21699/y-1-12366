export type WorkOrderType = 'maintenance' | 'quality' | 'customer_service' | 'other'
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent'
export type WorkOrderStatus = 'pending' | 'processing' | 'resolved' | 'closed'

export interface WorkOrder {
  id: number
  orderNo: string
  type: WorkOrderType
  priority: WorkOrderPriority
  status: WorkOrderStatus
  title: string
  description: string
  relatedOrderId?: number
  relatedOrderNo?: string
  vehicleId?: number
  vehiclePlate?: string
  handler?: string
  creator: string
  createdAt: string
  deadline: string
  resolvedAt?: string
  closedAt?: string
  escalationLevel: number
}

export interface WorkOrderSearchParams {
  type?: WorkOrderType
  status?: WorkOrderStatus
  priority?: WorkOrderPriority
  page?: number
  pageSize?: number
}

export interface WorkOrderLog {
  id: number
  workOrderId: number
  action: string
  operator: string
  remark?: string
  timestamp: string
}

export type WorkOrderType = 'TEMPERATURE_ALERT' | 'REVIEW' | 'AUDIT'
export type WorkOrderPriority = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'
export type WorkOrderStatus = 'PENDING' | 'ASSIGNED' | 'PROCESSING' | 'RESOLVED' | 'ESCALATED' | 'CLOSED'

export interface WorkOrder {
  id: number
  workOrderNo: string
  type: WorkOrderType
  priority: WorkOrderPriority
  status: WorkOrderStatus
  title: string
  description: string
  relatedOrderId?: number
  relatedOrderNo?: string
  vehicleId?: number
  vehiclePlate?: string
  assigneeId?: number
  assigneeName?: string
  creatorId?: number
  creatorName: string
  createdAt: string
  deadline?: string
  resolvedAt?: string
  closedAt?: string
  escalationLevel: number
  remark?: string
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
  operatorId?: number
  operatorName: string
  remark?: string
  timestamp: string
}

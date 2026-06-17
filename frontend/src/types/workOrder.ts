export type WorkOrderType = 'TEMPERATURE_ALERT' | 'REVIEW' | 'AUDIT'
export type WorkOrderPriority = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY'
export type WorkOrderStatus = 'PENDING' | 'ASSIGNED' | 'PROCESSING' | 'RESOLVED' | 'ESCALATED' | 'CLOSED'

export interface WorkOrderAssignee {
  id: number
  name: string
  email: string
  role: string
}

export interface WorkOrderRelatedOrder {
  id: number
  orderNo: string
}

export interface WorkOrder {
  id: number
  type: WorkOrderType
  priority: WorkOrderPriority
  status: WorkOrderStatus
  title: string
  description: string
  assigneeId?: number
  assignee?: WorkOrderAssignee
  orderId?: number
  order?: WorkOrderRelatedOrder
  assignedAt?: string
  deadline?: string
  createdAt: string
  escalated: boolean
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

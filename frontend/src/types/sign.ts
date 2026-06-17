export type SignStatus = 'PENDING' | 'SIGNED' | 'DISPUTED'

export interface SignOrder {
  orderNo: string
  goodsName: string
  goodsQuantity: number
  customer?: {
    name: string
  }
}

export interface SignVehicle {
  plateNumber: string
}

export interface SignRecord {
  id: number
  orderId: number
  vehicleId: number
  signedBy: string
  signTime: string
  signStatus: SignStatus
  expectedQuantity: number
  actualQuantity: number
  difference: number
  isOverThreshold: boolean
  signPhoto?: string | null
  remark?: string
  createdAt: string
  order?: SignOrder
  vehicle?: SignVehicle
}

export interface SignCreateData {
  orderId: number
  actualQuantity: number
  signedBy: string
  remark?: string
}

export interface SignSearchParams {
  orderNo?: string
  signStatus?: SignStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

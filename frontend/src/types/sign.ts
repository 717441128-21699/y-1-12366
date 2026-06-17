export type SignStatus = 'NORMAL' | 'ABNORMAL' | 'DELAYED'

export interface SignRecord {
  id: number
  signNo: string
  orderId: number
  orderNo: string
  customerId?: number
  customerName?: string
  goods: string
  signerId?: number
  signerName: string
  signTime: string
  signStatus: SignStatus
  temperature?: number
  humidity?: number
  weightDiff?: number
  quantityDiff?: number
  hasDamage: boolean
  damageDescription?: string
  receiverName: string
  receiverPhone: string
  signAddress: string
  remark?: string
  images?: string[]
  createdAt: string
}

export interface SignCreateData {
  orderId: number
  signerName: string
  signStatus: SignStatus
  temperature?: number
  humidity?: number
  weightDiff?: number
  quantityDiff?: number
  hasDamage?: boolean
  damageDescription?: string
  receiverName: string
  receiverPhone: string
  signAddress: string
  remark?: string
  images?: string[]
}

export interface SignSearchParams {
  orderNo?: string
  signStatus?: SignStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

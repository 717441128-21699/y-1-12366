export type SignStatus = 'normal' | 'abnormal' | 'delayed'

export interface SignRecord {
  id: number
  signNo: string
  orderId: number
  orderNo: string
  customer: string
  goods: string
  signer: string
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

export interface SignSearchParams {
  orderNo?: string
  signStatus?: SignStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

import request from '@/utils/request'
import type { SignRecord, SignSearchParams, SignCreateData, PaginationResponse } from '@/types'

export const getSignList = (params: SignSearchParams) => {
  return request.get<PaginationResponse<SignRecord>>('/sign', { params })
}

export const getSignById = (id: number) => {
  return request.get<SignRecord>(`/sign/${id}`)
}

export const getSignByOrderId = (orderId: number) => {
  return request.get<SignRecord>(`/sign/order/${orderId}`)
}

export const createSign = (data: SignCreateData) => {
  return request.post<SignRecord>('/sign', data)
}

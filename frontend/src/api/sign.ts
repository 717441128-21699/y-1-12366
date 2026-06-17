import request from '@/utils/request'
import type { SignRecord, SignSearchParams, PaginationResponse } from '@/types'

export const getSignList = (params: SignSearchParams) => {
  return request.get<PaginationResponse<SignRecord>>('/signs', { params })
}

export const getSignById = (id: number) => {
  return request.get<SignRecord>(`/signs/${id}`)
}

export const getSignByOrderId = (orderId: number) => {
  return request.get<SignRecord>(`/signs/order/${orderId}`)
}

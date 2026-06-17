import request from '@/utils/request'
import type { User } from '@/types'

export const getUserList = (params?: any) => {
  return request.get<User[]>('/users', { params })
}

export const getUserById = (id: number) => {
  return request.get<User>(`/users/${id}`)
}

export const createUser = (data: Partial<User>) => {
  return request.post<User>('/users', data)
}

export const updateUser = (id: number, data: Partial<User>) => {
  return request.put<User>(`/users/${id}`, data)
}

export const deleteUser = (id: number) => {
  return request.delete(`/users/${id}`)
}

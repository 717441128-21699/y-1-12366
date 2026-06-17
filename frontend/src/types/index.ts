export * from './order'
export * from './vehicle'
export * from './temperature'
export * from './workOrder'
export * from './sign'
export * from './report'

export interface User {
  id: number
  name: string
  email: string
  age?: number
  role: string
  status: 'active' | 'inactive'
  createdAt?: string
  updatedAt?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

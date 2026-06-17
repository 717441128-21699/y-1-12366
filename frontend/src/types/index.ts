export * from './order'
export type {
  VehicleStatus,
  InsulationLevel,
  Sensor,
  Vehicle,
  VehicleSearchParams,
} from './vehicle'
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
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

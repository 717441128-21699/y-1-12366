export type OrderStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'SIGNED' | 'CANCELLED' | 'EXCEPTION'
export type TemperatureZone = 'FROZEN' | 'REFRIGERATED' | 'AMBIENT' | 'DUAL_ZONE' | 'MULTI_TEMP'

export interface Customer {
  id: number
  name: string
  phone?: string
  address?: string
}

export interface Vehicle {
  id: number
  plateNo: string
  model?: string
}

export interface Driver {
  id: number
  name: string
  phone?: string
}

export interface Order {
  id: number
  orderNo: string
  customerId: number
  customer?: Customer
  customerName?: string
  goods: string
  temperatureZone: TemperatureZone
  status: OrderStatus
  vehicleId?: number
  vehicle?: Vehicle
  vehiclePlate?: string
  driverId?: number
  driver?: Driver
  driverName?: string
  weight: number
  volume: number
  startAddress: string
  endAddress: string
  planDepartureTime: string
  planArrivalTime: string
  actualDepartureTime?: string
  actualArrivalTime?: string
  temperatureMin?: number
  temperatureMax?: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface OrderSearchParams {
  orderNo?: string
  status?: OrderStatus
  customerName?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

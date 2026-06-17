export type OrderStatus = 'pending' | 'assigned' | 'transit' | 'delivered' | 'cancelled'
export type TemperatureZone = 'frozen' | 'chilled' | 'normal'

export interface Order {
  id: number
  orderNo: string
  customer: string
  goods: string
  temperatureZone: TemperatureZone
  status: OrderStatus
  vehicleId?: number
  vehiclePlate?: string
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
  createdAt: string
  updatedAt: string
}

export interface OrderSearchParams {
  orderNo?: string
  status?: OrderStatus
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

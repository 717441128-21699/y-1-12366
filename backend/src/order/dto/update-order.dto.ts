import { TemperatureZone, OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  orderNo?: string;
  customerId?: number;
  goodsName?: string;
  goodsQuantity?: number;
  goodsWeight?: number;
  goodsVolume?: number;
  temperatureZone?: TemperatureZone;
  minTemp?: number;
  maxTemp?: number;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  pickupTime?: Date;
  deliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  status?: OrderStatus;
  vehicleId?: number;
  driverId?: number;
  remark?: string;
  signedQuantity?: number;
  signDifference?: number;
}

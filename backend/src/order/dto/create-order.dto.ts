import { TemperatureZone } from '@prisma/client';

export class CreateOrderDto {
  orderNo: string;
  customerId: number;
  goodsName: string;
  goodsQuantity: number;
  goodsWeight: number;
  goodsVolume?: number;
  temperatureZone: TemperatureZone;
  minTemp: number;
  maxTemp: number;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  pickupTime: Date;
  deliveryTime: Date;
  createdById?: number;
  remark?: string;
}

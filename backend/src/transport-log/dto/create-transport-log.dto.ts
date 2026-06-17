export class CreateTransportLogDto {
  orderId: number;
  driverId: number;
  reportedFuel: number;
  reportedMileage: number;
  remark?: string;
}

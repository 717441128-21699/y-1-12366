import { TemperatureZone } from '@prisma/client';

export class CreateVehicleDto {
  plateNumber: string;
  vehicleType: string;
  temperatureZone: TemperatureZone;
  maxLoad: number;
  insulationGrade: number;
  fuelConsumption: number;
  currentLat?: number;
  currentLng?: number;
  driverId?: number;
}

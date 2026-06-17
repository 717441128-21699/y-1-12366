import { TemperatureZone, VehicleStatus } from '@prisma/client';

export class UpdateVehicleDto {
  plateNumber?: string;
  vehicleType?: string;
  temperatureZone?: TemperatureZone;
  maxLoad?: number;
  currentLoad?: number;
  insulationGrade?: number;
  currentLat?: number;
  currentLng?: number;
  status?: VehicleStatus;
  lastMaintenance?: Date;
  fuelConsumption?: number;
  totalMileage?: number;
  driverId?: number;
}

import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { TemperatureService } from './temperature.service';
import { CreateReadingDto } from './dto/create-reading.dto';

@Controller('temperature')
export class TemperatureController {
  constructor(private readonly temperatureService: TemperatureService) {}

  @Post('upload')
  uploadReading(@Body() createReadingDto: CreateReadingDto) {
    return this.temperatureService.uploadReading(createReadingDto);
  }

  @Get('sensor/:sensorId/readings')
  getSensorReadings(
    @Param('sensorId') sensorId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.temperatureService.getSensorReadings(
      parseInt(sensorId),
      parseInt(page),
      parseInt(pageSize),
    );
  }

  @Get('vehicle/:vehicleId/sensors')
  getVehicleSensors(@Param('vehicleId') vehicleId: string) {
    return this.temperatureService.getVehicleSensors(parseInt(vehicleId));
  }

  @Get('order/:orderId/alerts')
  getAlerts(
    @Param('orderId') orderId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.temperatureService.getAlerts(
      parseInt(orderId),
      parseInt(page),
      parseInt(pageSize),
    );
  }
}

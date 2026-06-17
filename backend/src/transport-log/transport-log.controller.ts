import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { TransportLogService } from './transport-log.service';
import { CreateTransportLogDto } from './dto/create-transport-log.dto';

@Controller('transport-log')
export class TransportLogController {
  constructor(private readonly transportLogService: TransportLogService) {}

  @Post()
  create(@Body() createTransportLogDto: CreateTransportLogDto) {
    return this.transportLogService.create(createTransportLogDto);
  }

  @Get()
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.transportLogService.findAll(
      parseInt(page) || 1,
      parseInt(pageSize) || 10,
    );
  }

  @Get('abnormal')
  getAbnormalLogs(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.transportLogService.getAbnormalLogs(
      parseInt(page) || 1,
      parseInt(pageSize) || 10,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transportLogService.findOne(+id);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.transportLogService.findByOrderId(+orderId);
  }

  @Get('driver/:driverId')
  findByDriverId(
    @Param('driverId') driverId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.transportLogService.findByDriverId(
      +driverId,
      parseInt(page) || 1,
      parseInt(pageSize) || 10,
    );
  }
}

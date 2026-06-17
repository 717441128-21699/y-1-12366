import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { StandbyService, CreateStandbyDto, UpdateStandbyDto } from './standby.service';

@Controller('standby')
export class StandbyController {
  constructor(private readonly standbyService: StandbyService) {}

  @Post()
  create(@Body() createStandbyDto: CreateStandbyDto) {
    return this.standbyService.create(createStandbyDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.standbyService.findAll(parseInt(page), parseInt(pageSize));
  }

  @Get('nearby')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('skills') skills?: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string,
  ) {
    return this.standbyService.findNearby({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      skills: skills ? skills.split(',') : [],
      radius: radius ? parseFloat(radius) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.standbyService.findOne(parseInt(id));
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.standbyService.findByUserId(parseInt(userId));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStandbyDto: UpdateStandbyDto,
  ) {
    return this.standbyService.update(parseInt(id), updateStandbyDto);
  }

  @Patch(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.standbyService.updateLocation(parseInt(id), lat, lng);
  }

  @Patch(':id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.standbyService.setAvailability(parseInt(id), isAvailable);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.standbyService.remove(parseInt(id));
  }
}

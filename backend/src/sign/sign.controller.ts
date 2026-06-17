import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SignService } from './sign.service';
import { CreateSignDto } from './dto/create-sign.dto';

@Controller('sign')
export class SignController {
  constructor(private readonly signService: SignService) {}

  @Post()
  create(@Body() createSignDto: CreateSignDto) {
    return this.signService.create(createSignDto);
  }

  @Get()
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.signService.findAll(
      parseInt(page) || 1,
      parseInt(pageSize) || 10,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.signService.findOne(+id);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.signService.findByOrderId(+orderId);
  }
}

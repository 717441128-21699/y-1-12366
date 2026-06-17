import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VehicleModule } from '../vehicle/vehicle.module';

@Module({
  imports: [PrismaModule, VehicleModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

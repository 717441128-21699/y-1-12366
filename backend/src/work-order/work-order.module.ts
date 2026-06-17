import { Module } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { WorkOrderController } from './work-order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StandbyModule } from '../standby/standby.module';

@Module({
  imports: [PrismaModule, StandbyModule],
  controllers: [WorkOrderController],
  providers: [WorkOrderService],
  exports: [WorkOrderService],
})
export class WorkOrderModule {}

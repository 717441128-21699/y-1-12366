import { Module, forwardRef } from '@nestjs/common';
import { TemperatureService } from './temperature.service';
import { TemperatureController } from './temperature.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkOrderModule } from '../work-order/work-order.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WorkOrderModule)],
  controllers: [TemperatureController],
  providers: [TemperatureService],
  exports: [TemperatureService],
})
export class TemperatureModule {}

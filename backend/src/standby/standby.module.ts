import { Module } from '@nestjs/common';
import { StandbyService } from './standby.service';
import { StandbyController } from './standby.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StandbyController],
  providers: [StandbyService],
  exports: [StandbyService],
})
export class StandbyModule {}

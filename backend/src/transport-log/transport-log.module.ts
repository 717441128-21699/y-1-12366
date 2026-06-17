import { Module } from '@nestjs/common';
import { TransportLogService } from './transport-log.service';
import { TransportLogController } from './transport-log.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransportLogController],
  providers: [TransportLogService],
  exports: [TransportLogService],
})
export class TransportLogModule {}

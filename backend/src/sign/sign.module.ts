import { Module } from '@nestjs/common';
import { SignService } from './sign.service';
import { SignController } from './sign.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SignController],
  providers: [SignService],
  exports: [SignService],
})
export class SignModule {}

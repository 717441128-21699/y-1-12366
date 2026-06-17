import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { OrderModule } from './order/order.module';
import { TemperatureModule } from './temperature/temperature.module';
import { WorkOrderModule } from './work-order/work-order.module';
import { StandbyModule } from './standby/standby.module';
import { SignModule } from './sign/sign.module';
import { TransportLogModule } from './transport-log/transport-log.module';
import { AuditModule } from './audit/audit.module';
import { ReportModule } from './report/report.module';
import { NotificationModule } from './notification/notification.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    PrismaModule,
    VehicleModule,
    OrderModule,
    StandbyModule,
    WorkOrderModule,
    TemperatureModule,
    SignModule,
    TransportLogModule,
    AuditModule,
    ReportModule,
    NotificationModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

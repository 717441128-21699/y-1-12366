import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { AlertLevel, WorkOrderType, NotificationType, UserRole } from '@prisma/client';
import { WorkOrderService } from '../work-order/work-order.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class TemperatureService {
  private readonly logger = new Logger(TemperatureService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WorkOrderService))
    private workOrderService: WorkOrderService,
    private moduleRef: ModuleRef,
  ) {}

  private getNotificationService(): NotificationService {
    return this.moduleRef.get(NotificationService, { strict: false });
  }

  async uploadReading(createReadingDto: CreateReadingDto) {
    const { deviceId, temperature, humidity, readingTime } = createReadingDto;

    const sensor = await this.prisma.temperatureSensor.findUnique({
      where: { deviceId },
      include: {
        vehicle: {
          include: {
            orders: {
              where: { status: { in: ['IN_TRANSIT', 'ASSIGNED'] } },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!sensor) {
      throw new Error(`Sensor with deviceId ${deviceId} not found`);
    }

    const order = sensor.vehicle.orders[0];
    const alertLevel = this.detectAlertLevel(
      temperature,
      sensor.minTemp,
      sensor.maxTemp,
    );

    const isAlert = alertLevel !== null;

    const reading = await this.prisma.temperatureReading.create({
      data: {
        sensorId: sensor.id,
        vehicleId: sensor.vehicleId,
        orderId: order?.id,
        temperature,
        humidity,
        readingTime: readingTime || new Date(),
        isAlert,
        alertLevel,
      },
    });

    await this.prisma.temperatureSensor.update({
      where: { id: sensor.id },
      data: { lastReading: new Date() },
    });

    if (isAlert && order) {
      await this.createAlertAndWorkOrder(
        sensor,
        order,
        temperature,
        alertLevel,
        reading.id,
      );
    }

    return reading;
  }

  private detectAlertLevel(
    temp: number,
    minTemp: number,
    maxTemp: number,
  ): AlertLevel | null {
    const range = maxTemp - minTemp;
    const threshold10 = range * 0.1;
    const threshold20 = range * 0.2;
    const threshold50 = range * 0.5;

    if (temp > maxTemp) {
      const exceed = temp - maxTemp;
      if (exceed <= threshold10) return AlertLevel.INFO;
      if (exceed <= threshold20) return AlertLevel.WARNING;
      if (exceed <= threshold50) return AlertLevel.CRITICAL;
      return AlertLevel.EMERGENCY;
    }

    if (temp < minTemp) {
      const below = minTemp - temp;
      if (below <= threshold10) return AlertLevel.INFO;
      if (below <= threshold20) return AlertLevel.WARNING;
      if (below <= threshold50) return AlertLevel.CRITICAL;
      return AlertLevel.EMERGENCY;
    }

    return null;
  }

  private async createAlertAndWorkOrder(
    sensor: any,
    order: any,
    temperature: number,
    alertLevel: AlertLevel,
    readingId: number,
  ) {
    try {
      const alert = await this.prisma.alert.create({
        data: {
          orderId: order.id,
          vehicleId: sensor.vehicleId,
          sensorId: sensor.id,
          alertLevel,
          currentTemp: temperature,
          thresholdMin: sensor.minTemp,
          thresholdMax: sensor.maxTemp,
          description: `Temperature ${temperature}°C exceeds threshold [${sensor.minTemp}, ${sensor.maxTemp}]`,
        },
      });

      const deadline = this.calculateDeadline(alertLevel);

      await this.workOrderService.create({
        orderId: order.id,
        type: WorkOrderType.TEMPERATURE_ALERT,
        title: `温度告警 - ${alertLevel}`,
        description: `车辆 ${sensor.vehicle.plateNumber} 温度异常，当前温度 ${temperature}°C，阈值 [${sensor.minTemp}, ${sensor.maxTemp}]`,
        priority: alertLevel,
        alertId: alert.id,
        deadline,
      });

      const notificationService = this.getNotificationService();
      const driverTitle = '温度告警';
      const dispatcherTitle = '运输温度告警';
      const alertContent = `车辆 ${sensor.vehicle.plateNumber} 温度异常，当前温度 ${temperature}°C，阈值 [${sensor.minTemp}, ${sensor.maxTemp}]，告警级别: ${alertLevel}`;

      if (sensor.vehicle?.driverId) {
        await notificationService.create({
          userId: sensor.vehicle.driverId,
          type: NotificationType.TEMPERATURE_ALERT,
          title: driverTitle,
          content: alertContent,
          relatedId: alert.id,
          orderId: order.id,
        });
      }

      await notificationService.broadcastToRole(UserRole.DISPATCHER, {
        type: NotificationType.TEMPERATURE_ALERT,
        title: dispatcherTitle,
        content: alertContent,
        relatedId: alert.id,
        orderId: order.id,
      });

      if (alertLevel === AlertLevel.EMERGENCY) {
        await notificationService.broadcastToRole(UserRole.SUPERVISOR, {
          type: NotificationType.TEMPERATURE_ALERT,
          title: dispatcherTitle,
          content: alertContent,
          relatedId: alert.id,
          orderId: order.id,
        });
      }

      const orderWithCustomer = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: { customer: { include: { user: true } } },
      });

      if (orderWithCustomer?.customer?.userId) {
        await notificationService.create({
          userId: orderWithCustomer.customer.userId,
          type: NotificationType.TEMPERATURE_ALERT,
          title: '运输温度告警',
          content: `您的订单运输中出现温度告警，当前温度: ${temperature}°C，阈值范围: [${sensor.minTemp}, ${sensor.maxTemp}]°C`,
          relatedId: alert.id,
          orderId: order.id,
        });
      }

      this.logger.log(
        `Alert and work order created for sensor ${sensor.deviceId}, level: ${alertLevel}`,
      );
    } catch (error) {
      this.logger.error('Failed to create alert and work order:', error);
    }
  }

  private calculateDeadline(alertLevel: AlertLevel): Date {
    const now = new Date();
    switch (alertLevel) {
      case AlertLevel.INFO:
        return new Date(now.getTime() + 1000 * 60 * 60 * 4);
      case AlertLevel.WARNING:
        return new Date(now.getTime() + 1000 * 60 * 60 * 2);
      case AlertLevel.CRITICAL:
        return new Date(now.getTime() + 1000 * 60 * 30);
      case AlertLevel.EMERGENCY:
        return new Date(now.getTime() + 1000 * 60 * 10);
      default:
        return new Date(now.getTime() + 1000 * 60 * 60 * 4);
    }
  }

  async getSensorReadings(sensorId: number, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.temperatureReading.findMany({
        where: { sensorId },
        orderBy: { readingTime: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.temperatureReading.count({ where: { sensorId } }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getVehicleSensors(vehicleId: number) {
    return this.prisma.temperatureSensor.findMany({
      where: { vehicleId },
    });
  }

  async getAlerts(orderId: number, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.alert.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.alert.count({ where: { orderId } }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

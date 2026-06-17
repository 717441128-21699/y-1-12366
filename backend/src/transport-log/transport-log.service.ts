import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransportLogDto } from './dto/create-transport-log.dto';
import { calculateDistance } from '../common/utils/geo.util';
import { WorkOrderType } from '@prisma/client';

@Injectable()
export class TransportLogService {
  constructor(private prisma: PrismaService) {}

  private readonly FUEL_DEVIATION_THRESHOLD = 10;
  private readonly MILEAGE_FACTOR = 1.2;

  async create(createTransportLogDto: CreateTransportLogDto) {
    const { orderId, driverId, reportedFuel, reportedMileage, remark } = createTransportLogDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vehicle: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    const systemMileage = this.calculateEstimatedMileage(order);
    const systemFuel = this.calculateTheoreticalFuel(order.vehicle?.fuelConsumption, systemMileage);

    const fuelDeviation = systemFuel > 0
      ? Math.abs(reportedFuel - systemFuel) / systemFuel * 100
      : 0;
    const mileageDeviation = systemMileage > 0
      ? Math.abs(reportedMileage - systemMileage) / systemMileage * 100
      : 0;

    const isAbnormal = fuelDeviation > this.FUEL_DEVIATION_THRESHOLD ||
      mileageDeviation > this.FUEL_DEVIATION_THRESHOLD;

    const transportLog = await this.prisma.transportLog.create({
      data: {
        orderId,
        driverId,
        reportedFuel,
        reportedMileage,
        systemFuel,
        systemMileage,
        fuelDeviation,
        mileageDeviation,
        isAbnormal,
        remark,
      },
    });

    if (order.vehicle) {
      await this.prisma.vehicle.update({
        where: { id: order.vehicle.id },
        data: {
          totalMileage: {
            increment: reportedMileage,
          },
        },
      });
    }

    if (isAbnormal) {
      await this.createAuditTask(transportLog.id, orderId, fuelDeviation, mileageDeviation);
    }

    return transportLog;
  }

  private calculateEstimatedMileage(order: any): number {
    if (order.pickupLat && order.pickupLng && order.deliveryLat && order.deliveryLng) {
      const straightDistance = calculateDistance(
        order.pickupLat,
        order.pickupLng,
        order.deliveryLat,
        order.deliveryLng,
      );
      return straightDistance * this.MILEAGE_FACTOR;
    }
    return 0;
  }

  private calculateTheoreticalFuel(fuelConsumption: number | undefined, mileage: number): number {
    if (!fuelConsumption || mileage <= 0) {
      return 0;
    }
    return (fuelConsumption * mileage) / 100;
  }

  private async createAuditTask(
    transportLogId: number,
    orderId: number,
    fuelDeviation: number,
    mileageDeviation: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    await this.prisma.auditTask.create({
      data: {
        transportLogId,
        type: WorkOrderType.AUDIT,
        status: 'PENDING',
        findings: `油耗偏差: ${fuelDeviation.toFixed(2)}%, 里程偏差: ${mileageDeviation.toFixed(2)}%`,
      },
    });
  }

  async findAll(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.transportLog.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.transportLog.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const transportLog = await this.prisma.transportLog.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            vehicle: true,
            customer: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!transportLog) {
      throw new NotFoundException('运输日志不存在');
    }

    return transportLog;
  }

  async findByOrderId(orderId: number) {
    return this.prisma.transportLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findByDriverId(driverId: number, page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.transportLog.findMany({
        where: { driverId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
        },
      }),
      this.prisma.transportLog.count({ where: { driverId } }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getAbnormalLogs(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.transportLog.findMany({
        where: { isAbnormal: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          driver: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.transportLog.count({ where: { isAbnormal: true } }),
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { PaginationDto, PaginatedResultDto } from '../common/dto/pagination.dto';
import { calculateDistance } from '../common/utils/geo.util';
import { TemperatureZone, VehicleStatus, OrderStatus, NotificationType, UserRole } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

export interface AssignmentResult {
  success: boolean;
  vehicleId?: number;
  plateNumber?: string;
  distance?: number;
  message?: string;
}

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private moduleRef: ModuleRef,
  ) {}

  private getNotificationService(): NotificationService {
    return this.moduleRef.get(NotificationService, { strict: false });
  }

  private getRequiredInsulationGrade(temperatureZone: TemperatureZone): number {
    const gradeMap: Record<TemperatureZone, number> = {
      [TemperatureZone.FROZEN]: 5,
      [TemperatureZone.MULTI_TEMP]: 5,
      [TemperatureZone.DUAL_ZONE]: 4,
      [TemperatureZone.REFRIGERATED]: 3,
      [TemperatureZone.AMBIENT]: 1,
    };
    return gradeMap[temperatureZone] || 1;
  }

  async create(createOrderDto: CreateOrderDto) {
    return this.prisma.order.create({
      data: createOrderDto,
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResultDto<any>> {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          vehicle: true,
          driver: true,
        },
      }),
      this.prisma.order.count(),
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.order.delete({
      where: { id },
    });
  }

  async assignVehicle(assignVehicleDto: AssignVehicleDto): Promise<AssignmentResult> {
    const { orderId, vehicleId } = assignVehicleDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      return {
        success: false,
        message: `订单状态为 ${order.status}，无法分配车辆`,
      };
    }

    const requiredInsulationGrade = this.getRequiredInsulationGrade(order.temperatureZone);

    if (vehicleId) {
      return this.assignSpecificVehicle(order, vehicleId, requiredInsulationGrade);
    }

    return this.autoAssignVehicle(order, requiredInsulationGrade);
  }

  private async assignSpecificVehicle(
    order: any,
    vehicleId: number,
    requiredInsulationGrade: number,
  ): Promise<AssignmentResult> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    if (vehicle.status !== VehicleStatus.IDLE) {
      return {
        success: false,
        message: `车辆状态为 ${vehicle.status}，不可分配`,
      };
    }

    if (vehicle.temperatureZone !== order.temperatureZone) {
      return {
        success: false,
        message: `车辆温区 ${vehicle.temperatureZone} 与订单温区 ${order.temperatureZone} 不匹配`,
      };
    }

    if (vehicle.currentLoad + order.goodsWeight > vehicle.maxLoad) {
      return {
        success: false,
        message: `车辆载重不足，当前载重 ${vehicle.currentLoad}，订单重量 ${order.goodsWeight}，最大载重 ${vehicle.maxLoad}`,
      };
    }

    if (vehicle.insulationGrade < requiredInsulationGrade) {
      return {
        success: false,
        message: `车辆保温等级 ${vehicle.insulationGrade} 级不满足订单要求的 ${requiredInsulationGrade} 级`,
      };
    }

    return this.performAssignment(order.id, vehicle.id);
  }

  private async autoAssignVehicle(
    order: any,
    requiredInsulationGrade: number,
  ): Promise<AssignmentResult> {
    const candidateVehicles = await this.prisma.vehicle.findMany({
      where: {
        status: VehicleStatus.IDLE,
        temperatureZone: order.temperatureZone,
      },
    });

    if (candidateVehicles.length === 0) {
      return {
        success: false,
        message: '没有找到符合温区要求的空闲车辆',
      };
    }

    const eligibleVehicles = candidateVehicles
      .filter((v) => v.currentLoad + order.goodsWeight <= v.maxLoad)
      .filter((v) => v.insulationGrade >= requiredInsulationGrade);

    if (eligibleVehicles.length === 0) {
      const lowInsulation = candidateVehicles.filter(
        (v) => v.insulationGrade < requiredInsulationGrade,
      );
      if (lowInsulation.length > 0) {
        return {
          success: false,
          message: `找到 ${lowInsulation.length} 辆符合温区的车辆，但保温等级均不满足订单要求的 ${requiredInsulationGrade} 级`,
        };
      }
      return {
        success: false,
        message: '没有找到载重和保温等级均符合要求的空闲车辆',
      };
    }

    if (order.pickupLat == null || order.pickupLng == null) {
      const vehicle = eligibleVehicles[0];
      return this.performAssignment(order.id, vehicle.id);
    }

    const vehiclesWithDistance = eligibleVehicles
      .filter((v) => v.currentLat != null && v.currentLng != null)
      .map((v) => ({
        vehicle: v,
        distance: calculateDistance(
          v.currentLat!,
          v.currentLng!,
          order.pickupLat!,
          order.pickupLng!,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (vehiclesWithDistance.length === 0) {
      const vehicle = eligibleVehicles[0];
      return this.performAssignment(order.id, vehicle.id);
    }

    const bestMatch = vehiclesWithDistance[0];
    return this.performAssignment(order.id, bestMatch.vehicle.id, bestMatch.distance);
  }

  private async performAssignment(
    orderId: number,
    vehicleId: number,
    distance?: number,
  ): Promise<AssignmentResult> {
    const result = await this.prisma.$transaction(async (prisma) => {
      const vehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: VehicleStatus.IN_TRANSIT,
        },
      });

      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.ASSIGNED,
          vehicleId: vehicleId,
          driverId: vehicle.driverId,
        },
        include: {
          driver: true,
          customer: { include: { user: true } },
        },
      });

      return { vehicle, order };
    });

    try {
      const notificationService = this.getNotificationService();
      const { vehicle, order } = result;

      if (order.driverId) {
        await notificationService.create({
          userId: order.driverId,
          type: NotificationType.ORDER_STATUS,
          title: '新的运输订单已分配',
          content: `车牌: ${vehicle.plateNumber}, 订单号: ${order.orderNo}, 装货时间: ${order.pickupTime ? new Date(order.pickupTime).toLocaleString('zh-CN') : '待安排'}`,
          relatedId: orderId,
          orderId: orderId,
        });
      }

      const driverName = order.driver?.name || '未指定';
      await notificationService.broadcastToRole(UserRole.DISPATCHER, {
        type: NotificationType.ORDER_STATUS,
        title: '订单车辆分配成功',
        content: `订单号: ${order.orderNo}, 车牌: ${vehicle.plateNumber}, 司机: ${driverName}`,
        relatedId: orderId,
        orderId: orderId,
      });

      if (order.customer?.userId) {
        await notificationService.create({
          userId: order.customer.userId,
          type: NotificationType.ORDER_STATUS,
          title: '您的订单已分配车辆',
          content: `订单号: ${order.orderNo}, 车牌号: ${vehicle.plateNumber}, 预计送达时间: ${order.deliveryTime ? new Date(order.deliveryTime).toLocaleString('zh-CN') : '待安排'}`,
          relatedId: orderId,
          orderId: orderId,
        });
      }
    } catch (error) {
      console.error('Failed to send assignment notifications:', error);
    }

    return {
      success: true,
      vehicleId: result.vehicle.id,
      plateNumber: result.vehicle.plateNumber,
      distance: distance,
      message: `成功分配车辆 ${result.vehicle.plateNumber}`,
    };
  }
}

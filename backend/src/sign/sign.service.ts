import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSignDto } from './dto/create-sign.dto';
import { WorkOrderType, SignStatus, NotificationType, AlertLevel, OrderStatus } from '@prisma/client';

@Injectable()
export class SignService {
  constructor(private prisma: PrismaService) {}

  private readonly THRESHOLD_PERCENT = 5;

  async create(createSignDto: CreateSignDto) {
    const { orderId, actualQuantity, signedBy, signPhoto, remark } = createSignDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vehicle: true,
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status === OrderStatus.SIGNED) {
      throw new BadRequestException('订单已签收，不可重复签收');
    }

    const expectedQuantity = order.goodsQuantity;
    const difference = actualQuantity - expectedQuantity;
    const diffPercent = expectedQuantity > 0
      ? Math.abs(difference) / expectedQuantity * 100
      : 0;
    const isOverThreshold = diffPercent > this.THRESHOLD_PERCENT;

    const signRecord = await this.prisma.signRecord.create({
      data: {
        orderId,
        vehicleId: order.vehicleId!,
        signedBy,
        signStatus: isOverThreshold ? SignStatus.DISPUTED : SignStatus.SIGNED,
        expectedQuantity,
        actualQuantity,
        difference: diffPercent,
        isOverThreshold,
        signPhoto,
        remark,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: isOverThreshold ? OrderStatus.EXCEPTION : OrderStatus.SIGNED,
        signedQuantity: actualQuantity,
        signDifference: diffPercent,
        actualDeliveryTime: new Date(),
      },
    });

    if (isOverThreshold) {
      await this.createReviewWorkOrder(orderId, expectedQuantity, actualQuantity, diffPercent);
      await this.createNotifications(orderId, expectedQuantity, actualQuantity, diffPercent);
    }

    return signRecord;
  }

  private async createReviewWorkOrder(
    orderId: number,
    expectedQuantity: number,
    actualQuantity: number,
    diffPercent: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    await this.prisma.workOrder.create({
      data: {
        orderId,
        type: WorkOrderType.REVIEW,
        title: `签收数量异常 - 订单${order?.orderNo}`,
        description: `预定数量: ${expectedQuantity}, 实收数量: ${actualQuantity}, 差异比例: ${diffPercent.toFixed(2)}%`,
        priority: AlertLevel.WARNING,
        status: 'PENDING',
      },
    });
  }

  private async createNotifications(
    orderId: number,
    expectedQuantity: number,
    actualQuantity: number,
    diffPercent: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        driver: true,
      },
    });

    const warehouseUsers = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['DISPATCHER', 'SUPERVISOR'],
        },
      },
    });

    const notificationPromises = warehouseUsers.map(user =>
      this.prisma.notification.create({
        data: {
          userId: user.id,
          type: NotificationType.SIGN_EXCEPTION,
          title: `签收异常提醒 - 订单${order?.orderNo}`,
          content: `预定数量: ${expectedQuantity}, 实收数量: ${actualQuantity}, 差异比例: ${diffPercent.toFixed(2)}%，请及时处理`,
          relatedId: orderId,
        },
      }),
    );

    await Promise.all(notificationPromises);
  }

  async findAll(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.signRecord.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: true,
          vehicle: true,
        },
      }),
      this.prisma.signRecord.count(),
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
    const signRecord = await this.prisma.signRecord.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            vehicle: true,
          },
        },
      },
    });

    if (!signRecord) {
      throw new NotFoundException('签收记录不存在');
    }

    return signRecord;
  }

  async findByOrderId(orderId: number) {
    return this.prisma.signRecord.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        vehicle: true,
      },
    });
  }
}

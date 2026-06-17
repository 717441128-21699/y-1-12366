import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto, PaginatedResultDto } from '../common/dto/pagination.dto';
import { NotificationGateway } from '../gateway/notification.gateway';
import { UserRole } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: createNotificationDto,
      include: {
        user: true,
      },
    });

    this.notificationGateway.sendToUser(
      createNotificationDto.userId,
      'notification',
      notification,
    );

    return notification;
  }

  async findAll(
    userId: number,
    paginationDto: PaginationDto & { isRead?: boolean },
  ): Promise<PaginatedResultDto<any>> {
    const { page = 1, pageSize = 10, isRead } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
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
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async markAsRead(id: number) {
    const notification = await this.findOne(id);
    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    return { count };
  }

  async broadcastToRole(role: UserRole, createNotificationDto: Omit<CreateNotificationDto, 'userId'>) {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: { id: true },
    });

    const notifications = [];
    for (const user of users) {
      const notification = await this.prisma.notification.create({
        data: {
          ...createNotificationDto,
          userId: user.id,
        },
      });
      notifications.push(notification);

      this.notificationGateway.sendToUser(user.id, 'notification', notification);
    }

    return {
      sentCount: notifications.length,
      notifications,
    };
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StandbyService } from '../standby/standby.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ProcessWorkOrderDto } from './dto/process-work-order.dto';
import {
  WorkOrderStatus,
  AlertLevel,
  NotificationType,
  UserRole,
} from '@prisma/client';

@Injectable()
export class WorkOrderService implements OnModuleInit {
  private readonly logger = new Logger(WorkOrderService.name);
  private escalationCheckInterval: any;

  constructor(
    private prisma: PrismaService,
    private standbyService: StandbyService,
  ) {}

  onModuleInit() {
    this.startEscalationCheck();
  }

  private startEscalationCheck() {
    this.escalationCheckInterval = setInterval(() => {
      this.checkAndEscalateOverdue().catch((err) => {
        this.logger.error('Escalation check failed:', err);
      });
    }, 60 * 1000);
  }

  async create(createWorkOrderDto: CreateWorkOrderDto) {
    const workOrder = await this.prisma.workOrder.create({
      data: {
        ...createWorkOrderDto,
        status: WorkOrderStatus.PENDING,
      },
    });

    await this.autoAssign(workOrder.id);

    return this.prisma.workOrder.findUnique({
      where: { id: workOrder.id },
      include: { assignee: true, order: true },
    });
  }

  async autoAssign(workOrderId: number) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { order: true },
    });

    if (!workOrder) {
      throw new Error(`Work order ${workOrderId} not found`);
    }

    if (workOrder.status !== WorkOrderStatus.PENDING) {
      return workOrder;
    }

    let targetLat: number | null = null;
    let targetLng: number | null = null;

    if (workOrder.order) {
      targetLat = workOrder.order.deliveryLat;
      targetLng = workOrder.order.deliveryLng;
    }

    const skills = this.getRequiredSkills(workOrder.priority);

    if (targetLat != null && targetLng != null) {
      const nearest = await this.standbyService.findNearestWithSkills(
        targetLat,
        targetLng,
        skills,
        workOrder.priority,
      );

      if (nearest) {
        return this.assignWorkOrder(workOrderId, nearest.userId);
      }
    }

    const allAvailable = await this.prisma.standbyPersonnel.findMany({
      where: { isAvailable: true },
      include: { user: true },
    });

    const matchingSkills = allAvailable.filter((s) =>
      skills.some((skill) => s.skills.includes(skill)),
    );

    const candidates = matchingSkills.length > 0 ? matchingSkills : allAvailable;

    if (candidates.length > 0) {
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      return this.assignWorkOrder(workOrderId, selected.userId);
    }

    this.logger.warn(`No available standby personnel for work order ${workOrderId}`);
    return workOrder;
  }

  private getRequiredSkills(priority: AlertLevel): string[] {
    switch (priority) {
      case AlertLevel.EMERGENCY:
        return ['EMERGENCY_HANDLING', 'TEMPERATURE_MAINTENANCE'];
      case AlertLevel.CRITICAL:
        return ['TEMPERATURE_MAINTENANCE', 'QUICK_RESPONSE'];
      case AlertLevel.WARNING:
        return ['TEMPERATURE_CHECK', 'ROUTINE_MAINTENANCE'];
      case AlertLevel.INFO:
        return ['ROUTINE_MAINTENANCE'];
      default:
        return ['ROUTINE_MAINTENANCE'];
    }
  }

  async assignWorkOrder(workOrderId: number, assigneeId: number) {
    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        assigneeId,
        status: WorkOrderStatus.ASSIGNED,
        assignedAt: new Date(),
      },
      include: { assignee: true },
    });

    await this.createNotification(
      assigneeId,
      '新工单分配',
      `您有一个新的工单：${updated.title}`,
      workOrderId,
    );

    return updated;
  }

  async process(
    workOrderId: number,
    processWorkOrderDto: ProcessWorkOrderDto,
  ) {
    const { status, assigneeId, remark } = processWorkOrderDto;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === WorkOrderStatus.PROCESSING) {
        updateData.startedAt = new Date();
      }
      if (
        status === WorkOrderStatus.RESOLVED ||
        status === WorkOrderStatus.CLOSED
      ) {
        updateData.resolvedAt = new Date();
      }
    }

    if (assigneeId) {
      updateData.assigneeId = assigneeId;
      updateData.assignedAt = new Date();
    }

    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: updateData,
      include: { assignee: true, order: true },
    });

    if (updated.assigneeId) {
      await this.createNotification(
        updated.assigneeId,
        '工单更新',
        `工单 ${updated.title} 状态已更新为 ${updated.status}`,
        workOrderId,
      );
    }

    return updated;
  }

  async escalate(workOrderId: number) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!workOrder || workOrder.escalated) {
      return workOrder;
    }

    const updated = await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        escalated: true,
        escalatedAt: new Date(),
        status: WorkOrderStatus.ESCALATED,
      },
      include: { assignee: true, order: true },
    });

    const supervisors = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERVISOR },
    });

    for (const supervisor of supervisors) {
      await this.createNotification(
        supervisor.id,
        '⚠️ 工单升级通知',
        `工单 "${updated.title}" 已超时升级，请及时处理。优先级: ${updated.priority}`,
        workOrderId,
      );
    }

    this.logger.log(`Work order ${workOrderId} has been escalated`);
    return updated;
  }

  async checkAndEscalateOverdue() {
    const now = new Date();
    const overdueOrders = await this.prisma.workOrder.findMany({
      where: {
        deadline: { lt: now },
        escalated: false,
        status: {
          in: [
            WorkOrderStatus.PENDING,
            WorkOrderStatus.ASSIGNED,
            WorkOrderStatus.PROCESSING,
          ],
        },
      },
    });

    this.logger.log(
      `Found ${overdueOrders.length} overdue work orders to escalate`,
    );

    for (const order of overdueOrders) {
      try {
        await this.escalate(order.id);
      } catch (error) {
        this.logger.error(
          `Failed to escalate work order ${order.id}:`,
          error,
        );
      }
    }

    return overdueOrders.length;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
    status?: WorkOrderStatus,
    priority?: AlertLevel,
    assigneeId?: number,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const [data, total] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: { assignee: true, order: true },
      }),
      this.prisma.workOrder.count({ where }),
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
    return this.prisma.workOrder.findUnique({
      where: { id },
      include: { assignee: true, order: true },
    });
  }

  async findByAssignee(assigneeId: number, page: number = 1, pageSize: number = 20) {
    return this.findAll(page, pageSize, undefined, undefined, assigneeId);
  }

  private async createNotification(
    userId: number,
    title: string,
    content: string,
    relatedId?: number,
  ) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          type: NotificationType.WORK_ORDER,
          title,
          content,
          relatedId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
    }
  }
}

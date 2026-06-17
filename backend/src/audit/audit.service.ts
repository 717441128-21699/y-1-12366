import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditStatus, WorkOrderType } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, pageSize: number = 10, status?: AuditStatus) {
    const skip = (page - 1) * pageSize;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.auditTask.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          transportLog: {
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
          },
        },
      }),
      this.prisma.auditTask.count({ where }),
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
    const auditTask = await this.prisma.auditTask.findUnique({
      where: { id },
      include: {
        transportLog: {
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
        },
      },
    });

    if (!auditTask) {
      throw new NotFoundException('审计任务不存在');
    }

    return auditTask;
  }

  async process(id: number, assigneeId: number) {
    const auditTask = await this.prisma.auditTask.findUnique({
      where: { id },
    });

    if (!auditTask) {
      throw new NotFoundException('审计任务不存在');
    }

    if (auditTask.status !== AuditStatus.PENDING) {
      throw new BadRequestException('该审计任务已被处理');
    }

    return this.prisma.auditTask.update({
      where: { id },
      data: {
        status: AuditStatus.REVIEWING,
        assigneeId,
      },
    });
  }

  async confirm(id: number, reviewedBy: number, conclusion: string, findings?: string) {
    const auditTask = await this.prisma.auditTask.findUnique({
      where: { id },
    });

    if (!auditTask) {
      throw new NotFoundException('审计任务不存在');
    }

    if (auditTask.status === AuditStatus.CONFIRMED || auditTask.status === AuditStatus.REJECTED) {
      throw new BadRequestException('该审计任务已完成');
    }

    return this.prisma.auditTask.update({
      where: { id },
      data: {
        status: AuditStatus.CONFIRMED,
        reviewedBy,
        reviewedAt: new Date(),
        conclusion,
        findings: findings || auditTask.findings,
      },
    });
  }

  async reject(id: number, reviewedBy: number, conclusion: string, findings?: string) {
    const auditTask = await this.prisma.auditTask.findUnique({
      where: { id },
    });

    if (!auditTask) {
      throw new NotFoundException('审计任务不存在');
    }

    if (auditTask.status === AuditStatus.CONFIRMED || auditTask.status === AuditStatus.REJECTED) {
      throw new BadRequestException('该审计任务已完成');
    }

    return this.prisma.auditTask.update({
      where: { id },
      data: {
        status: AuditStatus.REJECTED,
        reviewedBy,
        reviewedAt: new Date(),
        conclusion,
        findings: findings || auditTask.findings,
      },
    });
  }

  async getStats() {
    const [total, pending, reviewing, confirmed, rejected] = await Promise.all([
      this.prisma.auditTask.count(),
      this.prisma.auditTask.count({ where: { status: AuditStatus.PENDING } }),
      this.prisma.auditTask.count({ where: { status: AuditStatus.REVIEWING } }),
      this.prisma.auditTask.count({ where: { status: AuditStatus.CONFIRMED } }),
      this.prisma.auditTask.count({ where: { status: AuditStatus.REJECTED } }),
    ]);

    return {
      total,
      pending,
      reviewing,
      confirmed,
      rejected,
      completionRate: total > 0 ? ((confirmed + rejected) / total * 100).toFixed(2) : '0',
    };
  }

  async batchAudit(transportLogIds: number[]) {
    const results = [];

    for (const logId of transportLogIds) {
      const transportLog = await this.prisma.transportLog.findUnique({
        where: { id: logId },
      });

      if (!transportLog) continue;

      const existingAudit = await this.prisma.auditTask.findFirst({
        where: { transportLogId: logId },
      });

      if (!existingAudit && transportLog.isAbnormal) {
        const auditTask = await this.prisma.auditTask.create({
          data: {
            transportLogId: logId,
            type: WorkOrderType.AUDIT,
            status: AuditStatus.PENDING,
            findings: `油耗偏差: ${transportLog.fuelDeviation?.toFixed(2)}%, 里程偏差: ${transportLog.mileageDeviation?.toFixed(2)}%`,
          },
        });
        results.push({ transportLogId: logId, created: true, auditTaskId: auditTask.id });
      } else {
        results.push({ transportLogId: logId, created: false, reason: existingAudit ? '已存在审计任务' : '无异常' });
      }
    }

    return results;
  }
}

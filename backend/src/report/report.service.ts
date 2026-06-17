import { Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import * as ExcelJS from 'exceljs';
import { OrderStatus, VehicleStatus } from '@prisma/client';

export interface AreaStat {
  area: string;
  orderCount: number;
  onTimeCount: number;
  onTimeRate: number;
}

export interface LineStat {
  line: string;
  orderCount: number;
  onTimeCount: number;
  onTimeRate: number;
  totalMileage: number;
}

export interface DailyReportResult {
  id: number;
  reportDate: Date;
  totalOrders: number;
  onTimeCount: number;
  onTimeRate: number;
  tempQualifiedCount: number;
  tempQualifiedRate: number;
  vehicleUtilization: number;
  totalMileage: number;
  totalFuel: number;
  alertCount: number;
  areaStats?: AreaStat[];
  lineStats?: LineStat[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'generate-daily-report',
    timeZone: 'Asia/Shanghai',
  })
  async generateDailyReportCron() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.generateDailyReport(yesterday);
  }

  async generateDailyReport(date: Date) {
    const reportDate = this.startOfDay(date);
    const nextDate = new Date(reportDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const existingReport = await this.prisma.dailyReport.findUnique({
      where: { reportDate },
    });

    const [orders, transportLogs, alerts, vehicles, tempReadings] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: reportDate,
            lt: nextDate,
          },
        },
        include: {
          vehicle: true,
        },
      }),
      this.prisma.transportLog.findMany({
        where: {
          reportTime: {
            gte: reportDate,
            lt: nextDate,
          },
        },
      }),
      this.prisma.alert.findMany({
        where: {
          createdAt: {
            gte: reportDate,
            lt: nextDate,
          },
        },
      }),
      this.prisma.vehicle.findMany(),
      this.prisma.temperatureReading.findMany({
        where: {
          readingTime: {
            gte: reportDate,
            lt: nextDate,
          },
          orderId: {
            not: null,
          },
        },
        include: {
          order: true,
        },
      }),
    ]);

    const totalOrders = orders.length;

    const onTimeCount = orders.filter((o) => {
      if (o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.SIGNED) {
        return false;
      }
      if (!o.actualDeliveryTime) return false;
      return o.actualDeliveryTime <= o.deliveryTime;
    }).length;

    const onTimeRate = totalOrders > 0 ? onTimeCount / totalOrders : 0;

    const ordersWithTransport = orders.filter((o) => o.vehicleId != null);
    const tempQualifiedOrders = new Set<number>();

    for (const reading of tempReadings) {
      if (reading.orderId && reading.order && !reading.isAlert) {
        const order = reading.order;
        if (
          reading.temperature >= order.minTemp &&
          reading.temperature <= order.maxTemp
        ) {
          tempQualifiedOrders.add(reading.orderId);
        }
      }
    }

    const tempQualifiedCount = tempQualifiedOrders.size;
    const tempQualifiedRate =
      ordersWithTransport.length > 0
        ? tempQualifiedCount / ordersWithTransport.length
        : 0;

    const totalAvailableVehicles = vehicles.filter(
      (v) => v.status !== VehicleStatus.DISABLED && v.status !== VehicleStatus.MAINTENANCE,
    ).length;

    const runningVehicles = new Set(
      orders.filter((o) => o.vehicleId != null).map((o) => o.vehicleId),
    ).size;

    const vehicleUtilization =
      totalAvailableVehicles > 0 ? runningVehicles / totalAvailableVehicles : 0;

    const totalMileage = transportLogs.reduce((sum, log) => sum + log.reportedMileage, 0);
    const totalFuel = transportLogs.reduce((sum, log) => sum + log.reportedFuel, 0);

    const alertCount = alerts.length;

    const areaMap = new Map<string, { orderCount: number; onTimeCount: number }>();
    for (const order of orders) {
      const area = order.pickupAddress.split(/[省市区]/)[0] || '未知';
      const current = areaMap.get(area) || { orderCount: 0, onTimeCount: 0 };
      current.orderCount++;
      if (
        (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SIGNED) &&
        order.actualDeliveryTime &&
        order.actualDeliveryTime <= order.deliveryTime
      ) {
        current.onTimeCount++;
      }
      areaMap.set(area, current);
    }

    const areaStats: AreaStat[] = Array.from(areaMap.entries()).map(([area, stat]) => ({
      area,
      orderCount: stat.orderCount,
      onTimeCount: stat.onTimeCount,
      onTimeRate: stat.orderCount > 0 ? stat.onTimeCount / stat.orderCount : 0,
    }));

    const lineMap = new Map<
      string,
      { orderCount: number; onTimeCount: number; totalMileage: number }
    >();
    for (const order of orders) {
      const line = `${order.pickupAddress.split(/[省市区]/)[0] || '未知'}-${order.deliveryAddress.split(/[省市区]/)[0] || '未知'}`;
      const current = lineMap.get(line) || {
        orderCount: 0,
        onTimeCount: 0,
        totalMileage: 0,
      };
      current.orderCount++;
      if (
        (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SIGNED) &&
        order.actualDeliveryTime &&
        order.actualDeliveryTime <= order.deliveryTime
      ) {
        current.onTimeCount++;
      }
      lineMap.set(line, current);
    }

    for (const log of transportLogs) {
      const order = orders.find((o) => o.id === log.orderId);
      if (order) {
        const line = `${order.pickupAddress.split(/[省市区]/)[0] || '未知'}-${order.deliveryAddress.split(/[省市区]/)[0] || '未知'}`;
        const current = lineMap.get(line);
        if (current) {
          current.totalMileage += log.reportedMileage;
        }
      }
    }

    const lineStats: LineStat[] = Array.from(lineMap.entries()).map(([line, stat]) => ({
      line,
      orderCount: stat.orderCount,
      onTimeCount: stat.onTimeCount,
      onTimeRate: stat.orderCount > 0 ? stat.onTimeCount / stat.orderCount : 0,
      totalMileage: stat.totalMileage,
    }));

    const reportData = {
      reportDate,
      totalOrders,
      onTimeCount,
      onTimeRate,
      tempQualifiedCount,
      tempQualifiedRate,
      vehicleUtilization,
      totalMileage,
      totalFuel,
      alertCount,
      areaStats: areaStats as any,
      lineStats: lineStats as any,
    };

    if (existingReport) {
      return this.prisma.dailyReport.update({
        where: { id: existingReport.id },
        data: reportData,
      });
    }

    return this.prisma.dailyReport.create({
      data: reportData,
    });
  }

  async findAll(query: ReportQueryDto) {
    const { page = 1, pageSize = 10, startDate, endDate, line } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.reportDate.lt = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: { reportDate: 'desc' },
      }),
      this.prisma.dailyReport.count({ where }),
    ]);

    if (line) {
      for (const report of data as any[]) {
        if (Array.isArray(report.lineStats)) {
          report.lineStats = report.lineStats.filter(
            (stat: LineStat) => stat.line.includes(line),
          );
        }
        if (Array.isArray(report.areaStats)) {
          report.areaStats = report.areaStats.filter(
            (stat: AreaStat) => stat.area.includes(line),
          );
        }
      }
    }

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const report = await this.prisma.dailyReport.findUnique({
      where: { id },
    });
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    return report;
  }

  async findByDate(date: Date) {
    const reportDate = this.startOfDay(date);
    const report = await this.prisma.dailyReport.findUnique({
      where: { reportDate },
    });
    if (!report) {
      throw new NotFoundException(`Report for date ${date.toISOString().split('T')[0]} not found`);
    }
    return report;
  }

  async exportToExcel(query: ReportQueryDto): Promise<Buffer> {
    const result = await this.findAll({ ...query, page: 1, pageSize: 1000 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('运营报表');

    worksheet.columns = [
      { header: '报表日期', key: 'reportDate', width: 15 },
      { header: '总订单数', key: 'totalOrders', width: 12 },
      { header: '准时订单数', key: 'onTimeCount', width: 12 },
      { header: '准时率(%)', key: 'onTimeRate', width: 12 },
      { header: '温度合格订单数', key: 'tempQualifiedCount', width: 16 },
      { header: '温度合格率(%)', key: 'tempQualifiedRate', width: 14 },
      { header: '车辆利用率(%)', key: 'vehicleUtilization', width: 14 },
      { header: '总里程(km)', key: 'totalMileage', width: 12 },
      { header: '总油耗(L)', key: 'totalFuel', width: 12 },
      { header: '告警数量', key: 'alertCount', width: 12 },
    ];

    for (const row of result.data as any[]) {
      worksheet.addRow({
        reportDate: row.reportDate ? new Date(row.reportDate).toISOString().split('T')[0] : '',
        totalOrders: row.totalOrders,
        onTimeCount: row.onTimeCount,
        onTimeRate: (row.onTimeRate * 100).toFixed(2),
        tempQualifiedCount: row.tempQualifiedCount,
        tempQualifiedRate: (row.tempQualifiedRate * 100).toFixed(2),
        vehicleUtilization: (row.vehicleUtilization * 100).toFixed(2),
        totalMileage: row.totalMileage.toFixed(2),
        totalFuel: row.totalFuel.toFixed(2),
        alertCount: row.alertCount,
      });
    }

    const areaWorksheet = workbook.addWorksheet('区域统计');
    areaWorksheet.columns = [
      { header: '报表日期', key: 'reportDate', width: 15 },
      { header: '区域', key: 'area', width: 20 },
      { header: '订单数', key: 'orderCount', width: 12 },
      { header: '准时订单数', key: 'onTimeCount', width: 12 },
      { header: '准时率(%)', key: 'onTimeRate', width: 12 },
    ];

    for (const row of result.data as any[]) {
      const areaStats = row.areaStats as AreaStat[];
      if (areaStats && Array.isArray(areaStats)) {
        for (const stat of areaStats) {
          areaWorksheet.addRow({
            reportDate: row.reportDate ? new Date(row.reportDate).toISOString().split('T')[0] : '',
            area: stat.area,
            orderCount: stat.orderCount,
            onTimeCount: stat.onTimeCount,
            onTimeRate: (stat.onTimeRate * 100).toFixed(2),
          });
        }
      }
    }

    const lineWorksheet = workbook.addWorksheet('线路统计');
    lineWorksheet.columns = [
      { header: '报表日期', key: 'reportDate', width: 15 },
      { header: '线路', key: 'line', width: 30 },
      { header: '订单数', key: 'orderCount', width: 12 },
      { header: '准时订单数', key: 'onTimeCount', width: 12 },
      { header: '准时率(%)', key: 'onTimeRate', width: 12 },
      { header: '总里程(km)', key: 'totalMileage', width: 12 },
    ];

    for (const row of result.data as any[]) {
      const lineStats = row.lineStats as LineStat[];
      if (lineStats && Array.isArray(lineStats)) {
        for (const stat of lineStats) {
          lineWorksheet.addRow({
            reportDate: row.reportDate ? new Date(row.reportDate).toISOString().split('T')[0] : '',
            line: stat.line,
            orderCount: stat.orderCount,
            onTimeCount: stat.onTimeCount,
            onTimeRate: (stat.onTimeRate * 100).toFixed(2),
            totalMileage: stat.totalMileage.toFixed(2),
          });
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

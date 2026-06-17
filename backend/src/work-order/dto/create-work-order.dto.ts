import { WorkOrderType, AlertLevel } from '@prisma/client';

export class CreateWorkOrderDto {
  orderId?: number;
  type: WorkOrderType;
  title: string;
  description?: string;
  priority: AlertLevel;
  deadline?: Date;
  alertId?: number;
}

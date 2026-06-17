import { WorkOrderStatus } from '@prisma/client';

export class ProcessWorkOrderDto {
  status?: WorkOrderStatus;
  assigneeId?: number;
  remark?: string;
}

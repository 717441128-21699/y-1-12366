import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ProcessWorkOrderDto } from './dto/process-work-order.dto';
import { WorkOrderStatus, AlertLevel, WorkOrderType } from '@prisma/client';

@Controller('work-orders')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Post()
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrderService.create(createWorkOrderDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
    @Query('status') status?: WorkOrderStatus,
    @Query('priority') priority?: AlertLevel,
    @Query('assigneeId') assigneeId?: string,
    @Query('type') type?: WorkOrderType,
  ) {
    return this.workOrderService.findAll(
      parseInt(page),
      parseInt(pageSize),
      status,
      priority,
      assigneeId ? parseInt(assigneeId) : undefined,
      type,
    );
  }

  @Get('assignee/:assigneeId')
  findByAssignee(
    @Param('assigneeId') assigneeId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.workOrderService.findByAssignee(
      parseInt(assigneeId),
      parseInt(page),
      parseInt(pageSize),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrderService.findOne(parseInt(id));
  }

  @Patch(':id/process')
  process(
    @Param('id') id: string,
    @Body() processWorkOrderDto: ProcessWorkOrderDto,
  ) {
    return this.workOrderService.process(
      parseInt(id),
      processWorkOrderDto,
    );
  }

  @Patch(':id/assign/:assigneeId')
  assign(
    @Param('id') id: string,
    @Param('assigneeId') assigneeId: string,
  ) {
    return this.workOrderService.assignWorkOrder(
      parseInt(id),
      parseInt(assigneeId),
    );
  }

  @Patch(':id/escalate')
  escalate(@Param('id') id: string) {
    return this.workOrderService.escalate(parseInt(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; priority?: AlertLevel; type?: WorkOrderType },
  ) {
    return this.workOrderService.update(parseInt(id), body);
  }

  @Post('check-escalation')
  checkEscalation() {
    return this.workOrderService.checkAndEscalateOverdue();
  }
}

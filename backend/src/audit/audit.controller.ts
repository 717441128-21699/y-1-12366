import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditStatus } from '@prisma/client';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('status') status?: string,
  ) {
    return this.auditService.findAll(
      parseInt(page) || 1,
      parseInt(pageSize) || 10,
      status as AuditStatus,
    );
  }

  @Get('stats')
  getStats() {
    return this.auditService.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(+id);
  }

  @Post(':id/process')
  process(@Param('id') id: string, @Body() body: { assigneeId: number }) {
    return this.auditService.process(+id, body.assigneeId);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body() body: { reviewedBy: number; conclusion: string; findings?: string },
  ) {
    return this.auditService.confirm(+id, body.reviewedBy, body.conclusion, body.findings);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reviewedBy: number; conclusion: string; findings?: string },
  ) {
    return this.auditService.reject(+id, body.reviewedBy, body.conclusion, body.findings);
  }

  @Post('batch')
  batchAudit(@Body() body: { transportLogIds: number[] }) {
    return this.auditService.batchAudit(body.transportLogIds);
  }
}

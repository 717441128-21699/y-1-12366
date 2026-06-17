import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, Res, HttpStatus } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { Response } from 'express';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('generate')
  generateReport(@Body('date') date: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.reportService.generateDailyReport(reportDate);
  }

  @Get()
  findAll(@Query() query: ReportQueryDto) {
    return this.reportService.findAll(query);
  }

  @Get('export')
  async exportExcel(@Query() query: ReportQueryDto, @Res() res: Response) {
    const buffer = await this.reportService.exportToExcel(query);
    const fileName = `运营报表_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.status(HttpStatus.OK).send(buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportService.findOne(id);
  }

  @Get('date/:date')
  findByDate(@Param('date') date: string) {
    return this.reportService.findByDate(new Date(date));
  }
}

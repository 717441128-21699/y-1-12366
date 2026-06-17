export class ReportQueryDto {
  startDate?: Date;
  endDate?: Date;
  lineId?: number;
  line?: string;
  page?: number = 1;
  pageSize?: number = 10;
}

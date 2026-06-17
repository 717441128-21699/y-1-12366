export class ReportQueryDto {
  startDate?: Date;
  endDate?: Date;
  lineId?: number;
  page?: number = 1;
  pageSize?: number = 10;
}

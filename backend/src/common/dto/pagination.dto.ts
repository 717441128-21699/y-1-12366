export class PaginationDto {
  page: number = 1;
  pageSize: number = 10;
}

export class PaginatedResultDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

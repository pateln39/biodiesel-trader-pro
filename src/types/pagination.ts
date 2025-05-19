
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

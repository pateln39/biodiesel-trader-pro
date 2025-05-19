
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  totalCount: number; // Added for compatibility with existing components
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

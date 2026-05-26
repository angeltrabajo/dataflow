/**
 * Pagination parameters for list queries.
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated result wrapper.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

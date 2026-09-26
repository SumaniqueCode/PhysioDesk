// Mirror of the backend Page[T] envelope; reused by every paginated list.
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

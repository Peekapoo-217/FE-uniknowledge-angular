export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface CursorPagedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

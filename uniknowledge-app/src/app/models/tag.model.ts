export interface TagDetail {
  tagId: number;
  tagName: string;
  description?: string;
  questionCount: number;
}

export interface CreateTagRequest {
  tagName: string;
  description?: string;
}

export interface UpdateTagRequest {
  tagName?: string;
  description?: string;
}

export interface TagFilterDto {
  tagIds?: number[];
  logic?: 'AND' | 'OR';
  limit?: number;
  after?: string;
}

export interface FilteredQuestionsResponse {
  items: any[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string;
  };
}


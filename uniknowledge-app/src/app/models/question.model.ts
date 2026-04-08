export interface Tag {
  tagId: number;
  tagName: string;
}

export interface UserSummary {
  username: string;
  avatarUrl?: string;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
}

export interface QuestionSummary {
  questionId: number;
  title: string;
  content: string; // Truncated
  viewCount: number;
  status: string;
  imageUrl?: string;
  fileUrl?: string;
  codeLanguage?: string;
  codeLineCount: number;
  createdAt: string;
  updatedAt?: string;
  user: UserSummary;
  category?: CategorySummary;
  tags: Tag[];
  answerCount: number;
  voteCount: number;
  hasAcceptedAnswer: boolean;
}

export interface Question extends Omit<QuestionSummary, 'content' | 'user' | 'category'> {
  content: string; // Full content
  userId: number;
  username: string;
  avatarUrl?: string;
  categoryId?: number;
  categoryName?: string;
  codeContent?: string; // Optional, loaded lazily if long
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
  categoryId: number;
  tagIds: number[];
  imageUrl?: string;
  fileUrl?: string;
  codeContent?: string;
  codeLanguage?: string;
}

export interface UpdateQuestionRequest {
  title?: string;
  content?: string;
  categoryId?: number;
  tagIds?: number[];
  imageUrl?: string;
  fileUrl?: string;
  codeContent?: string;
  codeLanguage?: string;
  status?: string;
}

export interface Answer {
  answerId: number;
  questionId: number;
  content: string;
  codeContent?: string;
  codeLanguage?: string;
  codeLineCount: number;
  isAccepted: boolean;
  createdAt: Date;
  updatedAt?: Date;
  userId: number;
  username: string;
  avatarUrl?: string;
  voteCount: number;
  parentId?: number;
}

export interface CreateAnswerRequest {
  content: string;
  codeContent?: string;
  codeLanguage?: string;
  parentId?: number;
}

export interface UpdateAnswerRequest {
  content: string;
  codeContent?: string;
  codeLanguage?: string;
}


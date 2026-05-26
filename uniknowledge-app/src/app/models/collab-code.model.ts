export interface UserPresence {
  userId: number;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  connectionId: string;
}

export interface RemoteCursor {
  userId: number;
  username: string;
  lineNumber: number;
  column: number;
  connectionId?: string;
}

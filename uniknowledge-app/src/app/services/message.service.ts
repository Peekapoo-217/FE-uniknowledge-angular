import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message, Conversation } from '../models/message.model';
import { CursorPagedResult } from '../models/cursor-pagination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/messages`;

  getConversations(limit: number = 20, after?: string): Observable<CursorPagedResult<Conversation>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (after) params = params.set('after', after);
    return this.http.get<CursorPagedResult<Conversation>>(`${this.apiUrl}/conversations`, { params });
  }

  getConversation(otherUserId: number, limit: number = 50, after?: string): Observable<CursorPagedResult<Message>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (after) params = params.set('after', after);
    return this.http.get<CursorPagedResult<Message>>(`${this.apiUrl}/conversation/${otherUserId}`, { params });
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(messageId: number): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${messageId}/read`, {});
  }

  sendMessage(receiverId: number, content: string): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, {
      receiverId,
      content
    });
  }
}

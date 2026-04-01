import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Answer, CreateAnswerRequest, UpdateAnswerRequest } from '../models/answer.model';
import { CursorPagedResult } from '../models/cursor-pagination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnswerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAnswersByQuestionId(questionId: number, limit: number = 20, after?: string): Observable<CursorPagedResult<Answer>> {
    let params: any = { limit: limit.toString() };
    if (after) params.after = after;
    return this.http.get<CursorPagedResult<Answer>>(`${this.apiUrl}/questions/${questionId}/answers`, { params });
  }

  createAnswer(questionId: number, answer: CreateAnswerRequest): Observable<Answer> {
    return this.http.post<Answer>(`${this.apiUrl}/questions/${questionId}/answers`, answer);
  }

  updateAnswer(id: number, answer: UpdateAnswerRequest): Observable<Answer> {
    return this.http.put<Answer>(`${this.apiUrl}/answers/${id}`, answer);
  }

  deleteAnswer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/answers/${id}`);
  }

  acceptAnswer(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/answers/${id}/accept`, {});
  }
}

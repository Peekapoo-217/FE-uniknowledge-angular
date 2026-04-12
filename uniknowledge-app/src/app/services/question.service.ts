import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question, QuestionSummary, CreateQuestionRequest, UpdateQuestionRequest } from '../models/question.model';
import { CursorPagedResult } from '../models/cursor-pagination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/questions`;

  getQuestions(
    search?: string,
    categoryId?: number,
    tagId?: number,
    status?: string,
    limit: number = 20,
    after?: string,
    unansweredOnly: boolean = false
  ): Observable<CursorPagedResult<QuestionSummary>> {
    let params = new HttpParams()
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId.toString());
    if (tagId) params = params.set('tagId', tagId.toString());
    if (status) params = params.set('status', status);
    if (after) params = params.set('after', after);
    if (unansweredOnly) params = params.set('unansweredOnly', 'true');

    return this.http.get<CursorPagedResult<QuestionSummary>>(this.apiUrl, { params });
  }

  getQuestionById(id: number): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${id}`);
  }

  getQuestionCode(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${id}/code`, { responseType: 'text' });
  }

  createQuestion(question: CreateQuestionRequest): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  updateQuestion(id: number, question: UpdateQuestionRequest): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, question);
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { observe: 'body' });
  }
}

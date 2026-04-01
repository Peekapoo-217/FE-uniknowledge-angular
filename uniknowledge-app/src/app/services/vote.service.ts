import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VoteRequest } from '../models/vote.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  voteQuestion(questionId: number, voteType: 'upvote' | 'downvote'): Observable<{ message: string }> {
    const voteTypeValue = voteType === 'upvote' ? 1 : -1;
    const request: VoteRequest = { VoteType: voteTypeValue };
    return this.http.post<{ message: string }>(`${this.apiUrl}/questions/${questionId}/vote`, request);
  }

  voteAnswer(answerId: number, voteType: 'upvote' | 'downvote'): Observable<{ message: string }> {
    const voteTypeValue = voteType === 'upvote' ? 1 : -1;
    const request: VoteRequest = { VoteType: voteTypeValue };
    return this.http.post<{ message: string }>(`${this.apiUrl}/answers/${answerId}/vote`, request);
  }

  removeVoteQuestion(questionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/questions/${questionId}/vote`);
  }

  removeVoteAnswer(answerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/answers/${answerId}/vote`);
  }
}


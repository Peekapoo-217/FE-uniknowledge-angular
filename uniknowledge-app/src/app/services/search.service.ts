import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QuestionSummary } from '../models/question.model';
import { environment } from '../../environments/environment';

export interface SearchFilter {
  keyword?: string;
  tag?: string;
  isSolved?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/search`;

  search(keyword: string): Observable<QuestionSummary[]> {
    return this.http.get<QuestionSummary[]>(this.apiUrl, {
      params: { q: keyword }
    });
  }

  advancedSearch(filter: SearchFilter): Observable<QuestionSummary[]> {
    return this.http.post<QuestionSummary[]>(`${this.apiUrl}/advanced`, filter);
  }

  reindexAll(): Observable<string> {
    return this.http.post(`${this.apiUrl}/reindex-all`, {}, { responseType: 'text' });
  }
}

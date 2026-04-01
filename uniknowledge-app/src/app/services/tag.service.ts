import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TagDetail, TagFilterDto, FilteredQuestionsResponse, CreateTagRequest, UpdateTagRequest } from '../models/tag.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tags`;

  getTags(search?: string): Observable<TagDetail[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<TagDetail[]>(this.apiUrl, { params });
  }

  getPopularTags(limit: number = 20): Observable<TagDetail[]> {
    return this.http.get<TagDetail[]>(`${this.apiUrl}/popular`, {
      params: { limit: limit.toString() }
    });
  }

  getTagById(id: number): Observable<TagDetail> {
    return this.http.get<TagDetail>(`${this.apiUrl}/${id}`);
  }

  suggestTags(query: string, limit: number = 10): Observable<TagDetail[]> {
    return this.http.get<TagDetail[]>(`${this.apiUrl}/suggest`, {
      params: { query, limit: limit.toString() }
    });
  }

  getTrendingTags(days: number = 7, limit: number = 20): Observable<TagDetail[]> {
    return this.http.get<TagDetail[]>(`${this.apiUrl}/trending`, {
      params: { days: days.toString(), limit: limit.toString() }
    });
  }

  filterQuestionsByTags(dto: TagFilterDto): Observable<FilteredQuestionsResponse> {
    return this.http.post<FilteredQuestionsResponse>(
      `${this.apiUrl}/questions/filter`, 
      dto
    );
  }

  createTag(data: CreateTagRequest): Observable<TagDetail> {
    return this.http.post<TagDetail>(this.apiUrl, data);
  }

  updateTag(id: number, data: UpdateTagRequest): Observable<TagDetail> {
    return this.http.put<TagDetail>(`${this.apiUrl}/${id}`, data);
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}


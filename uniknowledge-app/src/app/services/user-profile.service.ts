import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/user-profile.model';
import { Question } from '../models/question.model';
import { CursorPagedResult } from '../models/cursor-pagination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/userprofile`;

  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  getMyQuestions(limit: number = 20, after?: string): Observable<CursorPagedResult<Question>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (after) params = params.set('after', after);
    return this.http.get<CursorPagedResult<Question>>(`${this.apiUrl}/me/questions`, { params });
  }

  updateMyProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/me`, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/me/change-password`, data);
  }

  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${userId}`);
  }

  getUserQuestions(userId: number, limit: number = 20, after?: string): Observable<CursorPagedResult<Question>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (after) params = params.set('after', after);
    return this.http.get<CursorPagedResult<Question>>(`${this.apiUrl}/${userId}/questions`, { params });
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UserProfile>(`${this.apiUrl}/me/upload-avatar`, formData);
  }

  searchUsers(searchTerm: string, limit: number = 20): Observable<UserProfile[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }
    return this.http.get<UserProfile[]>(`${this.apiUrl}/search`, { params });
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  message: string;
  filePath: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/upload`;

  uploadQuestionAttachment(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/question-attachment`, formData);
  }

  deleteQuestionAttachment(filePath: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/question-attachment`, {
      params: { filePath }
    });
  }
}


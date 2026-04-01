import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { SignalRService } from './signalr.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private signalRService = inject(SignalRService);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Signals for reactive state management
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap({
        next: (response) => {
          this.handleAuthSuccess(response);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap({
        next: (response) => {
          this.handleAuthSuccess(response);
        }
      })
    );
  }

  async logout(): Promise<void> {
    // Disconnect SignalR
    try {
      await this.signalRService.disconnect();
    } catch (error) {
      console.error('Error disconnecting SignalR:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');

    if (!token) {
      return null;
    }

    // Check if token is expired before returning
    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  private handleAuthSuccess(response: AuthResponse): void {
    try {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      this.currentUser.set(response.user);
      this.isAuthenticated.set(true);

      // Connect to SignalR after successful login (fire and forget)
      this.signalRService.connect(response.token).catch(error => {
        console.error('Failed to connect to SignalR:', error);
      });
    } catch (error) {
      // Handle storage error silently
    }
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        this.logout();
        return;
      }

      try {
        const user = JSON.parse(userJson);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);

        // Connect to SignalR if user is already logged in (fire and forget)
        this.signalRService.connect(token).catch(error => {
          console.error('Failed to connect to SignalR:', error);
        });
      } catch (error) {
        this.logout();
      }
    }
  }

  /**
   * Check if JWT token is expired
   * @param token JWT token string
   * @returns true if token is expired, false otherwise
   */
  isTokenExpired(token: string): boolean {
    try {
      // JWT token has 3 parts separated by dots: header.payload.signature
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Get expiration time (in seconds since epoch)
      const exp = payload.exp;

      // Convert to milliseconds and compare with current time
      const expirationTime = exp * 1000;
      const currentTime = Date.now();

      // Token is expired if current time is past expiration time
      return currentTime >= expirationTime;
    } catch (error) {
      // If we can't decode the token, consider it expired
      return true;
    }
  }

  /**
   * Get token expiration date/time as a readable string
   * @param token JWT token string
   * @returns Expiration date/time string
   */
  getTokenExpiration(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return new Date(exp).toLocaleString('vi-VN');
    } catch (error) {
      return 'Unknown';
    }
  }


  /**
   * Get remaining time until token expires
   * @param token JWT token string
   * @returns Time remaining as a readable string (e.g., "2 hours 30 minutes")
   */
  getTokenTimeRemaining(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const remaining = exp - currentTime;

      if (remaining <= 0) {
        return 'Expired';
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
      } else if (minutes > 0) {
        return `${minutes} phút ${seconds} giây`;
      } else {
        return `${seconds} giây`;
      }
    } catch (error) {
      return 'Unknown';
    }
  }
}

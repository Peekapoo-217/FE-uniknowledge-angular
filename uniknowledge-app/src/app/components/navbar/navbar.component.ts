import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { SignalRService } from '../../services/signalr.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  messageService = inject(MessageService);
  signalRService = inject(SignalRService);
  private router = inject(Router);

  isMenuOpen = false;
  isAdminMenuOpen = false;
  unreadCount = signal<number>(0);
  searchTerm = '';
  private messageSubscription?: Subscription;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadUnreadCount();

      // Subscribe to new messages to update unread count
      this.signalRService.messageReceived$.subscribe(() => {
        this.loadUnreadCount();
      });

      // Subscribe to message sent events to update unread count (for receiver)
      this.signalRService.messageSent$.subscribe(() => {
        this.loadUnreadCount();
      });

      // Subscribe to message read events to update unread count
      this.signalRService.messageRead$.subscribe(() => {
        this.loadUnreadCount();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount.set(response.unreadCount);
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) this.isAdminMenuOpen = false;
  }

  toggleAdminMenu(): void {
    this.isAdminMenuOpen = !this.isAdminMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.isAdminMenuOpen = false;
  }
  isAdmin(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'Admin';
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/'], { queryParams: { q: this.searchTerm } });
      this.searchTerm = '';
      this.isMenuOpen = false;
    }
  }

  goHome(): void {
    this.searchTerm = '';
    this.router.navigate(['/'], { queryParams: { q: null }, queryParamsHandling: 'merge' });
    this.isMenuOpen = false;
  }
}


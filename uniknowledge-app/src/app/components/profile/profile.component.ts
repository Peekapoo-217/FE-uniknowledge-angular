import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileService } from '../../services/user-profile.service';
import { QuestionService } from '../../services/question.service';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user-profile.model';
import { Question } from '../../models/question.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';
import { ProfileHeaderComponent } from '../shared/profile/profile-header/profile-header.component';
import { ProfileStatsComponent } from '../shared/profile/profile-stats/profile-stats.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ProfileHeaderComponent, ProfileStatsComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private userProfileService = inject(UserProfileService);
  private questionService = inject(QuestionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  profile = signal<UserProfile | null>(null);
  questions = signal<Question[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingQuestions = signal<boolean>(false);

  ngOnInit(): void {
    this.loadProfile();
    this.loadMyQuestions();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.userProfileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadMyQuestions(): void {
    this.isLoadingQuestions.set(true);
    this.userProfileService.getMyQuestions().subscribe({
      next: (result) => {
        this.questions.set(result.items);
        this.isLoadingQuestions.set(false);
      },
      error: () => {
        this.isLoadingQuestions.set(false);
      }
    });
  }

  deleteQuestion(question: Question): void {
    const dialogData: ConfirmationDialogData = {
      message: `Are you sure you want to delete "${question.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.questionService.deleteQuestion(question.questionId).subscribe({
          next: () => {
            this.loadMyQuestions();
          },
          error: (error) => {
            alert(error.error?.message || 'Failed to delete question');
          }
        });
      }
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'Hidden':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
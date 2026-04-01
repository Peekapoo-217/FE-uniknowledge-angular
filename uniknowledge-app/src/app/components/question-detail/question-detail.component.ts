import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { QuestionService } from '../../services/question.service';
import { AnswerService } from '../../services/answer.service';
import { VoteService } from '../../services/vote.service';
import { AuthService } from '../../services/auth.service';
import { Question } from '../../models/question.model';
import { Answer } from '../../models/answer.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../confirmation-dialog/confirmation-dialog.component';
import { VotingComponent } from '../shared/voting/voting.component';
import { AnswerListComponent } from '../shared/answer-list/answer-list.component';
import { AnswerFormComponent } from '../shared/answer-form/answer-form.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, VotingComponent, AnswerListComponent, AnswerFormComponent],
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.scss']
})
export class QuestionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private questionService = inject(QuestionService);
  private answerService = inject(AnswerService);
  private voteService = inject(VoteService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  question = signal<Question | null>(null);
  answers = signal<Answer[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadQuestion(parseInt(id));
      this.loadAnswers(parseInt(id));
    }
  }

  loadQuestion(id: number): void {
    this.isLoading.set(true);
    this.questionService.getQuestionById(id).subscribe({
      next: (question) => {
        this.question.set(question);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadAnswers(questionId: number): void {
    this.answerService.getAnswersByQuestionId(questionId).subscribe({
      next: (result) => {
        this.answers.set(result.items);
      }
    });
  }

  voteQuestion(voteType: 'upvote' | 'downvote'): void {
    const question = this.question();
    if (!question) return;

    this.voteService.voteQuestion(question.questionId, voteType).subscribe({
      next: () => {
        this.loadQuestion(question.questionId);
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to vote');
      }
    });
  }

  onQuestionUpvote(): void {
    this.voteQuestion('upvote');
  }

  onQuestionDownvote(): void {
    this.voteQuestion('downvote');
  }

  onAnswerUpvote(answerId: number): void {
    this.voteService.voteAnswer(answerId, 'upvote').subscribe({
      next: () => {
        const question = this.question();
        if (question) {
          this.loadAnswers(question.questionId);
        }
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to vote');
      }
    });
  }

  onAnswerDownvote(answerId: number): void {
    this.voteService.voteAnswer(answerId, 'downvote').subscribe({
      next: () => {
        const question = this.question();
        if (question) {
          this.loadAnswers(question.questionId);
        }
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to vote');
      }
    });
  }

  onSubmitAnswer(content: string): void {
    const question = this.question();
    if (!question) return;

    this.answerService.createAnswer(question.questionId, { content }).subscribe({
      next: () => {
        this.loadAnswers(question.questionId);
        this.loadQuestion(question.questionId);
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to submit answer');
      }
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFileName(fileUrl: string): string {
    try {
      let path: string;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        const url = new URL(fileUrl);
        path = url.pathname;
      } else {
        path = fileUrl;
      }

      const pathParts = path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      return fileName || 'attachment';
    } catch {
      const parts = fileUrl.split('/');
      return parts[parts.length - 1] || 'attachment';
    }
  }

  getFileUrl(fileUrl: string): string {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    const baseUrl = environment.baseUrl;
    return fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : `${baseUrl}/${fileUrl}`;
  }

  isOwner(): boolean {
    const question = this.question();
    const currentUser = this.authService.currentUser();
    return question !== null && currentUser !== null && question.userId === currentUser.userId;
  }

  canVoteQuestion(): boolean {
    const question = this.question();
    const currentUser = this.authService.currentUser();
    return this.authService.isAuthenticated() && question !== null && currentUser !== null && question.userId !== currentUser.userId;
  }

  deleteQuestion(): void {
    const question = this.question();
    if (!question) return;

    const dialogData: ConfirmationDialogData = {
      message: `Are you sure you want to delete "${question.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '480px',
      maxWidth: '90vw',
      data: dialogData,
      panelClass: 'confirmation-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.questionService.deleteQuestion(question.questionId).subscribe({
          next: () => {
            this.router.navigate(['/']);
          },
          error: (error) => {
            let errorMessage = 'Failed to delete question. Please try again.';
            if (error.status === 404) {
              errorMessage = error.error?.message || 'Question not found or you do not have permission to delete it.';
            } else if (error.status === 401) {
              errorMessage = 'You are not authenticated. Please login again.';
            } else if (error.status === 403) {
              errorMessage = 'You do not have permission to delete this question.';
            } else if (error.error?.message) {
              errorMessage = error.error.message;
            }
            alert(errorMessage);
          }
        });
      }
    });
  }
}

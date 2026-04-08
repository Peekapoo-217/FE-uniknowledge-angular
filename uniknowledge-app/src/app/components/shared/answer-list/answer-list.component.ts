import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Answer } from '../../../models/answer.model';
import { AnswerItemComponent } from '../answer-item/answer-item.component';

@Component({
    selector: 'app-answer-list',
    standalone: true,
    imports: [CommonModule, AnswerItemComponent],
    templateUrl: './answer-list.component.html',
    styleUrls: ['./answer-list.component.scss']
})
export class AnswerListComponent {
    answers = input.required<Answer[]>();
    answerCount = input.required<number>();
    currentUserId = input<number | null>(null);
    isAuthenticated = input<boolean>(false);

    // Group answers by parentId
    topLevelAnswers = computed(() => this.answers().filter(a => !a.parentId));
    
    getRepliesFor(parentId: number): Answer[] {
        return this.answers().filter(a => a.parentId === parentId);
    }

    submitReply = output<{ content: string, codeContent?: string, codeLanguage?: string, parentId: number }>();

    upvote = output<number>();
    downvote = output<number>();

    onUpvote(answerId: number): void {
        this.upvote.emit(answerId);
    }

    onDownvote(answerId: number): void {
        this.downvote.emit(answerId);
    }

    canVote(answer: Answer): boolean {
        return this.isAuthenticated() && this.currentUserId() !== answer.userId;
    }
}

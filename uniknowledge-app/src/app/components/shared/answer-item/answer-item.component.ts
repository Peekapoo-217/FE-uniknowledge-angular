import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Answer } from '../../../models/answer.model';
import { VotingComponent } from '../voting/voting.component';
import { AnswerFormComponent } from '../answer-form/answer-form.component';

import { TimeAgoPipe } from '../pipes/time-ago.pipe';
import { CodeEditorComponent } from '../code-editor/code-editor.component';


@Component({
    selector: 'app-answer-item',
    standalone: true,
    imports: [CommonModule, VotingComponent, TimeAgoPipe, CodeEditorComponent, AnswerFormComponent],
    templateUrl: './answer-item.component.html',
    styleUrls: ['./answer-item.component.scss']
})
export class AnswerItemComponent {
    answer = input.required<Answer>();
    replies = input<Answer[]>([]);
    showVoteButtons = input<boolean>(true);
    isAuthenticated = input<boolean>(false);
    isReply = input<boolean>(false);

    upvote = output<number>();
    downvote = output<number>();
    submitReply = output<{ content: string, codeContent?: string, codeLanguage?: string, parentId: number }>();

    isReplyFormVisible = signal<boolean>(false);

    toggleReplyForm(): void {
        this.isReplyFormVisible.update(v => !v);
    }

    onReplySubmit(event: { content: string, codeContent?: string, codeLanguage?: string }): void {
        this.submitReply.emit({
            ...event,
            parentId: this.answer().answerId
        });
        this.isReplyFormVisible.set(false);
    }

    onUpvote(): void {
        this.upvote.emit(this.answer().answerId);
    }

    onDownvote(): void {
        this.downvote.emit(this.answer().answerId);
    }


}

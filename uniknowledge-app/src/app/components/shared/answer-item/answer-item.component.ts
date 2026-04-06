import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Answer } from '../../../models/answer.model';
import { VotingComponent } from '../voting/voting.component';

import { TimeAgoPipe } from '../pipes/time-ago.pipe';

@Component({
    selector: 'app-answer-item',
    standalone: true,
    imports: [CommonModule, VotingComponent, TimeAgoPipe],
    templateUrl: './answer-item.component.html',
    styleUrls: ['./answer-item.component.scss']
})
export class AnswerItemComponent {
    answer = input.required<Answer>();
    showVoteButtons = input<boolean>(true);

    upvote = output<number>();
    downvote = output<number>();

    onUpvote(): void {
        this.upvote.emit(this.answer().answerId);
    }

    onDownvote(): void {
        this.downvote.emit(this.answer().answerId);
    }


}

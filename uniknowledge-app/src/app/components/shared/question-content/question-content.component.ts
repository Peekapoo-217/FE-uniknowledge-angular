import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Question, QuestionSummary } from '../../../models/question.model';

import { TimeAgoPipe } from '../pipes/time-ago.pipe';

@Component({
    selector: 'app-question-content',
    standalone: true,
    imports: [CommonModule, RouterLink, TimeAgoPipe],
    templateUrl: './question-content.component.html',
    styleUrls: ['./question-content.component.scss']
})
export class QuestionContentComponent {
    question = input.required<QuestionSummary>();
    tagClick = output<number>();



    onTagClick(tagId: number): void {
        this.tagClick.emit(tagId);
    }
}

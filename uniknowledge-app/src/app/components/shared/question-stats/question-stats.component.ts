import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, QuestionSummary } from '../../../models/question.model';

@Component({
    selector: 'app-question-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './question-stats.component.html',
    styleUrls: ['./question-stats.component.scss']
})
export class QuestionStatsComponent {
    question = input.required<QuestionSummary>();
}

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, QuestionSummary } from '../../../models/question.model';
import { QuestionStatsComponent } from '../question-stats/question-stats.component';
import { QuestionContentComponent } from '../question-content/question-content.component';

@Component({
  selector: 'app-question-item',
  standalone: true,
  imports: [CommonModule, QuestionStatsComponent, QuestionContentComponent],
  templateUrl: './question-item.component.html',
  styleUrls: ['./question-item.component.scss']
})
export class QuestionItemComponent {
  question = input.required<QuestionSummary>();
  tagClick = output<number>();

  onTagClick(tagId: number): void {
    this.tagClick.emit(tagId);
  }
}

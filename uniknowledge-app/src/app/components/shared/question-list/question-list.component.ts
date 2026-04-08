import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question, QuestionSummary } from '../../../models/question.model';
import { QuestionItemComponent } from '../question-item/question-item.component';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule, QuestionItemComponent],
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.scss']
})
export class QuestionListComponent {
  questions = input.required<QuestionSummary[]>();
  tagClick = output<number>();

  onTagClick(tagId: number): void {
    this.tagClick.emit(tagId);
  }
}

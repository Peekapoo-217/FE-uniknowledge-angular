import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { QuestionService } from '../../services/question.service';
import { CategoryService } from '../../services/category.service';
import { TagService } from '../../services/tag.service';
import { Question, QuestionSummary } from '../../models/question.model';
import { Category } from '../../models/category.model';
import { TagDetail } from '../../models/tag.model';
import { QuestionListComponent } from '../shared/question-list/question-list.component';
import { HomeSidebarComponent } from '../shared/home-sidebar/home-sidebar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, QuestionListComponent, HomeSidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private questionService = inject(QuestionService);
  private categoryService = inject(CategoryService);
  private tagService = inject(TagService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  questions = signal<QuestionSummary[]>([]);
  categories = signal<Category[]>([]);
  popularTags = signal<TagDetail[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);

  searchTerm = '';
  selectedCategoryId?: number;
  selectedTagIds = signal<number[]>([]);

  // Cursor pagination
  endCursor = signal<string | undefined>(undefined);
  hasNextPage = signal<boolean>(false);
  pageSize = 5;

  // Tag filter cursor
  tagFilterEndCursor = signal<string | undefined>(undefined);
  tagFilterHasNextPage = signal<boolean>(false);

  ngOnInit(): void {
    // Listen for search query parameter
    this.route.queryParamMap.subscribe(params => {
      const q = params.get('q');
      this.searchTerm = q || '';
      this.loadQuestions();
    });

    this.loadCategories();
    this.loadPopularTags();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    // Infinite scroll: load more when near bottom
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;
    const threshold = 200; // pixels from bottom

    if (scrollPosition >= documentHeight - threshold && !this.isLoading() && !this.isLoadingMore()) {
      if (this.selectedTagIds().length > 0) {
        if (this.tagFilterHasNextPage()) {
          this.loadMoreQuestionsWithMultipleTags();
        }
      } else {
        if (this.hasNextPage()) {
          this.loadMoreQuestions();
        }
      }
    }
  }

  loadQuestions(): void {
    this.isLoading.set(true);
    this.endCursor.set(undefined);
    this.questionService.getQuestions(
      this.searchTerm || undefined,
      this.selectedCategoryId,
      undefined,
      undefined,
      this.pageSize
    ).subscribe({
      next: (result) => {
        this.questions.set(result.items);
        this.endCursor.set(result.pageInfo.endCursor ?? undefined);
        this.hasNextPage.set(result.pageInfo.hasNextPage);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadMoreQuestions(): void {
    if (!this.hasNextPage() || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.questionService.getQuestions(
      this.searchTerm || undefined,
      this.selectedCategoryId,
      undefined,
      undefined,
      this.pageSize,
      this.endCursor()
    ).subscribe({
      next: (result) => {
        this.questions.update(current => [...current, ...result.items]);
        this.endCursor.set(result.pageInfo.endCursor ?? undefined);
        this.hasNextPage.set(result.pageInfo.hasNextPage);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more questions:', err);
        this.isLoadingMore.set(false);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadPopularTags(): void {
    this.tagService.getPopularTags(10).subscribe({
      next: (tags) => {
        this.popularTags.set(tags);
      },
      error: (err) => {
        console.error('Error loading popular tags:', err);
      }
    });
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchTerm } });
    } else {
      this.loadQuestions();
    }
  }

  onCategoryChange(categoryId: string): void {
    this.selectedCategoryId = categoryId ? parseInt(categoryId) : undefined;
    this.loadQuestions();
  }

  onTagClick(tagId: number): void {
    const currentTags = this.selectedTagIds();
    const index = currentTags.indexOf(tagId);

    if (index > -1) {
      this.selectedTagIds.set(currentTags.filter(id => id !== tagId));
    } else {
      this.selectedTagIds.set([...currentTags, tagId]);
    }

    this.loadQuestionsWithMultipleTags();
  }

  loadQuestionsWithMultipleTags(): void {
    const tagIds = this.selectedTagIds();

    if (tagIds.length === 0) {
      this.loadQuestions();
      return;
    }

    this.isLoading.set(true);
    this.tagFilterEndCursor.set(undefined);
    this.tagService.filterQuestionsByTags({
      tagIds: tagIds,
      logic: 'OR',
      limit: 20
    }).subscribe({
      next: (response) => {
        this.questions.set(response.items);
        this.tagFilterEndCursor.set(response.pageInfo.endCursor ?? undefined);
        this.tagFilterHasNextPage.set(response.pageInfo.hasNextPage);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading questions by tags:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadMoreQuestionsWithMultipleTags(): void {
    if (!this.tagFilterHasNextPage() || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.tagService.filterQuestionsByTags({
      tagIds: this.selectedTagIds(),
      logic: 'OR',
      limit: 20,
      after: this.tagFilterEndCursor()
    }).subscribe({
      next: (response) => {
        this.questions.update(current => [...current, ...response.items]);
        this.tagFilterEndCursor.set(response.pageInfo.endCursor ?? undefined);
        this.tagFilterHasNextPage.set(response.pageInfo.hasNextPage);
        this.isLoadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more questions by tags:', err);
        this.isLoadingMore.set(false);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = undefined;
    this.selectedTagIds.set([]);
    this.loadQuestions();
  }


}

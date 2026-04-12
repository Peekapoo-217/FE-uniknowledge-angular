import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, SearchFilter } from '../../services/search.service';
import { QuestionSummary } from '../../models/question.model';
import { QuestionListComponent } from '../shared/question-list/question-list.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, QuestionListComponent],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchService = inject(SearchService);

  questions = signal<QuestionSummary[]>([]);
  isLoading = signal<boolean>(false);
  
  // Filters
  searchTerm = '';
  selectedTag = '';
  isSolved: boolean | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['q'] || '';
      this.selectedTag = params['tag'] || '';
      this.isSolved = params['solved'] === 'true' ? true : (params['solved'] === 'false' ? false : null);
      
      if (this.searchTerm || this.selectedTag || this.isSolved !== null) {
        this.performSearch();
      }
    });
  }

  performSearch(): void {
    this.isLoading.set(true);
    
    const filter: SearchFilter = {
      keyword: this.searchTerm || undefined,
      tag: this.selectedTag || undefined,
      isSolved: this.isSolved !== null ? this.isSolved : undefined
    };

    this.searchService.advancedSearch(filter).subscribe({
      next: (results) => {
        this.questions.set(results);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    // Update URL query params, which will trigger the subscription in ngOnInit
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.searchTerm || null,
        tag: this.selectedTag || null,
        solved: this.isSolved === null ? null : this.isSolved.toString()
      },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedTag = '';
    this.isSolved = null;
    this.onFilterChange();
  }
}

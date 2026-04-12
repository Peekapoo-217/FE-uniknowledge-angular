import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { QuestionService } from '../../services/question.service';
import { CategoryService } from '../../services/category.service';
import { TagService } from '../../services/tag.service';
import { UploadService } from '../../services/upload.service';
import { Category } from '../../models/category.model';
import { TagDetail } from '../../models/tag.model';
import { environment } from '../../../environments/environment';
import { CodeEditorComponent } from '../shared/code-editor/code-editor.component';


@Component({
  selector: 'app-create-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CodeEditorComponent],
  templateUrl: './create-question.component.html',
  styleUrls: ['./create-question.component.scss']
})
export class CreateQuestionComponent implements OnInit {
  private fb = inject(FormBuilder);
  router = inject(Router);
  private questionService = inject(QuestionService);
  private categoryService = inject(CategoryService);
  private tagService = inject(TagService);
  private uploadService = inject(UploadService);

  questionForm: FormGroup;
  categories = signal<Category[]>([]);
  tags = signal<TagDetail[]>([]);
  selectedTags = signal<number[]>([]);
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  selectedFile: File | null = null;
  selectedFileName = signal<string>('');
  uploadedFilePath = signal<string | null>(null);
  uploadProgress = signal<number>(0);
  tagSearchQuery = signal<string>('');
  suggestedTags = signal<TagDetail[]>([]);
  isSearchingTags = signal<boolean>(false);
  showCodeEditor = signal<boolean>(false);

  constructor() {
    this.questionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(255)]],
      content: [''],
      categoryId: ['', [Validators.required]],
      imageUrl: [''],
      attachmentFile: [null],
      codeContent: [''],
      codeLanguage: ['javascript']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTags();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      }
    });
  }

  loadTags(): void {
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags.set(tags);
      }
    });
  }

  toggleTag(tagId: number): void {
    const tags = this.selectedTags();
    const index = tags.indexOf(tagId);
    if (index > -1) {
      this.selectedTags.set(tags.filter(id => id !== tagId));
    } else {
      this.selectedTags.set([...tags, tagId]);
    }
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTags().includes(tagId);
  }

  searchTags(): void {
    const query = this.tagSearchQuery();
    if (query.length < 2) {
      this.suggestedTags.set([]);
      return;
    }
    
    this.isSearchingTags.set(true);
    this.tagService.suggestTags(query, 10).subscribe({
      next: (tags) => {
        this.suggestedTags.set(tags);
        this.isSearchingTags.set(false);
      },
      error: () => {
        this.isSearchingTags.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.errorMessage.set('File size must be less than 10MB');
        input.value = '';
        this.selectedFile = null;
        this.selectedFileName.set('');
        return;
      }

      this.selectedFile = file;
      this.selectedFileName.set(file.name);
      this.errorMessage.set('');
    }
  }

  removeFile(): void {
    // Delete uploaded file from server if exists
    const filePath = this.uploadedFilePath();
    if (filePath) {
      this.uploadService.deleteQuestionAttachment(filePath).subscribe({
        error: (error) => {
          // Silently fail if delete fails
        }
      });
    }

    this.selectedFile = null;
    this.selectedFileName.set('');
    this.uploadedFilePath.set(null);
    this.uploadProgress.set(0);
    const fileInput = document.getElementById('attachmentFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async onSubmit(): Promise<void> {
    if (this.questionForm.invalid) {
      Object.keys(this.questionForm.controls).forEach(key => {
        this.questionForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.selectedTags().length === 0) {
      this.errorMessage.set('Please select at least one tag');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const formValue = this.questionForm.value;
      
      // Upload file first if file is selected and not yet uploaded
      let fileUrl: string | undefined = undefined;
      if (this.selectedFile && !this.uploadedFilePath()) {
        try {
          this.uploadProgress.set(10);
          const uploadResponse = await firstValueFrom(this.uploadService.uploadQuestionAttachment(this.selectedFile));
          fileUrl = uploadResponse.fileUrl; // Use fileUrl from server
          this.uploadedFilePath.set(uploadResponse.filePath);
          this.uploadProgress.set(100);
        } catch (uploadError: any) {
          this.isLoading.set(false);
          this.errorMessage.set(uploadError.error?.message || 'Failed to upload file. Please try again.');
          return;
        }
      } else if (this.uploadedFilePath()) {
        // File already uploaded, use the fileUrl
        const filePath = this.uploadedFilePath()!;
        fileUrl = `${environment.baseUrl}/${filePath}`;
      }

      const questionData = {
        title: formValue.title,
        content: formValue.content,
        categoryId: parseInt(formValue.categoryId),
        tagIds: this.selectedTags(),
        imageUrl: formValue.imageUrl?.trim() || undefined,
        fileUrl: fileUrl, // Send fileUrl to backend
        codeContent: formValue.codeContent?.trim() || undefined,
        codeLanguage: formValue.codeLanguage
      };

      this.questionService.createQuestion(questionData).subscribe({
        next: (question) => {
          this.isLoading.set(false);
          this.router.navigate(['/questions', question.questionId]);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to create question. Please try again.');
        }
      });
    } catch (error) {
      this.isLoading.set(false);
      this.errorMessage.set('Failed to process file. Please try again.');
    }
  }

  get title() {
    return this.questionForm.get('title');
  }

  get content() {
    return this.questionForm.get('content');
  }

  get categoryId() {
    return this.questionForm.get('categoryId');
  }
}

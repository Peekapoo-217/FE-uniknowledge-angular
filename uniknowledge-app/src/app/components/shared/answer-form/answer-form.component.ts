import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CodeEditorComponent } from '../code-editor/code-editor.component';


@Component({
    selector: 'app-answer-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CodeEditorComponent],
    templateUrl: './answer-form.component.html',
    styleUrls: ['./answer-form.component.scss']
})
export class AnswerFormComponent {
    private fb = inject(FormBuilder);

    answerForm: FormGroup;
    submitAnswer = output<{ content: string, codeContent?: string, codeLanguage?: string }>();
    showCodeEditor = signal<boolean>(false);

    constructor() {
        this.answerForm = this.fb.group({
            content: ['', [Validators.required]],
            codeContent: [''],
            codeLanguage: ['javascript']
        });
    }

    toggleCodeEditor(): void {
        this.showCodeEditor.update(v => !v);
        if (!this.showCodeEditor()) {
            this.answerForm.patchValue({ codeContent: '' });
        }
    }

    onSubmit(): void {
        if (this.answerForm.invalid) {
            this.answerForm.markAllAsTouched();
            return;
        }

        const { content, codeContent, codeLanguage } = this.answerForm.value;

        this.submitAnswer.emit({
            content,
            codeContent: this.showCodeEditor() && codeContent ? codeContent : undefined,
            codeLanguage: this.showCodeEditor() && codeContent ? codeLanguage : undefined
        });

        this.answerForm.reset({
            content: '',
            codeContent: '',
            codeLanguage: 'javascript'
        });
        this.showCodeEditor.set(false);
    }

    get content() {
        return this.answerForm.get('content');
    }
}

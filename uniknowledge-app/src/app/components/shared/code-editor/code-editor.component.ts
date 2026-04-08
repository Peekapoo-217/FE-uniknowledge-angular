import { Component, Input, Output, EventEmitter, OnInit, signal, effect, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { QuestionService } from '../../../services/question.service';
import { AnswerService } from '../../../services/answer.service';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule, MonacoEditorModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements OnInit, OnDestroy {
  @Input() value: string = '';
  @Input() language: string = 'javascript';
  @Input() readOnly: boolean = false;
  
  // Lazy loading inputs
  @Input() codeId: number | null = null;
  @Input() targetType: 'question' | 'answer' = 'question';
  @Input() lineCount: number = 0;

  @Output() valueChange = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();

  private questionService = inject(QuestionService);
  private answerService = inject(AnswerService);

  isCodeLoaded = signal<boolean>(true);
  isFetching = signal<boolean>(false);

  editorOptions: any = {};

  languages = [
    { label: 'C#', value: 'csharp' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'SQL', value: 'sql' },
    { label: 'HTML/CSS', value: 'html' }
  ];

  isDarkTheme = signal<boolean>(true);
  consoleOutput = signal<string[]>([]);
  isConsoleVisible = signal<boolean>(false);
  private _editorInstance: any = null;

  constructor() {
    effect(() => {
      const dark = this.isDarkTheme();
      this.editorOptions = this.buildOptions(dark);
    });
  }

  ngOnInit(): void {
    this.editorOptions = this.buildOptions(this.isDarkTheme());

    // Logic: If no value provided but we have context, and code is "long", set as not loaded
    if (!this.value && this.codeId && this.lineCount >= 20) {
      this.isCodeLoaded.set(false);
    } else {
      this.isCodeLoaded.set(true);
    }
  }

  loadCode(): void {
    if (!this.codeId || this.isFetching()) return;

    this.isFetching.set(true);
    const obs = this.targetType === 'question' 
      ? this.questionService.getQuestionCode(this.codeId)
      : this.answerService.getAnswerCode(this.codeId);

    obs.subscribe({
      next: (code) => {
        this.value = code;
        this.isCodeLoaded.set(true);
        this.isFetching.set(false);
        this.valueChange.emit(code);
      },
      error: () => {
        this.isFetching.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this._editorInstance = null;
  }

  private buildOptions(dark: boolean): any {
    return {
      theme: dark ? 'vs-dark' : 'vs',
      language: this.language || 'javascript',
      readOnly: this.readOnly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on' as const,
      folding: true,
      formatOnPaste: true,
      renderWhitespace: 'selection' as const,
      wordWrap: 'on' as const,
      padding: { top: 8, bottom: 8 }
    };
  }

  onEditorInit(editor: any): void {
    this._editorInstance = editor;
    // Force layout recalculation after mount
    setTimeout(() => {
      editor.layout();
    }, 150);
  }

  onCodeChange(value: string): void {
    this.valueChange.emit(value);
  }

  onLanguageChange(lang: string): void {
    this.language = lang;
    this.editorOptions = this.buildOptions(this.isDarkTheme());
    this.languageChange.emit(lang);
  }

  toggleTheme(): void {
    this.isDarkTheme.update(v => !v);
  }

  formatCode(): void {
    if (this._editorInstance) {
      this._editorInstance.getAction('editor.action.formatDocument')?.run();
    }
  }

  runCode(): void {
    this.isConsoleVisible.set(true);
    this.consoleOutput.set(['> Running...']);

    if (this.language === 'javascript') {
      this.executeJavaScript();
    } else {
      this.simulateExecution();
    }
  }

  private executeJavaScript(): void {
    const originalLog = console.log;
    const logs: string[] = ['> JavaScript Output:'];

    console.log = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      originalLog.apply(console, args);
    };

    try {
      const result = new Function(this.value)();
      if (result !== undefined) {
        logs.push(`→ Returned: ${JSON.stringify(result)}`);
      }
    } catch (err: any) {
      logs.push(`Error: ${err.message}`);
    } finally {
      console.log = originalLog;
      this.consoleOutput.set(logs);
    }
  }

  private simulateExecution(): void {
    const langName = this.languages.find(l => l.value === this.language)?.label || this.language;
    setTimeout(() => {
      this.consoleOutput.set([
        `> ${langName} Execution:`,
        `[Info] Browser-side execution is only available for JavaScript.`,
        `[Info] To compile ${langName}, a Remote Code Execution engine (e.g. Judge0) is needed.`,
        `[Info] The code snippet has been saved and can be viewed with syntax highlighting.`
      ]);
    }, 400);
  }

  clearConsole(): void {
    this.consoleOutput.set([]);
    this.isConsoleVisible.set(false);
  }
}

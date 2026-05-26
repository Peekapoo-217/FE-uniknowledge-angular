import { Component, Input, Output, EventEmitter, OnInit, signal, effect, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { QuestionService } from '../../../services/question.service';
import { AnswerService } from '../../../services/answer.service';
import { CollaborativeCodeService } from '../../../services/collaborative-code.service';
import { UserPresence, RemoteCursor } from '../../../models/collab-code.model';
import { Subscription, Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule, MonacoEditorModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
  providers: [CollaborativeCodeService]
})
export class CodeEditorComponent implements OnInit, OnDestroy {
  private _value: string = '';
  public _language: string = 'javascript';
  private _readOnly: boolean = false;

  @Input() 
  set value(v: string) { this._value = v; }
  get value(): string { return this._value; }

  @Input() 
  set language(l: string) {
    const newLang = l || 'javascript';
    // Defense Guard: Prevent circular snap-backs from top-down Angular change detection cycles
    if (this._language === newLang) return;
    this._language = newLang;
    this.updateOptions();
    
    // Dynamic Language Switching: Update Monaco model language context if already initialized
    if (this._editorInstance && (window as any).monaco) {
      const model = this._editorInstance.getModel();
      if (model) {
        (window as any).monaco.editor.setModelLanguage(model, this._language);
      }
    }
  }
  get language(): string { return this._language; }

  @Input() 
  set readOnly(r: boolean) {
    this._readOnly = r;
    this.updateOptions();
  }
  get readOnly(): boolean { return this._readOnly; }

  get isEditable(): boolean {
    return !this.readOnly || this.isCollabActive();
  }
  
  // Lazy loading inputs
  @Input() codeId: number | null = null;
  @Input() targetType: 'question' | 'answer' = 'question';
  @Input() lineCount: number = 0;
  @Input() roomId!: string;

  @Output() valueChange = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();

  private questionService = inject(QuestionService);
  private answerService = inject(AnswerService);
  private collabService = inject(CollaborativeCodeService);

  isCollabActive = signal<boolean>(false);
  onlineUsers = signal<UserPresence[]>([]);
  isApplyingRemoteChanges = false;

  private modelContentDisposable: any = null;
  private cursorPositionDisposable: any = null;
  private remoteDecorations = new Map<string, string[]>();

  private deltaSub?: Subscription;
  private presenceSub?: Subscription;
  private cursorSub?: Subscription;
  private localCursorSub?: Subscription;
  private localCursorSubject = new Subject<{ lineNumber: number; column: number }>();

  isCodeLoaded = signal<boolean>(true);
  isFetching = signal<boolean>(false);

  editorOptions: any = {};

  languages = [
    { label: 'C#', value: 'csharp' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'SQL', value: 'sql' },
    { label: 'HTML/CSS', value: 'html' },
    { label: 'Java', value: 'java' },
    { label: 'TypeScript', value: 'typescript' }
  ];

  isDarkTheme = signal<boolean>(true);
  consoleOutput = signal<string[]>([]);
  isConsoleVisible = signal<boolean>(false);
  private _editorInstance: any = null;

  constructor() {
    effect(() => {
      const dark = this.isDarkTheme();
      const collab = this.isCollabActive();
      // Ensure we track both theme and language changes
      this.updateOptions();
    });
  }

  ngOnInit(): void {
    this.updateOptions();

    if (!this.roomId && this.codeId) {
      this.roomId = `${this.targetType}_${this.codeId}`;
    }

    if (!this.value && this.codeId && this.lineCount >= 20) {
      this.isCodeLoaded.set(false);
    } else {
      this.isCodeLoaded.set(true);
    }
  }

  private updateOptions(): void {
    this.editorOptions = this.buildOptions(this.isDarkTheme());
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
    this.disconnectCollab();
    this.modelContentDisposable?.dispose();
    this.cursorPositionDisposable?.dispose();
    this._editorInstance = null;
  }

  private buildOptions(dark: boolean): any {
    return {
      theme: dark ? 'vs-dark' : 'vs',
      language: this.language,
      readOnly: this.readOnly && !this.isCollabActive(),
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
    this.registerMonacoListeners(editor);
    setTimeout(() => {
      editor.layout();
    }, 150);
  }

  onCodeChange(value: string): void {
    this.valueChange.emit(value);
  }

  onLanguageChange(lang: string): void {
    this._language = lang;
    this.updateOptions();
    
    // Explicitly update Monaco editor model language context immediately upon select interaction
    if (this._editorInstance && (window as any).monaco) {
      const model = this._editorInstance.getModel();
      if (model) {
        (window as any).monaco.editor.setModelLanguage(model, lang);
      }
    }
    
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

  toggleCollab(): void {
    if (this.isCollabActive()) {
      this.disconnectCollab();
    } else {
      this.connectCollab();
    }
  }

  async connectCollab(): Promise<void> {
    if (!this.roomId) {
      this.roomId = `${this.targetType}_${this.codeId || 'default'}`;
    }

    try {
      await this.collabService.connect(this.roomId);
      this.isCollabActive.set(true);
      this.subscribeToCollabStreams();
    } catch (err) {
      console.error('Failed to connect to collaboration session:', err);
    }
  }

  async disconnectCollab(): Promise<void> {
    if (!this.isCollabActive()) return;

    try {
      await this.collabService.disconnect(this.roomId);
    } catch (err) {
      console.error('Error disconnecting from collaboration session:', err);
    } finally {
      this.isCollabActive.set(false);
      this.onlineUsers.set([]);
      this.clearRemoteDecorations();
      this.unsubscribeFromCollabStreams();
    }
  }

  private subscribeToCollabStreams(): void {
    this.unsubscribeFromCollabStreams();

    // 1. Subscribe to remote deltas
    this.deltaSub = this.collabService.codeDeltaReceived$.subscribe((changes: any[]) => {
      if (!this._editorInstance || !changes) return;

      try {
        this.isApplyingRemoteChanges = true;
        const edits = changes.map(change => ({
          range: new (window as any).monaco.Range(
            change.range.startLineNumber,
            change.range.startColumn,
            change.range.endLineNumber,
            change.range.endColumn
          ),
          text: change.text,
          forceMoveMarkers: true
        }));

        this._editorInstance.executeEdits('remote-sync', edits);
      } catch (err) {
        console.error('Error applying remote changes:', err);
      } finally {
        this.isApplyingRemoteChanges = false;
      }
    });

    // 2. Subscribe to presence changes
    this.presenceSub = this.collabService.userPresenceChanged$.subscribe((presenceList: UserPresence[]) => {
      this.onlineUsers.set(presenceList);
    });

    // 3. Subscribe to remote cursor movements
    this.cursorSub = this.collabService.remoteCursorMoved$.subscribe((cursor: RemoteCursor) => {
      this.updateRemoteCursorDecoration(cursor);
    });

    // Production Hardening: Throttle local cursor updates to 150ms to prevent network congestion
    this.localCursorSub = this.localCursorSubject.pipe(
      throttleTime(150, undefined, { leading: true, trailing: true })
    ).subscribe((cursorData) => {
      if (this.isCollabActive()) {
        this.collabService.sendCursor(this.roomId, cursorData);
      }
    });
  }

  private unsubscribeFromCollabStreams(): void {
    this.deltaSub?.unsubscribe();
    this.presenceSub?.unsubscribe();
    this.cursorSub?.unsubscribe();
    this.localCursorSub?.unsubscribe();
  }

  private registerMonacoListeners(editor: any): void {
    const model = editor.getModel();
    if (model) {
      this.modelContentDisposable = model.onDidChangeContent((event: any) => {
        if (this.isApplyingRemoteChanges) {
          return;
        }

        if (this.isCollabActive()) {
          this.collabService.sendCodeDelta(this.roomId, event.changes);
        }
      });
    }

    this.cursorPositionDisposable = editor.onDidChangeCursorPosition((event: any) => {
      if (this.isCollabActive()) {
        const position = event.position;
        this.localCursorSubject.next({
          lineNumber: position.lineNumber,
          column: position.column
        });
      }
    });
  }

  private updateRemoteCursorDecoration(cursor: RemoteCursor): void {
    if (!this._editorInstance || !cursor.connectionId) return;

    const connectionId = cursor.connectionId;
    const oldDecorations = this.remoteDecorations.get(connectionId) || [];

    const range = new (window as any).monaco.Range(
      cursor.lineNumber,
      cursor.column,
      cursor.lineNumber,
      cursor.column
    );

    const newDecorations = [
      {
        range: range,
        options: {
          className: `remote-cursor-line remote-cursor-user-${cursor.userId}`,
          hoverMessage: { value: `**${cursor.username || 'Collaborator'}**` }
        }
      }
    ];

    const newDecorationIds = this._editorInstance.deltaDecorations(oldDecorations, newDecorations);
    this.remoteDecorations.set(connectionId, newDecorationIds);
  }

  private clearRemoteDecorations(): void {
    if (this._editorInstance) {
      for (const [_, decorationIds] of this.remoteDecorations.entries()) {
        this._editorInstance.deltaDecorations(decorationIds, []);
      }
    }
    this.remoteDecorations.clear();
  }
}

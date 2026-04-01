import { Component, OnInit, OnDestroy, inject, signal, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { SignalRService } from '../../services/signalr.service';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { UserProfileService } from '../../services/user-profile.service';
import { Message, Conversation, TypingIndicator, MessageStatus } from '../../models/message.model';
import { User } from '../../models/user.model';
import { UserProfile } from '../../models/user-profile.model';
import { MessageBubbleComponent } from '../shared/message-bubble/message-bubble.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageBubbleComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  signalRService = inject(SignalRService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLDivElement>;

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  selectedUserId = signal<number | null>(null);
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  isLoadingMore = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  typingUsers = signal<Set<number>>(new Set());
  messageContent = '';
  searchTerm = signal<string>('');
  searchResults = signal<UserProfile[]>([]);
  isSearching = signal<boolean>(false);
  showSearchResults = signal<boolean>(false);

  private subscriptions = new Subscription();
  private typingTimeout?: number;
  private typingDebounceTimeout?: number;
  private searchDebounceTimeout?: number;
  private shouldScrollToBottom = false;
  private messagesEndCursor?: string;
  private messagesHasNextPage = false;
  private readonly messageLimit = 50;

  constructor() {
    effect(() => {
      if (this.messages().length > 0) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.currentUser.set(this.authService.currentUser());

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const token = this.authService.getToken();
    if (token) {
      try {
        await this.signalRService.connect(token);
      } catch (error: any) {
        if (!error?.message?.includes('Unauthorized') && !error?.message?.includes('401') && !error?.message?.includes('403')) {
          console.error('Failed to connect to SignalR:', error);
        }
      }
    }

    this.loadConversations();

    this.route.params.subscribe(params => {
      if (params['userId']) {
        this.selectConversation(parseInt(params['userId']));
      }
    });

    this.subscriptions.add(
      this.signalRService.messageReceived$.subscribe(message => {
        this.handleMessageReceived(message);
      })
    );

    this.subscriptions.add(
      this.signalRService.messageSent$.subscribe(message => {
        this.handleMessageSent(message);
      })
    );

    this.subscriptions.add(
      this.signalRService.messageRead$.subscribe(data => {
        this.handleMessageRead(data);
      })
    );

    this.subscriptions.add(
      this.signalRService.typingStarted$.subscribe(indicator => {
        if (indicator.userId === this.selectedUserId()) {
          const users = new Set(this.typingUsers());
          users.add(indicator.userId);
          this.typingUsers.set(users);
        }
      })
    );

    this.subscriptions.add(
      this.signalRService.typingStopped$.subscribe(data => {
        if (data.userId === this.selectedUserId()) {
          const users = new Set(this.typingUsers());
          users.delete(data.userId);
          this.typingUsers.set(users);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    if (this.typingDebounceTimeout) {
      clearTimeout(this.typingDebounceTimeout);
    }
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.messageService.getConversations().subscribe({
      next: (result) => {
        this.conversations.set(result.items);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        this.isLoading.set(false);
      }
    });
  }

  async selectConversation(userId: number): Promise<void> {
    this.selectedUserId.set(userId);
    this.messages.set([]);
    this.messagesEndCursor = undefined;
    this.messagesHasNextPage = false;
    this.typingUsers.set(new Set());
    this.router.navigate(['/chat', userId]);
    await this.loadMessages();
    await this.markAllAsRead(userId);
  }

  loadMessages(): Promise<void> {
    const userId = this.selectedUserId();
    if (!userId) return Promise.resolve();

    this.isLoading.set(true);
    return new Promise((resolve, reject) => {
      this.messageService.getConversation(userId, this.messageLimit).subscribe({
        next: (result) => {
          this.messages.set(result.items);
          this.messagesEndCursor = result.pageInfo.endCursor ?? undefined;
          this.messagesHasNextPage = result.pageInfo.hasNextPage;
          this.isLoading.set(false);
          this.shouldScrollToBottom = true;
          resolve();
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.isLoading.set(false);
          reject(error);
        }
      });
    });
  }

  loadMoreMessages(): void {
    if (this.isLoadingMore() || !this.messagesHasNextPage) return;
    const userId = this.selectedUserId();
    if (!userId) return;

    this.isLoadingMore.set(true);
    this.messageService.getConversation(userId, this.messageLimit, this.messagesEndCursor).subscribe({
      next: (result) => {
        this.messages.update(current => [...result.items, ...current]);
        this.messagesEndCursor = result.pageInfo.endCursor ?? undefined;
        this.messagesHasNextPage = result.pageInfo.hasNextPage;
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoadingMore.set(false);
      }
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.messageContent.trim() || !this.selectedUserId()) return;

    const content = this.messageContent.trim();
    const receiverId = this.selectedUserId()!;
    this.messageContent = '';

    const tempMessage: Message = {
      messageId: Date.now(),
      senderId: this.currentUser()?.userId || 0,
      senderUsername: this.currentUser()?.username || '',
      senderAvatarUrl: this.currentUser()?.avatarUrl,
      receiverId: receiverId,
      receiverUsername: '',
      content: content,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    const currentMessages = this.messages();
    this.messages.set([...currentMessages, tempMessage]);
    this.shouldScrollToBottom = true;

    try {
      if (this.signalRService.isConnected()) {
        try {
          await this.signalRService.sendMessage(receiverId, content);
          await this.signalRService.stopTyping(receiverId);
        } catch {
          this.sendMessageViaHttp(receiverId, content, tempMessage);
        }
      } else {
        this.sendMessageViaHttp(receiverId, content, tempMessage);
      }
    } catch {
      this.sendMessageViaHttp(receiverId, content, tempMessage);
    }
  }

  private sendMessageViaHttp(receiverId: number, content: string, tempMessage: Message): void {
    this.messageService.sendMessage(receiverId, content).subscribe({
      next: (message) => {
        const currentMessages = this.messages();
        const updatedMessages = currentMessages.map(m =>
          m.messageId === tempMessage.messageId ? { ...message, status: 'sent' as MessageStatus } : m
        );
        this.messages.set(updatedMessages);
        this.handleMessageSent(message);
      },
      error: () => {
        const currentMessages = this.messages();
        const updatedMessages = currentMessages.filter(m => m.messageId !== tempMessage.messageId);
        this.messages.set(updatedMessages);
        this.messageContent = content;
      }
    });
  }

  onMessageInput(): void {
    const userId = this.selectedUserId();
    if (!userId) return;

    if (this.typingDebounceTimeout) {
      clearTimeout(this.typingDebounceTimeout);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingDebounceTimeout = window.setTimeout(async () => {
      if (this.messageContent.trim()) {
        await this.signalRService.startTyping(userId);
      }
    }, 300);

    this.typingTimeout = window.setTimeout(async () => {
      await this.signalRService.stopTyping(userId);
    }, 3000);
  }

  async onMessageInputBlur(): Promise<void> {
    const userId = this.selectedUserId();
    if (userId) {
      await this.signalRService.stopTyping(userId);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    if (this.typingDebounceTimeout) {
      clearTimeout(this.typingDebounceTimeout);
    }
  }

  handleMessageReceived(message: Message): void {
    const currentMessages = this.messages();

    if (message.senderId !== this.currentUser()?.userId) {
      this.playNotificationSound();
    }

    if (this.selectedUserId() === message.senderId || this.selectedUserId() === message.receiverId) {
      if (!currentMessages.some(m => m.messageId === message.messageId)) {
        this.messages.set([...currentMessages, { ...message, status: 'delivered' as MessageStatus }]);
        this.shouldScrollToBottom = true;
      }

      if (message.receiverId === this.currentUser()?.userId && !message.isRead) {
        this.markAsRead(message.messageId);
      }
    }

    this.loadConversations();
  }

  handleMessageSent(message: Message): void {
    const currentMessages = this.messages();

    const updatedMessages = currentMessages.map(m => {
      if (m.status === 'sending' && m.content === message.content && m.receiverId === message.receiverId) {
        return { ...message, status: 'sent' as MessageStatus };
      }
      if (m.messageId === message.messageId) {
        return { ...message, status: 'sent' as MessageStatus };
      }
      return m;
    });

    if (!updatedMessages.some(m => m.messageId === message.messageId)) {
      updatedMessages.push({ ...message, status: 'sent' as MessageStatus });
    }

    this.messages.set(updatedMessages);
    this.shouldScrollToBottom = true;
    this.loadConversations();
    setTimeout(() => {
      this.loadConversations();
    }, 300);
  }

  handleMessageRead(data: { messageId: number; readBy: number; readAt: string }): void {
    const currentMessages = this.messages();
    const updatedMessages = currentMessages.map(m => {
      if (m.messageId === data.messageId && m.senderId === data.readBy) {
        return { ...m, isRead: true, status: 'read' as MessageStatus };
      }
      return m;
    });
    this.messages.set(updatedMessages);
    this.loadConversations();
  }

  playNotificationSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch { }
  }

  async markAsRead(messageId: number): Promise<void> {
    const currentMessages = this.messages();
    const updatedMessages = currentMessages.map(msg => {
      if (msg.messageId === messageId) {
        return { ...msg, isRead: true, status: 'read' as MessageStatus };
      }
      return msg;
    });
    this.messages.set(updatedMessages);

    try {
      await this.signalRService.markAsRead(messageId);
      this.loadConversations();
    } catch {
      this.messageService.markAsRead(messageId).subscribe({
        next: () => {
          this.loadConversations();
        },
        error: (err) => console.error('Error marking message as read:', err)
      });
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    const currentMessages = this.messages();
    const currentUser = this.currentUser();

    if (!currentUser) return;

    // Find all unread messages from this user
    const unreadMessages = currentMessages.filter(
      msg => msg.senderId === userId &&
        msg.receiverId === currentUser.userId &&
        !msg.isRead
    );

    if (unreadMessages.length === 0) return;

    const updatedMessages = currentMessages.map(msg => {
      if (unreadMessages.some(um => um.messageId === msg.messageId)) {
        return { ...msg, isRead: true, status: 'read' as MessageStatus };
      }
      return msg;
    });
    this.messages.set(updatedMessages);

    const markPromises = unreadMessages.map(msg =>
      firstValueFrom(this.messageService.markAsRead(msg.messageId)).catch(() => { })
    );

    try {
      await Promise.all(markPromises);
      this.loadConversations();
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  }

  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUser()?.userId;
  }

  getConversationName(conversation: Conversation): string {
    return conversation.otherUsername;
  }

  getConversationAvatar(conversation: Conversation): string {
    if (conversation.otherAvatarUrl) {
      return conversation.otherAvatarUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.otherUsername)}&background=2196f3&color=fff&size=128`;
  }

  formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (messageDate.getTime() === today.getTime()) {
      return timeString;
    }

    if (messageDate.getTime() === yesterday.getTime()) {
      return `Hôm qua ${timeString}`;
    }

    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return `${dateStr} ${timeString}`;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const term = input.value.trim();
    this.searchTerm.set(term);

    // Clear existing debounce timeout
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }

    if (term.length >= 2) {
      // Debounce search - wait 300ms after user stops typing
      this.searchDebounceTimeout = window.setTimeout(() => {
        this.searchUsers(term);
      }, 300);
      this.showSearchResults.set(true);
    } else {
      this.searchResults.set([]);
      this.showSearchResults.set(false);
      this.isSearching.set(false);
    }
  }

  searchUsers(term: string): void {
    if (term.length < 2) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      return;
    }

    this.isSearching.set(true);
    this.userProfileService.searchUsers(term, 10).subscribe({
      next: (users) => {
        this.searchResults.set(users);
        this.isSearching.set(false);
      },
      error: () => {
        this.isSearching.set(false);
        this.searchResults.set([]);
      }
    });
  }

  selectUserFromSearch(user: UserProfile): void {
    const existingConversation = this.conversations().find(c => c.otherUserId === user.userId);

    if (!existingConversation) {
      const tempConversation: Conversation = {
        otherUserId: user.userId,
        otherUsername: user.username,
        otherAvatarUrl: user.avatarUrl,
        lastMessage: undefined,
        lastMessageTime: undefined,
        unreadCount: 0,
        isLastMessageFromMe: false
      };
      this.conversations.set([tempConversation, ...this.conversations()]);
    }

    this.selectConversation(user.userId);
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
  }

  getUserAvatar(user: UserProfile): string {
    if (user.avatarUrl) {
      return user.avatarUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=2196f3&color=fff&size=128`;
  }

  onSearchBlur(): void {
    setTimeout(() => {
      if (!this.searchContainer?.nativeElement.contains(document.activeElement)) {
        this.showSearchResults.set(false);
      }
    }, 200);
  }
}


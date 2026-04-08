# UniKnowledge Frontend - Tài Liệu Hệ Thống

> **Framework:** Angular 20 (Standalone Components)  
> **UI Library:** Angular Material 20 + TailwindCSS 3  
> **Real-time:** @microsoft/signalr 10  
> **State Management:** Angular Signals  
> **Language:** TypeScript 5.9

---

## 📁 Cấu Trúc Thư Mục

```
FE/uniknowledge-app/
├── src/
│   ├── app/
│   │   ├── components/           # 19 Feature Components
│   │   │   ├── admin-categories/ # Quản lý danh mục (Admin)
│   │   │   ├── admin-tags/       # Quản lý tags (Admin)
│   │   │   ├── categories/       # Xem danh sách danh mục
│   │   │   ├── chat/             # Nhắn tin real-time
│   │   │   ├── confirmation-dialog/ # Dialog xác nhận (shared)
│   │   │   ├── create-question/  # Tạo câu hỏi mới
│   │   │   ├── edit-profile/     # Chỉnh sửa hồ sơ
│   │   │   ├── edit-question/    # Chỉnh sửa câu hỏi
│   │   │   ├── forgot-password/  # Quên mật khẩu
│   │   │   ├── home/             # Trang chủ - danh sách câu hỏi
│   │   │   ├── login/            # Đăng nhập
│   │   │   ├── navbar/           # Thanh điều hướng
│   │   │   ├── not-found/        # Trang 404
│   │   │   ├── profile/          # Hồ sơ cá nhân
│   │   │   ├── question-detail/  # Chi tiết câu hỏi + answers + votes
│   │   │   ├── register/         # Đăng ký
│   │   │   ├── reset-password/   # Đặt lại mật khẩu
│   │   │   ├── shared/           # Components dùng chung
│   │   │   │   ├── pipes/        # Custom Pipes (`time-ago.pipe.ts`)
│   │   │   │   └── ...
│   │   │   └── tags/             # Xem danh sách tags
│   │   ├── guards/               # Route Guards
│   │   │   ├── auth.guard.ts     # Kiểm tra đăng nhập
│   │   │   └── admin.guard.ts    # Kiểm tra quyền Admin
│   │   ├── interceptors/         # HTTP Interceptors
│   │   │   └── auth.interceptor.ts # Tự động gắn JWT token
│   │   ├── models/               # TypeScript Interfaces (8 files)
│   │   │   ├── answer.model.ts
│   │   │   ├── category.model.ts
│   │   │   ├── message.model.ts
│   │   │   ├── question.model.ts
│   │   │   ├── tag.model.ts
│   │   │   ├── user-profile.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── vote.model.ts
│   │   ├── services/             # API Services (11 files)
│   │   │   ├── answer.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── message.service.ts
│   │   │   ├── password-reset.service.ts
│   │   │   ├── question.service.ts
│   │   │   ├── signalr.service.ts
│   │   │   ├── tag.service.ts
│   │   │   ├── upload.service.ts
│   │   │   ├── user-profile.service.ts
│   │   │   └── vote.service.ts
│   │   ├── app.config.ts         # App configuration
│   │   ├── app.routes.ts         # Route definitions
│   │   ├── app.ts                # Root component
│   │   ├── app.html              # Root template
│   │   └── app.scss              # Root styles
│   ├── environments/
│   │   ├── environment.ts        # Dev config
│   │   └── environment.prod.ts   # Prod config
│   ├── index.html
│   ├── main.ts
│   └── styles.scss               # Global styles
├── angular.json
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

---

## 📦 Dependencies

### Production
| Package | Version | Mục đích |
|---------|---------|----------|
| `@angular/core` | ^20.3.0 | Angular framework |
| `@angular/material` | ^20.2.14 | UI Component Library |
| `@angular/cdk` | ^20.2.14 | Component Dev Kit |
| `@angular/animations` | ^20.0.5 | Animation support |
| `@angular/forms` | ^20.3.0 | Form handling |
| `@angular/router` | ^20.3.0 | Client-side routing |
| `@microsoft/signalr` | ^10.0.0 | Real-time WebSocket |
| `monaco-editor` | ^0.55.1 | Code Editor Core |
| `ngx-monaco-editor-v2` | ^21.1.4 | Angular Monaco wrapper |
| `rxjs` | ~7.8.0 | Reactive programming |

### Development
| Package | Version | Mục đích |
|---------|---------|----------|
| `tailwindcss` | ^3.3.0 | Utility-first CSS |
| `typescript` | ~5.9.2 | TypeScript compiler |
| `karma` + `jasmine` | | Unit testing |

---

## 🔧 Configuration

### Environment (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5134/api',
  signalRUrl: 'http://localhost:5134/hubs/chat'
};
```

### App Config (`app.config.ts`)
```typescript
providers: [
  provideBrowserGlobalErrorListeners(),
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes),
  provideHttpClient(withInterceptors([authInterceptor])),
  provideAnimationsAsync()
]
```

---

## 🛤️ Routing

| Path | Component | Guard | Mô tả |
|------|-----------|-------|-------|
| `/` | `HomeComponent` | — | Trang chủ - danh sách câu hỏi |
| `/login` | `LoginComponent` | — | Đăng nhập |
| `/register` | `RegisterComponent` | — | Đăng ký |
| `/forgot-password` | `ForgotPasswordComponent` | — | Quên mật khẩu |
| `/reset-password` | `ResetPasswordComponent` | — | Đặt lại mật khẩu |
| `/tags` | `TagsComponent` | — | Danh sách tags |
| `/categories` | `CategoriesComponent` | — | Danh sách danh mục |
| `/questions/new` | `CreateQuestionComponent` | `authGuard` | Tạo câu hỏi mới |
| `/questions/:id` | `QuestionDetailComponent` | — | Chi tiết câu hỏi |
| `/questions/:id/edit` | `EditQuestionComponent` | `authGuard` | Sửa câu hỏi |
| `/profile` | `ProfileComponent` | `authGuard` | Hồ sơ cá nhân |
| `/profile/edit` | `EditProfileComponent` | `authGuard` | Chỉnh sửa hồ sơ |
| `/chat` | `ChatComponent` | `authGuard` | Danh sách hội thoại |
| `/chat/:userId` | `ChatComponent` | `authGuard` | Chat với user |
| `/admin/categories` | `AdminCategoriesComponent` | `authGuard` + `adminGuard` | Quản lý danh mục |
| `/admin/tags` | `AdminTagsComponent` | `authGuard` + `adminGuard` | Quản lý tags |
| `/not-found` | `NotFoundComponent` | — | Trang 404 |
| `**` | → `not-found` | — | Redirect wildcard |

**Lazy Loading:** Tất cả components đều sử dụng `loadComponent` (dynamic import)

---

## 🛡️ Guards

### authGuard
```typescript
// Kiểm tra isAuthenticated() signal
// Nếu chưa đăng nhập → redirect /login?returnUrl=...
```

### adminGuard
```typescript
// Kiểm tra currentUser().role === 'Admin'
// Nếu không phải Admin → redirect / + alert
```

---

## 🔗 HTTP Interceptor

### authInterceptor
```typescript
// Tự động gắn header: Authorization: Bearer {token}
// Lấy token từ AuthService.getToken()
// Nếu không có token → request gốc (không gắn header)
```

---

## 📡 Services Chi Tiết

### AuthService (`auth.service.ts`)
**API Base:** `http://localhost:5134/api/auth`

| Method | Mô tả |
|--------|-------|
| `login(credentials)` | POST `/login` → Handle auth success |
| `register(data)` | POST `/register` → Handle auth success |
| `logout()` | Disconnect SignalR → Clear localStorage → Redirect |
| `getToken()` | Lấy token + kiểm tra expired |
| `isTokenExpired(token)` | Decode JWT payload → check `exp` |
| `getTokenExpiration(token)` | Trả về thời gian hết hạn (vi-VN format) |
| `getTokenTimeRemaining(token)` | Trả về thời gian còn lại ("X giờ Y phút") |

**State Management (Signals):**
- `currentUser: Signal<User | null>` — User hiện tại
- `isAuthenticated: Signal<boolean>` — Trạng thái đăng nhập

**Luồng xử lý:**
1. Login/Register → Lưu token + user vào localStorage → Set signals → Connect SignalR
2. Page load → `loadUserFromStorage()` → Check expired → Restore state → Connect SignalR
3. Logout → Disconnect SignalR → Clear storage → Reset signals → Redirect

---

### SignalRService (`signalr.service.ts`)
**Hub URL:** `http://localhost:5134/hubs/chat`

| Method | Mô tả |
|--------|-------|
| `connect(token)` | Kết nối hub với JWT |
| `disconnect()` | Ngắt kết nối |
| `sendMessage(receiverId, content)` | Gọi `SendMessage` trên server |
| `markAsRead(messageId)` | Gọi `MarkAsRead` trên server |
| `startTyping(receiverId)` | Gọi `StartTyping` trên server |
| `stopTyping(receiverId)` | Gọi `StopTyping` trên server |
| `isConnected()` | Kiểm tra trạng thái kết nối |

**Observables (RxJS Subjects):**

| Observable | Event lắng nghe | Data |
|------------|-----------------|------|
| `messageReceived$` | `ReceiveMessage` | `Message` |
| `messageSent$` | `MessageSent` | `Message` |
| `messageRead$` | `MessageRead` | `{ messageId, readBy, readAt }` |
| `typingStarted$` | `UserTyping` | `TypingIndicator` |
| `typingStopped$` | `UserStoppedTyping` | `{ userId }` |
| `connectionState$` | Connection events | `HubConnectionState` |

**Auto Reconnect:** Retry delays: 1s → 2s → 5s → 10s (lặp lại)

---

### QuestionService (`question.service.ts`)
**API Base:** `http://localhost:5134/api/questions`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getQuestions(search?, categoryId?, tagId?, status?, page, pageSize)` | GET | `/` |
| `getQuestionById(id)` | GET | `/{id}` |
| `createQuestion(question)` | POST | `/` |
| `updateQuestion(id, question)` | PUT | `/{id}` |
| `deleteQuestion(id)` | DELETE | `/{id}` |

---

### AnswerService (`answer.service.ts`)
**API Base:** `http://localhost:5134/api`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getAnswersByQuestionId(questionId)` | GET | `/questions/{questionId}/answers` |
| `createAnswer(questionId, answer)` | POST | `/questions/{questionId}/answers` |
| `updateAnswer(id, answer)` | PUT | `/answers/{id}` |
| `deleteAnswer(id)` | DELETE | `/answers/{id}` |
| `acceptAnswer(id)` | PUT | `/answers/{id}/accept` |

---

### VoteService (`vote.service.ts`)
**API Base:** `http://localhost:5134/api`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `voteQuestion(questionId, 'upvote'/'downvote')` | POST | `/questions/{id}/vote` |
| `voteAnswer(answerId, 'upvote'/'downvote')` | POST | `/answers/{id}/vote` |
| `removeVoteQuestion(questionId)` | DELETE | `/questions/{id}/vote` |
| `removeVoteAnswer(answerId)` | DELETE | `/answers/{id}/vote` |

**Note:** Chuyển đổi `'upvote'` → `1`, `'downvote'` → `-1`

---

### CategoryService (`category.service.ts`)
**API Base:** `http://localhost:5134/api/categories`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getCategories()` | GET | `/` |
| `getCategoryById(id)` | GET | `/{id}` |
| `createCategory(data)` | POST | `/` |
| `updateCategory(id, data)` | PUT | `/{id}` |
| `deleteCategory(id)` | DELETE | `/{id}` |

---

### TagService (`tag.service.ts`)
**API Base:** `http://localhost:5134/api/tags`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getTags(search?)` | GET | `/` |
| `getPopularTags(limit)` | GET | `/popular` |
| `getTagById(id)` | GET | `/{id}` |
| `suggestTags(query, limit)` | GET | `/suggest` |
| `getTrendingTags(days, limit)` | GET | `/trending` |
| `filterQuestionsByTags(dto)` | POST | `/questions/filter` |
| `createTag(data)` | POST | `/` |
| `updateTag(id, data)` | PUT | `/{id}` |
| `deleteTag(id)` | DELETE | `/{id}` |

---

### MessageService (`message.service.ts`)
**API Base:** `http://localhost:5134/api/messages`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getConversations()` | GET | `/conversations` |
| `getConversation(otherUserId, page, pageSize)` | GET | `/conversation/{otherUserId}` |
| `getUnreadCount()` | GET | `/unread-count` |
| `sendMessage(receiverId, content)` | POST | `/` |
| `markAsRead(messageId)` | POST | `/{messageId}/read` |

---

### UserProfileService (`user-profile.service.ts`)
**API Base:** `http://localhost:5134/api/userprofile`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `getMyProfile()` | GET | `/me` |
| `getMyQuestions()` | GET | `/me/questions` |
| `updateMyProfile(data)` | PUT | `/me` |
| `changePassword(data)` | PUT | `/me/change-password` |
| `uploadAvatar(file)` | POST | `/me/upload-avatar` (FormData) |
| `getUserProfile(userId)` | GET | `/{userId}` |
| `getUserQuestions(userId)` | GET | `/{userId}/questions` |
| `searchUsers(searchTerm, limit)` | GET | `/search` |

---

### UploadService (`upload.service.ts`)
**API Base:** `http://localhost:5134/api/upload`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `uploadQuestionAttachment(file)` | POST | `/question-attachment` (FormData) |
| `deleteQuestionAttachment(filePath)` | DELETE | `/question-attachment?filePath=...` |

**UploadResponse:** `{ message, filePath, fileUrl, fileName, fileSize }`

---

### PasswordResetService (`password-reset.service.ts`)
**API Base:** `http://localhost:5134/api/auth`

| Method | HTTP | Endpoint |
|--------|------|----------|
| `requestPasswordReset(email)` | POST | `/forgot-password` |
| `verifyOtp(email, otpCode)` | POST | `/verify-otp` |
| `resetPassword(email, otpCode, newPassword)` | POST | `/reset-password` |

---

## 📐 Data Models (TypeScript Interfaces)

### User & Auth
```typescript
interface User {
  userId: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: string;               // "Student" | "Admin"
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface LoginRequest { email: string; password: string; }
interface RegisterRequest { username: string; email: string; password: string; fullName?: string; }
```

### Question Summary & Detail
Hệ thống sử dụng cơ chế **Summary/Detail split** để tối ưu hóa hiệu năng truyền tải dữ liệu.

```typescript
export interface QuestionSummary {
  questionId: number;
  title: string;
  content: string;            // Thu gọn (200 ký tự)
  viewCount: number;
  status: string;
  imageUrl?: string;
  fileUrl?: string;
  codeLanguage?: string;
  codeLineCount: number;      // Dùng để FE quyết định Lazy Load
  createdAt: string;
  updatedAt?: string;
  user: { username: string; avatarUrl?: string; };
  category?: { categoryId: number; categoryName: string; };
  tags: Tag[];
  answerCount: number;
  voteCount: number;
}

export interface Question extends Omit<QuestionSummary, 'content' | 'user' | 'category'> {
  content: string;            // Nội dung đầy đủ
  userId: number;
  username: string;
  avatarUrl?: string;
  categoryId?: number;
  categoryName?: string;
  codeContent?: string;       // Chỉ có giá trị nếu short (< 20 dòng)
}
```

### Lazy Loading Logic (Code Editor)
Để tránh "nghẽn" trình duyệt khi xử lý code lớn:
1. **Auto-load**: Nếu `codeLineCount < 20`, `codeContent` được tải sẵn.
2. **On-demand**: Nếu `codeLineCount >= 20`, người dùng phải nhấn nút "Show Code" để tải code từ API `/code`.
3. **Conditional Rendering**: Editor chỉ hiển thị nếu `codeLanguage` được khai báo.


### Message
```typescript
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface Message {
  messageId: number;
  senderId: number;
  senderUsername: string;
  senderAvatarUrl?: string;
  receiverId: number;
  receiverUsername: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  status?: MessageStatus;     // UI-only field
}

interface Conversation {
  otherUserId: number;
  otherUsername: string;
  otherAvatarUrl?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isLastMessageFromMe: boolean;
}

interface TypingIndicator { userId: number; username?: string; }
```

---

## 🏗️ Component Map

### Public Pages (Không cần đăng nhập)

| Component | Route | Chức năng chính |
|-----------|-------|----------------|
| **HomeComponent** | `/` | Hiển thị danh sách câu hỏi, search, filter theo category/tag/status, phân trang |
| **QuestionDetailComponent** | `/questions/:id` | Chi tiết câu hỏi, danh sách câu trả lời, vote, accept answer |
| **CategoriesComponent** | `/categories` | Xem tất cả danh mục và số lượng câu hỏi |
| **TagsComponent** | `/tags` | Xem tất cả tags, popular tags, trending tags |
| **LoginComponent** | `/login` | Form đăng nhập (email + password) |
| **RegisterComponent** | `/register` | Form đăng ký (username, email, password, fullName) |
| **ForgotPasswordComponent** | `/forgot-password` | Nhập email để nhận OTP |
| **ResetPasswordComponent** | `/reset-password` | Nhập OTP + mật khẩu mới |
| **NotFoundComponent** | `/not-found` | Trang 404 |

### Authenticated Pages (Cần đăng nhập)

| Component | Route | Chức năng chính |
|-----------|-------|----------------|
| **CreateQuestionComponent** | `/questions/new` | Form tạo câu hỏi (title, content, category, tags, file upload) |
| **EditQuestionComponent** | `/questions/:id/edit` | Form chỉnh sửa câu hỏi |
| **ProfileComponent** | `/profile` | Xem hồ sơ, thống kê, danh sách câu hỏi của mình |
| **EditProfileComponent** | `/profile/edit` | Chỉnh sửa hồ sơ, đổi mật khẩu, upload avatar |
| **ChatComponent** | `/chat`, `/chat/:userId` | Danh sách hội thoại + giao diện chat real-time |

### Admin Pages (Cần quyền Admin)

| Component | Route | Chức năng chính |
|-----------|-------|----------------|
| **AdminCategoriesComponent** | `/admin/categories` | CRUD danh mục (tạo, sửa, xóa) |
| **AdminTagsComponent** | `/admin/tags` | CRUD tags (tạo, sửa, xóa) |

### Shared Components

| Component | Mô tả |
|-----------|-------|
| **NavbarComponent** | Thanh điều hướng: logo, menu, user avatar, unread badge, admin menu |
| **ConfirmationDialogComponent** | Dialog xác nhận hành động (Material Dialog) |
| **CodeEditorComponent** | Editor đa ngôn ngữ (Monaco), hỗ trợ Format & Run (JS) |
| **TimeAgoPipe** | Chuyển đổi Date thành chuỗi tương đối (vd: "3 hours ago") |
| **SharedComponents** | Components tái sử dụng chung |

---

## 🔄 Luồng Hoạt Động Chính

### 1. Authentication Flow
```
User nhập email + password
  → AuthService.login()
    → POST /api/auth/login
    → Nhận { token, refreshToken, user }
    → Lưu vào localStorage
    → Set signals (currentUser, isAuthenticated)
    → SignalRService.connect(token)
    → Redirect to home
```

### 2. Question Flow
```
Home → Hiển thị danh sách câu hỏi
  → QuestionService.getQuestions(search, filters, page)
  → Click câu hỏi → QuestionDetailComponent
    → QuestionService.getQuestionById(id) (tăng view)
    → AnswerService.getAnswersByQuestionId(id)
    → Hiển thị vote buttons (VoteService)
    → Form trả lời (AnswerService.createAnswer)
    → Accept answer (AnswerService.acceptAnswer)
```

### 3. Chat Flow
```
User click Chat icon trên navbar
  → ChatComponent loads
    → MessageService.getConversations()
    → Hiển thị danh sách hội thoại
  → Click conversation hoặc navigate /chat/:userId
    → MessageService.getConversation(otherUserId)
    → Hiển thị tin nhắn
  → Gõ tin nhắn
    → SignalRService.startTyping(receiverId)
    → Submit → SignalRService.sendMessage(receiverId, content)
  → Nhận tin nhắn (real-time)
    → SignalRService.messageReceived$ subscription
    → Append message to UI
  → Đánh dấu đã đọc
    → SignalRService.markAsRead(messageId)
```

### 4. Password Reset Flow
```
Forgot Password page
  → Nhập email → PasswordResetService.requestPasswordReset(email)
  → Redirect to Reset Password page
  → Nhập email + OTP + new password
  → PasswordResetService.resetPassword(email, otp, newPassword)
  → Redirect to Login
```

---

## 🛠️ Quy tắc phát triển (Development Rules)

- **Error Handling**: Mọi lượt gọi API `.subscribe()` bắt buộc phải có khối xử lý lỗi (`error: (err) => console.error(err)`).
- **Date Formatting**: Ưu tiên sử dụng Pipe thay vì viết hàm `formatDate` thủ công trong Component.
    - Dùng `| timeAgo` cho thời gian tương đối.
    - Dùng `| date:'longDate'` cho thời gian tuyệt đối.
- **Standalone**: Tất cả Components, Pipes, Directives đều phải là Standalone.

---

## 📊 Tổng Kết

| Hạng mục | Số lượng |
|----------|---------|
| Components | 19 |
| Pipes | 1 (`TimeAgoPipe`) |
| Services | 11 |
| Models | 8 |
| Guards | 2 |
| Interceptors | 1 |
| Routes | 16 + wildcard |
| Angular version | 20 |
| npm packages (prod) | 8 |

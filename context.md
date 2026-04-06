# Frontend Context - UniKnowledge System

Tài liệu tóm lược cho AI Coding Assistant nhằm hỗ trợ phát triển và duy trì mã nguồn Frontend dự án UniKnowledge.

## 1. Project Overview
- **Dự án**: UniKnowledge App - Nền tảng Hỏi & Đáp (Q&A) tương tác dành cho sinh viên.
- **Người dùng**: Sinh viên (đặt câu hỏi, trả lời, bình chọn) và Admin (quản trị các danh mục, tag và nội dung).
- **Mục tiêu UI/UX**: Tốc độ phản hồi cao, tương tác thời gian thực, giao diện chuyên nghiệp và thân thiện với thiết bị di động.

## 2. Tech Stack
- **Framework**: **Angular 18** (Standalone Components).
- **Quản lý Trạng thái**: **Angular Signals** (Core State Management).
- **Styling**: **Tailwind CSS** (v3+), SCSS (với BEM naming nội bộ nếu cần).
- **Xử lý luồng dữ liệu**: **RxJS** (chủ yếu dùng cho HTTP requests).
- **Real-time**: **@microsoft/signalr**.
- **Thư viện chính**: `Angular Material` (Dialogs), `Lucide icons`.

## 3. Folder Structure
- `src/app/components/`:
    - `shared/`: Các component dùng chung (Voting, QuestionList, Pipes...).
    - Các page-specific components (Home, QuestionDetail, Profile...).
- `src/app/services/`: Logic gọi API và xử lý dữ liệu trung tâm (`AuthService`, `QuestionService`, `SignalRService`).
- `src/app/models/`: Định nghĩa Interfaces/Models cho dữ liệu (Question, Tag, User).
- `src/app/interceptors/`: `auth.interceptor.ts` xử lý gắn Token vào Header.
- `src/app/guards/`: `auth.guard.ts` bảo vệ các route yêu cầu đăng nhập.

## 4. API Integration
- **Hệ thống**: Sử dụng `HttpClient` mặc định của Angular.
- **Cấu hình**: `environment.ts` lưu Base URL cho API và SignalR Hub.
- **Auth Flow**: `AuthService` lưu JWT Token vào `localStorage`. `authInterceptor` tự động tiêm Token vào mọi request nếu có.
- **Real-time Hub**: `SignalRService` kết nối tới `/hubs/chat` khi ứng dụng khởi động.

## 5. Design System
- **Quy tắc UI**: Sử dụng utility classes của **Tailwind**.
- **Màu sắc chủ đạo**: `Primary: #2563eb (Blue-600)`, `Gray: #f9fafb`.
- **Shared Components**:
    - `QuestionListComponent`: Danh sách câu hỏi có hỗ trợ vô tận (Infinite Scroll).
    - `VotingComponent`: Xử lý click Upvote/Downvote.
    - `TimeAgoPipe`: Chuyển Date thành dạng tương đối (ví dụ: "3 days ago").

## 6. State Management Flow
- **Signals**: Sử dụng `signal` và `computed` trong Component để quản lý trạng thái đồng bộ (Loading, Items, Filters).
- **Global State**: Thông tin người dùng hiện tại được lưu trong `AuthService` dưới dạng một Signal để toàn ứng dụng có thể truy cập phản ứng (reactive).
- **Data Fetching**: Component gọi Service -> Service trả về `Observable` -> `subscribe` trong component để cập nhật `signal`.
- **Error Observability**: Mọi `subscribe` đều PHẢI có khối `error` để log hoặc thông báo cho người dùng.

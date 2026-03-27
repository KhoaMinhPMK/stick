# KẾ HOẠCH TRIỂN KHAI CHI TIẾT WEB ADMIN STICK (MVP - M8)

## 1. TỔNG QUAN & ĐỊNH VỊ (PRODUCT TRUTH)
Theo định vị của STICK, module Admin (M8) **không phải là hệ thống Enterprise CMS**. Đây là **công cụ vận hành Pilot (Pilot Operations)** với 2 mục tiêu tối thượng:
1. Đăng prompt hằng ngày mà Dev không cần can thiệp (can thiệp DB thủ công).
2. Xem dashboard đo lường (Daily Action, Retention, AI Error) để quyết định giữ hay bỏ tính năng.

**Nguyên tắc thiết kế (Design Rules):**
- **Single Role**: Chỉ có 1 role "Admin". Không phân quyền (RBAC) phức tạp, không thêm/sửa/xóa User Admin trong giai đoạn này (cấp tài khoản trực tiếp trong DB).
- **No-frills UI**: Dùng lại bộ component UI của App chính (Button, Input, Table cơ bản), không màu mè, ưu tiên tốc độ hiển thị và chính xác dữ liệu.
- **Tích hợp chung bundle**: Admin nằm chung codebase React frontend hiện tại, chạy chung cổng, phân tách bằng logic Route (Hash-routing).

---

## 2. QUYẾT ĐỊNH KỸ THUẬT (ENGINEERING LAW)
- **Routing**: Hiện tại App đang dùng Hash-based router (`#level`, `#dashboard`,...). Admin sẽ kế thừa mảng này với prefix `#admin/*` (VD: `#admin/login`, `#admin/dashboard`, `#admin/prompts`). Phân nhánh logic render trong `App.tsx`.
- **Layout**: Sử dụng `AdminLayout.tsx` riêng biệt (Sidebar bên trái, Topbar, Content Area), hoàn toàn độc lập với thiết kế Mobile-first của Ứng dụng Học.
- **State/Auth**: Admin dùng JWT token lưu ở `localStorage` (Ví dụ: `admin_token`), tách biệt hoàn toàn với `user_token` để tránh xung đột session. Nếu hash có chữ `#admin` mà check không có `admin_token`, tự động đá về `#admin/login`.
- **API Call Framework**: Viết riêng `adminAxios` instance, tự động gắn `Authorization: Bearer <admin_token>`.

---

## 3. SCREEN INVENTORY & TÀI LIỆU TỪNG NÚT BẤM (MÀN HÌNH CHI TIẾT)

### Màn hình 1: Login Admin (`#admin/login`)
- **Mục đích**: Chặn cửa truy cập của người dùng bình thường.
- **UI Components**:
  - Input "Username" (hoặc Email).
  - Input "Password" (type: password).
  - Nút **[Đăng nhập]**: Gọi API, hiện trạng thái `isLoading` -> Thành công thì swap route sang `#admin/dashboard`.
  - Thông báo lỗi (Toast/Text màu đỏ): Nếu sai pass hoặc không có quyền.
- **API Flow**:
  - `POST /api/admin/auth/login` -> Trả về `{ token, adminInfo }`. 

### Màn hình 2: Dashboard Đo Lường & Sức Khỏe (`#admin/dashboard` - TRÁI TIM CỦA PILOT)
- **Mục đích**: Đáp ứng Product health thresholds. Nơi team nhìn vào để biết Pilot đang sống hay chết.
- **UI Components**:
  - **Khối 1 (Daily Snapshot - Card Box)**:
    - Thẻ "Today Sessions": Tổng phiên học hôm nay.
    - Thẻ "Submissions Sent": Tổng số bài nộp.
    - Thẻ "AI Generation Errors": Tổng số lần gọi LLM thất bại (Báo động đỏ nếu > 5%).
  - **Khối 2 (Retention Funnel - Table/Chart cơ bản)**:
    - Hiển thị bảng Cohort (Day 1 completion %, Day 2 return %, Day 3 return %).
  - Nút **[Kiểm tra kết nối AI]**: Trạng thái Ping thử tới LLM provider (Azure/OpenAI) xem có sống không.
- **API Flow**:
  - `GET /api/admin/metrics/daily`
  - `GET /api/admin/metrics/retention`
  - `GET /api/admin/system/health-check`

### Màn hình 3: Quản lý Prompts Khảo sát (`#admin/prompts`)
- **Mục đích**: Quản trị "trái tim" nội dung của STICK. Đảm bảo user có prompt mới mỗi ngày.
- **UI Components**:
  - Nút **[+ Tạo Prompt Mới]**: Mở ra màn hình Tạo Prompt (`#admin/prompts/new`).
  - Nút/Dropdown **[Filter]**: Lọc theo trạng thái (Draft, Scheduled, Published).
  - **Bảng danh sách Prompts**:
    - Cột "Ngày áp dụng" (Target Date).
    - Cột "Nội dung chính" (Preview text ngắn).
    - Cột "Trạng thái" (Status).
    - Cột "Hành động": 
      - Nút **[Edit]** (icon bút chì) -> Sang `#admin/prompts/edit/:id`.
      - Nút **[Delete]** (icon thùng rác) -> Hiện modal confirm -> Xóa.
- **API Flow**:
  - `GET /api/admin/prompts?status=all&limit=50`

### Màn hình 4: Form Tạo / Sửa Prompt (`#admin/prompts/new` hoặc `edit/:id`)
- **Mục đích**: Ops nhập liệu mà không cần nhờ Dev chọc DB.
- **UI Components**:
  - Input "Target Date" (Ngày sẽ hiển thị cho user. VD: 01/05/2026).
  - Textarea "Main Prompt" (Câu hỏi chính. VD: "Hôm nay có điều gì làm bạn vui?").
  - Textarea "Follow-up Prompt" (Gợi ý thêm. VD: "Thử miêu tả cảm giác đó nhé").
  - Input "Topic/Tags" (Tùy chọn).
  - Dropdown "Trạng thái": Draft (Chưa public) / Published (Sẵn sàng chạy).
  - Nút **[Lưu & Thoát]**: Gọi API Tạo/Cập nhật, thành công quay về màn danh sách.
  - Nút **[Hủy]**: Quay về màn danh sách không lưu.
- **API Flow**:
  - `POST /api/admin/prompts` (khi tạo mới).
  - `PUT /api/admin/prompts/:id` (khi chỉnh sửa).

### Màn hình 5: AI Feedback Logs - Lịch sử lỗi AI (`#admin/logs` - Tùy chọn cực kỳ nên có)
- **Mục đích**: Ops/QA để nhìn xem AI có trả lời "ngu", phá vỡ rule (dài dòng, bịa chuyện) hay không nhằm điều chỉnh System Prompt (H3 - Thinking Shift).
- **UI Components**:
  - Bảng Log (Chỉ tải 100 record gần nhất).
  - Các cột: UserID, Lời người dùng nhập (Input), Phản hồi của AI (Output), Latency (Thời gian phản hồi tính bằng ms), Error Type (nếu có lỗi).
  - Nút **[Xem Chi Tiết AI Res]**: Mở Modal hiển thị raw JSON kết quả AI trả về để Dev debug.
- **API Flow**:
  - `GET /api/admin/logs/ai-feedbacks?limit=100`

---

## 4. LOGIC TÍCH HỢP FRONTEND (CÁCH CODE VÀO APP.TSX)

Để không làm hỏng file `App.tsx` đồ sộ hiện tại, chúng ta sẽ áp dụng **Router Wrapper Approach**:

```tsx
// Ý tưởng triển khai trong handleHashChange:
if (hash.startsWith('#admin')) {
  setCurrentView('admin');
  setAdminRoute(hash); // Lưu đường dẫn con của admin
}
//...
const renderCurrentView = () => {
    if (currentView === 'admin') {
      return <AdminApp subRoute={adminRoute} />;
    }
    // ... các switch case của app cũ
}
```

File `AdminApp.tsx` sẽ là cổng vào cho layout admin:
- Check localStorage xem có `admin_token` chưa.
- Chưa có -> Render `<AdminLogin />`.
- Có rồi -> Render `<AdminLayout><CurrentAdminPage /></AdminLayout>`.

---

## 5. THỨ TỰ PHÁT TRIỂN (EXECUTION BATCHES)
*Dev phải cam kết commit theo đúng cục này, không code lan man:*

- **Batch 1: Skeleton & Auth** - Dựng kiến trúc `#admin/*`, màn Login, thiết lập token, `adminAxios`. Đảm bảo user thường không vô tình đi lạc vào đây.
- **Batch 2: Prompts Management** - Dựng trang Danh sách và Thêm mới Prompt. Kết nối thẳng API (mock API nếu backend chưa xong để duyệt flow UI).
- **Batch 3: Ops Dashboard** - Lắp ráp biểu đồ / số liệu. Ưu tiên text tĩnh (number/card) trước, chưa cần vội tích hợp thư viện Chart nặng nề nếu không cần thiết.
- **Batch 4: Tuning & Delivery** - Test quy trình UAT (FR-10): Dùng Acc Admin tạo prompt -> Dùng Acc User mở app lên đúng ngày và thấy prompt hiển thị thành công. 

# KẾ HOẠCH TRIỂN KHAI CHI TIẾT WEB ADMIN - STICK MVP

## 1. TRIẾT LÝ SẢN PHẨM & PHẠM VI (MVP LOCK)
Dựa theo `M8 - Admin/CMS Tối thiểu`, Web Admin của STICK **không phải là CMS cho một hệ thống E-learning truyền thống**. 
Chúng ta **KHÔNG** cung cấp "bài học" (Lessons), "môn học" (Courses) hay "hệ thống bài tập trắc nghiệm phức tạp. 
Chúng ta cung cấp **Daily Prompts** (chủ đề viết hằng ngày) để phục vụ Core Loop: *Viết -> AI Sửa -> Nghe/Đọc lại -> Đóng app*.
Admin là công cụ để Vận hành Pilot, theo dõi đo lường và tinh chỉnh cấu hình AI. Không mở rộng (scope creep).

---

## 2. LAYOUT & KIẾN TRÚC TỔNG QUAN

Chúng ta sử dụng layout kinh điển **Sidebar (Cố định trái) + Topbar (Phụ) + Main Content (Phải)**.

### 2.1 Cấu trúc Layout (`AdminLayout.tsx`)
- **Sidebar (Width: 260px, fixed):**
  - **Logo Area**: Chữ STICK Admin (hoặc Logo + tag "Pilot").
  - **Menu Items (Navigation):**
    - 📊 `Dashboard` (Tổng quan pilot)
    - 📝 `Prompts` (Quản lý chủ đề viết)
    - 🤖 `AI Logs & Tuning` (Theo dõi chất lượng AI)
    - 👥 `Users` (Danh sách Pilot Users)
    - ⚙️ `Settings` (Cấu hình app/AI)
  - **Bottom Area**: Avatar Admin, Nút `Logout`.
- **Topbar (Height: 64px):**
  - **Left**: Tên trang hiện tại (VD: "Quản lý Prompts").
  - **Right**:
    - Nút chọn môi trường (Dev/Staging/Prod) (nếu cần).
    - Toggle Light/Dark mode.

---

## 3. CHI TIẾT TỪNG MÀN HÌNH & THÀNH PHẦN

### MÀN 1: TỔNG QUAN HỆ THỐNG (PILOT DASHBOARD)
Nơi team nhìn vào mỗi ngày để biết app "sống hay chết".

**1. Thẻ Số Liệu Nhanh (Metric Cards) ở trên cùng:**
- *Card 1*: **Today Sessions** (Lấy từ event `session_start`). Chỉ số sức khỏe: Nút màu `xanh` nếu > trung bình hôm qua.
- *Card 2*: **Completion Rate** (Tỉ lệ tính theo `submission_sent` / `session_start`). Chỉ số P0 của STICK. Thể hiện dạng % kèm mũi tên tăng/giảm.
- *Card 3*: **AI Error Rate** (Lấy từ `ai_error`). Báo động `đỏ` nếu > 5%.
- *Card 4*: **Day 1 Return** (Tỉ lệ user quay lại ngày hôm sau). Cột mốc cần đạt là 60%.

**2. Biểu Đồ (Charts):**
- **Chart 1: Core Funnel (Bar Chart)**: 
  - *Ý nghĩa*: Cho biết user rớt đài ở bước nào nhiều nhất. 
  - *Cột*: Start -> Viewed Prompt -> Saved Draft -> Sent -> Viewed Feedback -> Completed.
- **Chart 2: Cohort Retention (Heatmap/Table)**:
  - *Ý nghĩa*: Dòng là ngày đăng ký, cột là D1, D2, D7. 
- **Chart 3: AI Latency & Errors (Line Chart)**: 
  - *Ý nghĩa*: Thời gian phản hồi của AI trung bình qua các ngày.

*Kết nối API:* 
- `GET /api/admin/metrics/cards?date={today}`
- `GET /api/admin/metrics/funnel`

---

### MÀN 2: QUẢN LÝ NỘI DUNG MỖI NGÀY (DAILY PROMPTS)
Đây là dạ dày của STICK. Nơi team cập nhật nội dung mà ko cần dev.

#### 2.1 Danh sách Prompt (`/admin/prompts`)
- **Header**: Nút Primary `[+ Tạo Prompt Mới]`. Nút phụ `[Export CSV]`.
- **Bộ lọc (Filters)**: Filter theo Status (Draft, Scheduled, Published), Filter theo Date Range (Từ ngày - Đến ngày).
- **Table Data**:
  - `Trạng thái` (Badge màu: Xám-Draft, Vàng-Chờ đến ngày, Xanh-Đã xuất bản)
  - `Ngày hiển thị` (Ngày prompt sẽ lên app, kiểu định dạng DD/MM/YYYY)
  - `Tiêu đề (Nội bộ)` (VD: "Topic về đồ ăn sáng")
  - `Nội dung Chính` (Cắt ngắn thêm dấu "...")
  - `Action Column`: Nút `[Edit]`, `[Delete]`, `[Preview]`.

#### 2.2 Form Tạo/Sửa Prompt (`/admin/prompts/edit/:id`)
Đây là khu vực quan trọng nhất của content (những thứ người dùng sẽ nhìn thấy hằng ngày).

**Mảng Form Fields:**
1. **Ngày hiển thị (Publish Date)** `DatePicker`: Ngày mà user mở app sẽ thấy chủ đề này.
2. **Tiêu đề nội bộ** `Input(Text)`: Tên để admin tự nhớ, user không thấy.
3. **Prompt Tiếng Việt (VN)** `Textarea`: Lời gợi ý dịch ra tiếng việt. VD: "Sáng nay bạn ăn gì?".
4. **Prompt Tiếng Anh (EN)** `Textarea`: Gợi ý mồi. VD: "What did you have for breakfast?".
5. **Follow-up / Gợi ý cách viết** `Textarea (Rich Text nhẹ)`: Từ vựng mồi để user bớt bí 아이디어. 
6. **Mức độ (Level)** `Select`: Dành cho phân nhóm (Cơ bản / Nâng cao).

**Action Buttons (Bottom Bar cố định):**
- Thùng rác: `[Xóa Prompt]`
- Trái: `[Lưu Nháp (Save Draft)]` 
- Phải: Nút Secondary `[Preview TRÊN APP]`, Nút Primary `[Lưu & Lên lịch (Schedule)]`

*Kết nối API:*
- `GET /api/admin/prompts`
- `POST /api/admin/prompts`
- `PUT /api/admin/prompts/:id`
- `DELETE /api/admin/prompts/:id`

---

### MÀN 3: THEO DÕI LOG CHẤT LƯỢNG AI (AI LOGS & TUNING)
Mục tiêu là xem AI có đang "phát điên" hay trả lời quá học thuật hay không.

#### 3.1 Giao diện Logs
- **Table Data**:
  - `Thời gian`
  - `User_ID`
  - `Bài viết gốc (Draft)`
  - `AI Rewrite`
  - `Status Code` (200, 500)
  - `Latency` (ms)
  - Nút `[Xem chi tiết]`
- Kích vào `[Xem chi tiết]` mở ra một **Dialog/Modal** hiển thị màn hình Feedback giống hệt của user (chia block "Rewrite", "Useful words", "Grammar notes") để Admin duyệt bằng mắt xem AI làm có tốt không.

#### 3.2 System Prompt Cấu hình nhanh (Tùy chọn)
- Một khu vực cho phép Admin tinh chỉnh (Tweak) file System Prompt gốc nằm trên backend thay vì phải deploy lại server. 
- *Field*: `System Prompt` (Textarea to đùng mầu đen giống terminal). Nút `[Lưu & Áp dụng ngay]`.

---

### MÀN 4: NGƯỜI DÙNG & GỠ LỖI (USERS EXPLORER)
Giúp support user hoặc xem ai chăm chỉ nhất.

- **Thanh tìm kiếm (Search bar)** to ở giữa: Search bằng Email, Phone hoặc Username.
- **Bảng User**:
  - `User Info`
  - `Đăng ký ngày`
  - `Tổng số ngày đã học` (Day account)
  - `Current Streak` (Chuỗi)
  - `Trạng thái`
  - Nút `[Xem chi tiết]`
- **User Detail View**: Liệt kê toàn bộ lịch sử gửi bài (Submission) của người đó qua từng ngày.

---

## 4. LUỒNG KẾT NỐI API & BẢO MẬT (ENGINEERING LAW)

### 4.1 Cấu trúc API Contract
Tất cả endpoint Admin đều phải đi qua một tiền tố riêng và Middleware check quyền.
Ví dụ: `https://api.domain.com/admin/...`

File contract ở frontend (`frontend/src/services/api/admin.api.ts`):
```typescript
// Các hàm gọi API sẽ được trừu tượng hóa, cấm gọi trực tiếp fetch trong Component.
export const AdminAPIs = {
  prompts: {
    getList: (filters: PromptFilterDTO) => httpClient.get('/admin/prompts', { params: filters }),
    create: (data: CreatePromptDTO) => httpClient.post('/admin/prompts', data),
    //...
  },
  metrics: {
    getDashboardStats: (date: string) => httpClient.get('/admin/metrics/stats', { params: { date } })
  }
}
```

### 4.2 Lớp Bảo mật & Định tuyến (Routing)
- Không dùng RBAC phức tạp. Dùng 1 Role duy nhất là `ADMIN`.
- Trong file `App.tsx`, nếu path bắt đầu bằng `#/admin`, ta mount `<AdminApp />`.
- `AdminApp` sẽ có một Component bọc lại tên là `<RequireAdminAuth />`. Nếu chưa login Admin, đẩy ra trang `#/admin/login` (Trang login tẻ nhạt, thuần trắng đen, yêu cầu email+password admin). 

---

## 5. CHECKLIST ĐỂ UAT (Nghiệm Thu)
1. **[ ]** Admin có thể tạo trước 10 Prompts cho 10 ngày tới chưa? => Nếu user vào đúng ngày nào, hiện đúng prompt ngày đó không cần gọi dev (FR-10).
2. **[ ]** Thấy rõ ngay tỉ lệ Day 1 Completion trên Dashboard chưa?
3. **[ ]** Layout có tách lập an toàn khỏi app học của user không? (Code web phải chẻ ra dùng Vite split chunks để không làm nặng app).

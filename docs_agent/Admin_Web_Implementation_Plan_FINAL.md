# KẾ HOẠCH TRIỂN KHAI CHI TIẾT WEB ADMIN — STICK MVP
> Phiên bản: FINAL · Ngày: 30/03/2026  
> Tài liệu này mô tả từng bước triển khai Admin Web, từ database model đến từng nút bấm trên UI.  
> Mọi thứ bám sát codebase hiện tại: Prisma + MySQL, Express + apiV1.js, React + hash routing, apiRequest() client.

---

## MỤC LỤC
1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Database — Prisma models mới](#2-database--prisma-models-mới)
3. [Backend — API routes & middleware](#3-backend--api-routes--middleware)
4. [Frontend — Cấu trúc thư mục & routing](#4-frontend--cấu-trúc-thư-mục--routing)
5. [Màn 0: Admin Login](#5-màn-0-admin-login)
6. [Màn 1: Dashboard (Pilot Overview)](#6-màn-1-dashboard-pilot-overview)
7. [Màn 2: Prompts Management](#7-màn-2-prompts-management)
8. [Màn 3: AI Logs & Tuning](#8-màn-3-ai-logs--tuning)
9. [Màn 4: Users Explorer](#9-màn-4-users-explorer)
10. [Màn 5: Settings](#10-màn-5-settings)
11. [AdminLayout — Sidebar + Topbar](#11-adminlayout--sidebar--topbar)
12. [Thứ tự triển khai (Implementation Order)](#12-thứ-tự-triển-khai)
13. [Checklist nghiệm thu (UAT)](#13-checklist-nghiệm-thu)

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1 Nguyên tắc tách biệt
- Admin Web **hoàn toàn tách biệt** khỏi app học của user.
- Route prefix: `#admin`, `#admin/prompts`, `#admin/users`, ...
- API prefix: `/admin/*` — tất cả đi qua middleware `requireAdmin`.
- Admin KHÔNG dùng guest session. Admin phải login bằng email+password có `role = "admin"`.
- Vite build chung 1 bundle (không cần split chunk riêng ở giai đoạn pilot).

### 1.2 Bám sát codebase hiện tại

| Thành phần | Hiện tại | Admin sẽ dùng |
|---|---|---|
| DB | Prisma + MySQL | Thêm 3 models mới vào `schema.prisma` |
| API | `apiV1.js` monolith | Thêm block admin routes cuối file HOẶC tách `adminRoutes.js` riêng |
| Auth | `requireAuth` middleware, Session table | Thêm `requireAdmin` middleware kiểm tra `user.role === "admin"` |
| Frontend routing | Hash-based trong `App.tsx` | Thêm block `#admin*` → mount `<AdminApp />` |
| API client | `apiRequest()` trong `client.ts` | Dùng lại `apiRequest()`, tạo thêm `admin.api.ts` |
| UI | Tailwind + Material Symbols | Admin dùng cùng stack, style riêng (monochrome, dense) |

---

## 2. DATABASE — PRISMA MODELS MỚI

### 2.1 Thay đổi trên User model (thêm field `role`)

```prisma
model User {
  // ... existing fields ...
  role  String  @default("user")  // "user" | "admin"
  // ... existing relations ...
}
```

> Migration: `ALTER TABLE User ADD COLUMN role VARCHAR(191) NOT NULL DEFAULT 'user';`  
> Seed admin: `UPDATE User SET role = 'admin' WHERE email = '<admin-email>';`

### 2.2 Model mới: DailyPrompt

```prisma
model DailyPrompt {
  id            String    @id @default(uuid())
  publishDate   DateTime  @db.Date              // Ngày hiển thị cho user
  status        String    @default("draft")     // "draft" | "scheduled" | "published"
  internalTitle String                          // Tên nội bộ admin tự nhớ
  promptVi      String    @db.Text              // Prompt tiếng Việt
  promptEn      String    @db.Text              // Prompt tiếng Anh
  followUp      String?   @db.Text              // Gợi ý / từ vựng mồi
  level         String    @default("basic")     // "basic" | "intermediate" | "advanced"
  createdBy     String                          // userId của admin tạo
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([publishDate])                       // 1 ngày chỉ 1 prompt
  @@index([status, publishDate])
}
```

**Giải thích các field:**

| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `publishDate` | Date | ✅ | Ngày user mở app sẽ thấy prompt này. Unique — 1 ngày = 1 prompt. |
| `status` | String | ✅ | `draft`: chưa sẵn sàng. `scheduled`: đã lên lịch. `published`: đang hiển thị cho user. |
| `internalTitle` | String | ✅ | VD: "Topic đồ ăn sáng". User không thấy, chỉ admin quản lý. |
| `promptVi` | Text | ✅ | Lời gợi ý tiếng Việt. VD: "Sáng nay bạn ăn gì?" |
| `promptEn` | Text | ✅ | Lời gợi ý tiếng Anh. VD: "What did you have for breakfast?" |
| `followUp` | Text | ❌ | Từ vựng mồi, gợi ý cách viết. Tuỳ chọn. |
| `level` | String | ✅ | Phân nhóm nội dung. Default `basic`. |
| `createdBy` | String | ✅ | ID admin tạo prompt. |

### 2.3 Model mới: AILog

```prisma
model AILog {
  id            String   @id @default(uuid())
  userId        String
  journalId     String?
  inputText     String   @db.Text              // Bài viết gốc của user
  outputText    String?  @db.Text              // AI rewrite response (JSON)
  model         String   @default("llama-3.3-70b-versatile")
  statusCode    Int      @default(200)          // 200, 500, etc.
  latencyMs     Int      @default(0)            // Thời gian AI xử lý (ms)
  errorMessage  String?  @db.Text
  createdAt     DateTime @default(now())

  @@index([createdAt(sort: Desc)])
  @@index([userId])
  @@index([statusCode])
}
```

### 2.4 Model mới: AppConfig

```prisma
model AppConfig {
  id        String   @id @default(uuid())
  key       String   @unique                   // "ai_system_prompt", "app_maintenance", ...
  value     String   @db.LongText
  updatedBy String?
  updatedAt DateTime @updatedAt
}
```

### 2.5 Tóm tắt migration

```
Thay đổi:
  - User: thêm field `role` (String, default "user")
Tạo mới:
  - DailyPrompt
  - AILog
  - AppConfig
```

---

## 3. BACKEND — API ROUTES & MIDDLEWARE

### 3.1 Middleware `requireAdmin`

**File:** `backend/src/middlewares/requireAdmin.js`

```javascript
async function requireAdmin(req, res, next) {
  // requireAuth phải chạy trước để có req.authUser
  if (!req.authUser || req.authUser.role !== 'admin') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  next();
}
```

**Cách dùng trong route:**
```javascript
router.get('/admin/prompts', requireAuth, requireAdmin, asyncHandler(async (req, res) => { ... }));
```

### 3.2 Danh sách API endpoints

#### Auth
| Method | Path | Mô tả |
|---|---|---|
| `POST` | `/admin/login` | Login admin bằng email+password, trả accessToken. Kiểm tra `role === "admin"`. |

#### Prompts
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/prompts` | Danh sách prompts. Query: `?status=draft&page=1&limit=20&from=2026-03-01&to=2026-04-01` |
| `GET` | `/admin/prompts/:id` | Chi tiết 1 prompt |
| `POST` | `/admin/prompts` | Tạo prompt mới |
| `PUT` | `/admin/prompts/:id` | Cập nhật prompt |
| `DELETE` | `/admin/prompts/:id` | Xoá prompt (hard delete) |
| `POST` | `/admin/prompts/:id/publish` | Chuyển status → "scheduled" hoặc "published" |

#### Metrics (Dashboard)
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/metrics/cards` | 4 thẻ số liệu: sessions, completion rate, AI error rate, D1 return. Query: `?date=2026-03-30` |
| `GET` | `/admin/metrics/funnel` | Core funnel data (aggregate từ ProgressDaily + Journal). Query: `?from=&to=` |
| `GET` | `/admin/metrics/retention` | Cohort retention D1/D2/D3. Query: `?from=&to=` |
| `GET` | `/admin/metrics/ai-health` | AI latency + error count theo ngày. Query: `?days=7` |

#### Users
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/users` | Danh sách users. Query: `?search=email&page=1&limit=20&sort=createdAt` |
| `GET` | `/admin/users/:id` | Chi tiết user + journals + progress |
| `PATCH` | `/admin/users/:id` | Cập nhật (VD: ban user, đổi role) |

#### AI Logs
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/ai-logs` | Danh sách logs. Query: `?status=500&page=1&limit=20&from=&to=` |
| `GET` | `/admin/ai-logs/:id` | Chi tiết 1 log (full input/output) |

#### Settings
| Method | Path | Mô tả |
|---|---|---|
| `GET` | `/admin/config` | Lấy tất cả AppConfig |
| `PUT` | `/admin/config/:key` | Cập nhật 1 config key |

### 3.3 Chi tiết request/response contracts

#### POST /admin/login
```
Request:
{
  "email": "admin@stick.app",
  "password": "..."
}

Response 200:
{
  "accessToken": "abc123...",
  "user": { "id": "...", "name": "Admin", "email": "admin@stick.app", "role": "admin" }
}

Response 401:
{ "code": "INVALID_CREDENTIALS", "message": "Email or password incorrect" }

Response 403:
{ "code": "NOT_ADMIN", "message": "This account does not have admin access" }
```

#### GET /admin/prompts
```
Query: ?status=all&page=1&limit=20&from=2026-03-01&to=2026-04-30

Response 200:
{
  "items": [
    {
      "id": "uuid",
      "publishDate": "2026-03-30",
      "status": "published",
      "internalTitle": "Topic đồ ăn sáng",
      "promptVi": "Sáng nay bạn ăn gì?",
      "promptEn": "What did you have for breakfast?",
      "followUp": "Vocabulary: cereal, toast, congee...",
      "level": "basic",
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

#### POST /admin/prompts
```
Request:
{
  "publishDate": "2026-04-01",
  "internalTitle": "Topic cuối tuần",
  "promptVi": "Cuối tuần rồi bạn làm gì?",
  "promptEn": "What did you do last weekend?",
  "followUp": "relax, hang out, binge-watch...",
  "level": "basic"
}

Response 201:
{ "prompt": { ...full prompt object... } }

Response 409:
{ "code": "DATE_CONFLICT", "message": "A prompt already exists for this date" }
```

#### PUT /admin/prompts/:id
```
Request: (partial update, chỉ gửi field cần thay đổi)
{
  "promptVi": "Sáng nay bạn ăn gì vậy?",
  "status": "scheduled"
}

Response 200:
{ "prompt": { ...updated prompt... } }
```

#### GET /admin/metrics/cards?date=2026-03-30
```
Response 200:
{
  "todaySessions": 142,
  "yesterdaySessions": 128,
  "completionRate": 0.67,        // submissions / sessions
  "completionRateChange": 0.03,  // vs hôm qua
  "aiErrorRate": 0.02,
  "aiErrorCount": 3,
  "day1ReturnRate": 0.58,
  "day1ReturnChange": -0.02
}
```

#### GET /admin/metrics/funnel?from=2026-03-23&to=2026-03-30
```
Response 200:
{
  "steps": [
    { "step": "session_start", "count": 980 },
    { "step": "prompt_view", "count": 920 },
    { "step": "draft_saved", "count": 710 },
    { "step": "submission_sent", "count": 650 },
    { "step": "feedback_view", "count": 580 },
    { "step": "completion_view", "count": 520 }
  ]
}
```

#### GET /admin/metrics/retention?from=2026-03-20&to=2026-03-30
```
Response 200:
{
  "cohorts": [
    {
      "registeredDate": "2026-03-20",
      "totalUsers": 50,
      "d1": 0.62,
      "d2": 0.41,
      "d3": 0.28
    },
    ...
  ]
}
```

#### GET /admin/metrics/ai-health?days=7
```
Response 200:
{
  "daily": [
    { "date": "2026-03-30", "avgLatencyMs": 1230, "errorCount": 2, "totalRequests": 145 },
    { "date": "2026-03-29", "avgLatencyMs": 980, "errorCount": 0, "totalRequests": 128 },
    ...
  ]
}
```

#### GET /admin/users?search=john&page=1&limit=20
```
Response 200:
{
  "items": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "isGuest": false,
      "role": "user",
      "createdAt": "2026-03-15T08:00:00Z",
      "stats": {
        "totalDays": 12,
        "currentStreak": 5,
        "totalJournals": 15,
        "lastActiveAt": "2026-03-30T07:32:00Z"
      }
    }
  ],
  "total": 340,
  "page": 1,
  "limit": 20
}
```

#### GET /admin/users/:id
```
Response 200:
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "isGuest": false,
    "role": "user",
    "bio": "...",
    "nativeLanguage": "vi",
    "createdAt": "2026-03-15T08:00:00Z",
    "onboarding": { "completed": true, "level": "intermediate", "goal": "speaking" },
    "stats": {
      "totalDays": 12,
      "currentStreak": 5,
      "totalJournals": 15,
      "totalWordsLearned": 87,
      "totalMinutes": 240
    }
  },
  "recentJournals": [
    {
      "id": "uuid",
      "title": "My morning routine",
      "content": "...",
      "status": "submitted",
      "score": 75,
      "createdAt": "2026-03-30T07:00:00Z"
    }
  ]
}
```

#### GET /admin/ai-logs?status=500&page=1&limit=20
```
Response 200:
{
  "items": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "journalId": "uuid",
      "inputText": "Today I go to school...",
      "outputText": "{...parsed JSON...}",
      "model": "llama-3.3-70b-versatile",
      "statusCode": 200,
      "latencyMs": 1340,
      "errorMessage": null,
      "createdAt": "2026-03-30T07:15:00Z"
    }
  ],
  "total": 890,
  "page": 1,
  "limit": 20
}
```

#### GET /admin/config
```
Response 200:
{
  "items": [
    { "key": "ai_system_prompt", "value": "You are an expert English...", "updatedAt": "..." },
    { "key": "ai_model", "value": "llama-3.3-70b-versatile", "updatedAt": "..." },
    { "key": "ai_temperature", "value": "0.3", "updatedAt": "..." },
    { "key": "ai_max_tokens", "value": "2000", "updatedAt": "..." },
    { "key": "maintenance_mode", "value": "false", "updatedAt": "..." }
  ]
}
```

#### PUT /admin/config/:key
```
Request:
{ "value": "You are an expert English tutor..." }

Response 200:
{ "config": { "key": "ai_system_prompt", "value": "...", "updatedAt": "..." } }
```

### 3.4 Ghi AILog từ feedback endpoint hiện tại

**Thay đổi trong route `/ai/feedback/text` (apiV1.js):**

Sau khi gọi Groq AI xong, thêm logic lưu AILog:

```javascript
// Sau khi có response từ groqAI
await prisma.aILog.create({
  data: {
    userId: req.authUser.id,
    journalId: journalId,
    inputText: content,
    outputText: JSON.stringify(feedbackResult),
    model: 'llama-3.3-70b-versatile',
    statusCode: 200,
    latencyMs: Date.now() - startTime,
  }
});

// Nếu AI lỗi:
await prisma.aILog.create({
  data: {
    userId: req.authUser.id,
    journalId: journalId,
    inputText: content,
    statusCode: 500,
    latencyMs: Date.now() - startTime,
    errorMessage: error.message,
  }
});
```

---

## 4. FRONTEND — CẤU TRÚC THƯ MỤC & ROUTING

### 4.1 Cấu trúc thư mục mới

```
frontend/src/
  pages/
    admin/
      AdminLogin.tsx          # Màn login admin
      AdminDashboard.tsx      # Màn 1: Dashboard
      AdminPrompts.tsx        # Màn 2: Danh sách prompts
      AdminPromptForm.tsx     # Màn 2: Form tạo/sửa prompt
      AdminAILogs.tsx         # Màn 3: AI Logs
      AdminAILogDetail.tsx    # Màn 3: Chi tiết 1 log (modal/page)
      AdminUsers.tsx          # Màn 4: Danh sách users
      AdminUserDetail.tsx     # Màn 4: Chi tiết 1 user
      AdminSettings.tsx       # Màn 5: Settings & AI config
  layouts/
    AdminLayout.tsx           # Layout riêng cho admin (sidebar + topbar)
  services/
    api/
      admin.api.ts            # Tất cả API calls cho admin
  types/
    dto/
      admin.dto.ts            # TypeScript interfaces cho admin
```

### 4.2 Routing trong App.tsx

**Thêm vào useEffect hashchange handler:**

```typescript
// Admin routes — mount AdminApp
} else if (hash.startsWith('#admin')) {
  setCurrentView('admin');
}
```

**Thêm vào renderCurrentView:**

```typescript
case 'admin':
  return <AdminApp />;
```

### 4.3 AdminApp component (sub-router)

**File:** `frontend/src/pages/admin/AdminApp.tsx`

AdminApp tự quản lý sub-routing bên trong:

```typescript
function AdminApp() {
  const [adminView, setAdminView] = useState('dashboard');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#admin/dashboard') setAdminView('dashboard');
      else if (hash === '#admin/prompts') setAdminView('prompts');
      else if (hash.startsWith('#admin/prompts/new')) setAdminView('prompt-form-new');
      else if (hash.startsWith('#admin/prompts/edit')) setAdminView('prompt-form-edit');
      else if (hash === '#admin/ai-logs') setAdminView('ai-logs');
      else if (hash.startsWith('#admin/ai-logs/')) setAdminView('ai-log-detail');
      else if (hash === '#admin/users') setAdminView('users');
      else if (hash.startsWith('#admin/users/')) setAdminView('user-detail');
      else if (hash === '#admin/settings') setAdminView('settings');
      else if (hash === '#admin/login') setAdminView('login');
      else setAdminView('dashboard');
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Nếu chưa login admin → redirect #admin/login
  // Nếu đã login → render AdminLayout > child view
}
```

### 4.4 Admin API service

**File:** `frontend/src/services/api/admin.api.ts`

```typescript
import { apiRequest } from './client';

// ─── Auth ─────────────────────────────
export function adminLogin(email: string, password: string) {
  return apiRequest<AdminLoginResponse>('/admin/login', {
    method: 'POST', body: { email, password }
  });
}

// ─── Prompts ──────────────────────────
export function getPrompts(params: PromptFilterParams) {
  const qs = new URLSearchParams(params as Record<string, string>);
  return apiRequest<PaginatedResponse<DailyPromptDTO>>(`/admin/prompts?${qs}`);
}

export function getPrompt(id: string) {
  return apiRequest<{ prompt: DailyPromptDTO }>(`/admin/prompts/${id}`);
}

export function createPrompt(data: CreatePromptDTO) {
  return apiRequest<{ prompt: DailyPromptDTO }>('/admin/prompts', {
    method: 'POST', body: data
  });
}

export function updatePrompt(id: string, data: Partial<CreatePromptDTO>) {
  return apiRequest<{ prompt: DailyPromptDTO }>(`/admin/prompts/${id}`, {
    method: 'PUT', body: data
  });
}

export function deletePrompt(id: string) {
  return apiRequest<{ message: string }>(`/admin/prompts/${id}`, { method: 'DELETE' });
}

// ─── Metrics ──────────────────────────
export function getMetricCards(date: string) {
  return apiRequest<MetricCardsDTO>(`/admin/metrics/cards?date=${date}`);
}

export function getMetricFunnel(from: string, to: string) {
  return apiRequest<FunnelDTO>(`/admin/metrics/funnel?from=${from}&to=${to}`);
}

export function getRetention(from: string, to: string) {
  return apiRequest<RetentionDTO>(`/admin/metrics/retention?from=${from}&to=${to}`);
}

export function getAIHealth(days: number) {
  return apiRequest<AIHealthDTO>(`/admin/metrics/ai-health?days=${days}`);
}

// ─── Users ────────────────────────────
export function getUsers(params: UserFilterParams) { ... }
export function getUser(id: string) { ... }

// ─── AI Logs ──────────────────────────
export function getAILogs(params: AILogFilterParams) { ... }
export function getAILog(id: string) { ... }

// ─── Config ───────────────────────────
export function getConfigs() { ... }
export function updateConfig(key: string, value: string) { ... }
```

### 4.5 TypeScript DTOs

**File:** `frontend/src/types/dto/admin.dto.ts`

```typescript
// ─── Prompt ──────────────────────────
export interface DailyPromptDTO {
  id: string;
  publishDate: string;       // "2026-03-30"
  status: 'draft' | 'scheduled' | 'published';
  internalTitle: string;
  promptVi: string;
  promptEn: string;
  followUp: string | null;
  level: 'basic' | 'intermediate' | 'advanced';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptDTO {
  publishDate: string;
  internalTitle: string;
  promptVi: string;
  promptEn: string;
  followUp?: string;
  level: string;
}

export interface PromptFilterParams {
  status?: string;
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
}

// ─── Metrics ─────────────────────────
export interface MetricCardsDTO {
  todaySessions: number;
  yesterdaySessions: number;
  completionRate: number;
  completionRateChange: number;
  aiErrorRate: number;
  aiErrorCount: number;
  day1ReturnRate: number;
  day1ReturnChange: number;
}

export interface FunnelStepDTO {
  step: string;
  count: number;
}

export interface FunnelDTO {
  steps: FunnelStepDTO[];
}

export interface CohortDTO {
  registeredDate: string;
  totalUsers: number;
  d1: number;
  d2: number;
  d3: number;
}

export interface RetentionDTO {
  cohorts: CohortDTO[];
}

export interface AIHealthDayDTO {
  date: string;
  avgLatencyMs: number;
  errorCount: number;
  totalRequests: number;
}

export interface AIHealthDTO {
  daily: AIHealthDayDTO[];
}

// ─── User ────────────────────────────
export interface AdminUserDTO {
  id: string;
  name: string;
  email: string | null;
  isGuest: boolean;
  role: string;
  createdAt: string;
  stats: {
    totalDays: number;
    currentStreak: number;
    totalJournals: number;
    lastActiveAt: string | null;
  };
}

export interface AdminUserDetailDTO {
  user: AdminUserDTO & {
    bio: string | null;
    nativeLanguage: string | null;
    onboarding: {
      completed: boolean;
      level: string | null;
      goal: string | null;
    } | null;
    stats: AdminUserDTO['stats'] & {
      totalWordsLearned: number;
      totalMinutes: number;
    };
  };
  recentJournals: Array<{
    id: string;
    title: string;
    content: string;
    status: string;
    score: number | null;
    createdAt: string;
  }>;
}

// ─── AI Log ──────────────────────────
export interface AILogDTO {
  id: string;
  userId: string;
  userName: string;
  journalId: string | null;
  inputText: string;
  outputText: string | null;
  model: string;
  statusCode: number;
  latencyMs: number;
  errorMessage: string | null;
  createdAt: string;
}

// ─── Config ──────────────────────────
export interface AppConfigDTO {
  key: string;
  value: string;
  updatedAt: string;
}

// ─── Common ──────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminLoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface UserFilterParams {
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
}

export interface AILogFilterParams {
  status?: string;
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
}
```

---

## 5. MÀN 0: ADMIN LOGIN

**File:** `AdminLogin.tsx`  
**Route:** `#admin/login`

### 5.1 Layout
- Toàn trang trắng, không sidebar.
- Box trung tâm vừa phải (max-w-sm), border-2 border-black.

### 5.2 Thành phần UI

| # | Element | Kiểu | Chi tiết |
|---|---|---|---|
| 1 | Logo | Text | "STICK Admin" — font-headline, font-black, italic |
| 2 | Subtitle | Text | "Pilot Control Panel" — text-sm, text-gray-500 |
| 3 | Email field | `<input type="email">` | Label: "Email". Placeholder: "admin@stick.app". Required. |
| 4 | Password field | `<input type="password">` | Label: "Password". Required. Show/hide toggle icon. |
| 5 | Error message | `<p>` | Ẩn mặc định. Hiện text đỏ nếu login sai. |
| 6 | Login button | `<button>` | Text: "Đăng nhập". Full-width. bg-black text-white. Disabled khi đang loading. |
| 7 | Back link | `<a>` | "← Về trang chính" → `#landing`. Text-sm, underline. |

### 5.3 Logic
1. Submit form → gọi `POST /admin/login` qua `adminLogin()`.
2. Thành công → lưu token vào `localStorage` key `stick_admin_token`, lưu admin user vào `stick_admin_user`.
3. Redirect → `#admin/dashboard`.
4. Sai → hiện error message từ API.

### 5.4 Auth guard
- AdminApp kiểm tra `stick_admin_token` tồn tại.
- Nếu không có → redirect `#admin/login`.
- Mỗi API call admin dùng token này (không dùng token user thường).

> **Lưu ý:** Admin token dùng chung hệ thống Session table. Khác biệt là endpoint `/admin/login` kiểm tra `role === "admin"` trước khi cấp token.

---

## 6. MÀN 1: DASHBOARD (PILOT OVERVIEW)

**File:** `AdminDashboard.tsx`  
**Route:** `#admin` hoặc `#admin/dashboard`

### 6.1 Hàng 1: Metric Cards (4 thẻ ngang)

#### Card 1: Today Sessions
| Thuộc tính | Giá trị |
|---|---|
| Label | "Sessions hôm nay" |
| Giá trị chính | `todaySessions` (số to, font-black, text-3xl) |
| So sánh | "vs hôm qua: {yesterdaySessions}" — text-sm |
| Badge | Xanh nếu `todaySessions >= yesterdaySessions`, Đỏ nếu thấp hơn |
| Icon | `group` (Material Symbol) |

#### Card 2: Completion Rate
| Thuộc tính | Giá trị |
|---|---|
| Label | "Completion Rate" |
| Giá trị chính | `completionRate` format `67%` |
| So sánh | Mũi tên ▲/▼ + `completionRateChange` |
| Badge | Xanh nếu ≥ 60% (target), Vàng nếu 40-60%, Đỏ nếu < 40% |
| Icon | `check_circle` |

#### Card 3: AI Error Rate
| Thuộc tính | Giá trị |
|---|---|
| Label | "AI Error Rate" |
| Giá trị chính | `aiErrorRate` format `2.1%` |
| Chi tiết | "{aiErrorCount} lỗi hôm nay" |
| Badge | Xanh nếu < 5%, Đỏ nếu ≥ 5% |
| Icon | `error` |

#### Card 4: Day 1 Return
| Thuộc tính | Giá trị |
|---|---|
| Label | "D1 Return Rate" |
| Giá trị chính | `day1ReturnRate` format `58%` |
| So sánh | Mũi tên ▲/▼ + `day1ReturnChange` |
| Badge | Xanh nếu ≥ 40% (target), Đỏ nếu < 40% |
| Icon | `redo` |

**Gọi API:** `getMetricCards(today)` khi mount.

### 6.2 Hàng 2: Charts (2 cột)

#### Chart trái: Core Funnel (Bar Chart)
- **Thư viện chart:** Không dùng thư viện nặng. Dùng **div bars thuần CSS** (thanh ngang, chiều rộng tỉ lệ %).
- Mỗi thanh hiện: tên step + count + thanh bar + % so với step trước.
- 6 steps: Start → Prompt View → Draft Saved → Submitted → Feedback View → Completed.
- Màu: thanh gradient từ đậm → nhạt (black → gray-300).
- **Gọi API:** `getMetricFunnel(from, to)`. Default: 7 ngày gần nhất.

| # | Element UI | Chi tiết |
|---|---|---|
| 1 | Card title | "Core Funnel" — font-bold |
| 2 | Date range picker | 2 input[type=date]: Từ / Đến. Default: 7 ngày |
| 3 | Bar rows (×6) | Mỗi row: label (trái) + bar (giữa, width = count/maxCount * 100%) + count (phải) |
| 4 | Drop-off % | Giữa mỗi 2 bước: text nhỏ "↓ -12%" màu đỏ nếu > 20% drop |

#### Chart phải: AI Health (Latency + Errors)
- **Hiển thị dạng table đơn giản** (không cần chart library).
- 7 dòng (7 ngày gần nhất).
- Cột: Ngày | Avg Latency | Errors | Total Requests.
- Latency > 2000ms → highlight đỏ. Error > 0 → highlight vàng.
- **Gọi API:** `getAIHealth(7)`.

| # | Element UI | Chi tiết |
|---|---|---|
| 1 | Card title | "AI Health (7 ngày)" |
| 2 | Table header | Ngày · Latency (ms) · Errors · Requests |
| 3 | Table rows (×7) | Mỗi row format ngày, latency (bold nếu > 2s), error count (badge đỏ nếu > 0) |

### 6.3 Hàng 3: Cohort Retention

- **Hiển thị dạng table.**
- Dòng = ngày đăng ký. Cột = D1, D2, D3.
- Cell hiện % + background color (xanh đậm = tốt, đỏ nhạt = xấu).
- **Gọi API:** `getRetention(from, to)`. Default: 10 ngày gần nhất.

| # | Element UI | Chi tiết |
|---|---|---|
| 1 | Card title | "Cohort Retention" |
| 2 | Date range | Mặc định 10 ngày gần nhất |
| 3 | Table header | Ngày ĐK · Users · D1 · D2 · D3 |
| 4 | Table cells | % format. Background: green nếu đạt target, red nếu dưới. D1 target: 40%, D2: 25% |

### 6.4 Nút hành động
| Vị trí | Nút | Action |
|---|---|---|
| Góc phải trên | "Refresh" (icon `refresh`) | Gọi lại tất cả API |

---

## 7. MÀN 2: PROMPTS MANAGEMENT

### 7.1 Danh sách Prompts

**File:** `AdminPrompts.tsx`  
**Route:** `#admin/prompts`

#### Header
| # | Element | Kiểu | Chi tiết |
|---|---|---|---|
| 1 | Page title | `<h1>` | "Quản lý Prompts" — font-headline, font-bold |
| 2 | Nút tạo mới | `<button>` | "+ Tạo Prompt" — bg-black text-white rounded. Click → `#admin/prompts/new` |

#### Filter bar
| # | Element | Kiểu | Chi tiết |
|---|---|---|---|
| 1 | Status dropdown | `<select>` | Options: "Tất cả", "Draft", "Scheduled", "Published". Default: "Tất cả" |
| 2 | Date from | `<input type="date">` | Label: "Từ ngày" |
| 3 | Date to | `<input type="date">` | Label: "Đến ngày" |
| 4 | Nút lọc | `<button>` | "Lọc" — border-2 border-black. Gọi lại API với filter |
| 5 | Nút reset | `<button>` | "Xoá lọc" — text-sm underline. Reset về mặc định |

#### Table
| Cột | Width | Hiển thị |
|---|---|---|
| Trạng thái | 100px | Badge màu: Xám = Draft, Vàng = Scheduled, Xanh = Published |
| Ngày | 120px | Format: DD/MM/YYYY |
| Tiêu đề | flex-1 | `internalTitle` — truncate nếu dài |
| Prompt EN | 200px | Cắt 50 ký tự + "..." |
| Level | 100px | Badge: "Basic" / "Intermediate" / "Advanced" |
| Actions | 150px | 3 nút icon |

#### Action buttons mỗi dòng
| Nút | Icon | Tooltip | Action |
|---|---|---|---|
| Edit | `edit` | "Sửa" | Navigate → `#admin/prompts/edit?id={id}` |
| Copy | `content_copy` | "Nhân đôi" | Tạo prompt mới với nội dung copy, publishDate trống |
| Delete | `delete` | "Xoá" | Hiện confirm dialog → gọi `DELETE /admin/prompts/:id` |

#### Pagination (dưới table)
| # | Element | Chi tiết |
|---|---|---|
| 1 | Info text | "Hiển thị 1-20 / 45 prompts" |
| 2 | Prev button | "← Trước" — disabled nếu page = 1 |
| 3 | Page number | Số trang hiện tại |
| 4 | Next button | "Tiếp →" — disabled nếu cuối |

#### Empty state
- Khi chưa có prompt nào: icon `post_add`, text "Chưa có prompt nào. Tạo prompt đầu tiên!", nút "Tạo Prompt".

**Gọi API:** `getPrompts({ status, page, limit: '20', from, to })`

### 7.2 Form Tạo/Sửa Prompt

**File:** `AdminPromptForm.tsx`  
**Route:** `#admin/prompts/new` hoặc `#admin/prompts/edit?id={id}`

#### Form fields (từ trên xuống dưới)

| # | Field | Element | Validation | Ghi chú |
|---|---|---|---|---|
| 1 | Ngày hiển thị | `<input type="date">` | Required. Không được trùng ngày đã có prompt khác. | Label: "Ngày hiển thị cho user" |
| 2 | Tiêu đề nội bộ | `<input type="text">` | Required. Max 200 chars. | Label: "Tiêu đề nội bộ (user không thấy)". Placeholder: "VD: Topic đồ ăn sáng" |
| 3 | Prompt tiếng Việt | `<textarea>` | Required. | Label: "Prompt tiếng Việt". Placeholder: "Sáng nay bạn ăn gì?". Rows: 3. |
| 4 | Prompt tiếng Anh | `<textarea>` | Required. | Label: "Prompt tiếng Anh". Placeholder: "What did you have for breakfast?". Rows: 3. |
| 5 | Gợi ý / Follow-up | `<textarea>` | Optional. | Label: "Gợi ý cách viết / Từ vựng mồi". Placeholder: "cereal, toast, congee...". Rows: 4. |
| 6 | Level | `<select>` | Required. | Options: "Cơ bản (Basic)", "Trung bình (Intermediate)", "Nâng cao (Advanced)". Default: "Basic". |

#### Action buttons (bottom bar cố định)

| Vị trí | Nút | Kiểu | Action | Điều kiện |
|---|---|---|---|---|
| Trái | Quay lại | Text link "← Danh sách" | Navigate `#admin/prompts` | Luôn hiện |
| Trái (nếu edit) | Xoá | Icon `delete` + "Xoá" — text-red-600 | Confirm dialog → DELETE → redirect list | Chỉ khi edit |
| Phải | Lưu nháp | Border button "Lưu nháp" | Save với `status: "draft"` | Luôn hiện |
| Phải | Lên lịch | Primary button "Lưu & Lên lịch" — bg-black text-white | Save với `status: "scheduled"` | Luôn hiện |

#### Preview section
- Dưới form, box border-2 border-dashed border-gray-300.
- Tiêu đề: "Preview — User sẽ thấy thế này:".
- Hiện prompt EN + prompt VI + follow-up trong layout giống Daily Task screen.
- Auto-update khi user gõ (debounce 300ms).

#### Loading & Error states
| State | Hiển thị |
|---|---|
| Loading (edit mode) | Skeleton cho 6 fields |
| Saving | Button disabled, hiện spinner |
| Error 409 (date conflict) | Toast hoặc inline error dưới date field: "Đã có prompt cho ngày này" |
| Error khác | Toast đỏ với message từ API |
| Save thành công | Toast xanh "Đã lưu!" + redirect về list sau 1s |

---

## 8. MÀN 3: AI LOGS & TUNING

### 8.1 Danh sách AI Logs

**File:** `AdminAILogs.tsx`  
**Route:** `#admin/ai-logs`

#### Header
| # | Element | Chi tiết |
|---|---|---|
| 1 | Page title | "AI Logs" |
| 2 | Stats summary | "Hôm nay: {total} requests · {errors} errors · Avg {latency}ms" |

#### Filter bar
| # | Element | Kiểu | Chi tiết |
|---|---|---|---|
| 1 | Status filter | `<select>` | "Tất cả", "Thành công (200)", "Lỗi (500)" |
| 2 | Date from | `<input type="date">` | |
| 3 | Date to | `<input type="date">` | |
| 4 | Nút lọc | `<button>` | "Lọc" |

#### Table
| Cột | Width | Hiển thị |
|---|---|---|
| Thời gian | 150px | Format: HH:mm DD/MM |
| User | 150px | userName — truncate |
| Input (Draft) | flex-1 | Cắt 80 ký tự + "..." |
| Status | 80px | Badge: Xanh "200" hoặc Đỏ "500" |
| Latency | 100px | "{ms}ms" — Bold đỏ nếu > 2000ms |
| Action | 80px | Nút "Xem" |

#### Click "Xem" → Modal chi tiết

### 8.2 Modal Chi tiết AI Log

**Mở khi click "Xem" trên row. Hoặc route `#admin/ai-logs/{id}`.**

| Section | Nội dung |
|---|---|
| Header | "AI Log #{id short}" + timestamp + badge status |
| User info | Name + email + link "Xem user →" |
| Input | Full bài viết gốc — box bg-gray-50, monospace |
| Output | Parsed feedback hiển thị giống FeedbackResult của user: Enhanced text, Corrections, Vocab boosters, Sentence patterns, Encouragement. Mỗi block tách rõ. |
| Meta | Model: llama-3.3-70b-versatile · Latency: 1340ms · Status: 200 |
| Error (nếu có) | Box đỏ hiện errorMessage |
| Close button | Nút "Đóng" hoặc click overlay |

### 8.3 System Prompt Editor (trong Settings, không ở đây)

> System prompt tuning nằm ở Màn 5: Settings, section "AI Configuration".

---

## 9. MÀN 4: USERS EXPLORER

### 9.1 Danh sách Users

**File:** `AdminUsers.tsx`  
**Route:** `#admin/users`

#### Header
| # | Element | Chi tiết |
|---|---|---|
| 1 | Page title | "Users" |
| 2 | Total count | "{total} users" — text-sm |

#### Search bar
| # | Element | Kiểu | Chi tiết |
|---|---|---|---|
| 1 | Search input | `<input type="text">` | Placeholder: "Tìm theo email hoặc tên...". Icon `search` bên trái. Debounce 400ms. |

#### Table
| Cột | Width | Hiển thị |
|---|---|---|
| User | 200px | Avatar placeholder (chữ cái đầu) + Name + Email dưới nhỏ |
| Đăng ký | 120px | Format: DD/MM/YYYY |
| Ngày đã học | 80px | `stats.totalDays` |
| Streak | 80px | `stats.currentStreak` + icon 🔥 nếu > 0 |
| Journals | 80px | `stats.totalJournals` |
| Active | 120px | `stats.lastActiveAt` format "2 giờ trước" hoặc "3 ngày trước" |
| Action | 80px | Nút "Chi tiết" |

#### Pagination
- Giống Prompts: "Hiển thị X-Y / Z users" + Prev/Next.

#### Empty state
- icon `person_search`, text "Không tìm thấy user nào."

### 9.2 Chi tiết User

**File:** `AdminUserDetail.tsx`  
**Route:** `#admin/users/{id}`

#### Layout: 2 phần

**Phần trái (1/3): User Profile Card**
| # | Element | Chi tiết |
|---|---|---|
| 1 | Avatar | Circle lớn với chữ cái đầu, bg-primary |
| 2 | Name | font-bold, text-xl |
| 3 | Email | text-sm, text-gray-500 |
| 4 | Role badge | "user" hoặc "admin" |
| 5 | Guest badge | Hiện nếu isGuest = true |
| 6 | Bio | text nếu có |
| 7 | Native language | VD: "Vietnamese" |
| 8 | Registered | DD/MM/YYYY |
| 9 | Onboarding | Level + Goal + Completed (✓/✗) |

**Phần phải (2/3): Stats + Journals**

**Stats row (4 mini cards):**
| Card | Label | Value |
|---|---|---|
| 1 | Ngày đã học | `totalDays` |
| 2 | Streak hiện tại | `currentStreak` |
| 3 | Từ đã học | `totalWordsLearned` |
| 4 | Tổng thời gian | `totalMinutes` format "4h 00m" |

**Recent Journals table:**
| Cột | Hiển thị |
|---|---|
| Ngày | Format DD/MM HH:mm |
| Tiêu đề | journal.title |
| Nội dung | Cắt 100 ký tự |
| Status | Badge: draft/submitted/reviewed |
| Score | Số / 100 hoặc "—" |

**Action buttons:**
| Nút | Action |
|---|---|
| "← Quay lại" | Navigate `#admin/users` |
| "Xem AI Logs" | Navigate `#admin/ai-logs?userId={id}` (filter AI logs theo user) |

---

## 10. MÀN 5: SETTINGS

**File:** `AdminSettings.tsx`  
**Route:** `#admin/settings`

### 10.1 Section: AI Configuration

| # | Field | Element | Chi tiết |
|---|---|---|---|
| 1 | System Prompt | `<textarea>` | Rows: 12. Font monospace. bg-gray-900 text-green-400 (terminal style). Value từ config key `ai_system_prompt`. |
| 2 | AI Model | `<input>` readonly | Hiện giá trị từ `ai_model`. Chỉ xem, không sửa trực tiếp (để tránh phá). |
| 3 | Temperature | `<input type="number">` | Min: 0, Max: 1, Step: 0.1. Config key: `ai_temperature`. |
| 4 | Max Tokens | `<input type="number">` | Min: 500, Max: 4000. Config key: `ai_max_tokens`. |
| 5 | Nút save | "Lưu cấu hình AI" | Gọi `PUT /admin/config/:key` cho mỗi field đã thay đổi. |

### 10.2 Section: App Configuration

| # | Field | Element | Chi tiết |
|---|---|---|---|
| 1 | Maintenance Mode | Toggle switch | Config key: `maintenance_mode`. Value: "true"/"false". |
| 2 | Nút save | "Lưu" | |

### 10.3 Section: Admin Account

| # | Element | Chi tiết |
|---|---|---|
| 1 | Hiện email admin đang login | Read-only |
| 2 | Nút "Đổi mật khẩu" | Mở inline form: password cũ + password mới + xác nhận. Gọi API riêng. |
| 3 | Nút "Đăng xuất" | Clear `stick_admin_token` + redirect `#admin/login` |

---

## 11. ADMINLAYOUT — SIDEBAR + TOPBAR

**File:** `AdminLayout.tsx`

### 11.1 Sidebar (fixed left)

| Thuộc tính | Giá trị |
|---|---|
| Width | 240px |
| Position | fixed left top |
| Background | bg-gray-950 (gần đen) |
| Text color | text-gray-300, active: text-white |
| Border | border-r border-gray-800 |
| Height | h-screen, overflow-y-auto |

#### Sidebar content

| # | Section | Chi tiết |
|---|---|---|
| 1 | Logo | "STICK" — text-xl font-black italic text-white. Dưới: "Admin Panel" text-xs text-gray-500 |
| 2 | Divider | border-t border-gray-800, my-4 |
| 3 | Nav: Dashboard | Icon `dashboard` + "Dashboard". href: `#admin/dashboard` |
| 4 | Nav: Prompts | Icon `edit_note` + "Prompts". href: `#admin/prompts` |
| 5 | Nav: AI Logs | Icon `smart_toy` + "AI Logs". href: `#admin/ai-logs` |
| 6 | Nav: Users | Icon `group` + "Users". href: `#admin/users` |
| 7 | Nav: Settings | Icon `settings` + "Settings". href: `#admin/settings` |
| 8 | Divider | border-t border-gray-800, mt-auto |
| 9 | Admin info | Tên admin + email. text-sm. |
| 10 | Logout | Icon `logout` + "Đăng xuất". text-red-400. |

#### Active state cho nav item
- Background: bg-gray-800
- Text: text-white font-bold
- Left border: border-l-4 border-white

#### Inactive state
- hover:bg-gray-900
- text-gray-400

### 11.2 Topbar

| Thuộc tính | Giá trị |
|---|---|
| Height | 56px |
| Position | sticky top, left = sidebar width (240px) |
| Background | bg-white border-b border-gray-200 |
| Padding | px-6 |

#### Topbar content

| # | Vị trí | Element | Chi tiết |
|---|---|---|---|
| 1 | Left | Page title | Dynamic theo route. font-semibold text-lg. |
| 2 | Right | Admin name | "Xin chào, {name}" — text-sm text-gray-500 |

### 11.3 Main content area

```
margin-left: 240px (sidebar width)
margin-top: 56px (topbar height)
padding: 24px
background: bg-gray-50
min-height: calc(100vh - 56px)
```

### 11.4 Responsive
- **Pilot phase:** Admin chỉ dùng trên desktop. Không cần responsive phức tạp.
- Min-width: 1024px. Dưới đó hiện thông báo "Vui lòng dùng máy tính".

---

## 12. THỨ TỰ TRIỂN KHAI

### Phase 1: Foundation (Backend + Auth + Layout)
| Step | Task | Files |
|---|---|---|
| 1.1 | Thêm `role` field vào User model + migration | `schema.prisma` |
| 1.2 | Tạo 3 models mới (DailyPrompt, AILog, AppConfig) + migration | `schema.prisma` |
| 1.3 | Seed admin user (set role = "admin") | `seed.js` hoặc SQL trực tiếp |
| 1.4 | Tạo `requireAdmin` middleware | `backend/src/middlewares/requireAdmin.js` |
| 1.5 | Tạo `POST /admin/login` route | `apiV1.js` hoặc `adminRoutes.js` |
| 1.6 | Tạo `AdminLayout.tsx` (sidebar + topbar) | `frontend/src/layouts/AdminLayout.tsx` |
| 1.7 | Tạo `AdminApp.tsx` (sub-router) | `frontend/src/pages/admin/AdminApp.tsx` |
| 1.8 | Tạo `AdminLogin.tsx` | `frontend/src/pages/admin/AdminLogin.tsx` |
| 1.9 | Thêm `#admin` routing vào `App.tsx` | `frontend/src/App.tsx` |
| 1.10 | Tạo `admin.api.ts` + `admin.dto.ts` | `frontend/src/services/api/admin.api.ts`, `types/dto/admin.dto.ts` |
| 1.11 | Verify: login admin → thấy sidebar + dashboard trống | Manual test |

### Phase 2: Prompts (M8 core — P0)
| Step | Task | Files |
|---|---|---|
| 2.1 | Backend: CRUD routes cho `/admin/prompts` | `apiV1.js` |
| 2.2 | Frontend: `AdminPrompts.tsx` (list + filter + pagination) | |
| 2.3 | Frontend: `AdminPromptForm.tsx` (create/edit form + preview) | |
| 2.4 | Backend: Route `GET /daily-prompt/today` cho user app (thay thế hardcode prompt) | `apiV1.js` |
| 2.5 | Frontend user app: Journal page gọi `/daily-prompt/today` thay vì prompt cứng | `Journal.tsx` |
| 2.6 | Verify: tạo prompt → user app hiện đúng prompt ngày đó | Manual test |

### Phase 3: Dashboard Metrics (P0)
| Step | Task | Files |
|---|---|---|
| 3.1 | Backend: `GET /admin/metrics/cards` (aggregate từ ProgressDaily, Journal, AILog) | |
| 3.2 | Backend: `GET /admin/metrics/funnel` (aggregate từ ProgressDaily) | |
| 3.3 | Backend: `GET /admin/metrics/retention` (aggregate từ User + ProgressDaily) | |
| 3.4 | Backend: `GET /admin/metrics/ai-health` (aggregate từ AILog) | |
| 3.5 | Frontend: `AdminDashboard.tsx` (4 cards + funnel + AI health + retention) | |
| 3.6 | Verify: dashboard hiện số liệu chính xác | Manual test |

### Phase 4: AI Logs (P1)
| Step | Task | Files |
|---|---|---|
| 4.1 | Backend: Ghi AILog từ route `/ai/feedback/text` | `apiV1.js` |
| 4.2 | Backend: `GET /admin/ai-logs` + `GET /admin/ai-logs/:id` | |
| 4.3 | Frontend: `AdminAILogs.tsx` (list + filter) | |
| 4.4 | Frontend: `AdminAILogDetail.tsx` (modal chi tiết) | |
| 4.5 | Verify: gửi bài → AI log xuất hiện trong admin | Manual test |

### Phase 5: Users Explorer (P1)
| Step | Task | Files |
|---|---|---|
| 5.1 | Backend: `GET /admin/users` + `GET /admin/users/:id` | |
| 5.2 | Frontend: `AdminUsers.tsx` (list + search) | |
| 5.3 | Frontend: `AdminUserDetail.tsx` (profile + stats + journals) | |
| 5.4 | Verify: tìm user → xem chi tiết + lịch sử journals | Manual test |

### Phase 6: Settings (P2)
| Step | Task | Files |
|---|---|---|
| 6.1 | Backend: `GET /admin/config` + `PUT /admin/config/:key` | |
| 6.2 | Seed initial AppConfig rows | |
| 6.3 | Backend: `groqAI.js` đọc system prompt từ AppConfig thay vì hardcode | |
| 6.4 | Frontend: `AdminSettings.tsx` (AI config + app config + account) | |
| 6.5 | Verify: thay đổi system prompt → AI feedback thay đổi | Manual test |

---

## 13. CHECKLIST NGHIỆM THU

### Bắt buộc (P0)
- [ ] Admin login bằng email+password, non-admin bị chặn (403)
- [ ] Sidebar hiện 5 mục, navigate đúng
- [ ] Tạo prompt mới với đầy đủ fields → lưu thành công
- [ ] Sửa prompt → cập nhật đúng
- [ ] Xoá prompt → confirm → biến mất
- [ ] Prompt lên lịch cho ngày X → user mở app ngày X thấy prompt đó (FR-10)
- [ ] Dashboard: 4 metric cards hiện số liệu hôm nay
- [ ] Dashboard: funnel hiện đúng 6 steps
- [ ] Dashboard: retention table hiện cohort D1/D2/D3

### Quan trọng (P1)
- [ ] AI Logs: sau khi user gửi bài, log xuất hiện trong admin
- [ ] AI Logs: click "Xem" → modal hiện full input + parsed output
- [ ] Users: tìm kiếm bằng email → đúng kết quả
- [ ] Users: click chi tiết → thấy profile + stats + journals
- [ ] Settings: sửa system prompt → save → AI feedback dùng prompt mới

### Bảo vệ sản phẩm
- [ ] Admin web không ảnh hưởng tới app user (route tách, API tách)
- [ ] User thường không truy cập được route `/admin/*` (403)
- [ ] Token admin tách biệt token user trong localStorage
- [ ] Không có analytics event nào bị mất sau khi thêm admin code
- [ ] Build size tăng không quá 50KB gzipped
- [ ] Admin không tạo thêm ma sát cho core loop

### Pilot ops
- [ ] Có thể tạo 10 prompts cho 10 ngày tới trong < 5 phút
- [ ] Dashboard cho biết ngay app "sống hay chết" trong 10 giây đầu nhìn vào
- [ ] Khi AI error rate > 5%, card hiện đỏ rõ ràng
- [ ] Khi D1 retention < 40%, card hiện cảnh báo

---

## PHỤ LỤC: TÓM TẮT FILE CẦN TẠO/SỬA

### Backend (tạo mới)
| File | Mô tả |
|---|---|
| `backend/src/middlewares/requireAdmin.js` | Middleware kiểm tra role admin |

### Backend (sửa)
| File | Thay đổi |
|---|---|
| `backend/prisma/schema.prisma` | Thêm `role` vào User, thêm 3 models |
| `backend/src/routes/apiV1.js` | Thêm tất cả admin routes + ghi AILog |
| `backend/src/lib/groqAI.js` | Đọc system prompt từ AppConfig |
| `backend/src/lib/auth.js` | Export `sanitizeUser` thêm field `role` |

### Frontend (tạo mới)
| File | Mô tả |
|---|---|
| `frontend/src/pages/admin/AdminApp.tsx` | Sub-router + auth guard |
| `frontend/src/pages/admin/AdminLogin.tsx` | Màn login admin |
| `frontend/src/pages/admin/AdminDashboard.tsx` | Dashboard metrics |
| `frontend/src/pages/admin/AdminPrompts.tsx` | Danh sách prompts |
| `frontend/src/pages/admin/AdminPromptForm.tsx` | Form tạo/sửa prompt |
| `frontend/src/pages/admin/AdminAILogs.tsx` | Danh sách AI logs |
| `frontend/src/pages/admin/AdminAILogDetail.tsx` | Modal chi tiết log |
| `frontend/src/pages/admin/AdminUsers.tsx` | Danh sách users |
| `frontend/src/pages/admin/AdminUserDetail.tsx` | Chi tiết user |
| `frontend/src/pages/admin/AdminSettings.tsx` | Settings & AI config |
| `frontend/src/layouts/AdminLayout.tsx` | Layout sidebar + topbar |
| `frontend/src/services/api/admin.api.ts` | API calls cho admin |
| `frontend/src/types/dto/admin.dto.ts` | TypeScript interfaces |

### Frontend (sửa)
| File | Thay đổi |
|---|---|
| `frontend/src/App.tsx` | Thêm `#admin` routing |
| `frontend/src/pages/app/Journal.tsx` | Gọi `/daily-prompt/today` thay vì prompt cứng |
| `frontend/src/services/api/client.ts` | Thêm hỗ trợ admin token |

---

> **Tổng kết:** 13 file frontend mới, 1 file backend mới, 5 file sửa.  
> **Ưu tiên:** Phase 1 (Foundation) → Phase 2 (Prompts) → Phase 3 (Dashboard) là P0.  
> **Không được mở rộng ra ngoài phạm vi này trong pilot.**

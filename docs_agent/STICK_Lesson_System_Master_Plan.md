# STICK — LESSON SYSTEM MASTER PLAN
### Phiên bản: 1.0 · Ngày: 2025-07-14 · Trạng thái: CHỜ DUYỆT

---

## MỤC LỤC

| # | Vấn đề lớn | Mô tả |
|---|-----------|-------|
| 1 | Kiến trúc nội dung bài học | Cấu trúc Unit → Module → Lesson → Section → Exercise; content schema |
| 2 | Admin Lesson Management | CRUD, preview, publish workflow, version control |
| 3 | Learning Flow UX | Luồng học step-by-step kiểu Duolingo nhưng giữ chất STICK |
| 4 | Vocabulary Integration | Liên kết từ vựng mới vào bài học, SRS, daily vocab |
| 5 | Scoring & XP System | Chấm điểm chi tiết, combo, heart/lives, anti-farming |
| 6 | Quiz & Exercise Engine | Các loại bài tập, AI-generated, adaptive difficulty |
| 7 | Premium Monetization | Free vs Premium, paywall, content gating |
| 8 | Progress & Analytics | Tracking tiến bộ, learning path, dashboard |
| 9 | AI-Powered Personalization | Adaptive content, weak-area targeting, AI prompt design |
| 10 | Gamification & Retention | Streaks, achievements, leaderboard, social proof |

---

## NGUYÊN TẮC THIẾT KẾ XÂM NHẬP MỌI QUYẾT ĐỊNH

> **STICK không phải Duolingo clone.**
> STICK là công cụ micro-learning hàng ngày giúp hình thành **thói quen suy nghĩ bằng tiếng Anh**.

1. **Core loop trước hết** — Write → AI Feedback → Review → Shadowing → Complete → Return next day. Mọi tính năng Lesson phải **bổ trợ** core loop, không cạnh tranh hoặc thay thế.
2. **Nhẹ, nhanh, không giống lớp học** — Một lesson STICK kéo dài 3–7 phút, không phải 30 phút.
3. **Cảm giác tiến bộ > độ khó** — User phải **thấy** mình giỏi hơn mỗi ngày.
4. **Duolingo DNA chỉ lấy cơ chế, không lấy cảm giác** — Lấy: unlock flow, XP, streaks, exercise variety. Không lấy: cartoon UI, hearts gây ức chế, gamification nặng nề.
5. **Premium is unlock, not lock** — Free users vẫn có giá trị. Premium users được nhiều hơn, không phải bớt bị chặn.

---

## 1. KIẾN TRÚC NỘI DUNG BÀI HỌC

### Tổng quan
Chuyển từ flat list (hiện tại: 9 bài rời rạc) sang **hệ thống phân cấp có learning path rõ ràng**.

### 1.1 Content Hierarchy

```
Learning Path (e.g. "Everyday English")
  └── Unit (e.g. "Daily Routines" — 5-8 lessons)
        └── Module (e.g. "Morning Habits" — 2-3 lessons)
              └── Lesson (e.g. "What I do first thing" — 3-7 phút)
                    └── Section (text / vocab / grammar / exercise / dialogue)
                          └── Exercise (fill-blank / match / reorder / speak / write)
```

**Tại sao cần hierarchy?**
- Flat list không tạo **cảm giác tiến bộ** (vi phạm nguyên tắc #3).
- User không biết **học gì tiếp theo**.
- Admin không thể quản lý 100+ bài rời rạc.
- Premium gating cần đơn vị lớn hơn (Unit) chứ không phải từng bài.

### 1.2 Database Schema mở rộng

```prisma
model LearningPath {
  id          Int      @id @default(autoincrement())
  slug        String   @unique                     // everyday-english
  title       String                                // Everyday English
  titleVi     String?                               // Tiếng Anh Hàng Ngày
  description String   @db.Text
  coverImage  String?
  level       String   @default("beginner")         // beginner | intermediate | advanced
  isPremium   Boolean  @default(false)
  orderIndex  Int      @default(0)
  published   Boolean  @default(false)
  units       Unit[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Unit {
  id             Int          @id @default(autoincrement())
  learningPathId Int
  learningPath   LearningPath @relation(fields: [learningPathId], references: [id])
  slug           String
  title          String
  titleVi        String?
  description    String?      @db.Text
  coverImage     String?
  orderIndex     Int          @default(0)
  isPremium      Boolean      @default(false)
  published      Boolean      @default(false)
  modules        Module[]
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@unique([learningPathId, slug])
}

model Module {
  id          Int      @id @default(autoincrement())
  unitId      Int
  unit        Unit     @relation(fields: [unitId], references: [id])
  title       String
  titleVi     String?
  orderIndex  Int      @default(0)
  published   Boolean  @default(false)
  lessons     Lesson[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Lesson model MỞ RỘNG (thay đổi so với hiện tại)
model Lesson {
  id          Int      @id @default(autoincrement())
  moduleId    Int?                                   // nullable để backward-compatible với data cũ
  module      Module?  @relation(fields: [moduleId], references: [id])
  title       String
  titleVi     String?
  description String?  @db.Text
  category    String   @default("grammar")
  level       String   @default("beginner")
  content     String   @db.LongText                  // JSON sections array
  duration    Int      @default(5)                    // phút ước tính
  orderIndex  Int      @default(0)
  published   Boolean  @default(false)
  xpReward    Int      @default(15)                   // XP khi hoàn thành (có thể thay đổi theo bài)
  isPremium   Boolean  @default(false)
  tags        String?                                 // JSON array: ["morning", "routine", "present-tense"]
  vocabIds    String?                                 // JSON array: liên kết lesson → vocab items
  aiGenerated Boolean  @default(false)                // đánh dấu bài do AI tạo
  version     Int      @default(1)                    // version control
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 1.3 Content Section Schema (JSON `content` field)

```typescript
// Mỗi lesson.content là JSON.stringify(LessonSection[])

type SectionType =
  | "text"            // đoạn giải thích
  | "vocabulary"      // từ vựng cards
  | "grammar_rule"    // quy tắc ngữ pháp
  | "practice"        // bài tập viết tự do
  | "dialogue"        // hội thoại mẫu
  | "fill_blank"      // điền vào chỗ trống
  | "match"           // nối từ — nghĩa
  | "reorder"         // sắp xếp từ thành câu
  | "multiple_choice" // trắc nghiệm
  | "listen_write"    // nghe và viết lại
  | "speak"           // đọc theo (shadowing)
  | "image_describe"  // mô tả hình ảnh

interface LessonSection {
  type: SectionType
  title?: string
  titleVi?: string
  content?: string         // cho type text, grammar_rule
  items?: VocabItem[]      // cho type vocabulary
  exercises?: Exercise[]   // cho fill_blank, match, reorder, multiple_choice
  lines?: DialogueLine[]   // cho type dialogue
  audioUrl?: string        // cho listen_write, speak
  imageUrl?: string        // cho image_describe
  hint?: string            // gợi ý cho user
  explanation?: string     // giải thích sau khi trả lời
}

interface VocabItem {
  word: string
  meaning: string
  meaningVi?: string
  example: string
  audioUrl?: string
  partOfSpeech?: string    // noun, verb, adj, adv, phrase
}

interface Exercise {
  prompt: string           // câu hỏi / đề bài
  type: "fill_blank" | "match" | "reorder" | "multiple_choice"
  options?: string[]       // các lựa chọn
  correct: number | number[] | string  // đáp án
  explanation?: string     // giải thích sau khi trả lời
  points?: number          // điểm cho exercise này (default: 10)
}

interface DialogueLine {
  speaker: string
  text: string
  translation?: string
  audioUrl?: string
}
```

### 1.4 Backward Compatibility

- Lesson hiện tại (`moduleId = null`) vẫn hiển thị bình thường trong Library.
- Frontend check: nếu `moduleId != null` → hiển thị trong learning path; nếu `null` → hiển thị trong "Standalone Lessons" tab.
- Migration: seed data cũ không bị xóa, chỉ thêm `moduleId` nullable.

### 1.5 Content Authoring Flow

```
Admin viết lesson → Preview trên admin → Publish → User thấy
AI generate draft → Admin review/edit → Publish → User thấy
```

### 1.6 Content Validation Rules

- Mỗi lesson phải có ≥ 2 sections.
- Mỗi lesson phải có ≥ 1 exercise section (fill_blank, match, reorder, hoặc multiple_choice).
- Vocabulary section phải có ≥ 3 items.
- Exercise phải có `correct` field hợp lệ.
- `content` field phải parse được thành JSON array.

### 1.7 Tagging & Search

- Tags cho phép admin nhóm bài theo chủ đề cross-unit.
- Frontend search tìm theo: title, description, tags, category.
- Tags cũng dùng cho AI recommendation engine.

### 1.8 Content Localization

- Mỗi section có thể có `titleVi` (tiếng Việt) cho hint/explanation.
- Vocabulary items có `meaningVi` bên cạnh `meaning` (English).
- Phục vụ đối tượng người Việt học tiếng Anh — core target audience.

### 1.9 Lesson Difficulty Curve

```
Unit 1: 80% text/vocab, 20% exercises (gentle intro)
Unit 2: 60% text/vocab, 40% exercises
Unit 3: 40% text/vocab, 60% exercises
Unit 4+: 30% text/vocab, 70% exercises (heavy practice)
```

Đảm bảo user được **dạy trước khi bị test** — không ném bài tập ngay lập tức.

### 1.10 Content Versioning

- Mỗi lesson có `version` field (1, 2, 3...).
- Khi admin edit lesson đã published: tạo version mới, giữ version cũ cho users đang học.
- `LearningSession` lưu `lessonVersion` để biết user học version nào.
- Tránh tình huống: user đang học bài version 1, admin sửa content → quiz đáp án không khớp.

---

## 2. ADMIN LESSON MANAGEMENT

### Tổng quan
Hiện tại **không có admin CRUD cho lessons**. Lessons chỉ tồn tại qua seed data.  
Admin chỉ quản lý Daily Prompts. Cần xây admin lesson management hoàn chỉnh.

### 2.1 Admin Dashboard cho Lessons

**Metrics hiển thị:**
- Tổng số lessons (published / draft / archived)
- Tổng completions hôm nay
- Average completion rate per lesson
- Lessons có completion rate < 30% (cần review)
- Top 5 lessons được học nhiều nhất

**Tại sao:** Admin cần nhìn health của content system ở một chỗ, không phải đào database.

### 2.2 Lesson List Page (Admin)

**Columns:**
| Column | Mô tả |
|--------|--------|
| Title | Tên bài |
| Path > Unit > Module | Vị trí trong hierarchy |
| Category | grammar / vocab / reading / speaking / listening |
| Level | beginner / intermediate / advanced |
| Status | draft / published / archived |
| Completions | Số lượt hoàn thành |
| Avg Score | Điểm trung bình |
| Actions | Edit / Preview / Publish / Archive / Delete |

**Filters:** status, category, level, learning path, isPremium  
**Sort:** orderIndex, completions, avgScore, createdAt  
**Bulk actions:** Publish selected, Archive selected, Move to module

### 2.3 Lesson Editor

**Layout:** Split panel — Editor bên trái, Live Preview bên phải.

**Fields:**
- Title (required)
- Title Vi (optional)
- Description (required, max 200 chars)
- Category (dropdown)
- Level (dropdown)
- Duration (auto-calculated from content, admin có thể override)
- XP Reward (default 15, admin adjustable: 10–50)
- Tags (multi-select/create)
- isPremium toggle
- Learning Path → Unit → Module (dropdown cascade)

**Content Editor:**
- Drag-and-drop section ordering
- Add Section button → chọn type
- Mỗi section type có form riêng:
  - **Text:** Rich text editor (markdown-based)
  - **Vocabulary:** Table input (word, meaning, meaningVi, example, partOfSpeech)
  - **Grammar Rule:** Rule field + examples list
  - **Fill Blank:** Câu gốc + vị trí blank + đáp án + options + explanation
  - **Match:** Danh sách pairs (word ↔ meaning)
  - **Reorder:** Câu gốc → tách thành từ → xáo trộn
  - **Multiple Choice:** Question + 4 options + correct index + explanation
  - **Dialogue:** Speaker names + lines + translations
  - **Practice:** Prompt + hint

### 2.4 AI Content Generation (Admin Tool)

Admin có thể nhấn **"Generate with AI"** cho mỗi section hoặc toàn bộ lesson:

```
[Input]
- Topic: "Ordering food at a restaurant"
- Level: "intermediate"
- Target vocab: ["appetizer", "main course", "dessert", ...]
- Section types wanted: [vocabulary, dialogue, fill_blank, multiple_choice]

[Output]
- AI generates draft content cho từng section
- Admin review, edit, rồi save
```

**API endpoint:** `POST /admin/lessons/ai-generate`
- model: `gpt-4.1` cho content quality
- Prompt design: xem phần 9 (AI-Powered Personalization)

### 2.5 Publish Workflow

```
Draft → Review → Published → Archived

Draft: Admin đang viết, user không thấy.
Review: Sẵn sàng để preview, chưa live.
Published: User thấy và học được.
Archived: Ẩn khỏi library, giữ data completion.
```

**Rules:**
- Không publish bài thiếu exercise section.
- Không publish bài có 0 vocabulary items nếu category = "vocabulary".
- Admin phải Preview trước khi Publish lần đầu.

### 2.6 Content Preview

- Admin xem lesson **chính xác như user sẽ thấy** trên LessonDetail page.
- Có badge "PREVIEW MODE" ở góc.
- Có thể test quiz, nghe audio, check flow.
- Nút "Back to Editor" quay lại sửa.

### 2.7 Learning Path Management

**Admin CRUD cho:**
- Learning Path: create, edit title/description/cover/level/isPremium, reorder
- Unit: create under path, edit, reorder within path
- Module: create under unit, edit, reorder within unit
- Lesson: assign to module, reorder within module

**Drag-and-drop reordering** cho tất cả cấp.

### 2.8 Bulk Import/Export

- Export tất cả lessons thành JSON file (cho backup hoặc migration).
- Import JSON file → validate → create drafts.
- CSV import cho vocabulary lists → auto-generate vocabulary sections.

### 2.9 Analytics per Lesson (Admin View)

| Metric | Mô tả | Dùng để |
|--------|--------|---------|
| Start rate | Bao nhiêu user bắt đầu bài | Content discovery problem? |
| Completion rate | Bao nhiêu user hoàn thành | Bài quá khó/dài? |
| Drop-off section | Section nào user bỏ cuộc | Nội dung nào chán? |
| Avg score | Điểm trung bình | Bài quá dễ/khó? |
| Time spent | Thời gian trung bình | Ước tính duration chính xác? |
| Repeat rate | Bao nhiêu user học lại | Bài có giá trị ôn? |

### 2.10 Content Quality Alerts

Hệ thống tự động cảnh báo admin khi:
- Completion rate < 30% (bài quá khó hoặc chán)
- Average score < 40% (exercise quá khó)
- Drop-off tại section cụ thể > 50% (section đó có vấn đề)
- Time spent > 2x duration estimate (bài lâu hơn dự kiến)
- 0 completions sau 7 ngày published (bài bị bỏ qua)

---

## 3. LEARNING FLOW UX

### Tổng quan
Chuyển từ flat "click lesson → read → done" sang **guided learning flow** có cảm giác tiến bộ rõ ràng.

### 3.1 Learning Path Home

```
┌─────────────────────────────────────┐
│ 🗺️ Everyday English (Beginner)      │
│ ━━━━━━━━━━━━━━━━━━━ 35% complete   │
│                                     │
│ ╔═════════════════════╗             │
│ ║ Unit 1: Greetings   ║ ✅ Done     │
│ ╚═════════════════════╝             │
│         │                           │
│ ╔═════════════════════╗             │
│ ║ Unit 2: Daily Life  ║ 🔵 Current  │
│ ╚═════════════════════╝             │
│         │                           │
│ ╔═════════════════════╗             │
│ ║ Unit 3: Food & Eat  ║ 🔒 Locked   │
│ ╚═════════════════════╝             │
│         │                           │
│ ╔═════════════════════╗             │
│ ║ Unit 4: Travel      ║ 🔒 Premium  │
│ ╚═════════════════════╝             │
└─────────────────────────────────────┘
```

**Unlock logic:**
- Unit N+1 unlock khi Unit N đạt ≥ 70% completion (không cần 100%).
- Premium units luôn locked cho free users, kể cả đã unlock unit trước.
- User có thể **ôn lại** unit đã hoàn thành bất kỳ lúc nào.

### 3.2 Unit Detail View

```
┌─────────────────────────────────────┐
│ Unit 2: Daily Life                  │
│ ━━━━━━━━━━━━ 60% · 3/5 lessons     │
│                                     │
│ Module: Morning Habits              │
│ ┌──────────┐ ┌──────────┐          │
│ │ Lesson 1 │ │ Lesson 2 │          │
│ │ ✅ 90pts  │ │ 🔵 Start  │          │
│ └──────────┘ └──────────┘          │
│                                     │
│ Module: Evening Habits              │
│ ┌──────────┐ ┌──────────┐          │
│ │ Lesson 3 │ │ Lesson 4 │          │
│ │ 🔒 Locked │ │ 🔒 Locked │          │
│ └──────────┘ └──────────┘          │
└─────────────────────────────────────┘
```

### 3.3 Lesson Flow (Step-by-step)

Lấy cảm hứng Duolingo nhưng giữ STICK:

```
[Start Screen]
  │ Title, estimated time, XP reward preview
  │ "Let's learn!" button
  ▼
[Section 1: Text/Vocab/Grammar]
  │ Content hiển thị dạng card
  │ Tap to continue
  ▼
[Section 2: Exercise]
  │ Trả lời → Feedback ngay (đúng/sai + giải thích)
  │ Animation: ✅ pulse xanh hoặc ❌ nhẹ nhàng
  ▼
[... more sections ...]
  ▼
[Summary Screen]
  │ Score: 85/100
  │ XP earned: +20
  │ New words learned: 5
  │ Mistakes to review: 2
  │ "Continue" → back to unit
```

**Khác Duolingo:**
- Không có hearts/lives (STICK không muốn gây ức chế).
- Sai **vẫn được tiếp tục** — chỉ ảnh hưởng score.
- Giải thích sau mỗi exercise (Duolingo thường không giải thích).
- Cảm giác "đang viết journal" hơn là "đang thi".

### 3.4 Progress Bar trong Lesson

```
●───●───●───○───○───○───○
 1   2   3   4   5   6   7  sections
         ↑ current
```

- Filled dots cho completed sections.
- Current dot pulsing.
- Empty dots cho remaining.
- Không hiển thị **số đếm** (giảm áp lực) — chỉ dots.

### 3.5 Lesson Transition Animations

- Section complete → slide up nhẹ.
- Correct answer → điểm "+10" float up + haptic (nếu mobile).
- Wrong answer → shake nhẹ + highlight đáp án đúng.
- Lesson complete → confetti nhẹ (kiểu STICK, không phải party animation nặng nề).

### 3.6 "Continue Learning" Smart Button

Trên trang chính (Daily Task page), hiển thị:
```
┌─────────────────────────────────┐
│ 📚 Continue: "Morning Habits"   │
│ Lesson 3 of 5 · 4 min          │
│ [Continue →]                    │
└─────────────────────────────────┘
```

Logic:
- Nếu user đang giữa lesson → resume.
- Nếu vừa xong lesson → suggest next lesson trong module.
- Nếu vừa xong module → suggest next module.

### 3.7 Daily Lesson Suggestion

Ngoài Daily Task (journal), mỗi ngày suggest 1 lesson phù hợp:
- Dựa trên learning path progress.
- Dựa trên weak areas từ `LearnerErrorPattern`.
- Dựa trên vocabulary cần ôn từ SRS.

**Không bắt buộc** — chỉ là gợi ý nhẹ. Core loop vẫn là journal.

### 3.8 Lesson Review Mode

User có thể ôn lại lesson đã hoàn thành:
- Chỉ hiển thị **exercise sections** (bỏ text/vocab đã đọc).
- Score được tính riêng cho review session.
- XP review = 50% XP lần đầu (tránh farming).

### 3.9 Offline-Ready Design

- Lesson content được cache khi user mở lesson.
- Nếu mất mạng giữa chừng → vẫn làm exercise được.
- Khi có mạng lại → sync completion + score.
- Không chặn flow vì network.

### 3.10 Accessibility

- Font size adjustable (setting).
- High contrast mode.
- Screen reader tags cho exercise options.
- Exercise animations có thể tắt (reduced motion).
- Tất cả buttons có touch target ≥ 44px.

---

## 4. VOCABULARY INTEGRATION

### Tổng quan
Đây là **đòn bẩy unique** của STICK: liên kết vocabulary giữa Journal (core loop), Lessons, và SRS review.
Duolingo không có journal → vocabulary của họ tách biệt. STICK có thể **đan xen** vocabulary vào mọi thứ user làm.

### 4.1 Vocabulary Sources

| Source | Mô tả | Cách thu thập |
|--------|--------|--------------|
| Journal AI Feedback | Từ mới trong rewrite | AI extract từ `useful_words` trong feedback |
| Lesson Vocabulary | Từ mới trong lesson sections | Parse vocabulary sections khi user hoàn thành |
| Daily Challenge | Idiom/phrasal verb hôm nay | Từ `generateDailyChallenge()` |
| Manual Add | User tự thêm từ | Từ Vocab Notebook UI |

### 4.2 Tự động thêm từ vựng từ Lesson

Khi user hoàn thành lesson:
1. Parse tất cả `vocabulary` sections trong lesson content.
2. Với mỗi `VocabItem`:
   - Check `VocabNotebookItem` xem user đã có chưa.
   - Nếu chưa → auto-create với `mastery: "new"`, `source: "lesson"`, `lessonId`.
   - Nếu đã có → update `exposureCount += 1` (user gặp lại từ này).
3. Notify user: "5 new words added to your notebook!"

### 4.3 Lesson → Vocab → SRS Pipeline

```
Lesson vocabulary section
  │
  ▼
VocabNotebookItem (mastery: "new")
  │ User reviews → "learning"
  │ SRS interval tăng
  ▼
VocabNotebookItem (mastery: "mastered")
  │ 
  ▼
LearnerLexicon (knowledgeState: "stable" → "mastered")
```

### 4.4 Daily Vocab Goal

Mỗi ngày, user có target:
- Free: 5 từ mới / ngày
- Premium: 15 từ mới / ngày

Sources:
1. Từ vựng từ lesson hôm nay.
2. Từ vựng từ journal AI feedback.
3. Từ vựng AI suggest dựa trên weak areas.

Progress hiển thị trên Daily Dashboard:
```
📝 Words today: 3/5
```

### 4.5 Vocabulary trong Exercise

Lessons tự động tạo exercise từ vocabulary section:
- **Match:** word ↔ meaning
- **Fill blank:** câu example bỏ từ → điền lại
- **Multiple choice:** meaning → chọn đúng word

Đảm bảo user **practice** từ vựng ngay trong lesson, không chỉ đọc.

### 4.6 Cross-Lesson Vocabulary Review

Sau 3 lessons, hệ thống tạo **mini review** tổng hợp từ vựng:
- Lấy từ vựng từ 3 lessons gần nhất.
- Tạo 5–10 exercise nhanh.
- Hiển thị như một "Review Round" trong learning path.

### 4.7 Vocabulary Difficulty Rating

Mỗi VocabItem có implicit difficulty:
- `easy`: user trả lời đúng ≥ 3 lần liên tiếp.
- `medium`: user trả lời đúng 1–2 lần.
- `hard`: user trả lời sai ≥ 2 lần.

SRS schedule dựa trên difficulty:
- easy: review sau 7 ngày.
- medium: review sau 3 ngày.
- hard: review sau 1 ngày.

### 4.8 Vocabulary Streak

Bonus cho user review vocab đều đặn:
- 7 ngày liên tiếp review vocab → +50 bonus XP.
- 30 ngày → Badge "Word Master".

### 4.9 Vocabulary Export

User có thể export vocabulary notebook thành:
- CSV (cho Anki import).
- Shareable link (premium).
- PDF flashcard set (premium).

### 4.10 Vocabulary Analytics

Admin dashboard:
- Top 10 từ khó nhất (highest error rate).
- Từ bị user xóa nhiều nhất (irrelevant content?).
- Average mastery progression curve.
- Từ nào xuất hiện nhiều lessons nhất (overuse?).

---

## 5. SCORING & XP SYSTEM

### Tổng quan
Chuyển từ flat 15 XP/lesson sang **hệ thống chấm điểm chi tiết**, tạo cảm giác thành tích rõ ràng nhưng không gây áp lực.

### 5.1 Scoring Model

```
Lesson Score = Σ(Exercise Points) / Total Possible Points × 100

Star Rating:
  ⭐⭐⭐ = 90–100% (Perfect!)
  ⭐⭐   = 70–89%  (Great!)
  ⭐     = 50–69%  (Good effort!)
  ☆     = < 50%   (Try again? — không bắt buộc)
```

**Khác Duolingo:** Không có "fail" state. User luôn pass, chỉ khác star rating.

### 5.2 Exercise Points

| Exercise Type | Points đúng | Points sai | Partial credit |
|--------------|-------------|-----------|----------------|
| Multiple Choice | 10 | 0 | N/A |
| Fill Blank | 10 | 0 | 5 nếu gần đúng (typo nhẹ) |
| Match | 10/pair | 0 | 5 nếu sai 1 pair |
| Reorder | 15 | 0 | 8 nếu đúng ≥ 70% vị trí |
| Practice (write) | 20 | 10 (effort) | AI chấm 10–20 dựa trên quality |
| Speak (shadowing) | 15 | 5 (attempted) | 10 nếu pronunciation ≥ 70% |

### 5.3 XP Calculation

```
Base XP = lesson.xpReward (default 15, admin-set 10–50)

Multipliers:
  - First attempt: ×1.0
  - Perfect score (100%): ×1.5 bonus
  - Speed bonus (< 50% estimated time): ×1.2
  - Streak bonus (streak ≥ 7): ×1.1
  - Review attempt: ×0.5

Final XP = floor(Base XP × multiplier)
```

### 5.4 Anti-XP-Farming Rules

**Vấn đề hiện tại:** Vocab notebook cho 3 XP/item không giới hạn → farming.

**Rules mới:**
- Mỗi lesson chỉ cho XP **lần đầu** (giữ nguyên).
- Review lesson cho 50% XP, **tối đa 1 lần/ngày** per lesson.
- Daily XP cap: 200 XP/ngày (tránh bot/abuse).
- Vocab XP: tối đa 30 XP/ngày từ vocab review.
- Journal XP: giữ nguyên (core loop, không giới hạn).

### 5.5 Combo System

Trả lời đúng liên tiếp trong lesson:
```
1 đúng → +0 bonus
2 đúng liên tiếp → +2 bonus
3 đúng liên tiếp → +5 bonus
4 đúng liên tiếp → +8 bonus
5+ đúng liên tiếp → +10 bonus (max)
```

Hiển thị: "🔥 3x Combo!" nhẹ nhàng, không quá flashy.
Sai → combo reset, **không mất điểm đã có** (STICK: không trừng phạt).

### 5.6 Tại sao KHÔNG dùng Hearts/Lives

Duolingo dùng hearts: 5 hearts, sai 1 câu mất 1 heart, hết hearts phải chờ hoặc trả tiền.

**STICK không dùng vì:**
- Vi phạm nguyên tắc "không giống lớp học, không gây áp lực".
- Target audience (người trẻ Việt) dễ bỏ app khi frustrated.
- Hearts chỉ phù hợp khi có lượng content khổng lồ (Duolingo 100+ units). STICK pilot chỉ có vài units.
- STICK muốn user **thấy tiến bộ**, không phải thấy bị phạt.

**Thay thế:** Star rating + combo — vẫn có incentive làm đúng, nhưng sai vẫn tiếp tục được.

### 5.7 Score Persistence

```prisma
model LessonAttempt {
  id         Int      @id @default(autoincrement())
  userId     Int
  lessonId   Int
  score      Int                      // 0-100
  starRating Int                      // 1-3
  xpEarned   Int
  comboMax   Int                      // combo dài nhất
  duration   Int                      // seconds
  answers    String   @db.LongText    // JSON: [{exerciseIndex, answer, correct, points}]
  isReview   Boolean  @default(false)
  createdAt  DateTime @default(now())
  
  user    User   @relation(fields: [userId], references: [id])
  lesson  Lesson @relation(fields: [lessonId], references: [id])
  
  @@index([userId, lessonId])
}
```

### 5.8 Leaderboard Scoring (xem thêm phần 10)

Weekly XP leaderboard:
- Chỉ tính XP tuần hiện tại.
- Reset mỗi thứ Hai.
- Tránh whales thống trị mãi mãi.

### 5.9 Score Display UX

```
┌──────────────────────┐
│     ⭐⭐⭐             │
│   Score: 92/100      │
│   +28 XP earned      │
│   🔥 Best combo: 5    │
│   📝 3 new words      │
│                      │
│ ┌────────────────┐   │
│ │ Review Mistakes │   │
│ └────────────────┘   │
│ ┌────────────────┐   │
│ │ Next Lesson →   │   │
│ └────────────────┘   │
└──────────────────────┘
```

### 5.10 Score-Based Recommendations

- Score < 50% → Gợi ý ôn lại lesson + review vocab.
- Score 50–70% → Gợi ý review mistakes section.
- Score > 90% → "Ready for next lesson!" + bonus encouragement.

Dữ liệu score feed vào AI recommendation engine (phần 9).

---

## 6. QUIZ & EXERCISE ENGINE

### Tổng quan
Chuyển từ **hardcoded quiz** trong frontend sang **exercise engine linh hoạt** hỗ trợ nhiều loại bài tập, AI generation, và adaptive difficulty.

### 6.1 Exercise Types Catalog

| Type | Tên hiển thị | Mô tả | Ví dụ |
|------|-------------|--------|-------|
| `fill_blank` | Fill in the Blank | Điền từ vào chỗ trống | "I ___ (go) to school every day." → "go" |
| `multiple_choice` | Choose the Answer | Chọn 1 trong 4 | "What does 'abundant' mean?" → [A, B, C, D] |
| `match` | Match Pairs | Nối từ với nghĩa | word ↔ meaning (drag or tap) |
| `reorder` | Build the Sentence | Sắp xếp từ thành câu | ["school", "I", "to", "go"] → "I go to school" |
| `listen_write` | Listen & Write | Nghe audio, viết lại | Audio plays → user types sentence |
| `speak` | Say It Out Loud | Đọc theo câu mẫu | Sentence shown → user records → compare |
| `translate` | Translate This | Dịch Việt → Anh | "Tôi thích cà phê" → "I like coffee" |
| `image_select` | What's in the Picture? | Chọn từ mô tả hình | Image shown → pick correct word |
| `error_correct` | Find the Mistake | Tìm lỗi trong câu | "She go to school yesterday" → "She went..." |
| `free_write` | Express Yourself | Viết tự do theo prompt | "Describe your morning in 2 sentences" |

### 6.2 Exercise Rendering Engine (Frontend)

```typescript
// Components map
const ExerciseRenderers: Record<ExerciseType, React.FC<ExerciseProps>> = {
  fill_blank:      FillBlankExercise,
  multiple_choice: MultipleChoiceExercise,
  match:           MatchPairsExercise,
  reorder:         ReorderExercise,
  listen_write:    ListenWriteExercise,
  speak:           SpeakExercise,
  translate:       TranslateExercise,
  image_select:    ImageSelectExercise,
  error_correct:   ErrorCorrectExercise,
  free_write:      FreeWriteExercise,
}

// Universal exercise wrapper
function ExerciseStep({ exercise, onAnswer }: { exercise: Exercise; onAnswer: (result: ExerciseResult) => void }) {
  const Renderer = ExerciseRenderers[exercise.type]
  return <Renderer exercise={exercise} onAnswer={onAnswer} />
}
```

### 6.3 Exercise Feedback Pattern

Mỗi exercise sau khi trả lời:

```
[Correct]
  ✅ "Correct!" (xanh, nhẹ)
  → explanation nếu có
  → "+10 points" float up
  → auto-advance sau 1.5s

[Incorrect]
  ❌ "Not quite" (cam, không đỏ — STICK không trừng phạt)
  → Highlight đáp án đúng
  → explanation bắt buộc
  → "Tap to continue"
  → Có thể thêm vào "Review Later" list
```

### 6.4 AI Exercise Generation

**Endpoint:** `POST /api/v1/lessons/generate-exercises`

**Input:**
```json
{
  "topic": "ordering food",
  "level": "intermediate",
  "targetVocab": ["appetizer", "bill", "tip"],
  "exerciseTypes": ["fill_blank", "multiple_choice", "reorder"],
  "count": 5,
  "userWeakAreas": ["article_usage", "preposition"]
}
```

**AI Prompt (gpt-4.1):**
```
You are an English exercise generator for Vietnamese learners.

Create {count} exercises about "{topic}" at {level} level.
Target vocabulary: {targetVocab}
Exercise types: {exerciseTypes}
Focus on user's weak areas: {userWeakAreas}

Rules:
1. Each exercise must be self-contained (no reference to previous exercises).
2. Distractors (wrong options) must be plausible but clearly wrong.
3. Explanations must be concise (1-2 sentences) and helpful.
4. Use natural, everyday English — not academic or formal.
5. Include Vietnamese hints for beginner level.
6. Fill-blank: use context clues in surrounding text.
7. Reorder: max 8 words per sentence.
8. Multiple choice: exactly 4 options, 1 correct.

Output as JSON array matching this schema:
[{
  "type": "fill_blank",
  "prompt": "I'd like to order the ___ for my main course.",
  "options": ["steak", "book", "chair", "cloud"],
  "correct": 0,
  "explanation": "'Steak' is a common main course dish at restaurants.",
  "points": 10
}]
```

### 6.5 Adaptive Difficulty

```
User performance on topic X:
  - Last 5 exercises: [correct, correct, wrong, correct, correct]
  - Accuracy: 80%
  
Adaptive rules:
  < 40% accuracy → decrease difficulty (simpler vocab, more hints)
  40-70% accuracy → maintain difficulty
  > 70% accuracy → increase difficulty (less hints, harder vocab)
  > 90% accuracy for 10+ exercises → suggest next level
```

Stored in `LearnerErrorPattern` để track per-topic, per-user.

### 6.6 Exercise Timeout

- Mỗi exercise có soft timeout (không hiển thị timer, nhưng track).
- Nếu user mất > 60s cho 1 exercise → hint hiện ra.
- Nếu > 120s → "Need help? Tap to see the answer."
- Data dùng để calibrate difficulty.

### 6.7 Exercise Shuffle

- Trong lesson: exercise order **cố định** (theo content design).
- Trong review mode: exercise order **random**.
- Options trong multiple choice: **luôn random** (tránh memorize vị trí).
- Match pairs: **random** arrangement.

### 6.8 Exercise Validation (Backend)

Backend validate đáp án, không trust frontend:

```javascript
// API: POST /api/v1/lessons/:id/submit-answer
{
  "exerciseIndex": 2,
  "answer": "go",
  "timeSpent": 8 // seconds
}

// Response
{
  "correct": true,
  "points": 10,
  "explanation": "...",
  "comboCount": 3
}
```

**Tại sao backend validate:**
- Tránh client-side cheating.
- Consistent scoring.
- Data collection chính xác.

### 6.9 Exercise History

Track mỗi exercise user làm:

```prisma
model ExerciseAttempt {
  id           Int      @id @default(autoincrement())
  userId       Int
  lessonId     Int
  exerciseIndex Int
  exerciseType String
  answer       String
  correct      Boolean
  points       Int
  timeSpent    Int     // seconds
  createdAt    DateTime @default(now())
  
  @@index([userId, exerciseType])
  @@index([userId, lessonId])
}
```

Dùng cho:
- Adaptive difficulty.
- Weak area detection.
- Analytics per exercise type.

### 6.10 "Mistake Bank" Feature

Tất cả exercises user trả lời sai → vào Mistake Bank:
- Hiển thị trên Profile/Review page.
- User có thể ôn lại bất kỳ lúc nào.
- AI generate bài tập tương tự cho mistakes (premium feature).
- Clear khỏi bank khi user trả lời đúng 3 lần.

---

## 7. PREMIUM MONETIZATION

### Tổng quan
Lesson system là **nền tảng monetization** chính. Free users có đủ giá trị để dính lại, premium unlock nhiều hơn.

### 7.1 Free vs Premium Content Matrix

| Feature | Free | Premium |
|---------|------|---------|
| Daily Task (journal) | ✅ Unlimited | ✅ Unlimited |
| AI Feedback quality | Standard (gpt-4.1-mini) | Enhanced (gpt-4.1, deeper analysis) |
| Learning Paths | 1 path (Everyday English) | All paths |
| Lessons per path | First 2 units | All units |
| Exercise types | 4 basic types | All 10 types |
| Daily vocab goal | 5 words/day | 15 words/day |
| Review mode | ❌ | ✅ |
| Mistake Bank | View only | AI-generated practice |
| Audio (TTS) | Standard voice | Premium HD voice |
| Vocabulary export | ❌ | CSV, PDF, Anki |
| Ad-free | ❌ (subtle, non-intrusive) | ✅ |
| Offline lessons | ❌ | ✅ |

### 7.2 Paywall Placement Strategy

**Principle:** Cho user **trải nghiệm giá trị** trước khi gặp paywall.

**Placement points:**
1. **Unit 3 unlock** — User đã hoàn thành 2 units free, thấy giá trị, muốn tiếp.
2. **Premium exercise types** — User thấy "Speak" exercise locked → "Unlock with Premium".
3. **Mistake Bank practice** — User thấy mistakes, muốn AI practice → premium.
4. **After Day 3** — User quay lại 3 ngày → proven engaged → gentle premium prompt.
5. **Vocab export** — User built notebook, muốn export → premium.

**KHÔNG đặt paywall ở:**
- Daily Task (core loop) — TUYỆT ĐỐI KHÔNG.
- First 2 units — phải free hoàn toàn.
- Basic AI feedback — luôn free.
- Streak display — luôn free.

### 7.3 Premium Pricing Model (đề xuất)

| Plan | Giá (VND) | Giá (USD equiv) |
|------|----------|-----------------|
| Monthly | 79,000 | ~$3.2 |
| Quarterly | 199,000 | ~$8 (save 16%) |
| Yearly | 599,000 | ~$24 (save 37%) |

**So sánh:** Duolingo Plus ~$7/tháng. STICK rẻ hơn vì target audience là học sinh/sinh viên Việt Nam.

### 7.4 Trial Strategy

- 7 ngày premium free cho user mới.
- Trial bắt đầu khi user **hoàn thành Day 1** (đã chứng minh engagement).
- Không bắt đầu trial ngay khi register (giảm waste).

### 7.5 Premium Conversion Nudges

**Soft nudges (không annoying):**
1. Sau khi hoàn thành lesson free → "Unlock 50+ more lessons with Premium".
2. Mistake Bank có 5+ mistakes → "Practice your mistakes with AI — Premium".
3. Weekly email: "You learned 15 words this week! Unlock unlimited with Premium."
4. Completion screen: small banner "Premium users earn 1.5x XP".

**Hard nudges (chỉ ở paywall points):**
- Unit 3 locked screen với benefits list.
- Premium exercise type locked với demo preview.

### 7.6 Premium Content Pipeline

Admin tạo content theo tỉ lệ:
- 30% content = free (đủ hook).
- 70% content = premium (đủ value).

Mỗi Learning Path:
- Unit 1–2: free.
- Unit 3+: premium.
- Special event units (holidays, trending topics): **free** (dùng làm acquisition hook).

### 7.7 Revenue Analytics

Track:
- Trial start → conversion rate.
- Paywall impression → click-through rate.
- Churn rate by plan type.
- LTV (lifetime value) by acquisition source.
- Revenue per learning path (content ROI).

### 7.8 Premium Gifting (Phase 2)

- User A mua premium cho User B.
- Gift codes.
- Group plans (cho class/nhóm bạn).

### 7.9 Free User Retention

**QUAN TRỌNG:** Free users phải có lý do ở lại, không phải bị ép upgrade.

Free user vẫn có:
- Daily journal unlimited.
- AI feedback (standard quality).
- 1 learning path (nhiều lessons).
- 5 vocab/day goal.
- Streak tracking.
- Achievements.

### 7.10 A/B Testing Framework cho Monetization

Cần test:
- Paywall timing (after Unit 2 vs Unit 3).
- Trial length (7 days vs 14 days).
- Pricing (79k vs 99k vs 59k).
- Nudge frequency.
- Premium feature bundling.

Implement: Feature flags trong `AppConfig` table, admin toggle.

---

## 8. PROGRESS & ANALYTICS

### Tổng quan
System tracking đầy đủ: user progress, content performance, retention, và operational health.

### 8.1 User Progress Model

```prisma
model UserLessonProgress {
  id            Int      @id @default(autoincrement())
  userId        Int
  lessonId      Int
  bestScore     Int      @default(0)     // 0-100
  starRating    Int      @default(0)     // 0-3
  totalAttempts Int      @default(0)
  totalXpEarned Int      @default(0)
  firstCompletedAt DateTime?
  lastAttemptAt    DateTime?
  
  user   User   @relation(fields: [userId], references: [id])
  lesson Lesson @relation(fields: [lessonId], references: [id])
  
  @@unique([userId, lessonId])
}

model UserUnitProgress {
  id               Int     @id @default(autoincrement())
  userId           Int
  unitId           Int
  lessonsCompleted Int     @default(0)
  totalLessons     Int
  averageScore     Float   @default(0)
  unlocked         Boolean @default(false)
  completedAt      DateTime?
  
  @@unique([userId, unitId])
}

model UserPathProgress {
  id               Int     @id @default(autoincrement())
  userId           Int
  learningPathId   Int
  unitsCompleted   Int     @default(0)
  totalUnits       Int
  currentUnitId    Int?
  currentLessonId  Int?
  startedAt        DateTime @default(now())
  completedAt      DateTime?
  
  @@unique([userId, learningPathId])
}
```

### 8.2 Learning Path Progress View

```
Everyday English ━━━━━━━━━━━ 35%
  Unit 1: Greetings      ✅ 100% · ⭐⭐⭐
  Unit 2: Daily Life      🔵 60%  · ⭐⭐
  Unit 3: Food & Eating   🔒 Locked
  Unit 4: Travel & Transport 🔒 Premium
```

### 8.3 Daily Progress Summary

Hiển thị trên main dashboard:
```
Today's Progress
━━━━━━━━━━━━━━━
📝 Journal: ✅ Done (+15 XP)
📚 Lesson: 1/1 completed (+22 XP)
📖 Words: 7/5 learned (+21 XP)
🔥 Streak: 12 days
💎 Total XP today: 58
```

### 8.4 Weekly Report (Push notification / In-app)

Mỗi Chủ Nhật:
```
Your Week in Review 🎯
━━━━━━━━━━━━━━━
Days active: 5/7
Lessons completed: 3
Words learned: 24
Total XP: 342
Best combo: 8
Improvement: typing speed +12%
```

### 8.5 Skill Radar Chart

```
        Grammar
          ▲
    100  ╱│╲
        ╱ │ ╲
Vocab  ╱  │  ╲  Reading
      ╱   │   ╲
     ╱    │    ╲
    ╱─────┼─────╲
     ╲    │    ╱
      ╲   │   ╱
Writing ╲ │ ╱  Speaking
         ╲│╱
```

Dựa trên:
- Exercise accuracy per category.
- Journal writing quality improvement.
- Vocab mastery per topic.

### 8.6 Lesson Analytics Events (bổ sung cho event schema phần 9 — Agent OS)

| Event | When | Props |
|-------|------|-------|
| `lesson_start` | Mở lesson start screen | `lesson_id`, `unit_id`, `path_id`, `is_review` |
| `lesson_section_view` | Xem 1 section | `section_index`, `section_type` |
| `exercise_attempt` | Trả lời 1 exercise | `exercise_type`, `correct`, `time_spent`, `combo_count` |
| `lesson_complete` | Hoàn thành lesson | `score`, `star_rating`, `xp_earned`, `duration`, `combo_max` |
| `lesson_abandon` | Thoát giữa chừng | `last_section_index`, `time_spent` |
| `path_unit_unlock` | Mở khóa unit mới | `unit_id`, `path_id` |
| `path_complete` | Hoàn thành cả path | `path_id`, `total_xp`, `avg_score` |

### 8.7 Content Performance Dashboard (Admin)

| Metric | Query |
|--------|-------|
| Lesson start rate | lesson_start / unique users |
| Lesson completion rate | lesson_complete / lesson_start |
| Section drop-off | Per section: users who left vs continued |
| Exercise accuracy | correct / total attempts per type |
| Time on lesson | avg duration per lesson |
| Redo rate | users who attempt lesson > 1 time |

### 8.8 Retention Cohort Dashboard

```
Cohort: Users who started Week of June 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Day 1:  █████████████████████ 100%
Day 2:  ██████████████       65%
Day 3:  ██████████           48%
Day 7:  ██████               32%
Day 14: ████                 22%
Day 30: ██                   14%
```

Breakdown by:
- Free vs Premium.
- Có làm lesson vs chỉ journal.
- Source (organic vs campaign).

### 8.9 Learning Velocity Metrics

Track user's learning speed over time:
- Words mastered per week (should increase).
- Average exercise accuracy (should increase).
- Time per exercise (should decrease).
- Journal writing speed & word count (should improve).

**Alert** khi metrics **plateau** > 2 weeks → suggest harder content hoặc new topic.

### 8.10 Data Export & API

Admin can:
- Export user progress CSV.
- Export lesson performance CSV.
- API endpoint cho external analytics (Mixpanel, Amplitude, etc.):
  - `GET /admin/analytics/overview` (summary stats).
  - `GET /admin/analytics/lessons/:id` (per-lesson stats).
  - `GET /admin/analytics/cohorts` (retention data).

---

## 9. AI-POWERED PERSONALIZATION

### Tổng quan
Dùng GPT-4.1 để tạo trải nghiệm **cá nhân hóa** — nội dung phù hợp trình độ, khắc phục điểm yếu, và tạo cảm giác "app hiểu mình".

### 9.1 AI Model Strategy

| Use Case | Model | Temperature | Max Tokens | Lý do |
|----------|-------|-------------|------------|-------|
| Journal Feedback | gpt-4.1 | 0.3 | 2500–4000 | Cần chính xác, empathetic, structured |
| Lesson Content Generation | gpt-4.1 | 0.5 | 4000 | Cần creative nhưng accurate |
| Exercise Generation | gpt-4.1-mini | 0.3 | 2000 | Structured output, không cần creative |
| Daily Challenge | gpt-4.1-mini | 0.7 | 1000 | Cần variety, fun |
| Adaptive Recommendation | gpt-4.1-mini | 0.2 | 500 | Logic-based, deterministic preferred |
| Grammar Quiz | gpt-4.1-mini | 0.3 | 1500 | Structured, factual |
| Reading Content | gpt-4.1-mini | 0.6 | 2000 | Natural text |

### 9.2 Prompt Architecture — Journal Feedback (cải tiến)

```
SYSTEM PROMPT:
You are an AI English tutor for STICK — a daily English thinking habit app for Vietnamese learners.

YOUR ROLE:
- Gently rewrite the user's journal entry into more natural English.
- Preserve the user's original MEANING and EMOTION.
- Highlight useful vocabulary and sentence patterns.
- Be warm, encouraging, and brief. NEVER be academic or harsh.

CONTEXT PROVIDED:
- User's proficiency level: {level} (CEFR scale)
- User's known vocabulary: {learnerLexicon} (words they've already learned — DO NOT re-teach these)
- User's error patterns: {errorPatterns} (common mistakes — gently address if present)
- User's streak: {streak} days (mention if notable: 7, 14, 30)
- Previous entries count: {entryCount}

INPUT HANDLING:
- Accept pure English, pure Vietnamese, or mixed (code-switching is NORMAL for learners).
- If input is mostly Vietnamese, translate intent first, then suggest the English version.
- If input is very short (< 5 words), encourage more but still provide feedback.

OUTPUT FORMAT (strict JSON):
{
  "rewrittenVersion": "Natural English version of their entry",
  "feedbackNote": "1-2 sentences of warm encouragement. Mention specific good choices they made.",
  "usefulWords": [
    {"word": "commute", "meaning": "travel to work regularly", "meaningVi": "đi làm hàng ngày", "example": "I commute by bus every morning.", "partOfSpeech": "verb"}
  ],
  "usefulPatterns": [
    {"pattern": "I tend to + [verb]", "explanation": "Express a habit or tendency", "example": "I tend to wake up early on weekdays."}
  ],
  "corrections": [
    {"original": "I go to school yesterday", "corrected": "I went to school yesterday", "rule": "Past tense for completed actions"}
  ],
  "encouragement": "Nice work expressing your daily routine! Your use of 'commute' was great. 🌟",
  "score": {
    "effort": 8,
    "englishUsage": 7,
    "clarity": 8,
    "grammar": 6,
    "overall": 7.3
  }
}

QUALITY RULES:
1. NEVER use more than 4 useful words (avoid overwhelming).
2. NEVER use more than 3 patterns.
3. NEVER correct more than 4 errors (prioritize most impactful).
4. Corrections must explain the RULE, not just show the fix.
5. usefulWords must NOT include words from learnerLexicon (they already know these).
6. Encouragement must reference SOMETHING SPECIFIC the user did well.
7. If the user's writing is already good, say so — don't manufacture corrections.
8. Score 'overall' is weighted: effort 30% + englishUsage 30% + clarity 20% + grammar 20%.
```

### 9.3 Prompt Architecture — Lesson Content Generation

```
SYSTEM PROMPT:
Generate a complete lesson for STICK English learning app.

INPUT:
- Topic: {topic}
- Level: {level}
- Target vocabulary: {vocabList}
- Target grammar: {grammarFocus}
- Duration target: {durationMinutes} minutes
- Exercise ratio: {exerciseRatio}% (vs. teaching content)

OUTPUT FORMAT:
JSON array of LessonSection objects.

RULES:
1. Start with a brief, engaging introduction (type: text).
2. Teach before testing — vocabulary/grammar sections BEFORE exercises.
3. Use everyday, conversational English (not textbook).
4. Each vocabulary item needs: word, meaning, meaningVi, example, partOfSpeech.
5. Exercises: mix at least 2 types. Include explanations for each.
6. Dialogue sections must feel natural (not forced for teaching).
7. End with a practice prompt that connects to user's daily life.
8. Total content should take approximately {durationMinutes} minutes to complete.
9. Difficulty must match {level}: 
   - beginner: simple present/past, common words, short sentences
   - intermediate: mixed tenses, phrasal verbs, compound sentences
   - advanced: idioms, nuance, complex structures, subtle errors
10. Vietnamese hints (meaningVi) only for beginner level.
```

### 9.4 Weak Area Detection

```typescript
async function detectWeakAreas(userId: number): Promise<WeakArea[]> {
  // 1. Aggregate from LearnerErrorPattern
  const errors = await prisma.learnerErrorPattern.findMany({
    where: { userId },
    orderBy: { frequency: 'desc' },
    take: 5
  })
  
  // 2. Aggregate from ExerciseAttempt (accuracy < 60%)
  const weakExerciseTypes = await prisma.exerciseAttempt.groupBy({
    by: ['exerciseType'],
    where: { userId, correct: false },
    _count: true,
    orderBy: { _count: { exerciseType: 'desc' } }
  })
  
  // 3. Aggregate from VocabNotebookItem (mastery = "new" for > 7 days)
  const staleVocab = await prisma.vocabNotebookItem.findMany({
    where: {
      userId,
      mastery: "new",
      createdAt: { lt: subDays(new Date(), 7) }
    }
  })
  
  return {
    grammarWeakAreas: errors.map(e => e.patternType),
    exerciseWeakAreas: weakExerciseTypes.map(e => e.exerciseType),
    staleVocabCount: staleVocab.length,
    suggestedFocus: determineFocus(errors, weakExerciseTypes, staleVocab)
  }
}
```

### 9.5 Smart Lesson Recommendation

Logic:
1. **Next in path** — Nếu user đang trong learning path, suggest bài tiếp theo.
2. **Weak area lesson** — Nếu user có error pattern rõ (ví dụ: past tense errors > 5), suggest lesson về past tense.
3. **Vocab reinforcement** — Nếu user có > 10 "new" vocab items > 7 ngày, suggest review lesson.
4. **New topic** — Nếu user đã master current topic, suggest new topic.

Priority: 1 > 2 > 3 > 4.

### 9.6 Adaptive Exercise Difficulty

```
User accuracy on "fill_blank" exercises:
  Last 10 attempts: 9/10 correct (90%)

Action:
  → Next fill_blank exercises will:
    - Have less context clues
    - Use less common vocabulary
    - Require understanding of nuance
    
User accuracy on "reorder" exercises:
  Last 10 attempts: 3/10 correct (30%)

Action:
  → Next reorder exercises will:
    - Use shorter sentences (5 words max)
    - Include word hints (e.g., "Start with 'I'")
    - Show partial order
```

### 9.7 AI Error Handling & Fallback

```typescript
async function generateWithFallback(primaryFn, fallbackContent) {
  try {
    const result = await primaryFn()
    // Validate JSON structure
    if (!validateLessonContent(result)) {
      await logAIError('invalid_structure', result)
      return fallbackContent
    }
    return result
  } catch (error) {
    await logAIError(error.type, error)
    
    if (error.status === 429) {
      // Rate limit — use cached/fallback
      return fallbackContent
    }
    if (error.status >= 500) {
      // OpenAI down — use cached/fallback
      return fallbackContent
    }
    // Unknown error
    return fallbackContent
  }
}
```

**Rule:** AI failure **NEVER** blocks user flow. Always have fallback.

### 9.8 Content Caching Strategy

- AI-generated lesson content → cache in `Lesson.content` field (persist).
- Journal feedback → cache per session (not persist — each entry is unique).
- Exercise generation → cache per (topic + level + exerciseType) combination.
- Daily Challenge → cache per date.

### 9.9 AI Cost Management

| Feature | Model | Est. cost/call | Calls/user/day | Monthly cost (1000 users) |
|---------|-------|---------------|----------------|--------------------------|
| Journal Feedback | gpt-4.1 | ~$0.02 | 1 | ~$600 |
| Exercise Gen | gpt-4.1-mini | ~$0.005 | 2 | ~$300 |
| Lesson Gen | gpt-4.1 | ~$0.03 | Admin only | ~$30 |
| Daily Challenge | gpt-4.1-mini | ~$0.003 | 0.5 | ~$45 |
| **Total** | | | | **~$975/month** |

**Optimization:**
- Cache aggressively (lesson content doesn't change).
- Use `gpt-4.1-mini` cho mọi thứ trừ journal feedback và lesson generation.
- Batch exercise generation (generate 10 at once, cache, serve one by one).
- Premium users: full gpt-4.1 feedback. Free users: gpt-4.1-mini feedback.

### 9.10 AI Quality Monitoring

Track:
- `ai_error` rate (target: < 5%).
- Average latency by model.
- JSON parse failure rate.
- User satisfaction signal: feedback_view duration (longer = more engaged).
- Feedback quality: human review sample weekly.

Dashboard alert:
- Error rate > 5% → red alert.
- Latency > 10s → yellow alert.
- JSON failure > 2% → investigate prompt.

---

## 10. GAMIFICATION & RETENTION

### Tổng quan
Gamification phải **phụ vụ retention**, không phải "cho vui". Mỗi feature phải trả lời: "Điều này giúp user quay lại ngày mai như thế nào?"

### 10.1 XP System Summary

| Action | XP | Daily Cap |
|--------|----|-----------|
| Journal complete | 15 | Unlimited (core loop) |
| Lesson complete (first time) | 10–50 (admin-set) | 200 XP |
| Lesson review | 50% base XP | 1 review/lesson/day |
| Perfect score bonus | +50% base | Included in lesson cap |
| Combo bonus | +2 to +10 | Included in lesson cap |
| Vocab review | 3 per word | 30 XP/day |
| Daily Challenge | 10 | 10 XP/day |
| Achievement unlock | varies | No cap |

### 10.2 Streak System (mở rộng)

```
Streak hiện tại: 12 days 🔥

Milestones:
  3 days  → "Getting Started" badge
  7 days  → "Week Warrior" badge + 50 XP
  14 days → "Two Weeks Strong" badge + 100 XP
  30 days → "Monthly Master" badge + 200 XP
  60 days → "Habit Formed" badge + 500 XP
  100 days → "Century Club" badge + 1000 XP
  365 days → "LEGENDARY" badge + 5000 XP

Streak protection:
  - Streak Freeze: 1 free per week (auto-applied nếu user miss 1 day)
  - Premium: 3 Streak Freezes per week
  - Weekend grace: streak không reset vào cuối tuần nếu user active ≥ 5/7 ngày
```

### 10.3 Achievement System (Lesson-specific)

| Achievement | Condition | XP |
|------------|-----------|-----|
| First Lesson | Complete 1 lesson | 20 |
| Lesson Streak 3 | 3 lessons in 3 days | 50 |
| Perfect Score | 100% on any lesson | 30 |
| Unit Complete | Finish a unit | 100 |
| Path Pioneer | Complete first learning path | 500 |
| Combo King | 10+ combo in one lesson | 50 |
| Word Collector | Learn 100 vocab words | 100 |
| Grammar Guru | 90%+ accuracy on grammar exercises (20+) | 100 |
| Speed Learner | Complete lesson in < 50% estimated time with 80%+ score | 30 |
| Review Champion | Review 10 lessons | 50 |

### 10.4 Daily Goal System

User chọn daily goal:
```
Casual:    1 activity/day (journal OR 1 lesson)
Regular:   2 activities/day (journal + 1 lesson)
Serious:   3 activities/day (journal + 2 lessons)
Intense:   5 activities/day (journal + 3 lessons + vocab review)
```

Hiển thị trên dashboard:
```
Daily Goal: Regular (2/2) ✅
[████████████████████] 100%
```

Gamification:
- Hit daily goal → streak continues.
- Hit goal 7 days → bonus 50 XP.
- Miss goal → streak warning (but doesn't break until 2 misses).

### 10.5 Level System

```
XP thresholds:
  Level 1:  0 XP        (Beginner)
  Level 2:  100 XP
  Level 3:  300 XP
  Level 4:  600 XP
  Level 5:  1000 XP     (Intermediate)
  Level 6:  1500 XP
  Level 7:  2100 XP
  Level 8:  2800 XP
  Level 9:  3600 XP
  Level 10: 4500 XP     (Advanced)
  Level 11: 5500 XP
  Level 12: 6600 XP     (Expert)
  ...
```

Level up animation: satisfying, nhẹ, quick (2 seconds max).
Level badge hiển thị on profile và lesson completion.

### 10.6 Weekly Leaderboard

```
This Week's Top Learners
━━━━━━━━━━━━━━━━━━━━━
🥇 @khoaminh      482 XP
🥈 @student123     345 XP
🥉 @englishfan     298 XP
   4. @daily_me     210 XP
   5. You          185 XP ← highlight
```

**Rules:**
- Chỉ so sánh users cùng level range (±2 levels).
- Reset hàng tuần (công bằng).
- Opt-in (user chọn tham gia, default on).
- **Phase 2** — không build lúc MVP.

### 10.7 Notification Strategy (Retention Cues)

| Notification | When | Content |
|-------------|------|---------|
| Morning reminder | 8:00 AM | "Good morning! Your English thought is waiting ☀️" |
| Streak at risk | 8:00 PM (nếu chưa active) | "Don't lose your 12-day streak! Quick journal?" |
| Lesson suggestion | After journal submit | "Nice! Want to practice more? Try: [lesson name]" |
| Weekly report | Sunday 6:00 PM | "Your week: 5 days, 24 words, 342 XP 🎯" |
| Achievement unlock | Real-time | "🏆 Achievement Unlocked: Week Warrior!" |
| Streak milestone | When reached | "🔥 30-day streak! You're building a real habit!" |
| New content | When admin publishes | "📚 New lesson available: [topic]" |

### 10.8 Completion Cue Design (Lesson)

Khi hoàn thành lesson:
```
┌──────────────────────────────┐
│      ⭐⭐⭐ Amazing!          │
│                              │
│   Score: 92/100              │
│   +28 XP · 🔥 Combo: 5       │
│   📝 5 new words saved       │
│                              │
│   ┌────────────────────┐     │
│   │ 📖 Next: "At the    │     │
│   │    Restaurant"       │     │
│   │ 5 min · 20 XP       │     │
│   │ [Start →]            │     │
│   └────────────────────┘     │
│                              │
│   or [Back to Dashboard]     │
└──────────────────────────────┘
```

**Key:** "Next lesson" CTA là quan trọng nhất — tạo chain effect.

### 10.9 STICK-specific Gamification vs Duolingo

| Feature | Duolingo | STICK | Lý do khác biệt |
|---------|----------|-------|-----------------|
| Hearts/Lives | ✅ 5 hearts | ❌ | STICK không trừng phạt |
| Gems/Coins | ✅ Virtual currency | ❌ Phase 1 | MVP đơn giản, chỉ XP |
| Leagues | ✅ Bronze → Diamond | ❌ Phase 1 | Cần user base lớn |
| Friend system | ✅ Follow/challenge | ❌ Phase 1 | Social feature ngoài MVP |
| Stories | ✅ Narrative content | 📝 Journal = STICK's stories | User viết câu chuyện riêng |
| Streak | ✅ Aggressive | ✅ Gentle | STICK: freeze + grace |
| XP | ✅ | ✅ | Cả hai dùng |
| Star rating | ❌ | ✅ | STICK dùng thay hearts |
| Combo | ❌ (có Super Duolingo) | ✅ Free | Ai cũng có combo |

### 10.10 Retention Loop Design

```
             ┌─────────────┐
             │ MORNING     │
             │ Push notification
             └──────┬──────┘
                    │
             ┌──────▼──────┐
             │ JOURNAL     │ Core loop (5 min)
             │ Write → AI  │
             └──────┬──────┘
                    │
             ┌──────▼──────┐
             │ LESSON      │ Optional (5 min)
             │ Learn → Quiz│
             └──────┬──────┘
                    │
             ┌──────▼──────┐
             │ COMPLETE    │
             │ XP + Score  │
             │ + Next cue  │
             └──────┬──────┘
                    │
             ┌──────▼──────┐
             │ EVENING     │
             │ Streak check│
             │ + Review    │
             └──────┬──────┘
                    │
             ┌──────▼──────┐
             │ NEXT DAY    │
             │ Return ↑    │
             └─────────────┘
```

**Điểm then chốt:** Journal là hook buổi sáng, Lesson là depth buổi chiều, Completion + cue là lock quay lại ngày mai.

---

## IMPLEMENTATION PRIORITY

### Phase 1 — MVP Enhancement (2–3 weeks)

| Task | Priority | Dependencies |
|------|----------|-------------|
| Mở rộng Lesson schema (xpReward, isPremium, tags, version) | P0 | None |
| Admin Lesson CRUD (create/edit/publish) | P0 | Schema |
| Exercise engine (fill_blank, multiple_choice, match) | P0 | Schema |
| Backend exercise validation | P0 | Exercise engine |
| Scoring system (per-exercise points, star rating) | P0 | Exercise engine |
| LessonAttempt model | P0 | Scoring |
| Anti-farming rules (daily XP cap) | P0 | Scoring |
| Improve AI prompt (journal feedback) | P1 | None |
| AI exercise generation | P1 | Exercise engine |
| Vocabulary auto-add from lessons | P1 | Lesson completion |

### Phase 2 — Learning Path (2–3 weeks)

| Task | Priority | Dependencies |
|------|----------|-------------|
| LearningPath, Unit, Module schema | P0 | Phase 1 |
| Learning Path UI (tree view, unlock flow) | P0 | Schema |
| Unit unlock logic (70% completion) | P0 | Progress tracking |
| Admin Path/Unit/Module management | P1 | Schema |
| "Continue Learning" smart button | P1 | Progress tracking |
| Daily lesson suggestion | P1 | Weak area detection |

### Phase 3 — Premium & Gamification (2–3 weeks)

| Task | Priority | Dependencies |
|------|----------|-------------|
| Premium content gating | P0 | Learning Path |
| Paywall screens | P0 | Premium gating |
| Achievement system (lesson-specific) | P1 | Scoring |
| Daily Goal system | P1 | Progress tracking |
| Level system (XP thresholds) | P1 | XP system |
| Weekly Report | P2 | Analytics |
| Leaderboard | P2 | XP system |

### Phase 4 — Advanced AI & Analytics (2–3 weeks)

| Task | Priority | Dependencies |
|------|----------|-------------|
| Weak area detection | P1 | Exercise history |
| Adaptive difficulty | P1 | Weak area detection |
| Smart recommendations | P1 | LearnerErrorPattern |
| Content performance dashboard (admin) | P1 | Analytics events |
| AI lesson generation (admin tool) | P2 | Content schema |
| Mistake Bank | P2 | Exercise history |

---

## RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI cost overrun | Cao | Cache aggressively, use mini models, daily budget alert |
| Content quality inconsistent | Cao | Admin review flow, quality alerts, human QA weekly |
| Over-engineering gamification | Trung bình | Strict phase gates, measure before adding more |
| User confused by lesson + journal | Trung bình | Clear onboarding, separate nav sections |
| Premium conversion too aggressive | Cao | A/B test, monitor free user retention alongside conversion |
| Exercise cheating (client-side) | Thấp | Backend validation, but MVP can tolerate some |
| Scope creep | Cao | This document is the scope lock. Any addition must be justified against success metrics |

---

## SUCCESS CRITERIA (LESSON SYSTEM)

| Metric | Target | Đo bằng |
|--------|--------|---------|
| Lesson completion rate | ≥ 60% | lesson_complete / lesson_start |
| Average score | 65–80% | Quá thấp = quá khó, quá cao = quá dễ |
| Lesson → next day return | ≥ 45% | Users who did lesson → return tomorrow |
| Premium conversion from lesson lock | ≥ 5% | paywall_view → subscription |
| Exercise accuracy improvement | +10% over 2 weeks | Per-user accuracy trend |
| Vocab retention from lessons | ≥ 40% mastered after 2 weeks | VocabNotebookItem mastery tracking |
| AI error rate | < 5% | ai_error events |
| Admin time to publish lesson | < 15 minutes | admin workflow tracking |

---

## KẾT LUẬN

Lesson system là **đòn bẩy tăng trưởng và monetization** cho STICK.  
Nó phải hoạt động **cùng với** core loop (journal), không thay thế.  
User phải cảm thấy: "Viết journal cho mình cảm giác tiến bộ mỗi ngày, lessons cho mình kiến thức thật sự."

Duolingo mạnh ở gamification, nhưng họ không có **journal**.  
STICK mạnh ở **cá nhân hóa** — AI hiểu user đang yếu gì, viết gì, và suggest lesson phù hợp.  
Đây là **unique advantage** mà cần được khai thác xuyên suốt thiết kế.

---

*Tài liệu này là scope lock cho Lesson System. Mọi thay đổi hoặc bổ sung phải được duyệt và đánh giá ảnh hưởng tới core loop, success metrics, và implementation timeline.*

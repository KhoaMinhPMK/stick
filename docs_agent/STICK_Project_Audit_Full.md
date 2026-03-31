# BẢNG THỐNG KÊ DỰ ÁN STICK — AUDIT TOÀN DIỆN
> Ngày: 31/03/2026 | Phiên bản: Post-Admin MVP  
> Mục tiêu: Liệt kê tất cả chức năng trung gian còn thiếu để user trải nghiệm tốt nhất, admin quản lý rõ ràng nhất.

---

## 1. TỔNG QUAN HIỆN TẠI

| Hạng mục | Số lượng | Hoạt động |
|---|---|---|
| Frontend pages | 43 trang | 40 hoạt động, 3 chưa nối |
| Backend routes | 67 route | 65 hoạt động, 2 chưa dùng |
| Admin pages | 10 trang | 10/10 hoạt động |
| Prisma models | 17 model | 17/17 |
| Core Loop steps | 5 bước | 4.5/5 (Speaking thiếu) |

---

## 2. CORE LOOP — THIẾU GÌ ĐỂ HOÀN CHỈNH?

### ✅ Bước 1: Write (Hoàn chỉnh)
- Daily Prompt từ admin → hiển thị đúng → user viết → autosave → submit  
- XP tự tính, draft giữ lại khi gián đoạn

### ✅ Bước 2: AI Feedback (Hoàn chỉnh)
- Groq AI rewrite + corrections + vocab + patterns + encouragement  
- Score → XP → LearningSession → AILog ghi lại

### ✅ Bước 3: Review (Hoàn chỉnh)
- Flashcard từ feedback vocab  
- Mastery: new → learning → mastered

### ⚠️ Bước 4: Speaking/Shadowing (Thiếu 1 phần)
| Có | Thiếu |
|---|---|
| TTS phát audio câu mẫu ✅ | Speech-to-text recording ❌ |
| Play/replay/speed control ✅ | So sánh phát âm user vs model ❌ |
| Analytics audio_play ✅ | Lưu recording lên server ❌ |

### ✅ Bước 5: Complete + Return (Hoàn chỉnh)
- Mood tracking, streak, celebration screen  
- Daily prompt hệ thống, progress calendar

---

## 3. DANH SÁCH CHỨC NĂNG TRUNG GIAN CÒN THIẾU

### 🔴 CRITICAL — Ảnh hưởng trực tiếp đến trải nghiệm user

#### GAP-01: Achievement không tự unlock
- **Hiện tại:** Bảng `AchievementDefinition` + `UserAchievement` có sẵn. Frontend hiển thị danh sách. Nhưng KHÔNG có logic tự động unlock.
- **Thiếu:** Trigger engine — khi user viết 5 bài, streak 3 ngày, v.v. → tự unlock achievement + tạo notification.
- **Ảnh hưởng:** User thấy danh sách achievements trống → mất motivation.
- **Giải pháp:** Thêm hàm `checkAndUnlockAchievements(userId)` gọi sau mỗi journal submit, streak update.

#### GAP-02: Notification không tự tạo
- **Hiện tại:** Model `Notification` có sẵn. Frontend hiển thị + đánh dấu đã đọc. Nhưng KHÔNG có route/logic TẠO notification.
- **Thiếu:** Backend route `POST /notifications` + trigger tự tạo notification khi: achievement unlock, streak milestone, 24h chưa quay lại.
- **Ảnh hưởng:** Trang Notifications luôn trống → tính năng vô dụng.
- **Giải pháp:** Thêm helper `createNotification(userId, type, title, body)`. Hook vào achievement unlock, streak milestones, journal feedback.

#### GAP-03: Session token không hết hạn
- **Hiện tại:** Model `Session` có field `expiresAt` nhưng middleware `requireAuth` KHÔNG kiểm tra.
- **Thiếu:** Check `expiresAt` trong `getUserFromBearer()`. Set expiry khi tạo session (vd: 30 ngày).
- **Ảnh hưởng:** Token hợp lệ vĩnh viễn = rủi ro bảo mật.
- **Giải pháp:** Thêm check `if (session.expiresAt && session.expiresAt < new Date())` + set `expiresAt: 30 ngày` khi `createSession()`.

#### GAP-04: Grammar/Listening/Reading chưa nối API
- **Hiện tại:** 3 trang frontend + 2 backend route (`/ai/grammar-quiz`, `/ai/reading-content`) đều tồn tại.
- **Thiếu:** Frontend KHÔNG gọi API — hiển thị UI nhưng không load data thật. Không lưu kết quả vào `LearningSession`.
- **Ảnh hưởng:** 3 tính năng phụ nhưng user click vào thì thấy trống/mock.
- **Giải pháp:** Nối 3 trang vào API + lưu `LearningSession` khi hoàn thành.

---

### 🟡 MEDIUM — Cần có để vận hành pilot tốt

#### GAP-05: Reminder không gửi push notification
- **Hiện tại:** User tạo reminder (vd: 8:00 sáng, thứ 2-6). Lưu vào DB. Nhưng KHÔNG có cron job kiểm tra + gửi.
- **Thiếu:** Scheduled task kiểm tra reminders mỗi phút + gửi push notification (Firebase Cloud Messaging hoặc Web Push).
- **Ảnh hưởng:** Reminder là tính năng ma — lưu nhưng không làm gì.
- **Giải pháp Phase 1:** Tạo cron job check reminders → tạo in-app notification. Phase 2: FCM push.

#### GAP-06: Streak không có logic reset/midnight
- **Hiện tại:** Streak tính bằng đếm ProgressDaily liên tiếp. Nhưng không có scheduled job reset/notify.
- **Thiếu:** Logic cảnh báo "sắp mất streak" (vd: 20:00 chưa làm bài → push notification).
- **Ảnh hưởng:** User không biết mình sắp mất streak → less motivation.
- **Giải pháp:** Cron job 20:00 → check user chưa có ProgressDaily hôm nay → tạo notification "Đừng quên viết hôm nay, streak [X] ngày đang chờ bạn!"

#### GAP-07: Leaderboard rank chưa chính xác
- **Hiện tại:** Lấy top 20, nếu user không trong top 20 thì append cuối.
- **Thiếu:** Tính rank thực tế (vd: "Bạn đứng thứ 47/150").
- **Ảnh hưởng:** User nhầm tưởng mình top 21 trong khi thực tế thứ 100+.
- **Giải pháp:** Thêm subquery `COUNT(*) WHERE totalXp > currentUser.totalXp` để tính rank thật.

#### GAP-08: History chỉ ghi Journal, không ghi Grammar/Reading/Listening
- **Hiện tại:** `LearningSession` chỉ được tạo khi submit journal + nhận feedback.
- **Thiếu:** Khi user hoàn thành grammar quiz, reading, listening → cũng phải tạo `LearningSession`.
- **Ảnh hưởng:** History List chỉ hiện journal entries, 3 loại practice khác không hiện.
- **Giải pháp:** Thêm `POST /learning-sessions` route, gọi sau mỗi practice completion.

#### GAP-09: Admin Dashboard funnel dùng ước tính thay vì data thật
- **Hiện tại:** `prompt_view = sessions * 0.95`, `draft_saved = submissions + submissions * 0.15` — hardcoded ratio.
- **Thiếu:** Đếm từ analytics events thực (hoặc từ bảng riêng tracking mỗi step).
- **Ảnh hưởng:** Dashboard pilot không chính xác → decision-making sai.
- **Giải pháp:** Tạo bảng `AnalyticsEvent` hoặc đọc từ Firebase Analytics API. Interim: dùng Journal status counts thay vì ước tính.

#### GAP-10: Daily Prompt chưa kết nối vào Journal page
- **Hiện tại:** Route `/daily-prompt/today` tồn tại. Admin tạo prompt. Nhưng Journal page (`Journal.tsx`) có thể KHÔNG gọi endpoint này để hiện prompt hôm nay.
- **Thiếu:** Kiểm tra Journal page có dùng daily prompt từ admin hay dùng hardcoded prompt.
- **Ảnh hưởng:** Admin tạo prompt nhưng user không thấy → FR-10 fail.
- **Giải pháp:** Nối Journal page gọi `/daily-prompt/today` và hiển thị prompt.

---

### 🟢 LOW — Nice-to-have cho pilot, có thể làm sau

#### GAP-11: Vocab không có Spaced Repetition
- **Hiện tại:** Mastery levels `new/learning/mastered` nhưng không có thuật toán ôn tập.
- **Giải pháp sau pilot:** Thêm `nextReviewAt` field + SM-2 algorithm.

#### GAP-12: Không có Rate Limiting
- **Hiện tại:** API không giới hạn số request.
- **Giải pháp:** Thêm `express-rate-limit` middleware cho AI routes (tốn tiền Groq).

#### GAP-13: User không thể xóa tài khoản
- **Hiện tại:** Không có route xóa account.
- **Giải pháp:** `DELETE /me` → soft delete hoặc anonymize.

#### GAP-14: Không có Email Verification
- **Hiện tại:** Firebase auth nhưng không verify email.
- **Giải pháp:** Firebase `sendEmailVerification()` sau register.

#### GAP-15: Lesson không có progress tracking
- **Hiện tại:** User xem lesson nhưng không lưu "đã đọc".
- **Giải pháp:** Thêm junction table `UserLessonProgress` + XP khi hoàn thành.

#### GAP-16: Static pages (Terms, Privacy, Help, About) hardcoded
- **Hiện tại:** Content nằm trong frontend code, admin không sửa được.
- **Giải pháp:** Dùng `AppConfig` lưu nội dung, hoặc tạo Markdown CMS nhỏ.

#### GAP-17: JournalArchive page không nối
- **Hiện tại:** Trang tồn tại nhưng không có API riêng cho archived journals.
- **Giải pháp:** Sử dụng `/journals?status=submitted` với filter.

#### GAP-18: Admin không có bulk actions
- **Hiện tại:** Xóa/publish prompt từng cái, ban user từng cái.
- **Giải pháp sau pilot:** Thêm checkbox + bulk action bar.

#### GAP-19: Không có "Report Bug" / Feedback form
- **Hiện tại:** User không có cách báo lỗi trong app.
- **Giải pháp:** Form đơn giản gửi vào `Notification` cho admin hoặc email.

---

## 4. BẢNG TỔNG HỢP FRONTEND ↔ BACKEND

| Tính năng | Frontend | Backend | Kết nối | Ghi chú |
|---|---|---|---|---|
| Auth (Email/Google/Guest) | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Onboarding | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Journal Write | ✅ | ✅ | ✅ | Hoàn chỉnh |
| AI Feedback | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Vocab Review | ✅ | ✅ | ✅ | Hoàn chỉnh |
| TTS Audio | ✅ | N/A | ✅ | Browser Web Speech API |
| Speech Record | ✅ UI | ❌ | ❌ | Không có backend |
| Completion/Mood | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Streak/Progress | ✅ | ✅ | ✅ | Thiếu reset logic |
| Achievements | ✅ | ✅ Schema | ⚠️ | Không tự unlock |
| Notifications | ✅ | ✅ Read | ⚠️ | Không tự tạo |
| Leaderboard | ✅ | ✅ | ⚠️ | Rank chưa chính xác |
| Grammar Quiz | ✅ UI | ✅ API | ❌ | Chưa nối |
| Listening | ✅ UI | ✅ API | ❌ | Chưa nối |
| Reading | ✅ UI | ✅ API | ❌ | Chưa nối |
| Library/Lessons | ✅ | ✅ | ✅ | Thiếu progress |
| Saved Phrases | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Vocab Notebook | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Settings | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Reminders | ✅ | ✅ CRUD | ⚠️ | Không gửi push |
| Profile/Edit | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Daily Prompt (Admin) | ✅ | ✅ | ✅ | Cần nối vào Journal |
| Admin Dashboard | ✅ | ✅ | ✅ | Funnel ước tính |
| Admin Users | ✅ | ✅ | ✅ | Đã fix sort |
| Admin AI Logs | ✅ | ✅ | ✅ | Hoàn chỉnh |
| Admin Config | ✅ | ✅ | ✅ | Hoàn chỉnh |

---

## 5. ĐỀ XUẤT THỨ TỰ TRIỂN KHAI

### Sprint 1 — Kết nối & Sửa lỗi (Ưu tiên cao nhất)
| # | Task | Effort | Lý do |
|---|---|---|---|
| 1 | GAP-10: Nối Daily Prompt vào Journal page | S | FR-10: Admin publish prompt → user phải thấy |
| 2 | GAP-01: Achievement auto-unlock engine | M | User cần thấy tiến bộ, motivation |
| 3 | GAP-02: Notification auto-create | M | Kết nối với achievements + streak |
| 4 | GAP-03: Session token expiry | S | Bảo mật cơ bản |
| 5 | GAP-04: Nối Grammar/Listening/Reading vào API | M | 3 trang frontend đang trống |

### Sprint 2 — Vận hành Pilot
| # | Task | Effort | Lý do |
|---|---|---|---|
| 6 | GAP-06: Streak warning notification | S | Retention |
| 7 | GAP-08: History ghi nhận mọi loại practice | S | Tracking đầy đủ |
| 8 | GAP-09: Dashboard funnel dùng data thật | M | Decision-making chính xác |
| 9 | GAP-07: Leaderboard rank chính xác | S | UX |
| 10 | GAP-12: Rate limiting cho AI routes | S | Tiết kiệm chi phí Groq |

### Sprint 3 — Polish
| # | Task | Effort | Lý do |
|---|---|---|---|
| 11 | GAP-05: Reminder push notification | L | Cần FCM setup |
| 12 | GAP-11: Spaced repetition | M | Vocab retention |
| 13 | GAP-15: Lesson progress tracking | S | Gamification |
| 14 | GAP-13: Account deletion | S | GDPR/compliance |
| 15 | GAP-17: Journal Archive nối API | S | UX cleanup |

> **S** = Small (< 2h) | **M** = Medium (2-4h) | **L** = Large (4-8h)

---

## 6. KẾT LUẬN

**Sản phẩm đã có nền tảng vững chắc:**
- Core loop 4.5/5 bước hoàn chỉnh
- 65/67 backend routes hoạt động
- Admin panel 10/10 trang functional
- 40/43 frontend pages kết nối API thật

**Cần ưu tiên nhất:**
1. **Nối Daily Prompt → Journal** (để admin publish prompt có tác dụng)
2. **Achievement unlock engine** (để trang Achievements không trống)
3. **Notification creation** (để trang Notifications không trống)
4. **Session expiry** (bảo mật)
5. **Nối 3 practice pages** (Grammar/Listening/Reading vào API)

**Sau khi hoàn thành Sprint 1 (5 tasks), sản phẩm đủ điều kiện chạy pilot.**

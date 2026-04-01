# STICK — Sprint Progress Tracker

> **Cập nhật lần cuối:** 2026-04-01  
> **Mục tiêu:** Đóng tất cả GAP từ Feature Audit để sẵn sàng chạy pilot

---

## Tổng quan

| Sprint | Tổng GAP | Hoàn thành | Còn lại |
|--------|----------|------------|---------|
| Sprint 1 — Critical | 5 | 5 ✅ | 0 |
| Sprint 2 — Vận hành Pilot | 5 | 5 ✅ | 0 |
| Sprint 3 — Polish | 5 | 4 ✅ | 1 |
| **Tổng** | **17** | **14** | **1** |

---

## Sprint 1 — Critical (Hoàn thành 5/5) ✅

| # | GAP | Mô tả | Status | Commit | Test trên VPS |
|---|-----|-------|--------|--------|---------------|
| 1 | GAP-10 | Nối Daily Prompt vào Journal page | ✅ Done | `1790786` | ✅ Fallback OK, prompt hiển thị đúng EN/VI |
| 2 | GAP-01 | Achievement auto-unlock engine | ✅ Done | `1790786` + `d01b0ae` (fix) | ✅ `first_journal` unlock đúng sau AI feedback, còn lại locked |
| 3 | GAP-02 | Notification auto-create khi achievement unlock | ✅ Done | `1790786` | ✅ "🏆 First Steps" notification tự tạo |
| 4 | GAP-03 | Session token expiry 30 ngày | ✅ Done | `1790786` | ✅ `expiresAt` set đúng, expired session bị reject |
| 5 | GAP-04 | Grammar/Reading/Listening → LearningSession | ✅ Done | `1790786` | ✅ `POST /learning-sessions` hoạt động, History hiển thị đa loại |

### Bug đã fix trong Sprint 1
- **Achievement false-positive:** Tất cả achievement bị unlock sai do tạo progress record cho cả chưa qualified → fix bằng cách check `progress >= threshold` (commit `d01b0ae`)

---

## Sprint 2 — Vận hành Pilot (Hoàn thành 5/5) ✅

| # | GAP | Mô tả | Status | Commit | Test trên VPS |
|---|-----|-------|--------|--------|---------------|
| 6 | GAP-06 | Streak warning notification | ✅ Done | `7bcf1e9` + `81702c9` | Cron setInterval mỗi 4h, check users chưa hoạt động hôm nay, tạo notification "streak" |
| 7 | GAP-08 | History ghi nhận mọi loại practice | ✅ Done | `1790786` | ✅ Đã fix qua GAP-04, History hiện journal + grammar + listening + reading |
| 8 | GAP-09 | Admin Dashboard funnel dùng data thật | ✅ Done | `eb02f65` | ✅ Dùng actual DB draft/feedback counts thay vì ước tính |
| 9 | GAP-07 | Leaderboard rank chính xác | ✅ Done | `eb02f65` | ✅ Rank tính từ COUNT real XP |
| 10 | GAP-12 | Rate limiting cho AI routes | ✅ Done | `eb02f65` | ✅ `express-rate-limit` 10 req/min/IP cho 3 AI endpoints |

---

## Sprint 3 — Polish (Hoàn thành 4/5)

| # | GAP | Mô tả | Status | Commit | Ghi chú |
|---|-----|-------|--------|--------|----------|
| 11 | GAP-05 | Reminder push notification | ❌ Chưa làm | — | Cần setup Firebase Cloud Messaging (FCM) trên Firebase Console + VPS |
| 12 | GAP-11 | Spaced repetition cho vocab | ✅ Done | `7bcf1e9` + `81702c9` | SM-2 algorithm, `GET /due` + `POST /:id/review`, SRS migration applied |
| 13 | GAP-15 | Lesson progress tracking | ✅ Done | `eb02f65` | `POST /library/lessons/:id/complete` + auto-send từ LessonDetail |
| 14 | GAP-13 | Account deletion (DELETE /me) | ✅ Done | `eb02f65` | Cascading delete, Settings page có nút xóa + confirm modal |
| 15 | GAP-17 | Journal Archive nối API filter | ✅ Done | `eb02f65` | `GET /journals?status=submitted` hoạt động |

---

## Còn lại — 1 GAP chưa triển khai

### GAP-05: Reminder Push Notification (Large)
- **Yêu cầu:** Cron job kiểm tra Reminder records → gửi push notification qua FCM
- **Blockers:**
  - Cần bật FCM trên Firebase Console
  - Cần service account key cho FCM server-side
  - Cần frontend đăng ký FCM token (`Notification.requestPermission()` + `getToken()`)
  - Cần backend lưu FCM token per user
- **Ước lượng:** 4–8h

### ~~GAP-11: Spaced Repetition cho Vocab~~ ✅ DONE
- SM-2 algorithm implemented in backend
- `GET /vocab/notebook/due` returns items where `nextReviewAt <= now` or never reviewed
- `POST /vocab/notebook/:id/review` applies SM-2 recalculation (quality 0-5)
- Frontend VocabularyReview updated to use SRS flow
- Tested on VPS: review updates interval/count/nextReviewAt correctly

### ~~GAP-06: Streak Warning Notification~~ ✅ DONE
- `setInterval` cron every 4 hours in server.js
- Checks users with yesterday activity but no today activity
- Creates "streak" notification with dedup (max 1 per day per user)
- Initial check 30s after server start

---

## Thay đổi hạ tầng

| Thay đổi | Chi tiết |
|----------|----------|
| SSH key setup | Public key đã cài trên VPS (`administrators_authorized_keys`) → SSH không cần password |
| Rate limiter | `express-rate-limit` đã cài trên VPS (`yarn add`) |
| Prisma fix | Downgrade từ 7.6.0 → 6.6.0 để tránh breaking changes (runtime/library.js path changed in v7) |
| PM2 process | `stick-api-prod` (ID 15) trên port 3040, IIS reverse proxy |

---

## Commit History

| Commit | Message | Ngày |
|--------|---------|------|
| `1790786` | feat: Sprint 1 - close 5 critical gaps for pilot readiness | 2026-03-31 |
| `d01b0ae` | fix: achievement unlock false-positive | 2026-03-31 |
| `eb02f65` | feat: Sprint 2+3 - complete remaining gaps | 2026-04-01 |
| `7bcf1e9` | feat: GAP-06 streak cron + GAP-11 SRS vocab review | 2026-04-01 |
| `81702c9` | fix: downgrade prisma to 6.6.0 for VPS compatibility | 2026-04-01 |

---

## Tiếp theo

1. **GAP-05** (push notification) — cần setup FCM trên Firebase Console trước khi code
2. **Sau khi hoàn thành 15/15 in-scope GAP → sản phẩm sẵn sàng chạy pilot** (GAP-05 optional nếu chưa setup FCM, GAP-14/16 đã đóng từ audit)

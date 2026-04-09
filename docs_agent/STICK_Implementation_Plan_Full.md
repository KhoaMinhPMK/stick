# STICK — Kế Hoạch Triển Khai Toàn Bộ (09/04/2026)

> Tài liệu này bao gồm toàn bộ thay đổi cần làm, root cause từng bug, code cần sửa chính xác, test case, và thứ tự triển khai.

---

## MỤC LỤC

| # | Nhóm | Ưu tiên | Trạng thái |
|---|------|---------|-----------|
| A | [Premium Sync — Backend + Frontend](#a-premium-sync) | P0 (Critical) | Chưa làm |
| B | [Admin Stats 500 Error](#b-admin-stats-500-error) | P0 (Critical) | Chưa làm |
| C | [Profile Save 500 Error](#c-profile-save-500-error) | P0 (Critical) | Chưa làm |
| D | [Day Number Logic](#d-day-number-logic) | P0 (Critical) | Cần xác nhận |
| E | [Header: Streak count + Logout icon](#e-header-streak-count--logout-icon) | P1 (UX) | Chưa làm |
| F | [Dashboard: Fire Animation (Premium)](#f-dashboard-fire-animation-premium) | P1 (UX) | Chưa làm |
| G | [Leaderboard #1 Crown + Premium Avatar](#g-leaderboard-1-crown--premium-avatar) | P1 (Motivation) | Chưa làm |
| H | [Avatar hoạt động đúng khắp hệ thống](#h-avatar-hoạt-động-đúng-khắp-hệ-thống) | P1 (UX) | Chưa làm |
| I | [XP Farming Prevention](#i-xp-farming-prevention) | P0 (Integrity) | Một phần |
| J | [Library Learning Logic](#j-library-learning-logic) | P1 (Logic) | Cần plan kỹ |

---

## A. PREMIUM SYNC

### Root Cause

```
Frontend: usePremium() → getStoredUser() → đọc localStorage
localStorage chỉ set khi login/register → KHÔNG BAO GIỜ cập nhật lại
Admin set isPremium = true → DB cập nhật → user browser KHÔNG BIẾT
```

**Luồng lỗi:**
1. User đăng nhập → `persistAuth()` lưu `{ isPremium: false }` vào `localStorage`
2. Admin bật Premium cho user → DB update OK
3. User mở app → `usePremium()` đọc localStorage → vẫn `false`
4. `/progress/summary` KHÔNG return `isPremium` → không có cách nào refresh

### Giải pháp

#### Bước A1: Backend — Thêm `isPremium` vào `/progress/summary` response

**File:** `backend/src/routes/apiV1.js` (~line 2150)

```diff
- const user = await prisma.user.findUnique({ where: { id: req.authUser.id }, select: { createdAt: true, totalXp: true } });
+ const user = await prisma.user.findUnique({ where: { id: req.authUser.id }, select: { createdAt: true, totalXp: true, isPremium: true, avatarUrl: true } });
```

Và thêm vào response (~line 2195):

```diff
  res.status(200).json({
    ...
    dayNumber,
    streakFreezeCount,
+   isPremium: Boolean(user?.isPremium),
+   avatarUrl: user?.avatarUrl || null,
  });
```

#### Bước A2: Frontend — Update `ProgressSummary` type

**File:** `frontend/src/services/api/endpoints.ts` (~line 280)

```diff
  export interface ProgressSummary {
    ...
    streakFreezeCount: number;
+   isPremium: boolean;
+   avatarUrl: string | null;
  }
```

#### Bước A3: Frontend — Sync localStorage khi nhận summary

**File:** `frontend/src/services/api/endpoints.ts` — sửa `getProgressSummary()`

```diff
  export async function getProgressSummary() {
-   return apiRequest<ProgressSummary>('/progress/summary');
+   const summary = await apiRequest<ProgressSummary>('/progress/summary');
+   // Sync premium + avatar vào localStorage để các hook đọc được
+   try {
+     const raw = localStorage.getItem('stick_user');
+     if (raw) {
+       const stored = JSON.parse(raw);
+       let changed = false;
+       if (stored.isPremium !== summary.isPremium) { stored.isPremium = summary.isPremium; changed = true; }
+       if (summary.avatarUrl !== undefined && stored.avatarUrl !== summary.avatarUrl) { stored.avatarUrl = summary.avatarUrl; changed = true; }
+       if (changed) localStorage.setItem('stick_user', JSON.stringify(stored));
+     }
+   } catch {}
+   return summary;
+ }
```

#### Bước A4: Frontend — `usePremium()` cũng đọc từ summary (reactive)

Hiện tại `usePremium()` là static read, không re-render khi localStorage thay đổi.
Nhưng vì mỗi trang gọi `getProgressSummary()` → localStorage sync → component re-mount → `usePremium()` sẽ đọc giá trị mới.

**Không cần sửa `usePremium.ts`** — re-mount đã đủ vì mỗi page navigate = remount.

### Test Cases

| # | Test | Expected |
|---|------|----------|
| A-T1 | Admin bật premium cho user X → User X mở app / navigate Home | `usePremium()` = true, thấy Premium badge |
| A-T2 | Admin tắt premium → User navigate | Premium badge biến mất |
| A-T3 | User login lần đầu, chưa có premium | `isPremium: false` bình thường |
| A-T4 | Avatar update qua Edit Profile → vào lại Home | Header avatar cập nhật đúng |

---

## B. ADMIN STATS 500 ERROR

### Root Cause

**Route:** `POST /admin/users/:id/stats` (line 3166)

Logic backfill streak tạo `ProgressDaily` records với `new Date()` rồi `setHours(0,0,0,0)` — dùng **server local time**.

Trên VPS Windows, time zone có thể là UTC hoặc ICT (UTC+7). Nếu VPS timezone ≠ UTC:
- `new Date()` → local time
- `d.setHours(0, 0, 0, 0)` → midnight local time
- MySQL `DATE` column stores date part only
- Prisma gửi `2026-04-09T00:00:00.000Z` (UTC) → MySQL lưu `2026-04-09`
- Nhưng nếu local time là `2026-04-09T07:00:00+07:00`, `setHours(0,0,0)` = `2026-04-09T00:00:00+07:00` = `2026-04-08T17:00:00Z`
- → MySQL nhận `2026-04-08` thay vì `2026-04-09`!

**Lỗi thực tế khác:** Có thể 500 xảy ra do:
1. `UserXpLog.create` thiếu `id` field (Prisma `@default(uuid())` thì auto-gen, nhưng nếu schema MySQL chưa migrate đúng thì gãy)
2. Race condition trên upsert khi 2 request đồng thời

### Giải pháp

#### Bước B1: Sử dụng Vietnam timezone nhất quán

**File:** `backend/src/routes/apiV1.js` — route `POST /admin/users/:id/stats` (~line 3192)

```diff
  if (typeof setCurrentStreak === 'number' && setCurrentStreak >= 0) {
    updateData.currentStreak = Math.round(setCurrentStreak);
    if (setCurrentStreak > 0) {
-     const today = new Date();
-     today.setHours(0, 0, 0, 0);
+     // Use Vietnam timezone to stay consistent with progress tracking
+     const vnTodayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
+     const today = new Date(vnTodayStr + 'T00:00:00.000Z');
      for (let i = 0; i < Math.min(setCurrentStreak, 365); i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
-       d.setHours(0, 0, 0, 0);
        await prisma.progressDaily.upsert({
```

#### Bước B2: Wrap trong try-catch để trả lỗi rõ hơn thay vì 500

Kiểm tra xem `asyncHandler` đã catch chưa — nếu đã catch OK thì chỉ cần log rõ hơn:

```diff
  } catch (err: unknown) {
-   setStatsError(err instanceof Error ? err.message : 'Update failed');
+   const msg = err instanceof Error ? err.message : 'Update failed';
+   console.error('Stats update failed:', err);
+   setStatsError(msg);
  }
```

### Test Cases

| # | Test | Expected |
|---|------|----------|
| B-T1 | Admin set XP +100 → Apply | XP tăng đúng 100, không 500 |
| B-T2 | Admin set streak = 5 → Apply | Streak = 5, backfill 5 ngày ProgressDaily |
| B-T3 | Admin set best streak = 3 | Best streak update, không crash |
| B-T4 | Admin gửi XP=0, streak rỗng | Nhận message "No valid stat fields provided" (400), không crash |
| B-T5 | Admin set streak = 88, best = 86 đồng thời | Cả hai update đúng |

---

## C. PROFILE SAVE 500 ERROR

### Root Cause

Lỗi `"Failed to save profile s: An unexpected error occurred"` — `s` trong console log:
```js
console.error('Failed to save profile', err);
// err.message = "An unexpected error occurred" → không phải từ message cụ thể
```

**Nguyên nhân tiềm năng:**
1. Avatar base64 quá lớn → MySQL `max_allowed_packet` reject
2. `avatarUrl` column type là `@db.Text` (~65KB) → data:image/png;base64 ảnh 500KB = ~680K chars → vượt TEXT limit
3. Cần đổi thành `@db.LongText` hoặc `@db.MediumText`

#### Kiểm tra schema:

```prisma
model User {
  avatarUrl     String?   @db.Text    // ← TEXT = max 65,535 bytes
}
```

Base64 encode 500KB image = ~700,000 chars → **vượt TEXT limit** → MySQL return error → 500!

### Giải pháp

#### Bước C1: Migrate `avatarUrl` sang `MediumText`

```sql
ALTER TABLE `User` MODIFY `avatarUrl` MEDIUMTEXT;
```

Hoặc update schema.prisma:

```diff
- avatarUrl     String?   @db.Text
+ avatarUrl     String?   @db.MediumText
```

Rồi tạo migration:
```bash
yarn prisma migrate dev --name avatar_mediumtext
```

#### Bước C2: Backend — Enforce limit rõ ràng + error message

**File:** `backend/src/routes/apiV1.js` (~line 1145)

```diff
  } else if (avatarUrl.startsWith('data:image/') && avatarUrl.length > 700000) {
    avatarTooLarge = true;
  }
+ // Also catch non-data-url strings that aren't valid
+ else if (!avatarUrl.startsWith('data:image/') && avatarUrl !== '') {
+   // Ignore invalid avatar URLs
+ }
```

#### Bước C3: Frontend — Compress avatar trước khi upload

**File:** `frontend/src/pages/app/EditProfile.tsx`

Thêm canvas resize trước khi set `avatarPreview`, giới hạn 200x200px, quality 0.7:

```typescript
// Trong handleAvatarChange:
const img = new Image();
img.onload = () => {
  const canvas = document.createElement('canvas');
  const MAX = 200;
  let w = img.width, h = img.height;
  if (w > MAX || h > MAX) {
    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
    else { w = Math.round(w * MAX / h); h = MAX; }
  }
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  setAvatarPreview(canvas.toDataURL('image/jpeg', 0.7));
};
img.src = dataUrl;
```

### Test Cases

| # | Test | Expected |
|---|------|----------|
| C-T1 | Upload ảnh 2MB → Save | Ảnh compress xuống ~40KB, save thành công |
| C-T2 | Upload ảnh nhỏ 50KB | Save thành công, không compress |
| C-T3 | Xóa avatar (set empty) → Save | OK, avatar removed |
| C-T4 | Save chỉ name (không đổi avatar) | OK |

---

## D. DAY NUMBER LOGIC

### Phân tích

```javascript
// backend/src/routes/apiV1.js line 2168
const dayNumber = todayCompleted ? totalJournals : totalJournals + 1;
```

**Logic:**
- User mới, chưa viết gì: `totalJournals=0`, `todayCompleted=false` → `dayNumber = 0 + 1 = 1` ✅
- User viết ngày 1, sang ngày 2 chưa viết: `totalJournals=1`, `todayCompleted=false` → `dayNumber = 1 + 1 = 2` ✅
- User viết ngày 2: `totalJournals=2`, `todayCompleted=true` → `dayNumber = 2` ✅

**Logic đúng.** Nếu user thấy vẫn Day 1 → kiểm tra:

### Nguyên nhân khả thi

1. **Timezone mismatch:** VPS server time ≠ UTC+7 → `vnTodayStart/vnTodayEnd` tính sai → journal ngày hôm qua bị đếm là hôm nay → `todayCompleted=true` khi lẽ ra `false`
2. **Journal `createdAt` lưu UTC** nhưng check dùng ICT range → có thể miss journal tạo lúc 23:xx ICT (= 16:xx UTC ngày trước)
3. **Cache issue:** Dashboard có `useEffect([], [])` nên fetch lúc mount. Nếu user không navigate đi + quay lại thì data cũ

### Giải pháp

#### Bước D1: Thêm log debug tạm vào `/progress/summary`

```javascript
console.log('[DEBUG dayNumber]', {
  userId: req.authUser.id,
  totalJournals,
  todayCompleted,
  vnToday,
  todayJournal: todayJournal?.id,
  calculatedDayNumber: dayNumber,
});
```

#### Bước D2: Kiểm tra server timezone

```powershell
# Trên VPS:
node -e "console.log('TZ:', Intl.DateTimeFormat().resolvedOptions().timeZone); console.log('Local:', new Date().toString()); console.log('VN:', new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }))"
```

Nếu TZ khác `Asia/Ho_Chi_Minh` → OK, code đã dùng explicit timezone.

#### Bước D3: Fix `todayJournal` check dùng query chính xác hơn

Hiện tại:
```javascript
createdAt: { gte: vnTodayStart, lte: vnTodayEnd }
```

`vnTodayStart = new Date('2026-04-09T00:00:00+07:00')` → UTC: `2026-04-08T17:00:00Z`
`vnTodayEnd = new Date('2026-04-09T23:59:59.999+07:00')` → UTC: `2026-04-09T16:59:59.999Z`

Nếu user tạo journal lúc 23:30 VN time = 16:30 UTC → `createdAt = 2026-04-09T16:30:00Z`

Kiểm tra: `2026-04-08T17:00:00Z <= 2026-04-09T16:30:00Z <= 2026-04-09T16:59:59Z` → ✅

**Logic đúng.** Vấn đề khả thi nhất là cache frontend hoặc data thực tế.

### Test Cases

| # | Test | Expected |
|---|------|----------|
| D-T1 | Tạo journal ngày 1, sang ngày 2 mở Home | Day 2 |
| D-T2 | Chưa tạo journal bao giờ, mở Home | Day 1 |
| D-T3 | Tạo journal ngày 2 xong | Day 2 (không nhảy Day 3) |
| D-T4 | Mở Home lúc 23:59 VN, sang 00:01 VN không refresh | Day cũ (cần navigate lại) |

---

## E. HEADER: STREAK COUNT + LOGOUT ICON

### Hiện trạng

```
[🔥 {streak}] [avatar]
```

**Yêu cầu:**
- ✅ Streak count ĐÃ CÓ trong header (AppLayout line 99): `{summary?.currentStreak ?? 0}`
- ❌ Thiếu logout icon bên cạnh avatar
- Yêu cầu: Thêm icon logout ở trang Home, kế bên avatar

### Giải pháp

#### Bước E1: Thêm logout icon vào header, sau avatar

**File:** `frontend/src/layouts/AppLayout.tsx`

Sau avatar div (~line 116):

```tsx
{/* Logout */}
<button
  onClick={() => {
    localStorage.removeItem('stick_access_token');
    localStorage.removeItem('stick_user');
    window.location.hash = '#login';
    window.location.reload();
  }}
  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-transparent hover:border-black hover:bg-error-container transition-all active:scale-90"
  title="Đăng xuất"
>
  <span className="material-symbols-outlined text-on-surface-variant text-lg md:text-xl">logout</span>
</button>
```

### Test Cases

| # | Test | Expected |
|---|------|----------|
| E-T1 | Click logout | localStorage cleared, redirect #login, page reload |
| E-T2 | Hover icon | Border hiện, bg error-container |
| E-T3 | Mobile | Icon vẫn hiện, nhỏ gọn |

---

## F. DASHBOARD: FIRE ANIMATION (PREMIUM)

### Yêu cầu

- Icon lửa trong vòng tròn lớn ở Dashboard hero
- **Desktop:** Animation chuyển màu tông lửa khi **hover**
- **Mobile:** Animation chạy **mặc định** (không cần hover)
- **Chỉ premium** — non-premium: icon đen tĩnh

### Hiện trạng

```tsx
// Dashboard.tsx ~line 155
<span className={`... ${isPremium ? 'streak-fire-premium' : 'text-black'}`}>local_fire_department</span>
```

CSS class `streak-fire-premium` đã tồn tại nhưng chưa có animation chuyển màu.

### Giải pháp

#### Bước F1: Thêm CSS animation

**File:** `frontend/src/index.scss`

```scss
/* Premium fire animation — color shift through flame tones */
@keyframes fire-color-shift {
  0%   { color: #ff6b35; filter: drop-shadow(0 0 6px rgba(255, 107, 53, 0.6)); }
  25%  { color: #ff4500; filter: drop-shadow(0 0 8px rgba(255, 69, 0, 0.7)); }
  50%  { color: #ffd700; filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.7)); }
  75%  { color: #ff8c00; filter: drop-shadow(0 0 8px rgba(255, 140, 0, 0.6)); }
  100% { color: #ff6b35; filter: drop-shadow(0 0 6px rgba(255, 107, 53, 0.6)); }
}

.streak-fire-premium {
  color: #ff6b35;
  transition: all 0.3s ease;
}

/* Desktop: animation chỉ khi hover vào vòng tròn cha */
@media (hover: hover) {
  .streak-ring-premium:hover .streak-fire-premium {
    animation: fire-color-shift 2s ease-in-out infinite;
  }
}

/* Mobile: animation chạy mặc định */
@media (hover: none) {
  .streak-fire-premium {
    animation: fire-color-shift 2s ease-in-out infinite;
  }
}
```

#### Bước F2: Ensure parent có class `streak-ring-premium`

Hiện tại đã có (Dashboard.tsx ~line 153):
```tsx
className={`... ${isPremium ? 'streak-ring-premium' : ''}`}
```

✅ Đã đúng.

### Test Cases

| # | Test | Expected |
|---|------|----------|
| F-T1 | Desktop, premium, hover vòng tròn | Fire icon chuyển màu: cam → đỏ → vàng → cam |
| F-T2 | Desktop, premium, không hover | Fire icon tĩnh màu cam #ff6b35 |
| F-T3 | Mobile, premium | Fire animation chạy mặc định |
| F-T4 | Non-premium, mọi platform | Icon đen tĩnh, không animation |
| F-T5 | Premium badge ★ hiện bên cạnh Day X | badge có `premium-galaxy-badge` class |

---

## G. LEADERBOARD #1 CROWN + PREMIUM AVATAR

### Yêu cầu

1. Người đứng đầu bảng xếp hạng có vương miện vàng 👑 trên avatar
2. Premium users có viền đặc biệt (purple ring)
3. Premium ★ badge bên cạnh tên
4. Crown xuất hiện cả trong Leaderboard + Profile nếu user đang #1

### Hiện trạng

**Backend leaderboard route** đã return `isPremium` và `avatarUrl`. ✅

**Frontend Leaderboard.tsx:**
- 👑 emoji đã có cho top 1 (~line 79) ✅
- `isPremium` ring có (~line 105) ✅
- ★ badge bên tên (~line 125) ✅

### Giải pháp — Nâng cấp thiết kế

#### Bước G1: Crown thiết kế đẹp hơn (CSS crown thay emoji)

Thay vì emoji 👑 → dùng icon SVG hoặc material icon `king` với hiệu ứng vàng:

```tsx
{isGold && (
  <div className="absolute -top-5 md:-top-7 left-1/2 -translate-x-1/2 z-20">
    <span className="material-symbols-outlined text-2xl md:text-3xl text-amber-400"
          style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 2px 4px rgba(255,175,0,0.5))' }}>
      kid_star
    </span>
  </div>
)}
```

#### Bước G2: Premium avatar trong Profile cũng có crown nếu user là #1

**File:** `frontend/src/pages/app/Profile.tsx`

Cần fetch leaderboard (hoặc thêm field `leaderboardRank` vào `/progress/summary`) để biết user có phải #1 không.

**Lựa chọn thiết kế:**
- **Option A:** Thêm `leaderboardRank` vào `/progress/summary` (1 query thêm)
- **Option B:** Frontend tự gọi `/leaderboard?limit=1` và so sánh userId

**Chọn Option A** — ít request hơn:

```javascript
// Backend: thêm vào /progress/summary
const topUser = await prisma.user.findFirst({
  orderBy: { totalXp: 'desc' },
  select: { id: true },
});
const isLeaderboardTop = topUser?.id === req.authUser.id;
```

Response thêm:
```json
{ "isLeaderboardTop": true }
```

#### Bước G3: Profile avatar treatment

```tsx
{/* Profile avatar wrapper */}
<div className="relative">
  {isLeaderboardTop && (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
      <span className="material-symbols-outlined text-xl text-amber-400"
            style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 1px 3px rgba(255,175,0,0.5))' }}>
        kid_star
      </span>
    </div>
  )}
  <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isPremium ? 'border-purple-400 ring-2 ring-purple-300 ring-offset-2' : 'border-black'}`}>
    {avatarUrl ? <img src={avatarUrl} ... /> : <InitialAvatar />}
  </div>
  {isPremium && (
    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-amber-900">★</div>
  )}
</div>
```

### Test Cases

| # | Test | Expected |
|---|------|----------|
| G-T1 | User #1 XP → Leaderboard page | Crown vàng trên avatar, podium golden glow |
| G-T2 | User #1 XP → Profile page | Crown vàng trên avatar |
| G-T3 | Premium user (không phải #1) → Leaderboard | Purple ring, ★ badge, KHÔNG crown |
| G-T4 | Non-premium user #1 (bằng XP) | Crown vàng CÓ, purple ring KHÔNG |
| G-T5 | User mất vị trí #1 → refresh | Crown biến mất |

---

## H. AVATAR HOẠT ĐỘNG ĐÚNG KHẮP HỆ THỐNG

### Vấn đề

Avatar save được qua Edit Profile, nhưng:
- Header avatar đọc từ `localStorage` (`storedUser?.avatarUrl`) → cần sync
- Profile page đọc từ API → OK
- Leaderboard đọc từ API → OK

### Giải pháp

#### Bước H1: Sau `PUT /profile` thành công → Sync localStorage

**File:** `frontend/src/pages/app/EditProfile.tsx` (~line 43)

```diff
  const res = await apiRequest<{ user: unknown; avatarTooLarge?: boolean }>('/profile', {
    method: 'PUT',
    body: { name, bio, nativeLanguage: nativeLang, avatarUrl: avatarPreview || '' }
  });
+ // Sync localStorage avatar so header updates immediately
+ try {
+   const raw = localStorage.getItem('stick_user');
+   if (raw) {
+     const stored = JSON.parse(raw);
+     stored.name = name;
+     stored.avatarUrl = avatarPreview || null;
+     localStorage.setItem('stick_user', JSON.stringify(stored));
+   }
+ } catch {}
```

#### Bước H2: Avatar compress đã đề cập ở mục C

### Test Cases

| # | Test | Expected |
|---|------|----------|
| H-T1 | Upload avatar → Save → quay về Home | Header avatar cập nhật ngay |
| H-T2 | Upload avatar → Save → Leaderboard | Avatar mới hiện |
| H-T3 | Xóa avatar → Save → Header | Hiện icon person mặc định |

---

## I. XP FARMING PREVENTION

### Hiện trạng đã fix

| Vector | Status |
|--------|--------|
| `POST /vocab/notebook` — dedup + 20/day cap | ✅ ĐÃ FIX |

### Cần fix

#### I-1: `POST /phrases` — No dedup, no cap

**File:** `backend/src/routes/apiV1.js` (~line 1786)

```diff
  router.post('/phrases', requireAuth, asyncHandler(async (req, res) => {
    const { phrase, meaning, example, journalId } = req.body || {};
    if (!phrase) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'phrase is required' });

+   // Dedup: check existing by user + phrase (case-insensitive)
+   const dupe = await prisma.savedPhrase.findFirst({
+     where: { userId: req.authUser.id, phrase: { equals: String(phrase).trim(), mode: 'insensitive' } },
+   });
+   if (dupe) {
+     return res.status(409).json({ code: 'DUPLICATE_PHRASE', message: 'Phrase already saved', item: dupe });
+   }
+
+   // Daily cap: max 15 phrases earn XP/day
+   const PHRASE_XP_CAP = 15;
+   const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
+   const todayCount = await prisma.savedPhrase.count({
+     where: { userId: req.authUser.id, createdAt: { gte: dayStart } },
+   });
+   const earnXp = todayCount < PHRASE_XP_CAP;

    const saved = await prisma.savedPhrase.create({ ... });

-   await trackDailyProgress(req.authUser.id, { xp: 2 });
-   awardXp(req.authUser.id, 2, 'phrase', { description: 'Saved a phrase' });
+   await trackDailyProgress(req.authUser.id, { xp: earnXp ? 2 : 0 });
+   if (earnXp) awardXp(req.authUser.id, 2, 'phrase', { description: 'Saved a phrase' });

-   res.status(201).json({ phrase: saved });
+   res.status(201).json({ phrase: saved, xpAwarded: earnXp ? 2 : 0 });
```

#### I-2: `POST /learning-sessions` — No daily cap

**File:** `backend/src/routes/apiV1.js` (~line 1561)

```diff
+ // Cap: 1 XP-earning session per type per day
+ const SESSION_PER_TYPE_LIMIT = 3; // 3 sessions per type per day
+ const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
+ const todayOfType = await prisma.learningSession.count({
+   where: { userId: req.authUser.id, type, createdAt: { gte: dayStart } },
+ });
+ const earnXp = todayOfType < SESSION_PER_TYPE_LIMIT;

  const xpMap = { grammar: 5, reading: 5, listening: 5, speaking: 5 };
  const xp = xpMap[type] || 0;
- if (xp > 0) {
-   await trackDailyProgress(req.authUser.id, { xp });
-   awardXp(req.authUser.id, xp, 'session', { description: `Practice: ${type}` });
- }
+ if (xp > 0 && earnXp) {
+   await trackDailyProgress(req.authUser.id, { xp });
+   awardXp(req.authUser.id, xp, 'session', { description: `Practice: ${type}` });
+ }
```

#### I-3: `POST /library/lessons/:id/complete` — Missing awardXp + re-completion

**File:** `backend/src/routes/apiV1.js` (~line 2363)

```diff
+ // Check if already completed (lesson completion should be idempotent)
+ const alreadyCompleted = await prisma.learningSession.findFirst({
+   where: { userId: req.authUser.id, contentId: req.params.id },
+ });
+ if (alreadyCompleted) {
+   return res.status(200).json({ session: alreadyCompleted, alreadyCompleted: true, xpAwarded: 0 });
+ }

  const session = await prisma.learningSession.create({ ... });

  // Update progress + ACTUALLY award XP to user
  await trackDailyProgress(req.authUser.id, { xp: 15 });
+ awardXp(req.authUser.id, 15, 'lesson', { description: `Completed lesson ${req.params.id}` });
```

#### I-4: Global daily XP safety net (optional)

Thêm vào `awardXp()`:

```diff
  async function awardXp(userId, amount, source, opts = {}) {
    if (!amount || amount <= 0) return;
+   // Global daily ceiling: 150 XP/day
+   const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
+   const todayXp = await prisma.userXpLog.aggregate({
+     where: { userId, createdAt: { gte: todayStart } },
+     _sum: { amount: true },
+   });
+   if ((todayXp._sum.amount || 0) >= 150) return; // silently skip
```

### Test Cases

| # | Test | Expected |
|---|------|----------|
| I-T1 | Thêm cùng 1 phrase 2 lần | Lần 2 → 409, 0 XP |
| I-T2 | Thêm 16 phrase/ngày | 15 phrase đầu +2 XP mỗi cái, phrase 16+ vẫn save nhưng 0 XP |
| I-T3 | Chơi grammar session 4 lần/ngày | 3 lần đầu +5 XP, lần 4: session tạo nhưng 0 XP |
| I-T4 | Complete lesson → resubmit | Lần 2 trả `alreadyCompleted: true`, 0 XP |
| I-T5 | Earn > 150 XP/ngày qua mọi nguồn | XP dừng tại 150, không tăng nữa |

---

## J. LIBRARY LEARNING LOGIC

### Vấn đề hiện tại

Library hiện tại:
1. Hiển thị danh sách `Lesson` từ API
2. User click → xem content → hoàn thành → +15 XP
3. **Không có bất kỳ kiểm tra nào** về việc user thực sự học
4. User có thể click "Complete" ngay lập tức → farm XP

### Giải pháp đề xuất (cho pilot)

#### Phase 1: Minimum viable anti-gaming (triển khai ngay)

1. **Lesson completion idempotency** (đã đề cập I-3) — mỗi lesson chỉ complete 1 lần. ✅
2. **Minimum time gate:** User phải ở trang lesson ít nhất `duration * 0.3` phút trước khi "Complete" được enable

```diff
// Frontend: LessonDetail.tsx
+ const [timeSpent, setTimeSpent] = useState(0);
+ const MIN_TIME = Math.max(30, lesson.duration * 60 * 0.3); // 30% of lesson duration, min 30s
+ useEffect(() => {
+   const timer = setInterval(() => setTimeSpent(t => t + 1), 1000);
+   return () => clearInterval(timer);
+ }, []);
+ const canComplete = timeSpent >= MIN_TIME;
```

3. **Quiz gate (optional cho phase 2):** Sau khi đọc lesson, phải trả lời đúng ≥2/3 câu quiz đơn giản trước khi nhận XP

#### Phase 2: Learning validation (sau pilot nếu metrics chứng minh cần)

1. **Inline quizzes:** Mỗi lesson có 3-5 câu hỏi trắc nghiệm/điền từ
2. **Score-based XP:** XP = `Math.round(score / 100 * 15)` thay vì flat 15
3. **Spaced repetition for lessons:** Lesson review sau 3 ngày, 7 ngày, 14 ngày — review cho ít XP hơn
4. **Content hash verification:** Backend track hash of quiz answers để đảm bảo người dùng thực sự trả lời

#### Phase 3: Advanced (không thuộc pilot)

- Lesson dependency tree
- Mastery-based progression
- Personalized content by level

### Kiến trúc đề nghị cho Phase 1

```
User → LessonDetail → [Read] → Timer ≥ 30s → [Complete button enable]
                                                     ↓
                                              POST /library/lessons/:id/complete
                                                     ↓
                                              Backend: check idempotency
                                              → Not completed: create session + 15 XP ✅
                                              → Already completed: return 200 + 0 XP ✅
```

### Backend changes cho Phase 1

```javascript
// POST /library/lessons/:id/complete — thêm timeSpent validation
const { timeSpent } = req.body || {};

// Must spend minimum 30 seconds
if (!timeSpent || timeSpent < 30) {
  return res.status(400).json({
    code: 'TOO_FAST',
    message: 'Please spend more time reading the lesson',
  });
}
```

### Test Cases

| # | Test | Expected |
|---|------|----------|
| J-T1 | Mở lesson → bấm Complete ngay | Button disabled (chưa đủ time) |
| J-T2 | Mở lesson → đợi 30s+ → Complete | OK, +15 XP |
| J-T3 | Complete lesson lần 2 | `alreadyCompleted: true`, 0 XP |
| J-T4 | Gửi `timeSpent: 5` bằng API trực tiếp | 400 TOO_FAST |
| J-T5 | Gửi `timeSpent: 60` bằng API (fake) | Accepted (chấp nhận — Phase 2 mới chặn bằng quiz) |

---

## THỨ TỰ TRIỂN KHAI

```
1. A — Premium Sync (Backend + Frontend)     ~30 min
   ↓
2. B — Admin Stats timezone fix              ~15 min
   ↓
3. C — Profile Save (schema + compress)      ~20 min
   ↓
4. D — Day Number (verify + debug log)       ~10 min
   ↓ ──── Deploy backend, test A+B+C+D ────
   ↓
5. E — Header Logout Icon                    ~10 min
   ↓
6. F — Fire Animation CSS                    ~15 min
   ↓
7. G — Leaderboard Crown + Profile           ~30 min
   ↓
8. H — Avatar sync                           ~15 min
   ↓ ──── Deploy frontend, test E+F+G+H ────
   ↓
9. I — XP Farming (phrases + sessions + lessons)  ~40 min
   ↓ ──── Deploy backend, test I ────
   ↓
10. J — Library logic Phase 1                 ~30 min
    ↓ ──── Deploy full, regression test ────
```

---

## REGRESSION CHECKLIST (sau mỗi deploy)

| # | Check | How |
|---|-------|-----|
| R1 | Home load, Day X đúng | Mở app, check dayNumber |
| R2 | Premium badge hiện nếu user là premium | Admin bật → user refresh |
| R3 | Streak fire animation (premium + desktop hover) | Hover vòng tròn |
| R4 | Logout button hoạt động | Click → redirect login |
| R5 | Admin set XP/Streak không crash | Admin panel → Edit Stats → Apply |
| R6 | Avatar save + hiện đúng khắp nơi | Edit Profile → save → check header + leaderboard |
| R7 | Vocab dedup chặn đúng | Thêm cùng 1 từ 2 lần → 409 lần 2 |
| R8 | Phrase dedup chặn đúng | Tương tự vocab |
| R9 | Session XP cap hoạt động | 4 grammar session → lần 4 = 0 XP |
| R10 | Lesson complete idempotent | Complete lesson 2 lần → lần 2 = 0 XP |
| R11 | Leaderboard #1 crown hiện | User XP cao nhất → 👑 |
| R12 | Premium ring trên avatar | Premium user → purple border |
| R13 | Core loop vẫn smooth | Journal → Feedback → Completion → streak update |
| R14 | Library → Vocab shortcut hoạt động | Click → navigate #vocab-notebook |

---

## NOTES

### Về production safety
- Mọi schema change cần backup DB trước
- `ALTER TABLE` trên User table có thể lock nếu bảng lớn (nhưng pilot = ít user → OK)
- Backend deploy = restart PM2, downtime ~5s

### Về core loop impact
- **Premium sync** trực tiếp ảnh hưởng perceived value → P0
- **XP farming** phá integrity metrics → P0
- **Fire animation + crown** tăng emotional reward → reinforces return hành vi
- **Library logic** chưa critical vì pilot user ít, nhưng cần fix trước khi scale

### Scope guard
- Không thêm gamification phức tạp (badge system, lesson tree, social)
- Crown chỉ là visual indicator, không có reward riêng
- XP caps đặt cao đủ để user thường không bao giờ chạm (chỉ chặn abuse)

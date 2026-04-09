# STICK — Premium Galaxy Luxury Screen-by-Screen Spec (09/04/2026)

> Tài liệu này là phần tiếp theo của `Premium_Galaxy_Luxury_UI_UX_Tech_Spec.md`.
> Mục tiêu của tài liệu này là mô tả chi tiết từng màn Premium hoặc từng surface Premium quan trọng theo format đủ rõ để Product, Design, Frontend và QA có thể cùng dùng làm blueprint triển khai.

---

## MỤC LỤC

1. [Phạm vi tài liệu](#1-phạm-vi-tài-liệu)
2. [Legend và state model](#2-legend-và-state-model)
3. [Layout grammar chung](#3-layout-grammar-chung)
4. [Danh sách màn và surface](#4-danh-sách-màn-và-surface)
5. [P01 — Landing Pricing Hero](#5-p01--landing-pricing-hero)
6. [P02 — Dashboard Membership Module](#6-p02--dashboard-membership-module)
7. [P03 — Daily Limit Upgrade Sheet](#7-p03--daily-limit-upgrade-sheet)
8. [P04 — Feedback Result Premium Delta](#8-p04--feedback-result-premium-delta)
9. [P05 — Completion Streak Protection Card](#9-p05--completion-streak-protection-card)
10. [P06 — Progress Weekly Reflection Surface](#10-p06--progress-weekly-reflection-surface)
11. [P07 — Profile Membership Hub](#11-p07--profile-membership-hub)
12. [P08 — Settings Billing Surface](#12-p08--settings-billing-surface)
13. [P09 — Full Premium Plans Screen](#13-p09--full-premium-plans-screen)
14. [P10 — Purchase Success Screen](#14-p10--purchase-success-screen)
15. [P11 — Expired / Grace / Winback Screen](#15-p11--expired--grace--winback-screen)
16. [CTA copy bank](#16-cta-copy-bank)
17. [Per-screen event mapping](#17-per-screen-event-mapping)
18. [Ưu tiên triển khai](#18-ưu-tiên-triển-khai)

---

## 1. PHẠM VI TÀI LIỆU

Tài liệu này chỉ tập trung vào các màn và surface liên quan trực tiếp đến:

- bán Premium;
- làm Premium trông đáng tiền hơn;
- giải thích rõ quyền lợi trả phí;
- tăng conversion nhưng không phá core loop.

Không đi sâu vào mọi màn học trong app. Những màn như journal, review, lesson detail, library content vẫn được tham chiếu nếu có liên quan đến premium surface, nhưng không phải trọng tâm của tài liệu này.

---

## 2. LEGEND VÀ STATE MODEL

## 2.1 User / membership states

Trong toàn bộ spec, các state sau sẽ được dùng thống nhất:

| Mã | State | Diễn giải |
|---|---|---|
| `G` | Guest | Chưa đăng ký tài khoản thật |
| `F0` | Free fresh | User free, chưa hoàn thành bài hôm nay |
| `F1` | Free used daily quota | User free, đã hoàn thành 1 bài hôm nay |
| `T` | Trial | User đang trong trial hoặc premium pass |
| `P` | Premium active | User đang có premium hợp lệ |
| `GR` | Grace | Premium vừa hết nhưng còn thời gian gia hạn mềm |
| `EX` | Expired | Premium đã hết rõ ràng |
| `C` | Comped | Premium do admin grant hoặc special access |

## 2.2 Surface types

| Type | Giải thích |
|---|---|
| `Screen` | Màn full route, có thể mở riêng |
| `Section` | Một section nằm trong màn hiện có |
| `Card` | Một module nằm trong bố cục lớn |
| `Sheet` | Bottom sheet hoặc modal contextual |
| `Flow state` | Trạng thái màn sau purchase, expired hoặc renew |

## 2.3 Current vs Proposed

| Tag | Ý nghĩa |
|---|---|
| `Current` | Màn hoặc file đã có trong codebase |
| `Proposed` | Màn hoặc route nên thêm mới |
| `Current+Upgrade` | Màn đã có nhưng cần nâng cấp theo spec |

---

## 3. LAYOUT GRAMMAR CHUNG

## 3.1 Premium layout formula

Hầu hết surface Premium nên tuân theo 5 lớp sau:

1. `Signal` — eyebrow, badge, seal, status chip
2. `Promise` — headline nói về outcome
3. `Proof` — metric, preview, usage, comparison hoặc unlocked value
4. `Offer` — price, plan, benefit mapping
5. `Action` — CTA chính, CTA phụ, dismiss hoặc continue free

## 3.2 Mobile rule

- mọi premium surface phải collapse gọn xuống single-column;
- headline tối đa 2 đến 3 dòng trên mobile;
- CTA chính phải full-width;
- nếu có nhiều plan card, mobile dùng stack dọc chứ không ép ngang;
- bottom sheet được ưu tiên hơn modal full center trên mobile.

## 3.3 Premium object rule

Mỗi màn Premium nên có 1 `hero object` duy nhất, ví dụ:

- plan card lớn;
- membership orb;
- streak protection shield;
- deep coach preview card;
- reflection instrument panel.

Không dùng quá 1 hero object chính trên cùng một surface.

## 3.4 CTA hierarchy rule

Mỗi surface chỉ có tối đa:

- 1 CTA chính;
- 1 CTA phụ;
- 1 dismiss hoặc continue free.

Không để user đứng trước 4 đến 5 nút tương đương nhau.

---

## 4. DANH SÁCH MÀN VÀ SURFACE

| ID | Tên | Type | Route / Trigger | Current status | Current file / target file |
|---|---|---|---|---|---|
| `P01` | Landing Pricing Hero | Section | Landing page `#landing` | Current+Upgrade | `frontend/src/pages/landing/components/PricingSection.tsx` |
| `P02` | Dashboard Membership Module | Card | `#dashboard` / `#app` | Current+Upgrade | `frontend/src/pages/app/Dashboard.tsx` |
| `P03` | Daily Limit Upgrade Sheet | Sheet | Khi free user muốn viết thêm sau quota | Proposed | `Dashboard.tsx` + `JournalWorkspace.tsx` + overlay component mới |
| `P04` | Feedback Result Premium Delta | Card / Section | `#feedback-result?journalId=...` | Current+Upgrade | `frontend/src/pages/app/FeedbackResult.tsx` |
| `P05` | Completion Streak Protection | Card / Section | `#completion?journalId=...` | Current+Upgrade | `frontend/src/pages/app/Completion.tsx` |
| `P06` | Progress Weekly Reflection | Card / Section | `#progress` | Current+Upgrade | `frontend/src/pages/app/Progress.tsx` |
| `P07` | Profile Membership Hub | Section | `#profile` | Current+Upgrade | `frontend/src/pages/app/Profile.tsx` |
| `P08` | Settings Billing Surface | Section | `#settings` | Current+Upgrade | `frontend/src/pages/app/Settings.tsx` |
| `P09` | Full Premium Plans Screen | Screen | Proposed `#premium` | Proposed | `frontend/src/pages/app/PremiumPlans.tsx` |
| `P10` | Purchase Success Screen | Flow state / Screen | Proposed `#premium-success` | Proposed | `frontend/src/pages/app/PremiumSuccess.tsx` |
| `P11` | Expired / Grace / Winback | Flow state / Screen | Proposed `#premium-renew` hoặc trong profile | Proposed | `frontend/src/pages/app/PremiumRenew.tsx` |

---

## 5. P01 — LANDING PRICING HERO

### 5.1 Mục tiêu màn

- tạo ấn tượng đầu tiên rằng Premium là một product object đáng tiền;
- giải thích sự khác biệt free và premium bằng kết quả nhận được chứ không chỉ list feature;
- dẫn guest hoặc free user vào flow premium mà không làm họ thấy app đang bán hàng quá gắt.

### 5.2 Route / mapping

- Route context: Landing page
- Current file: `frontend/src/pages/landing/components/PricingSection.tsx`
- Type: `Section`
- Status: `Current+Upgrade`

### 5.3 Layout spec

#### Desktop

```text
-------------------------------------------------------------
| Eyebrow + title + positioning copy                         |
|-----------------------------------------------------------|
| Left narrative column   | Right premium object column     |
| - Value thesis          | - Free card (compressed)        |
| - 4 benefit pillars     | - Premium hero card (dominant)  |
| - Trust line            | - Monthly / yearly switch       |
|                         | - CTA row                       |
-------------------------------------------------------------
```

#### Mobile

```text
Title
Short positioning copy
Premium hero card
Free comparison strip
Benefits list
Plan switch
CTA primary
Trust row
```

### 5.4 Content blocks

1. `Eyebrow`
   - nội dung: beta pricing hoặc founding pricing
   - tone: nhỏ, sắc, technical-luxury

2. `Headline`
   - nói về habit acceleration, không nói về luxury chung chung
   - ví dụ hướng: Viết nhiều hơn khi cảm hứng đang tới. Được coach sâu hơn ngay trên chính suy nghĩ của bạn.

3. `Benefit pillars`
   - Viết thêm 2 bài hôm nay
   - Deep coach cho meaning gap
   - Giữ streak bằng streak freeze
   - Reflection để thấy mình đang tiến bộ ở đâu

4. `Plan object`
   - premium plan card là hero object
   - free card chỉ đóng vai benchmark

5. `Trust row`
   - kích hoạt ngay
   - hủy bất kỳ lúc nào
   - giữ nguyên dữ liệu học tập

### 5.5 State matrix

| State | Hiển thị chính | CTA chính | CTA phụ |
|---|---|---|---|
| `G` | Premium hero card đầy đủ | Bắt đầu Premium | Dùng miễn phí trước |
| `F0` | Premium hero + free benchmark | Mở Premium cho hành trình của bạn | Viết bài đầu tiên trước |
| `F1` | Premium hero nhấn thêm lượt viết | Mở thêm 2 lượt viết hôm nay | Tiếp tục với free |
| `T` | Hiển thị đang dùng trial | Vào Dashboard | Xem quyền lợi trial |
| `P` | Hiển thị trạng thái active | Vào Dashboard | Quản lý gói |
| `EX` | Hiển thị renew framing | Kích hoạt lại Premium | Dùng free tiếp |

### 5.6 CTA matrix

| Situation | Primary CTA | Secondary CTA | Notes |
|---|---|---|---|
| Guest first visit | Bắt đầu Premium | Khám phá miễn phí | Secondary không được nhỏ quá mức |
| Logged-in free | Mở Premium hôm nay | Vào Dashboard | Dùng khi user đã có account |
| Expired | Kích hoạt lại Premium | Xem tôi sẽ giữ gì khi quay về free | Dùng cho winback mềm |

### 5.7 Motion / visual notes

- premium card có ambient aurora nhẹ;
- monthly/yearly toggle dùng slide indicator dạng instrument;
- CTA chính có metallic sweep rất nhẹ;
- free card không được đẹp ngang premium card.

### 5.8 Acceptance

- premium card là dominant object rõ ràng;
- headline nói outcome rõ hơn giá;
- user vẫn hiểu free có thể bắt đầu được;
- mobile không bị quá nặng hoặc lóa.

---

## 6. P02 — DASHBOARD MEMBERSHIP MODULE

### 6.1 Mục tiêu màn

- biến dashboard thành nơi người dùng cảm nhận được status membership và giá trị sử dụng hằng ngày;
- tạo upsell đúng ngữ cảnh khi free user đã dùng hết quota hoặc đang có habit signal tốt.

### 6.2 Route / mapping

- Route: `#dashboard` / `#app`
- Current file: `frontend/src/pages/app/Dashboard.tsx`
- Type: `Card`
- Status: `Current+Upgrade`

### 6.3 Layout spec

#### Vị trí ưu tiên

Module membership nên nằm trong bento grid đầu màn, không nằm cao hơn hero task chính nhưng cũng không trôi xuống cuối trang.

#### Desktop

```text
Hero task row

Grid row 1:
[Stats overview 8 cols] [Membership module 4 cols]

Hoặc
[Membership module 5 cols] [Progress / speaking / stats 7 cols]
```

#### Mobile

Membership module đứng ngay sau hero task.

### 6.4 Content blocks

1. `Membership seal`
   - badge nhỏ hoặc orb nhỏ nói Premium / Free / Trial / Renew

2. `Today status`
   - entries used today / entries remaining
   - streak freeze available
   - deep coach availability

3. `Value summary`
   - free: Bạn đã dùng 1/1 bài hôm nay
   - premium: Bạn còn 2 lượt viết hôm nay

4. `Action rail`
   - CTA theo state

### 6.5 State matrix

| State | Nội dung chính | CTA chính |
|---|---|---|
| `F0` | Bạn đang ở Free. Hôm nay còn 1 bài để viết. | Viết bài hôm nay |
| `F1` | Bạn đã hoàn thành bài đầu. Premium mở thêm 2 lượt viết nữa. | Mở thêm lượt viết hôm nay |
| `T` | Trial active. Còn X ngày để dùng deep coach. | Dùng quyền lợi Premium |
| `P` | Premium active. Còn 2 lượt viết hôm nay. | Viết thêm ngay |
| `GR` | Premium sắp hết. Đừng để coach sâu và streak protection bị gián đoạn. | Gia hạn Premium |
| `EX` | Bạn đang ở Free sau khi Premium hết hạn. | Kích hoạt lại Premium |

### 6.6 CTA matrix

| State | Primary CTA | Secondary CTA |
|---|---|---|
| `F1` | Mở thêm 2 lượt viết | Xem Premium có gì |
| `P` | Viết thêm ngay | Xem quyền lợi đã mở |
| `GR` | Gia hạn để giữ nhịp | Để sau |
| `EX` | Kích hoạt lại Premium | Dùng free hôm nay |

### 6.7 Motion / visual notes

- module dùng premium accent mạnh hơn card thường;
- meter quota có glow viền mảnh;
- nếu `P`, object phản chiếu nhẹ theo hover;
- nếu `F1`, surface chuyển sang state có urgency nhẹ, không đỏ cảnh báo.

### 6.8 Acceptance

- free user nhìn vào hiểu ngay quota và lợi ích nâng cấp;
- premium user nhìn vào thấy còn gì để dùng ngay hôm nay;
- module không lấn át CTA học chính.

---

## 7. P03 — DAILY LIMIT UPGRADE SHEET

### 7.1 Mục tiêu màn

- khi free user đã hoàn thành bài đầu và muốn viết tiếp, sheet phải làm họ thấy đây là lúc hợp lý để nâng cấp;
- tránh cảm giác bị chặn hoặc bị phạt.

### 7.2 Trigger / mapping

- Trigger hiện tại: free user bấm FAB hoặc muốn tạo thêm journal sau khi `todayCompleted = true`
- Current mapping: logic đang chặn thô trong `Dashboard.tsx`
- Type: `Sheet`
- Status: `Proposed`

### 7.3 Layout spec

#### Mobile

Bottom sheet chiếm khoảng 75% chiều cao màn.

```text
Drag handle
Momentum headline
Mini recap hôm nay
Benefit stack
Plan option summary
Primary CTA
Secondary CTA
Dismiss text
```

#### Desktop

Modal centered với width vừa phải, hero object ở nửa trên.

### 7.4 Content blocks

1. `Momentum headline`
   - Ví dụ hướng: Bạn đang có nhịp rất tốt. Đừng dừng lại ở bài đầu hôm nay.

2. `Today recap`
   - bài vừa hoàn thành
   - streak hiện tại
   - score hoặc feedback badge nếu có

3. `Benefit stack`
   - mở thêm 2 lượt viết hôm nay
   - nhận coach sâu hơn ở bài tiếp theo
   - giữ streak an toàn hơn

4. `Plan strip`
   - 1 plan nổi bật, 1 toggle nếu cần

### 7.5 State matrix

| State | Khi nào mở | Nội dung |
|---|---|---|
| `F1` | lần đầu chạm quota | soft momentum framing |
| `F1-repeat` | mở lại sau dismiss | ngắn hơn, trực tiếp hơn |
| `T` | không mở | trial không bị chặn bởi sheet này |
| `P` | không mở | premium không thấy sheet này |

### 7.6 CTA matrix

| Action type | Label đề xuất |
|---|---|
| Primary | Mở thêm 2 lượt viết hôm nay |
| Secondary | Xem Premium có gì |
| Dismiss | Để tôi quay lại vào ngày mai |

### 7.7 Motion / visual notes

- sheet mở với rise + blur background nhẹ;
- hero object là quota orb hoặc streak shield;
- primary CTA có pressure response rõ;
- dismiss không được ẩn hoặc quá khó bấm.

### 7.8 Acceptance

- user thấy đây là continuation of momentum;
- sheet không giống cảnh báo lỗi;
- dismiss xong quay về flow nhẹ nhàng;
- event surface rõ để đo conversion.

---

## 8. P04 — FEEDBACK RESULT PREMIUM DELTA

### 8.1 Mục tiêu màn

- biến feedback result thành surface bán deep coach mạnh nhất trong app;
- cho free user nhìn thấy premium delta gắn trực tiếp với bài viết của họ.

### 8.2 Route / mapping

- Route: `#feedback-result?journalId=...`
- Current file: `frontend/src/pages/app/FeedbackResult.tsx`
- Type: `Card / Section`
- Status: `Current+Upgrade`

### 8.3 Layout spec

#### Desktop

```text
Main feedback column
Right side premium delta rail

Hoặc
Main feedback blocks
Premium delta card giữa feedback body và completion CTA
```

#### Mobile

Premium delta card xuất hiện sau phần free feedback cốt lõi, trước CTA sang completion.

### 8.4 Content blocks

1. `Section label`
   - Coach sâu hơn cho bài viết này

2. `Delta preview`
   - 1 đến 2 insight premium bị blur hoặc mask một phần
   - hint về naturalness gap
   - hint về expression upgrade

3. `Why it matters`
   - nói rõ premium sẽ giúp câu nói giống người bản ngữ hơn ở điểm nào

4. `Action zone`
   - CTA mở deep coach
   - dismiss nhẹ

### 8.5 State matrix

| State | Surface behavior |
|---|---|
| `F0` / `F1` | Hiện delta preview có khóa mềm |
| `T` | Mở đầy đủ deep coach, thêm badge trial |
| `P` | Không còn preview; thay bằng deep coach block thật |
| `EX` | Hiện winback delta preview nếu phù hợp |

### 8.6 CTA matrix

| State | Primary CTA | Secondary CTA |
|---|---|---|
| `F*` | Mở coach sâu hơn cho bài này | Tiếp tục với kết quả hiện tại |
| `T` | Xem full coach | Đi tiếp tới completion |
| `P` | Xem full coach | Đi tiếp tới completion |
| `EX` | Kích hoạt lại coach sâu | Tiếp tục với free |

### 8.7 Motion / visual notes

- premium delta card có masked reveal, không dùng blur quá nặng;
- hover hoặc tap lên từng locked insight có thể tạo micro shimmer;
- CTA chính nằm sát card, không đẩy xuống quá xa.

### 8.8 Acceptance

- user hiểu premium khác free ở chiều sâu feedback chứ không chỉ số lượng bullet;
- preview không che hoặc làm rối feedback free;
- premium user thấy value thật ngay, không phải một label premium vô nghĩa.

---

## 9. P05 — COMPLETION STREAK PROTECTION CARD

### 9.1 Mục tiêu màn

- dùng completion như một khoảnh khắc cảm xúc để bán Premium qua streak protection và continuity.

### 9.2 Route / mapping

- Route: `#completion?journalId=...`
- Current file: `frontend/src/pages/app/Completion.tsx`
- Type: `Card / Section`
- Status: `Current+Upgrade`

### 9.3 Layout spec

Card này nên nằm giữa khối stats và action buttons, hoặc nằm như một module nổi sau stats nếu layout cho phép.

```text
Celebration hero
Stats row
Premium protection card
Mood selector
Primary navigation CTA
```

### 9.4 Content blocks

1. `Streak framing`
   - free user có streak: Đừng để chuỗi này mất chỉ vì một ngày bận.
   - free user chưa có streak: có thể đổi sang value khác, không ép protection.

2. `Protection explainer`
   - streak freeze hoạt động ra sao;
   - premium giúp bảo vệ habit, không chỉ cho thêm feature.

3. `Mini value stack`
   - streak protection
   - thêm lượt viết
   - deep coach

### 9.5 State matrix

| State | Hiển thị |
|---|---|
| `F0` / `F1` với streak >= 3 | protection card đầy đủ |
| `F*` với streak 0-2 | card nhẹ hơn, có thể ưu tiên deep coach hoặc more reps |
| `P` | card chuyển thành premium status / benefits available |
| `T` | card nói trial đang bảo vệ streak của bạn |

### 9.6 CTA matrix

| State | Primary CTA | Secondary CTA |
|---|---|---|
| `F* streak >= 3` | Bảo vệ streak của tôi | Xem chi tiết Premium |
| `F* streak < 3` | Mở Premium hôm nay | Để sau |
| `P` | Xem quyền lợi của tôi | Đi tới progress |
| `T` | Tiếp tục dùng trial | Xem membership |

### 9.7 Motion / visual notes

- card protection có shield object hoặc streak ring object;
- celebration background có thể đậm hơn khi premium active;
- không để protection card và mood selector cạnh tranh sự chú ý quá mạnh.

### 9.8 Acceptance

- completion vẫn là màn cảm thấy tiến bộ;
- upsell không phá cảm xúc vừa hoàn thành;
- protection message hợp với state của từng user.

---

## 10. P06 — PROGRESS WEEKLY REFLECTION SURFACE

### 10.1 Mục tiêu màn

- biến progress từ nơi xem số liệu sang nơi premium user cảm nhận được sự tiến bộ có chiều sâu;
- cho free user thấy họ đang thiếu lớp reflection nào.

### 10.2 Route / mapping

- Route: `#progress`
- Current file: `frontend/src/pages/app/Progress.tsx`
- Type: `Card / Section`
- Status: `Current+Upgrade`

### 10.3 Layout spec

Reflection surface nên đứng trên hoặc gần khu `Streak Stats`, không nên bị chìm xuống cuối trang.

#### Desktop

```text
Calendar / progress grid
--------------------------------------------------
| Weekly Reflection Card | Streak Stats / XP Card |
--------------------------------------------------
```

#### Mobile

Reflection card nằm ngay sau calendar và trước streak stats.

### 10.4 Content blocks

1. `Reflection header`
   - Tuần này bạn đang học gì nhiều nhất

2. `Insight modules`
   - expressions bạn đang lặp tốt
   - kiểu lỗi hoặc meaning gap hay gặp
   - nhịp duy trì streak

3. `Locked preview` cho free
   - blur 1 insight
   - hiện preview metric đủ tò mò, không đủ dùng hết.

### 10.5 State matrix

| State | Surface behavior |
|---|---|
| `F*` | locked preview + upgrade CTA |
| `T` | mở full, có trial label |
| `P` | reflection full + history |
| `EX` | preview reflection cũ + renew CTA |

### 10.6 CTA matrix

| State | Primary CTA |
|---|---|
| `F*` | Mở Weekly Reflection |
| `P` | Xem đầy đủ tuần này |
| `EX` | Kích hoạt lại Reflection |

### 10.7 Motion / visual notes

- insight cards có reveal stagger nhẹ;
- nếu locked, dùng mask edge light thay vì blur dày;
- numbers animate once on mount, không loop.

### 10.8 Acceptance

- progress screen vẫn đọc được nhanh;
- premium reflection tạo cảm giác tangible progress;
- free preview đủ hấp dẫn nhưng không cản usage hiện tại.

---

## 11. P07 — PROFILE MEMBERSHIP HUB

### 11.1 Mục tiêu màn

- tạo một nơi rõ ràng để user hiểu plan hiện tại, quyền lợi, usage và action tiếp theo;
- profile phải là nguồn sự thật về tình trạng membership.

### 11.2 Route / mapping

- Route: `#profile`
- Current file: `frontend/src/pages/app/Profile.tsx`
- Type: `Section`
- Status: `Current+Upgrade`

### 11.3 Layout spec

Membership hub nên nằm ngay dưới hero profile hoặc là một card lớn song song với hero profile.

#### Desktop

```text
Profile hero
--------------------------------------------------
| Membership Hub (8 cols) | Quick usage (4 cols)  |
--------------------------------------------------
```

#### Mobile

Profile hero
Membership hub
Quick usage
Navigation cards

### 11.4 Content blocks

1. `Status chip`
   - Free / Trial / Premium Active / Grace / Expired

2. `Plan summary`
   - tên plan;
   - billing cycle;
   - renew date hoặc end date;
   - premium since.

3. `This week value`
   - số lượt viết thêm đã dùng;
   - số deep coach mở;
   - streak freeze còn lại hoặc đã dùng.

4. `Benefits list`
   - list ngắn, đúng quyền lợi thật.

5. `Action rail`
   - manage, renew, upgrade, restore, cancel.

### 11.5 State matrix

| State | Hero line | Primary CTA | Secondary CTA |
|---|---|---|---|
| `G` | Tạo tài khoản để giữ tiến trình và mở Premium | Tạo tài khoản | Đăng nhập |
| `F0/F1` | Bạn đang ở Free | Mở Premium | Xem quyền lợi |
| `T` | Trial đang hoạt động | Xem quyền lợi trial | Quản lý plan |
| `P` | Premium đang hoạt động | Quản lý gói | Xem usage tuần này |
| `GR` | Gia hạn để không bị gián đoạn | Gia hạn Premium | Để sau |
| `EX` | Premium đã hết hạn | Kích hoạt lại | Dùng free tiếp |
| `C` | Premium được cấp đặc biệt | Xem quyền lợi | Liên hệ hỗ trợ |

### 11.6 Motion / visual notes

- membership hub là một premium surface lớn, visual mạnh hơn hero profile thường;
- status chip dùng instrument style;
- usage recap có thể có number roll-up một lần.

### 11.7 Acceptance

- user hiểu mình đang ở plan nào trong 2 giây;
- có action rõ ràng cho từng trạng thái;
- không phải vào settings mới biết plan.

---

## 12. P08 — SETTINGS BILLING SURFACE

### 12.1 Mục tiêu màn

- là nơi user thao tác quản lý gói, billing, renew, restore;
- tông visual nên chức năng hơn profile, nhưng vẫn có premium accent cho nhóm billing.

### 12.2 Route / mapping

- Route: `#settings`
- Current file: `frontend/src/pages/app/Settings.tsx`
- Type: `Section`
- Status: `Current+Upgrade`

### 12.3 Layout spec

Section billing nên đứng cao trong settings nếu user có premium hoặc đã từng premium.

```text
Settings sections
-------------------------------------------
| Account                                  |
| Notifications                            |
| Billing & Membership                     |
| Data / Language / Privacy                |
-------------------------------------------
```

### 12.4 Content blocks

1. `Billing summary`
2. `Current plan`
3. `Renewal / expiry info`
4. `Payment method` hoặc placeholder future contract
5. `Restore purchases`
6. `Cancel or manage subscription`

### 12.5 State matrix

| State | Nội dung |
|---|---|
| `F*` | giới thiệu mở Premium từ settings |
| `T` | trial details |
| `P` | billing details + manage |
| `GR` | urgent renew framing |
| `EX` | renew / restore / reactivate |

### 12.6 CTA matrix

| State | Primary CTA |
|---|---|
| `F*` | Xem các gói Premium |
| `P` | Quản lý subscription |
| `GR` | Gia hạn ngay |
| `EX` | Kích hoạt lại Premium |

### 12.7 Acceptance

- settings là nơi thao tác quản lý, không phải màn conversion đẹp nhất;
- thông tin billing rõ, không mơ hồ;
- phù hợp với billing thật khi bổ sung sau này.

---

## 13. P09 — FULL PREMIUM PLANS SCREEN

### 13.1 Mục tiêu màn

- là paywall full-screen chính thức của app;
- dùng khi user chọn “xem chi tiết gói” hoặc đi vào flow nâng cấp chủ động.

### 13.2 Route / mapping

- Proposed route: `#premium`
- Type: `Screen`
- Status: `Proposed`

### 13.3 Layout spec

#### Desktop

```text
-------------------------------------------------------------
| Left: narrative + value pillars + trust                    |
| Right: premium hero object + plan cards + sticky CTA       |
-------------------------------------------------------------
| Comparison strip                                            |
| FAQ short                                                   |
-------------------------------------------------------------
```

#### Mobile

```text
Premium hero object
Headline
Value pillars
Plan cards stacked
Trust row
CTA sticky bottom
```

### 13.4 Content blocks

1. `Opening statement`
2. `4 value pillars`
3. `Comparison strip free vs premium`
4. `Plan cards`
5. `Trust row`
6. `FAQ short`

### 13.5 State matrix

| State | Behavior |
|---|---|
| `G` | show account creation bridge nếu cần |
| `F*` | normal paywall |
| `T` | plan management / upgrade to annual |
| `P` | active membership summary, not sell heavy |
| `EX` | renew-optimized version |

### 13.6 CTA matrix

| State | Primary CTA | Secondary CTA |
|---|---|---|
| `G` | Tạo tài khoản và mở Premium | Xem free trước |
| `F*` | Bắt đầu Premium | Tiếp tục với free |
| `T` | Giữ Premium sau trial | Xem lại quyền lợi |
| `P` | Vào Membership Hub | Quản lý gói |
| `EX` | Kích hoạt lại Premium | Tiếp tục với free |

### 13.7 Motion / visual notes

- đây là màn cho phép galaxy luxury mạnh nhất;
- hero object có ambient light;
- sticky CTA không che plan details;
- plan selected state có response rõ.

### 13.8 Acceptance

- màn trông cao cấp rõ ràng;
- pricing và quyền lợi đọc nhanh;
- guest vẫn hiểu cách vào app free nếu chưa sẵn sàng mua.

---

## 14. P10 — PURCHASE SUCCESS SCREEN

### 14.1 Mục tiêu màn

- ngay sau purchase, user phải thấy giá trị đã mở được và hành động tiếp theo phải cực rõ;
- tránh success screen chỉ là “thanh toán thành công”.

### 14.2 Route / mapping

- Proposed route: `#premium-success`
- Type: `Screen`
- Status: `Proposed`

### 14.3 Layout spec

```text
Celebration seal
Success headline
Unlocked benefits now
Context-aware next action
Secondary actions
```

### 14.4 Content blocks

1. `Success seal`
   - premium activated

2. `Unlocked now`
   - thêm 2 lượt viết hôm nay
   - deep coach mở ngay
   - streak protection đang bật

3. `Context-aware CTA`
   - nếu user đến từ feedback: Xem coach sâu cho bài này
   - nếu đến từ daily limit: Viết tiếp ngay
   - nếu đến từ profile: Vào membership hub

### 14.5 State matrix

| Purchase type | CTA chính |
|---|---|
| Monthly | Bắt đầu dùng Premium ngay |
| Yearly | Mở toàn bộ hành trình Premium |
| Pass / Trial | Dùng trial ngay hôm nay |
| Comped | Xem quyền lợi đã được cấp |

### 14.6 CTA matrix

| Context source | Primary CTA | Secondary CTA |
|---|---|---|
| Feedback paywall | Xem coach sâu cho bài này | Đi tới completion |
| Daily limit sheet | Viết tiếp bài thứ hai | Xem membership |
| Profile / Plans | Vào Membership Hub | Về Dashboard |

### 14.7 Motion / visual notes

- celebration dùng light burst tinh tế, không confetti kiểu game;
- number of unlocked benefits có thể reveal sequentially;
- hero object fade out dần sau 1 đến 2 giây.

### 14.8 Acceptance

- user biết ngay bây giờ nên bấm gì;
- success screen nối lại đúng bối cảnh trước khi mua;
- không khiến user rơi vào dead-end.

---

## 15. P11 — EXPIRED / GRACE / WINBACK SCREEN

### 15.1 Mục tiêu màn

- xử lý trạng thái premium hết hạn một cách rõ ràng, không gây hụt hẫng;
- giúp user hiểu cái gì vẫn giữ được, cái gì bị pause, và vì sao nên quay lại.

### 15.2 Route / mapping

- Proposed route: `#premium-renew`
- Hoặc render trong profile/settings với state full-width
- Type: `Flow state / Screen`
- Status: `Proposed`

### 15.3 Layout spec

```text
State headline
What stays / what pauses split layout
Winback offer block
Renew CTA
Continue with free CTA
```

### 15.4 Content blocks

1. `State headline`
   - grace: Gia hạn để không bị gián đoạn
   - expired: Premium của bạn đã tạm dừng

2. `What stays`
   - dữ liệu cũ
   - progress history
   - notebook đã lưu

3. `What pauses`
   - deep coach
   - extra daily entries
   - streak protection
   - reflection surfaces

4. `Winback offer`
   - nếu có, dùng nhẹ nhàng, không screaming sale.

### 15.5 State matrix

| State | Tone | Primary CTA |
|---|---|---|
| `GR` | continuity / no disruption | Gia hạn Premium |
| `EX` | regain your rhythm | Kích hoạt lại Premium |

### 15.6 CTA matrix

| State | Primary CTA | Secondary CTA |
|---|---|---|
| `GR` | Gia hạn để không mất nhịp | Để sau |
| `EX` | Kích hoạt lại Premium | Tiếp tục với free |

### 15.7 Motion / visual notes

- visual vẫn premium nhưng giảm intensity so với plans screen;
- trạng thái grace có urgency nhẹ qua edge light ấm;
- expired state giảm light, tăng contrast ở renew CTA.

### 15.8 Acceptance

- user hiểu rõ cái gì mất, cái gì giữ;
- renew path rõ ràng;
- tiếp tục free vẫn dễ, không bị cảm giác hostage.

---

## 16. CTA COPY BANK

## 16.1 Nhóm CTA bán action tức thì

- Mở thêm 2 lượt viết hôm nay
- Viết tiếp ngay bây giờ
- Mở coach sâu hơn cho bài này
- Bảo vệ streak của tôi

## 16.2 Nhóm CTA bán membership tổng quát

- Mở Premium cho hành trình của bạn
- Xem các quyền lợi Premium
- Vào Membership Hub

## 16.3 Nhóm CTA renew / winback

- Kích hoạt lại Premium
- Gia hạn để không mất nhịp
- Tiếp tục hành trình với Premium

## 16.4 Nhóm CTA secondary / dismiss

- Tiếp tục với free
- Để sau
- Xem chi tiết trước
- Tôi sẽ quay lại vào ngày mai

---

## 17. PER-SCREEN EVENT MAPPING

| Screen ID | Impression event | CTA event | Success event |
|---|---|---|---|
| `P01` | `premium_impression` surface=`landing_pricing` | `premium_cta_click` | `checkout_started` |
| `P02` | `premium_impression` surface=`dashboard_membership` | `premium_cta_click` | `checkout_started` |
| `P03` | `paywall_view` surface=`daily_limit_sheet` | `premium_cta_click` | `purchase_completed` |
| `P04` | `premium_impression` surface=`feedback_result` | `premium_cta_click` | `premium_benefit_used` |
| `P05` | `premium_impression` surface=`completion_card` | `premium_cta_click` | `checkout_started` |
| `P06` | `premium_impression` surface=`progress_reflection` | `premium_cta_click` | `premium_benefit_used` |
| `P07` | `premium_impression` surface=`profile_membership` | `premium_cta_click` | `checkout_started` |
| `P08` | `premium_impression` surface=`settings_billing` | `premium_cta_click` | `subscription_canceled` or `restore_started` |
| `P09` | `paywall_view` surface=`full_plans` | `plan_selected` | `checkout_started` |
| `P10` | `premium_impression` surface=`purchase_success` | `premium_cta_click` | `premium_benefit_used` |
| `P11` | `premium_impression` surface=`winback` | `premium_cta_click` | `purchase_completed` |

---

## 18. ƯU TIÊN TRIỂN KHAI

## 18.1 P0 — Phải làm trước

- `P01` Landing Pricing Hero
- `P02` Dashboard Membership Module
- `P03` Daily Limit Upgrade Sheet
- `P04` Feedback Result Premium Delta
- `P05` Completion Streak Protection Card
- `P07` Profile Membership Hub

Đây là nhóm surface có tác động conversion trực tiếp nhất.

## 18.2 P1 — Làm sau khi P0 ổn

- `P06` Progress Weekly Reflection Surface
- `P08` Settings Billing Surface
- `P09` Full Premium Plans Screen

## 18.3 P2 — Đi cùng billing lifecycle

- `P10` Purchase Success Screen
- `P11` Expired / Grace / Winback Screen

---

## KẾT LUẬN

Nếu tài liệu trước chốt triết lý và hệ design tổng thể, thì tài liệu này chốt cách từng màn Premium phải hoạt động thật sự trong app.

Nguyên tắc không đổi:

- Premium phải thấy đáng tiền ngay ở từng ngữ cảnh;
- mỗi màn phải có một lời hứa rõ ràng, một object rõ ràng, một CTA rõ ràng;
- galaxy luxury phải làm tăng perceived value, không được làm rối hành vi;
- screen nào cũng phải map được sang state model và event model rõ ràng.

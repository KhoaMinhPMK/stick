# STICK — Premium Galaxy Luxury UI/UX Technical Spec (09/04/2026)

> Tài liệu này chốt hướng thiết kế và triển khai UI/UX cho Premium theo tinh thần galaxy luxury như định hướng mới của sản phẩm.
> Mục tiêu không phải làm toàn bộ STICK thành một app sci-fi, mà là dùng ngôn ngữ visual sang, cinematic và có motion để tăng perceived value của Premium, tăng conversion, và vẫn không phá core loop Write -> AI Feedback -> Review -> Complete -> Return.

---

## MỤC LỤC

1. [Mục tiêu tài liệu](#1-mục-tiêu-tài-liệu)
2. [Tuyên bố định hướng](#2-tuyên-bố-định-hướng)
3. [Nguyên tắc sản phẩm bắt buộc](#3-nguyên-tắc-sản-phẩm-bắt-buộc)
4. [Galaxy Luxury Design System](#4-galaxy-luxury-design-system)
5. [Motion System](#5-motion-system)
6. [Phân tầng visual trong app](#6-phân-tầng-visual-trong-app)
7. [Premium Value Architecture](#7-premium-value-architecture)
8. [Screen Inventory chi tiết](#8-screen-inventory-chi-tiết)
9. [Paywall và conversion funnel](#9-paywall-và-conversion-funnel)
10. [Pricing, offer và packaging](#10-pricing-offer-và-packaging)
11. [Analytics và experiment plan](#11-analytics-và-experiment-plan)
12. [Technical architecture định hướng cho frontend](#12-technical-architecture-định-hướng-cho-frontend)
13. [Performance, accessibility, QA guardrails](#13-performance-accessibility-qa-guardrails)
14. [Roadmap triển khai](#14-roadmap-triển-khai)
15. [UAT và acceptance criteria](#15-uat-và-acceptance-criteria)
16. [Decision matrix khi review design](#16-decision-matrix-khi-review-design)

---

## 1. MỤC TIÊU TÀI LIỆU

Tài liệu này dùng để:

- chốt art direction Premium theo hướng galaxy luxury thay vì visual premium nhẹ nhàng;
- định nghĩa rõ chỗ nào trong app được phép sang trọng, chỗ nào phải giữ tốc độ và tập trung;
- chuẩn hóa motion, token, component, paywall surface, event tracking, acceptance criteria;
- giúp Product, Design, Frontend, QA và Ops có chung một nguồn sự thật trước khi triển khai.

Tài liệu này chưa đi vào code implementation chi tiết. Đây là spec kỹ thuật cấp sản phẩm + frontend architecture để triển khai an toàn ở bước sau.

---

## 2. TUYÊN BỐ ĐỊNH HƯỚNG

### 2.1 Kết luận chiến lược

STICK sẽ không đi theo hướng "toàn bộ app tối, bóng, sci-fi".
STICK sẽ đi theo hướng:

**Core learning calm + Premium galaxy luxury accent**

Nghĩa là:

- phần học chính vẫn phải rõ, nhanh, dễ viết, dễ đọc;
- phần Premium được nâng thành một lớp visual sang hơn, cinematic hơn, có motion hơn;
- các khoảnh khắc bán giá trị, ăn mừng tiến bộ, và thể hiện membership sẽ dùng galaxy luxury mạnh tay hơn;
- không để visual lấn át khả năng hoàn thành task hằng ngày.

### 2.2 Tuyên bố cảm giác thiết kế

Premium của STICK phải tạo cảm giác:

- sang thật, không rẻ tiền;
- giàu chiều sâu và có ánh sáng như một vật thể cao cấp;
- có chuyển động tinh vi, không ồn ào;
- khác biệt rõ với free plan ngay từ cảm nhận đầu tiên;
- khiến người dùng cảm thấy "nếu dùng gói này, mình đang nghiêm túc đầu tư cho thói quen của mình".

### 2.3 Điều không được làm

Không biến app thành:

- landing page sci-fi trá hình;
- dashboard khoe hiệu ứng;
- app AI neon tím phổ thông;
- môi trường đọc khó, chói, hoặc nặng GPU;
- paywall spam mọi nơi.

---

## 3. NGUYÊN TẮC SẢN PHẨM BẮT BUỘC

Mọi quyết định UI/UX liên quan Premium vẫn phải bám 5 luật sau:

### 3.1 Core loop là ưu tiên số 1

Premium phải hỗ trợ và tăng giá trị cho loop:

Write -> AI Feedback -> Review -> Shadowing/Speaking -> Complete -> Return next day

Không được có bất kỳ hiệu ứng hoặc paywall nào làm tăng ma sát trước bước viết đầu tiên.

### 3.2 Premium bán kết quả, không bán decoration

Premium chỉ đáng tiền nếu user cảm thấy:

- viết được nhiều hơn khi đang có cảm hứng;
- nhận feedback sâu hơn, đúng chỗ bí hơn;
- giữ streak tốt hơn;
- nhìn thấy tiến bộ rõ hơn.

Badge, glow, ring, animation chỉ là lớp tăng perceived value, không phải core value.

### 3.3 Free vẫn phải hoàn chỉnh

Free plan vẫn phải cho phép người mới hoàn thành trọn vòng học hằng ngày.
Nếu free bị bóp quá mạnh, conversion sẽ giảm vì user chưa kịp tin vào giá trị sản phẩm.

### 3.4 Luxury phải có kiểm soát

Luxury chỉ được dùng mạnh ở nơi tạo doanh thu hoặc reinforcement cảm xúc:

- pricing;
- paywall;
- completion celebration;
- dashboard membership card;
- profile membership section;
- premium preview trong feedback.

Luxury không được làm khó các màn cần đọc, nhập text, hoặc ra quyết định nhanh.

### 3.5 Mọi thay đổi phải đo được

Mọi surface premium đều phải có tracking rõ để trả lời:

- user thấy nó ở đâu;
- có click không;
- có start checkout không;
- có mua không;
- mua xong có dùng quyền lợi không.

---

## 4. GALAXY LUXURY DESIGN SYSTEM

## 4.1 Visual thesis

Galaxy luxury của STICK không đi theo hướng neon cyberpunk.
Nó phải giống một vật phẩm cao cấp lấy cảm hứng từ bầu trời đêm, kính tối, kim loại ấm và ánh sáng vũ trụ rất tinh tế.

### 4.1.1 Từ khóa art direction

- obsidian
- cosmic champagne
- deep navy
- brushed metal
- stardust grain
- aurora edge light
- cinematic depth
- premium instrument panel

### 4.1.2 Từ khóa bị cấm

- AI purple default
- gradient tím xanh phát quang khắp nơi
- glassmorphism mờ đục toàn màn hình
- glow chói xung quanh text
- card đen với border xám generic

## 4.2 Màu sắc

### 4.2.1 Core premium palette

```text
Premium Base 01: #07090F   // obsidian blue-black
Premium Base 02: #0D1320   // deep space navy
Premium Surface 01: #121826
Premium Surface 02: #172033
Premium Edge Light: #7EA6FF
Premium Aurora 01: #5E7CFA
Premium Aurora 02: #1E335A
Premium Gold 01: #D6B36A
Premium Gold 02: #F0D9A1
Premium Pearl: #F6F1E8
Premium Mist: rgba(255,255,255,0.08)
Premium Hairline: rgba(255,255,255,0.12)
Premium Shadow: rgba(3,7,18,0.45)
```

### 4.2.2 Nguyên tắc dùng màu

- nền premium ưu tiên dark-luxury, nhưng chỉ áp dụng cục bộ ở card, section, modal, membership surface;
- accent ấm chính là champagne gold;
- accent lạnh phụ là aurora blue;
- text trên nền premium dùng pearl thay vì trắng tuyệt đối;
- không dùng quá 2 nguồn sáng màu trong cùng một component;
- không dùng gradient rainbow.

## 4.3 Nền, texture và depth

### 4.3.1 Background stack cho surface premium

Một premium surface chuẩn gồm 4 lớp:

1. nền base tối;
2. radial glow lệch tâm rất nhẹ;
3. inner highlight hoặc edge light mảnh;
4. dust/noise layer opacity thấp.

### 4.3.2 Texture rules

- noise chỉ nên rất nhẹ, từ 0.02 đến 0.05 opacity;
- không dùng pattern sao dày đặc như wallpaper;
- star field nếu có chỉ mang tính gợi ý, không được chi phối layout;
- spotlight phải lệch tâm để tạo chiều sâu, không đặt giữa card theo kiểu mặc định.

## 4.4 Border, radius, shadow

### 4.4.1 Border

- ưu tiên hairline sáng mảnh trên nền tối;
- border ngoài và border trong nên khác vai trò;
- outer shell dùng viền mờ;
- inner core dùng viền sáng cực nhẹ hoặc inset highlight.

### 4.4.2 Radius

- surface premium dùng radius lớn, khoảng 24px đến 32px;
- badge, chip và CTA là rounded-full;
- modal và paywall hero có thể dùng radius lớn hơn bình thường để tăng cảm giác object.

### 4.4.3 Shadow

- shadow phải sâu và mềm;
- không dùng shadow đen nặng kiểu material cũ;
- ưu tiên layered shadow: ambient + directional;
- card premium có thể có inner glow rất nhỏ ở mép trên.

## 4.5 Typography

### 4.5.1 Định hướng

Typography của STICK Premium phải sang hơn nhưng không được khó đọc.
App học vẫn là software UI, nên không dùng serif quá đậm cho các màn chức năng.

### 4.5.2 Hướng dùng

- headline premium: sans display sắc nét, tracking chặt, weight cao;
- body text: sạch, rõ, contrast cao;
- số liệu streak, quota, plan price: ưu tiên monospace cao cấp hoặc sans condensed có tính instrument.

### 4.5.3 Cảm giác mong muốn

- title: confident, cinematic;
- label: technical, refined;
- CTA: crisp, decisive;
- price: premium but legible.

## 4.6 Iconography

- icon phải mảnh, chính xác, ít fill nặng;
- icon premium nên có cách đặt trong orb, chip hoặc bezel nhỏ;
- không dùng material style dày và phổ thông cho paywall hero;
- membership icon nên mang cảm giác seal, star map, streak shield, language memory, deep coach.

---

## 5. MOTION SYSTEM

## 5.1 Motion philosophy

Motion phải tạo cảm giác vật thể thật đang phản ứng với ánh sáng và áp lực, không phải đồ họa trang trí.

Mỗi motion phải trả lời được một vai trò:

- nhấn hierarchy;
- tăng cảm giác premium;
- xác nhận hành động;
- tạo anticipation cho unlock;
- celebration sau completion hoặc purchase.

## 5.2 Motion tiers

### Tier A — Ambient Motion

Dùng cho:

- premium hero;
- membership card;
- paywall background;
- completion celebration background.

Đặc điểm:

- rất chậm;
- vòng lặp dài;
- opacity thấp;
- không thu hút hơn CTA.

Ví dụ:

- aurora drift;
- star dust shimmer;
- subtle radial pulse;
- metallic light sweep.

### Tier B — Interaction Motion

Dùng cho:

- button hover;
- paywall card expand;
- tab chuyển monthly/yearly;
- locked premium preview reveal;
- membership chip tap.

Đặc điểm:

- spring mềm;
- translate và scale nhỏ;
- duration ngắn hơn ambient;
- tactile, có cảm giác nhấn.

### Tier C — Celebration Motion

Dùng cho:

- purchase success;
- completion khi đạt streak;
- unlock premium insight;
- receive streak freeze.

Đặc điểm:

- chỉ chạy khi có thành tựu;
- không lặp vô hạn;
- có mở đầu, peak, fade-out rõ;
- tuyệt đối không biến thành confetti carnival.

## 5.3 Motion rules bắt buộc

- chỉ animate bằng transform và opacity;
- tránh animate width, height, top, left;
- không dùng backdrop blur rộng trên vùng scroll lớn;
- motion ở mobile phải giảm cường độ so với desktop;
- hỗ trợ reduced motion;
- một màn không nên có quá 1 hero animation và 2 secondary animation cùng lúc.

## 5.4 Motion timing đề xuất

```text
Ambient drift: 8s - 14s loop
Card reveal: 450ms - 700ms
CTA hover response: 180ms - 260ms
Sheet open: 320ms - 420ms
Purchase success micro-celebration: 900ms - 1400ms
```

## 5.5 Motion anti-patterns

- glow nhấp nháy liên tục;
- shimmer mọi nút;
- parallax quá rõ khi scroll;
- background galaxy xoay mạnh;
- card bay lên xuống liên tục như game;
- chart hoặc stat tự động animate vô cớ khi user chưa tương tác.

---

## 6. PHÂN TẦNG VISUAL TRONG APP

## 6.1 3 lớp visual

### Lớp 1 — Calm Functional

Áp dụng cho:

- onboarding;
- journal writing;
- feedback body;
- review content;
- lịch sử bài viết;
- lesson content;
- setting form.

Đặc tính:

- nền sáng hoặc neutral;
- motion nhẹ;
- typography rõ;
- không có luxury background nặng.

### Lớp 2 — Premium Accent

Áp dụng cho:

- dashboard premium module;
- progress premium stats;
- completion premium CTA;
- profile membership card;
- preview insight.

Đặc tính:

- có surface premium cục bộ;
- motion có nhưng kiểm soát;
- nổi bật hơn app thường, nhưng chưa phải full cinematic.

### Lớp 3 — Premium Showcase / Conversion

Áp dụng cho:

- pricing hero;
- premium paywall full page;
- purchase modal;
- upgrade bottom sheet;
- winback screen;
- purchase success state.

Đặc tính:

- cho phép galaxy luxury mạnh nhất;
- màu tối cao cấp;
- double bezel;
- ambient light;
- hierarchy rất rõ.

## 6.2 Quy tắc bắt buộc cho từng nhóm màn

### Journal / Writing

- không dùng nền tối toàn màn;
- không dùng animation nền cạnh textarea;
- không dùng particle effect quanh nút submit;
- nếu premium user, chỉ nên nhấn nhẹ ở CTA hoặc helper module.

### Feedback / Review

- nội dung văn bản phải ưu tiên readability;
- premium preview chỉ xuất hiện ở khu vực riêng, không cài vào giữa text body gây nhiễu;
- animation reveal chỉ nên dùng khi mở insight premium thêm.

### Completion / Dashboard / Profile

- đây là nơi luxury phát huy tốt nhất;
- cho phép background object, card premium, stats sâu hơn, membership presence rõ hơn.

---

## 7. PREMIUM VALUE ARCHITECTURE

## 7.1 Premium không phải một skin

Premium của STICK phải được định nghĩa là một gói tăng tốc thói quen và chất lượng diễn đạt.

### 7.1.1 4 trụ cột giá trị

1. **More Reps**
   - 3 bài mỗi ngày thay vì 1
   - khi đang có cảm hứng có thể viết tiếp ngay

2. **Deeper AI Coach**
   - feedback sâu hơn
   - nhiều learning candidates hơn
   - expression usage audit rõ hơn
   - naturalness coaching rõ hơn

3. **Streak Protection**
   - streak freeze
   - giải thích rõ streak được bảo vệ như thế nào

4. **Progress Clarity**
   - weekly reflection
   - personal language memory view
   - insight xem mình đang học gì, lặp lại gì, tiến bộ gì

## 7.2 Free vs Premium matrix đề xuất

| Capability | Free | Premium MVP | Notes |
|---|---|---|---|
| Daily journals | 1 | 3 | Không nên hứa unlimited ở giai đoạn này |
| Corrections | 4 trọng điểm | 6 trọng điểm | Có thể tăng dần theo cost |
| Learning candidates | 3 | 5 | Tập trung meaning gap |
| Expression usage audit | Cơ bản hoặc ẩn | Đầy đủ | Đây là lợi ích rất đáng tiền |
| Streak freeze | Không | Có | Tính theo chu kỳ hoặc grant logic |
| Weekly reflection | Không | Có | Nên là màn cảm xúc mạnh |
| Premium visual identity | Không | Có | Chỉ là lớp phụ trợ |

## 7.3 Ngôn ngữ bán hàng đúng

Nên dùng:

- viết thêm khi bạn đang có cảm hứng;
- nhận gợi ý tự nhiên hơn, sát điều bạn muốn nói hơn;
- không để mất chuỗi chỉ vì một ngày bận;
- STICK nhớ những cách nói bạn đang học và nhắc lại đúng lúc.

Không nên dùng:

- tính năng độc quyền;
- đặc quyền cao cấp;
- trải nghiệm thượng hạng;
- không giới hạn AI toàn diện.

---

## 8. SCREEN INVENTORY CHI TIẾT

## 8.1 Landing — Pricing Section

### Mục tiêu

- tạo chênh lệch perceived value rõ giữa free và premium;
- premium phải trông như một product object đáng tiền;
- không biến free thành vô giá trị.

### Yêu cầu UX

- card Premium phải dùng premium dark surface + gold highlight;
- có ambient glow rất nhẹ ở card nền;
- có so sánh lợi ích theo 4 trụ cột, không chỉ list tính năng;
- monthly là mặc định;
- yearly xuất hiện như option tiết kiệm chứ không lấn át;
- CTA premium phải nói về outcome, không chỉ "Nâng cấp".

### Thành phần bắt buộc

- eyebrow tag kiểu beta pricing hoặc founding member;
- price block;
- benefit stack;
- mini social proof hoặc promise;
- CTA chính;
- reassure text như hủy bất kỳ lúc nào hoặc kích hoạt ngay.

## 8.2 Dashboard — Premium Membership Module

### Mục tiêu

- nhắc user premium rằng họ đang có giá trị rõ ràng;
- cho free user thấy có lý do nâng cấp;
- không che mất CTA học chính.

### Premium user state

- module hiển thị số lượt còn lại hôm nay;
- hiển thị streak protection hoặc freeze count;
- hiển thị coach depth summary;
- visual rich hơn, nhưng không lớn hơn hero task.

### Free user state

- hiển thị usage meter: 1/1 bài hôm nay;
- nếu đã hoàn thành bài đầu, card đổi sang upsell state;
- CTA mở bottom sheet thay vì chuyển trang thô.

## 8.3 Journal Workspace — Daily Limit Upgrade Moment

### Mục tiêu

- free user chạm giới hạn phải cảm thấy đây là một đề nghị hợp lý, không phải bị phạt.

### Luật UX

- không chặn trước khi user hoàn thành bài đầu;
- sau khi hoàn thành bài đầu và muốn viết tiếp, hiện sheet ngắn;
- ngôn ngữ phải là continuation of momentum.

### Copy hướng đề xuất

- Bạn đã hoàn thành bài đầu hôm nay.
- Nếu còn cảm hứng, Premium mở thêm 2 lượt viết để bạn luyện tiếp ngay.

## 8.4 Feedback Result — Premium Delta Preview

### Mục tiêu

- làm user thấy rõ premium feedback sâu hơn free như thế nào.

### Pattern đề xuất

- hiển thị 1 card "Coach sâu hơn cho bài này";
- blur hoặc mask phần insight bổ sung;
- bullet hóa lợi ích theo chính bài viết vừa submit;
- CTA là "Mở thêm cách nói tự nhiên hơn cho bài này".

### Nội dung nên preview

- thêm 1 hoặc 2 expression level-up;
- lý do câu hiện tại chưa tự nhiên;
- ngữ cảnh khi nên dùng cụm diễn đạt mới.

## 8.5 Completion Screen — Celebration + Protection Upsell

### Mục tiêu

- completion là nơi khóa cảm giác tiến bộ;
- ở free plan, đây cũng là nơi bán streak protection hợp lý nhất.

### Free state

- nếu streak >= 3 hoặc user có mood tích cực, hiện premium card mềm;
- card nhấn vào risk mất streak và giá trị giữ nhịp;
- không che CTA quay lại app hoặc progress.

### Premium state

- hiển thị rich celebration hơn;
- membership feel rõ hơn;
- streak freeze count hoặc premium benefit use visibility.

## 8.6 Profile — Membership Hub

### Mục tiêu

- nơi xem tình trạng gói;
- nơi quản lý plan, restore, cancel;
- nơi user cảm nhận mình đang thuộc một tier cao hơn.

### Thành phần bắt buộc

- membership hero card;
- status: free / trial / active / grace / expired;
- benefits list;
- plan management actions;
- usage recap;
- nếu expired: winback offer nhẹ.

## 8.7 Full Premium Paywall Screen

### Mục tiêu

- đây là nơi cho phép galaxy luxury mạnh nhất;
- vẫn phải giữ readability và hierarchy.

### Bố cục đề xuất

- hero statement bên trái hoặc trên;
- premium object card bên phải hoặc dưới;
- comparison matrix tối giản;
- benefits theo trụ cột;
- pricing toggle;
- CTA sticky;
- trust row;
- FAQ rất ngắn.

---

## 9. PAYWALL VÀ CONVERSION FUNNEL

## 9.1 Funnel principle

Không dùng một paywall cho mọi hoàn cảnh.
Mỗi surface phải có paywall theo ngữ cảnh hành vi.

## 9.2 4 surface chính

### Surface A — Feedback Value Paywall

Kích hoạt sau khi user thấy feedback free.

Phù hợp với user:

- vừa nhận giá trị;
- đang tò mò;
- sẵn sàng xem sâu hơn.

Mục tiêu:

- tăng perceived value của deep coach;
- cho user thấy premium gắn với bài viết thật của mình.

### Surface B — Momentum Paywall

Kích hoạt khi free user đã xong bài đầu và muốn viết thêm.

Mục tiêu:

- bán repetition capacity;
- tận dụng trạng thái có động lực cao.

### Surface C — Streak Protection Paywall

Kích hoạt ở completion hoặc progress.

Mục tiêu:

- bán emotional insurance;
- tăng willingness to pay ở nhóm user đã có habit signal.

### Surface D — Membership Hub Paywall

Kích hoạt từ profile hoặc settings.

Mục tiêu:

- nơi user chủ động tìm hiểu giá;
- ít cảm xúc hơn nhưng rõ và đầy đủ hơn.

## 9.3 Rules để tránh spam

- không hiện 2 paywall trong cùng một session ngắn;
- nếu user dismiss một paywall, có cooldown;
- ưu tiên surface theo hành vi có intent cao nhất;
- sau purchase success phải tắt toàn bộ upsell trong một khoảng thời gian.

## 9.4 Priority logic đề xuất

```text
Nếu user vừa xem feedback xong -> ưu tiên Feedback Value Paywall
Nếu user đã dùng hết 1/1 bài và muốn viết tiếp -> ưu tiên Momentum Paywall
Nếu user có streak >= 3 và chưa premium -> ưu tiên Streak Protection Paywall
Nếu user vào profile/plans chủ động -> dùng Membership Hub Paywall
```

---

## 10. PRICING, OFFER VÀ PACKAGING

## 10.1 Định hướng packaging

Giai đoạn MVP chỉ nên có 1 gói Premium với 2 chu kỳ thanh toán:

- Monthly
- Yearly

Không nên thêm nhiều tier vì sẽ tăng cognitive load và làm loãng positioning.

## 10.2 Pricing principles

- monthly là cửa vào chính;
- yearly là option tiết kiệm sau khi user tin giá trị;
- beta pricing hoặc founding pricing có thể dùng để tạo urgency mềm;
- không dùng quá nhiều sale label rối mắt.

## 10.3 Offer strategy đề xuất

### Option 1 — Founding Price

Dùng cho nhóm pilot đầu tiên.

### Option 2 — 3-day Premium Pass sau Day 1 Completion

Cho user nếm giá trị thật sau khi họ đã hoàn thành bài đầu.
Đây thường hợp logic STICK hơn trial ngay ở landing.

### Option 3 — Winback offer nhẹ khi expired

Chỉ dùng sau khi đã có dấu hiệu user từng thấy value.

## 10.4 Pricing copy rules

- tập trung vào cost per day hoặc 5 phút mỗi ngày;
- không viết kiểu sale aggressive;
- phải giữ voice gần gũi, không kiểu fintech.

---

## 11. ANALYTICS VÀ EXPERIMENT PLAN

## 11.1 Event taxonomy mới cho premium funnel

### Impression

- `premium_impression`
  - props: `surface`, `variant`, `day_number`, `current_streak`, `entries_used_today`

### Interaction

- `premium_cta_click`
  - props: `surface`, `cta_type`, `variant`

- `paywall_view`
  - props: `surface`, `variant`, `offer_type`, `plan_default`

- `paywall_dismiss`
  - props: `surface`, `variant`, `dismiss_method`

### Checkout

- `plan_selected`
  - props: `plan_type`, `billing_cycle`, `surface`

- `checkout_started`
  - props: `plan_type`, `billing_cycle`, `surface`

- `purchase_completed`
  - props: `plan_type`, `billing_cycle`, `surface`, `offer_type`

- `purchase_failed`
  - props: `plan_type`, `failure_reason`, `surface`

### Post-purchase value delivery

- `premium_benefit_used`
  - props: `benefit_type`, `surface`, `day_number`

- `subscription_canceled`
  - props: `plan_type`, `age_days`, `reason`

## 11.2 Surface enum bắt buộc

```text
landing_pricing
feedback_result
daily_limit_sheet
completion_card
dashboard_membership
profile_membership
expired_winback
```

## 11.3 A/B test đề xuất

### Test A — Value framing

- Variant 1: bán "deeper AI coach"
- Variant 2: bán "write more today"

### Test B — Emotional framing

- Variant 1: streak protection
- Variant 2: progress acceleration

### Test C — Visual intensity

- Variant 1: galaxy luxury vừa phải
- Variant 2: galaxy luxury đậm hơn

## 11.4 Guardrail metrics

- time to first prompt không tăng đáng kể;
- Day 1 completion không giảm;
- submit rate không giảm sau khi thêm premium surfaces;
- crash rate và interaction delay không tăng.

---

## 12. TECHNICAL ARCHITECTURE ĐỊNH HƯỚNG CHO FRONTEND

## 12.1 Mục tiêu kỹ thuật

- Premium UI phải có hệ thống token riêng, không rải class thủ công khắp app;
- paywall surfaces phải có cùng data contract logic;
- entitlement state phải rõ ràng;
- animation phải có cơ chế degrade trên mobile và reduced motion.

## 12.2 Trạng thái membership cần hỗ trợ

Frontend không nên chỉ phụ thuộc vào `isPremium: boolean`.
Cần chuẩn bị model logic cho:

- `free`
- `trial`
- `active`
- `grace`
- `expired`
- `comped`

Ở giai đoạn hiện tại backend mới có cờ boolean và timestamp, nhưng UI architecture phải được thiết kế sẵn để không phải refactor lớn khi billing thật vào.

## 12.3 Token groups cần có

### Premium color tokens

- background
- surface
- text
- border
- glow
- gold accent
- aurora accent

### Premium motion tokens

- duration
- easing
- spring profiles
- ambient loop timing

### Premium depth tokens

- shadow layers
- blur strength
- radius scale
- noise opacity

## 12.4 Component groups nên chuẩn hóa

- `PremiumSurface`
- `PremiumHeroCard`
- `PremiumBadge`
- `PremiumPlanCard`
- `MembershipStatusCard`
- `PaywallSheet`
- `BenefitPill`
- `UpgradeMomentCard`
- `PremiumStatTile`

## 12.5 Data dependencies tối thiểu

Các surface premium trong app nên đọc được các field sau:

- `isPremium`
- `currentStreak`
- `streakFreezeCount`
- `dayNumber`
- `todayCompleted`
- `todayJournalId`
- `entriesUsedToday`
- `dailyLimit`
- `deepFeedbackAvailable`
- `planStatus`
- `premiumSince`
- `premiumUntil`

Một số field chưa có sẵn trong API hiện tại, nhưng cần được xem là contract target cho các bước sau.

## 12.6 Premium preview strategy

Có 2 mode triển khai:

### Mode A — Static preview

- rẻ, dễ làm;
- không gọi thêm AI;
- chỉ nêu loại giá trị user sẽ mở được.

### Mode B — Dynamic preview

- mạnh về conversion hơn;
- có thể tạo preview delta thật từ bài hiện tại;
- cần kiểm soát cost và caching.

Khuyến nghị: đi Mode A trước, chỉ test Mode B trên cohort nhỏ.

---

## 13. PERFORMANCE, ACCESSIBILITY, QA GUARDRAILS

## 13.1 Performance rules

- background premium phải nằm trong container riêng, không đè lên toàn app;
- blur chỉ dùng cục bộ;
- noise layer là fixed hoặc local pseudo-layer, không attach vào vùng scroll lớn;
- animation lặp vô hạn phải rất ít và rất nhẹ;
- mobile giảm cường độ motion và layer count;
- không load asset video chỉ để trang trí paywall ở giai đoạn MVP.

## 13.2 Accessibility rules

- text contrast trên nền premium phải đạt chuẩn đọc tốt;
- mọi CTA phải có state hover, active, focus rõ;
- thông tin giá không được chỉ truyền bằng màu;
- motion phải tắt hoặc giảm khi reduced motion bật;
- không dùng text quá nhỏ trên nền tối để làm cho "sang".

## 13.3 QA checklist cho visual premium

- paywall có đẹp nhưng vẫn đọc nhanh được không;
- CTA có nổi hơn background không;
- animation có giật trên mobile không;
- close hoặc dismiss có rõ không;
- trạng thái free, premium, expired có nhất quán không;
- screen loading có bị nhấp nháy hoặc nhảy layout không.

---

## 14. ROADMAP TRIỂN KHAI

## Phase 0 — Strategy lock

- chốt art direction galaxy luxury;
- chốt entitlement matrix;
- chốt screen priority;
- chốt event taxonomy.

## Phase 1 — Design system foundation

- tạo token map premium;
- tạo motion guidelines;
- tạo component primitives;
- tạo 2 đến 3 visual variants để review.

## Phase 2 — Conversion surfaces

- landing pricing revamp;
- feedback premium preview;
- daily limit sheet;
- completion premium card;
- profile membership hub bản đầu.

## Phase 3 — Deep product value surfaces

- dashboard membership module;
- progress / weekly reflection;
- deeper coach unlock states;
- streak freeze communication rõ ràng hơn.

## Phase 4 — Billing lifecycle

- checkout;
- purchase success;
- restore;
- manage plan;
- expired and grace states;
- winback flow.

## Phase 5 — Optimization

- A/B test visual intensity;
- A/B test value framing;
- tune pricing copy;
- tune cooldown logic;
- refine post-purchase onboarding.

---

## 15. UAT VÀ ACCEPTANCE CRITERIA

## 15.1 Product acceptance

- user mới vẫn đến prompt đầu tiên trong dưới 1 phút;
- free user vẫn hoàn thành trọn Day 1 core loop;
- premium surfaces không xuất hiện trước khi user cảm được value cơ bản;
- paywall xuất hiện đúng ngữ cảnh;
- premium promise khớp quyền lợi thật đang có.

## 15.2 Visual acceptance

- premium nhìn rõ là cao cấp hơn free;
- galaxy luxury không biến thành cyberpunk generic;
- luxury hiện diện có trọng tâm, không tràn lan;
- CTA luôn rõ hơn background;
- motion tạo cảm giác premium chứ không gây mệt.

## 15.3 Technical acceptance

- animation không kéo tụt hiệu năng đáng kể;
- mobile trải nghiệm ổn;
- reduced motion hoạt động;
- dismiss logic, cooldown logic, impression logic bắn event đúng;
- state free/trial/active/expired không conflict.

## 15.4 Business acceptance

- paywall CTR tăng so với baseline;
- checkout start rate tăng;
- purchase completed rate đủ tốt trên surface chính;
- retention của paid cohort tốt hơn free cohort;
- Day 1 completion không giảm dưới ngưỡng sức khỏe hiện tại.

---

## 16. DECISION MATRIX KHI REVIEW DESIGN

Mọi proposal thiết kế hoặc thay đổi visual premium nên tự chấm theo 5 câu hỏi sau:

### Q1. Nó có làm Premium trông đáng tiền hơn không?

- Nếu chỉ thêm hiệu ứng mà không tăng perceived value: điểm thấp.

### Q2. Nó có làm core loop chậm hoặc khó hơn không?

- Nếu có, phải giảm cường độ hoặc chuyển sang surface khác.

### Q3. Nó có gắn với một quyền lợi trả phí thật không?

- Nếu không, đây chỉ là cosmetic layer.

### Q4. Nó có đo được hiệu quả không?

- Nếu không map được sang event và KPI, không nên ưu tiên.

### Q5. Nó có scale được khi billing thật vào không?

- Nếu hiện tại chỉ sống được với `isPremium: boolean` mà sau này sẽ gãy, cần thiết kế lại state model ngay từ đầu.

### Kết luận ra quyết định

- Qua 5/5: cho vào implementation plan.
- Qua 4/5: cho vào design exploration hoặc experiment.
- Qua 3/5 trở xuống: không ưu tiên ở giai đoạn MVP.

---

## KẾT LUẬN CUỐI

Hướng galaxy luxury là phù hợp cho STICK nếu dùng như một lớp tăng perceived value cho Premium và conversion, không phải phủ lên toàn bộ core experience.

Phiên bản đúng cho STICK là:

**Luxury có trọng tâm, motion có kỷ luật, value phải thấy ngay, và mọi khoảnh khắc sang trọng đều phải phục vụ hành vi quay lại ngày mai.**

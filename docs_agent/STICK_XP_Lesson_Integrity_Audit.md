# STICK XP / Lesson Integrity Audit

Ngay audit: 2026-04-09

## 1. Muc tieu tai lieu

Tai lieu nay audit toan bo co che diem / EXP / lesson reward hien tai cua STICK voi mot nguyen tac trung tam:

- User khong duoc farm diem bang cach bam nut, save du lieu, spam API, hoac lap lai hanh vi khong co hoc that.
- XP phai dai dien cho hoc tap co y nghia, khong phai cho CRUD action.
- Lesson phai la server-authoritative, khong duoc de client tu khai diem.
- Premium khong duoc bien thanh pay-to-progress.

Ket luan ngan:

- He thong hien tai chua dat yeu cau "phai thuc su hoc moi co diem".
- XP dang duoc thuong cho nhieu hanh vi thu thap / luu / ket thuc be mat, thay vi bang chung hoc tap.
- Du lieu XP dang bi tach thanh 3 su that song song va khong duoc dong bo theo transaction.
- Lesson reward vua bi vo contract FE/BE, vua co design trust model khong an toan.
- Co it nhat 1 route P0 co the bi user thuong goi truc tiep de lam sai leaderboard va daily XP.

## 2. Evidence da doi chieu

Da doi chieu truc tiep cac khu vuc sau:

- `backend/src/routes/apiV1.js`
- `backend/prisma/schema.prisma`
- `frontend/src/pages/app/LessonDetail.tsx`
- `frontend/src/pages/app/JournalWorkspace.tsx`
- `frontend/src/pages/app/FeedbackResult.tsx`
- `frontend/src/pages/app/GrammarPractice.tsx`
- `frontend/src/pages/app/ReadingMode.tsx`
- `frontend/src/pages/app/ListeningPractice.tsx`
- `frontend/src/pages/app/SavedPhrases.tsx`
- `frontend/src/pages/app/VocabNotebook.tsx`
- `frontend/src/pages/app/VocabularyReview.tsx`
- `frontend/src/services/api/endpoints.ts`
- `docs_agent/STICK_Lesson_System_Master_Plan.md`
- `docs_agent/STICK_Implementation_Plan_Full.md`

## 3. Ket luan tong quan

### 3.1 Van de cot loi

He thong reward hien tai dang thuong 3 nhom hanh vi sai:

- Tao / luu du lieu: tao journal, save phrase, add vocab, import vocab.
- Hoan tat be mat: mo reading roi back, xong practice khong can dat nguong chat luong.
- Client tu bao diem: lesson complete dua vao score do client gui len.

Trong khi do, nhung hanh vi gan voi hoc that lai duoc thuong qua it hoac khong duoc thuong:

- Goi nho lai tu vung trong review SRS hien tai: `0 XP`.
- Dung lai phrase / pattern trong lan hoc sau: chua co reward.
- Xem feedback ky, shadowing, ghi nho va quay lai hom sau: reward model chua tap trung vao day.

### 3.2 Vi sao nguy hiem voi STICK

STICK la san pham xay thoi quen nghi bang tieng Anh hang ngay, khong phai app grind diem. Neu reward model sai, san pham se bi lech theo 4 huong:

- User hoc cach toi uu diem thay vi toi uu hoc.
- Leaderboard mat y nghia vi ai spam duoc se len top.
- Premium bi cam nhan nhu mua toc do tang cap, khong phai mua gia tri hoc tap.
- Team mat kha nang doc retention va value delivery tu XP, vi XP khong con phan anh hoc tap that.

## 4. Ban do nguon XP hien tai

| Nguon | Route / Function | Reward hien tai | Bang chung hoc tap that? | Nhan xet |
| --- | --- | --- | --- | --- |
| Tao journal | `POST /journals` | `+10 XP` ngay khi tao | Khong | Chi can tao draft, chua can submit, chua can feedback, chua can chat luong noi dung |
| AI feedback bonus | `POST /ai/feedback/text` | `round(score / 5)` | Mot phan | Co idempotency tot hon cac route khac, nhung van dua vao AI score cua journal, khong phai bang chung retain / recall |
| Import vocab tu feedback | `POST /journals/:id/import-vocab` | `saved * 3 XP` | Khong | Thuong cho hanh vi save, khong thuong cho hanh vi nho lai |
| Practice session | `POST /learning-sessions` | `5 XP` / session / type, cap `3` / ngay / type | Rat yeu | Duoc thuong khi session ket thuc, khong dua vao nguong chat luong hoac duration nghiem tuc |
| Save phrase | `POST /phrases` | `+2 XP`, cap `15` / ngay | Khong | Thuong cho collection |
| Add vocab thu cong | `POST /vocab/notebook` | `+3 XP`, cap `20` / ngay | Khong | Thuong cho collection |
| Vocab review SRS | `POST /vocab/notebook/:id/review` | `0 XP` | Co | Day moi la hanh vi hoc that nhung lai khong duoc thuong |
| Lesson complete | `POST /library/lessons/:id/complete` | `xpReward`, review = `50%`, bonus theo score, cap `200` / ngay | Dang bi vo | Design da co y tuong dung hon, nhung implementation dang trust client va contract FE/BE dang sai |
| Achievement | `checkAndUnlockAchievements()` | `def.xpReward` | Phu thuoc upstream | Achievement dang khuech dai reward tu cac hanh vi co the farm |
| Admin manual adjust | `POST /admin/users/:id/stats` | tuy chinh | N/A | Day la ops path, khong phai user spam path |
| Backfill | `POST /progress/backfill` | Khong cong `User.totalXp`, nhung rewrite `ProgressDaily.xpEarned` | Khong | Day la route P0 vi user thuong co the goi duoc |

## 5. Kien truc XP hien tai dang sai o dau

### 5.1 Khong co mot XP engine trung tam

He thong hien tai dang chia reward thanh 2 ham rieng:

- `trackDailyProgress(userId, data)` -> ghi `ProgressDaily`
- `awardXp(userId, amount, source, opts)` -> ghi `UserXpLog` va tang `User.totalXp`

Van de:

- Hai duong ghi nay tach roi nhau.
- Nhieu route `await trackDailyProgress(...)` nhung lai goi `awardXp(...)` theo kieu fire-and-forget.
- `awardXp(...)` khong co idempotency key.
- `awardXp(...)` khong co daily safety policy.
- Mot so route update `ProgressDaily` truc tiep ma khong qua `trackDailyProgress()`.

He qua:

- `User.totalXp`
- `UserXpLog`
- `ProgressDaily.xpEarned`

co the lech nhau va hien tai da co duong di de lech nhau.

### 5.2 Cac man hinh / API dang doc XP tu nhieu su that khac nhau

Hien tai moi noi dang doc XP theo mot kieu khac nhau:

- `GET /progress/summary` dung `User.totalXp`.
- `GET /xp/history` dung `UserXpLog` + `User.totalXp`.
- `GET /leaderboard?scope=weekly` dung `SUM(ProgressDaily.xpEarned)` trong 7 ngay.
- `GET /leaderboard?scope=all-time` dung `GREATEST(User.totalXp, SUM(ProgressDaily.xpEarned))`.
- `GET /achievements/summary` lai tinh `xpEarned` bang tong `ProgressDaily.xpEarned`, trong khi comment con noi no "matches /progress/summary" nhung thuc te khong dung.

He qua:

- Cung mot user co the thay nhieu tong XP khac nhau tuy man hinh.
- Weekly leaderboard co the sai so so voi all-time.
- Achievement summary co the sai so so voi progress summary.
- Neu user hoi "XP that cua toi la bao nhieu?" thi he thong hien tai khong tra loi nhat quan.

### 5.3 Reward write khong transaction, khong atomic, khong idempotent

Nhieu route dang co pattern:

1. Dem so luong hien tai / tinh cap.
2. Tao record moi.
3. Tang `ProgressDaily`.
4. Fire-and-forget `awardXp()`.

Pattern nay gap 3 loi:

- Retry request co the double award.
- Parallel request co the vuot cap do count truoc, ghi sau.
- Neu `awardXp()` loi sau khi `ProgressDaily` da ghi, du lieu se drift.

## 6. Ma tran lo hong theo muc do

### 6.1 P0 - Integrity break / co the lam sai nghia he thong ngay lap tuc

#### P0-A. `POST /progress/backfill` dang mo cho user thuong

Route nay dang yeu cau `requireAuth`, khong phai `requireAdmin`.

No lam 3 viec nguy hiem:

- Tu tong hop lai journal / vocab / phrase / learning session theo cong thuc cu.
- Ghi de `ProgressDaily.xpEarned` cho tung ngay.
- Khong cap nhat `User.totalXp` cung logic tuong ung.

Cong thuc backfill hien tai con bo qua policy song hien tai:

- Journal: `+10` moi journal.
- Vocab: `+3` moi item.
- Phrase: `+2` moi item.
- Session: `+5` moi session.

Backfill khong ton trong:

- cap `15 phrase/ngay`
- cap `20 vocab/ngay`
- cap `3 session/type/ngay`
- logic lesson xp
- feedback bonus
- achievement xp

Tac dong:

- User co the spam phrase / vocab / session, sau do goi `backfill` de weekly leaderboard tang vuot xa XP that.
- All-time leaderboard cung co the bi anh huong vi dang dung `GREATEST(totalXp, SUM(progressDaily))`.
- Progress summary va leaderboard co the mau thuan.

Ket luan: day la route can khoa ngay lap tuc hoac chuyen thanh admin-only.

#### P0-B. Lesson backend dang trust client score va time

`POST /library/lessons/:id/complete` hien tai nhan tu client:

- `score`
- `timeSpent`
- `duration`
- `totalExercises`
- `correctCount`
- `comboMax`
- `answers`

Nhung server khong recompute lai score tu dap an mot cach authoritative.

Van de:

- `finalScore` lay truc tiep tu `score` client gui len, sau do chi clamp ve `0..100`.
- User co the goi API truc tiep voi `score = 100`, `timeSpent = 999`, `answers = []` va nhan reward muc cao.
- Endpoint validate dang tra ve `correctAnswer`, giup lo dap an.
- Lesson review khong co gioi han `1 rewardable review / lesson / day`.
- Daily cap `200 XP` van co the bi hit bang cach lap cung 1 lesson de.

Ket luan: lesson xp hien tai chua du tieu chuan integrity.

#### P0-C. Lesson frontend/backend contract dang vo

Frontend:

- `validateExercise()` chi gui `{ exerciseIndex, answer }`.
- Frontend expect response co `pointsEarned`.

Backend:

- Validate route can `exerciseType`.
- Backend return `points`, khong phai `pointsEarned`.

Frontend complete:

- Gui `duration`, `score`, `totalPoints`, `maxCombo`, `answers`.
- Expect response gom `attempt`, `progress`, `vocabAdded`.

Backend complete:

- Can `timeSpent >= 30`.
- Return `session`, `attempt`, `dailyXpRemaining`.

Tac dong thuc te:

- Validate co kha nang fail mac dinh neu di dung contract FE hien tai.
- Complete co kha nang bi backend tu choi voi `TOO_FAST` vi FE khong gui `timeSpent` dung field.
- Frontend lai co fallback local: neu request fail, van tu tinh `score`, `starRating`, `xpEarned = lesson.xpReward` va hien completion card.

Ket qua nghiem trong:

- User co the thay "da duoc XP" tren UI nhung backend khong ghi nhan.
- Lesson progression tro thanh fake-success o lop UI.
- Team rat kho debug vi user nghi ho da duoc thuong.

#### P0-D. Cap enforcement dang khong atomic

Nhieu route cap theo pattern `count -> neu chua vuot cap thi award`:

- journal daily limit
- phrase daily cap
- vocab daily cap
- learning session daily cap
- lesson daily cap

Neu user / bot ban request song song:

- tat ca cung thay count cu.
- nhieu request cung du dieu kien.
- XP co the vuot cap truoc khi DB update kip phan anh count moi.

Day la lo hong rat thuong gap trong reward system va hien tai STICK dang mo ra cho no.

#### P0-E. Premium lesson chua thay gate reward / entitlement ro rang o backend

Lesson API dang tra ra `isPremium`, nhung cac route doc lesson / validate / complete khong thay enforcement ro rang theo entitlement premium o tang backend.

Neu dieu nay giu nguyen:

- free user co the goi truc tiep API premium lesson
- co the hoc va an premium reward ma khong qua gating dung nghia

Ngay ca khi chi mot phan route bi lo, day van la lo hong nghiem trong vi lesson la noi co XP reward lon hon cac hanh vi khac.

### 6.2 P1 - Farmable, lam lech dong co hoc, pha y nghia san pham

#### P1-A. Journal reward dang duoc thuong luc tao draft, khong phai luc hoan thanh hoc

`POST /journals` hien tai cong `+10 XP` ngay khi tao journal.

Dieu nay co 4 he qua:

- User chi can save draft la co diem.
- Draft 1 ky tu van co diem neu route duoc goi.
- `handleSaveDraft()` tren frontend co the kich hoat reward ma chua qua AI feedback.
- Premium duoc `3 journal/ngay`, free `1 journal/ngay`, tao ra pay-to-progress optics.

Voi STICK, reward journal phai nam o su kien "hoan tat vong viet -> nhan feedback", khong phai "da tao row trong DB".

#### P1-B. Manual collection dang duoc thuong lon hon review / recall

Hien tai:

- Save phrase: `+2 XP`
- Add vocab thu cong: `+3 XP`
- Import vocab tu AI: `+3 XP / item`
- Review SRS dung nghia la goi nho lai: `0 XP`

Day la incentive nguc doi:

- Thu thap -> co diem
- Goi nho lai -> khong diem

Neu muon san pham co y nghia, reward phai chuyen tu collection sang recall.

#### P1-C. Import AI vocab dang bypass cap va thuong cho 1 click "Save all"

Tren `FeedbackResult.tsx`, user co the bam `Save all words`.

Backend `POST /journals/:id/import-vocab`:

- cho toi da `10 item/request`
- cong `saved * 3 XP`
- khong co daily cap rieng cho import path

Nghia la:

- Free user co the an them den `30 XP/ngay` chi tu import vocab mot journal.
- Premium `3 journal/ngay` co the len den `90 XP/ngay` tu import vocab.
- Tat ca deu la reward cho "save vao notebook", khong phai cho "nho duoc".

#### P1-D. Practice sessions dang thuong completion, khong thuong learning quality

Backend `POST /learning-sessions` dang thuong `5 XP` cho moi session type trong map:

- grammar
- reading
- listening
- speaking

cap hien tai: `3 session/type/ngay`.

Nhung evidence hoc tap rat mong:

- `ReadingMode.tsx`: mo bai doc roi bam back gan nhu ngay lap tuc van ghi session.
- `ListeningPractice.tsx`: chi can dien het blank va bam check, khong can dat nguong accuracy co nghia.
- `GrammarPractice.tsx`: finish quiz la duoc ghi session, score thap van co reward cung muc.
- Backend thuong theo `type`, khong dua tren accuracy threshold nghiem tuc.

Co nghia la practice xp hien tai la "toi da ket thuc mot activity" chu khong phai "toi da hoc duoc gi".

#### P1-E. Cung mot lesson co the bi review-farm lap lai

Backend lesson dang giam review reward xuong `50%`, day la huong dung. Nhung chua du.

Con thieu:

- gioi han rewardable review / lesson / day
- diminishing return sau mot so lan review
- rang buoc review phai co value that, khong chi submit lai diem tu client

Neu direct API hop le, user co the lap cung 1 lesson de hang chuc lan cho den khi cham cap ngay.

#### P1-F. Premium dang mo rong thong luong kiem XP

Hien tai premium journal limit = `3/day`, free = `1/day`.

Vi journal keo theo:

- `+10` tao journal
- feedback bonus
- import vocab bonus

nen premium khong chi mo rong noi dung, ma con mo rong toc do level up.

Day la tin hieu rat xau ve mat dinh vi:

- premium thanh mua toc do tang cap
- leaderboard co the nghieng ve nguoi tra tien nhieu hon la nguoi hoc nghiem tuc hon

### 6.3 P2 - Drift, ops risk, va data meaning risk

#### P2-A. Timezone dang khong thong nhat

`trackDailyProgress()` dung ngay Viet Nam.

Nhung nhieu route khac lai dung `new Date(); setHours(0,0,0,0)` theo timezone cua server / runtime.

He qua:

- cap ngay co the reset lech
- leaderboard week co the tinh theo moc khac
- mot ngay hoc o VN co the bi cat doi khong dung

Reward economy ma khong co day-key thong nhat se som muon gay bug kho tim.

#### P2-B. Comment / schema / payload dang drift voi implementation

Vi du:

- `achievements/summary` comment noi XP do "matches /progress/summary" nhung thuc te khong dung.
- Lesson FE types va BE payload dang khong giong nhau.
- Lesson auto-add vocab dang dung field naming khong khop schema notebook hien tai.

Day la dau hieu cho thay domain reward dang bi drift va de gay bug silent.

## 7. FE/BE mismatch matrix cho lesson

| Khu vuc | Frontend gui / expect | Backend can / return | Tac dong |
| --- | --- | --- | --- |
| Validate exercise request | Gui `{ exerciseIndex, answer }` | Can `exerciseType`, `answer`, `exerciseIndex` | Validate co the fail mac dinh |
| Validate exercise response | FE expect `pointsEarned` | BE return `points` | FE khong nhan dung diem |
| Complete lesson request | Gui `duration`, `score`, `totalPoints`, `maxCombo`, `answers` | BE can `timeSpent >= 30`, co the doc them `correctCount`, `totalExercises` | Complete de fail hoac reward sai |
| Complete lesson response | FE expect `{ attempt, progress, vocabAdded }` | BE return `{ session, attempt, dailyXpRemaining }` | FE de vao catch va hien fallback local |
| Score semantic | FE gui `score = totalScore` (raw points) | BE hieu `score` nhu percent `0..100` | Score co the sai logic ngay ca khi request thanh cong |

Ket luan:

- Lesson hien tai khong chi co lo hong anti-cheat.
- No con dang co kha nang khong van hanh dung theo flow user thay tren UI.

## 8. Uoc luong kha nang farm diem hien tai

Day la muc tran ly thuyet theo rule hien tai, chua tinh achievement bonus va chua tinh abuse bang request song song:

- Journal create: free `10/day`, premium `30/day`
- Feedback bonus: toi da khoang `20/journal`
- Import AI vocab: toi da `30/journal`, premium co the `90/day`
- Save phrase: `30/day`
- Add vocab thu cong: `60/day`
- Practice sessions: `45-60/day` tuy surface UI va raw API (`3 type` tren UI hien thay, `4 type` tren backend map)
- Lesson repeat/review: toi da `200/day` theo cap hien tai, va co the vuot them neu khai thac race condition

Nghia la:

- free user co the tien sat `400 XP/day` tren ly thuyet khi ket hop cac nguon
- premium user co the vuot `500 XP/day` truoc ca achievement bonus

Muc nay qua cao doi voi mot micro-learning product, va te hon nua: phan lon so do khong doi hoi hoc that.

## 9. Nguyen tac thiet ke lai reward economy

Neu muon STICK co y nghia, can khoa 6 nguyen tac sau:

### 9.1 XP chi duoc cap khi co bang chung hoc tap

Bang chung hop le gom:

- da submit journal dat nguong toi thieu
- da nhan duoc AI feedback cho journal do
- da recall vocab thanh cong trong review
- da hoan thanh lesson voi diem duoc server tinh lai
- da hoan thanh practice dat nguong duration + accuracy hop ly

Bang chung khong hop le:

- tao draft
- save phrase
- add vocab thu cong
- import hang loat tu feedback
- mo bai doc roi thoat ra
- direct API tu khai score

### 9.2 Discovery action chi duoc xem la setup, khong phai hoc tap

Do do:

- Save phrase = `0 XP`
- Add vocab thu cong = `0 XP`
- Import AI vocab = `0 XP`
- Save draft = `0 XP`

Neu muon co reward nho cho discovery, chi nen la reward rat be va cap rat chat. Tuy nhien voi pilot hien tai, de don gian va tranh farm, nen de `0 XP`.

### 9.3 Recall phai duoc thuong nhieu hon collection

Reward nen chay vao:

- review vocab dung
- lesson hoan thanh voi do chinh xac thuc
- practice dung nguong
- quay lai hom sau

Khong nen chay vao:

- add vao notebook
- bam save all
- tao them row trong DB

### 9.4 Server phai la nguon su that duy nhat

Lesson, practice, va moi reward source phai theo nguyen tac:

- client gui evidence thuan
- server tu tinh xp
- client chi hien XP server xac nhan

Tuyet doi khong cho client fallback local xp trong completion UI.

### 9.5 Premium khong duoc lam tang toc do len level

Premium co the mo them:

- noi dung
- lesson
- cong cu AI
- report / lich su / voice / UX nang cao

Nhung khong nen mo thong luong kiem XP cao hon ban free. Neu khong, bang xep hang va level se mat y nghia.

### 9.6 Daily cap phai thap hon hien tai va chia theo bucket hoc tap

Cap tong `200/day` hien tai qua rong cho mot san pham micro-learning.

De xuat:

- Global cap: `80-100 XP/day`
- Khong bucket nao duoc chiem toan bo cap

Vi du phan bo hop ly:

- Journal flow: toi da `10-15 XP/day`
- Lesson: toi da `40 XP/day`
- Vocab recall: toi da `20-30 XP/day`
- Practice: toi da `20 XP/day`
- Achievement: ngoai bucket nhung la one-time, co review ky

## 10. De xuat reward model moi

Muc tieu cua model moi la don gian tren be mat, chat ve integrity ben duoi.

### 10.1 Journal flow

De xuat:

- Save draft: `0 XP`
- Submit journal dat nguong toi thieu: `+6 XP`
- AI feedback duoc tao thanh cong cho journal do: `+4 XP`
- Khong thuong them theo so tu hoac theo viec save lai nhieu lan

Dieu kien toi thieu de journal duoc reward:

- do dai toi thieu hop ly, vi du `>= 15 tu` hoac `>= 60 ky tu`
- noi dung khong trung gan nhu y het voi bai vua truoc
- moi journal chi reward `1 lan`

Ghi chu:

- Neu muon giu cam giac nhanh gon, co the gop 2 moc tren thanh mot bundle `+10 XP` sau khi journal + feedback da xong.
- Cach bundle nay rat hop voi core loop cua STICK hon reward tung thao tac nho.

### 10.2 Vocabulary va phrase

De xuat:

- Manual add phrase / vocab: `0 XP`
- Import tu AI: `0 XP`
- First successful recall trong review: `+4 XP`
- Review due item dung o cac lan sau: `+2 XP`
- Review sai: `0 XP`

Cap goi y:

- Vocab recall cap: `20-30 XP/day`
- Chi reward khi review qua due item that, khong reward review spam lien tuc cung item trong cung ngay

### 10.3 Practice session

De xuat:

- Grammar: chi reward neu `accuracy >= 60%`
- Listening: chi reward neu `accuracy >= 60%`
- Reading: tam thoi `0 XP` neu chua co comprehension evidence that
- Speaking: chi reward khi co transcript / pronunciation / completion evidence that

Cap goi y:

- `5 XP` / session hop le
- toi da `2 rewardable session / type / day`

Neu chua co evidence that cho reading / speaking, nen tat XP cua 2 mode nay truoc, tranh farm.

### 10.4 Lesson

Lesson nen la nguon XP y nghia nhat sau journal.

De xuat:

- First completion: `10-20 XP` tuy do kho / category
- Review completion: `30-50%` first completion reward
- Bonus nho cho diem cao, nhung chi sau khi score duoc server recompute

Rule bat buoc:

- Server tinh lai score tu dap an, khong dung score client gui thang
- `correctAnswer` khong tra som trong validate endpoint neu chua sealed attempt
- Moi lesson chi co `1 rewardable first completion`
- Moi lesson chi co `1 rewardable review / day`
- Sau mot nguong review, reward giam manh hoac bang `0`
- Neu lesson premium, backend phai gate entitlement truoc khi validate / complete

### 10.5 Achievement

Achievement chi nen unlock tu trusted events.

Khong nen de achievement cong them reward cho cac metric dang bi farm nhu:

- phrase save count
- vocab add count
- session count be mat

Neu chua sua upstream reward source, achievement cung se bi ban theo.

## 11. Kien truc ky thuat nen chot

### 11.1 Tao mot `RewardEngine` duy nhat o backend

Moi nguon reward di qua cung mot API noi bo, vi du:

```ts
rewardEngine.record({
  userId,
  eventType,
  sourceId,
  idempotencyKey,
  dayKey,
  evidence,
});
```

RewardEngine phai lam 1 lan trong cung transaction:

- validate policy
- check cap
- tao ledger row
- tang cache `User.totalXp`
- tang aggregate `ProgressDaily.xpEarned`

### 11.2 Tao `XpLedger` lam su that goc

Moi dong XP can co:

- `userId`
- `eventType`
- `sourceType`
- `sourceId`
- `amount`
- `dayKey`
- `idempotencyKey`
- `metadata`
- `createdAt`

Rule:

- `idempotencyKey` unique
- `ProgressDaily` la aggregate tu ledger, khong phai noi tu tung route tu y ghi
- `User.totalXp` la cache duoc update cung transaction voi ledger

### 11.3 Tat ca cap phai atomic

Khong duoc lam theo kieu:

- count truoc
- roi moi create

Can dung mot trong 2 cach:

- transaction + lock / unique guard
- hoac SQL update co dieu kien tren ledger / aggregate row

### 11.4 Thong nhat day-key theo Viet Nam

Toan bo reward system phai dung cung mot day-key:

- `Asia/Ho_Chi_Minh`
- hoac luu ro `dayKey = YYYY-MM-DD` theo VN

Khong duoc de mot route dung VN, mot route dung local server midnight.

## 12. Backlog fix de xuat theo pha

### Pha 0 - Stop the bleeding

Can lam ngay:

1. Khoa `POST /progress/backfill` thanh admin-only hoac tat han.
2. Bo local fallback XP o lesson completion UI. Chi hien reward neu backend confirm.
3. Doi journal create reward ve `0 XP`.
4. Doi manual phrase / manual vocab / import AI vocab reward ve `0 XP` tam thoi.
5. Tat reading XP neu chua co learning evidence that.
6. `await` hoac transaction-hoa toan bo reward write, khong fire-and-forget `awardXp()` nua.
7. Them idempotency key cho cac reward source de tranh double-award do retry.

### Pha 1 - Rebuild integrity

1. Tao `RewardEngine` + `XpLedger`.
2. Chuyen leaderboard, progress summary, xp history ve cung mot nguon su that.
3. Recompute lesson score tren server.
4. Gate premium lesson o backend.
5. Gioi han reviewable lesson reward theo ngay / lesson.
6. Thong nhat timezone reward sang VN.

### Pha 2 - Reward for real learning

1. Dua XP tu collection sang recall.
2. Thuong vocab review dung.
3. Thuong lesson hoan thanh dung.
4. Bundle journal reward quanh core loop thay vi reward tung CRUD action.
5. Xem xet reward nho cho next-day return neu muon support habit, nhung phai cuc ky can than de khong bien thanh login-streak app.

## 13. Acceptance criteria de duyet lai sau khi fix

He thong moi chi nen duoc xem la dat khi thoa tat ca dieu sau:

- User khong the an XP bang save draft, save phrase, add vocab, hay import vocab.
- User khong the an XP bang request retry hoac spam song song.
- `User.totalXp`, `UserXpLog`, `ProgressDaily`, leaderboard, progress summary, achievement summary deu khop nhau.
- Lesson score duoc server tinh lai tu dap an, khong phai tu client score.
- Lesson completion UI khong duoc hien XP neu backend khong xac nhan.
- Review / recall duoc thuong nhieu hon collection.
- Premium khong lam tang toc do level up.
- Tat ca cap deu atomic va dung cung day-key VN.

## 14. Ket luan de product duy chot

Neu muc tieu la "user phai thuc su hoc, khong duoc spam de lay diem", thi can coi he thong hien tai la chua dat.

Van de lon nhat khong nam o mot route le loi, ma nam o triet ly reward dang sai:

- dang thuong hanh vi luu tru hon la hoc
- dang tin client o noi khong duoc tin
- dang tach reward thanh nhieu source of truth

Huong dung cho STICK la:

- reward it hon, nhung sach hon
- reward sau bang chung hoc tap, khong reward sau thao tac be mat
- lesson va xp phai server-authoritative
- level / leaderboard phai phan anh tien bo hoc tap that, khong phai kha nang farm he thong

Neu duyet huong nay, buoc tiep theo nen la viet mot implementation plan Pha 0 -> Pha 2 va chot schema cho `RewardEngine` / `XpLedger` truoc khi sua code.
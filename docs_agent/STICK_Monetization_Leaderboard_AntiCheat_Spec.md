# STICK Monetization + Leaderboard + Anti-Cheat Strategy Spec

Ngay soan: 2026-04-10
Trang thai: Draft for review
Lien quan: `docs_agent/STICK_XP_Lesson_Integrity_Audit.md`

## 1. Muc tieu tai lieu

Tai lieu nay dinh nghia mot chien luoc tong hop cho 4 bai toan phai di cung nhau:

1. Tang doanh thu premium mot cach manh va ben vung.
2. Giu leaderboard co gia tri va cong bang.
3. Chan spam / farm / gian lan EXP va rank.
4. Chot rule engine cu the cho `XP`, `Ranked Score`, `Premium Day Pass`, va abuse control.

Nguyen tac trung tam:

- Premium phai rat dang mua, nhung khong duoc tro thanh pay-to-win.
- Leaderboard phai thuong hoc that, khong thuong thao tac be mat.
- XP dung cho tien trinh va cam giac tien bo ca nhan.
- Ranked Score dung rieng cho bang xep hang va rule top 3.
- Premium Day Pass la co che aspiration + conversion, khong phai loophole phat premium vo toi va.

## 2. Product position can giu

STICK khong phai:

- app grind diem
- app ban loi the xep hang
- app dark pattern ep mua

STICK phai la:

- micro-learning product tao thoi quen hang ngay
- reward cho hoc tap co y nghia
- premium hoa bang gia tri cao hon, sau hon, dep hon, thong minh hon

Neu hy sinh fairness de doi lay conversion ngan han, STICK se mat:

- trust
- retention
- y nghia cua premium
- y nghia cua leaderboard

## 3. Strategic objective

### 3.1 Doanh thu

Muc tieu doanh thu khong phai la "ban them diem", ma la:

- tang conversion tu free sang premium
- tang retention cua premium
- tang perceived value ngay tu 3-7 ngay dau
- tao co che day-pass premium de free user duoc nem thu premium va muon giu lai

### 3.2 Cong bang

Leaderboard chi co y nghia neu:

- rank den tu verified learning
- khong the mua rank
- khong the spam rank
- khong the lam sai rank bang route ops / backfill / drift du lieu

### 3.3 Loi nhuan ben vung

Doanh thu tot nhat cho STICK den tu:

- premium aspiration
- premium habit lock-in
- premium day-pass taste loop
- premium identity/status

khong den tu:

- ban them XP
- tang cap premium de leo top nhanh hon
- mo rong quota reward cho premium theo kieu pay-to-progress

## 4. He thong can tach thanh 4 lop ro rang

### 4.1 `XP`

Dung cho:

- level
- progress ca nhan
- completion satisfaction
- identity progression

Khong dung truc tiep cho:

- quyet dinh top 3
- grant premium day-pass

### 4.2 `Ranked Score`

Dung cho:

- daily leaderboard
- weekly leaderboard neu can
- xac dinh top 3
- grant / revoke premium day-pass

Khong dung cho:

- level ca nhan
- premium thanh toan

### 4.3 `Premium Entitlement`

Gom 2 loai:

- `paid_premium`
- `day_pass_premium`

Ca hai cung mo cung bo feature, nhung `day_pass_premium` co quota hop ly de bao ve margin.

### 4.4 `Anti-Cheat / Abuse Control`

La lop truoc va sau reward:

- chan event khong hop le truoc khi ghi diem
- danh dau event / account dang nghi sau khi ghi
- loai bo event nghi van khoi rank neu can
- khoa khong cho grant top 3 neu account dang bi flag

## 5. Monetization strategy

### 5.1 Premium value proposition

Premium phai ban 4 nhom gia tri lon:

1. Hoc sau hon
2. Hoc dep hon
3. Hoc thong minh hon
4. Co vi the hon

### 5.2 Free vs Premium matrix

| Khu vuc | Free | Premium |
| --- | --- | --- |
| Journal + AI rewrite | Co | Co |
| Feedback explanation sau | Han che | Day du |
| Alternative phrasings | Han che | Day du |
| Voice / shadowing mode | Co ban | Nhanh, cham, segment replay, accent coach |
| Smart review | Co ban | Day du, uu tien theo memory weakness |
| Weekly growth report | Khong hoac rat it | Day du |
| Mistake memory | Khong hoac rat it | Day du |
| Premium lesson packs | Khong | Co |
| Premium profile / badge / visual identity | Khong | Co |
| Premium analytics ve tien bo | Khong | Co |
| Rank fairness | Nhu nhau | Nhu nhau |

Nguyen tac quan trong:

- Premium khong nhan diem nhanh hon chi vi tra tien.
- Premium duoc hoc tot hon, nhanh hieu hon, co trai nghiem cao cap hon.

### 5.3 Conversion loop

Premium conversion nen dua tren 5 trigger:

1. Sau feedback dau tien: lock mot phan premium insight.
2. Sau 2-3 ngay lien tiep: nhac ve premium de giu nhip hoc.
3. Sau mot ngay duoc day-pass premium: mo man loss-aversion hop le, nhac nhung feature user vua trai nghiem.
4. Khi user gan top 3: nhac rang premium giup hoc sau hon, nhung khong ban rank.
5. Khi user co dau hieu hoc nghiem tuc: upsell goi thang / nam.

### 5.4 Day-pass premium la growth loop

Top 3 khong chi la reward. No la growth loop:

- tao aspiration
- tao social proof
- tao free premium tasting
- tao loss loop hop le khi het han

Vi vay, day-pass premium phai duoc thiet ke rat ky, khong duoc grant bang metric co the spam.

## 6. Leaderboard strategy

### 6.1 Khong dung `XP` de xep hang

Ly do:

- XP co the duoc toi uu cho progress satisfaction
- XP co the co bonus achievement, completion, identity
- XP co the co bucket phuc vu habit

Neu dung chung XP cho rank, reward economy se bi trieng theo gaming.

### 6.2 Tao `Ranked Score` rieng

`Ranked Score` la diem leaderboard, chi tinh tu verified learning events.

Nhom event duoc phep dong gop vao rank:

- `journal_verified`
- `feedback_verified`
- `lesson_verified`
- `vocab_recall_verified`
- `practice_verified`
- tuy chon: `next_day_return_verified` voi trong so rat nho, neu can

Nhom event khong duoc dong gop vao rank:

- `journal_draft_saved`
- `phrase_saved`
- `vocab_added_manual`
- `feedback_vocab_imported`
- `admin_adjustment`
- `backfill`
- bat ky event nao dang co `integrityFlag != clear`

### 6.3 Daily leaderboard la chinh

De support rule top 3 premium, leaderboard chinh nen la leaderboard theo ngay VN.

Co the co them weekly leaderboard cho social layer, nhung top 3 premium chi nen dua tren daily leaderboard vi:

- de kiem soat cost
- tao vong lap quay lai hang ngay
- giu tinh micro-learning

### 6.4 Top 3 Premium Day Pass rule

Rule chinh:

1. He thong chot daily leaderboard luc `00:05 Asia/Ho_Chi_Minh`.
2. Top 3 cua ngay `D-1` duoc cap `Premium Day Pass` cho ngay `D`.
3. Day-pass co hieu luc tu `00:05` den `23:59:59` ngay `D`.
4. Sang ngay `D+1`, neu user van top 3 thi gia han them 1 ngay.
5. Neu user khong con top 3 thi day-pass het hieu luc.

Rule bo sung bat buoc:

- chi account `eligible_for_rank = true` moi duoc tranh top 3
- account co abuse flag nghiem trong bi loai khoi grant day-pass
- event ops / admin / backfill khong bao gio tinh vao rank
- tie-break phai ro rang va deterministic

### 6.5 Tie-break rule

Thu tu tie-break de xep hang:

1. `rankedScore` cao hon
2. `verifiedLearningMinutes` cao hon
3. `qualityScore` cao hon
4. `lastRankedEventAt` som hon
5. `accountCreatedAt` som hon

Muc dich:

- tranh dong hang mo ho
- tranh tinh trang spam event cuoi ngay de vuot len bang mot exploit re

## 7. Rule engine overview

De xuat mot engine trung tam co 4 module:

1. `RewardEngine`
2. `RankEngine`
3. `EntitlementEngine`
4. `AbuseEngine`

### 7.1 `RewardEngine`

Trach nhiem:

- validate event co hop le de cap XP hay khong
- ap cap theo bucket
- dam bao idempotency
- ghi ledger
- update aggregate XP atomic

### 7.2 `RankEngine`

Trach nhiem:

- tinh `Ranked Score` tu verified event
- ap rank caps
- loai event nghi van
- build daily leaderboard materialized view

### 7.3 `EntitlementEngine`

Trach nhiem:

- xac dinh account dang co `paid_premium`, `day_pass_premium`, hay `free`
- cap / gia han / huy `day_pass_premium`
- enforce entitlement tren lesson / feature premium

### 7.4 `AbuseEngine`

Trach nhiem:

- validate pre-award
- detect anomaly post-award
- gan flag cho event / account
- co che exclude khoi rank / grant neu can

## 8. Data model de xuat

### 8.1 `RewardLedger`

Moi dong tuong ung voi 1 rewardable event cho XP.

Field de xuat:

- `id`
- `userId`
- `eventType`
- `sourceType`
- `sourceId`
- `amount`
- `bucket`
- `dayKey`
- `idempotencyKey`
- `integrityStatus` = `clear | pending_review | excluded`
- `metadata`
- `createdAt`

Rule:

- `idempotencyKey` unique
- `amount` co the bang `0`, nhung van co the ghi neu can audit

### 8.2 `RankLedger`

Moi dong tuong ung voi 1 rankable event.

Field de xuat:

- `id`
- `userId`
- `eventType`
- `sourceType`
- `sourceId`
- `rankedPoints`
- `dayKey`
- `idempotencyKey`
- `integrityStatus`
- `qualityScore`
- `verifiedLearningMinutes`
- `createdAt`

### 8.3 `DailyUserAggregate`

Aggregate theo user + dayKey:

- `xpEarned`
- `rankedScore`
- `journalXp`
- `lessonXp`
- `reviewXp`
- `practiceXp`
- `journalRanked`
- `lessonRanked`
- `reviewRanked`
- `practiceRanked`
- `verifiedLearningMinutes`
- `integrityState`

### 8.4 `PremiumGrant`

Field de xuat:

- `id`
- `userId`
- `grantType` = `paid | day_pass_top3 | admin`
- `startsAt`
- `endsAt`
- `sourceDayKey`
- `sourceRank`
- `status` = `active | expired | revoked`
- `reason`

### 8.5 `AbuseFlag`

Field de xuat:

- `id`
- `userId`
- `scope` = `event | day | account`
- `severity` = `low | medium | high | critical`
- `code`
- `sourceId`
- `dayKey`
- `details`
- `status` = `open | reviewed | dismissed | confirmed`
- `createdAt`

## 9. Rule engine cu the cho `XP`

### 9.1 Nguyen tac

- XP dung cho progress, khong dung de grant top 3.
- XP phai den tu event da du bang chung hoc tap.
- Collection action khong duoc co XP.
- XP cap theo bucket va global cap.

### 9.2 Global XP caps

De xuat:

- `GLOBAL_DAILY_XP_CAP = 100`
- `JOURNAL_DAILY_XP_CAP = 15`
- `LESSON_DAILY_XP_CAP = 40`
- `REVIEW_DAILY_XP_CAP = 25`
- `PRACTICE_DAILY_XP_CAP = 20`

Achievement XP la bucket rieng, chi mo khi event nguon hop le.

### 9.3 XP event rules

#### A. Journal

| Event | Dieu kien | XP | Bucket |
| --- | --- | --- | --- |
| `journal_verified` | Journal submit hop le, do dai dat nguong, feedback tao thanh cong, chua reward journal nay | `10` | `journal` |

Khong co XP cho:

- save draft
- patch noi dung draft
- mo journal

#### B. Lesson

| Event | Dieu kien | XP | Bucket |
| --- | --- | --- | --- |
| `lesson_first_completion_verified` | Score duoc server recompute, qua nguong, first complete | `15` | `lesson` |
| `lesson_high_score_bonus` | First completion va score `>= 90` | `+3` | `lesson` |
| `lesson_review_verified` | Review hop le, toi da 1 lan / lesson / day | `6` | `lesson` |

Rule bo sung:

- Review thu 2 tro di trong cung lesson / ngay = `0 XP`
- Neu lesson premium, chi account co entitlement moi duoc reward

#### C. Vocabulary recall

| Event | Dieu kien | XP | Bucket |
| --- | --- | --- | --- |
| `vocab_first_recall_verified` | Item due, answer dung, lan reward dau tien cua item | `4` | `review` |
| `vocab_due_recall_verified` | Item due, answer dung, khong phai lan dau | `2` | `review` |

Khong co XP cho:

- add vocab manual
- save phrase
- import vocab tu AI

#### D. Practice

| Event | Dieu kien | XP | Bucket |
| --- | --- | --- | --- |
| `grammar_practice_verified` | `accuracy >= 60%`, `duration >= 90s`, toi da 2 session / day | `5` | `practice` |
| `listening_practice_verified` | `accuracy >= 60%`, `duration >= 90s`, toi da 2 session / day | `5` | `practice` |
| `reading_practice_verified` | Chi bat khi co comprehension evidence that | `4` | `practice` |
| `speaking_practice_verified` | Chi bat khi co transcript / scoring hop le | `5` | `practice` |

#### E. Achievement

Chi unlock neu event nguon `integrityStatus = clear`.

Achievement reward goi y:

- one-time milestone, khong qua lon
- khong duoc dua tren collection counts de tranh farm

### 9.4 XP khong duoc grant cho nhung event sau

- `journal_draft_saved`
- `phrase_saved`
- `vocab_added_manual`
- `feedback_vocab_imported`
- `reading_opened`
- `lesson_opened`
- `premium_unlocked`
- `day_pass_granted`

## 10. Rule engine cu the cho `Ranked Score`

### 10.1 Nguyen tac

- Rank chi doc tu `RankLedger`.
- Chi verified learning event moi vao `RankLedger`.
- Rank khong doc tu cache `User.totalXp`.
- Rank khong doc tu aggregate duoc backfill tay.

### 10.2 Global Ranked caps

De xuat:

- `GLOBAL_DAILY_RANKED_CAP = 60`
- `JOURNAL_DAILY_RANKED_CAP = 12`
- `LESSON_DAILY_RANKED_CAP = 24`
- `REVIEW_DAILY_RANKED_CAP = 16`
- `PRACTICE_DAILY_RANKED_CAP = 12`

Rank cap thap hon nhu vay de leaderboard kho bi keo vo ly bang volume.

### 10.3 Ranked event rules

#### A. Journal

| Event | Dieu kien | Ranked Score |
| --- | --- | --- |
| `journal_verified` | Nhu XP rule | `8` |
| `feedback_verified` | Feedback da tao cho journal verified | `4` |

Moi journal toi da `12 ranked points`.

#### B. Lesson

| Event | Dieu kien | Ranked Score |
| --- | --- | --- |
| `lesson_first_completion_verified` | Score duoc server recompute, score `>= 60` | `12` |
| `lesson_high_score_bonus` | Score `>= 90` | `+3` |
| `lesson_review_verified` | Toi da 1 lan / lesson / day | `5` |

Moi lesson / ngay toi da `15 ranked points`.

#### C. Vocabulary recall

| Event | Dieu kien | Ranked Score |
| --- | --- | --- |
| `vocab_first_recall_verified` | Item due, dung | `3` |
| `vocab_due_recall_verified` | Item due, dung | `1` |

#### D. Practice

| Event | Dieu kien | Ranked Score |
| --- | --- | --- |
| `grammar_practice_verified` | Nhu XP rule | `4` |
| `listening_practice_verified` | Nhu XP rule | `4` |
| `reading_practice_verified` | Neu co comprehension gate that | `3` |
| `speaking_practice_verified` | Neu co scoring hop le | `4` |

### 10.4 Co che quality multiplier

`Ranked Score` co the dung quality multiplier nho, nhung khong de overpower.

De xuat:

- `qualityMultiplier = 1.0` neu dat nguong toi thieu
- `qualityMultiplier = 1.1` neu score / quality rat cao

Khong nen qua `1.1` de tranh tao gap rank qua lon.

### 10.5 Event nao bi exclude khoi rank

Mot event se khong vao `RankLedger` neu:

- account dang co `high` / `critical` abuse flag mo
- event fail idempotency
- event fail entitlement gate
- event bi mark la duplicate content
- event bi mark la too_fast
- event bi mark la suspicious_parallel_spike

## 11. Rule engine cu the cho `Premium Day Pass`

### 11.1 Muc tieu

`Premium Day Pass` khong phai reward random. No phai la growth mechanism co tinh toan:

- cho user trai nghiem premium
- tao aspiration cho ca cong dong
- tang conversion sau khi day-pass ket thuc

### 11.2 Grant rule

Moi ngay luc `00:05 Asia/Ho_Chi_Minh`:

1. Freeze leaderboard cua ngay hom truoc.
2. Lay top 3 account `eligible_for_rank = true`.
3. Tao `PremiumGrant(grantType = day_pass_top3)` cho 3 account do.
4. Neu account da co `paid_premium`, khong can grant them; thay vao do ghi `premiumBonusDayWon` de phuc vu social / analytics.

### 11.3 Revoke / expiry rule

`Premium Day Pass`:

- tu dong het han cuoi ngay
- khong can revoke tay neu simply khong con top 3
- neu account bi confirm abuse trong ngay, co the revoke som

### 11.4 Feature scope cua day-pass

Day-pass nen mo phan lon premium value, nhung co quota hop ly:

- mo premium lesson access trong ngay
- mo feedback explanation sau
- mo premium voice mode
- mo premium report / profile treatment
- quota AI / TTS hop ly de bao ve margin

### 11.5 Top 3 eligibility rule

Account chi duoc tranh top 3 neu dat tat ca:

- `status = active`
- khong bi ban / suspended
- khong co `critical abuse flag`
- co it nhat `2 verified learning events` trong ngay
- co it nhat `1 journal_verified` hoac `1 lesson_first_completion_verified` trong ngay
- account age `>= 3 ngay` hoac vuot qua trust threshold

Ly do:

- chan alt-account moi tao nhay top de an premium free
- buoc user phai hoc that thay vi farm mot event duy nhat

### 11.6 Low-volume safeguard

Neu ngay nao tong so account `eligible_for_rank` qua thap, vi du `< 20`, co 2 lua chon:

1. Van grant top 3, nhung ghi nhan ngay low-volume de theo doi margin.
2. Chi grant neu top 3 dat nguong `minimumRankedScore`, vi du `>= 18`.

Toi khuyen cach 2 de tranh premium bi cap qua de trong giai doan DAU thap.

## 12. AbuseEngine - dieu kien chong spam / gian lan

### 12.1 Bat buoc ky thuat

Moi rewardable / rankable event bat buoc co:

- `idempotencyKey`
- `sourceType`
- `sourceId`
- `dayKey`
- `serverVerifiedAt`

Khong co bo nay thi event khong duoc cap diem.

### 12.2 Abuse checks truoc khi ghi diem

Pre-award validation bat buoc:

1. `duplicate_event_check`
2. `entitlement_check`
3. `bucket_cap_check`
4. `global_cap_check`
5. `content_quality_check`
6. `duration_check`
7. `server_recompute_check`
8. `eligibility_check`

### 12.3 Abuse flag list

Code de xuat:

- `duplicate_idempotency`
- `suspicious_parallel_spike`
- `too_fast`
- `client_score_mismatch`
- `repeated_same_lesson_farm`
- `duplicate_content_journal`
- `excessive_same_ip_cluster`
- `fresh_account_rank_surge`
- `backfill_attempt`
- `premium_gate_bypass_attempt`

### 12.4 Journal anti-abuse

Journal chi duoc verify neu:

- do dai dat nguong (`>= 60 ky tu` hoac `>= 15 tu`)
- similarity voi 3 journal gan nhat < threshold, vi du `< 0.9`
- khong phai copy-paste lap lai y nguyen
- feedback da tao thanh cong

Neu fail:

- journal van ton tai
- nhung `0 XP`, `0 Ranked Score`
- co the gan `duplicate_content_journal`

### 12.5 Lesson anti-abuse

Bat buoc:

- backend recompute score tu dap an
- khong tin `score` client gui
- `timeSpent` phai la server-observed hoac server-bounded, khong chi doc body client
- moi lesson chi `1 rewardable review / day`
- review lan 2 tro di = `0 XP`, `0 Ranked Score`

Neu validate endpoint can tra ket qua tung cau, khong nen lo full `correctAnswer` som theo cach scriptable.

### 12.6 Practice anti-abuse

Bat buoc:

- phai dat accuracy threshold
- phai dat minimum duration
- phai co toi da `2 rewardable session / type / day`
- reading phai co comprehension signal truoc khi bat rank/xp
- speaking phai co transcript / scoring signal truoc khi bat rank/xp

### 12.7 Account-level anti-abuse

Neu account co mot trong cac dau hieu sau, khong duoc top 3 cho den khi reviewed:

- tang rank dot bien bat thuong trong thoi gian ngan
- nhieu request song song vuot nguong
- nhieu account moi tu cung IP / device fingerprint cluster
- pattern event lap lai qua co hoc
- mismatch lon giua UI flow hop le va API event sequence

## 13. API / job flow de xuat

### 13.1 Rewardable event flow

```text
Client action
-> API receives event
-> Server validates evidence
-> AbuseEngine pre-check
-> RewardEngine computes XP
-> RankEngine computes ranked score
-> Single transaction writes ledgers + aggregates
-> Response returns only server-confirmed totals
```

### 13.2 Daily leaderboard close job

Job: `FinalizeDailyLeaderboardJob`

Chay luc `00:05 Asia/Ho_Chi_Minh`:

1. freeze `RankLedger` cua `D-1`
2. build `DailyLeaderboardSnapshot`
3. apply tie-break
4. grant top 3 day-pass
5. log analytics / ops summary

### 13.3 Premium expiry job

Job: `ExpirePremiumDayPassJob`

- chay moi 15 phut hoac cung luc finalize
- mark `PremiumGrant.status = expired` neu het han

## 14. UI/UX requirements de support monetization ma khong pha fairness

### 14.1 Premium phai thay duoc, nhung khong duoc ban rank

UI can co:

- premium badge ro rang
- premium locked insight de user thay gia tri
- day-pass banner ro rang "Ban dang duoc trai nghiem Premium hom nay"
- end-of-day conversion modal cho day-pass users

UI khong duoc co:

- thong diep giai nghia premium = len top nhanh hon
- thong diep giai nghia premium = duoc them diem

### 14.2 Leaderboard UI

Can hien ro:

- `Ranked Score` la diem xep hang hom nay
- premium day-pass cua top 3 la reward cong dong
- chi verified learning moi tinh rank

Nen co copy giai thich nhe:

- "Save vocab khong tang rank"
- "Chi hoat dong hoc da xac thuc moi tinh vao bang xep hang"

### 14.3 Premium day-pass end screen

Cuoi ngay, neu user dang co day-pass:

- show nhung premium feature da dung
- show premium report mini
- show CTA giu lai premium de tiep tuc hoc sau hon vao ngay mai

## 15. Analytics can track

### 15.1 Monetization

- `premium_paywall_view`
- `premium_trial_like_exposure`
- `premium_day_pass_granted`
- `premium_day_pass_feature_used`
- `premium_day_pass_expired`
- `premium_conversion_after_day_pass`
- `premium_retention_d7`

### 15.2 Leaderboard

- `ranked_event_accepted`
- `ranked_event_rejected`
- `leaderboard_snapshot_finalized`
- `leaderboard_top3_granted`
- `leaderboard_top3_revoked`

### 15.3 Abuse

- `abuse_flag_created`
- `abuse_flag_confirmed`
- `ranked_event_excluded`
- `premium_grant_blocked_abuse`

## 16. Rollout plan

### Phase 0 - Chan lo hong ngay

1. Khoa `progress/backfill` thanh admin-only.
2. Bo reward cho manual collection actions.
3. Dung local fallback XP tren lesson UI.
4. Khoa rank khong doc tu XP aggregate cu.

### Phase 1 - Dung rule engine toi thieu

1. Tao `RewardLedger`, `RankLedger`, `PremiumGrant`, `AbuseFlag`.
2. Implement `RewardEngine` + `RankEngine` voi idempotency.
3. Chuyen lesson sang server-recomputed score.
4. Grant top 3 premium day-pass bang daily snapshot.

### Phase 2 - Monetization polish

1. Premium paywall dung thong diep aspiration.
2. Day-pass end-of-day conversion flow.
3. Premium status visual treatment tren profile / leaderboard.
4. Premium intelligence features.

### Phase 3 - Anti-abuse nang cao

1. similarity detection cho journal
2. account trust score
3. IP / device cluster heuristics
4. anomaly review dashboard

## 17. Acceptance criteria

Spec nay chi duoc xem la dat neu co the dam bao:

- Premium khong lam tang toc do len top.
- Top 3 premium duoc cap bang `Ranked Score`, khong bang XP tong.
- User khong the kiem rank bang save draft, save phrase, add vocab, import vocab.
- Lesson reward va rank duoc server tinh lai.
- Event retry / duplicate / race khong the double reward.
- Account co flag abuse khong duoc grant top 3 premium.
- Day-pass premium co gia tri du de kich thich conversion, nhung cost duoc kiem soat.
- UI khong hien premium nhu cong cu pay-to-win.

## 18. Quyet dinh de xuat de duyet

De chot huong di, can duyet 8 quyet dinh sau:

1. Tach `XP` khoi `Ranked Score`.
2. Day-pass premium chi grant theo daily top 3 leaderboard.
3. Premium khong duoc them XP multiplier hay rank multiplier.
4. Manual collection actions = `0 XP`, `0 Ranked Score`.
5. Lesson phai server-authoritative truoc khi tinh reward / rank.
6. Rank chi doc tu `RankLedger` verified.
7. Account co abuse flag nghiem trong khong duoc nhan day-pass.
8. Premium conversion phai dua tren aspiration + tasting + value, khong dua tren ban loi the xep hang.

## 19. Ket luan

Neu muc tieu cuoi la toi da hoa doanh thu ma van giu y nghia san pham, STICK can di theo cau truc sau:

- Premium rat dang mua
- Leaderboard rat cong bang
- Anti-cheat rat chat
- XP va Ranked Score tach nhau
- Top 3 premium tro thanh growth loop, khong phai loophole

Huong nay cho phep STICK dong thoi dat 3 muc tieu:

1. user muon mua premium
2. user khong de farm rank bang spam
3. bang xep hang va premium cung tang gia tri cho nhau, thay vi pha nhau
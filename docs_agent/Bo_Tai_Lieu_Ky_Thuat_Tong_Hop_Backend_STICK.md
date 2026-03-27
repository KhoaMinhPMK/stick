# BO TAI LIEU KY THUAT TONG HOP - STICK

Cap nhat: 2026-03-27  
Phien ban: V1.1 (bo sung theo cap nhat route/frontend moi + admin planning docs)

## 1) Muc tieu tai lieu

Tai lieu nay la ban tong hop ky thuat day du de lam nen backend cho STICK, dung de trien khai that ngay sau giai doan planning.

- Chuan API theo Swagger/OpenAPI (`/api/v1`).
- Tich hop dang nhap Firebase (Google + Facebook).
- Dung Groq API lam AI engine chinh.
- Dat muc tieu san sang production tren VPS Windows + IIS.
- Co kha nang mo rong cho 1000 nguoi dung dong thoi (peak) va 100k MAU.

## 2) Hien trang du an (repo truth)

### 2.1 Frontend da co nhieu flow

`frontend/src/App.tsx` dang dieu huong theo hash-route va da co cac man:

- Landing
- Onboarding 1-4
- Level selection
- Practice schedule
- Goal selection
- Save progress
- Register
- Login
- Dashboard
- Journal
- Journal record
- Journal workspace
- Feedback
- Feedback result
- Speaking intro
- Vocabulary review
- Progress
- History list
- History detail
- Completion
- Profile
- Settings
- Reminders
- Library
- Loading / Error
- Lesson detail
- Edit profile
- Saved phrases
- Vocab notebook
- Forgot password
- Achievements
- Notifications
- Terms / Privacy / Help / About
- Reading mode
- Grammar practice
- Listening practice
- Speaking report
- Daily challenge
- Leaderboard
- Journal archive

### 2.2 Backend hien tai chua co code nghiep vu

Dang co khung thu muc:

- `backend/src/config`
- `backend/src/controllers`
- `backend/src/middlewares`
- `backend/src/models`
- `backend/src/routes`
- `backend/src/services`
- `backend/src/types`

=> Ket luan: can xay backend moi theo contract-first va map truc tiep theo cac flow frontend hien co.

### 2.3 Tai lieu Admin da duoc bo sung

Repo da co 2 file plan admin moi:

- `docs_agent/Admin_Web_Implementation_Plan.md`
- `docs_agent/Admin_Web_Implementation_Plan_Detailed.md`

=> Can bo sung module API admin vao backend roadmap de support van hanh prompt, metrics, logs.

## 3) Nguyen tac kien truc tong the

## 3.1 Kien truc de xuat

- Frontend: React + Vite (hash routing, se chuyen sang consume API that)
- Backend API: Node.js + TypeScript + Express/Fastify (de nghi Fastify neu uu tien perf)
- DB chinh: MySQL
- Cache/Queue: Redis
- Auth: Firebase Auth (Google/Facebook) + App JWT noi bo
- AI: Groq API (model routing theo task)
- Reverse proxy: IIS (ARR + URL Rewrite)
- Process app: PM2 hoac NSSM/chay service rieng cho API va Worker

## 3.2 Nguyen tac phat trien bat buoc

- API-first: OpenAPI la source of truth.
- Clean layering: `controller -> usecase/service -> repository`.
- Validation truoc domain (schema validation cho request).
- Error envelope thong nhat.
- Idempotency cho endpoint co side effect.
- Cursor pagination cho endpoint list lon.
- Audit + observability ngay tu dau.
- AI output bat buoc JSON schema versioned.

## 4) User flows chinh can backend hoa

## 4.1 Guest -> Dang nhap -> Nang cap tai khoan

1. User vao app voi guest session.
2. User luu du lieu onboarding/journal o che do guest.
3. User dang nhap Firebase (Google/Facebook).
4. Backend verify Firebase ID token.
5. Backend cap App JWT + refresh token.
6. Merge du lieu guest vao user account (khong mat data).

## 4.2 Onboarding -> Muc tieu -> Dashboard

1. User qua cac man onboarding.
2. Chon level, lich hoc, goal.
3. Luu profile hoc tap.
4. Danh dau onboarding complete.
5. Dashboard dung du lieu tong hop.

## 4.3 Journal -> AI Feedback -> History/Progress

1. User tao journal/nhat ky.
2. Goi AI feedback (sync hoac async tuy do dai/noi dung).
3. Luu feedback co cau truc vao DB.
4. Cap nhat progress aggregate.
5. Hien thi history chi tiet va tong quan tien do.

## 4.4 Speaking Intro -> Danh gia noi

1. User vao speaking practice.
2. Upload/submit audio.
3. STT + cham diem + goi y hoc tap.
4. Ket qua luu vao history/progress.

## 4.5 Profile nang cao -> Phrasebook -> Notification

1. User sua profile (`#edit-profile`), cap nhat avatar/bio/native language.
2. User luu cum tu/tu vung (`#saved-phrases`, `#vocab-notebook`).
3. He thong day notification theo su kien (streak, feedback xong, achievement).
4. User co the mark read tung thong bao hoac mark all.

## 4.6 Learning mode mo rong (Reading/Grammar/Listening/Speaking report)

1. User vao reading mode va click tu de tra nghia.
2. User luu tu moi tu reading vao notebook.
3. User lam bai grammar/listening theo session.
4. User xem speaking report chi tiet theo tung lan luyen noi.

## 4.7 Challenge + Leaderboard + Archive

1. He thong phat challenge moi theo ngay.
2. User tham gia challenge, nop bai, nhan diem.
3. Leaderboard cap nhat theo weekly/all-time.
4. Journal archive ho tro filter/search/bookmark/high score.

## 5) API catalog tong hop (Swagger / OpenAPI)

Tat ca endpoint dat duoi: `/api/v1`

## 5.1 Chuan response loi

```json
{
  "code": "STRING_ERROR_CODE",
  "message": "Human readable message",
  "details": {},
  "requestId": "req_..."
}
```

## 5.2 Auth APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| POST | `/auth/guest` | Tao guest session | Public |
| POST | `/auth/firebase/login` | Verify Firebase ID token, cap App JWT | Public |
| POST | `/auth/upgrade` | Merge guest data vao account | User |
| POST | `/auth/refresh` | Rotate access/refresh token | Refresh token |
| POST | `/auth/logout` | Revoke refresh token | User |
| GET | `/me` | Thong tin user + onboarding state | User |

## 5.3 Onboarding/Profile APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/onboarding/state` | Lay trang thai onboarding | User/Guest |
| PUT | `/onboarding/state` | Cap nhat tung buoc onboarding | User/Guest |
| POST | `/onboarding/complete` | Danh dau hoan tat onboarding | User/Guest |
| PUT | `/profile` | Cap nhat profile hoc tap | User |
| GET | `/settings` | Lay setting user | User |
| PUT | `/settings` | Cap nhat setting user | User |
| GET | `/reminders` | Lay reminder settings | User |
| PUT | `/reminders` | Cap nhat reminder settings | User |

## 5.4 Journal/History APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| POST | `/journals` | Tao journal | User/Guest |
| GET | `/journals` | Danh sach journal (cursor pagination) | User/Guest |
| GET | `/journals/{id}` | Chi tiet journal | User/Guest |
| PATCH | `/journals/{id}` | Sua journal | User/Guest |
| DELETE | `/journals/{id}` | Xoa mem journal | User/Guest |
| GET | `/history` | Danh sach lich su hoc | User |
| GET | `/history/{id}` | Chi tiet phien hoc | User |

## 5.5 AI APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| POST | `/ai/feedback/text` | Phan tich journal va feedback | User |
| POST | `/ai/speaking/evaluate` | Danh gia noi (co the async) | User |
| POST | `/ai/chat` | AI coach chat | User |
| GET | `/ai/jobs/{id}` | Theo doi trang thai async job | User |

## 5.6 Progress/Library APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/progress/summary` | Tong quan tien do | User |
| GET | `/progress/daily` | Tien do theo ngay | User |
| GET | `/library/lessons` | Danh sach bai hoc/tai nguyen | User |
| GET | `/library/lessons/{id}` | Chi tiet bai hoc | User |

## 5.7 Profile/Auth mo rong APIs (bo sung theo UI moi)

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/profile` | Lay chi tiet profile day du | User |
| PUT | `/profile` | Cap nhat ten, bio, native language, preference | User |
| POST | `/profile/avatar/presign` | Lay URL upload avatar (object storage) | User |
| POST | `/profile/avatar/commit` | Xac nhan avatar upload thanh cong | User |
| POST | `/auth/password/forgot` | Trigger forgot password flow (neu bat email/password) | Public |
| DELETE | `/account` | Yeu cau vo hieu hoa tai khoan (soft delete) | User |

Ghi chu: neu xac dinh chi dung social login Firebase, endpoint forgot password co the de optional va frontend goi truc tiep Firebase SDK.

## 5.8 Notifications/Achievements APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/notifications` | Lay thong bao cua user (cursor paging) | User |
| PATCH | `/notifications/{id}/read` | Danh dau da doc 1 thong bao | User |
| POST | `/notifications/read-all` | Danh dau da doc tat ca | User |
| GET | `/achievements` | Danh sach achievement + unlock state | User |
| GET | `/achievements/summary` | Tong hop progress achievement | User |

## 5.9 Phrasebook/Vocab/Dictionary APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/phrases` | Danh sach cum tu da luu (filter/search/category) | User |
| POST | `/phrases` | Luu cum tu moi | User |
| DELETE | `/phrases/{id}` | Xoa cum tu da luu | User |
| GET | `/vocab/notebook` | Lay danh sach tu vung + mastery | User |
| PATCH | `/vocab/notebook/{id}` | Cap nhat mastery/tag/note | User |
| POST | `/vocab/notebook/import` | Import tu tu AI feedback/journal | User |
| GET | `/dictionary/lookup` | Tra nghia tu (word lookup, co cache) | User |

## 5.10 Practice/Challenge/Leaderboard APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/challenges/daily/current` | Lay challenge hom nay | User |
| POST | `/challenges/daily/{id}/start` | Bat dau challenge | User |
| POST | `/challenges/daily/{id}/complete` | Nop ket qua challenge | User |
| GET | `/leaderboard` | Bang xep hang (`scope=weekly|all_time`) | User |
| GET | `/grammar/sessions/next` | Lay cau hoi grammar tiep theo | User |
| POST | `/grammar/sessions/{id}/answer` | Nop dap an grammar | User |
| GET | `/listening/sessions/next` | Lay bai listening tiep theo | User |
| POST | `/listening/sessions/{id}/answer` | Nop dap an listening | User |
| POST | `/speaking/sessions` | Tao speaking session moi | User |
| GET | `/speaking/sessions/{id}/report` | Lay bao cao speaking chi tiet | User |

## 5.11 Reading/Archive/Static content APIs

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/reading/articles` | Danh sach bai doc | User |
| GET | `/reading/articles/{id}` | Chi tiet bai doc | User |
| POST | `/reading/articles/{id}/word-save` | Luu tu trong reading mode | User |
| GET | `/journals/archive` | Archive journal (search/filter/sort) | User |
| POST | `/journals/{id}/bookmark` | Bookmark/unbookmark journal | User |
| GET | `/content/static/{slug}` | Terms/Privacy/Help/About (CMS) | Public |

## 5.12 Admin APIs (M8 Pilot Operations)

Prefix de xuat: `/api/v1/admin/*`

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| POST | `/admin/auth/login` | Dang nhap admin | Admin Public |
| POST | `/admin/auth/logout` | Dang xuat admin | Admin |
| GET | `/admin/metrics/cards` | Card tong quan pilot | Admin |
| GET | `/admin/metrics/funnel` | Funnel + retention | Admin |
| GET | `/admin/metrics/ai-health` | AI health/error rate | Admin |
| GET | `/admin/prompts` | Danh sach daily prompts | Admin |
| POST | `/admin/prompts` | Tao prompt | Admin |
| PUT | `/admin/prompts/{id}` | Sua prompt | Admin |
| DELETE | `/admin/prompts/{id}` | Xoa prompt | Admin |
| GET | `/admin/logs/ai-feedbacks` | Xem AI feedback logs | Admin |
| GET | `/admin/users` | Danh sach pilot users | Admin |
| GET | `/admin/users/{id}` | Chi tiet user + learning history | Admin |

## 5.13 Data persistence APIs (chi tiet luu du lieu theo tung user)

| Method | Path | Mo ta | Auth |
|---|---|---|---|
| GET | `/me/data-summary` | Tong hop nhanh du lieu cua user (journals, words, phrases, streak, achievements) | User |
| GET | `/me/export` | Export du lieu user (JSON/CSV async) | User |
| POST | `/me/export` | Tao export job | User |
| DELETE | `/me/data` | Yeu cau xoa/an danh du lieu theo policy | User |
| GET | `/journals/{id}/versions` | Lich su sua bai viet | User |
| POST | `/journals/{id}/autosave` | Luu nhap tu dong cho bai viet dang soan | User |
| GET | `/learning/words` | Danh sach tu da hoc cua user (tong hop tu notebook + review events) | User |
| POST | `/learning/words` | Them tu da hoc thu cong | User |
| PATCH | `/learning/words/{id}` | Cap nhat trang thai hoc (new/learning/mastered) | User |
| POST | `/learning/words/{id}/review` | Ghi nhan 1 lan on tap va ket qua | User |

## 6) Thiet ke du lieu MySQL (ban tong hop)

## 6.1 Bang cot loi

- `users`
- `auth_identities` (firebase uid, provider, linked_at)
- `sessions`
- `refresh_tokens`
- `guest_identities` (neu tach rieng)
- `onboarding_profiles`
- `goals`
- `reminders`
- `journals`
- `journal_feedbacks` (AI feedback)
- `speaking_records`
- `speaking_scores`
- `progress_daily`
- `progress_aggregates`
- `ai_jobs`
- `ai_usage_logs`
- `audit_logs`
- `event_logs`
- `notifications`
- `achievement_definitions`
- `user_achievements`
- `saved_phrases`
- `vocab_notebook_items`
- `vocab_review_events`
- `learning_words`
- `learning_word_reviews`
- `dictionary_cache`
- `daily_challenges`
- `daily_challenge_attempts`
- `leaderboard_snapshots`
- `grammar_questions`
- `grammar_attempts`
- `listening_exercises`
- `listening_attempts`
- `reading_articles`
- `reading_word_saves`
- `journal_bookmarks`
- `static_contents`
- `admin_users`
- `admin_sessions`
- `admin_audit_logs`
- `data_export_jobs`
- `journal_drafts`
- `journal_versions`

## 6.2 Quy tac thiet ke DB

- Primary key de nghi ULID.
- Tat ca cot thoi gian dung UTC.
- Soft delete cho bang nghiep vu (`deleted_at`).
- Unique index cho identity (`provider + provider_uid`).
- Index truy van chinh:
- `(user_id, created_at DESC)` cho journals/history.
- `(status, created_at)` cho job queue.
- `(user_id, day)` cho progress_daily.
- Tach log table va partition theo thang neu volume lon.

## 6.3 Index/partition bo sung cho module moi

- Notifications: index `(user_id, read, created_at DESC)`.
- Saved phrases: index `(user_id, category, created_at DESC)` + fulltext cho `phrase`.
- Vocab notebook: index `(user_id, mastery, updated_at DESC)`.
- Journal archive search: fulltext index cho `title, content`.
- Leaderboard: materialized snapshot theo `period_type + period_start`.
- Admin logs: partition theo thang, index `(created_at DESC, error_type)`.

## 6.4 Data ownership map (bat buoc de luu theo tung nguoi dung)

Tat ca bang nghiep vu ben duoi bat buoc co `user_id` (hoac `owner_user_id`) va ownership check trong service layer:

| Domain | Bang | Khoa ownership | Luu y |
|---|---|---|---|
| User profile | `users`, `onboarding_profiles`, `goals`, `reminders` | `user_id` | 1 user co 1 profile hoc tap |
| Journaling | `journals`, `journal_drafts`, `journal_versions`, `journal_feedbacks`, `journal_bookmarks` | `user_id` | Ho tro autosave + version history |
| Vocabulary | `saved_phrases`, `vocab_notebook_items`, `learning_words`, `learning_word_reviews`, `vocab_review_events` | `user_id` | Theo doi tien do hoc tu vung theo tung user |
| Speaking | `speaking_records`, `speaking_scores` | `user_id` | Moi ban ghi audio/report thuoc dung user |
| Progress | `progress_daily`, `progress_aggregates`, `user_achievements` | `user_id` | Snapshot de render dashboard nhanh |
| Notifications | `notifications` | `user_id` | Read status rieng theo user |
| Security/Audit | `sessions`, `refresh_tokens`, `audit_logs` | `user_id` | Truy vet session va hanh vi nhay cam |

Nguyen tac: khong co query nao duoc doc/ghi du lieu user ma khong filter theo `user_id`.

## 6.5 Chi tiet luu bai viet va tu vung (de implementation khong mo ho)

### 6.5.1 Bai viet (Journal persistence)

- `journals`:
- Truong toi thieu: `id`, `user_id`, `title`, `content_raw`, `language`, `status(draft/submitted)`, `score`, `created_at`, `updated_at`, `deleted_at`.
- `journal_drafts`:
- Luu autosave theo `journal_id`, `draft_content`, `saved_at`.
- `journal_versions`:
- Luu moi ban sua quan trong (`version_no`, `content_snapshot`, `change_note`, `created_at`) de rollback va history-detail.
- `journal_feedbacks`:
- Luu output AI co schema version (`schema_version`, `feedback_json`, `model`, `latency_ms`, `token_usage`).

### 6.5.2 Tu vung da hoc theo tung user

- `vocab_notebook_items`:
- Tu user chu dong luu (word, meaning, example, tag, mastery).
- `learning_words`:
- Bang chuan hoa "tu da hoc" cua user, gom cac nguon: notebook, reading mode, AI feedback extraction.
- Truong toi thieu: `id`, `user_id`, `lemma`, `surface_form`, `pos`, `cefr_level`, `status(new/learning/mastered)`, `source_type`, `source_ref_id`, `first_seen_at`, `last_reviewed_at`.
- `learning_word_reviews`:
- Moi lan user on tap 1 tu: `is_correct`, `response_time_ms`, `reviewed_at`.
- Rule aggregate:
- Mastery score tinh tu review events (SM-2 de nghi cho phase 2), cap nhat vao `learning_words.status`.
- De-dup:
- Unique key de nghi: `(user_id, lemma, source_type, source_ref_id nullable)`.

## 7) Thiet ke AI voi Groq (tong hop day du)

## 7.1 Muc tieu AI trong STICK

- Feedback chat luong cao cho journal.
- Speaking evaluation co cham diem + de xuat cai thien.
- AI coach support theo profile, goal, lich hoc.

## 7.2 Model routing de xuat

- Nhom model reasoning manh cho feedback/chat chinh.
- Nhom model nhanh/chi phi thap cho task ngan, de tai cao.
- Model guard/moderation de loc input-output.
- STT model cho speaking pipeline.

Luu y: ten model cu the lock bang config va xac nhan theo Groq docs tai thoi diem implement.

## 7.3 Toi uu context

- Context 3 lop:
- Lop 1: system prompt + rubric co dinh (cache duoc).
- Lop 2: user profile summary (muc tieu, level, preferences).
- Lop 3: recent artifacts (journal gan day, ket qua speaking gan day).
- Gioi han token theo tung loai request.
- Prompt caching cho phan prefix bat bien.
- Rolling summary de tranh context phong to.
- Structured output JSON schema versioned.

## 7.4 Luong xu ly AI

- Sync path: task ngan, muc tieu p95 nhanh.
- Async path: speaking dai, job queue + polling status.
- Retry co gioi han, timeout ro rang, circuit breaker.
- Fallback strategy:
- Chuyen model tier thap hon khi qua tai.
- Rut gon context truoc khi fail hard.
- Tra ket qua dang processing neu queue cao.

## 7.5 1000 concurrent users

- Dung queue trung tam + worker autoscale theo queue depth.
- Dat nguong in-flight requests cho moi instance.
- Admission control theo user-tier/endpoint.
- Rate-limit theo `IP + user + endpoint class`.
- Tach endpoint AI nang sang async.
- Muc tieu SLO:
- Chat/feedback p95 nhanh (duoi nguong da cam ket).
- Speaking async p95 trong khung thoi gian chap nhan.

## 7.6 AI bo sung cho cac man moi

- Reading mode: dictionary lookup cache-first, fallback AI explanation khi khong co tu dien.
- Grammar/listening: scoring engine tra JSON schema de render ket qua UI.
- Phrase extraction: tach cum tu tu journal/feedback vao `saved_phrases` theo confidence threshold.
- Achievement trigger: AI event khong duoc cap diem truc tiep, chi phat event; scoring business rule nam o backend core.

## 8) Bao mat va van hanh production

## 8.1 AuthN/AuthZ

- Verify Firebase token bang Firebase Admin SDK.
- Cap App JWT access ngan han + refresh rotation.
- Revoke va blacklist refresh token khi logout/compromised.
- Phan quyen theo role + ownership check.

## 8.2 Security controls

- HTTPS only.
- Helmet/CORS/chong injection/chong payload bat thuong.
- Request validation strict.
- Secret khong hardcode, quan ly bang bien moi truong an toan.
- Audit log cho su kien nhay cam.
- Mask PII trong logs.

## 8.3 Quan sat he thong (observability)

- Structured logs co `requestId`, `userId`, `traceId`.
- Metrics: RPS, latency, error rate, queue depth, DB pool, AI token usage.
- Alerting theo SLO va anomaly.
- Co runbook cho: AI timeout, DB slow, queue backlog, auth outage.

## 9) Trien khai tren VPS Windows + IIS

## 9.1 Topology de xuat

- IIS la public entrypoint.
- Reverse proxy toi:
- Backend API process.
- Worker process (noi bo, khong expose public).
- Redis + MySQL co backup policy.

## 9.2 Cau hinh can co

- IIS ARR + URL Rewrite.
- SSL certificate va auto-renew.
- Health checks:
- `/health/live`
- `/health/ready`
- `/health/deps`
- Log rotate + retention.
- Backup DB tu dong + restore drill dinh ky.

## 9.3 CI/CD va rollback

- Build artifact bat bien.
- Deploy theo blue/green hoac rolling.
- Co rollback 1-lenh ve ban gan nhat.
- Kiem tra smoke test sau deploy.

## 10) Roadmap tong hop 12 tuan (week/day)

## 10.1 Tuan 1-2: Nen tang

- Chot ADR kien truc, coding standards, branching strategy.
- Draft va review OpenAPI skeleton.
- Dung khung backend + middleware loi + logging.
- Dung CI lint/test/build + staging env.

## 10.2 Tuan 3-5: Domain core

- Tuan 3: Auth Firebase + App JWT + guest upgrade flow.
- Tuan 4: Onboarding/Profile/Settings/Reminders APIs.
- Tuan 5: Journal CRUD + History + pagination + base progress.

## 10.3 Tuan 6-8: AI va analytics

- Tuan 6: AI feedback text (sync), schema validation.
- Tuan 7: Speaking pipeline (STT + scoring async + jobs).
- Tuan 8: Progress aggregate, reporting endpoint, cache layer.

## 10.3b Bo sung theo frontend moi (song song tuan 6-9)

- Tuan 6: Notifications + Achievements + Saved Phrases APIs.
- Tuan 7: Vocab Notebook + Dictionary lookup + Reading word-save.
- Tuan 8: Grammar/Listening session APIs + scoring.
- Tuan 9: Daily challenge + Leaderboard + Journal archive search/bookmark.

## 10.4b Admin MVP (song song tuan 8-10)

- Tuan 8: Admin auth + admin layout contract + metrics cards APIs.
- Tuan 9: Admin prompt CRUD + publish schedule.
- Tuan 10: Admin AI logs + pilot users explorer.

## 10.4 Tuan 9-10: Hardening

- Load test, queue tuning, DB index tuning.
- Security hardening, pentest, fix high/critical findings.

## 10.5 Tuan 11-12: UAT va go-live

- UAT, migration rehearsal, disaster recovery drill.
- Production rollout + hypercare + postmortem template.

## 11) Ke hoach test tong hop

## 11.1 Contract tests

- API implementation phai khop OpenAPI.
- Test du ca success + validation errors + auth errors.

## 11.2 Integration tests

- Guest -> Login -> Merge du lieu.
- Onboarding complete -> Dashboard data.
- Journal -> AI feedback -> Progress/History update.
- Speaking submit -> async job -> ket qua co mat.
- Edit profile + avatar upload commit flow.
- Saved phrase CRUD + vocab import tu feedback.
- Notification mark single/read-all.
- Grammar/listening answer -> score -> progress update.
- Daily challenge complete -> leaderboard update.
- Journal archive search/filter/bookmark hoat dong dung.
- Admin prompt publish -> user thay prompt dung ngay hieu luc.
- Persist journal autosave/version sau nhieu lan sua.
- Persist learning words theo tung user, khong leak user khac.
- Export du lieu user tra dung tong so journals/words/phrases.
- Xoa du lieu user theo policy chi anh huong dung owner.

## 11.3 Performance tests

- 1000 concurrent users mixed workload.
- Spike test (x2 traffic trong 5 phut).
- Soak test (4-8h).

## 11.4 Security tests

- JWT tamper/replay.
- Rate limit bypass.
- SQLi/XSS payload checks.
- Permission boundary tests.

## 12) Danh sach tai lieu con se tach ra (de thi cong)

Tu ban tong hop nay, se tach thanh bo docs implementation:

- `docs/architecture-overview.md`
- `docs/openapi-contract.md`
- `docs/database-design.md`
- `docs/auth-firebase-jwt.md`
- `docs/ai-groq-orchestration.md`
- `docs/security-compliance.md`
- `docs/deploy-iis-windows-vps.md`
- `docs/observability-sre.md`
- `docs/test-plan.md`
- `docs/roadmap-12-weeks.md`
- `docs/admin-mvp-api-contract.md`
- `docs/content-and-challenge-backend.md`

## 13) Assumptions da khoa

- Backend stack: Node.js TypeScript.
- API contract: OpenAPI/Swagger la nguon chuan duy nhat.
- Auth: Firebase (Google/Facebook) + App JWT.
- AI provider chinh: Groq.
- Data store chinh: MySQL, cache/queue: Redis.
- Co luong guest va nang cap account.
- Muc tieu scale: 100k MAU, 1000 concurrent.

## 14) Definition of Done cho giai doan planning -> implementation

Hoan tat planning va du dieu kien vao coding khi:

- API catalog va schema duoc sign-off.
- ERD + index strategy duoc sign-off.
- Auth flow guest/upgrade duoc sign-off.
- AI schema outputs + fallback policy duoc sign-off.
- SLO/SLI + runbook su co duoc sign-off.
- Roadmap 12 tuan duoc chot theo team capacity.

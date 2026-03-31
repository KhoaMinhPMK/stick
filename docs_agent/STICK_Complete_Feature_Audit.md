# STICK — Complete Feature Audit

> **Purpose**: Catalog every user-facing feature, screen, interaction, and system behavior in STICK for comparison with Duolingo.  
> **Date**: Auto-generated from full codebase audit  
> **Scope**: Frontend (React/TS), Backend (Express/Prisma), Database (MySQL 16 models), AI (Groq)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **WORKING** | Feature is fully implemented end-to-end (FE + BE + DB) |
| **PARTIAL** | Feature exists but has gaps, incomplete logic, or missing infrastructure |
| **SHELL** | UI exists but backend logic is stub/placeholder/hardcoded |
| **BROKEN** | Code exists but will error or produce no useful result |

---

## 1. Onboarding & First Experience

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 1.1 | **Intro Walkthrough** | 4-step animated intro carousel (`OnboardingFlow.tsx`) — explains STICK's concept with illustrations and motivational copy | **WORKING** | — |
| 1.2 | **Level Selection** | 5 English proficiency levels: Beginner, Elementary, Pre-Intermediate, Intermediate, Not Sure (`LevelSelection.tsx`) | **WORKING** | — |
| 1.3 | **Practice Schedule** | Time-of-day picker (morning/afternoon/evening/custom) + session length (5 min / 10 min / flexible) (`PracticeSchedule.tsx`) | **WORKING** | Schedule is stored but **never used** to trigger reminders or personalize prompts |
| 1.4 | **Goal Selection** | Multi-select from 6 goals: build habit, speak better, write better, build confidence, school, work (`GoalSelection.tsx`) | **WORKING** | Goals are stored but **never referenced** anywhere in the app logic |
| 1.5 | **Save Progress / Auth Gate** | After onboarding, user chooses: login with email, login with Google, or continue as guest (`SaveProgress.tsx`) | **WORKING** | — |
| 1.6 | **Guest Auto-Session** | If no token, `ensureSession()` auto-creates anonymous Firebase user → exchanges for backend token | **WORKING** | Guest data is silently lost if browser storage is cleared; no merge flow |
| 1.7 | **Onboarding State Persistence** | Backend stores onboarding step/level/schedule/goal per user via `PUT /onboarding/state` | **WORKING** | — |
| 1.8 | **Onboarding Completion** | `POST /onboarding/complete` marks onboarding done | **WORKING** | — |

**vs. Duolingo**: Duolingo has a placement test (adaptive quiz to determine level). STICK only has self-reported level. Duolingo also asks for daily goal in minutes and uses it to gate the daily session — STICK stores schedule/goals but never enforces them.

---

## 2. Daily Learning Loop (Core Loop)

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 2.1 | **Dashboard** | Hero section with daily prompt + stats bar (streak, XP, journals count) + chart + navigation cards to all features (`Dashboard.tsx`) | **WORKING** | — |
| 2.2 | **Daily Prompt Display** | Shows today's prompt from `GET /daily-prompt/today` with Vietnamese + English versions + follow-up question (`Journal.tsx`) | **WORKING** | Falls back to a hardcoded prompt if none is published for today |
| 2.3 | **Journal Writing** | Full text editor with real-time word count, character count, auto-save draft, submit button. Min length enforced. (`JournalWorkspace.tsx`) | **WORKING** | No rich text (bold/italic), no inline grammar hints while typing |
| 2.4 | **Draft Auto-Save** | Drafts saved to backend via `POST /journals` with `status: 'draft'`, fires `trackDraftSaved` analytics | **WORKING** | — |
| 2.5 | **Journal Submission** | `PATCH /journals/:id` changes status to `submitted`, triggers AI feedback generation | **WORKING** | — |
| 2.6 | **AI Feedback Loading** | Animated loading screen with progress messages while AI processes (`Feedback.tsx`) | **WORKING** | — |
| 2.7 | **AI Feedback Display** | Shows: original text, enhanced text (side-by-side), grammar corrections with explanations, vocabulary boosters, sentence patterns, encouragement message, overall score 0-100 (`FeedbackResult.tsx`) | **WORKING** | — |
| 2.8 | **Enhanced Text TTS** | "Listen" button plays the AI-enhanced text via Web Speech API `SpeechSynthesis` (`FeedbackResult.tsx`) | **WORKING** | No accent selection (uses browser default); no speed control on this screen |
| 2.9 | **Completion Screen** | Celebration animation + streak display + XP earned + mood picker (5 emoji options) + navigation to vocab review / speaking / archive (`Completion.tsx`) | **WORKING** | — |
| 2.10 | **Mood Tracking** | `POST /journals/:id/mood` saves user's mood after completing a journal | **WORKING** | Mood data is stored but **never analyzed or displayed** anywhere |
| 2.11 | **XP System** | Backend awards XP: journal +10, saved phrase +2, vocab item +3, AI feedback bonus based on overallScore | **WORKING** | No XP for grammar quiz, reading, listening, speaking, or daily challenge |
| 2.12 | **Day Number Tracking** | Dashboard shows "Day X" based on count of distinct journal dates | **WORKING** | — |

**vs. Duolingo**: Duolingo's core loop is lesson → quiz → XP → streak. STICK's is prompt → write → AI feedback → review → speak. Fundamentally different (creation vs. consumption). Duolingo has hearts/lives system — STICK has none. Duolingo gates content behind progression — STICK is open access.

---

## 3. Practice Modes

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 3.1 | **Vocabulary Review** | Flashcard-style review of vocab boosters from AI feedback. "Got it" / "Review later" buttons. (`VocabularyReview.tsx`) | **PARTIAL** | No spaced repetition algorithm (SRS). Items are shown once randomly, not scheduled by difficulty/time. |
| 3.2 | **Speaking Practice Intro** | Plays the AI-enhanced journal text via TTS, then user records themselves reading it with MediaRecorder (`SpeakingPracticeIntro.tsx`) | **PARTIAL** | Recording is saved locally only. **No speech-to-text analysis**. No pronunciation scoring. No comparison with original. |
| 3.3 | **Speaking Report** | Displays writing analysis (grammar/vocab/fluency breakdown) from journal feedback. Labeled as "Speaking Report" but actually shows **writing** scores. (`SpeakingReport.tsx`) | **SHELL** | Misleading — shows journal feedback scores, not speech analysis. No actual speaking evaluation exists. |
| 3.4 | **Grammar Practice** | AI-generated 5-question multiple-choice quiz via `GET /ai/grammar-quiz`. Level-aware. Shows correct answer + explanation after each question. Final score displayed. (`GrammarPractice.tsx`) | **WORKING** | No tracking of grammar topics mastered. No progressive difficulty. Results not saved to backend. |
| 3.5 | **Reading Mode** | AI-generated article (150-250 words) via `GET /ai/reading-content`. Click any word to see definition (simulated). TTS for full article. Vocabulary list at bottom. (`ReadingMode.tsx`) | **WORKING** | Word-click definition is **hardcoded/simulated** (not a real dictionary API). Results not saved to backend. |
| 3.6 | **Listening Practice** | TTS plays a sentence, user fills in blanks. Uses journal feedback sentences or generates content. (`ListeningPractice.tsx`) | **PARTIAL** | Content comes from journal data only. No graduated difficulty. No backend tracking of listening accuracy. |
| 3.7 | **Daily Challenge** | Daily idiom/expression/phrasal verb via `GET /daily-challenge`. Shows phrase, meaning, example. User writes a sentence using it. (`DailyChallenge.tsx`) | **PARTIAL** | User's written sentence is **not evaluated** by AI. No feedback on usage correctness. Just a write-and-submit with no response. |
| 3.8 | **Journal Recording** | After feedback, user can record themselves reading the enhanced text via MediaRecorder (`JournalRecord.tsx`) | **PARTIAL** | Audio stored in-memory only (base64 blob). Not persisted to server. No playback history. |

**vs. Duolingo**: Duolingo has: translation exercises, word matching, sentence building, character tracing, stories, podcasts, pronunciation scoring via speech recognition. STICK has none of these. STICK's practice modes are AI-generated but lack the gamified quiz mechanics and adaptive difficulty of Duolingo.

---

## 4. Progress & Motivation

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 4.1 | **Streak Counter** | Backend calculates current streak from consecutive days with journals. Displayed on dashboard + completion + profile. (`GET /progress/summary`) | **WORKING** | — |
| 4.2 | **Best Streak** | Tracks all-time longest streak | **WORKING** | — |
| 4.3 | **Calendar View** | Monthly calendar showing active days (green dots). Click a day to see that day's journals + stats. Backfill supported. (`Progress.tsx`) | **WORKING** | — |
| 4.4 | **Progress Backfill** | `POST /progress/backfill` lets user manually log activity for past days | **WORKING** | No validation — user can backfill anything. Potential for abuse. |
| 4.5 | **Daily Stats** | Per-day breakdown: journals count, words learned, minutes spent, XP earned (`GET /progress/daily/:date`) | **WORKING** | — |
| 4.6 | **Achievements/Badges** | Grid of achievement badges. DB has `AchievementDefinition` + `UserAchievement` tables. UI shows locked/unlocked state + progress bar. (`Achievements.tsx`) | **PARTIAL** | **No auto-unlock logic in backend**. No triggers that check and award achievements. The DB schema + UI exist but the engine is missing. Must be manually awarded. |
| 4.7 | **Achievement Categories** | Achievements organized by category (streak, journal, vocab, etc.) with icon + threshold + XP reward | **PARTIAL** | Same as above — structure exists, no automation |
| 4.8 | **Leaderboard** | Weekly and all-time XP ranking. Top 20 users. Current user highlighted. Podium display for top 3. (`Leaderboard.tsx`, `GET /leaderboard`) | **WORKING** | No friend-scoped leaderboard. No leagues/divisions. |
| 4.9 | **XP History** | XP earned today, total XP, displayed on dashboard and profile | **WORKING** | No XP breakdown by activity type |
| 4.10 | **Average Score** | Average journal feedback score across all submissions | **WORKING** | — |
| 4.11 | **Streak Freeze/Protection** | — | **MISSING** | No streak freeze item. No grace period. Miss one day = streak resets to 0. |
| 4.12 | **Comeback Incentive** | — | **MISSING** | No re-engagement mechanism after streak loss. No "welcome back" flow. |

**vs. Duolingo**: Duolingo has: streak freeze (purchasable), streak society, XP boosts, league system (Bronze→Diamond), crowns/unit completion, daily/weekly quests, gems/lingots currency. STICK has basic streaks + leaderboard only. No virtual currency, no quests, no leagues, no streak protection.

---

## 5. Content System

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 5.1 | **Daily Prompts** | Admin-created bilingual prompts (Vietnamese + English) with follow-up questions. Published by date. (`DailyPrompt` model, admin CRUD) | **WORKING** | — |
| 5.2 | **Lesson Library** | Browsable lessons by category + level with search. Each lesson has sections of content + optional quiz. (`Library.tsx`, `LessonDetail.tsx`) | **WORKING** | Content must be manually created by admin. No AI-generated lessons. |
| 5.3 | **Saved Phrases** | User can save phrases with meaning + example + category. CRUD with category filter + search. +2 XP per save. (`SavedPhrases.tsx`) | **WORKING** | — |
| 5.4 | **Vocab Notebook** | User can add words with meaning, example, tags, notes. Mastery levels: new → learning → mastered. +3 XP per add. (`VocabNotebook.tsx`) | **WORKING** | Mastery is **manually toggled** by user. No SRS algorithm. No quiz-based mastery progression. |
| 5.5 | **AI-Generated Content** | Grammar quizzes, reading articles, daily challenges all generated on-the-fly by Groq AI | **WORKING** | Content is ephemeral — not cached or saved. Same request may generate different content. |
| 5.6 | **Journal Archive** | Filterable list of past journals with scores, dates, search. (`JournalArchive.tsx`, `HistoryList.tsx`) | **WORKING** | Two separate pages (archive + history) with overlapping functionality |
| 5.7 | **History Detail** | Full journal text + AI feedback review for any past entry (`HistoryDetail.tsx`) | **WORKING** | — |
| 5.8 | **Bookmarked Journals** | UI references bookmarking in journal archive | **SHELL** | No `bookmarked` field in Journal model. No backend endpoint. Button does nothing. |

**vs. Duolingo**: Duolingo has a structured skill tree / learning path with prerequisites, tips & notes, stories, and podcasts. All content is pre-authored and curated. STICK relies heavily on AI-generated content and user-created journals.

---

## 6. Social & Community

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 6.1 | **Leaderboard** | Public XP leaderboard (weekly/all-time) showing top 20 | **WORKING** | Only feature with any social element |
| 6.2 | **Friends System** | — | **MISSING** | No friend list, no follow, no friend requests |
| 6.3 | **Social Sharing** | — | **MISSING** | No share-to-social-media (streak, achievement, journal) |
| 6.4 | **Comments / Reactions** | — | **MISSING** | No ability to comment on others' journals or react |
| 6.5 | **Community Feed** | — | **MISSING** | No shared journal feed or community wall |
| 6.6 | **Challenge a Friend** | — | **MISSING** | No peer challenges |

**vs. Duolingo**: Duolingo has: friends list, friend quests, follow system, leagues (compete with 30 strangers), profile sharing, achievement sharing via social media. STICK has a basic leaderboard only.

---

## 7. Personalization

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 7.1 | **Theme Setting** | `theme` field in UserSettings (stored in DB) | **PARTIAL** | Backend stores it. Frontend reads it. But **no theme switcher UI** found — always uses default theme. |
| 7.2 | **Language Toggle** | Switch between Vietnamese and English UI via i18next. Persisted to `settings.language`. (`Settings.tsx`) | **WORKING** | — |
| 7.3 | **Sound Toggle** | On/off for sound effects. Persisted to `settings.soundOn`. (`Settings.tsx`) | **WORKING** | Limited sound effects in the app (mostly TTS) |
| 7.4 | **Speech Speed** | Adjustable TTS speed (0.5x – 2.0x) in settings | **WORKING** | Applied inconsistently — some TTS calls use it, some don't |
| 7.5 | **Daily Goal Minutes** | User sets daily goal (5/10/15/20/30 min). Stored in `settings.dailyGoalMinutes` | **PARTIAL** | Stored but **never enforced**. No progress bar toward daily goal. No "goal complete" notification. |
| 7.6 | **Profile Editing** | Edit name, bio, native language (`EditProfile.tsx`) | **WORKING** | — |
| 7.7 | **Avatar** | Default avatar with initial letter. No upload capability. | **PARTIAL** | No custom avatar upload. No avatar selection. Just first letter of name. |
| 7.8 | **Level-Aware Content** | AI content (grammar quiz, reading) adapts to user's selected level | **WORKING** | — |

**vs. Duolingo**: Duolingo has: avatar customization (face/hair/clothes purchasable with gems), daily goal with visual progress ring, animated streak celebrations, personalized daily practice recommendations. STICK has basic settings only.

---

## 8. User Management & Auth

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 8.1 | **Email/Password Registration** | Firebase `createUserWithEmailAndPassword` → exchange for backend token (`Register.tsx`) | **WORKING** | — |
| 8.2 | **Email/Password Login** | Firebase `signInWithEmailAndPassword` → exchange token (`Login.tsx`) | **WORKING** | — |
| 8.3 | **Google Sign-In** | Firebase `signInWithPopup(GoogleAuthProvider)` → exchange token | **WORKING** | — |
| 8.4 | **Guest / Anonymous** | Firebase `signInAnonymously` → exchange token. Auto-created on first visit. | **WORKING** | No guest-to-registered account merge. Guest data is lost if user registers a new account. |
| 8.5 | **Forgot Password** | Firebase `sendPasswordResetEmail` (`ForgotPassword.tsx`) | **WORKING** | — |
| 8.6 | **Logout** | Clears localStorage + calls `POST /auth/logout` + Firebase sign out | **WORKING** | — |
| 8.7 | **Session Management** | Backend token stored in localStorage. 401 auto-recovery creates new guest session. | **WORKING** | No refresh token. No session expiry UI warning. |
| 8.8 | **Profile Page** | Shows avatar, name, badges, total journals, streak, XP. Nav to edit/settings/saved/reminders. (`Profile.tsx`) | **WORKING** | — |
| 8.9 | **Account Deletion** | — | **MISSING** | No way to delete account. GDPR compliance concern. |
| 8.10 | **Local Backend Auth** | `POST /auth/register` and `POST /auth/login` exist with SHA-256 password hashing | **WORKING** | These are legacy endpoints — Firebase auth is the primary path now. SHA-256 without salt is **insecure**. |

**vs. Duolingo**: Duolingo has: Apple Sign-In, Facebook login, account deletion, privacy controls, parental controls (Duolingo Kids), class codes for teachers. STICK has email + Google + guest only.

---

## 9. Retention Mechanics

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 9.1 | **Reminders** | User configures time + days (daily/custom) + label. Stored in DB. (`Reminders.tsx`, `PUT /reminders`) | **PARTIAL** | **No push notification infrastructure**. No email reminders. No cron job sending reminders. UI saves preferences but nothing acts on them. |
| 9.2 | **Notifications System** | DB stores notifications. UI shows list with read/unread, mark-all-read. (`Notifications.tsx`) | **PARTIAL** | **No auto-generated notifications**. No triggers that create notifications (e.g., "You haven't practiced today"). Only manual/admin notifications. |
| 9.3 | **Streak Mechanics** | Daily streak counted from consecutive journal days | **WORKING** | But no streak freeze, no grace period, no comeback bonus |
| 9.4 | **Daily Prompt Rotation** | New prompt each day to encourage daily return | **WORKING** | Only works if admin publishes prompts. No auto-generation. |
| 9.5 | **Push Notifications** | — | **MISSING** | No Firebase Cloud Messaging integration. No service worker for push. |
| 9.6 | **Email Engagement** | — | **MISSING** | No email reminders, no weekly summary email, no streak-at-risk alerts |
| 9.7 | **Streak Freeze** | — | **MISSING** | Cannot protect streak from breaking |
| 9.8 | **Win-back Flow** | — | **MISSING** | No special UX for returning users after absence |

**vs. Duolingo**: Duolingo has: push notifications (multiple daily), email reminders, streak freeze (purchasable with gems), streak society, practice reminders from "Duo" mascot, passive-aggressive re-engagement notifications ("These reminders don't seem to be working..."), 7-day XP boost for returning users, friend nudges. STICK has a reminder settings UI but no actual delivery mechanism.

---

## 10. Audio & Speech

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 10.1 | **Text-to-Speech (TTS)** | Web Speech API `SpeechSynthesis` used to read enhanced journal text, reading articles, listening exercises | **WORKING** | No accent/voice selection. Quality depends on browser/OS. No neural TTS. |
| 10.2 | **TTS Speed Control** | Speed adjustable from settings (0.5x-2.0x) | **PARTIAL** | Not consistently applied across all TTS instances |
| 10.3 | **Voice Recording** | `MediaRecorder` API captures user's voice during speaking practice | **PARTIAL** | Recording saved as in-memory blob only. Not uploaded to server. |
| 10.4 | **Audio Playback** | Recorded audio can be played back immediately | **PARTIAL** | No persistent playback — lost on page navigation |
| 10.5 | **Speech-to-Text** | — | **MISSING** | No speech recognition. No pronunciation scoring. No comparison with target text. |
| 10.6 | **Pronunciation Scoring** | — | **MISSING** | Would require speech recognition API integration |
| 10.7 | **Audio Analytics** | `trackAudioPlay` fires when user listens to TTS | **WORKING** | — |

**vs. Duolingo**: Duolingo has: neural TTS (high quality voices), speech recognition with pronunciation scoring, repeat-after-me exercises, voice speed toggle. STICK uses browser-native TTS (low quality, system-dependent) and has recording but no analysis.

---

## 11. Admin & Operations

| # | Feature | Description | Status | What's Missing |
|---|---------|-------------|--------|----------------|
| 11.1 | **Admin Login** | Separate admin auth via email/password. Checks `role === 'admin'` in DB. (`AdminLogin.tsx`, `POST /admin/login`) | **WORKING** | — |
| 11.2 | **Admin Dashboard** | Metric cards (total users, DAU, total journals, avg score), conversion funnel chart, retention cohort table (D1/D2/D3), AI health chart (latency + errors). (`AdminDashboard.tsx`) | **WORKING** | — |
| 11.3 | **Prompt Management** | Full CRUD for daily prompts: create, edit, delete, publish, schedule. Filter by status. Paginated table. (`AdminPromptList.tsx`, `AdminPromptEdit.tsx`) | **WORKING** | — |
| 11.4 | **User Explorer** | Searchable, sortable user list. View user detail (profile + stats + journals). Ban/unban capability. (`AdminUsers.tsx`, `AdminUserDetail.tsx`) | **WORKING** | — |
| 11.5 | **AI Logs Viewer** | Paginated AI request logs with: input, output, model, status code, latency, errors. Filter by status + date range. Click to expand full log. (`AdminAILogs.tsx`) | **WORKING** | — |
| 11.6 | **App Config** | Key-value config store. Known keys: ai_model, ai_max_tokens, ai_temperature, maintenance_mode, min_journal_chars, system_prompt. Editable from admin panel. (`AdminSettings.tsx`) | **WORKING** | — |
| 11.7 | **Conversion Funnel** | `GET /admin/metrics/funnel` tracks: register → onboard → first_journal → feedback_viewed → second_day | **WORKING** | — |
| 11.8 | **Retention Cohorts** | `GET /admin/metrics/retention` shows D1/D2/D3 retention by registration date cohort | **WORKING** | — |
| 11.9 | **AI Health Monitoring** | `GET /admin/metrics/ai-health` shows daily avg latency + error count for AI calls | **WORKING** | — |
| 11.10 | **Swagger API Docs** | OpenAPI spec at `/docs` (`docs/openapi.yaml`) | **WORKING** | — |

**vs. Duolingo**: Duolingo has a massive internal tooling suite (course editor, A/B testing platform, contributor portal, etc.). STICK's admin is lean but covers the essentials: content management, user monitoring, AI monitoring, and basic analytics.

---

## Summary Statistics

| Category | Total Features | WORKING | PARTIAL | SHELL | MISSING |
|----------|---------------|---------|---------|-------|---------|
| 1. Onboarding | 8 | 8 | 0 | 0 | 0 |
| 2. Daily Loop | 12 | 11 | 0 | 0 | 0* |
| 3. Practice Modes | 8 | 3 | 4 | 1 | 0 |
| 4. Progress & Motivation | 12 | 7 | 2 | 0 | 2† |
| 5. Content System | 8 | 6 | 1 | 1 | 0 |
| 6. Social & Community | 6 | 1 | 0 | 0 | 5 |
| 7. Personalization | 8 | 4 | 3 | 0 | 0† |
| 8. User Management | 10 | 7 | 0 | 0 | 2† |
| 9. Retention | 8 | 2 | 2 | 0 | 4 |
| 10. Audio & Speech | 7 | 2 | 3 | 0 | 2 |
| 11. Admin & Operations | 10 | 10 | 0 | 0 | 0 |
| **TOTAL** | **97** | **61** | **15** | **2** | **15†** |

*\*Mood tracking is WORKING but data goes unused.*  
*†Some items counted as MISSING are entirely absent features (no code exists).*

---

## Critical Gaps vs. Duolingo

### Must-Have (High Priority)
1. **No speech recognition / pronunciation scoring** — speaking practice records audio but never analyzes it
2. **No achievement auto-unlock engine** — DB schema exists but no backend logic triggers awards
3. **No push/email notifications** — reminder UI exists but nothing delivers reminders
4. **No streak freeze / protection** — one missed day = total reset, punishing for casual users
5. **No spaced repetition (SRS)** — vocab review is random, not optimized for memory retention
6. **Insecure password hashing** — SHA-256 without salt on legacy auth endpoints

### Should-Have (Medium Priority)
7. **No friends / social features** — only a public leaderboard
8. **No account deletion** — GDPR/privacy compliance gap
9. **No guest-to-account merge** — guest data is lost on registration
10. **Daily goal not enforced** — stored but never tracked or celebrated
11. **Grammar/reading/listening results not saved** — practice sessions are ephemeral
12. **Speaking Report shows writing scores** — misleading presentation

### Nice-to-Have (Low Priority)
13. **No virtual currency / shop** — no in-app economy
14. **No league / division system** — leaderboard is flat ranking
15. **No A/B testing** — no experimentation framework
16. **No email onboarding drip** — no post-signup engagement sequence
17. **No custom avatar** — just initials
18. **No word-click dictionary API** — reading mode uses simulated definitions

---

## Architectural Notes

| Aspect | Detail |
|--------|--------|
| **Routing** | Hash-based (`window.location.hash` + switch/case in App.tsx) — no React Router |
| **State Management** | No global state library. Each page fetches its own data via `useState` + `useEffect`. |
| **Styling** | Tailwind CSS + custom "sketch" design system (hand-drawn aesthetic) |
| **i18n** | `react-i18next` — Vietnamese + English |
| **Analytics** | Firebase Analytics via custom `coreLoop.ts` module (7 event types) |
| **AI Provider** | Groq SDK, model `llama-3.3-70b-versatile`, 5s timeout, JSON response parsing |
| **Database** | MySQL via Prisma ORM, 16 models |
| **Auth** | Firebase Auth (primary) + legacy local auth (SHA-256). Token in `localStorage`. |
| **Audio** | Browser Web Speech API (SpeechSynthesis + MediaRecorder). No server-side audio. |
| **Deployment** | PM2 (`ecosystem.config.cjs`), IIS reverse proxy (`web.config`), port 3040 |
| **Security Concern** | Firebase API keys exposed in client-side source (normal for Firebase, but `serviceAccountKey.json` exists in backend repo — **should be in .env / secrets**) |

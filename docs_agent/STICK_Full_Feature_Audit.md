# STICK English Learning App — COMPLETE Feature Audit

**Date:** 2026-03-31  
**Scope:** Every frontend page, component, service, hook, backend route, and DB model

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Routing & Navigation](#2-routing--navigation)
3. [Frontend Pages — App](#3-frontend-pages--app)
4. [Frontend Pages — Landing](#4-frontend-pages--landing)
5. [Frontend Pages — Admin](#5-frontend-pages--admin)
6. [Frontend Services & API Layer](#6-frontend-services--api-layer)
7. [Frontend Components & Layout](#7-frontend-components--layout)
8. [Frontend Types / DTOs](#8-frontend-types--dtos)
9. [Backend API Routes (apiV1.js)](#9-backend-api-routes)
10. [Backend Libraries](#10-backend-libraries)
11. [Database Schema (Prisma)](#11-database-schema)
12. [Analytics & Tracking](#12-analytics--tracking)
13. [Feature Gap Analysis](#13-feature-gap-analysis)
14. [Security Issues](#14-security-issues)
15. [Critical Missing Pieces](#15-critical-missing-pieces)

---

## 1. Architecture Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+ (Vite, TypeScript, Tailwind CSS) |
| Routing | Hash-based (`window.location.hash`) — NO React Router |
| State Management | Local `useState` per page — NO global state (no Redux, Zustand, Context) |
| i18n | react-i18next (EN/VI) |
| Backend | Express.js (Node.js) |
| Database | MySQL via Prisma ORM |
| AI Engine | Groq SDK (Llama 3.3 70B) |
| Auth | Firebase Auth → backend session tokens |
| Analytics | Firebase Analytics |
| Hosting | IIS on VPS (based on deploy config) |

**Key architectural pattern:** Monolithic single-file API (`apiV1.js` = 1700+ lines). No controllers, no services layer on backend.

---

## 2. Routing & Navigation

**Router:** `App.tsx` — giant `if/else` hash-based router in a single `useEffect`.

### All registered routes:

| Hash | View | Page Component |
|------|------|----------------|
| (empty) | `landing` | `LandingPage` |
| `#onboarding` through `#onboarding-4` | `onboarding` | `OnboardingFlow` (step 0-3) |
| `#level` | `level` | `LevelSelectionPage` |
| `#schedule` | `schedule` | `PracticeSchedulePage` |
| `#goal` | `goal` | `GoalSelectionPage` |
| `#save-progress` | `save-progress` | `SaveProgressPage` |
| `#register` | `register` | `RegisterPage` |
| `#login` | `login` | `LoginPage` |
| `#forgot-password` | `forgot-password` | `ForgotPasswordPage` |
| `#dashboard` / `#app` | `dashboard` | `DashboardPage` |
| `#journal` | `journal` | `JournalPage` |
| `#journal-workspace` | `journal-workspace` | `JournalWorkspacePage` |
| `#journal-record` | `journal-record` | `JournalRecordPage` |
| `#journal-archive` | `journal-archive` | `JournalArchivePage` |
| `#feedback` | `feedback` | `FeedbackPage` |
| `#feedback-result` | `feedback-result` | `FeedbackResultPage` |
| `#speaking-intro` | `speaking-intro` | `SpeakingPracticeIntroPage` |
| `#speaking-report` | `speaking-report` | `SpeakingReportPage` |
| `#vocab-review` | `vocab-review` | `VocabularyReviewPage` |
| `#completion` | `completion` | `CompletionPage` |
| `#progress` | `progress` | `ProgressPage` |
| `#history` | `history` | `HistoryListPage` |
| `#history-detail` | `history-detail` | `HistoryDetailPage` |
| `#loading` | `loading` | `SkeletonLoadingPage` |
| `#error` | `error` | `ErrorPage` |
| `#profile` | `profile` | `ProfilePage` |
| `#edit-profile` | `edit-profile` | `EditProfilePage` |
| `#settings` | `settings` | `SettingsPage` |
| `#reminders` | `reminders` | `RemindersPage` |
| `#library` | `library` | `LibraryPage` |
| `#lesson-detail` | `lesson-detail` | `LessonDetailPage` |
| `#saved-phrases` | `saved-phrases` | `SavedPhrasesPage` |
| `#vocab-notebook` | `vocab-notebook` | `VocabNotebookPage` |
| `#achievements` | `achievements` | `AchievementsPage` |
| `#notifications` | `notifications` | `NotificationsPage` |
| `#daily-challenge` | `daily-challenge` | `DailyChallengePage` |
| `#leaderboard` | `leaderboard` | `LeaderboardPage` |
| `#reading-mode` | `reading-mode` | `ReadingModePage` |
| `#grammar-practice` | `grammar-practice` | `GrammarPracticePage` |
| `#listening-practice` | `listening-practice` | `ListeningPracticePage` |
| `#terms` / `#privacy` / `#help` / `#about` | static | `StaticPage` |
| `#admin/*` | `admin` | `AdminApp` (sub-router) |

**Navigation structure:**  
- Desktop: Fixed left sidebar (Home, Journal, Progress, History, Library, Profile, Settings)
- Mobile: Bottom tab bar (Home, Journal, Library, History, Profile)

---

## 3. Frontend Pages — App (DETAILED)

### 3.1 Onboarding Flow (`OnboardingFlow.tsx`)
- **What it does:** 4-step onboarding carousel introducing STICK's concept
- **State:** Local `stepIndex` prop from App.tsx, direction animation tracking
- **API calls:** NONE — purely presentational
- **UX flow:** Step 1 (Write daily) → Step 2 (AI corrects) → Step 3 (Speak it) → Step 4 (Track progress) → Navigate to `#level`
- **Missing:** Does NOT save onboarding progress to backend during steps. Only saves after level/schedule/goal selection on subsequent pages.

### 3.2 Level Selection (`LevelSelection.tsx`)
- **What it does:** User picks English level (Beginner/Intermediate/Advanced)
- **API calls:** `PUT /onboarding/state` via `saveOnboardingState`
- **Navigates to:** `#schedule`

### 3.3 Practice Schedule (`PracticeSchedule.tsx`)
- **What it does:** User picks practice frequency
- **API calls:** `PUT /onboarding/state`
- **Navigates to:** `#goal`

### 3.4 Goal Selection (`GoalSelection.tsx`)
- **What it does:** User selects learning goals (multi-select)
- **API calls:** `PUT /onboarding/state`
- **Navigates to:** `#save-progress`

### 3.5 Save Progress (`SaveProgress.tsx`)
- **What it does:** Prompts user to register to save progress
- **API calls:** None directly (navigation only)
- **Navigates to:** `#register` or `#app`

### 3.6 Register (`Register.tsx`)
- **What it does:** Email/password registration via Firebase
- **API calls:** `registerWithEmail()` → Firebase → `POST /auth/firebase/login` → backend session
- **Missing:** No password strength indicator, no terms acceptance checkbox

### 3.7 Login (`Login.tsx`)
- **What it does:** Email/password + Google OAuth login
- **State:** Local form state (email, password, error, isSubmitting)
- **API calls:** `loginWithEmail()` or `loginWithGoogle()` → Firebase → backend exchange
- **UX:** Card-based form with Google button, error messaging

### 3.8 Dashboard (`Dashboard.tsx`)
- **What it does:** Main app home page showing stats, streak, weekly chart, quick actions
- **State:** Loading, summary (ProgressSummary), dailyData (ProgressDailyItem[])
- **API calls:** `GET /progress/summary`, `GET /progress/daily?days=14`
- **UX:** Hero section with streak count, stats grid (journals, words, avg score, XP), words-to-review card, speaking practice card, 7-day activity chart
- **Missing:** No daily prompt display on dashboard. User must manually navigate to journal.

### 3.9 Journal Intro (`Journal.tsx`)
- **What it does:** Pre-writing intro screen showing day number, tasks overview, motivational quote
- **State:** summary (ProgressSummary)
- **API calls:** `GET /progress/summary`
- **Analytics:** `trackPromptView`
- **Navigates to:** `#journal-workspace`
- **Missing:** Does NOT show the admin-managed daily prompt. Just generic task list.

### 3.10 Journal Workspace (`JournalWorkspace.tsx`)
- **What it does:** Main writing area — textarea + word counter + save draft + submit
- **State:** text, journalId, isSubmitting, isSaving, saveStatus, showHelper
- **API calls:** `POST /journals` (create), `PATCH /journals/:id` (update), URL-based draft loading
- **Analytics:** `trackSessionStart`, `trackSubmissionSent`
- **UX flow:** Write → word count progress bar → save draft → submit (min 10 words) → navigates to `#feedback?journalId=X`
- **Features:** Quick starters, vocabulary suggestions, auto-save indicator, notebook-line decorations
- **Missing:** No autosave timer. No AI writing suggestions while typing. No daily prompt pulled from backend.

### 3.11 Feedback Loading (`Feedback.tsx`)
- **What it does:** Intermediate loading screen while AI generates feedback
- **State:** isLoading, error
- **API calls:** `POST /ai/feedback/text` with journalId
- **UX:** Beautiful skeleton loading animation → auto-redirect to `#feedback-result?journalId=X`
- **Error handling:** Shows retry/back buttons on failure

### 3.12 Feedback Result (`FeedbackResult.tsx`)
- **What it does:** Displays AI feedback: original vs enhanced text, corrections, vocabulary boosters, score
- **State:** journal data, isPlayingEnhanced
- **API calls:** `GET /journals/:id`
- **Analytics:** `trackFeedbackView`
- **Features:** TTS playback of enhanced text (Web Speech API), side-by-side comparison, correction explanations, vocabulary cards
- **Actions:** Practice Speaking → `#speaking-intro`, Continue → `#completion`, Try Another
- **Missing:** No "save word to notebook" button from this screen. No share functionality.

### 3.13 Vocabulary Review (`VocabularyReview.tsx`)
- **What it does:** Flashcard-style vocab review from journal feedback or global notebook
- **State:** vocabItems[], currentIndex, rememberedCount
- **API calls:** `GET /journals/:id/review-items` or `GET /vocab/notebook`, `PATCH /vocab/notebook/:id`
- **Analytics:** `trackReviewDone`
- **UX:** Card flip (word → meaning → example), "Got It" / "Review Later" buttons, sentence patterns
- **Missing:** No spaced repetition algorithm. Simple sequential review only. No SRS intervals.

### 3.14 Speaking Practice Intro (`SpeakingPracticeIntro.tsx`)
- **What it does:** Shows the enhanced sentence, lets user listen to TTS, then navigate to recording
- **State:** sentence, isPlaying, loadingJournal
- **API calls:** `GET /journals/:id` (to get enhanced text)
- **Analytics:** `trackAudioPlay`
- **Features:** Web Speech API TTS, coach illustration
- **Navigates to:** `#journal-record`

### 3.15 Journal Record (`JournalRecord.tsx`)
- **What it does:** Audio recording of user speaking the sentence
- **State:** RecordState (idle/requesting/recording/recorded/playing/error), seconds, audioUrl
- **API calls:** `GET /journals/:id` (load sentence)
- **Features:** MediaRecorder API, playback, timer, retry
- **Missing:** NO speech-to-text analysis. NO pronunciation scoring. Recording is local-only and NEVER uploaded to server. Purely a practice UX — no backend processing of audio.

### 3.16 Completion (`Completion.tsx`)
- **What it does:** End-of-session celebration screen with streak, vocab count, mood check
- **State:** selectedMood, moodSaved, summary
- **API calls:** `GET /progress/summary`, `POST /journals/:id/mood`
- **Analytics:** `trackCompletionView`
- **Features:** Mood selection (happy/neutral/tired), streak display, XP/vocab stats

### 3.17 Progress (`Progress.tsx`)
- **What it does:** Calendar heatmap view showing daily activity, streak stats, day-level detail
- **State:** monthOffset, selectedDay, dayDetail, summary, dailyData
- **API calls:** `GET /progress/summary`, `GET /progress/daily?days=90`, `GET /progress/daily/:date`, `POST /progress/backfill`
- **Features:** Monthly calendar with color-coded days, click-to-expand day detail, streak counter, best streak, auto-backfill for empty data
- **Missing:** No weekly/monthly trends chart. No skill breakdown.

### 3.18 Daily Challenge (`DailyChallenge.tsx`)
- **What it does:** Shows a daily idiom/phrase/expression with a writing task
- **State:** challenge (ChallengeData), loading, copied
- **API calls:** `GET /daily-challenge` (AI-generated)
- **Features:** Share/copy, phrase + meaning + example + writing task
- **Actions:** Start Journal Entry, Study more idioms
- **Missing:** No completion tracking. No streak for daily challenges.

### 3.19 Grammar Practice (`GrammarPractice.tsx`)
- **What it does:** AI-generated multiple-choice grammar quiz (5 questions)
- **State:** questions[], currentIndex, selected, checked, score
- **API calls:** `GET /ai/grammar-quiz?count=5` (AI-generated)
- **Features:** Fill-in-the-blank format, correct/incorrect feedback with explanation, progress bar, score summary
- **Missing:** No difficulty adaptation. No learning session tracking (doesn't create LearningSession). No XP reward.

### 3.20 Reading Mode (`ReadingMode.tsx`)
- **What it does:** AI-generated reading article with tap-to-lookup word definitions
- **State:** fontSize, selectedWord, article
- **API calls:** `GET /ai/reading-content?topic=X&level=X`
- **Features:** Adjustable font size, click word → AI definition lookup, TTS pronunciation
- **Missing:** No comprehension questions. No save-word-to-notebook from here. Abuses reading-content endpoint for word definitions.

### 3.21 Listening Practice (`ListeningPractice.tsx`)
- **What it does:** Listen to a sentence via TTS, fill in missing words
- **State:** isPlaying, answers, content (sentence + blanks)
- **API calls:** `GET /ai/reading-content` (repurposed for sentence generation)
- **Features:** Web Speech API TTS, blank-fill exercise, check answers, show transcript
- **Missing:** No real audio files. Uses browser TTS only. No scoring. No progress tracking.

### 3.22 Speaking Report (`SpeakingReport.tsx`)
- **What it does:** Shows writing analysis report with score rings
- **State:** feedback data from latest journal
- **API calls:** `GET /journals` → `GET /journals/:id`
- **Features:** Overall score ring, grammar/vocab/fluency sub-scores (derived from corrections)
- **Missing:** Not actually a speaking report — it's a writing analysis. No real speech analysis.

### 3.23 Library (`Library.tsx`)
- **What it does:** Browse lessons by category (grammar, vocabulary, reading, listening, speaking)
- **State:** activeCategory, search, lessons
- **API calls:** `GET /library/lessons?category=X`
- **Features:** Category tabs, search, lesson cards with level badges, duration

### 3.24 Lesson Detail (`LessonDetail.tsx`)
- **What it does:** Display lesson content with sections and built-in quiz
- **State:** lesson, completedSections, quiz state
- **API calls:** `GET /library/lessons/:id`
- **Features:** Section progress tracking, inline quiz, save lesson
- **Missing:** No completion tracking sent to backend. No XP for completing lessons.

### 3.25 Leaderboard (`Leaderboard.tsx`)
- **What it does:** XP-based ranking (weekly/all-time) with podium visualization
- **State:** activeTab, ranking, userStreak
- **API calls:** `GET /leaderboard?scope=X`, `GET /progress/summary`
- **Features:** Top 3 podium, scrollable list, current user highlight

### 3.26 Achievements (`Achievements.tsx`)
- **What it does:** Grid of achievements with unlock status and progress
- **State:** achievements[], summary
- **API calls:** `GET /achievements`, `GET /achievements/summary`
- **Features:** Collection progress bar, XP earned, locked/unlocked visual states
- **Missing:** No automatic achievement unlocking logic on backend. Achievements table needs manual seeding.

### 3.27 History List (`HistoryList.tsx`)
- **What it does:** Scrollable list of past journal entries with search
- **State:** search, entries (JournalEntry[])
- **API calls:** `GET /journals?limit=50`
- **Features:** Search, score display, date formatting
- **Missing:** Uses journals endpoint, not the history/learning-sessions endpoint.

### 3.28 History Detail (`HistoryDetail.tsx`)
- **What it does:** View a single learning session detail
- **API calls:** `GET /history/:id`

### 3.29 Journal Archive (`JournalArchive.tsx`)
- **What it does:** Browse all past journals with filters (all, high-score, bookmarked)
- **State:** filter, search, entries[]
- **API calls:** `GET /journals?limit=100`
- **Missing:** "Bookmarked" filter references `item.isBookmarked` but Journal model has NO `isBookmarked` field. This filter will never return results.

### 3.30 Profile (`Profile.tsx`)
- **What it does:** User profile card with avatar, stats, navigation to sub-pages
- **State:** profile (UserProfile), summary (ProgressSummary)
- **API calls:** `GET /profile`, `GET /progress/summary`
- **Features:** Avatar placeholder, level badge, streak badge, journal/word/phrase counts, nav cards to edit-profile/reminders/settings/saved-phrases

### 3.31 Edit Profile (`EditProfile.tsx`)
- **What it does:** Edit name, bio, native language
- **API calls:** `PUT /profile`

### 3.32 Settings (`Settings.tsx`)
- **What it does:** Sound toggle, playback speed, language selection, daily goal slider, reset onboarding
- **State:** All settings + loading/saving states
- **API calls:** `GET /settings`, `PUT /settings`
- **Features:** Sound on/off, speed (slow/normal/fast), language (en-GB/en-US/vi), daily goal 5-60 min
- **Missing:** Theme setting exists in DB but not exposed in UI. Playback speed is local-only, not persisted.

### 3.33 Reminders (`Reminders.tsx`)
- **What it does:** Configure daily/weekly reminder times and tone
- **State:** dailyEnabled, weeklyEnabled, selectedTime, selectedTone
- **API calls:** `GET /reminders`, `PUT /reminders`
- **Missing:** Reminders are DB records ONLY. No push notification infrastructure. No cron job. No email sender. These do NOTHING.

### 3.34 Notifications (`Notifications.tsx`)
- **What it does:** List of in-app notifications with read/unread states
- **State:** notifications[], unreadCount
- **API calls:** `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`
- **Features:** Type-based icons/colors, time formatting, mark all read
- **Missing:** No notification creation logic anywhere in backend. The table exists but nothing populates it.

### 3.35 Saved Phrases (`SavedPhrases.tsx`)
- **What it does:** Browse/add/delete saved phrases with category filters
- **State:** filter, search, phrases[], add form state
- **API calls:** `GET /phrases`, `POST /phrases`, `DELETE /phrases/:id`
- **Features:** Category filter, search, add new phrase form, delete

### 3.36 Vocab Notebook (`VocabNotebook.tsx`)
- **What it does:** Browse/add/delete vocabulary items with mastery tracking
- **State:** masteryFilter, words[], add form state
- **API calls:** `GET /vocab/notebook`, `POST /vocab/notebook`, `PATCH /vocab/notebook/:id`, `DELETE /vocab/notebook/:id`
- **Features:** Mastery filter (new/learning/mastered), add word form, mastery change, delete

### 3.37 Skeleton Loading / Error / Static Pages
- **SkeletonLoading.tsx:** Generic loading skeleton
- **ErrorPage.tsx:** Generic error page
- **StaticPage.tsx:** Terms, privacy, help, about — all static content pages
- **ForgotPassword.tsx:** Password reset page

---

## 4. Frontend Pages — Landing

### `pages/landing/index.tsx`
Landing page assembled from section components:

| Component | Purpose |
|-----------|---------|
| `HeroManifesto.tsx` | Hero with CTA |
| `ProblemSection.tsx` | Problem statement (why traditional learning fails) |
| `CoreLoopSection.tsx` | Explains Write → AI Feedback → Speak → Review loop |
| `PsychologySection.tsx` | Science of habit formation |
| `FeatureShowcase.tsx` | Feature highlights |
| `InteractiveJournalDemo.tsx` | Interactive demo of the journal experience |
| `TargetAudienceSection.tsx` | Who STICK is for |
| `MissionSection.tsx` | Company mission |
| `ValidationSection.tsx` | Social proof/testimonials |
| `PricingSection.tsx` | Pricing plans |
| `AboutUsSection.tsx` | Team info |
| `ClosingCTASection.tsx` | Final call-to-action |

---

## 5. Frontend Pages — Admin

### Admin Router (`AdminApp.tsx`)
Sub-routes: login, dashboard, prompts, prompt-edit, users, user-detail, ai-logs, settings

| Page | File | Purpose |
|------|------|---------|
| Admin Login | `AdminLogin.tsx` | Email/password login, separate admin auth tokens |
| Admin Dashboard | `AdminDashboard.tsx` | Metric cards (sessions, completion rate, AI errors, D1 retention), funnel chart, retention cohorts, AI health timeline |
| Prompt List | `AdminPromptList.tsx` | CRUD daily prompts with date/status management |
| Prompt Editor | `AdminPromptEdit.tsx` | Create/edit prompt (Vietnamese + English, follow-up, level) |
| Users | `AdminUsers.tsx` | User list with search, sort, streak display, role/status management |
| User Detail | `AdminUserDetail.tsx` | Detailed user profile with activity graphs, recent journals |
| AI Logs | `AdminAILogs.tsx` | AI call logs with status codes, latency, errors |
| Settings | `AdminSettings.tsx` | App configuration key-value management |

---

## 6. Frontend Services & API Layer

### `services/api/client.ts`
- Base HTTP client with `apiRequest<T>()` generic wrapper
- Bearer token auth from localStorage
- 401 auto-recovery: clears token → creates guest session → retries
- API base URL from `VITE_API_BASE_URL` env

### `services/api/auth.ts`
- `registerWithEmail()` — Firebase email/password → backend exchange
- `loginWithEmail()` — Firebase email/password → backend exchange
- `loginWithGoogle()` — Firebase Google popup → backend exchange
- `createGuestSession()` — Firebase anonymous → backend exchange
- `ensureSession()` — Creates guest if no token exists
- `logout()` — Clears localStorage + Firebase signOut

### `services/api/onboarding.ts`
- `saveOnboardingState(patch)` — PUT /onboarding/state

### `services/api/endpoints.ts`
Full typed API wrapper with interfaces for:
- Settings (get/update)
- Reminders (get/update)
- Notifications (get, mark read, mark all read)
- Achievements (list, summary)
- Saved Phrases (list, create, delete)
- Vocab Notebook (list, create, update, delete)
- History (list, detail)
- Progress (summary, daily, daily detail)
- Leaderboard
- Lessons (list, detail)
- Journal Mood

### `services/api/admin.api.ts`
Separate admin auth with own localStorage keys:
- Admin login/logout
- Prompts CRUD + publish
- Metric cards, funnel, retention, AI health
- Users list/detail/patch
- AI Logs list/detail
- Config get/update

### `services/analytics/coreLoop.ts`
Firebase Analytics event tracking:
- `trackSessionStart`, `trackPromptView`, `trackDraftSaved`
- `trackSubmissionSent`, `trackFeedbackView`, `trackAudioPlay`
- `trackReviewDone`, `trackCompletionView`, `trackAiError`

### `services/firebase.ts`
Firebase client initialization (Auth + Google provider)

---

## 7. Frontend Components & Layout

### Layout
- `AppLayout.tsx` — Desktop sidebar + mobile bottom nav + top header with language toggle + streak badge + user avatar

### UI Components
| Component | Purpose |
|-----------|---------|
| `Button.tsx` | Reusable button component |
| `Icon.tsx` | Icon wrapper |
| `LoadingScreen.tsx` | Full-screen loading animation (initial app load) |
| `NumberCounter.tsx` | Animated number counter |
| `ScrollToTopButton.tsx` | Scroll-to-top FAB |
| `SketchCard.tsx` | Sketch-style card wrapper |
| `TypewriterText.tsx` | Typewriter text animation |
| `TopNavBar.tsx` | Top navigation bar |
| `Footer.tsx` | Footer component |

### Missing Component Directories
- **NO `hooks/` directory** — No custom hooks at all
- **NO `contexts/` directory** — No React Context providers
- **NO `domain-components/` directory**
- **NO `data/` directory** — No static data files

---

## 8. Frontend Types / DTOs

### `types/dto/ai-feedback.ts`
- `AiFeedbackDto` interface: overallScore, enhancedText, corrections, vocabularyBoosters, sentencePatterns, encouragement
- `parseFeedback()` — Robust parser handling string/object/null

### `types/dto/admin.dto.ts`
- Full admin DTO types: DailyPromptDTO, MetricCardsDTO, FunnelDTO, RetentionDTO, AIHealthDTO, AdminUserDTO, AdminUserDetailDTO, AILogDTO, AppConfigDTO, PaginatedResponse, AdminLoginResponse

---

## 9. Backend API Routes (Complete)

### Auth Routes
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | No | Email/password registration |
| POST | `/auth/login` | No | Email/password login |
| POST | `/auth/guest` | No | Create anonymous guest session |
| POST | `/auth/firebase/login` | No | Firebase ID token exchange |
| POST | `/auth/logout` | Yes | Session deletion |
| GET | `/me` | Yes | Current user info |

### Onboarding
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/onboarding/state` | Yes | Get onboarding progress |
| PUT | `/onboarding/state` | Yes | Update step/level/schedule/goal |
| POST | `/onboarding/complete` | Yes | Mark onboarding done |

### Profile
| GET | `/profile` | Yes | Get user profile |
| PUT | `/profile` | Yes | Update name/bio/nativeLanguage |

### Journals
| POST | `/journals` | Yes | Create journal (+10 XP) |
| GET | `/journals` | Yes | List user journals |
| GET | `/journals/:id` | Yes | Get single journal |
| PATCH | `/journals/:id` | Yes | Update journal |
| DELETE | `/journals/:id` | Yes | Soft delete |
| GET | `/journals/:id/review-items` | Yes | Get vocab from feedback |
| POST | `/journals/:id/mood` | Yes | Save mood to journal |

### AI Features
| POST | `/ai/feedback/text` | Yes | Generate AI journal feedback |
| GET | `/ai/grammar-quiz` | Yes | Generate grammar quiz |
| GET | `/ai/reading-content` | Yes | Generate reading article |
| GET | `/daily-challenge` | Yes | Get daily idiom/phrase challenge |
| GET | `/daily-prompt/today` | Yes | Get admin-managed daily prompt |

### Settings / Reminders / Notifications
| GET/PUT | `/settings` | Yes | User settings CRUD |
| GET/PUT | `/reminders` | Yes | Reminder CRUD (delete-all + recreate) |
| GET | `/notifications` | Yes | List with cursor pagination |
| PATCH | `/notifications/:id/read` | Yes | Mark one read |
| POST | `/notifications/read-all` | Yes | Mark all read |

### Achievements
| GET | `/achievements` | Yes | List all definitions + user unlocks |
| GET | `/achievements/summary` | Yes | Unlock stats + XP earned |

### Saved Phrases & Vocab
| GET/POST/DELETE | `/phrases` | Yes | Saved phrases CRUD (+2 XP) |
| GET/POST/PATCH/DELETE | `/vocab/notebook` | Yes | Vocab notebook CRUD (+1 word, +3 XP) |

### History & Progress
| GET | `/history` | Yes | Learning sessions list (cursor pagination) |
| GET | `/history/:id` | Yes | Single session detail |
| GET | `/progress/summary` | Yes | Aggregated stats + streak calculation |
| GET | `/progress/daily` | Yes | Daily progress for N days |
| GET | `/progress/daily/:date` | Yes | Single day detail with journals |
| POST | `/progress/backfill` | Yes | Reconstruct ProgressDaily from historical data |

### Library & Leaderboard
| GET | `/library/lessons` | No | List published lessons |
| GET | `/library/lessons/:id` | No | Single lesson |
| GET | `/leaderboard` | Yes | Weekly/all-time XP ranking |

### Admin Routes (all require auth + admin role)
- `POST /admin/login` — Admin-specific login
- `GET/POST/PUT/DELETE /admin/prompts` — Daily prompt CRUD
- `POST /admin/prompts/:id/publish` — Publish/schedule prompt
- `GET /admin/metrics/cards|funnel|retention|ai-health` — Analytics dashboards
- `GET/PATCH /admin/users` — User management
- `GET /admin/ai-logs` — AI call logs
- `GET/PUT /admin/config` — App configuration

---

## 10. Backend Libraries

| File | Purpose |
|------|---------|
| `lib/auth.js` | SHA-256 password hashing, session creation/validation, `requireAuth` middleware |
| `lib/db.js` | Prisma client initialization |
| `lib/firebase.js` | Firebase Admin SDK (verifyIdToken) |
| `lib/groqAI.js` | Groq AI integration (journal feedback, daily challenge, grammar quiz, reading content) |
| `lib/dataStore.js` | Legacy JSON file-based data store (dev fallback) |
| `middlewares/requireAdmin.js` | Admin role check middleware |

---

## 11. Database Schema (Prisma)

### Models (13 total):
| Model | Purpose |
|-------|---------|
| `User` | Core user (email, Firebase UID, role, status) |
| `Session` | Auth sessions (token-based) |
| `OnboardingState` | Onboarding progress (step, level, schedule, goal) |
| `Journal` | Journal entries (title, content, score, feedback, soft-delete) |
| `UserSettings` | Theme, language, sound, daily goal |
| `Reminder` | Reminder schedules |
| `Notification` | In-app notifications |
| `AchievementDefinition` | Achievement templates (key, threshold, XP reward) |
| `UserAchievement` | User's unlocked achievements |
| `SavedPhrase` | Saved phrases with category |
| `VocabNotebookItem` | Vocabulary with mastery tracking (new/learning/mastered) |
| `LearningSession` | Activity history (type, title, score, duration) |
| `ProgressDaily` | Per-day aggregated stats (journals, words, minutes, XP) |
| `Lesson` | Library content (category, level, content, duration) |
| `DailyPrompt` | Admin-managed daily prompts (Vi + En, status, level) |

---

## 12. Analytics & Tracking

### Events Tracked (Firebase Analytics):
1. `session_start` — When entering journal workspace
2. `prompt_view` — When viewing journal intro
3. `draft_saved` — (defined but NOT called anywhere)
4. `submission_sent` — When submitting journal
5. `feedback_view` — When viewing feedback result
6. `audio_play` — When playing TTS in speaking intro
7. `review_done` — When finishing vocab review
8. `completion_view` — When reaching completion page
9. `ai_error` — (defined but NOT called anywhere)

### XP System:
| Action | XP Earned |
|--------|-----------|
| Create journal | +10 |
| AI feedback score bonus | +(score/5) |
| Save phrase | +2 |
| Add vocab word | +3 |
| Learning session | +5 |

---

## 13. Feature Gap Analysis

### ONBOARDING
- ✅ 4-step intro carousel
- ✅ Level, schedule, goal selection
- ✅ Guest auto-session
- ❌ No progress persistence during onboarding steps (only after selections)
- ❌ No welcome tutorial for app navigation
- ❌ No sample journal walkthrough

### PROGRESS / XP SYSTEM
- ✅ Daily progress tracking (journals, words, minutes, XP)
- ✅ Streak calculation (current + best)
- ✅ Calendar heatmap
- ✅ Progress summary
- ❌ No level-up system (XP accumulates but user never levels up)
- ❌ No XP for completing grammar quizzes
- ❌ No XP for reading mode
- ❌ No XP for listening practice
- ❌ No XP for completing lessons
- ❌ No daily XP goal tracking against settings.dailyGoalMinutes

### STREAK MECHANICS
- ✅ Current streak calculated from ProgressDaily
- ✅ Best streak tracking
- ✅ Streak display on dashboard + header
- ❌ No streak protection (freeze days)
- ❌ No streak milestone celebrations
- ❌ No streak broken notification

### GAMIFICATION
- ✅ Achievements system (DB structure exists)
- ✅ XP system
- ✅ Leaderboard (weekly/all-time)
- ❌ Achievement definitions NOT seeded — empty table means no achievements shown
- ❌ No automatic achievement unlocking logic
- ❌ No badges/titles
- ❌ No leveling/ranking system
- ❌ No daily challenges completion tracking

### SOCIAL FEATURES
- ✅ Leaderboard
- ❌ No friends/following
- ❌ No shared journals
- ❌ No comments/reactions
- ❌ No chat
- ❌ No study groups

### NOTIFICATION SYSTEM
- ✅ Notification DB model + API + UI
- ❌ Nothing creates notifications — database will always be empty
- ❌ No push notifications (no FCM, no service worker)
- ❌ No email notifications
- ❌ Reminders table exists but has no execution mechanism

### AUDIO / VOICE FEATURES
- ✅ Web Speech API TTS for enhanced text playback
- ✅ MediaRecorder for speaking practice recording
- ❌ Audio recordings are NEVER uploaded or analyzed
- ❌ No pronunciation scoring
- ❌ No speech-to-text comparison
- ❌ No real audio files — all TTS is browser-generated
- ❌ SpeakingReport is actually a writing report — misleading name

### REVIEW / SPACED REPETITION
- ✅ Vocab notebook with mastery levels (new/learning/mastered)
- ✅ Sequential vocab review from journal feedback
- ❌ No spaced repetition algorithm (SM-2 or similar)
- ❌ No review scheduling
- ❌ No review reminders
- ❌ "Review Later" just skips — doesn't add to any queue

### CONTENT DELIVERY
- ✅ Admin-managed daily prompts (full CRUD)
- ✅ Library lessons (from DB)
- ✅ AI-generated grammar quizzes
- ✅ AI-generated reading content
- ✅ AI-generated daily challenges
- ❌ Daily prompt (`/daily-prompt/today`) exists on backend but is NEVER called by frontend
- ❌ Lesson content needs manual DB seeding
- ❌ No content progression/curriculum

### ERROR HANDLING
- ✅ 401 auto-recovery with guest session
- ✅ Try/catch on all API calls with console.error
- ✅ Loading states on all pages
- ✅ Error page component exists
- ❌ No global error boundary
- ❌ No toast/snackbar notification system for errors
- ❌ No retry mechanism (beyond 401 recovery)
- ❌ No offline detection

### OFFLINE CAPABILITIES
- ❌ No service worker
- ❌ No offline cache
- ❌ No draft persistence in IndexedDB
- ❌ No PWA manifest (not checked, but likely missing)

### PUSH NOTIFICATIONS
- ❌ Completely absent. No FCM setup, no service worker, no permission request

### USER ENGAGEMENT HOOKS
- ✅ Streak counter + visibility
- ✅ Daily challenge
- ✅ Completion celebration
- ✅ Mood tracking
- ❌ No push notification nudges
- ❌ No email re-engagement
- ❌ No "come back" reminders that actually work
- ❌ No personalized recommendations
- ❌ No learning path/curriculum progression
- ❌ Dashboard doesn't show daily prompt (missed opportunity)

---

## 14. Security Issues

### CRITICAL: SQL Injection in Admin Routes
The admin routes in `apiV1.js` use **raw string interpolation** in SQL queries:
```javascript
// VULNERABLE — line ~1340
`SELECT * FROM \`DailyPrompt\` WHERE id = '${req.params.id}'`
// VULNERABLE — admin prompts CRUD uses string interpolation for all fields
```
This is a **SQL injection vulnerability** in the admin prompt CRUD routes. While protected by `requireAdmin` middleware, a compromised admin account could exploit this.

### Firebase API Key Exposed
`services/analytics/coreLoop.ts` contains hardcoded Firebase config (API key, project ID). While Firebase keys are designed to be client-side, this should be in environment variables.

### Password Hashing
`lib/auth.js` uses SHA-256 for password hashing. This is insufficient — should use bcrypt, scrypt, or Argon2.

### Session Tokens
No token expiration enforcement visible in the auth flow.

---

## 15. Critical Missing Pieces (Priority Order)

### P0 — Broken / Non-functional
1. **Notifications system is empty**: Nothing creates notifications. Users see "No notifications" forever.
2. **Reminders do nothing**: Stored in DB but no execution mechanism.
3. **Journal Archive bookmarked filter is broken**: References `isBookmarked` field that doesn't exist in schema.
4. **Achievements are empty**: No seed data, no unlock logic — grid will be blank.
5. **Daily prompt not shown to users**: Admin can create prompts, backend has `/daily-prompt/today` endpoint, but frontend NEVER calls it.
6. **Speaking practice is fake**: Audio not uploaded, no analysis, no scoring.

### P1 — Missing Core Features
7. **No spaced repetition** — Vocab review is sequential only
8. **No automatic achievement unlocking** — Backend never checks/awards achievements
9. **No level-up system** — XP accumulates with no progression
10. **No push notifications** — Zero re-engagement capability
11. **No global state management** — Every page re-fetches everything
12. **No React Router** — Giant if/else, no code splitting, no lazy loading

### P2 — Missing Quality Features
13. No autosave in journal workspace
14. No offline support
15. No error boundary
16. No toast notifications
17. Grammar/reading/listening don't award XP
18. No real-time streak update in header (hardcoded "12 Days")
19. Settings theme not exposed in UI
20. Playback speed not persisted

---

*End of Audit*

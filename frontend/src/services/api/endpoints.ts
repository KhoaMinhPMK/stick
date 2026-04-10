import { apiRequest } from './client';

// ─── Settings ────────────────────────────────────────
export interface UserSettings {
  id: string;
  theme: string;
  language: string;
  notificationsOn: boolean;
  soundOn: boolean;
  dailyGoalMinutes: number;
}

export async function getSettings() {
  return apiRequest<{ settings: UserSettings }>('/settings');
}

export async function updateSettings(data: Partial<UserSettings>) {
  return apiRequest<{ settings: UserSettings }>('/settings', {
    method: 'PUT',
    body: data,
  });
}

// ─── Reminders ───────────────────────────────────────
export interface Reminder {
  id: string;
  time: string;
  days: string;
  enabled: boolean;
  label: string | null;
}

export async function getReminders() {
  return apiRequest<{ items: Reminder[]; total: number }>('/reminders');
}

export async function updateReminders(reminders: Partial<Reminder>[]) {
  return apiRequest<{ items: Reminder[]; total: number }>('/reminders', {
    method: 'PUT',
    body: { reminders },
  });
}

// ─── Notifications ───────────────────────────────────
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  data: string | null;
  createdAt: string;
}

export async function getNotifications(limit = 20, cursor?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<{
    items: Notification[];
    total: number;
    unreadCount: number;
    nextCursor: string | null;
  }>(`/notifications?${params}`);
}

export async function markNotificationRead(id: string) {
  return apiRequest<{ notification: Notification }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return apiRequest<{ message: string }>('/notifications/read-all', {
    method: 'POST',
  });
}

// ─── Achievements ────────────────────────────────────
export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export interface AchievementSummary {
  totalAchievements: number;
  unlocked: number;
  locked: number;
  xpEarned: number;
  completionPercent: number;
}

export async function getAchievements() {
  return apiRequest<{ items: Achievement[]; total: number }>('/achievements');
}

export async function getAchievementsSummary() {
  return apiRequest<AchievementSummary>('/achievements/summary');
}

// ─── Saved Phrases ───────────────────────────────────
export interface SavedPhrase {
  id: string;
  phrase: string;
  meaning: string | null;
  example: string | null;
  category: string;
  createdAt: string;
}

export async function getPhrases(category?: string, search?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search) params.set('search', search);
  const qs = params.toString();
  return apiRequest<{ items: SavedPhrase[]; total: number }>(`/phrases${qs ? `?${qs}` : ''}`);
}

export async function createPhrase(data: { phrase: string; meaning?: string; example?: string; category?: string }) {
  return apiRequest<{ phrase: SavedPhrase }>('/phrases', {
    method: 'POST',
    body: data,
  });
}

export async function deletePhrase(id: string) {
  return apiRequest<{ message: string }>(`/phrases/${id}`, {
    method: 'DELETE',
  });
}

// ─── Vocab Notebook ──────────────────────────────────
export interface VocabItem {
  id: string;
  word: string;
  meaning: string | null;
  example: string | null;
  mastery: string;
  tags: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getVocabNotebook(mastery?: string) {
  const params = mastery ? `?mastery=${mastery}` : '';
  return apiRequest<{ items: VocabItem[]; total: number }>(`/vocab/notebook${params}`);
}

export async function createVocabItem(data: { word: string; meaning?: string; example?: string; tags?: string; notes?: string }) {
  return apiRequest<{ item: VocabItem; xpAwarded: number }>('/vocab/notebook', {
    method: 'POST',
    body: data,
  });
}

export async function updateVocabItem(id: string, data: Partial<VocabItem>) {
  return apiRequest<{ item: VocabItem }>(`/vocab/notebook/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteVocabItem(id: string) {
  return apiRequest<{ message: string }>(`/vocab/notebook/${id}`, {
    method: 'DELETE',
  });
}

// ─── Feedback Vocab Import ────────────────────────────
// Save AI-suggested vocab boosters from a journal into the vocab notebook.
export interface FeedbackVocabItem {
  word: string;
  meaning?: string;
  example?: string;
}

export async function importFeedbackVocab(journalId: string, items: FeedbackVocabItem[]) {
  return apiRequest<{ saved: number }>(`/journals/${journalId}/import-vocab`, {
    method: 'POST',
    body: { items },
  });
}

// ─── Vocab SRS ───────────────────────────────────────
export interface VocabSRSItem extends VocabItem {
  nextReviewAt: string | null;
  easeFactor: number;
  reviewInterval: number;
  reviewCount: number;
}

export async function getDueVocab(limit = 20) {
  return apiRequest<{ items: VocabSRSItem[]; total: number }>(`/vocab/notebook/due?limit=${limit}`);
}

export async function reviewVocabItem(id: string, quality: number) {
  return apiRequest<{ item: VocabSRSItem }>(`/vocab/notebook/${id}/review`, {
    method: 'POST',
    body: { quality },
  });
}

// ─── TTS ─────────────────────────────────────────────
/** Returns base64-encoded MP3 audio from the OpenAI TTS API. */
export async function ttsSpeak(text: string, voice = 'nova'): Promise<string> {
  const res = await apiRequest<{ audio: string }>('/tts', {
    method: 'POST',
    body: { text, voice },
  });
  return res.audio;
}

// ─── Journal Bookmark ─────────────────────────────────
export async function bookmarkJournal(id: string, isBookmarked: boolean) {
  return apiRequest<{ journal: { id: string; isBookmarked: boolean } }>(`/journals/${id}/bookmark`, {
    method: 'PATCH',
    body: { isBookmarked },
  });
}

// ─── Daily Challenge Evaluate ─────────────────────────
export async function evaluateDailyChallenge(sentence: string, phrase: string, meaning: string) {
  return apiRequest<{ correct: boolean; feedback: string; suggestion: string }>('/daily-challenge/evaluate', {
    method: 'POST',
    body: { sentence, phrase, meaning },
  });
}

// ─── History ─────────────────────────────────────────
export interface LearningSession {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  score: number | null;
  duration: number | null;
  metadata: unknown;
  completedAt: string;
}

export async function getHistory(limit = 20, cursor?: string, type?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  if (type) params.set('type', type);
  return apiRequest<{
    items: LearningSession[];
    total: number;
    nextCursor: string | null;
  }>(`/history?${params}`);
}

export async function getHistoryDetail(id: string) {
  return apiRequest<{ session: LearningSession }>(`/history/${id}`);
}

// ─── Learning Sessions ──────────────────────────────
export async function createLearningSession(data: {
  type: string;
  title: string;
  summary?: string;
  score?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}) {
  return apiRequest<{ session: LearningSession }>('/learning-sessions', {
    method: 'POST',
    body: data,
  });
}

// ─── Progress ────────────────────────────────────────
export interface LevelInfo {
  level: number;
  name: string;
  badge: string;
  totalXp: number;
  xpIntoLevel: number;
  xpForLevel: number;
  progressPct: number;
  isMax: boolean;
}

export interface ProgressSummary {
  totalJournals: number;
  totalWords: number;
  totalPhrases: number;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  avgScore: number;
  totalXp: number;
  levelInfo: LevelInfo;
  onboardingCompleted: boolean;
  level: string;
  memberSince: string | null;
  todayCompleted: boolean;
  todayJournalId: string | null;
  todayDraftId: string | null;
  dailyLimitReached: boolean;
  dayNumber: number;
  totalActiveDays: number;
  streakFreezeCount: number;
  isPremium: boolean;
  avatarUrl: string | null;
  isLeaderboardTop: boolean;
}

export interface XpLogEntry {
  id: string;
  amount: number;
  source: string;
  description: string | null;
  journalId: string | null;
  createdAt: string;
}

export interface XpHistory {
  totalXp: number;
  levelInfo: LevelInfo;
  logs: XpLogEntry[];
}

export interface ProgressDailyItem {
  id: string;
  day: string;
  journalsCount: number;
  wordsLearned: number;
  minutesSpent: number;
  xpEarned: number;
}

export async function getProgressSummary() {
  const summary = await apiRequest<ProgressSummary>('/progress/summary');
  // Sync premium + avatar into localStorage so hooks read updated values
  try {
    const raw = localStorage.getItem('stick_user');
    if (raw) {
      const stored = JSON.parse(raw);
      let changed = false;
      if (stored.isPremium !== summary.isPremium) { stored.isPremium = summary.isPremium; changed = true; }
      if (summary.avatarUrl !== undefined && stored.avatarUrl !== summary.avatarUrl) { stored.avatarUrl = summary.avatarUrl; changed = true; }
      if (changed) localStorage.setItem('stick_user', JSON.stringify(stored));
    }
  } catch { /* best-effort sync */ }
  return summary;
}

export async function getXpHistory(limit = 20) {
  return apiRequest<XpHistory>(`/xp/history?limit=${limit}`);
}

export async function getProgressDaily(days = 30) {
  return apiRequest<{ items: ProgressDailyItem[]; days: number }>(`/progress/daily?days=${days}`);
}

export async function getProgressDailyDetail(date: string) {
  return apiRequest<{ detail: (ProgressDailyItem & { journals: { id: string; title: string; score: number | null; createdAt: string }[] }) | null }>(`/progress/daily/${date}`);
}

// ─── Leaderboard ─────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  isUser: boolean;
  avatarUrl: string | null;
  isPremium: boolean;
}

export async function getLeaderboard(scope: 'weekly' | 'all-time' = 'weekly') {
  return apiRequest<{ items: LeaderboardEntry[]; scope: string }>(`/leaderboard?scope=${scope}`);
}

// ─── Journal Mood ────────────────────────────────────
export async function postJournalMood(journalId: string, mood: string) {
  return apiRequest<{ message: string; mood: string }>(`/journals/${journalId}/mood`, {
    method: 'POST',
    body: { mood },
  });
}

// ─── Streak Freezes ─────────────────────────────────
export interface StreakFreeze {
  id: string;
  source: string;
  note: string | null;
  grantedAt: string;
  expiresAt: string | null;
}

export interface StreakFreezeUsed {
  id: string;
  source: string;
  usedAt: string;
  usedForDate: string | null;
}

export async function getStreakFreezes() {
  return apiRequest<{ available: StreakFreeze[]; used: StreakFreezeUsed[]; availableCount: number }>('/streak/freezes');
}

// ─── Library / Lessons ───────────────────────────────
export interface LessonSummary {
  id: string;
  title: string;
  titleVi?: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  orderIndex: number;
  xpReward: number;
  isPremium: boolean;
  tags: string[];
  progress?: {
    bestScore: number;
    starRating: number;
    totalAttempts: number;
  } | null;
}

export interface LessonContentSection {
  type: 'text' | 'vocab' | 'vocabulary' | 'grammar' | 'grammar_rule' | 'exercises' | 'practice' | 'summary' | 'dialogue';
  title?: string;
  content?: string;
  prompt?: string;
  items?: { word: string; meaning: string; example?: string; phonetic?: string }[];
  pattern?: string;
  rule?: string;
  examples?: string[];
  notes?: string;
  exercises?: LessonExerciseItem[];
}

export interface LessonExerciseItem {
  type: 'multiple_choice' | 'fill_blank' | 'match' | 'reorder';
  question?: string;
  instruction?: string;
  options?: string[];
  correctAnswer?: string;
  acceptableAnswers?: string[];
  correctPairs?: [string, string][];
  words?: string[];
  correctOrder?: string[];
  points: number;
  explanation?: string;
}

export interface LessonDetail extends LessonSummary {
  content: string | { sections: LessonContentSection[] };
}

export interface LessonValidationResult {
  exerciseIndex: number;
  correct: boolean;
  explanation?: string;
  pointsEarned: number;
}

export interface LessonCompletionResult {
  attempt: {
    id: string;
    score: number;
    starRating: number;
    xpEarned: number;
    comboMax: number;
    isReview: boolean;
  };
  progress: {
    bestScore: number;
    starRating: number;
    totalAttempts: number;
    totalXpEarned: number;
  };
  vocabAdded: number;
}

export interface LessonProgressResult {
  progress: {
    bestScore: number;
    starRating: number;
    totalAttempts: number;
    totalXpEarned: number;
    firstCompletedAt: string;
    lastAttemptAt: string;
  } | null;
  recentAttempts: {
    id: string;
    score: number;
    starRating: number;
    xpEarned: number;
    comboMax: number;
    isReview: boolean;
    createdAt: string;
  }[];
}

export async function getLessons(category?: string, level?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (level) params.set('level', level);
  const qs = params.toString();
  return apiRequest<{ items: LessonSummary[]; total: number }>(`/library/lessons${qs ? `?${qs}` : ''}`);
}

export async function getLessonDetail(id: string) {
  return apiRequest<{ lesson: LessonDetail }>(`/library/lessons/${id}`);
}

export async function validateExercise(lessonId: string, exerciseIndex: number, answer: string | string[] | [string, string][]) {
  return apiRequest<LessonValidationResult>(`/library/lessons/${lessonId}/validate`, {
    method: 'POST',
    body: { exerciseIndex, answer },
  });
}

export async function completeLessonProgress(
  lessonId: string,
  data: { score: number; totalPoints: number; maxCombo: number; answers: Record<string, unknown>[]; duration: number }
) {
  return apiRequest<LessonCompletionResult>(`/library/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: data,
  });
}

export async function getLessonProgress(lessonId: string) {
  return apiRequest<LessonProgressResult>(`/library/lessons/${lessonId}/progress`);
}

// GAP-13: Account deletion
export async function deleteAccount() {
  return apiRequest<{ message: string }>('/me', {
    method: 'DELETE',
  });
}

// ─── Daily Prompt ────────────────────────────────────
export interface DailyPromptResponse {
  prompt: {
    id: string;
    promptEn: string;
    promptVi: string;
    followUp: string | null;
    level: string;
  } | null;
  fallback: boolean;
  promptEn?: string;
  promptVi?: string;
}

export async function getDailyPrompt() {
  return apiRequest<DailyPromptResponse>('/daily-prompt/today');
}


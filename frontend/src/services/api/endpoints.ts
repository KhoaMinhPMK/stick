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
  return apiRequest<{ item: VocabItem }>('/vocab/notebook', {
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
export interface ProgressSummary {
  totalJournals: number;
  totalWords: number;
  totalPhrases: number;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  avgScore: number;
  totalXp: number;
  onboardingCompleted: boolean;
  level: string;
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
  return apiRequest<ProgressSummary>('/progress/summary');
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

// ─── Library / Lessons ───────────────────────────────
export interface LessonSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: number;
  orderIndex: number;
}

export interface LessonDetail extends LessonSummary {
  content: string;
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

// GAP-15: Lesson completion tracking
export async function completeLessonProgress(lessonId: string, duration?: number) {
  return apiRequest<{ session: LearningSession }>(`/library/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: { duration },
  });
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


import { apiRequest } from './client';
import type {
  DailyPromptDTO,
  CreatePromptDTO,
  PromptFilterParams,
  MetricCardsDTO,
  FunnelDTO,
  RetentionDTO,
  AIHealthDTO,
  AdminUserDTO,
  AdminUserDetailDTO,
  AILogDTO,
  AppConfigDTO,
  PaginatedResponse,
  AdminLoginResponse,
  UserFilterParams,
  AILogFilterParams,
  AdminLessonDTO,
  AdminLessonDetailDTO,
  CreateLessonDTO,
  LessonFilterParams,
  AdminLearningPathDTO,
  LessonContentJSON,
} from '../../types/dto/admin.dto';

const ADMIN_TOKEN_KEY = 'stick_admin_token';
const ADMIN_USER_KEY = 'stick_admin_user';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getAdminUser(): { id: string; name: string; email: string; role: string } | null {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAdminAuth() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

function adminRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getAdminToken();
  return apiRequest<T>(path, { ...options, token, _noRetry: true } as Parameters<typeof apiRequest>[1]);
}

// ─── Auth ─────────────────────────────
export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  const res = await apiRequest<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: { email, password },
    token: null,
    _noRetry: true,
  } as Parameters<typeof apiRequest>[1]);
  localStorage.setItem(ADMIN_TOKEN_KEY, res.accessToken);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.user));
  return res;
}

export function adminLogout() {
  clearAdminAuth();
  window.location.hash = '#admin/login';
}

// ─── Prompts ──────────────────────────
export function getPrompts(params: PromptFilterParams = {}) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.search) qs.set('search', params.search);
  if (params.level && params.level !== 'all') qs.set('level', params.level);
  if (params.search) qs.set('search', params.search);
  if (params.level && params.level !== 'all') qs.set('level', params.level);
  const query = qs.toString();
  return adminRequest<PaginatedResponse<DailyPromptDTO>>(`/admin/prompts${query ? `?${query}` : ''}`);
}

export function getPrompt(id: string) {
  return adminRequest<{ prompt: DailyPromptDTO }>(`/admin/prompts/${id}`);
}

export function createPrompt(data: CreatePromptDTO) {
  return adminRequest<{ prompt: DailyPromptDTO }>('/admin/prompts', {
    method: 'POST',
    body: data,
  });
}

export function updatePrompt(id: string, data: Partial<CreatePromptDTO> & { status?: string }) {
  return adminRequest<{ prompt: DailyPromptDTO }>(`/admin/prompts/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export function deletePrompt(id: string) {
  return adminRequest<{ message: string }>(`/admin/prompts/${id}`, { method: 'DELETE' });
}

export function publishPrompt(id: string, status: 'scheduled' | 'published') {
  return adminRequest<{ prompt: DailyPromptDTO }>(`/admin/prompts/${id}/publish`, {
    method: 'POST',
    body: { status },
  });
}

// ─── Metrics ──────────────────────────
export function getMetricCards(date: string) {
  return adminRequest<MetricCardsDTO>(`/admin/metrics/cards?date=${date}`);
}

export function getMetricFunnel(from: string, to: string) {
  return adminRequest<FunnelDTO>(`/admin/metrics/funnel?from=${from}&to=${to}`);
}

export function getRetention(from: string, to: string) {
  return adminRequest<RetentionDTO>(`/admin/metrics/retention?from=${from}&to=${to}`);
}

export function getAIHealth(days = 7) {
  return adminRequest<AIHealthDTO>(`/admin/metrics/ai-health?days=${days}`);
}

// ─── Users ────────────────────────────
export function getUsers(params: UserFilterParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', params.page);
  if (params.premium) qs.set('premium', params.premium);
  if (params.limit) qs.set('limit', params.limit);
  if (params.sort) qs.set('sort', params.sort);
  if (params.premium) qs.set('premium', params.premium);
  const query = qs.toString();
  return adminRequest<PaginatedResponse<AdminUserDTO>>(`/admin/users${query ? `?${query}` : ''}`);
}

export function getUser(id: string) {
  return adminRequest<AdminUserDetailDTO>(`/admin/users/${id}`);
}

export function patchUser(id: string, data: { role?: string; status?: string; isPremium?: boolean }) {
  return adminRequest<{ user: { id: string; name: string; email: string | null; role: string; status: string; isPremium: boolean; premiumSince: string | null; premiumUntil: string | null } }>(
    `/admin/users/${id}`,
    { method: 'PATCH', body: data },
  );
}

// ─── Streak Freezes ───────────────────
export interface AdminStreakFreeze {
  id: string;
  source: string;
  note: string | null;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedForDate: string | null;
}

export function getAdminUserStreakFreezes(userId: string) {
  return adminRequest<{ available: AdminStreakFreeze[]; used: AdminStreakFreeze[]; expired: AdminStreakFreeze[]; availableCount: number }>(`/admin/users/${userId}/streak-freezes`);
}

export function grantStreakFreeze(userId: string, count: number, note?: string, expiresAt?: string) {
  return adminRequest<{ created: AdminStreakFreeze[]; count: number }>(
    `/admin/users/${userId}/streak-freezes`,
    { method: 'POST', body: { count, note, expiresAt } },
  );
}

export function revokeStreakFreeze(userId: string, freezeId: string) {
  return adminRequest<{ message: string }>(
    `/admin/users/${userId}/streak-freezes/${freezeId}`,
    { method: 'DELETE' },
  );
}

// ─── User Stats ───────────────────────
export interface AdminUserStats {
  id: string;
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
}

export function adjustUserStats(
  userId: string,
  payload: { xpAdjustment?: number; setCurrentStreak?: number; setBestStreak?: number },
) {
  return adminRequest<{ stats: AdminUserStats }>(
    `/admin/users/${userId}/stats`,
    { method: 'POST', body: payload },
  );
}

// ─── AI Logs ──────────────────────────
export function getAILogs(params: AILogFilterParams = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  const query = qs.toString();
  return adminRequest<PaginatedResponse<AILogDTO>>(`/admin/ai-logs${query ? `?${query}` : ''}`);
}

export function getAILog(id: string) {
  return adminRequest<{ log: AILogDTO }>(`/admin/ai-logs/${id}`);
}

// ─── Config ───────────────────────────
export function getConfigs() {
  return adminRequest<{ items: AppConfigDTO[] }>('/admin/config');
}

export function updateConfig(key: string, value: string) {
  return adminRequest<{ config: AppConfigDTO }>(`/admin/config/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: { value },
  });
}

// ─── Lessons ──────────────────────────
export function getLessons(params: LessonFilterParams = {}) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.level && params.level !== 'all') qs.set('level', params.level);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', params.page);
  if (params.limit) qs.set('limit', params.limit);
  const query = qs.toString();
  return adminRequest<PaginatedResponse<AdminLessonDTO>>(`/admin/lessons${query ? `?${query}` : ''}`);
}

export function getLesson(id: string) {
  return adminRequest<{ lesson: AdminLessonDetailDTO }>(`/admin/lessons/${id}`);
}

export function createLesson(data: CreateLessonDTO) {
  return adminRequest<{ lesson: AdminLessonDetailDTO }>('/admin/lessons', {
    method: 'POST',
    body: data,
  });
}

export function updateLesson(id: string, data: Partial<CreateLessonDTO> & { status?: string }) {
  return adminRequest<{ lesson: AdminLessonDetailDTO }>(`/admin/lessons/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export function deleteLesson(id: string) {
  return adminRequest<{ message: string }>(`/admin/lessons/${id}`, { method: 'DELETE' });
}

export function duplicateLesson(id: string) {
  return adminRequest<{ lesson: AdminLessonDetailDTO }>(`/admin/lessons/${id}/duplicate`, {
    method: 'POST',
  });
}

export function aiGenerateLesson(opts: { topic: string; level?: string; category?: string; includeExercises?: boolean }) {
  return adminRequest<{ lesson: LessonContentJSON & { title: string; titleVi: string | null; description: string }; latencyMs: number }>(
    '/admin/lessons/ai-generate',
    { method: 'POST', body: opts },
  );
}

export function aiGenerateExercises(opts: {
  topic: string;
  level?: string;
  category?: string;
  exerciseCount?: number;
  exerciseTypes?: string[];
}) {
  return adminRequest<{ exercises: AdminLessonDetailDTO['content']['sections'][0]['exercises']; latencyMs: number }>(
    '/admin/lessons/ai-exercises',
    { method: 'POST', body: opts },
  );
}

// ─── Learning Paths ───────────────────
export function getLearningPaths() {
  return adminRequest<{ items: AdminLearningPathDTO[]; total: number }>('/admin/learning-paths');
}

export function createLearningPath(data: { title: string; titleVi?: string; slug: string; description: string; level?: string; isPremium?: boolean }) {
  return adminRequest<{ path: AdminLearningPathDTO }>('/admin/learning-paths', {
    method: 'POST',
    body: data,
  });
}

export function updateLearningPath(id: string, data: Partial<AdminLearningPathDTO>) {
  return adminRequest<{ path: AdminLearningPathDTO }>(`/admin/learning-paths/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export function deleteLearningPath(id: string) {
  return adminRequest<{ message: string }>(`/admin/learning-paths/${id}`, { method: 'DELETE' });
}

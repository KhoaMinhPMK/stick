// ─── Prompt ──────────────────────────
export interface DailyPromptDTO {
  id: string;
  publishDate: string;
  status: 'draft' | 'scheduled' | 'published';
  internalTitle: string;
  promptVi: string;
  promptEn: string;
  followUp: string | null;
  level: 'basic' | 'intermediate' | 'advanced';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptDTO {
  publishDate: string;
  internalTitle: string;
  promptVi: string;
  promptEn: string;
  followUp?: string;
  level: string;
}

export interface PromptFilterParams {
  status?: string;
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
  search?: string;
  level?: string;
}

// ─── Metrics ─────────────────────────
export interface MetricCardsDTO {
  todaySessions: number;
  yesterdaySessions: number;
  completionRate: number;
  completionRateChange: number;
  aiErrorRate: number;
  aiErrorCount: number;
  day1ReturnRate: number;
  day1ReturnChange: number;
}

export interface FunnelStepDTO {
  step: string;
  count: number;
}

export interface FunnelDTO {
  steps: FunnelStepDTO[];
}

export interface CohortDTO {
  registeredDate: string;
  totalUsers: number;
  d1: number;
  d2: number;
  d3: number;
}

export interface RetentionDTO {
  cohorts: CohortDTO[];
}

export interface AIHealthDayDTO {
  date: string;
  avgLatencyMs: number;
  errorCount: number;
  totalRequests: number;
}

export interface AIHealthDTO {
  daily: AIHealthDayDTO[];
}

// ─── User ────────────────────────────
export interface AdminUserDTO {
  id: string;
  name: string;
  email: string | null;
  avatarUrl?: string | null;
  isGuest: boolean;
  role: string;
  status: string;
  isPremium: boolean;
  createdAt: string;
  stats: {
    totalDays: number;
    currentStreak: number;
    totalJournals: number;
    lastActiveAt: string | null;
  };
}

export interface AdminUserDetailDTO {
  user: AdminUserDTO & {
    bio: string | null;
    nativeLanguage: string | null;
    isPremium: boolean;
    premiumSince: string | null;
    premiumUntil: string | null;
    onboarding: {
      completed: boolean;
      level: string | null;
      goal: string | null;
    } | null;
    stats: AdminUserDTO['stats'] & {
      totalWordsLearned: number;
      totalMinutes: number;
      totalXp: number;
    };
  };
  recentJournals: Array<{
    id: string;
    title: string;
    content: string;
    status: string;
    score: number | null;
    createdAt: string;
  }>;
}

// ─── AI Log ──────────────────────────
export interface AILogDTO {
  id: string;
  userId: string;
  userName: string;
  journalId: string | null;
  inputText: string;
  outputText: string | null;
  model: string;
  statusCode: number;
  latencyMs: number;
  errorMessage: string | null;
  createdAt: string;
}

// ─── Config ──────────────────────────
export interface AppConfigDTO {
  key: string;
  value: string;
  updatedAt: string;
}

// ─── Common ──────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminLoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface UserFilterParams {
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
  premium?: string;
}

export interface AILogFilterParams {
  status?: string;
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
}

// ─── Lesson ──────────────────────────
export interface AdminLessonDTO {
  id: string;
  title: string;
  titleVi: string | null;
  category: string;
  level: string;
  status: string;
  published: boolean;
  xpReward: number;
  isPremium: boolean;
  duration: number;
  orderIndex: number;
  moduleId: string | null;
  aiGenerated: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: { attempts: number };
}

export interface AdminLessonDetailDTO {
  id: string;
  title: string;
  titleVi: string | null;
  description: string;
  category: string;
  level: string;
  content: LessonContentJSON;
  status: string;
  published: boolean;
  xpReward: number;
  isPremium: boolean;
  tags: string[];
  duration: number;
  orderIndex: number;
  moduleId: string | null;
  aiGenerated: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  module?: {
    id: string;
    title: string;
    unit: {
      id: string;
      title: string;
      learningPath: { id: string; title: string; slug: string };
    };
  } | null;
  _count?: { attempts: number };
}

export interface LessonContentJSON {
  sections: LessonSection[];
}

export interface LessonSection {
  type: 'text' | 'vocab' | 'grammar' | 'exercises' | 'summary';
  title: string;
  content?: string;
  items?: VocabItem[];
  pattern?: string;
  examples?: string[];
  notes?: string;
  exercises?: LessonExercise[];
}

export interface VocabItem {
  word: string;
  meaning: string;
  example?: string;
  pronunciation?: string;
}

export interface LessonExercise {
  type: 'multiple_choice' | 'fill_blank' | 'match' | 'reorder';
  question?: string;
  instruction?: string;
  options?: string[];
  correctAnswer?: string;
  acceptableAnswers?: string[];
  correctPairs?: [string, string][];
  correctOrder?: string[];
  words?: string[];
  points: number;
  explanation?: string;
}

export interface CreateLessonDTO {
  title: string;
  titleVi?: string;
  description: string;
  category: string;
  level: string;
  content: string | LessonContentJSON;
  duration?: number;
  orderIndex?: number;
  xpReward?: number;
  isPremium?: boolean;
  tags?: string[];
  status?: string;
  moduleId?: string;
}

export interface LessonFilterParams {
  status?: string;
  category?: string;
  level?: string;
  search?: string;
  page?: string;
  limit?: string;
}

// ─── Learning Path ───────────────────
export interface AdminLearningPathDTO {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  description: string;
  coverImage: string | null;
  level: string;
  isPremium: boolean;
  orderIndex: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { units: number };
}

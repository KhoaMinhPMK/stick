// Analytics Core Loop Module
// Single source of truth for firing events in the STICK core loop.
// Uses Firebase Analytics in production, console.debug in dev.

import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import { initializeApp, getApps } from 'firebase/app';

let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

async function initAnalytics() {
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();
  if (!supported) return null;
  const app = getApps()[0] || initializeApp({
    apiKey: "AIzaSyAWXH675F8F-Od6PlGOopDXXzpGf36qKhI",
    authDomain: "stick-e9560.firebaseapp.com",
    projectId: "stick-e9560",
    storageBucket: "stick-e9560.firebasestorage.app",
    messagingSenderId: "490758085326",
    appId: "1:490758085326:web:076338557bf872189c8e9f",
    measurementId: "G-CENLSST8RL"
  });
  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

function track(eventName: string, props: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.debug(`[ANALYTICS] ${eventName}`, props);
  }
  // Fire to Firebase Analytics
  initAnalytics().then(analytics => {
    if (analytics) logEvent(analytics, eventName, props);
  }).catch(() => { /* silently fail */ });
}

function getSessionId(): string {
  let sid = sessionStorage.getItem('stick_session_id');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('stick_session_id', sid);
  }
  return sid;
}

// ─── Event Definitions ────────────────────────────────────────────────────────

export function trackSessionStart(props: { userId?: string; dayNumber?: number }) {
  track('session_start', {
    session_id: getSessionId(),
    user_id: props.userId,
    day_number: props.dayNumber,
  });
}

export function trackPromptView(props: { dayNumber?: number; promptId?: string }) {
  track('prompt_view', {
    session_id: getSessionId(),
    day_number: props.dayNumber,
    prompt_id: props.promptId,
  });
}

export function trackDraftSaved(props: { charCount: number; autosave: boolean }) {
  track('draft_saved', {
    session_id: getSessionId(),
    char_count: props.charCount,
    autosave: props.autosave,
  });
}

export function trackSubmissionSent(props: { wordCount: number; typingTimeMs?: number }) {
  track('submission_sent', {
    session_id: getSessionId(),
    word_count: props.wordCount,
    typing_time_ms: props.typingTimeMs,
  });
}

export function trackFeedbackView(props: { journalId: string; latencyMs?: number; isFallback?: boolean }) {
  track('feedback_view', {
    session_id: getSessionId(),
    journal_id: props.journalId,
    latency_ms: props.latencyMs,
    is_fallback: props.isFallback,
  });
}

export function trackAudioPlay(props: { journalId?: string; playCount: number }) {
  track('audio_play', {
    session_id: getSessionId(),
    journal_id: props.journalId,
    play_count: props.playCount,
  });
}

export function trackReviewDone(props: { rememberedCount: number; skipped: boolean }) {
  track('review_done', {
    session_id: getSessionId(),
    remembered_count: props.rememberedCount,
    skipped: props.skipped,
  });
}

export function trackCompletionView(props: { journalId?: string; streakCount?: number; mood?: string }) {
  track('completion_view', {
    session_id: getSessionId(),
    journal_id: props.journalId,
    streak_count: props.streakCount,
    mood: props.mood,
  });
}

export function trackAiError(props: { errorType: string; step: string }) {
  track('ai_error', {
    session_id: getSessionId(),
    error_type: props.errorType,
    step: props.step,
  });
}

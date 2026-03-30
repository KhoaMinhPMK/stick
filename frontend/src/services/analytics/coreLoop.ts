// Analytics Core Loop Module
// Single source of truth for firing events in the STICK core loop.
// Interface is stable — swap the actual provider (console, Mixpanel, Firebase, etc.)
// by changing only the `track` function below.

function track(eventName: string, props: Record<string, unknown>) {
  // TODO: swap with real provider (Mixpanel, Firebase Analytics, etc.)
  if (import.meta.env.DEV) {
    console.debug(`[ANALYTICS] ${eventName}`, props);
  }
  // Production: send to provider
  // e.g. window.analytics?.track(eventName, props)
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

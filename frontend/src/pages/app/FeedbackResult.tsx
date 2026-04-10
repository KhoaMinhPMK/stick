import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { parseFeedback } from '../../types/dto/ai-feedback';
import { trackFeedbackView } from '../../services/analytics/coreLoop';
import { importFeedbackVocab, ttsSpeak } from '../../services/api/endpoints';

type RecordState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'playing' | 'error';

export const FeedbackResultPage: React.FC = () => {
  const { t } = useTranslation();
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlayingEnhanced, setIsPlayingEnhanced] = useState(false);
  const [ttsLoadingEnhanced, setTtsLoadingEnhanced] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const saved = localStorage.getItem('tts_speed');
    return saved ? parseFloat(saved) : 1;
  });
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [savedWordIndices, setSavedWordIndices] = useState<Set<number>>(new Set());
  const [savingWordIndex, setSavingWordIndex] = useState<number | null>(null);
  const [saveAllStatus, setSaveAllStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [savedCount, setSavedCount] = useState(0);
  const feedbackTrackedRef = useRef(false);

  // ── Speaking Practice (6.2) — inline recording ──
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recSeconds, setRecSeconds] = useState(0);
  const [recError, setRecError] = useState('');
  const [recAudioUrl, setRecAudioUrl] = useState<string | null>(null);
  const [scoringState, setScoringState] = useState<'idle' | 'scoring' | 'done' | 'error'>('idle');
  const [wordScores, setWordScores] = useState<{ word: string; correct: boolean; comment?: string }[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recAudioRef = useRef<HTMLAudioElement | null>(null);
  const speakingSectionRef = useRef<HTMLDivElement | null>(null);
  const enhancedTextRef = useRef<string>('');

  const id = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) {
        // No journalId in URL — redirect to history so user can pick a journal
        window.location.hash = '#progress';
        return;
      }
      try {
        const loadStart = Date.now();
        const res = await apiRequest(`/journals/${id}`) as any;
        setJournal(res.journal);
        if (!feedbackTrackedRef.current && res.journal) {
          trackFeedbackView({ journalId: id!, latencyMs: Date.now() - loadStart, isFallback: false });
          feedbackTrackedRef.current = true;
        }
      } catch (err) {
        console.error('Failed to load journal result', err);
        setLoadError(t('feedback_result.error_load'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Hooks must be unconditional — defined before any early returns ──────
  const handleSaveWord = useCallback(async (index: number, word: any) => {
    if (!id || savedWordIndices.has(index) || savingWordIndex !== null) return;
    setSavingWordIndex(index);
    try {
      await importFeedbackVocab(id, [{ word: word.word, meaning: word.meaning, example: word.example }]);
      setSavedWordIndices(prev => new Set(prev).add(index));
      setSavedCount(prev => prev + 1);
    } catch {
      // silently fail — user can retry
    } finally {
      setSavingWordIndex(null);
    }
  }, [id, savedWordIndices, savingWordIndex]);

  const handleSaveAllWords = useCallback(async (words: any[]) => {
    if (!id || saveAllStatus !== 'idle') return;
    setSaveAllStatus('saving');
    try {
      const items = words.map((w: any) => ({ word: w.word, meaning: w.meaning, example: w.example }));
      const result = await importFeedbackVocab(id, items);
      setSavedWordIndices(new Set(words.map((_: any, i: number) => i)));
      setSavedCount(result.saved);
      setSaveAllStatus('done');
    } catch {
      setSaveAllStatus('idle');
    }
  }, [id, saveAllStatus]);
  // ────────────────────────────────────────────────────────────────────────

  // ── Speaking Practice (6.2) — recording helpers ──
  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recAudioUrl) URL.revokeObjectURL(recAudioUrl);
    };
  }, [recAudioUrl]);

  const handlePronunciation = async (blob: Blob) => {
    const targetText = enhancedTextRef.current;
    if (!targetText) return;
    setScoringState('scoring');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const res = await apiRequest('/pronunciation-check', {
        method: 'POST',
        body: JSON.stringify({ audio: base64, targetText }),
      }) as { words: { word: string; correct: boolean; comment?: string }[]; accuracy: number };
      setWordScores(res.words || []);
      setScoringState('done');
    } catch {
      setScoringState('error');
    }
  };

  const startRecording = async () => {
    setRecError('');
    setRecordState('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecError(t('speaking_practice.mic_not_supported', { defaultValue: 'Microphone not supported. You can skip this step.' }));
      setRecordState('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setRecordState('recorded');
        handlePronunciation(blob);
      };
      mr.start();
      setRecordState('recording');
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(prev => prev + 1), 1000);
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? t('speaking_practice.mic_denied', { defaultValue: 'Mic permission denied. You can skip this step.' })
        : t('speaking_practice.mic_error', { defaultValue: 'Could not start recording.' });
      setRecError(msg);
      setRecordState('error');
    }
  };

  const stopRecording = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRecPlayback = () => {
    if (!recAudioUrl || !recAudioRef.current) return;
    if (recordState === 'playing') {
      recAudioRef.current.pause();
      recAudioRef.current.currentTime = 0;
      setRecordState('recorded');
    } else {
      recAudioRef.current.play();
      setRecordState('playing');
    }
  };

  const handleRecRetry = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recAudioUrl) URL.revokeObjectURL(recAudioUrl);
    setRecAudioUrl(null);
    setRecSeconds(0);
    setRecError('');
    setRecordState('idle');
    setScoringState('idle');
    setWordScores([]);
  };

  const formatRecTime = (s: number) => {
    const mins = String(Math.floor(s / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const isRecording = recordState === 'recording';
  const isRecorded = recordState === 'recorded' || recordState === 'playing';
  // ────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout activePath="#journal">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      </AppLayout>
    );
  }

  if (!journal) {
    return (
      <AppLayout activePath="#journal">
        {loadError && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 mb-4 flex items-center gap-2 max-w-5xl mx-auto">
            <span className="material-symbols-outlined text-error">error</span>
            <span className="text-error font-medium text-sm">{loadError}</span>
          </div>
        )}
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">error_outline</span>
          <p className="font-headline font-bold text-xl">{t('feedback_result.not_found', { defaultValue: 'Result not found' })}</p>
          <p className="text-sm text-on-surface-variant mt-1">{t('feedback_result.not_found_hint', { defaultValue: 'Choose a journal from your history to view its feedback.' })}</p>
          <button onClick={() => window.location.hash = '#progress'} className="mt-4 flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-sm">{t('feedback_result.go_to_history', { defaultValue: 'Go to History' })}</span>
          </button>
        </div>
      </AppLayout>
    );
  }

  const feedbackDto = parseFeedback(journal.feedback);
  const corrections = feedbackDto.corrections;
  const learningCandidates = feedbackDto.learningCandidates;
  const usefulWords = feedbackDto.vocabularyBoosters;
  // Use learningCandidates if available, else fallback to vocabularyBoosters
  const hasLexicon = learningCandidates.length > 0;
  const enhancedText = feedbackDto.enhancedText || journal.content;
  const encouragement = feedbackDto.encouragement || t('feedback_result.encouragement', { defaultValue: 'Keep up the great work!' });
  const score = journal.score || 0;

  // Keep ref in sync so recording closure can access latest value
  enhancedTextRef.current = enhancedText;

  const handlePlayEnhanced = async () => {
    if (!enhancedText) return;
    // Toggle: stop if already playing
    if (isPlayingEnhanced) {
      ttsAudioRef.current?.pause();
      ttsAudioRef.current = null;
      setIsPlayingEnhanced(false);
      return;
    }
    setTtsLoadingEnhanced(true);
    try {
      const base64 = await ttsSpeak(enhancedText);
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audio.playbackRate = playbackSpeed;
      ttsAudioRef.current = audio;
      audio.onended = () => { setIsPlayingEnhanced(false); ttsAudioRef.current = null; };
      audio.onerror = () => { setIsPlayingEnhanced(false); ttsAudioRef.current = null; };
      await audio.play();
      setIsPlayingEnhanced(true);
    } catch {
      setIsPlayingEnhanced(false);
    } finally {
      setTtsLoadingEnhanced(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    localStorage.setItem('tts_speed', String(speed));
    if (ttsAudioRef.current) ttsAudioRef.current.playbackRate = speed;
  };

  return (
    <AppLayout activePath="#journal">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-headline font-bold text-2xl md:text-3xl lg:text-4xl -rotate-1 origin-left">{t('feedback_result.page_title')}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left Column: The Feedback Comparison */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Comparison Card */}
            <div className="bg-surface-container-low sketch-card p-5 md:p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 hidden md:block">
                <span className="material-symbols-outlined text-stone-300 text-6xl md:text-8xl opacity-20">auto_awesome</span>
              </div>
              <div className="space-y-8 md:space-y-12 relative z-10">
                {/* Original */}
                <section>
                  <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <span className="material-symbols-outlined text-stone-500 text-lg md:text-2xl">history_edu</span>
                    <h3 className="font-headline font-bold text-base md:text-xl uppercase tracking-tighter">{t('feedback_result.you_wrote')}</h3>
                  </div>
                  <div className="p-4 md:p-6 bg-surface-dim/30 rounded-lg border-2 border-dashed border-stone-400 italic text-on-surface-variant text-sm md:text-lg leading-relaxed whitespace-pre-wrap">
                    "{journal.content}"
                  </div>
                </section>

                {/* AI Version */}
                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="material-symbols-outlined text-tertiary text-lg md:text-2xl">magic_button</span>
                      <h3 className="font-headline font-bold text-base md:text-xl uppercase tracking-tighter">{t('feedback_result.natural_version')}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 self-start">
                      <button onClick={handlePlayEnhanced} className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 sketch-border bg-surface hover:bg-secondary-container transition-all group disabled:opacity-50" disabled={ttsLoadingEnhanced}>
                        <span className={`material-symbols-outlined text-lg md:text-xl group-active:scale-90 transition-transform ${ttsLoadingEnhanced ? 'animate-spin' : ''}`}>{ttsLoadingEnhanced ? 'progress_activity' : isPlayingEnhanced ? 'stop_circle' : 'volume_up'}</span>
                        <span className="font-label font-bold text-sm">{ttsLoadingEnhanced ? t('feedback_result.loading', { defaultValue: 'Loading...' }) : isPlayingEnhanced ? t('feedback_result.playing', { defaultValue: 'Playing...' }) : t('feedback_result.listen')}</span>
                      </button>
                      {/* Playback speed */}
                      <div className="flex items-center gap-1" aria-label="Playback speed">
                        {([0.75, 1, 1.25, 1.5, 2] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => handleSpeedChange(s)}
                            className={`px-1.5 py-0.5 text-[11px] font-bold border transition-colors ${playbackSpeed === s ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-stone-400 text-on-surface-variant hover:border-primary'}`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 md:p-8 bg-white sketch-card shadow-[4px_4px_0_0_#000] md:shadow-[10px_10px_0_0_#000] text-lg md:text-2xl font-medium leading-relaxed whitespace-pre-wrap">
                    "{enhancedText}"
                  </div>
                </section>
              </div>
            </div>

            {/* Explanations Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* What Changed */}
              <div className="sketch-card p-5 md:p-8 bg-surface-container">
                <h3 className="font-headline font-bold text-base md:text-xl mb-4 md:mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg md:text-2xl">lightbulb</span> {t('feedback_result.what_changed')}
                </h3>
                <ul className="space-y-3 md:space-y-4">
                  {corrections.map((c: any, i: number) => (
                    <li key={i} className="flex gap-2 md:gap-3 items-start">
                      <span className="material-symbols-outlined text-tertiary mt-0.5 md:mt-1 text-lg md:text-xl">check_circle</span>
                      <p className="text-on-surface-variant text-xs md:text-sm">
                        <strong className="text-primary font-bold">{c.original} → {c.corrected}:</strong> {c.explanation}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Useful Words / Learning Candidates */}
              <div className="sketch-card p-5 md:p-8 bg-secondary-container/30">
                <div className="flex items-center justify-between gap-2 mb-4 md:mb-6">
                  <h3 className="font-headline font-bold text-base md:text-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg md:text-2xl">stylus_note</span> {t('feedback_result.useful_words')}
                  </h3>
                  {(hasLexicon ? learningCandidates.length : usefulWords.length) > 0 && (
                    <button
                      onClick={() => handleSaveAllWords(hasLexicon
                        ? learningCandidates.map(c => ({ word: c.expression, meaning: c.meaning, example: c.example }))
                        : usefulWords)}
                      disabled={saveAllStatus !== 'idle'}
                      className="text-[10px] md:text-xs font-bold px-2 py-1 sketch-border bg-white hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-default flex items-center gap-1"
                    >
                      {saveAllStatus === 'saving' && <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>}
                      {saveAllStatus === 'done'
                        ? t('feedback_result.vocab_saved_count', { count: savedCount })
                        : t('feedback_result.save_all_words')}
                    </button>
                  )}
                </div>
                <div className="space-y-4 md:space-y-6">
                  {hasLexicon ? learningCandidates.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-headline font-black text-base md:text-lg">{c.expression}</span>
                          <span className={`text-[9px] md:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-wider ${
                            c.candidateType === 'new' ? 'bg-tertiary/20 text-tertiary' :
                            c.candidateType === 'reinforce' ? 'bg-secondary/30 text-secondary' :
                            'bg-primary/15 text-primary'
                          }`}>
                            {c.candidateType}
                          </span>
                          {c.expressionType !== 'word' && (
                            <span className="text-[9px] md:text-[10px] text-stone-400 italic">{c.expressionType}</span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-on-surface-variant italic mt-0.5">{c.meaning}</p>
                        {c.meaningGap && (
                          <p className="text-[10px] md:text-xs text-stone-400 mt-1">
                            <span className="font-bold">Gap:</span> {c.meaningGap}
                          </p>
                        )}
                        {c.example && (
                          <p className="text-[10px] md:text-xs text-stone-500 mt-1 italic">"{c.example}"</p>
                        )}
                        {c.level && <span className="text-[10px] md:text-xs bg-black text-white px-2 py-0.5 mt-1 inline-block">{c.level}</span>}
                      </div>
                      <button
                        onClick={() => handleSaveWord(i, { word: c.expression, meaning: c.meaning, example: c.example })}
                        disabled={savedWordIndices.has(i) || savingWordIndex !== null}
                        title={savedWordIndices.has(i) ? t('feedback_result.word_saved') : t('feedback_result.save_word')}
                        className="shrink-0 mt-0.5 p-1.5 rounded hover:bg-black/10 transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        {savingWordIndex === i
                          ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          : savedWordIndices.has(i)
                            ? <span className="material-symbols-outlined text-base text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_added</span>
                            : <span className="material-symbols-outlined text-base text-stone-400 hover:text-primary">bookmark_add</span>}
                      </button>
                    </div>
                  )) : usefulWords.map((w: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-headline font-black text-base md:text-lg block">{w.word}</span>
                        <p className="text-xs md:text-sm text-on-surface-variant italic">{w.meaning}</p>
                        {w.level && <span className="text-[10px] md:text-xs bg-black text-white px-2 py-0.5 mt-1 inline-block">{w.level} Level</span>}
                      </div>
                      <button
                        onClick={() => handleSaveWord(i, w)}
                        disabled={savedWordIndices.has(i) || savingWordIndex !== null}
                        title={savedWordIndices.has(i) ? t('feedback_result.word_saved') : t('feedback_result.save_word')}
                        className="shrink-0 mt-0.5 p-1.5 rounded hover:bg-black/10 transition-colors disabled:opacity-40 disabled:cursor-default"
                      >
                        {savingWordIndex === i
                          ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                          : savedWordIndices.has(i)
                            ? <span className="material-symbols-outlined text-base text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_added</span>
                            : <span className="material-symbols-outlined text-base text-stone-400 hover:text-primary">bookmark_add</span>}
                      </button>
                    </div>
                  ))}
                </div>
                {/* CTA to view saved words in notebook */}
                {savedCount > 0 && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-black/20 flex items-center justify-between gap-2">
                    <p className="text-xs text-on-surface-variant font-body">
                      {t('feedback_result.words_saved_notebook', { count: savedCount, defaultValue: '{{count}} word(s) saved to notebook' })}
                    </p>
                    <button
                      onClick={() => { window.location.hash = '#vocab-notebook'; }}
                      className="shrink-0 text-xs font-headline font-bold flex items-center gap-1 text-primary hover:text-stone-800 transition-colors"
                    >
                      {t('feedback_result.view_notebook', { defaultValue: 'View Notebook' })}
                      <span className="material-symbols-outlined text-sm">auto_stories</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Illustration Card */}
            <div className="sketch-card p-5 md:p-6 bg-white flex flex-col items-center text-center">
              <div className="w-24 h-24 md:w-36 md:h-36 lg:w-48 lg:h-48 mb-3 md:mb-4 bg-surface-container-low rounded-full border-2 border-black flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl md:text-5xl lg:text-6xl text-black/40">sentiment_very_satisfied</span>
              </div>
              <h4 className="font-headline font-extrabold text-lg md:text-xl lg:text-2xl mb-1 md:mb-2">{t('feedback_result.great_progress')}</h4>
              <p className="text-on-surface-variant text-xs md:text-sm px-2 md:px-4">{encouragement}</p>
            </div>

            {/* Score Explanation Card */}
            <div className="sketch-card p-5 md:p-6 bg-surface-container">
              <h4 className="font-headline font-bold text-sm md:text-base mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">analytics</span>
                {t('feedback_result.score_title', { defaultValue: 'Your Score' })}
              </h4>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl md:text-4xl font-headline font-black text-primary">{score}</span>
                <span className="text-sm font-bold opacity-50">/100</span>
              </div>
              <div className="space-y-2 text-xs md:text-sm">
                <p className="text-on-surface-variant leading-relaxed">{t('feedback_result.score_breakdown', { defaultValue: 'Score is based on:' })}</p>
                <ul className="space-y-1.5 text-on-surface-variant">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>{t('feedback_result.score_effort', { defaultValue: 'Effort & completeness (30%)' })}</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>{t('feedback_result.score_english', { defaultValue: 'English usage (30%)' })}</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>{t('feedback_result.score_clarity', { defaultValue: 'Clarity of expression (20%)' })}</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-error shrink-0"></span>{t('feedback_result.score_grammar', { defaultValue: 'Grammar accuracy (20%)' })}</li>
                </ul>
                <p className="text-[10px] md:text-xs italic opacity-60 mt-2">{t('feedback_result.score_note', { defaultValue: 'Writing in Vietnamese still earns points for effort. The more English you use, the higher your score!' })}</p>
              </div>
            </div>

            {/* ── 6.2 Speaking Practice — inline recording ── */}
            <div ref={speakingSectionRef} className="sketch-card p-5 md:p-6 bg-tertiary-container/20 relative overflow-hidden">
              {recAudioUrl && (
                <audio ref={recAudioRef} src={recAudioUrl} onEnded={() => setRecordState('recorded')} className="hidden" />
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                <h4 className="font-headline font-bold text-sm md:text-base">
                  {t('speaking_practice.title', { defaultValue: 'Say it aloud!' })}
                </h4>
              </div>
              <p className="text-xs md:text-sm text-on-surface-variant mb-4">
                {t('speaking_practice.instruction', { defaultValue: 'Review your journal and try saying it in English.' })}
              </p>

              {/* English text to read aloud */}
              <div className="p-3 md:p-4 bg-white rounded-lg border-2 border-dashed border-stone-400 mb-4">
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-1">Read aloud 🇬🇧</p>
                {scoringState === 'done' && wordScores.length > 0 ? (
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-sm md:text-base leading-relaxed">
                    {wordScores.map((ws, i) => (
                      <span
                        key={i}
                        title={!ws.correct && ws.comment ? ws.comment : undefined}
                        className={`relative group cursor-default rounded px-0.5 font-medium underline decoration-2 ${
                          ws.correct
                            ? 'text-emerald-700 decoration-emerald-500'
                            : 'text-red-600 decoration-red-400'
                        }`}
                      >
                        {ws.word}
                        {!ws.correct && ws.comment && (
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-stone-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            {ws.comment}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm md:text-base font-medium text-on-surface leading-relaxed whitespace-pre-wrap">{enhancedText}</p>
                )}
                {scoringState === 'done' && wordScores.length > 0 && (
                  <p className="mt-2 text-[10px] text-stone-400">
                    {wordScores.filter(w => w.correct).length}/{wordScores.length} words correct
                  </p>
                )}
                {scoringState === 'scoring' && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-400">
                    <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                    Checking pronunciation…
                  </div>
                )}
                {scoringState === 'error' && (
                  <p className="mt-2 text-[10px] text-error">Could not check — keep practicing!</p>
                )}
              </div>

              {/* Inline mic button + controls */}
              <div className="flex items-center gap-3">
                {/* Mic / Stop button */}
                <button
                  onClick={() => isRecording ? stopRecording() : isRecorded ? handleRecRetry() : startRecording()}
                  disabled={recordState === 'requesting'}
                  className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] border-primary flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 shrink-0 ${
                    isRecording ? 'bg-error-container/40 animate-pulse' : 'bg-surface hover:bg-primary/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl md:text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {recordState === 'requesting' ? 'pending' : isRecording ? 'stop' : isRecorded ? 'replay' : 'mic'}
                  </span>
                  {/* Waveform animation */}
                  {isRecording && (
                    <div className="absolute -bottom-1 flex gap-[2px] items-end h-3">
                      <div className="w-[2px] bg-primary rounded-full h-1.5 animate-bounce"></div>
                      <div className="w-[2px] bg-primary rounded-full h-3 animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-[2px] bg-primary rounded-full h-2 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-[2px] bg-primary rounded-full h-3 animate-bounce [animation-delay:0.3s]"></div>
                      <div className="w-[2px] bg-primary rounded-full h-1.5 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {/* Recording timer */}
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                      <span className="font-mono text-sm font-bold text-error">{formatRecTime(recSeconds)}</span>
                    </div>
                  )}
                  {/* Recorded — play/retry */}
                  {isRecorded && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleRecPlayback} className="flex items-center gap-1 px-3 py-1.5 sketch-border bg-surface hover:bg-secondary-container text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-sm">{recordState === 'playing' ? 'pause' : 'play_arrow'}</span>
                        {recordState === 'playing' ? t('speaking_practice.pause', { defaultValue: 'Pause' }) : t('speaking_practice.listen_back', { defaultValue: 'Listen' })}
                      </button>
                    </div>
                  )}
                  {/* Idle hint */}
                  {recordState === 'idle' && (
                    <p className="text-xs text-stone-400 italic">{t('speaking_practice.tap_to_record', { defaultValue: 'Tap mic to record' })}</p>
                  )}
                  {/* Error */}
                  {recordState === 'error' && (
                    <p className="text-xs text-error font-medium">{recError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 md:gap-4">
              <button
                onClick={() => { window.location.hash = `#completion?journalId=${id}`; }}
                className="w-full py-4 md:py-6 sketch-border bg-primary text-white font-headline font-black text-base md:text-xl flex items-center justify-center gap-2 md:gap-3 hover:bg-stone-800 transition-colors active:scale-95"
              >
                {t('feedback_result.complete', { defaultValue: 'Complete' })} <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </button>
              <button
                onClick={() => (window.location.hash = '#journal')}
                className="w-full py-3 md:py-4 sketch-border bg-transparent font-headline font-bold text-on-surface-variant text-sm md:text-base hover:text-primary transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                {t('feedback_result.try_another')} <span className="material-symbols-outlined text-sm md:text-base">refresh</span>
              </button>
            </div>

            {/* Mini Goal Tracker */}
            <div className="p-4 md:p-6 border-2 border-dashed border-stone-400 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label font-bold text-[10px] md:text-xs uppercase tracking-widest text-stone-500">{t('feedback_result.daily_goal')}</span>
                <span className="font-label font-bold text-[10px] md:text-xs">{score}%</span>
              </div>
              <div className="h-2.5 md:h-3 w-full bg-surface-dim rounded-full overflow-hidden border border-black">
                <div className="h-full bg-tertiary-container border-r border-black" style={{ width: `${score}%` }} />
              </div>
              <p className="mt-2 md:mt-3 text-[10px] text-stone-500 font-medium italic">{t('feedback_result.streak_hint')}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

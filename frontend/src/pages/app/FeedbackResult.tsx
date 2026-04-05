import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { parseFeedback } from '../../types/dto/ai-feedback';
import { trackFeedbackView } from '../../services/analytics/coreLoop';

export const FeedbackResultPage: React.FC = () => {
  const { t } = useTranslation();
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingEnhanced, setIsPlayingEnhanced] = useState(false);
  const feedbackTrackedRef = useRef(false);

  const id = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
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
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">error_outline</span>
          <p className="font-headline font-bold text-xl">{t('feedback_result.not_found', { defaultValue: 'Result not found' })}</p>
          <button onClick={() => window.location.hash = '#journal-workspace'} className="mt-4 text-blue-500 underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  const feedbackDto = parseFeedback(journal.feedback);
  const corrections = feedbackDto.corrections;
  const usefulWords = feedbackDto.vocabularyBoosters;
  const enhancedText = feedbackDto.enhancedText || journal.content;
  const encouragement = feedbackDto.encouragement || t('feedback_result.encouragement', { defaultValue: 'Keep up the great work!' });
  const score = journal.score || 0;

  const handlePlayEnhanced = () => {
    if (!enhancedText || !window.speechSynthesis) return;
    // Toggle: if already playing, stop instead of restarting
    if (isPlayingEnhanced) {
      window.speechSynthesis.cancel();
      setIsPlayingEnhanced(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(enhancedText);
    utt.lang = 'en-US';
    utt.onstart = () => setIsPlayingEnhanced(true);
    utt.onend = () => setIsPlayingEnhanced(false);
    utt.onerror = () => setIsPlayingEnhanced(false);
    window.speechSynthesis.speak(utt);
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
                    <button onClick={handlePlayEnhanced} className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 sketch-border bg-surface hover:bg-secondary-container transition-all group self-start disabled:opacity-50" disabled={!window.speechSynthesis}>
                      <span className="material-symbols-outlined text-lg md:text-xl group-active:scale-90 transition-transform">{isPlayingEnhanced ? 'stop_circle' : 'volume_up'}</span>
                      <span className="font-label font-bold text-sm">{isPlayingEnhanced ? t('feedback_result.playing', { defaultValue: 'Playing...' }) : t('feedback_result.listen')}</span>
                    </button>
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

              {/* Useful Words */}
              <div className="sketch-card p-5 md:p-8 bg-secondary-container/30">
                <h3 className="font-headline font-bold text-base md:text-xl mb-4 md:mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg md:text-2xl">stylus_note</span> {t('feedback_result.useful_words')}
                </h3>
                <div className="space-y-4 md:space-y-6">
                  {usefulWords.map((w: any, i: number) => (
                    <div key={i}>
                      <span className="font-headline font-black text-base md:text-lg block">{w.word}</span>
                      <p className="text-xs md:text-sm text-on-surface-variant italic">{w.meaning}</p>
                      {w.level && <span className="text-[10px] md:text-xs bg-black text-white px-2 py-0.5 mt-1 inline-block">{w.level} Level</span>}
                    </div>
                  ))}
                </div>
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

            {/* Actions */}
            <div className="flex flex-col gap-3 md:gap-4">
              <button
                onClick={() => (window.location.hash = `#speaking-intro?journalId=${id}`)}
                className="w-full py-4 md:py-6 sketch-border bg-primary text-white font-headline font-black text-base md:text-xl flex items-center justify-center gap-2 md:gap-3 hover:bg-stone-800 transition-colors active:scale-95"
              >
                {t('feedback_result.practice_speaking')}
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </button>
              <div className="grid grid-cols-1 gap-2 md:gap-3">
                <button
                  onClick={() => (window.location.hash = `#completion?journalId=${id}`)}
                  className="w-full py-3 md:py-4 sketch-border bg-surface-container-highest font-headline font-bold text-sm md:text-base hover:bg-secondary-container transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  {t('feedback_result.continue')} <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
                </button>
                <button
                  onClick={() => (window.location.hash = '#journal-workspace')}
                  className="w-full py-3 md:py-4 sketch-border bg-transparent font-headline font-bold text-on-surface-variant text-sm md:text-base hover:text-primary transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  {t('feedback_result.try_another')} <span className="material-symbols-outlined text-sm md:text-base">refresh</span>
                </button>
              </div>
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

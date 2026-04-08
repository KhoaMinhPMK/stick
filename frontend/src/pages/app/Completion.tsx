import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getProgressSummary, postJournalMood, type ProgressSummary } from '../../services/api/endpoints';
import { trackCompletionView } from '../../services/analytics/coreLoop';
import { usePremium } from '../../hooks/usePremium';

export const CompletionPage: React.FC = () => {
  const { t } = useTranslation();
  const isPremium = usePremium();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSaved, setMoodSaved] = useState(false);
  const [moodError, setMoodError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const completionTrackedRef = useRef(false);

  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProgressSummary();
        setSummary(res);
        if (!completionTrackedRef.current) {
          trackCompletionView({ journalId: journalId || undefined, streakCount: res.currentStreak });
          completionTrackedRef.current = true;
        }
      } catch (err) {
        console.error('Failed to load summary:', err);
        setLoadError(t('completion.error_load'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const moods = [
    { id: 'happy', icon: 'sentiment_satisfied', labelKey: 'completion.mood_happy' },
    { id: 'neutral', icon: 'sentiment_neutral', labelKey: 'completion.mood_okay' },
    { id: 'tired', icon: 'sentiment_dissatisfied', labelKey: 'completion.mood_tired' },
  ];

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    if (journalId && !moodSaved) {
      try {
        await postJournalMood(journalId, moodId);
        setMoodSaved(true);
        setMoodError(null);
      } catch (err) {
        console.error('Failed to save mood:', err);
        setMoodError(t('completion.mood_error'));
      }
    }
  };

  const streak = summary?.currentStreak || 0;
  const totalWords = summary?.totalWords || 0;
  const dayNumber = summary?.dayNumber || 0;
  const levelInfo = summary?.levelInfo;

  return (
    <AppLayout activePath="#journal">
      {loadError && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 mb-4 flex items-center gap-2 max-w-5xl mx-auto">
          <span className="material-symbols-outlined text-error">error</span>
          <span className="text-error font-medium text-sm">{loadError}</span>
        </div>
      )}
      <div className="flex items-center justify-center py-8">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Celebration Illustration Column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-full aspect-square max-w-[360px] md:max-w-[400px]">
              <div className="absolute inset-0 flex items-center justify-center animate-fade-in-up">
                <span className="material-symbols-outlined text-[120px] md:text-[160px] text-primary/40 transition-transform duration-500 hover:scale-105" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
              </div>
              {/* Abstract hand-drawn shapes */}
              <div className="absolute -top-4 -right-4 w-20 h-20 md:w-24 md:h-24 border-[3px] border-black rounded-full opacity-20 -rotate-12 float-anim delay-100 hidden sm:block"></div>
              <div className="absolute bottom-10 -left-6 w-14 h-14 md:w-16 md:h-16 border-[3px] border-black sketch-border opacity-20 rotate-45 float-anim delay-300 hidden sm:block"></div>
            </div>
          </div>

          {/* Content Details Column */}
          <div className="md:col-span-7 space-y-8 md:space-y-10 px-4 md:pl-8 animate-fade-in-up delay-200">
            <div>
              <h2 className="font-headline font-extrabold text-4xl md:text-6xl tracking-tighter italic text-black mb-3 md:mb-4 -rotate-1 origin-left wobble-text hover:rotate-[-2deg] hover:scale-105 transition-transform cursor-default">
                {dayNumber > 0 && <span className="block text-lg md:text-2xl not-italic text-tertiary mb-1">{t('dashboard.day')} {dayNumber}</span>}
                {t('completion.title')}
              </h2>
              <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-md">
                {t('completion.subtitle')}
              </p>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 md:p-6 bg-surface-container sketch-border sketch-card cursor-default">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-2xl md:text-3xl text-orange-600" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  <span className="font-headline font-bold text-base md:text-lg">{t('completion.streak_label')}</span>
                </div>
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <p className="font-headline font-black text-2xl md:text-3xl">
                    {streak > 0 ? t('completion.streak_day', { count: streak }) : t('completion.streak_start')}
                  </p>
                )}
              </div>
              <div className="p-5 md:p-6 bg-tertiary-container text-white sketch-border sketch-card cursor-default flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-1">
                  <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                  <span className="font-headline font-bold text-base md:text-lg">{t('completion.vocab_label')}</span>
                </div>
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <p className="font-headline font-black text-2xl md:text-3xl">{t('completion.total_words', { count: totalWords })}</p>
                )}
              </div>
            </div>

            {/* Level / XP Card */}
            {levelInfo && !loading && (
              <div className="p-5 md:p-6 bg-surface-container sketch-border sketch-card cursor-default">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{levelInfo.badge}</span>
                    <div>
                      <p className="font-headline font-bold text-sm">{t('completion.level_label', { defaultValue: 'Level {{level}}', level: levelInfo.level })}</p>
                      <p className="font-body text-xs text-on-surface-variant">{levelInfo.name}</p>
                    </div>
                  </div>
                  <span className="font-headline font-black text-xl text-primary">{levelInfo.totalXp} <span className="text-sm font-bold text-on-surface-variant">XP</span></span>
                </div>
                {!levelInfo.isMax ? (
                  <>
                    <div className="w-full h-2.5 bg-surface-dim rounded-full overflow-hidden border border-black/10">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${levelInfo.progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1.5 text-right">
                      {levelInfo.xpIntoLevel} / {levelInfo.xpForLevel} XP {t('completion.xp_to_next', { defaultValue: 'to next level' })}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-tertiary font-bold mt-1">{t('completion.xp_max', { defaultValue: 'Max level reached! 🏆' })}</p>
                )}
              </div>
            )}

            {/* Mood Check Section */}
            <div className="space-y-4 pt-2 md:pt-4">
              <h3 className="font-headline font-bold text-lg md:text-xl">{t('completion.mood_question')}</h3>
              <div className="flex gap-4 md:gap-6">
                {moods.map((mood) => {
                  const isSelected = selectedMood === mood.id;
                  return (
                    <button 
                      key={mood.id}
                      onClick={() => handleMoodSelect(mood.id)}
                      className="group flex flex-col items-center gap-2 focus:outline-none hover:-translate-y-1 transition-transform"
                    >
                      <div className={`w-14 h-14 md:w-16 md:h-16 border-[3px] border-black rounded-full flex items-center justify-center text-3xl transition-colors active:scale-95 ${isSelected ? 'bg-secondary-container' : 'bg-surface hover:bg-surface-container'}`}>
                        <span className={`material-symbols-outlined text-3xl md:text-4xl ${isSelected ? 'text-black' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}>{mood.icon}</span>
                      </div>
                      <span className={`font-label font-bold text-xs md:text-sm ${isSelected ? 'text-black' : 'text-on-surface-variant'}`}>
                        {t(mood.labelKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {moodSaved && (
                <p className="text-xs text-tertiary font-bold animate-fade-in">{t('completion.mood_saved')}</p>
              )}
              {moodError && (
                <p className="text-xs text-error font-bold animate-fade-in">{moodError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4 md:pt-6">
              <button 
                onClick={() => window.location.hash = '#app'}
                className={`px-8 py-3 md:px-10 md:py-4 font-headline font-bold md:font-extrabold text-lg md:text-xl rounded-full border-[3px] border-black transition-all active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto ${isPremium ? 'premium-galaxy-btn' : 'bg-primary text-secondary-container hover:bg-stone-800'}`}
              >
                {t('completion.come_back')}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button 
                onClick={() => window.location.hash = '#progress'}
                className="px-8 py-3 md:px-10 md:py-4 bg-transparent text-primary font-headline font-bold text-lg md:text-xl rounded-full border-[3px] border-black hover:bg-surface-container-highest transition-all active:scale-95 text-center w-full sm:w-auto"
              >
                {t('completion.view_progress')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed top-12 left-80 pointer-events-none opacity-[0.03] hidden lg:block z-[-1]">
        <svg fill="none" height="120" viewBox="0 0 120 120" width="120" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 10C30 40 10 80 50 110" stroke="black" strokeLinecap="round" strokeWidth="6"></path>
        </svg>
      </div>
      <div className="fixed bottom-12 right-12 pointer-events-none opacity-[0.03] hidden lg:block z-[-1]">
        <svg fill="none" height="150" viewBox="0 0 150 150" width="150" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 130C60 120 100 140 130 100" stroke="black" strokeLinecap="round" strokeWidth="6"></path>
          <path d="M110 120C120 100 140 80 130 60" stroke="black" strokeLinecap="round" strokeWidth="6"></path>
        </svg>
      </div>
    </AppLayout>
  );
};

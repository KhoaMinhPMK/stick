import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getProgressSummary, getDailyPrompt, type ProgressSummary, type DailyPromptResponse } from '../../services/api/endpoints';
import { trackPromptView } from '../../services/analytics/coreLoop';

export const JournalPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [dailyPrompt, setDailyPrompt] = useState<DailyPromptResponse | null>(null);

  useEffect(() => {
    getProgressSummary()
      .then(res => {
        setSummary(res);
      })
      .catch(() => {});

    getDailyPrompt()
      .then(res => {
        setDailyPrompt(res);
        trackPromptView({
          dayNumber: undefined, // will be set after summary loads
          promptId: res.prompt?.id,
        });
      })
      .catch(() => {});
  }, []);

  // Day number = which journal session this is (totalJournals + 1 since this is the next one)
  const dayNumber = summary ? (summary.totalJournals || 0) + 1 : '...';
  const isVi = i18n.language === 'vi';

  // Get prompt text from daily prompt or fallback
  const promptText = dailyPrompt
    ? (dailyPrompt.prompt
      ? (isVi ? dailyPrompt.prompt.promptVi : dailyPrompt.prompt.promptEn)
      : (isVi ? dailyPrompt.promptVi : dailyPrompt.promptEn) || '')
    : '';
  const followUp = dailyPrompt?.prompt?.followUp || '';
  const promptId = dailyPrompt?.prompt?.id || undefined;

  return (
    <AppLayout activePath="#journal">
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-4 md:py-8">
        <div className="max-w-[1200px] w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
          
          {/* Central Task Card */}
          <div className="md:col-span-8 bg-surface-container-lowest sketch-border-heavy p-6 md:p-10 relative">
            {/* Decorative Element: Tape Effect */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 md:w-32 h-6 md:h-8 bg-secondary-container/60 border-x-2 border-black/20 rotate-1 z-10"></div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-1 md:space-y-2 text-center md:text-left">
                <span className="font-headline font-bold text-tertiary uppercase tracking-widest text-xs md:text-sm">
                  {t('journal.session_intro')}
                </span>
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-black wobble-heading leading-tight mx-auto md:mx-0 max-w-[90%] md:max-w-none">
                  {t('journal.day_title', { day: dayNumber })}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-on-surface-variant font-medium text-sm md:text-base mt-2">
                  <span className="material-symbols-outlined text-base md:text-lg">schedule</span>
                  <span>{t('journal.estimated_time')}</span>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6 py-4 md:py-6">
                {/* Daily Prompt */}
                {promptText && (
                  <div className="p-4 md:p-5 bg-primary/5 border-2 border-primary/20 rounded-xl space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      {t('journal.todays_prompt', "Today's Prompt")}
                    </span>
                    <p className="font-headline font-bold text-base md:text-lg text-on-surface leading-snug">
                      {promptText}
                    </p>
                    {followUp && (
                      <p className="text-sm text-on-surface-variant italic">
                        {followUp}
                      </p>
                    )}
                  </div>
                )}

                <h3 className="font-headline font-bold text-lg md:text-xl text-center md:text-left">
                  {t('journal.journey_today')}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {[
                    t('journal.task_1'),
                    t('journal.task_2'),
                    t('journal.task_3'),
                  ].map((task, index) => (
                    <div key={index} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-surface-container-low rounded-xl border-2 border-black/5 hover:border-black/20 transition-colors">
                      <span className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 flex items-center justify-center bg-black text-white rounded-full font-bold text-sm md:text-base">
                        {index + 1}
                      </span>
                      <span className="text-sm md:text-base font-medium">{task}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-surface-container-low rounded-xl border-2 border-black/5 opacity-50">
                    <span className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 flex items-center justify-center bg-black text-white rounded-full font-bold text-sm md:text-base">
                      4
                    </span>
                    <span className="text-sm md:text-base font-medium">{t('journal.task_4')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 md:pt-4">
                <button 
                  onClick={() => {
                    const params = promptId ? `?promptId=${promptId}` : '';
                    window.location.hash = `#journal-workspace${params}`;
                  }}
                  className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-secondary-container hover:bg-on-secondary-fixed-variant hover:text-white transition-all duration-300 font-headline font-black text-lg md:text-xl sketch-border flex items-center justify-center gap-3 md:gap-4 group active:scale-95 mx-auto md:mx-0"
                >
                  {t('journal.begin_activity')}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Illustration Area */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-6 md:space-y-8 mt-6 md:mt-0 pb-16 md:pb-0">
            <div className="relative w-full flex items-center justify-center">
              <div className="w-48 h-48 md:w-56 md:h-56 relative">
                <div className="w-full h-full bg-surface-container border-[3px] border-black rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[80px] md:text-[90px] text-primary/50" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
                </div>
                {/* Speech Bubble */}
                <div className="absolute -top-4 -right-4 md:-right-8 bg-white p-3 md:p-4 sketch-border rotate-3 shadow-sm max-w-[140px] md:max-w-[180px] z-10">
                  <p className="text-xs md:text-sm font-bold border-l-2 pl-2 border-black">
                    "{t('journal.coach_quote')}"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-1 md:space-y-2 max-w-[280px]">
              <p className="text-on-surface-variant italic font-medium text-sm md:text-base">
                "{t('journal.author_quote')}"
              </p>
              <p className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-stone-500">
                — Mark Twain
              </p>
            </div>
            
            <div className="w-full max-w-sm p-4 md:p-5 bg-tertiary-container/10 border-2 border-dashed border-tertiary rounded-xl sketch-card">
              <p className="text-xs md:text-sm text-tertiary font-bold text-left">
                <span className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[1rem]">lightbulb</span> Tip
                </span>
                {t('journal.tip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

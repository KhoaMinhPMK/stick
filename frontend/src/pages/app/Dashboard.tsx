import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getProgressSummary, getProgressDaily, getDueVocab, getSettings, type ProgressSummary, type ProgressDailyItem } from '../../services/api/endpoints';
import { consumeGuestMergedFlag } from '../../services/api/auth';
import { usePremium } from '../../hooks/usePremium';
import { PremiumDayPassBanner } from '../../components/PremiumDayPassBanner';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const isPremium = usePremium();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'this_week' | 'last_week'>('this_week');
  const periodRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [dailyData, setDailyData] = useState<ProgressDailyItem[]>([]);
  const [dueVocabCount, setDueVocabCount] = useState(0);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMergedBanner, setShowMergedBanner] = useState(() => consumeGuestMergedFlag());
  const [showLimitToast, setShowLimitToast] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, dailyRes, dueRes, settingsRes] = await Promise.all([
        getProgressSummary(),
        getProgressDaily(14),
        getDueVocab(1).catch(() => ({ items: [], total: 0 })),
        getSettings().catch(() => null),
      ]);
      setSummary(summaryRes);
      setDailyData(dailyRes.items);
      setDueVocabCount(dueRes.total);
      if (settingsRes?.settings?.dailyGoalMinutes) {
        setDailyGoalMinutes(settingsRes.settings.dailyGoalMinutes);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(t('dashboard.error_load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch when user navigates back to #app / #dashboard from another page
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.split('?')[0];
      if (hash === '#app' || hash === '#dashboard') {
        fetchData();
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Build chart data from daily progress (last 7 days)
  const getLocalDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = getLocalDate(new Date());
  const todayProgress = dailyData.find(p => getLocalDate(new Date(p.day)) === todayStr);
  const todayMinutes = todayProgress?.minutesSpent ?? 0;
  const goalPct = dailyGoalMinutes > 0 ? Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100)) : 0;

  const dayLabels = ['dashboard.mon', 'dashboard.tue', 'dashboard.wed', 'dashboard.thu', 'dashboard.fri', 'dashboard.sat', 'dashboard.sun'];
  const chartBars = (() => {
    const now = new Date();
    const bars = [];
    const offset = selectedPeriod === 'last_week' ? 7 : 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i - offset);
      const dateStr = getLocalDate(d);
      const dayOfWeek = d.getDay(); // 0=Sun,1=Mon...
      const labelIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const found = dailyData.find(p => getLocalDate(new Date(p.day)) === dateStr);
      const activity = found ? (found.journalsCount * 10 + found.minutesSpent + found.xpEarned) : 0;
      const hasActivity = activity > 0;
      const isToday = offset === 0 && i === 0;
      bars.push({
        label: dayLabels[labelIdx],
        value: activity,
        isAlt: i % 2 === 0,
        hasActivity,
        isToday,
      });
    }
    return bars;
  })();
  const maxActivity = Math.max(...chartBars.map(b => b.value), 1);

  return (
    <AppLayout activePath="#app">
      <PremiumDayPassBanner />
      {showMergedBanner && (
        <div className="mb-4 p-3 bg-secondary-container border-2 border-secondary sketch-border rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">check_circle</span>
            <span className="text-sm font-body text-on-secondary-container">{t('login.merged_guest_note')}</span>
          </div>
          <button onClick={() => setShowMergedBanner(false)} className="material-symbols-outlined text-secondary text-xl shrink-0" aria-label="Dismiss">close</button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-error-container border-2 border-error rounded-xl flex items-center justify-between">
          <span className="text-sm font-bold text-on-error-container">{error}</span>
          <button onClick={() => { setError(null); fetchData(); }} className="text-sm font-headline font-bold text-error underline">{t('common.retry')}</button>
        </div>
      )}
      {/* Hero Section */}
      <section className="mb-8 md:mb-10">
        <div className="bg-surface-container-highest sketch-border-card p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-6 relative overflow-hidden">
          <div className="flex-1 space-y-4 md:space-y-5 z-10 w-full text-center md:text-left">
            <h3 className="font-headline text-3xl md:text-4xl font-black text-black leading-tight">
              {t('dashboard.hero_title')}<br />
              <span className="inline-block bg-secondary-container px-3 md:px-3 py-1 mt-2 transform -rotate-1 text-xl md:text-xl sketch-border">
                {loading ? '...' : `${t('dashboard.day')} ${summary?.dayNumber ?? 1}`}
              </span>
              {isPremium && (
                <span className="inline-block ml-2 text-sm font-bold px-2 py-0.5 rounded-full premium-galaxy-badge text-amber-900 align-middle">
                  ★ Premium
                </span>
              )}
            </h3>
            <p className="text-base md:text-lg text-on-surface-variant md:max-w-lg mx-auto md:mx-0">
              {summary?.todayCompleted ? t('dashboard.hero_subtitle_done') : t('dashboard.hero_subtitle')}
            </p>
            {summary?.todayCompleted && summary?.todayJournalId ? (
              <button onClick={() => (window.location.hash = `#feedback?journalId=${summary.todayJournalId}`)} className={`sketch-border w-full md:w-auto px-6 md:px-6 py-3 md:py-3.5 font-headline text-lg md:text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group ${isPremium ? 'premium-galaxy-btn' : 'bg-tertiary text-white hover:bg-tertiary/80'}`}>
                {t('dashboard.view_today_result')}
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform" data-icon="visibility">visibility</span>
              </button>
            ) : (
              <button onClick={() => (window.location.hash = '#journal')} className={`sketch-border w-full md:w-auto px-6 md:px-6 py-3 md:py-3.5 font-headline text-lg md:text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group ${isPremium ? 'premium-galaxy-btn' : 'bg-black text-white hover:bg-stone-800'}`}>
                {t('dashboard.start_task')}
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform" data-icon="arrow_forward">arrow_forward</span>
              </button>
            )}
          </div>
          <div className="w-full md:w-1/3 flex justify-center items-center gap-6 z-10 mt-6 md:mt-0">
            {/* Streak Ring */}
            <div className={`relative w-40 h-40 md:w-48 md:h-48 border-[3px] md:border-[4px] border-black rounded-full bg-white overflow-hidden flex items-center justify-center sketch-card group ${isPremium ? 'streak-ring-premium' : ''}`}>
              <div className="flex flex-col items-center">
                <span className={`material-symbols-outlined text-5xl md:text-6xl ${isPremium ? 'streak-fire-premium' : 'text-black'}`} data-icon="local_fire_department">local_fire_department</span>
                <span className="font-headline font-black text-3xl md:text-4xl mt-1">{summary?.currentStreak || 0}</span>
                <span className="text-xs font-bold text-on-surface-variant">streak</span>
              </div>
            </div>
            {/* Daily Goal Ring */}
            {dailyGoalMinutes > 0 && (
              <div className="flex flex-col items-center gap-1">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" strokeWidth="6" fill="transparent" className="text-surface-container stroke-current" />
                    <circle cx="40" cy="40" r="32" strokeWidth="6" fill="transparent" strokeDasharray="201" strokeDashoffset={201 - (201 * goalPct) / 100} strokeLinecap="round" className="text-tertiary stroke-current transition-all duration-700" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-headline font-black text-lg leading-none">{goalPct}%</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-on-surface-variant text-center leading-tight">{todayMinutes}/{dailyGoalMinutes}<br />min</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-[-10px] md:bottom-[-20px] right-[-10px] md:right-[-20px] opacity-5 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[10rem] md:text-[20rem]" data-icon="accessibility_new">accessibility_new</span>
          </div>
        </div>
      </section>

      {/* Dashboard Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
        
        {/* Stats Overview Card */}
        <div className="md:col-span-8 bg-surface-container sketch-border-card p-5 md:p-6">
          <h4 className="font-headline text-lg md:text-xl font-bold mb-4 md:mb-5">{t('dashboard.last_entry')}</h4>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-surface-container-highest sketch-border p-3 md:p-4 text-center">
                <span className="font-headline font-black text-2xl md:text-3xl">{summary?.totalJournals || 0}</span>
                <p className="text-[10px] md:text-xs font-bold text-on-surface-variant mt-1">{t('dashboard.stat_journals')}</p>
              </div>
              <div className="bg-surface-container-highest sketch-border p-3 md:p-4 text-center">
                <span className="font-headline font-black text-2xl md:text-3xl">{summary?.totalWords || 0}</span>
                <p className="text-[10px] md:text-xs font-bold text-on-surface-variant mt-1">{t('dashboard.stat_words')}</p>
              </div>
              <div className="bg-surface-container-highest sketch-border p-3 md:p-4 text-center">
                <span className="font-headline font-black text-2xl md:text-3xl">{summary?.avgScore || 0}</span>
                <p className="text-[10px] md:text-xs font-bold text-on-surface-variant mt-1">{t('dashboard.stat_avg_score')}</p>
              </div>
              <div className="bg-surface-container-highest sketch-border p-3 md:p-4 text-center">
                <span className="font-headline font-black text-2xl md:text-3xl">{summary?.totalXp || 0}</span>
                <p className="text-[10px] md:text-xs font-bold text-on-surface-variant mt-1">{t('dashboard.stat_xp')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Words to Review Card */}
        <div onClick={() => (window.location.hash = '#vocab-notebook')} className="md:col-span-4 bg-[#c2d4b6] sketch-border-card p-5 md:p-6 text-black flex flex-col justify-center items-center text-center gap-3 md:gap-3 group cursor-pointer transition-transform hover:rotate-1 active:scale-95">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-black rounded-full flex items-center justify-center mb-1 md:mb-1 sketch-card">
            <span className="material-symbols-outlined text-black text-2xl md:text-2xl" data-icon="book_5">book_5</span>
          </div>
          <h4 className="font-headline text-3xl md:text-4xl font-black">{dueVocabCount}</h4>
          <p className="font-headline text-base md:text-base font-bold">{t('dashboard.words_to_review')}</p>
          <p className="text-xs md:text-sm opacity-90">{dueVocabCount > 0 ? t('dashboard.review_hint') : t('dashboard.no_review_hint', { defaultValue: 'All caught up! 🎉' })}</p>
        </div>

        {/* Speaking Practice Card */}
        <div className="md:col-span-5 bg-white sketch-border-card p-5 md:p-6 flex flex-col justify-between min-h-[200px]">
          <div>
            <h4 className="font-headline text-lg md:text-xl font-bold mb-1 md:mb-1">{t('dashboard.speaking_practice')}</h4>
            <p className="text-xs md:text-sm text-on-surface-variant">{t('dashboard.recommended_time')}</p>
          </div>
          <div className="my-5 md:my-6 flex items-center gap-3 md:gap-4">
            <div className="flex-1 h-3 md:h-3.5 bg-surface-container rounded-full border-2 border-black overflow-hidden relative sketch-card">
              <div className={`absolute top-0 left-0 h-full border-r-2 border-black ${isPremium ? 'premium-galaxy-bar' : 'bg-secondary-container'}`} style={{ width: `${Math.min(100, (summary?.totalJournals || 0) * 20)}%` }}></div>
            </div>
            <span className="font-bold text-base md:text-base font-headline">{Math.min(100, (summary?.totalJournals || 0) * 20)}%</span>
          </div>
          <button
            onClick={() => {
              if (summary?.todayJournalId) {
                window.location.hash = `#feedback-result?journalId=${summary.todayJournalId}`;
              } else {
                window.location.hash = '#progress';
              }
            }}
            className="w-full border-2 border-black py-2 md:py-2.5 rounded-xl font-headline font-bold hover:bg-secondary-container transition-colors sketch-border-subtle active:scale-95 text-sm md:text-base">
            {t('dashboard.continue_practice')}
          </button>
        </div>

        {/* Progress Mini-Chart */}
        <div className="md:col-span-7 bg-surface-container sketch-border-card p-5 md:p-6">
          <div className="flex justify-between items-center mb-5 md:mb-6">
            <h4 className="font-headline text-lg md:text-xl font-bold">{t('dashboard.progress')}</h4>
            <div ref={periodRef} className="relative">
              <button
                onClick={() => setPeriodOpen(!periodOpen)}
                className="flex items-center gap-1 px-3 py-1.5 border-2 border-black rounded-full font-headline font-bold text-xs md:text-sm hover:bg-secondary-container transition-colors active:scale-95"
              >
                {t(`dashboard.${selectedPeriod}`)}
                <span className={`material-symbols-outlined text-sm transition-transform ${periodOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] overflow-hidden z-20 min-w-[140px]">
                  {(['this_week', 'last_week'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => { setSelectedPeriod(p); setPeriodOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 font-headline font-bold text-xs md:text-sm transition-colors flex items-center justify-between gap-3 ${
                        selectedPeriod === p ? 'bg-secondary-container' : 'hover:bg-surface-container'
                      }`}
                    >
                      {t(`dashboard.${p}`)}
                      {selectedPeriod === p && <span className="material-symbols-outlined text-xs">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Dynamic Chart Bars */}
          <div className="relative h-28 md:h-40 w-full flex items-end justify-between px-2 md:px-4">
            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between opacity-10 pointer-events-none">
              <div className="border-b-2 border-black w-full"></div>
              <div className="border-b-2 border-black w-full"></div>
              <div className="border-b-2 border-black w-full"></div>
            </div>
            {chartBars.map((bar, i) => {
              const pct = maxActivity > 0 ? Math.max((bar.value / maxActivity) * 100, 5) : 5;
              return (
                <div key={i} className="flex flex-col items-center gap-1 md:gap-1.5 group z-10 w-full">
                  <div
                    className={`w-3 sm:w-5 md:w-8 ${
                      bar.hasActivity
                        ? (isPremium ? 'premium-galaxy-bar' : 'bg-gradient-to-t from-amber-500 to-yellow-300')
                        : bar.isToday
                          ? 'bg-primary/20 border-primary/60'
                          : bar.isAlt ? 'bg-secondary-container' : 'bg-black/20'
                    } border-2 ${bar.isToday && !bar.hasActivity ? 'border-primary/60 border-dashed' : 'border-black'} rounded-t-lg transition-all group-hover:scale-y-110 origin-bottom sketch-border-subtle`}
                    style={{ height: `${pct}%` }}
                  ></div>
                  <span className={`text-[10px] md:text-xs font-bold font-label ${bar.hasActivity ? 'text-amber-700' : bar.isToday ? 'text-primary font-black' : ''}`}>{t(bar.label)}</span>
                  {bar.hasActivity ? (
                    <span className="material-symbols-outlined text-[12px] text-amber-500 -mt-0.5">local_fire_department</span>
                  ) : bar.isToday ? (
                    <span className="material-symbols-outlined text-[12px] text-primary/60 -mt-0.5">fiber_manual_record</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Task Suggestions */}
      <section className="mt-10 md:mt-12">
        <h5 className="font-headline text-lg md:text-xl font-black mb-5 md:mb-6">{t('dashboard.suggested_for_you')}</h5>
        <div className="flex gap-4 md:gap-6 justify-start md:justify-start lg:justify-between overflow-x-auto pb-6 pt-2 px-2 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', marginLeft: '-8px', marginRight: '-8px' }}>
           <style suppressHydrationWarning>{`
             div::-webkit-scrollbar { display: none; }
           `}</style>
          
          <div onClick={() => (window.location.hash = '#library')} className="min-w-[240px] md:min-w-[260px] bg-surface-container-low border-[3px] border-black rounded-[20px] p-5 md:p-5 hover:-translate-y-1 transition-transform cursor-pointer group snap-start sketch-card flex-1 active:scale-95">
            <span className="material-symbols-outlined text-3xl md:text-3xl mb-3 md:mb-3 text-black" data-icon="auto_stories">auto_stories</span>
            <h6 className="font-headline font-bold text-base md:text-lg mb-1 md:mb-1.5">{t('dashboard.reading_story')}</h6>
            <p className="text-xs md:text-sm text-on-surface-variant">{t('dashboard.explore_library')}</p>
          </div>
          
          <div onClick={() => (window.location.hash = '#saved-phrases')} className="min-w-[240px] md:min-w-[260px] bg-surface-container-low border-[3px] border-black rounded-[20px] p-5 md:p-5 hover:-translate-y-1 transition-transform cursor-pointer group snap-start sketch-card flex-1 active:scale-95">
            <span className="material-symbols-outlined text-3xl md:text-3xl mb-3 md:mb-3 text-black" data-icon="format_quote">format_quote</span>
            <h6 className="font-headline font-bold text-base md:text-lg mb-1 md:mb-1.5">{t('dashboard.saved_phrases')}</h6>
            <p className="text-xs md:text-sm text-on-surface-variant">{t('dashboard.phrases_collected', { count: summary?.totalPhrases || 0 })}</p>
          </div>
          
          <div onClick={() => (window.location.hash = '#achievements')} className="min-w-[240px] md:min-w-[260px] bg-surface-container-low border-[3px] border-black rounded-[20px] p-5 md:p-5 hover:-translate-y-1 transition-transform cursor-pointer group snap-start sketch-card flex-1 active:scale-95">
            <span className="material-symbols-outlined text-3xl md:text-3xl mb-3 md:mb-3 text-black" data-icon="emoji_events">emoji_events</span>
            <h6 className="font-headline font-bold text-base md:text-lg mb-1 md:mb-1.5">{t('dashboard.achievements_title')}</h6>
            <p className="text-xs md:text-sm text-on-surface-variant">{t('dashboard.achievements_desc')}</p>
          </div>
        </div>
      </section>

      {/* FAB */}
      {summary?.todayCompleted && summary?.todayJournalId ? (
        <button onClick={() => {
          window.location.hash = `#feedback-result?journalId=${summary.todayJournalId}`;
        }} className={`fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-xl border-[3px] md:border-4 hover:scale-110 active:scale-95 transition-all z-50 sketch-border-subtle ${isPremium ? 'premium-galaxy-btn border-purple-400' : 'bg-tertiary text-white border-white'}`}>
          <span className="material-symbols-outlined text-2xl md:text-3xl">rate_review</span>
        </button>
      ) : (
        <button onClick={() => {
          window.location.hash = '#journal-workspace';
        }} className={`fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-xl border-[3px] md:border-4 hover:scale-110 active:scale-95 transition-all z-50 sketch-border-subtle ${isPremium ? 'premium-galaxy-btn border-purple-400' : 'bg-black text-white border-white'}`}>
          <span className="material-symbols-outlined text-2xl md:text-3xl">add</span>
        </button>
      )}
    </AppLayout>
  );
};

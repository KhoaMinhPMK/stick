import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getProgressSummary, getProgressDaily, getProgressDailyDetail, type ProgressSummary, type ProgressDailyItem } from '../../services/api/endpoints';
import { apiRequest } from '../../services/api/client';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type DayStatus = 'completed' | 'missed' | 'today' | 'future';

export const ProgressPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayDetail, setDayDetail] = useState<any>(null);
  const [dayDetailLoading, setDayDetailLoading] = useState(false);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [dailyData, setDailyData] = useState<ProgressDailyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, dailyRes] = await Promise.all([
          getProgressSummary(),
          getProgressDaily(90),
        ]);
        setSummary(sumRes);

        setDailyData(dailyRes.items);
      } catch (err) {
        console.error('Failed to load progress:', err);
        setError(t('progress.error_load'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  // Helper to safely get YYYY-MM-DD from a Date object without timezone shifting
  const getLocalDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Build day statuses from daily progress data
  const activeDates = new Set(
    dailyData
      .filter(d => (d.journalsCount > 0 || d.minutesSpent > 0 || d.xpEarned > 0 || d.wordsLearned > 0))
      .map(d => getLocalDateString(new Date(d.day)))
  );

  const yesterdayStr = getLocalDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  const days: { day: number; status: DayStatus; isStreakDay?: boolean }[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = getLocalDateString(date);
    const todayStr = getLocalDateString(now);

    if (dateStr === todayStr) return { day, status: 'today' as DayStatus };
    if (date > now) return { day, status: 'future' as DayStatus };
    if (activeDates.has(dateStr)) return { day, status: 'completed' as DayStatus, isStreakDay: dateStr === yesterdayStr };
    return { day, status: 'missed' as DayStatus };
  });

  const completedCount = days.filter(d => d.status === 'completed').length;
  const streak = summary?.currentStreak || 0;
  const bestStreak = summary?.bestStreak || 0;
  const totalDaysAllTime = summary?.totalActiveDays || 0;

  // Build XP-per-date map for bar chart heights in calendar cells
  const xpByDate = React.useMemo(() => {
    const m = new Map<string, number>();
    dailyData.forEach(d => {
      const key = getLocalDateString(new Date(d.day));
      m.set(key, d.xpEarned);
    });
    return m;
  }, [dailyData]);
  const maxXpInPeriod = React.useMemo(
    () => Math.max(10, ...dailyData.map(d => d.xpEarned)),
    [dailyData]
  );

  // Milestone uses all-time total journals for meaningful goal tracking
  const totalJournals = summary?.totalJournals || 0;
  const nextMilestone = Math.max(Math.ceil((totalJournals + 1) / 10) * 10, 10);
  const daysToGoal = nextMilestone - totalJournals;

  // Load day detail when clicking a completed day
  const handleDayClick = async (day: number, status: DayStatus) => {
    if (status !== 'completed' && status !== 'today') return;
    if (selectedDay === day) {
      setSelectedDay(null);
      setDayDetail(null);
      return;
    }
    setSelectedDay(day);
    setDayDetailLoading(true);
    setDayDetail(null);
    try {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const dateStr = getLocalDateString(date);
      const res = await getProgressDailyDetail(dateStr);
      setDayDetail(res.detail);
    } catch (err) {
      console.error('Failed to load day detail:', err);
    } finally {
      setDayDetailLoading(false);
    }
  };

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('progress.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-sm md:text-base mt-1">{t('progress.subtitle')}</p>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-4 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-error">error</span>
            <span className="text-error font-medium text-sm">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12">
            {/* Calendar Board */}
            <section className="lg:col-span-8">
              <div className="bg-surface-container-lowest p-4 sm:p-6 md:p-8 lg:p-10 sketch-border shadow-[4px_4px_0_0_#000] md:shadow-[8px_8px_0_0_#000]">
                <div className="flex justify-between items-end mb-6 md:mb-10">
                  <div>
                    <h3 className="font-headline font-extrabold text-xl md:text-3xl lg:text-4xl mb-1 md:mb-2">{monthName}</h3>
                    <p className="text-on-surface-variant font-medium text-xs md:text-sm">{t('progress.consistency_quote')}</p>
                  </div>
                  <div className="flex gap-2 md:gap-4">
                    <button onClick={() => { setMonthOffset(m => m - 1); setSelectedDay(null); setDayDetail(null); }} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border-2 border-black rounded-lg hover:bg-surface-container transition-colors active:scale-95">
                      <span className="material-symbols-outlined text-sm md:text-base">chevron_left</span>
                    </button>
                    <button onClick={() => { setMonthOffset(m => Math.min(m + 1, 0)); setSelectedDay(null); setDayDetail(null); }} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border-2 border-black rounded-lg hover:bg-surface-container transition-colors active:scale-95">
                      <span className="material-symbols-outlined text-sm md:text-base">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 mb-2 md:mb-4">
                  {WEEKDAYS.map((_, idx) => (
                    <div key={idx} className="text-center font-bold text-stone-400 text-[10px] md:text-sm uppercase tracking-widest">
                      {t(`progress.weekday_${idx}`)}
                    </div>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6">
                  {Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {days.map(({ day, status, isStreakDay }) => {
                    if (status === 'completed') {
                      const dateStr = getLocalDateString(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                      const xp = xpByDate.get(dateStr) || 0;
                      const barPct = Math.max(20, Math.round((xp / maxXpInPeriod) * 100));
                      return (
                        <div
                          key={day}
                          onClick={() => handleDayClick(day, status)}
                          className={`aspect-square md:h-auto md:aspect-auto md:min-h-[5rem] lg:min-h-[6rem] border-2 border-black rounded-lg md:rounded-xl flex flex-col items-center justify-between pt-1.5 pb-1.5 md:pt-2 md:pb-2 px-1.5 md:px-2 hover:-rotate-1 transition-transform cursor-pointer overflow-hidden ${isStreakDay ? 'streak-yesterday-cell' : 'bg-tertiary-container'} ${selectedDay === day ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        >
                          <span className="font-headline font-bold text-white text-xs md:text-base leading-none">{day}</span>
                          {isStreakDay ? (
                            <span
                              className="material-symbols-outlined text-white text-xl md:text-3xl drop-shadow"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >local_fire_department</span>
                          ) : (
                            <div className="w-full flex items-end justify-center" style={{ height: '45%' }}>
                              <div className="w-full bg-white/20 rounded-sm h-full overflow-hidden flex items-end">
                                <div
                                  className="w-full bg-white rounded-sm transition-all"
                                  style={{ height: `${barPct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    if (status === 'missed') {
                      return (
                        <div
                          key={day}
                          className="aspect-square md:h-auto md:aspect-auto md:min-h-[5rem] lg:min-h-[6rem] border-2 border-black rounded-lg md:rounded-xl bg-surface-container flex flex-col items-center justify-center gap-0.5 md:gap-1 opacity-50"
                        >
                          <span className="font-headline font-bold text-on-surface-variant text-xs md:text-base">{day}</span>
                          <span className="material-symbols-outlined text-stone-400 text-lg md:text-2xl lg:text-3xl">close</span>
                        </div>
                      );
                    }
                    if (status === 'today') {
                      return (
                        <div
                          key={day}
                          onClick={() => handleDayClick(day, status)}
                          className="aspect-square md:h-auto md:aspect-auto md:min-h-[5rem] lg:min-h-[6rem] border-2 border-black rounded-lg md:rounded-xl bg-secondary-container flex flex-col items-center justify-center gap-0.5 md:gap-1 ring-2 md:ring-4 ring-primary ring-offset-2 md:ring-offset-4 ring-offset-surface cursor-pointer"
                        >
                          <span className="font-headline font-bold text-black text-xs md:text-base">{day}</span>
                          <span className="text-[8px] md:text-xs font-black uppercase">{t('progress.today')}</span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={day}
                        className="aspect-square md:h-auto md:aspect-auto md:min-h-[5rem] lg:min-h-[6rem] border-2 border-dashed border-stone-300 rounded-lg md:rounded-xl flex flex-col items-center justify-center"
                      >
                        <span className="font-headline font-bold text-stone-300 text-xs md:text-base">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Detail Panel */}
              {selectedDay && (
                <div className="mt-4 bg-surface-container-lowest sketch-border p-4 md:p-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-headline font-bold text-base md:text-lg">
                      📋 {viewDate.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' })} {selectedDay} — {t('progress.day_detail')}
                    </h4>
                    <button onClick={() => { setSelectedDay(null); setDayDetail(null); }} className="text-stone-400 hover:text-black">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  {dayDetailLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </div>
                  ) : dayDetail ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-surface-container p-3 rounded-lg text-center">
                          <p className="font-black text-xl md:text-2xl font-headline">{dayDetail.journalsCount}</p>
                          <p className="text-[10px] md:text-xs font-bold text-stone-500 uppercase">{t('progress.stat_journals')}</p>
                        </div>
                        <div className="bg-surface-container p-3 rounded-lg text-center">
                          <p className="font-black text-xl md:text-2xl font-headline">{dayDetail.wordsLearned}</p>
                          <p className="text-[10px] md:text-xs font-bold text-stone-500 uppercase">{t('progress.stat_words')}</p>
                        </div>
                        <div className="bg-surface-container p-3 rounded-lg text-center">
                          <p className="font-black text-xl md:text-2xl font-headline">{dayDetail.xpEarned}</p>
                          <p className="text-[10px] md:text-xs font-bold text-stone-500 uppercase">{t('progress.stat_xp')}</p>
                        </div>
                        <div className="bg-surface-container p-3 rounded-lg text-center">
                          <p className="font-black text-xl md:text-2xl font-headline">{dayDetail.minutesSpent}</p>
                          <p className="text-[10px] md:text-xs font-bold text-stone-500 uppercase">{t('progress.stat_minutes')}</p>
                        </div>
                      </div>
                      {dayDetail.journals && dayDetail.journals.length > 0 && (
                        <div>
                          <p className="font-bold text-xs uppercase text-stone-500 mb-2">{t('progress.journal_entries')}:</p>
                          <div className="space-y-2">
                            {dayDetail.journals.map((j: any) => (
                              <div
                                key={j.id}
                                onClick={() => window.location.hash = `#history-detail?id=${j.id}`}
                                className="flex items-center justify-between bg-white p-3 rounded-lg border border-stone-200 cursor-pointer hover:bg-surface-container transition-colors"
                              >
                                <span className="font-medium text-sm">{j.title}</span>
                                {j.score != null && (
                                  <span className="bg-tertiary-container text-white text-xs font-bold px-2 py-0.5 rounded-full">{j.score}/100</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-stone-400 text-sm italic">{t('progress.no_activity')}</p>
                  )}
                </div>
              )}
            </section>

            {/* Stats Side Panel */}
            <aside className="lg:col-span-4 space-y-4 md:space-y-6 lg:space-y-8">
              {/* Streak Card */}
              <div className="bg-secondary-container p-5 md:p-6 lg:p-8 sketch-border rotate-1">
                <h4 className="font-headline font-extrabold text-lg md:text-xl lg:text-2xl mb-4 md:mb-6">{t('progress.streak_stats')}</h4>
                <div className="space-y-3 md:space-y-4 lg:space-y-6">
                  <div className="flex items-center gap-3 md:gap-4 bg-surface/50 p-3 md:p-4 border-2 border-black rounded-lg">
                    <div className="text-2xl md:text-4xl">🔥</div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black uppercase text-stone-600">{t('progress.current_streak')}</p>
                      <p className="font-headline font-bold text-lg md:text-2xl">{streak} {t('progress.days')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 bg-surface/50 p-3 md:p-4 border-2 border-black rounded-lg">
                    <div className="text-2xl md:text-4xl">🏆</div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black uppercase text-stone-600">{t('progress.best_streak_label')}</p>
                      <p className="font-headline font-bold text-lg md:text-2xl">{bestStreak} {t('progress.days')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 bg-surface/50 p-3 md:p-4 border-2 border-black rounded-lg">
                    <div className="text-2xl md:text-4xl">📅</div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black uppercase text-stone-600">{t('progress.total_days')}</p>
                      <p className="font-headline font-bold text-lg md:text-2xl">{totalDaysAllTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 bg-surface/50 p-3 md:p-4 border-2 border-black rounded-lg">
                    <div className="text-2xl md:text-4xl">⚡</div>
                    <div>
                      <p className="text-[10px] md:text-xs font-black uppercase text-stone-600">{t('progress.total_xp')}</p>
                      <p className="font-headline font-bold text-lg md:text-2xl">{summary?.totalXp || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone Note */}
              <div className="bg-tertiary p-5 md:p-6 lg:p-8 sketch-border -rotate-1 text-on-tertiary">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <span className="material-symbols-outlined text-2xl md:text-4xl">auto_awesome</span>
                  <div className="bg-tertiary-container px-2 md:px-3 py-0.5 md:py-1 border-2 border-black rounded-lg text-[10px] md:text-xs font-bold uppercase">{t('progress.goal_label')}</div>
                </div>
                <h4 className="font-headline font-bold text-base md:text-xl mb-1 md:mb-2">{t('progress.keep_it_up')}</h4>
                <p className="text-on-tertiary/90 leading-relaxed text-xs md:text-sm mb-4 md:mb-6">{t('progress.milestone_desc', { count: daysToGoal })}</p>
                <div className="w-full h-3 md:h-4 bg-black/20 rounded-full overflow-hidden mb-1 md:mb-2">
                  <div className="h-full bg-on-tertiary rounded-full transition-all" style={{ width: `${Math.min((totalJournals / nextMilestone) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase">
                  <span>{t('progress.day_current', { day: totalJournals })}</span>
                  <span>{t('progress.day_milestone', { day: nextMilestone })}</span>
                </div>
              </div>

              {/* Leaderboard CTA */}
              <button
                onClick={() => window.location.hash = '#leaderboard'}
                className="w-full bg-surface-container-highest sketch-border p-4 md:p-5 flex items-center gap-3 hover:-rotate-1 transition-transform cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-2xl md:text-3xl text-amber-500">emoji_events</span>
                <div className="text-left flex-1">
                  <p className="font-headline font-bold text-sm md:text-base">{t('progress.leaderboard')}</p>
                  <p className="text-xs text-stone-500">{t('progress.leaderboard_desc')}</p>
                </div>
                <span className="material-symbols-outlined text-stone-400">chevron_right</span>
              </button>

              {/* Encouragement */}
              <div className="flex flex-col items-center text-center py-4 md:py-6 opacity-60">
                <span className="material-symbols-outlined text-5xl md:text-6xl text-black/40 mb-3">directions_run</span>
                <p className="font-headline italic font-bold text-sm md:text-base">"{t('progress.encouragement_quote')}"</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

// Mock data: status for each day of the month
type DayStatus = 'completed' | 'missed' | 'today' | 'future';

const generateMockDays = (): { day: number; status: DayStatus }[] => {
  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    if (day < today) {
      // Mock: miss day 9 and 15
      return { day, status: (day === 9 || day === 15 ? 'missed' : 'completed') as DayStatus };
    } else if (day === today) {
      return { day, status: 'today' as DayStatus };
    }
    return { day, status: 'future' as DayStatus };
  });
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ProgressPage: React.FC = () => {
  const { t } = useTranslation();
  const [days] = useState(generateMockDays);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate first day offset (Mon=0)
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // shift Sun=0 to Mon-based

  const completedCount = days.filter(d => d.status === 'completed').length;
  const bestStreak = 15; // mock
  const totalDays = 42; // mock

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
                  <button onClick={() => setMonthOffset(m => m - 1)} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border-2 border-black rounded-lg hover:bg-surface-container transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-sm md:text-base">chevron_left</span>
                  </button>
                  <button onClick={() => setMonthOffset(m => Math.min(m + 1, 0))} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center border-2 border-black rounded-lg hover:bg-surface-container transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-sm md:text-base">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 mb-2 md:mb-4">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center font-bold text-stone-400 text-[10px] md:text-sm uppercase tracking-widest">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6">
                {/* Offset empty cells */}
                {Array.from({ length: offset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {days.map(({ day, status }) => {
                  if (status === 'completed') {
                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                        className={`aspect-square md:h-auto md:aspect-auto md:min-h-[5rem] lg:min-h-[6rem] border-2 border-black rounded-lg md:rounded-xl bg-tertiary-container flex flex-col items-center justify-center gap-0.5 md:gap-1 hover:-rotate-1 transition-transform cursor-pointer ${selectedDay === day ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      >
                        <span className="font-headline font-bold text-white text-xs md:text-base">{day}</span>
                        <span className="material-symbols-outlined text-white text-lg md:text-2xl lg:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          local_fire_department
                        </span>
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
                        className="aspect-square md:h-auto md:aspect-auto md:min-h-[5rem] lg:min-h-[6rem] border-2 border-black rounded-lg md:rounded-xl bg-secondary-container flex flex-col items-center justify-center gap-0.5 md:gap-1 ring-2 md:ring-4 ring-primary ring-offset-2 md:ring-offset-4 ring-offset-surface"
                      >
                        <span className="font-headline font-bold text-black text-xs md:text-base">{day}</span>
                        <span className="text-[8px] md:text-xs font-black uppercase">{t('progress.today')}</span>
                      </div>
                    );
                  }
                  // future
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
          </section>

          {/* Stats Side Panel */}
          <aside className="lg:col-span-4 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Streak Card */}
            <div className="bg-secondary-container p-5 md:p-6 lg:p-8 sketch-border rotate-1">
              <h4 className="font-headline font-extrabold text-lg md:text-xl lg:text-2xl mb-4 md:mb-6">{t('progress.streak_stats')}</h4>
              <div className="space-y-3 md:space-y-4 lg:space-y-6">
                <div className="flex items-center gap-3 md:gap-4 bg-surface/50 p-3 md:p-4 border-2 border-black rounded-lg">
                  <div className="text-2xl md:text-4xl">🏆</div>
                  <div>
                    <p className="text-[10px] md:text-xs font-black uppercase text-stone-600">{t('progress.best_streak')}</p>
                    <p className="font-headline font-bold text-lg md:text-2xl">{bestStreak} {t('progress.days')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 bg-surface/50 p-3 md:p-4 border-2 border-black rounded-lg">
                  <div className="text-2xl md:text-4xl">📅</div>
                  <div>
                    <p className="text-[10px] md:text-xs font-black uppercase text-stone-600">{t('progress.total_days')}</p>
                    <p className="font-headline font-bold text-lg md:text-2xl">{totalDays}</p>
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
              <p className="text-on-tertiary/90 leading-relaxed text-xs md:text-sm mb-4 md:mb-6">{t('progress.milestone_desc')}</p>
              <div className="w-full h-3 md:h-4 bg-black/20 rounded-full overflow-hidden mb-1 md:mb-2">
                <div className="h-full bg-on-tertiary w-[80%] rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] md:text-xs font-bold uppercase">
                <span>{t('progress.day_current', { day: completedCount })}</span>
                <span>{t('progress.day_milestone', { day: 20 })}</span>
              </div>
            </div>

            {/* Stick Figure Encouragement */}
            <div className="flex flex-col items-center text-center py-4 md:py-6 opacity-60">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-black/40 mb-3">directions_run</span>
              <p className="font-headline italic font-bold text-sm md:text-base">"{t('progress.encouragement_quote')}"</p>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const achievements = [
  { id: '1', icon: 'local_fire_department', titleKey: 'achievements.a_streak_7', descKey: 'achievements.a_streak_7_desc', unlocked: true, date: '2026-03-20' },
  { id: '2', icon: 'edit_note', titleKey: 'achievements.a_first_entry', descKey: 'achievements.a_first_entry_desc', unlocked: true, date: '2026-03-01' },
  { id: '3', icon: 'emoji_events', titleKey: 'achievements.a_score_90', descKey: 'achievements.a_score_90_desc', unlocked: true, date: '2026-03-15' },
  { id: '4', icon: 'auto_stories', titleKey: 'achievements.a_10_entries', descKey: 'achievements.a_10_entries_desc', unlocked: false },
  { id: '5', icon: 'school', titleKey: 'achievements.a_5_lessons', descKey: 'achievements.a_5_lessons_desc', unlocked: false },
  { id: '6', icon: 'record_voice_over', titleKey: 'achievements.a_speaking', descKey: 'achievements.a_speaking_desc', unlocked: false },
  { id: '7', icon: 'local_fire_department', titleKey: 'achievements.a_streak_30', descKey: 'achievements.a_streak_30_desc', unlocked: false },
  { id: '8', icon: 'psychology', titleKey: 'achievements.a_100_words', descKey: 'achievements.a_100_words_desc', unlocked: false },
];

export const AchievementsPage: React.FC = () => {
  const { t } = useTranslation();
  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 md:mb-8">
          <button onClick={() => (window.location.hash = '#progress')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('achievements.back')}</span>
          </button>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('achievements.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">
            {t('achievements.subtitle', { unlocked, total: achievements.length })}
          </p>
        </div>

        {/* Progress */}
        <div className="sketch-card p-5 md:p-6 mb-6 md:mb-8 bg-surface-container">
          <div className="flex items-center justify-between mb-2">
            <span className="font-headline font-bold text-sm md:text-base">{t('achievements.collection')}</span>
            <span className="font-headline font-black text-sm md:text-base">{unlocked}/{achievements.length}</span>
          </div>
          <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
            <div className="h-full bg-tertiary-container rounded-full transition-all duration-500" style={{ width: `${(unlocked / achievements.length) * 100}%` }} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {achievements.map((a, i) => (
            <div
              key={a.id}
              className={`sketch-card p-5 md:p-6 transition-all ${
                a.unlocked
                  ? 'bg-surface-container-lowest hover:shadow-[3px_3px_0_0_#000]'
                  : 'bg-surface-container/50 opacity-60'
              } ${i % 2 === 0 ? 'hover:rotate-[0.3deg]' : 'hover:-rotate-[0.3deg]'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-black flex items-center justify-center shrink-0 ${
                  a.unlocked ? 'bg-tertiary-container' : 'bg-surface-container-highest'
                }`}>
                  <span className={`material-symbols-outlined text-xl md:text-2xl ${a.unlocked ? 'text-white' : 'text-black/30'}`}
                    style={{ fontVariationSettings: a.unlocked ? "'FILL' 1" : "'FILL' 0" }}>
                    {a.unlocked ? a.icon : 'lock'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-sm md:text-base mb-0.5">{t(a.titleKey)}</h4>
                  <p className="text-on-surface-variant text-xs md:text-sm">{t(a.descKey)}</p>
                  {a.unlocked && a.date && (
                    <p className="text-[10px] md:text-xs text-tertiary font-bold mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

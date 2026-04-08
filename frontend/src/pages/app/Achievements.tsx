import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getAchievements, getAchievementsSummary, type Achievement, type AchievementSummary } from '../../services/api/endpoints';

export const AchievementsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [achRes, sumRes] = await Promise.all([
          getAchievements(),
          getAchievementsSummary(),
        ]);
        setAchievements(achRes.items);
        setSummary(sumRes);
      } catch (err) {
        console.error('Failed to load achievements:', err);
        setError(t('achievements.error_load'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unlocked = summary?.unlocked || 0;
  const total = summary?.totalAchievements || achievements.length;

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
            {t('achievements.subtitle', { unlocked, total })}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : (
          <>
            {/* Progress + XP Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="sketch-card p-5 md:p-6 bg-surface-container">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-headline font-bold text-sm md:text-base">{t('achievements.collection')}</span>
                  <span className="font-headline font-black text-sm md:text-base">{unlocked}/{total}</span>
                </div>
                <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
                  <div className="h-full bg-tertiary-container rounded-full transition-all duration-500" style={{ width: `${summary?.completionPercent || 0}%` }} />
                </div>
              </div>
              <div className="sketch-card p-5 md:p-6 bg-secondary-container flex items-center gap-4">
                <div className="w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
                <div>
                  <span className="font-headline font-black text-2xl md:text-3xl">{summary?.xpEarned || 0}</span>
                  <p className="text-xs font-bold text-on-surface-variant">{t('achievements.total_xp_earned')}</p>
                </div>
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
                      <h4 className="font-headline font-bold text-sm md:text-base mb-0.5">{a.title}</h4>
                      <p className="text-on-surface-variant text-xs md:text-sm">{a.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] md:text-xs font-bold bg-surface-container-highest px-2 py-0.5 rounded-full">+{a.xpReward} XP</span>
                        {a.unlocked && a.unlockedAt && (
                          <p className="text-[10px] md:text-xs text-tertiary font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            {new Date(a.unlockedAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {!a.unlocked && a.progress > 0 && (
                          <span className="text-[10px] font-bold text-on-surface-variant">{a.progress}/{a.threshold}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getProgressSummary, type ProgressSummary } from '../../services/api/endpoints';
import { apiRequest } from '../../services/api/client';
import { logout } from '../../services/api/auth';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  level: string;
  createdAt: string;
}

const navCards = [
  { icon: 'person_edit', titleKey: 'profile.card_edit', descKey: 'profile.card_edit_desc', href: '#edit-profile' },
  { icon: 'notifications_active', titleKey: 'profile.card_reminders', descKey: 'profile.card_reminders_desc', href: '#reminders' },
  { icon: 'tune', titleKey: 'profile.card_preferences', descKey: 'profile.card_preferences_desc', href: '#settings' },
  { icon: 'bookmark', titleKey: 'profile.card_saved', descKey: 'profile.card_saved_desc', filled: true, href: '#saved-phrases' },
];

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, summaryRes] = await Promise.all([
          apiRequest<{ user: UserProfile }>('/profile'),
          getProgressSummary(),
        ]);
        setProfile(profileRes.user);
        setSummary(summaryRes);
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <AppLayout activePath="#profile">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        {/* Profile Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-start">
          {/* Main Profile Card */}
          <div className="lg:col-span-8 bg-surface-container-lowest sketch-border p-5 md:p-8 lg:p-10 relative overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-5 md:gap-8 items-center sm:items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 sketch-border overflow-hidden bg-surface-container-high flex items-center justify-center">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl md:text-5xl text-black/30">person</span>
                    )}
                  </div>
                  <button
                    onClick={() => (window.location.hash = '#edit-profile')}
                    className="absolute -bottom-1.5 -right-1.5 md:-bottom-2 md:-right-2 bg-primary text-surface p-1 md:p-2 rounded-full flex items-center justify-center border-2 border-surface z-10"
                  >
                    <span className="material-symbols-outlined text-xs md:text-sm">edit</span>
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3 md:space-y-4 text-center sm:text-left">
                  <div>
                    <h3 className="font-headline text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary -rotate-1 inline-block">
                      {profile?.name || 'User'}
                    </h3>
                    <p className="text-secondary font-medium text-xs md:text-sm mt-1">
                      {profile?.email || t('profile.subtitle')}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 md:gap-3 justify-center sm:justify-start">
                    <span className="px-3 md:px-4 py-0.5 md:py-1 bg-secondary-container border-2 border-black rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1 md:gap-2">
                      <span className="material-symbols-outlined text-xs md:text-sm">military_tech</span>
                      {summary?.level || profile?.level || 'Beginner'}
                    </span>
                    <span className="px-3 md:px-4 py-0.5 md:py-1 bg-surface-container-highest border-2 border-black rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1 md:gap-2">
                      <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                      {summary?.currentStreak || 0} day streak
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="pt-3 md:pt-4 border-t-2 border-dotted border-outline-variant/30">
                    <p className="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">
                      Member since {memberSince}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="font-headline font-black text-lg md:text-2xl text-primary">{summary?.totalJournals || 0}</p>
                        <p className="text-[10px] md:text-xs font-bold text-on-surface-variant">Journals</p>
                      </div>
                      <div className="text-center">
                        <p className="font-headline font-black text-lg md:text-2xl text-primary">{summary?.totalWords || 0}</p>
                        <p className="text-[10px] md:text-xs font-bold text-on-surface-variant">Words</p>
                      </div>
                      <div className="text-center">
                        <p className="font-headline font-black text-lg md:text-2xl text-primary">{summary?.totalPhrases || 0}</p>
                        <p className="text-[10px] md:text-xs font-bold text-on-surface-variant">Phrases</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6 overflow-hidden">
            <div className="bg-surface-container border-2 border-black rounded-lg p-4 md:p-6">
              <p className="text-on-surface-variant font-bold text-xs md:text-sm mb-3 md:mb-4">{t('profile.entries_month')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-5xl font-headline font-black text-primary">{summary?.totalJournals || 0}</span>
              </div>
            </div>
            <div className="bg-surface-container-highest border-2 border-black rounded-lg p-4 md:p-6">
              <p className="text-on-surface-variant font-bold text-xs md:text-sm mb-3 md:mb-4">{t('profile.total_points')}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl md:text-4xl font-headline font-black text-primary">{summary?.totalXp || 0}</span>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-primary flex items-center justify-center bg-secondary-container">
                  <span className="material-symbols-outlined text-primary text-sm md:text-base">star</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {navCards.map((card, i) => (
            <a
              key={i}
              href={card.href || '#'}
              className="group relative bg-surface-container-lowest sketch-border p-5 md:p-8 hover:bg-secondary-container transition-colors active:scale-95"
            >
              <div className="mb-3 md:mb-4">
                <span
                  className="material-symbols-outlined text-3xl md:text-4xl text-primary"
                  style={card.filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >{card.icon}</span>
              </div>
              <h4 className="font-headline text-base md:text-xl font-bold mb-1 md:mb-2">{t(card.titleKey)}</h4>
              <p className="text-[10px] md:text-sm text-on-surface-variant">{t(card.descKey)}</p>
              <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
              </div>
            </a>
          ))}
        </section>

        {/* Footer Quote */}
        <section className="flex justify-center pt-6 md:pt-12">
          <button
            onClick={async () => {
              await logout();
              window.location.hash = '#landing';
              window.location.reload();
            }}
            className="w-full max-w-xs py-3 md:py-4 sketch-border bg-surface-container-highest font-headline font-bold text-sm md:text-base hover:bg-error-container hover:text-error transition-colors flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            {t('settings.logout', { defaultValue: 'Log Out' })}
          </button>
        </section>

        <section className="flex justify-center pt-4 md:pt-8">
          <div className="text-center max-w-sm opacity-60">
            <span className="material-symbols-outlined text-4xl md:text-5xl text-black/20 mb-3 md:mb-4 block">sentiment_very_satisfied</span>
            <p className="italic text-on-surface-variant text-xs md:text-sm">{t('profile.footer_quote')}</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const miniBarData = [30, 50, 40, 70, 90, 60, 85];

const navCards = [
  { icon: 'person_edit', titleKey: 'profile.card_edit', descKey: 'profile.card_edit_desc', href: '#edit-profile' },
  { icon: 'notifications_active', titleKey: 'profile.card_reminders', descKey: 'profile.card_reminders_desc', href: '#reminders' },
  { icon: 'tune', titleKey: 'profile.card_preferences', descKey: 'profile.card_preferences_desc', href: '#settings' },
  { icon: 'bookmark', titleKey: 'profile.card_saved', descKey: 'profile.card_saved_desc', filled: true, href: '#saved-phrases' },
];

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppLayout activePath="#profile">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
        {/* Profile Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-start">
          {/* Main Profile Card */}
          <div className="lg:col-span-8 bg-surface-container-lowest sketch-border p-5 md:p-8 lg:p-10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 md:gap-8 items-center sm:items-start">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 sketch-border overflow-hidden bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl md:text-5xl text-black/30">person</span>
                </div>
                <button className="absolute -bottom-1.5 -right-1.5 md:-bottom-2 md:-right-2 bg-primary text-surface p-1 md:p-2 rounded-full flex items-center justify-center border-2 border-surface">
                  <span className="material-symbols-outlined text-xs md:text-sm">edit</span>
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3 md:space-y-4 text-center sm:text-left">
                <div>
                  <h3 className="font-headline text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary -rotate-1 inline-block">
                    Alex Rivers
                  </h3>
                  <p className="text-secondary font-medium text-xs md:text-sm mt-1">{t('profile.subtitle')}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 md:gap-3 justify-center sm:justify-start">
                  <span className="px-3 md:px-4 py-0.5 md:py-1 bg-secondary-container border-2 border-black rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1 md:gap-2">
                    <span className="material-symbols-outlined text-xs md:text-sm">military_tech</span>
                    {t('profile.level_badge')}
                  </span>
                  <span className="px-3 md:px-4 py-0.5 md:py-1 bg-surface-container-highest border-2 border-black rounded-lg text-[10px] md:text-sm font-bold flex items-center gap-1 md:gap-2">
                    <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                    {t('profile.streak_badge')}
                  </span>
                </div>

                {/* Goal */}
                <div className="pt-3 md:pt-4 border-t-2 border-dotted border-outline-variant/30">
                  <p className="text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-1 md:mb-2">{t('profile.current_goal')}</p>
                  <p className="text-sm md:text-lg font-headline font-semibold text-primary">"Read 20 English news articles by Friday"</p>
                  <div className="w-full h-2.5 md:h-3 bg-surface-container-high rounded-full mt-2 md:mt-3 overflow-hidden border-2 border-primary">
                    <div className="bg-tertiary h-full w-[65%]" />
                  </div>
                  <p className="text-right text-[10px] md:text-xs mt-1 font-bold">13/20</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="bg-surface-container border-2 border-black rounded-lg p-4 md:p-6 rotate-1">
              <p className="text-on-surface-variant font-bold text-xs md:text-sm mb-3 md:mb-4">{t('profile.entries_month')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-5xl font-headline font-black text-primary">24</span>
                <span className="text-tertiary font-bold flex items-center text-xs md:text-sm">
                  <span className="material-symbols-outlined text-xs md:text-sm">arrow_upward</span>12%
                </span>
              </div>
              <div className="mt-3 md:mt-4 flex gap-1 h-6 md:h-8 items-end">
                {miniBarData.map((h, i) => (
                  <div key={i} className="w-full bg-primary rounded-sm" style={{ height: `${h}%`, opacity: h / 100 }} />
                ))}
              </div>
            </div>
            <div className="bg-surface-container-highest border-2 border-black rounded-lg p-4 md:p-6 -rotate-1">
              <p className="text-on-surface-variant font-bold text-xs md:text-sm mb-3 md:mb-4">{t('profile.total_points')}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl md:text-4xl font-headline font-black text-primary">8,420</span>
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
          <div className="text-center max-w-sm opacity-60">
            <span className="material-symbols-outlined text-4xl md:text-5xl text-black/20 mb-3 md:mb-4 block">sentiment_very_satisfied</span>
            <p className="italic text-on-surface-variant text-xs md:text-sm">{t('profile.footer_quote')}</p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

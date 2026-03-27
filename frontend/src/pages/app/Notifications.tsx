import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const mockNotifications = [
  { id: '1', type: 'streak', icon: 'local_fire_department', titleKey: 'notifications.n_streak', time: '2m ago', read: false },
  { id: '2', type: 'feedback', icon: 'rate_review', titleKey: 'notifications.n_feedback', time: '1h ago', read: false },
  { id: '3', type: 'achievement', icon: 'emoji_events', titleKey: 'notifications.n_achievement', time: '3h ago', read: false },
  { id: '4', type: 'reminder', icon: 'notifications_active', titleKey: 'notifications.n_reminder', time: 'Yesterday', read: true },
  { id: '5', type: 'lesson', icon: 'menu_book', titleKey: 'notifications.n_lesson', time: 'Yesterday', read: true },
  { id: '6', type: 'tip', icon: 'lightbulb', titleKey: 'notifications.n_tip', time: '2 days ago', read: true },
];

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'streak': return 'bg-tertiary-container';
      case 'feedback': return 'bg-primary-container';
      case 'achievement': return 'bg-secondary-container';
      default: return 'bg-surface-container-highest';
    }
  };

  return (
    <AppLayout activePath="#app">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-6 md:mb-8">
          <div>
            <button onClick={() => (window.location.hash = '#app')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 group">
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="font-headline font-bold text-xs md:text-sm">{t('notifications.back')}</span>
            </button>
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight -rotate-1 origin-left">
              {t('notifications.title')}
            </h2>
            {unreadCount > 0 && (
              <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">
                {t('notifications.unread', { count: unreadCount })}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-4 py-2 rounded-full border-2 border-black font-headline font-bold text-xs md:text-sm hover:bg-surface-container transition-colors active:scale-95">
              {t('notifications.mark_all')}
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">notifications_off</span>
            <p className="font-headline font-bold text-xl text-stone-400">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`sketch-card p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-all cursor-pointer hover:shadow-[2px_2px_0_0_#000] ${
                  !n.read ? 'bg-surface-container-lowest border-l-4 border-l-primary' : 'bg-surface-container/50'
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(n.type)}`}>
                  <span className="material-symbols-outlined text-base md:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{n.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm md:text-base ${!n.read ? 'font-bold' : 'font-medium'}`}>{t(n.titleKey)}</p>
                  <p className="text-[10px] md:text-xs text-on-surface-variant">{n.time}</p>
                </div>
                {!n.read && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

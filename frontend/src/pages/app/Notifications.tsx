import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from '../../services/api/endpoints';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await getNotifications(50);
        setNotifications(res.items);
        setUnreadCount(res.unreadCount);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'streak': return 'bg-tertiary-container';
      case 'feedback': return 'bg-primary-container';
      case 'achievement': return 'bg-secondary-container';
      default: return 'bg-surface-container-highest';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'streak': return 'local_fire_department';
      case 'feedback': return 'rate_review';
      case 'achievement': return 'emoji_events';
      case 'system': return 'info';
      default: return 'notifications';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">notifications_off</span>
            <p className="font-headline font-bold text-xl text-stone-400">{t('notifications.empty')}</p>
            <p className="text-sm text-stone-400 mt-2">No notifications yet. They'll appear as you use the app!</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markOneRead(n.id)}
                className={`sketch-card p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-all cursor-pointer hover:shadow-[2px_2px_0_0_#000] ${
                  !n.read ? 'bg-surface-container-lowest border-l-4 border-l-primary' : 'bg-surface-container/50'
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(n.type)}`}>
                  <span className="material-symbols-outlined text-base md:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{getTypeIcon(n.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm md:text-base ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                  <p className="text-[10px] md:text-xs text-on-surface-variant truncate">{n.body}</p>
                  <p className="text-[10px] md:text-xs text-on-surface-variant mt-0.5">{formatTime(n.createdAt)}</p>
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

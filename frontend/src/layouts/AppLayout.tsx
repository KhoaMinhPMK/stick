import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredUser } from '../services/api/client';
import { getProgressSummary, getLeaderboard, type ProgressSummary } from '../services/api/endpoints';
import { logout } from '../services/api/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activePath = '#app' }) => {
  const { t, i18n } = useTranslation();
  const storedUser = getStoredUser();
  const isGuest = storedUser?.isGuest === true;
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isRankOne, setIsRankOne] = useState(false);

  useEffect(() => {
    getProgressSummary().then(setSummary).catch(() => {});
    getLeaderboard('all-time').then(res => {
      const top = res.items.find(i => i.isUser && i.rank === 1);
      setIsRankOne(!!top);
    }).catch(() => {});
  }, []);

  const navItems = [
    { id: '#app', icon: 'home', label: t('navigation.home') },
    { id: '#journal', icon: 'edit_note', label: t('navigation.journal') },
    { id: '#vocab-notebook', icon: 'book_5', label: t('navigation.vocab') },
    { id: '#progress', icon: 'trending_up', label: t('navigation.progress') },
    { id: '#history', icon: 'history', label: t('navigation.history') },
    { id: '#library', icon: 'school', label: t('navigation.library') },
    { id: '#profile', icon: 'person', label: t('navigation.profile') },
  ];

  // For mobile bottom nav, we show 5 main items
  const mobileNavItems = [
    { id: '#app', icon: 'home', label: t('navigation.home') },
    { id: '#journal', icon: 'edit_note', label: t('navigation.journal') },
    { id: '#vocab-notebook', icon: 'book_5', label: t('navigation.vocab') },
    { id: '#history', icon: 'history', label: t('navigation.history') },
    { id: '#profile', icon: 'person', label: t('navigation.profile') },
  ];

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* SideNavBar - Desktop Only */}
      <aside className="hidden md:flex h-screen w-56 lg:w-64 fixed left-0 top-0 border-r-4 border-black bg-surface-container flex-col py-6 gap-3 z-50 overflow-y-auto">
        <div className="px-5 mb-6">
          <h1 className="text-2xl font-black tracking-tighter text-black italic font-headline cursor-pointer" onClick={() => window.location.hash = '#app'}>STICK</h1>
          <p className="font-headline text-xs tracking-wide text-on-surface-variant font-bold">English Habit</p>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = activePath === item.id;
            return (
              <a
                key={item.id}
                href={item.id}
                className={`px-3 py-2.5 mx-3 flex items-center gap-3 transition-transform hover:-rotate-1 active:scale-95 group ${
                  isActive 
                    ? 'font-bold border-2 border-black rounded-full bg-secondary-container text-black' 
                    : 'text-on-surface-variant hover:bg-surface-container-highest rounded-xl'
                }`}
              >
                <span className={`material-symbols-outlined text-[1.2rem] ${isActive ? 'text-black' : ''}`} data-icon={item.icon}>{item.icon}</span>
                <span className="font-headline text-base tracking-wide">{item.label}</span>
              </a>
            );
          })}
          
          {/* Settings at the bottom */}
          <a
            href="#settings"
            className={`px-3 py-2.5 mx-3 flex items-center gap-3 mt-auto transition-transform hover:-rotate-1 active:scale-95 group ${
              activePath === '#settings'
                ? 'font-bold border-2 border-black rounded-full bg-secondary-container text-black' 
                : 'text-on-surface-variant hover:bg-surface-container-highest rounded-xl'
            }`}
          >
            <span className="material-symbols-outlined text-[1.2rem]" data-icon="settings">settings</span>
            <span className="font-headline text-base tracking-wide">{t('navigation.settings')}</span>
          </a>
        </nav>
      </aside>

      {/* TopNavBar Anchor */}
      <header className="flex justify-between items-center w-full px-4 md:pl-64 lg:pl-72 pr-4 md:pr-10 lg:pr-10 md:py-4 bg-surface/90 backdrop-blur-sm sticky top-0 z-40 h-14 md:h-20">
        {/* Mobile Title */}
        <div className="md:hidden flex items-center gap-2">
          <h2 className="font-headline font-extrabold text-lg tracking-tight text-black italic">STICK</h2>
        </div>
        
        {/* Desktop Title */}
        <h2 className="hidden md:block font-headline font-extrabold text-2xl tracking-tight text-black capitalize">
          {activePath.replace('#', '') || 'Home'}
        </h2>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Language Toggle */}
          <button 
            onClick={() => {
              const nextLang = i18n.language?.startsWith('vi') ? 'en' : 'vi';
              i18n.changeLanguage(nextLang);
            }}
            className="flex items-center justify-center gap-1 font-headline font-bold text-xs md:text-sm border-2 border-black rounded-full px-2 py-1 md:py-1.5 hover:bg-black hover:text-white transition-colors bg-white hover:scale-105 active:scale-95"
            title="Toggle Language"
          >
            <span className="material-symbols-outlined text-sm md:text-base">language</span>
            <span className="leading-none mt-[2px]">{i18n.language?.startsWith('vi') ? 'VI' : 'EN'}</span>
          </button>
          {/* Leaderboard Shortcut */}
          <button
            onClick={() => (window.location.hash = '#leaderboard')}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-black bg-white hover:bg-secondary-container hover:scale-105 active:scale-95 transition-all"
            title="Leaderboard"
          >
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>leaderboard</span>
          </button>

          {/* Streak Badge */}
          <div onClick={() => (window.location.hash = '#progress')} className="flex items-center gap-1.5 md:gap-2 bg-secondary-container px-3 md:px-3 py-1.5 md:py-1.5 rounded-full border-2 border-black hover:scale-105 transition-transform cursor-pointer">
            <span className="material-symbols-outlined streak-fire-premium text-sm md:text-base" data-icon="local_fire_department" style={{ fontVariationSettings: "'FILL' 1", fontSize: 'inherit' }}>local_fire_department</span>
            <span className="font-headline font-bold text-black text-xs md:text-sm">{summary?.currentStreak ?? 0}</span>
          </div>

          {isGuest && (
            <button
              onClick={() => (window.location.hash = '#register')}
              className="flex items-center justify-center gap-1.5 border-2 border-black rounded-full px-2.5 md:px-3 py-1.5 bg-white hover:bg-secondary-container transition-colors hover:scale-105 active:scale-95"
              title={t('common.sign_up', { defaultValue: 'Sign up' })}
            >
              <span className="material-symbols-outlined text-sm md:text-base">person_add</span>
              <span className="hidden sm:inline font-headline font-bold text-xs md:text-sm">{t('common.sign_up', { defaultValue: 'Sign up' })}</span>
            </button>
          )}

          {/* User Avatar */}
          <div onClick={() => (window.location.hash = '#profile')} className="relative w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black overflow-visible hover:scale-105 transition-transform cursor-pointer bg-white">
            {isRankOne && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none" style={{ filter: 'drop-shadow(0 1px 3px rgba(184,134,11,0.9))' }}>
                <svg width="22" height="16" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 22L4 8L12 16L20 3L28 16L36 8L36 22Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                  <rect x="4" y="21" width="32" height="6" rx="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
                  <circle cx="20" cy="3" r="2.5" fill="#FF4D4D" stroke="#B8860B" strokeWidth="1"/>
                  <circle cx="4" cy="8" r="2" fill="#60A5FA" stroke="#B8860B" strokeWidth="1"/>
                  <circle cx="36" cy="8" r="2" fill="#60A5FA" stroke="#B8860B" strokeWidth="1"/>
                </svg>
              </div>
            )}
            <div className="w-full h-full rounded-full overflow-hidden">
              {storedUser?.avatarUrl ? (
                <img src={storedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-black w-full h-full flex items-center justify-center text-xl md:text-2xl bg-surface-container" data-icon="person_outline">person_outline</span>
              )}
            </div>
          </div>

          {/* Logout */}
          {!isGuest && (
            <button
              onClick={async () => {
                await logout();
                window.location.hash = '#landing';
                window.location.reload();
              }}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-black flex items-center justify-center hover:bg-error-container hover:text-error hover:border-error transition-colors active:scale-95 bg-white"
              title={t('settings.logout', { defaultValue: 'Log Out' })}
            >
              <span className="material-symbols-outlined text-sm md:text-base">logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas */}
      <main className="px-4 md:pl-64 lg:pl-72 pr-4 md:pr-10 lg:pr-10 pb-20 md:pb-16 max-w-[1400px] w-full mx-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t-2 border-black flex items-center justify-around pb-safe pt-2 z-50 h-16 px-2">
         {mobileNavItems.map((item) => {
            const isActive = activePath === item.id;
            return (
              <a
                key={item.id}
                href={item.id}
                className="flex flex-col items-center justify-center relative w-16 h-full active:scale-95 transition-transform"
              >
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-secondary-container border-2 border-black -translate-y-2' : 'bg-transparent text-on-surface-variant'} transition-all`}>
                  <span className={`material-symbols-outlined ${isActive ? 'text-black' : ''}`} data-icon={item.icon}>{item.icon}</span>
                </div>
                {isActive && (
                  <span className="absolute bottom-1 font-headline font-bold text-[10px] text-black">
                    {item.label}
                  </span>
                )}
              </a>
            );
          })}
      </nav>
    </div>
  );
};

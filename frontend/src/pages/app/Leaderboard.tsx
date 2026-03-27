import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'weekly' | 'all-time'>('weekly');

  const ranking = [
    { rank: 1, name: "Maria Garcia", score: 12450, isUser: false, streak: 45 },
    { rank: 2, name: "David Chen", score: 11200, isUser: false, streak: 30 },
    { rank: 3, name: "Sarah Williams", score: 10850, isUser: false, streak: 22 },
    { rank: 4, name: "You", score: 9840, isUser: true, streak: 15 },
    { rank: 5, name: "Alex Turner", score: 9500, isUser: false, streak: 18 },
    { rank: 6, name: "Jessica Lee", score: 8700, isUser: false, streak: 12 },
    { rank: 7, name: "Michael Chang", score: 8200, isUser: false, streak: 10 },
  ];

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header Element */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => window.history.back()} className="p-2 hover:bg-surface-container rounded-full transition-colors hidden md:block">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <h1 className="font-headline font-black text-3xl tracking-tighter w-full md:w-auto text-center md:text-left">
               {t('leaderboard.title', { defaultValue: 'Top Thinkers' })}
             </h1>
          </div>
          
          <div className="flex items-center bg-surface-container p-1 rounded-full w-full md:w-auto">
             <button 
               onClick={() => setActiveTab('weekly')}
               className={`flex-1 md:w-32 py-2 rounded-full font-headline font-bold text-sm transition-all ${
                 activeTab === 'weekly' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:text-black hover:bg-black/5'
               }`}
             >
               Weekly
             </button>
             <button 
               onClick={() => setActiveTab('all-time')}
               className={`flex-1 md:w-32 py-2 rounded-full font-headline font-bold text-sm transition-all ${
                 activeTab === 'all-time' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:text-black hover:bg-black/5'
               }`}
             >
               All Time
             </button>
          </div>
        </div>

        {/* Podium (Top 3) */}
        <div className="flex justify-center items-end gap-2 md:gap-4 lg:gap-8 mb-16 px-4">
           {/* 2nd Place */}
           <div className="flex flex-col items-center flex-1 max-w-[120px]">
             <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface-container border-2 border-stone-300 relative mb-4">
                <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-stone-300 text-stone-800 font-black text-xs md:text-sm w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-surface">2</div>
             </div>
             <p className="font-headline font-bold text-xs md:text-sm text-center line-clamp-1 mb-1">{ranking[1].name}</p>
             <div className="w-full bg-stone-200 h-24 md:h-32 rounded-t-xl sketch-border border-b-0 flex flex-col items-center justify-start pt-4">
               <span className="font-black text-lg md:text-xl">{ranking[1].score.toLocaleString()}</span>
             </div>
           </div>
           
           {/* 1st Place */}
           <div className="flex flex-col items-center flex-1 max-w-[140px] z-10">
             <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-secondary-container border-4 border-[#FFD700] relative mb-4 shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                <span className="material-symbols-outlined text-[#FFD700] absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">emoji_events</span>
                <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 bg-[#FFD700] text-stone-900 font-black text-sm md:text-base w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-surface">1</div>
             </div>
             <p className="font-headline font-black text-sm md:text-base text-center line-clamp-1 mb-1">{ranking[0].name}</p>
             <div className="w-full bg-[#FFF5CC] h-32 md:h-48 rounded-t-xl sketch-border border-[#FFD700] border-b-0 flex flex-col items-center justify-start pt-4">
               <span className="font-black text-xl md:text-2xl text-[#B38F00]">{ranking[0].score.toLocaleString()}</span>
             </div>
           </div>

           {/* 3rd Place */}
           <div className="flex flex-col items-center flex-1 max-w-[120px]">
             <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-surface-container border-2 border-[#CD7F32] relative mb-4">
                <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 bg-[#CD7F32] text-white font-black text-xs md:text-sm w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-surface">3</div>
             </div>
             <p className="font-headline font-bold text-xs md:text-sm text-center line-clamp-1 mb-1">{ranking[2].name}</p>
             <div className="w-full bg-[#f4e2d2] h-20 md:h-28 rounded-t-xl sketch-border border-b-0 flex flex-col items-center justify-start pt-4">
               <span className="font-black text-lg md:text-xl text-[#8E511A]">{ranking[2].score.toLocaleString()}</span>
             </div>
           </div>
        </div>

        {/* List View */}
        <div className="bg-surface-container-lowest rounded-3xl sketch-border overflow-hidden flex flex-col gap-px bg-black">
          {ranking.slice(3).map((r, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-4 p-4 md:p-6 transition-colors ${r.isUser ? 'bg-primary/10 -ml-1 border-l-4 border-l-primary' : 'bg-surface-container-lowest hover:bg-surface-container'}`}
            >
              <div className="font-headline font-black text-on-surface-variant w-6 text-center">{r.rank}</div>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                 <span className="material-symbols-outlined text-stone-500">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-headline font-bold text-base md:text-lg truncate ${r.isUser ? 'text-primary' : ''}`}>
                  {r.name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-orange-600 font-bold max-w-max bg-orange-100 px-2 py-0.5 rounded">
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  {r.streak} day streak
                </div>
              </div>
              <div className="font-headline font-black text-lg md:text-xl text-stone-800 text-right">
                {r.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info msg */}
        <p className="font-body text-on-surface-variant text-center mt-6 text-sm">
           {t('leaderboard.update_info', { defaultValue: 'Leaderboard updates every 15 minutes.' })}
        </p>

      </div>
    </AppLayout>
  );
};

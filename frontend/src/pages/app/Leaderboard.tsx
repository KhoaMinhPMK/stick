import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getLeaderboard, getProgressSummary, type LeaderboardEntry } from '../../services/api/endpoints';

export const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'weekly' | 'all-time'>('weekly');
  const [ranking, setRanking] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStreak, setUserStreak] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [lbRes, sumRes] = await Promise.all([
          getLeaderboard(activeTab),
          getProgressSummary(),
        ]);
        setRanking(lbRes.items);
        setUserStreak(sumRes.currentStreak);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeTab]);

  // Get top 3 and remaining
  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  // Podium order: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;


  const podiumHeights = ['h-24 md:h-32', 'h-32 md:h-48', 'h-20 md:h-24'];
  const podiumBg = ['bg-stone-200', 'bg-[#FFF5CC]', 'bg-orange-100'];

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header Element */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => window.location.hash = '#progress'} className="p-2 hover:bg-surface-container rounded-full transition-colors hidden md:block">
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">leaderboard</span>
            <h3 className="font-headline font-bold text-xl mb-2">No data yet</h3>
            <p className="text-stone-400">Start writing journals and learning words to appear on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Podium (Top 3) */}
            {top3.length >= 3 && (
              <div className="flex justify-center items-end gap-2 md:gap-4 lg:gap-8 mb-16 px-4">
                {podiumOrder.map((entry, podiumIdx) => {
                  const actualRank = entry.rank;
                  const isGold = actualRank === 1;
                  const borderColor = actualRank === 1 ? '#FFD700' : actualRank === 2 ? '#C0C0C0' : '#CD7F32';
                  return (
                    <div key={entry.userId} className={`flex flex-col items-center flex-1 ${isGold ? 'max-w-[140px] z-10' : 'max-w-[120px]'}`}>
                      {/* Avatar with crown for #1 */}
                      <div className="relative mb-4">
                        {isGold && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10 text-2xl md:text-3xl select-none drop-shadow-md" style={{ filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.6))' }}>👑</div>
                        )}
                        <div
                          className={`${isGold ? 'w-16 h-16 md:w-24 md:h-24 border-4' : 'w-12 h-12 md:w-16 md:h-16 border-2'} rounded-full overflow-hidden relative ${isGold ? 'shadow-[0_0_20px_rgba(255,215,0,0.5)]' : ''} ${entry.isPremium ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                          style={{ borderColor }}
                        >
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-surface-container flex items-center justify-center text-xl md:text-2xl font-black text-stone-400">
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Rank badge */}
                        <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 font-black text-xs md:text-sm w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-surface"
                          style={{ backgroundColor: borderColor, color: actualRank === 1 ? '#5c4c00' : '#fff' }}
                        >
                          {actualRank}
                        </div>
                      </div>
                      <p className={`font-headline ${isGold ? 'font-black text-sm md:text-base' : 'font-bold text-xs md:text-sm'} text-center line-clamp-1 mb-1 ${entry.isUser ? 'text-primary' : ''}`}>
                        {entry.isUser ? 'You' : entry.name}
                        {entry.isPremium && <span className="ml-1 text-amber-500 text-[10px]">★</span>}
                      </p>
                      <div className={`w-full ${podiumHeights[podiumIdx]} rounded-t-xl sketch-border border-b-0 flex flex-col items-center justify-start pt-4 ${podiumBg[podiumIdx]}`}
                        style={{ borderColor: isGold ? '#FFD700' : undefined }}
                      >
                        <span className={`font-black ${isGold ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}
                          style={{ color: isGold ? '#B38F00' : undefined }}
                        >
                          {entry.score.toLocaleString()}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-stone-500 mt-1">XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rest of rankings */}
            <div className="space-y-3 px-2 md:px-0">
              {rest.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 transition-all ${
                    entry.isUser
                      ? 'border-primary bg-secondary-container shadow-[4px_4px_0_0_#000]'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-base ${
                    entry.isUser ? 'bg-black text-white' : 'bg-surface-container text-stone-600'
                  }`}>
                    {entry.rank}
                  </div>

                  {/* Avatar circle */}
                  <div className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full border-2 overflow-hidden shrink-0 ${
                    entry.isPremium ? 'border-purple-400 ring-1 ring-purple-300' : entry.isUser ? 'border-black' : 'border-stone-200'
                  }`}>
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${
                        entry.isUser ? 'bg-surface-container-highest' : 'bg-surface-container'
                      }`}>
                        {(entry.isUser ? 'Y' : entry.name.charAt(0)).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-headline font-bold text-sm md:text-base ${entry.isUser ? 'text-black' : 'text-stone-700'} truncate`}>
                      {entry.isUser ? `You${userStreak > 0 ? ` 🔥${userStreak}` : ''}` : entry.name}
                      {entry.isPremium && <span className="ml-1.5 text-amber-500 text-xs">★</span>}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="font-headline font-black text-base md:text-lg">{entry.score.toLocaleString()}</p>
                    <p className="text-[10px] md:text-xs font-bold text-stone-400 uppercase">XP</p>
                  </div>
                </div>
              ))}
            </div>

            {/* No one outside top 3 */}
            {rest.length === 0 && top3.length > 0 && (
              <div className="text-center py-10">
                <p className="text-stone-400 text-sm">Keep learning to climb the ranks!</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

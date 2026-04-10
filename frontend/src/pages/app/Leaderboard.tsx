import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getRankedLeaderboard, getRewardsSummary, type RankedBoardEntry, type RewardsSummaryResponse } from '../../services/api/endpoints';

type Scope = 'daily' | 'weekly';

const rankLabel = (rank: number) => {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
};

export const LeaderboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Scope>('weekly');
  const [ranking, setRanking] = useState<RankedBoardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<{ rank: number; rankedScore: number } | null>(null);
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [lbRes, rwRes] = await Promise.all([
          getRankedLeaderboard(activeTab),
          getRewardsSummary(),
        ]);
        setRanking(lbRes.board);
        setUserPosition(lbRes.userPosition);
        setRewardsSummary(rwRes);
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

  // Daily progress
  const dailyCaps = rewardsSummary?.caps || {};
  const dailyAgg = rewardsSummary?.daily;

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-6">
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
               onClick={() => setActiveTab('daily')}
               className={`flex-1 md:w-32 py-2 rounded-full font-headline font-bold text-sm transition-all ${
                 activeTab === 'daily' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:text-black hover:bg-black/5'
               }`}
             >
               Today
             </button>
             <button 
               onClick={() => setActiveTab('weekly')}
               className={`flex-1 md:w-32 py-2 rounded-full font-headline font-bold text-sm transition-all ${
                 activeTab === 'weekly' ? 'bg-black text-white shadow-md' : 'text-stone-600 hover:text-black hover:bg-black/5'
               }`}
             >
               This Week
             </button>
          </div>
        </div>

        {/* User's rank bar — simple, friendly */}
        {userPosition && (
          <div className="flex items-center gap-4 px-5 py-4 bg-primary-container/20 border-2 border-primary rounded-2xl mb-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-base">
              #{userPosition.rank}
            </div>
            <div className="flex-1">
              <p className="font-headline font-bold text-base">
                You're <span className="text-primary">{rankLabel(userPosition.rank)}</span> {activeTab === 'daily' ? 'today' : 'this week'}!
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {userPosition.rankedScore.toLocaleString()} điểm xếp hạng {activeTab === 'daily' ? 'hôm nay' : 'tuần này'}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl">emoji_events</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : ranking.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4 block">leaderboard</span>
            <h3 className="font-headline font-bold text-xl mb-2">Chưa có ai trên bảng</h3>
            <p className="text-stone-400">Viết journal, học bài và làm quiz để xuất hiện trên bảng xếp hạng!</p>
          </div>
        ) : (
          <>
            {/* Podium (Top 3) */}
            {top3.length >= 3 && (
              <div className="flex justify-center items-end gap-2 md:gap-4 lg:gap-8 mb-16 px-4 pt-16">
                {podiumOrder.map((entry, podiumIdx) => {
                  const actualRank = entry.rank;
                  const isGold = actualRank === 1;
                  const borderColor = actualRank === 1 ? '#FFD700' : actualRank === 2 ? '#C0C0C0' : '#CD7F32';
                  return (
                    <div key={entry.userId} className={`flex flex-col items-center flex-1 ${isGold ? 'max-w-[140px] z-10' : 'max-w-[120px]'}`}>
                      {/* Avatar with crown for #1 */}
                      <div className="relative mb-4">
                        {isGold && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 select-none" style={{ filter: 'drop-shadow(0 2px 6px rgba(184,134,11,0.8))' }}>
                            <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 22L4 8L12 16L20 3L28 16L36 8L36 22Z" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
                              <rect x="4" y="21" width="32" height="6" rx="1.5" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
                              <circle cx="20" cy="3" r="2.5" fill="#FF4D4D" stroke="#B8860B" strokeWidth="1"/>
                              <circle cx="4" cy="8" r="2" fill="#60A5FA" stroke="#B8860B" strokeWidth="1"/>
                              <circle cx="36" cy="8" r="2" fill="#60A5FA" stroke="#B8860B" strokeWidth="1"/>
                              <circle cx="12" cy="23.5" r="1.5" fill="#B8860B"/>
                              <circle cx="20" cy="23.5" r="1.5" fill="#B8860B"/>
                              <circle cx="28" cy="23.5" r="1.5" fill="#B8860B"/>
                            </svg>
                          </div>
                        )}
                        <div
                          className={`${isGold ? 'w-16 h-16 md:w-24 md:h-24 border-4' : 'w-12 h-12 md:w-16 md:h-16 border-2'} rounded-full overflow-hidden relative ${isGold ? 'shadow-[0_0_20px_rgba(255,215,0,0.5)]' : ''}`}
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
                        {entry.isPremium && <span className="material-symbols-outlined text-[11px] text-amber-500 ml-0.5 align-middle" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>}
                      </p>
                      <div className={`w-full ${podiumHeights[podiumIdx]} rounded-t-xl sketch-border border-b-0 flex flex-col items-center justify-start pt-4 ${podiumBg[podiumIdx]}`}
                        style={{ borderColor: isGold ? '#FFD700' : undefined }}
                      >
                        <span className={`font-black ${isGold ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}
                          style={{ color: isGold ? '#B38F00' : undefined }}
                        >
                          {entry.rankedScore.toLocaleString()}
                        </span>
                        <span className="text-[10px] md:text-xs font-bold text-stone-500 mt-1">XP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Top 3 daily reward note */}
            {top3.length >= 3 && activeTab === 'daily' && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl mb-6 border border-purple-200">
                <span className="material-symbols-outlined text-[16px] text-purple-500">card_giftcard</span>
                <span className="text-xs text-purple-800 font-headline">
                  Top 3 mỗi ngày được tặng <strong>Premium Day Pass</strong> miễn phí!
                </span>
              </div>
            )}

            {/* Rest of rankings — simple list */}
            <div className="space-y-2 px-2 md:px-0">
              {rest.map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 p-3 md:p-4 rounded-2xl border-2 transition-all ${
                    entry.isUser
                      ? 'border-primary bg-primary-container/10 shadow-[3px_3px_0_0_#000]'
                      : entry.isPremium
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {/* Rank number */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    entry.isUser ? 'bg-primary text-white' : 'bg-surface-container text-stone-500'
                  }`}>
                    {entry.rank}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shrink-0 ${
                    entry.isUser ? 'border-primary' : 'border-stone-200'
                  }`}>
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-base font-bold ${
                        entry.isUser ? 'bg-primary-container' : 'bg-surface-container'
                      }`}>
                        {(entry.isUser ? 'Y' : entry.name.charAt(0)).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className={`font-headline font-bold text-sm ${entry.isUser ? 'text-black' : 'text-stone-700'} truncate`}>
                      {entry.isUser ? 'You' : entry.name}
                    </p>
                    {entry.isPremium && (
                      <span className="material-symbols-outlined text-[13px] text-amber-500 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    )}
                  </div>

                  {/* XP score — simple */}
                  <div className="text-right">
                    <p className="font-headline font-black text-base">{entry.rankedScore.toLocaleString()} <span className="text-xs font-bold text-stone-400">XP</span></p>
                  </div>
                </div>
              ))}
            </div>

            {/* No one outside top 3 */}
            {rest.length === 0 && top3.length > 0 && (
              <div className="text-center py-10">
                <p className="text-stone-400 text-sm">Hãy tiếp tục học để leo bảng xếp hạng!</p>
              </div>
            )}
          </>
        )}

        {/* Daily progress — only when on daily tab and has data */}
        {dailyAgg && activeTab === 'daily' && (
          <div className="mt-8 border-2 border-stone-200 rounded-2xl p-5">
            <h3 className="font-headline font-bold text-sm mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              XP hôm nay
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Journal', icon: 'edit_note', used: dailyAgg.journalXp, cap: dailyCaps.xp_journal_daily_cap || 15 },
                { label: 'Lesson', icon: 'school', used: dailyAgg.lessonXp, cap: dailyCaps.xp_lesson_daily_cap || 40 },
                { label: 'Review', icon: 'quiz', used: dailyAgg.reviewXp, cap: dailyCaps.xp_review_daily_cap || 25 },
                { label: 'Practice', icon: 'fitness_center', used: dailyAgg.practiceXp, cap: dailyCaps.xp_practice_daily_cap || 20 },
              ].map(b => {
                const pct = Math.min(100, b.cap > 0 ? (b.used / b.cap) * 100 : 0);
                return (
                  <div key={b.label}>
                    <div className="flex items-center gap-1 text-xs mb-1.5">
                      <span className="material-symbols-outlined text-[14px] text-stone-400">{b.icon}</span>
                      <span className="font-headline font-bold">{b.label}</span>
                      <span className="ml-auto text-stone-400">{b.used}/{b.cap}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between items-center text-sm pt-3 border-t border-stone-100">
              <span className="font-headline font-bold">Tổng XP hôm nay</span>
              <span className="font-black text-lg">{dailyAgg.xpEarned} <span className="text-xs text-stone-400 font-bold">XP</span></span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
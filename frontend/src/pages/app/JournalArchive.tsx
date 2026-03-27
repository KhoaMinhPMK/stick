import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const JournalArchivePage: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'high-score' | 'bookmarked'>('all');
  const [search, setSearch] = useState('');

  const archive = [
    { title: "The Coffee Shop Phenomenon", date: "Oct 12, 2026", score: 92, preview: "Sitting in a bustling cafe, I realized how much of communication is non-verbal...", isBookmarked: true },
    { title: "Review of \"Atomic Habits\"", date: "Oct 10, 2026", score: 85, preview: "The core thesis that small changes compound over time is incredibly applicable to...", isBookmarked: false },
    { title: "Why I started learning English", date: "Oct 5, 2026", score: 78, preview: "It wasn't just about passing an exam. It was about accessing a world of information...", isBookmarked: false },
    { title: "A letter to my future self", date: "Sep 28, 2026", score: 95, preview: "Dear future me, I hope you have finally mastered the present perfect tense...", isBookmarked: true },
    { title: "The paradox of choice in modern dating", date: "Sep 20, 2026", score: 88, preview: "With endless apps and options, one might think finding a partner would be easier...", isBookmarked: false },
  ];

  return (
    <AppLayout activePath="#history">
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header Element */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
             <button onClick={() => window.history.back()} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-4 group md:hidden">
               <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
               <span className="font-headline font-bold text-sm">Back to History</span>
             </button>
             <h1 className="font-headline font-black text-3xl md:text-5xl tracking-tighter mb-2">
               {t('archive.title', { defaultValue: 'Journal Archive' })}
             </h1>
             <p className="text-on-surface-variant font-body">
               {t('archive.subtitle', { defaultValue: 'Explore your past thoughts and progress.' })}
             </p>
           </div>
           
           <div className="flex items-center gap-3">
             <div className="bg-surface-container rounded-full flex items-center px-4 py-2 border-2 border-black max-w-xs focus-within:ring-2 focus-within:ring-primary w-full md:w-auto">
                <span className="material-symbols-outlined text-stone-500 mr-2">search</span>
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('archive.search', { defaultValue: 'Search entries...' })}
                  className="bg-transparent border-none outline-none font-body w-full focus:ring-0 p-0 text-sm md:text-base"
                />
             </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-2 rounded-full font-headline font-bold text-sm transition-all sketch-border ${
               filter === 'all' ? 'bg-black text-white' : 'bg-surface-container hover:bg-black/5'
             }`}
           >
             All Entries
           </button>
           <button 
             onClick={() => setFilter('high-score')}
             className={`px-4 py-2 rounded-full font-headline font-bold text-sm transition-all sketch-border flex items-center gap-1 ${
               filter === 'high-score' ? 'bg-[#FFF5CC] text-[#B38F00] border-[#FFD700]' : 'bg-surface-container hover:bg-black/5'
             }`}
           >
             <span className="material-symbols-outlined text-[16px]">military_tech</span>
             High Score
           </button>
           <button 
             onClick={() => setFilter('bookmarked')}
             className={`px-4 py-2 rounded-full font-headline font-bold text-sm transition-all sketch-border flex items-center gap-1 ${
               filter === 'bookmarked' ? 'bg-primary text-white border-primary' : 'bg-surface-container hover:bg-black/5'
             }`}
           >
             <span className="material-symbols-outlined text-[16px]">bookmark</span>
             Pinned
           </button>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {archive.map((item, idx) => (
             <div key={idx} className="sketch-card bg-surface-container-lowest flex flex-col transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000] cursor-pointer group" onClick={() => window.location.hash = '#history-detail'}>
                {/* Score & Actions */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                   <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center sketch-border text-center ${item.score >= 90 ? 'bg-primary text-white' : 'bg-surface-container text-black'}`}>
                      <span className="font-headline font-black leading-none">{item.score}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      {item.isBookmarked && <span className="material-symbols-outlined text-primary text-xl">bookmark</span>}
                      <button className="text-on-surface-variant hover:text-black opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                   </div>
                </div>

                {/* Content */}
                <div className="px-5 pb-6 flex-1 flex flex-col">
                   <h3 className="font-headline font-black text-xl mb-2 line-clamp-2">{item.title}</h3>
                   <p className="font-body text-stone-600 text-sm line-clamp-3 mb-4 flex-1">{item.preview}</p>
                   <p className="font-headline text-xs font-bold text-stone-400 uppercase tracking-widest">{item.date}</p>
                </div>
             </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
};

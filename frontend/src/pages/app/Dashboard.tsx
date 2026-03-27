import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'this_week' | 'last_week'>('this_week');
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <AppLayout activePath="#app">
      {/* Hero Section */}
      <section className="mb-8 md:mb-10">
        <div className="bg-surface-container-highest sketch-border-card p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-6 relative overflow-hidden">
          <div className="flex-1 space-y-4 md:space-y-5 z-10 w-full text-center md:text-left">
            <h3 className="font-headline text-3xl md:text-4xl font-black text-black leading-tight">
              {t('dashboard.hero_title')}<br />
              <span className="inline-block bg-secondary-container px-3 md:px-3 py-1 mt-2 transform -rotate-1 text-xl md:text-xl sketch-border">
                {t('dashboard.day')} 12
              </span>
            </h3>
            <p className="text-base md:text-lg text-on-surface-variant md:max-w-lg mx-auto md:mx-0">
              {t('dashboard.hero_subtitle')}
            </p>
            <button onClick={() => (window.location.hash = '#journal')} className="sketch-border w-full md:w-auto bg-black text-white px-6 md:px-6 py-3 md:py-3.5 font-headline text-lg md:text-lg font-bold flex items-center justify-center gap-3 hover:bg-stone-800 transition-all active:scale-95 group">
              {t('dashboard.start_task')}
              <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform" data-icon="arrow_forward">arrow_forward</span>
            </button>
          </div>
          <div className="w-full md:w-1/3 flex justify-center items-center z-10 mt-6 md:mt-0">
            {/* Analog Style Illustration Placeholder */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 border-[3px] md:border-[4px] border-black rounded-full bg-white overflow-hidden flex items-center justify-center sketch-card">
              <span className="material-symbols-outlined text-7xl md:text-8xl text-black" data-icon="drawing">draw</span>
              {/* Hand drawn aesthetic overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCElOoqHfZQe11eOJKj1tljX4VACf1Qb2u5zEyeI6f1jtM-KitTVPVqLJXqCQ-cH0S00yApFASSFqnw9O6F1Hcvp_7UeduwX8TvRVb8Mtlqvzq3hVUX55Sf969i2N49V3OkPGCDLOMfQBrG0cFrnhWrGLMgvWMEiqevmikorJk6WTGbd44UBCD5SACH3Py6qG5u81otzHJxd0J6EKdLTMfzKods0xnKuhpWEjw8z9cY4JhVJJtqWe6p7YkdRM5m3BDFCEXAYmK9YGQG')" }}></div>
            </div>
          </div>
          {/* Decorative background stick figure (abstract) */}
          <div className="absolute bottom-[-10px] md:bottom-[-20px] right-[-10px] md:right-[-20px] opacity-5 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[10rem] md:text-[20rem]" data-icon="accessibility_new">accessibility_new</span>
          </div>
        </div>
      </section>

      {/* Dashboard Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
        
        {/* Last Entry Card (L-Shaped/Wide) */}
        <div onClick={() => (window.location.hash = '#history-detail')} className="md:col-span-8 bg-surface-container sketch-border-card p-5 md:p-6 hover:bg-surface-container-high transition-colors cursor-pointer active:scale-[0.99]">
          <div className="flex justify-between items-start mb-4 md:mb-5">
            <h4 className="font-headline text-lg md:text-xl font-bold">{t('dashboard.last_entry')}</h4>
            <span className="text-on-surface-variant font-label text-xs md:text-sm">{t('dashboard.yesterday')}</span>
          </div>
          <p className="text-base md:text-base leading-relaxed italic text-on-surface mb-5 md:mb-6 border-l-[3px] md:border-l-[3px] border-black pl-4 md:pl-5">
            "I spent the morning walking through the park. The crisp air felt revitalizing. I'm trying to find better ways to describe the texture of the leaves under my boots..."
          </p>
          <div className="flex gap-2 md:gap-3 flex-wrap">
            <span className="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border-2 border-black sketch-card">#Nature</span>
            <span className="bg-surface-container-highest px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border-2 border-black sketch-card">#Reflective</span>
          </div>
        </div>

        {/* Words to Review Card */}
        <div onClick={() => (window.location.hash = '#vocab-review')} className="md:col-span-4 bg-[#c2d4b6] sketch-border-card p-5 md:p-6 text-black flex flex-col justify-center items-center text-center gap-3 md:gap-3 group cursor-pointer transition-transform hover:rotate-1 active:scale-95">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white border-[3px] border-black rounded-full flex items-center justify-center mb-1 md:mb-1 sketch-card">
            <span className="material-symbols-outlined text-black text-2xl md:text-2xl" data-icon="book_5">book_5</span>
          </div>
          <h4 className="font-headline text-3xl md:text-4xl font-black">24</h4>
          <p className="font-headline text-base md:text-base font-bold">{t('dashboard.words_to_review')}</p>
          <p className="text-xs md:text-sm opacity-90">{t('dashboard.review_hint')}</p>
        </div>

        {/* Speaking Practice Card */}
        <div className="md:col-span-5 bg-white sketch-border-card p-5 md:p-6 flex flex-col justify-between min-h-[200px]">
          <div>
            <h4 className="font-headline text-lg md:text-xl font-bold mb-1 md:mb-1">{t('dashboard.speaking_practice')}</h4>
            <p className="text-xs md:text-sm text-on-surface-variant">{t('dashboard.recommended_time')}</p>
          </div>
          <div className="my-5 md:my-6 flex items-center gap-3 md:gap-4">
            <div className="flex-1 h-3 md:h-3.5 bg-surface-container rounded-full border-2 border-black overflow-hidden relative sketch-card">
              <div className="absolute top-0 left-0 h-full bg-secondary-container w-[65%] border-r-2 border-black"></div>
            </div>
            <span className="font-bold text-base md:text-base font-headline">65%</span>
          </div>
          <button onClick={() => (window.location.hash = '#speaking-intro')} className="w-full border-2 border-black py-2 md:py-2.5 rounded-xl font-headline font-bold hover:bg-secondary-container transition-colors sketch-border-subtle active:scale-95 text-sm md:text-base">
            {t('dashboard.continue_practice')}
          </button>
        </div>

        {/* Progress Mini-Chart */}
        <div className="md:col-span-7 bg-surface-container sketch-border-card p-5 md:p-6">
          <div className="flex justify-between items-center mb-5 md:mb-6">
            <h4 className="font-headline text-lg md:text-xl font-bold">{t('dashboard.progress')}</h4>
            <div ref={periodRef} className="relative">
              <button
                onClick={() => setPeriodOpen(!periodOpen)}
                className="flex items-center gap-1 px-3 py-1.5 border-2 border-black rounded-full font-headline font-bold text-xs md:text-sm hover:bg-secondary-container transition-colors active:scale-95"
              >
                {t(`dashboard.${selectedPeriod}`)}
                <span className={`material-symbols-outlined text-sm transition-transform ${periodOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>
              {periodOpen && (
                <div className="absolute right-0 top-full mt-2 bg-surface-container-lowest border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] overflow-hidden z-20 min-w-[140px]">
                  {(['this_week', 'last_week'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => { setSelectedPeriod(p); setPeriodOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 font-headline font-bold text-xs md:text-sm transition-colors flex items-center justify-between gap-3 ${
                        selectedPeriod === p ? 'bg-secondary-container' : 'hover:bg-surface-container'
                      }`}
                    >
                      {t(`dashboard.${p}`)}
                      {selectedPeriod === p && <span className="material-symbols-outlined text-xs">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Mock Sketch Chart */}
          <div className="relative h-28 md:h-40 w-full flex items-end justify-between px-2 md:px-4">
            {/* Horizontal lines */}
            <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between opacity-10 pointer-events-none">
              <div className="border-b-2 border-black w-full"></div>
              <div className="border-b-2 border-black w-full"></div>
              <div className="border-b-2 border-black w-full"></div>
            </div>
            
            {/* Chart Bars */}
            {[
              { d: 'dashboard.mon', h: 'h-14 md:h-20', c: 'bg-black' },
              { d: 'dashboard.tue', h: 'h-20 md:h-28', c: 'bg-secondary-container' },
              { d: 'dashboard.wed', h: 'h-10 md:h-16', c: 'bg-black' },
              { d: 'dashboard.thu', h: 'h-28 md:h-36', c: 'bg-secondary-container' },
              { d: 'dashboard.fri', h: 'h-16 md:h-24', c: 'bg-black' },
              { d: 'dashboard.sat', h: 'h-8 md:h-12', c: 'bg-secondary-container' },
              { d: 'dashboard.sun', h: 'h-6 md:h-8', c: 'bg-black' },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-1 md:gap-1.5 group z-10 w-full">
                <div className={`w-3 sm:w-5 md:w-8 ${bar.c} border-2 border-black ${bar.h} rounded-t-lg transition-all group-hover:scale-y-110 origin-bottom sketch-border-subtle`}></div>
                <span className="text-[10px] md:text-xs font-bold font-label">{t(bar.d)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Task Suggestions (Horizontal Flow) */}
      <section className="mt-10 md:mt-12">
        <h5 className="font-headline text-lg md:text-xl font-black mb-5 md:mb-6">{t('dashboard.suggested_for_you')}</h5>
        {/* Hide scrollbar with utility classes */}
        <div className="flex gap-4 md:gap-6 justify-start md:justify-start lg:justify-between overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
           <style suppressHydrationWarning>{`
             div::-webkit-scrollbar { display: none; }
           `}</style>
          
          <div onClick={() => (window.location.hash = '#library')} className="min-w-[240px] md:min-w-[260px] bg-surface-container-low border-[3px] border-black rounded-[20px] p-5 md:p-5 hover:-translate-y-2 transition-transform cursor-pointer group snap-start sketch-card flex-1 active:scale-95">
            <span className="material-symbols-outlined text-3xl md:text-3xl mb-3 md:mb-3 text-black" data-icon="auto_stories">auto_stories</span>
            <h6 className="font-headline font-bold text-base md:text-lg mb-1 md:mb-1.5">{t('dashboard.reading_story')}</h6>
            <p className="text-xs md:text-sm text-on-surface-variant">"The Midnight Library" - Chapter 1 recap and analysis.</p>
          </div>
          
          <div onClick={() => (window.location.hash = '#speaking-intro')} className="min-w-[240px] md:min-w-[260px] bg-surface-container-low border-[3px] border-black rounded-[20px] p-5 md:p-5 hover:-translate-y-2 transition-transform cursor-pointer group snap-start sketch-card flex-1 active:scale-95">
            <span className="material-symbols-outlined text-3xl md:text-3xl mb-3 md:mb-3 text-black" data-icon="record_voice_over">record_voice_over</span>
            <h6 className="font-headline font-bold text-base md:text-lg mb-1 md:mb-1.5">{t('dashboard.listen_repeat')}</h6>
            <p className="text-xs md:text-sm text-on-surface-variant">Focusing on vowel sounds in everyday conversation.</p>
          </div>
          
          <div onClick={() => (window.location.hash = '#library')} className="min-w-[240px] md:min-w-[260px] bg-surface-container-low border-[3px] border-black rounded-[20px] p-5 md:p-5 hover:-translate-y-2 transition-transform cursor-pointer group snap-start sketch-card flex-1 active:scale-95">
            <span className="material-symbols-outlined text-3xl md:text-3xl mb-3 md:mb-3 text-black" data-icon="psychology">psychology</span>
            <h6 className="font-headline font-bold text-base md:text-lg mb-1 md:mb-1.5">{t('dashboard.grammar_quiz')}</h6>
            <p className="text-xs md:text-sm text-on-surface-variant">Mastering the present perfect continuous tense.</p>
          </div>
        </div>
      </section>

      {/* Floating Action Button (FAB) - Contextual to Home */}
      <button onClick={() => (window.location.hash = '#journal-workspace')} className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-black text-white rounded-full flex items-center justify-center shadow-xl border-[3px] md:border-4 border-white hover:scale-110 active:scale-95 transition-all z-50 sketch-border-subtle">
        <span className="material-symbols-outlined text-2xl md:text-3xl" data-icon="add">add</span>
      </button>

    </AppLayout>
  );
};

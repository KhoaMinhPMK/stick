import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const JournalPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppLayout activePath="#journal">
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-4 md:py-8">
        <div className="max-w-[1200px] w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
          
          {/* Central Task Card */}
          <div className="md:col-span-8 bg-surface-container-lowest sketch-border-heavy p-6 md:p-10 relative">
            {/* Decorative Element: Tape Effect */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 md:w-32 h-6 md:h-8 bg-secondary-container/60 border-x-2 border-black/20 rotate-1 z-10"></div>
            
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-1 md:space-y-2 text-center md:text-left">
                <span className="font-headline font-bold text-tertiary uppercase tracking-widest text-xs md:text-sm">
                  {t('journal.session_intro')}
                </span>
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-black wobble-heading leading-tight mx-auto md:mx-0 max-w-[90%] md:max-w-none">
                  {t('journal.day_title', { day: 12 })}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-on-surface-variant font-medium text-sm md:text-base mt-2">
                  <span className="material-symbols-outlined text-base md:text-lg">schedule</span>
                  <span>{t('journal.estimated_time')}</span>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6 py-4 md:py-6">
                <h3 className="font-headline font-bold text-lg md:text-xl text-center md:text-left">
                  {t('journal.journey_today')}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {[
                    t('journal.task_1'),
                    t('journal.task_2'),
                    t('journal.task_3'),
                  ].map((task, index) => (
                    <div key={index} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-surface-container-low rounded-xl border-2 border-black/5 hover:border-black/20 transition-colors">
                      <span className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 flex items-center justify-center bg-black text-white rounded-full font-bold text-sm md:text-base">
                        {index + 1}
                      </span>
                      <span className="text-sm md:text-base font-medium">{task}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-surface-container-low rounded-xl border-2 border-black/5 opacity-50">
                    <span className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0 flex items-center justify-center bg-black text-white rounded-full font-bold text-sm md:text-base">
                      4
                    </span>
                    <span className="text-sm md:text-base font-medium">{t('journal.task_4')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 md:pt-4">
                <button 
                  onClick={() => { window.location.hash = '#journal-workspace'; }}
                  className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-secondary-container hover:bg-on-secondary-fixed-variant hover:text-white transition-all duration-300 font-headline font-black text-lg md:text-xl sketch-border flex items-center justify-center gap-3 md:gap-4 group active:scale-95 mx-auto md:mx-0"
                >
                  {t('journal.begin_activity')}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Illustration Area */}
          <div className="md:col-span-4 flex flex-col items-center text-center space-y-6 md:space-y-8 mt-6 md:mt-0 pb-16 md:pb-0">
            <div className="relative w-full flex items-center justify-center">
              {/* Placeholder for Stick Figure Coach Illustration */}
              <div className="w-48 h-48 md:w-56 md:h-56 relative">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuACRj6ZUDspKqGFtYr0gxXtzZjyYV0OhHDyq2omcjUh-bGKTXPHW3GbmxPpDjH27NMZ2IajOW29jdLeZtqf5MnIEEmFHOZ49nJ-yOhC1BQBZDbAsjCgtR3TNw7boYU2bX5au17qpz447wZm5K6SNrwN7pqzWFXYtz6q3PkOHeuCDKpWVEF74wCDxkJ36Iha0IC9BybfzKglSvjqPDKGeRQfp-YAM99AP1KqdU3hIlp5eVAWq33vWq3vzGd1-oeR7565MO9EHBIi0Bdz" 
                  alt="Coach Illustration" 
                  className="w-full h-full grayscale opacity-80 object-contain drop-shadow-md"
                />
                {/* Speech Bubble */}
                <div className="absolute -top-4 -right-4 md:-right-8 bg-white p-3 md:p-4 sketch-border rotate-3 shadow-sm max-w-[140px] md:max-w-[180px] z-10">
                  <p className="text-xs md:text-sm font-bold border-l-2 pl-2 border-black">
                    "{t('journal.coach_quote')}"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-1 md:space-y-2 max-w-[280px]">
              <p className="text-on-surface-variant italic font-medium text-sm md:text-base">
                "{t('journal.author_quote')}"
              </p>
              <p className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-stone-500">
                — Mark Twain
              </p>
            </div>
            
            <div className="w-full max-w-sm p-4 md:p-5 bg-tertiary-container/10 border-2 border-dashed border-tertiary rounded-xl sketch-card">
              <p className="text-xs md:text-sm text-tertiary font-bold text-left">
                <span className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[1rem]">lightbulb</span> Tip
                </span>
                {t('journal.tip')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

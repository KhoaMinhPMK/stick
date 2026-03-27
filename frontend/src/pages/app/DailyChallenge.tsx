import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const DailyChallengePage: React.FC = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-center flex-1">
             <h1 className="font-headline font-black text-2xl uppercase tracking-widest text-primary mb-1">Daily Challenge</h1>
             <p className="font-body text-sm font-bold text-on-surface-variant">Day 42 • Oct 14, 2026</p>
          </div>
          <button onClick={handleShare} className="p-2 hover:bg-surface-container rounded-full transition-colors relative">
            <span className="material-symbols-outlined">ios_share</span>
            {copied && <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded font-bold whitespace-nowrap animate-fade-in-up">Copied!</span>}
          </button>
        </div>

        {/* Challenge Card */}
        <div className="sketch-card bg-secondary-container p-8 md:p-12 mb-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">extension</span>
           </div>
           
           <div className="flex flex-col items-center justify-center text-center relative z-10">
             <div className="inline-block px-4 py-1.5 border-2 border-black rounded-full font-headline font-bold text-xs uppercase tracking-widest mb-6 bg-white">
               Idiom of the Day
             </div>
             
             <h2 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tighter text-black">
               Bite the bullet
             </h2>
             
             <p className="font-body text-lg md:text-xl text-stone-800 mb-8 max-w-lg mx-auto">
               To decide to do something difficult or unpleasant that one has been putting off or hesitating over.
             </p>
             
             <div className="w-full h-px bg-black/20 mb-8"></div>
             
             <h3 className="font-headline font-bold text-sm tracking-widest uppercase mb-4 text-stone-600">Your Task</h3>
             <p className="font-body font-medium text-lg text-black bg-white/50 sketch-border border-dashed p-4 rounded-xl">
               Write a short journal entry (min 50 words) describing a time you had to "bite the bullet". What was the situation and what did you learn?
             </p>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          <button onClick={() => window.location.hash = '#journal'} className="w-full sketch-border bg-black text-white px-6 py-5 rounded-2xl font-headline font-black text-xl flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#96753f]">
             <span className="material-symbols-outlined">edit_document</span>
             {t('challenge.start_writing', { defaultValue: 'Start Journal Entry' })}
          </button>
          
          <button onClick={() => window.location.hash = '#library'} className="w-full sketch-border bg-surface-container-lowest px-6 py-4 rounded-2xl font-headline font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-surface-container">
             <span className="material-symbols-outlined">menu_book</span>
             {t('challenge.study_idioms', { defaultValue: 'Study more idioms' })}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

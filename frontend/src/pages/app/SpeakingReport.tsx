import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const SpeakingReportPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppLayout activePath="#library">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-headline font-bold">{t('speaking.back', { defaultValue: 'Back to Library' })}</span>
          </button>
          <div className="bg-primary text-white font-headline font-black px-4 py-1.5 rounded-full text-sm uppercase tracking-widest sketch-border shadow-[2px_2px_0_0_#000]">
            AI Analysis
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-headline font-black text-4xl md:text-5xl mb-3 tracking-tighter">Pronunciation Report</h1>
          <p className="text-on-surface-variant font-body md:text-lg">Daily Read Aloud • Oct 14, 2026</p>
        </div>

        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center mb-12 relative">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-container" />
            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="502" strokeDashoffset={502 - (502 * 82) / 100} className="text-primary transition-all duration-1000" strokeLinecap="round" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-headline font-black text-6xl text-primary">82</span>
            <span className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant">Overall</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
           <div className="sketch-card p-4 text-center bg-surface-container-lowest">
             <span className="material-symbols-outlined text-3xl mb-2 text-orange-500">record_voice_over</span>
             <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Fluency</h4>
             <p className="font-black text-2xl">85</p>
           </div>
           <div className="sketch-card p-4 text-center bg-surface-container-lowest">
             <span className="material-symbols-outlined text-3xl mb-2 text-blue-500">graphic_eq</span>
             <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Intonation</h4>
             <p className="font-black text-2xl">78</p>
           </div>
           <div className="sketch-card p-4 text-center bg-surface-container-lowest">
             <span className="material-symbols-outlined text-3xl mb-2 text-green-500">spatial_audio</span>
             <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Clarity</h4>
             <p className="font-black text-2xl">88</p>
           </div>
           <div className="sketch-card p-4 text-center bg-surface-container-lowest">
             <span className="material-symbols-outlined text-3xl mb-2 text-purple-500">speed</span>
             <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Pacing</h4>
             <p className="font-black text-2xl">76</p>
           </div>
        </div>

        <h3 className="font-headline font-black text-2xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">feedback</span>
          Detailed Feedback
        </h3>

        {/* Feedback List */}
        <div className="space-y-4 mb-12">
          <div className="sketch-card bg-error/10 border-error p-5">
             <div className="flex items-start gap-4">
               <span className="material-symbols-outlined text-error mt-0.5">warning</span>
               <div>
                  <h4 className="font-headline font-bold text-error text-lg mb-1">Stressed Syllables</h4>
                  <p className="font-body text-stone-800">You pronounced "development" as DE-ve-lop-ment. The stress should be on the second syllable: de-VEL-op-ment.</p>
               </div>
             </div>
          </div>
          <div className="sketch-card bg-surface-container p-5">
             <div className="flex items-start gap-4">
               <span className="material-symbols-outlined text-warning mt-0.5">lightbulb</span>
               <div>
                  <h4 className="font-headline font-bold text-stone-800 text-lg mb-1">Linking Words</h4>
                  <p className="font-body text-stone-600">Try linking words ending in consonants to words starting with vowels, like "an apple" sounding like "a napple". It improves fluency.</p>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => window.history.back()} className="flex-1 sketch-border bg-surface-container-highest hover:bg-surface-container-lowest py-4 font-headline font-bold text-lg transition-colors text-center">
             {t('speaking.done', { defaultValue: 'Done Reviewing' })}
           </button>
           <button className="flex-1 sketch-border bg-black text-white hover:bg-stone-800 py-4 font-headline font-bold text-lg transition-colors flex items-center justify-center gap-2">
             <span className="material-symbols-outlined">mic</span>
             {t('speaking.retry', { defaultValue: 'Retry Exercise' })}
           </button>
        </div>

      </div>
    </AppLayout>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const ListeningPracticePage: React.FC = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);

  const words = [
    { text: "When", hidden: false },
    { text: "you", hidden: false },
    { text: "start", hidden: false },
    { text: "a", hidden: false },
    { text: "new", hidden: false },
    { text: "habit", hidden: true },
    { text: ",", hidden: false },
    { text: "consistency", hidden: true },
    { text: "is", hidden: false },
    { text: "key", hidden: false },
    { text: ".", hidden: false },
  ];

  return (
    <AppLayout activePath="#library">
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="text-on-surface-variant hover:text-black transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">headphones</span>
            <span className="font-headline font-bold text-sm tracking-widest uppercase text-primary">Listening</span>
          </div>
        </div>

        <div className="sketch-card bg-surface-container-lowest p-8 flex flex-col items-center justify-center min-h-[250px] mb-8 relative">
          {/* Audio Visualization Mock */}
          <div className="flex items-center justify-center gap-1 h-16 w-full max-w-xs mb-8">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div 
                key={i} 
                className={`w-2 bg-on-surface-variant rounded-full origin-bottom animate-pulse`} 
                style={{ 
                  height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s'
                }}
              />
            ))}
          </div>

          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
              isPlaying ? 'bg-primary text-white border-4 border-primary/20 sketch-border shadow-[4px_4px_0_0_#96753f]' : 'bg-secondary-container border-4 border-black sketch-border shadow-[4px_4px_0_0_#000]'
            }`}
          >
            <span className={`material-symbols-outlined text-4xl ml-${isPlaying ? '0' : '1'}`}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          
          <p className="mt-4 font-body text-sm text-on-surface-variant">{t('listening.instruction', { defaultValue: 'Listen and fill in the missing words' })}</p>
        </div>

        {/* Fill in the blanks section */}
        <div className="mb-12 sketch-card border-none bg-secondary-container/20 p-6 md:p-8">
          <p className="font-headline text-2xl md:text-3xl leading-[2.5] tracking-wide text-center">
            {words.map((w, i) => (
              <React.Fragment key={i}>
                {w.hidden ? (
                  <span 
                    onClick={() => setSelectedWord(i)}
                    className={`inline-block border-b-[3px] border-black border-dashed min-w-[80px] text-center mx-1 cursor-pointer hover:bg-black/5 transition-colors pb-1 ${
                      selectedWord === i ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    {selectedWord === i ? <span className="text-black font-black animate-pulse">_</span> : '\u00A0'}
                  </span>
                ) : (
                  <span className="font-medium text-stone-800">{w.text}</span>
                )}
                {' '}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="flex justify-center mb-24">
           <button 
             onClick={() => setShowTranscript(!showTranscript)}
             className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-xs tracking-widest"
           >
             <span className="material-symbols-outlined text-lg">{showTranscript ? 'visibility_off' : 'visibility'}</span>
             {showTranscript ? t('listening.hide_transcript', { defaultValue: 'Hide Transcript' }) : t('listening.show_transcript', { defaultValue: 'Show Transcript' })}
           </button>
        </div>

        {/* Bottom Bar Input Mock */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-black p-4 z-40 transform translate-y-0 transition-transform">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
             <input 
               type="text"
               disabled={selectedWord === null}
               placeholder={selectedWord !== null ? t('listening.type_word', { defaultValue: 'Type what you hear...' }) : t('listening.select_blank', { defaultValue: 'Select a blank to type' })}
               className="flex-1 sketch-input bg-surface-container-lowest p-4 font-headline text-lg disabled:opacity-50"
             />
             <button disabled={selectedWord === null} className="w-14 h-14 bg-black text-white flex items-center justify-center rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors">
                <span className="material-symbols-outlined">send</span>
             </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const ReadingModePage: React.FC = () => {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<number>(18);
  const [selectedWord, setSelectedWord] = useState<{word: string, meaning: string} | null>(null);

  const articleText = "Learning a new language is often compared to discovering a new way of seeing the world. It is not merely about memorizing vocabulary or mastering grammar rules; it is about absorbing the culture, idioms, and unique expressions that define a group of people. When you immerse yourself completely, you begin to think differently.";
  
  const words = articleText.split(' ');

  const handleWordClick = (word: string) => {
    // Mock dictionary lookup
    const cleanWord = word.replace(/[.,;]/g, '').toLowerCase();
    
    const mockDict: Record<string, string> = {
      'immerse': 'to involve oneself deeply in a particular activity or interest.',
      'merely': 'just; only.',
      'absorbing': 'taking in or soaking up (energy, or a liquid or other substance) by chemical or physical action.',
      'idioms': 'a group of words established by usage as having a meaning not deducible from those of the individual words.'
    };

    setSelectedWord({
      word: cleanWord,
      meaning: mockDict[cleanWord] || 'Meaning not found in mock dictionary. Try common words like immerse, merely.'
    });
  };

  return (
    <AppLayout activePath="#library">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <button onClick={() => window.history.back()} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-4 group">
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="font-headline font-bold text-sm">{t('reading_mode.back')}</span>
            </button>
            <h2 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tight mb-2">The Art of Immersion</h2>
            <p className="text-on-surface-variant font-medium">By STICK Editorial • 3 min read</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors font-headline font-bold">A-</button>
            <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors font-headline font-bold">A+</button>
          </div>
        </div>

        <div className="sketch-card bg-surface-container-lowest p-6 md:p-12 mb-8 relative">
          <div 
            className="leading-relaxed font-body text-stone-800" 
            style={{ fontSize: `${fontSize}px` }}
          >
            {words.map((w, i) => (
              <React.Fragment key={i}>
                <span 
                  onClick={() => handleWordClick(w)}
                  className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors rounded px-0.5"
                >
                  {w}
                </span>
                {' '}
              </React.Fragment>
            ))}
          </div>
        </div>

        {selectedWord && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black text-white p-5 rounded-2xl shadow-xl z-50 animate-fade-in-up">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-headline font-black text-xl capitalize">{selectedWord.word}</h3>
              <button onClick={() => setSelectedWord(null)} className="text-white/70 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="font-body text-sm text-white/90 leading-relaxed mb-4">{selectedWord.meaning}</p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg font-headline font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
              {t('reading_mode.save_word')}
            </button>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { createLearningSession } from '../../services/api/endpoints';

interface ReadingArticle {
  title: string;
  author: string;
  readTime: string;
  article: string;
}

export const ReadingModePage: React.FC = () => {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<number>(18);
  const [selectedWord, setSelectedWord] = useState<{word: string, meaning: string} | null>(null);
  const [article, setArticle] = useState<ReadingArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const startTimeRef = useRef(Date.now());
  const sessionSavedRef = useRef(false);

  useEffect(() => {
    apiRequest<{ title?: string; content?: string; article?: string }>('/ai/reading-content?topic=language+learning&level=intermediate')
      .then(res => setArticle({
        title: res.title || 'The Art of Immersion',
        author: 'STICK Editorial',
        readTime: '3 min read',
        article: res.content || res.article || '',
      }))
      .catch(() => setArticle({
        title: 'The Art of Immersion',
        author: 'STICK Editorial',
        readTime: '3 min read',
        article: 'Learning a new language is often compared to discovering a new way of seeing the world. It is not merely about memorizing vocabulary or mastering grammar rules; it is about absorbing the culture, idioms, and unique expressions that define a group of people. When you immerse yourself completely, you begin to think differently.',
      }))
      .finally(() => setLoading(false));
  }, []);

  const words = article ? article.article.split(' ') : [];

  const handleWordClick = useCallback((word: string) => {
    const cleanWord = word.replace(/[.,;!?'"()]/g, '').toLowerCase();
    if (cleanWord.length < 3) return;
    setLookingUp(true);
    setSelectedWord({ word: cleanWord, meaning: 'Looking up...' });

    // Use speechSynthesis as a quick pronunciation helper
    const utt = new SpeechSynthesisUtterance(cleanWord);
    utt.lang = 'en-US';
    utt.rate = 0.8;

    // Try a simple definition via the AI endpoint
    apiRequest<{ content?: string; definition?: string }>(`/ai/reading-content?topic=define+${encodeURIComponent(cleanWord)}&level=beginner`)
      .then(res => {
        setSelectedWord({ word: cleanWord, meaning: res.content || res.definition || `"${cleanWord}" — tap the speaker to hear pronunciation.` });
      })
      .catch(() => {
        setSelectedWord({ word: cleanWord, meaning: `Tap the speaker icon to hear how "${cleanWord}" is pronounced.` });
      })
      .finally(() => setLookingUp(false));
  }, []);

  const speakWord = (word: string) => {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'en-US';
    utt.rate = 0.8;
    window.speechSynthesis.speak(utt);
  };

  if (loading) {
    return (
      <AppLayout activePath="#library">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <p className="font-headline font-bold text-lg">Loading article...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="#library">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <button onClick={() => {
              if (!sessionSavedRef.current && article) {
                sessionSavedRef.current = true;
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                createLearningSession({
                  type: 'reading',
                  title: article.title || 'Reading Practice',
                  summary: `Read for ${Math.round(duration / 60)} min`,
                  duration,
                }).catch(() => {});
              }
              window.history.back();
            }} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-4 group">
              <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
              <span className="font-headline font-bold text-sm">{t('reading_mode.back')}</span>
            </button>
            <h2 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tight mb-2">{article?.title || 'Reading'}</h2>
            <p className="text-on-surface-variant font-medium">By {article?.author || 'STICK'} • {article?.readTime || '3 min read'}</p>
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
            <p className="font-body text-sm text-white/90 leading-relaxed mb-4">{lookingUp ? <span className="animate-pulse">Looking up...</span> : selectedWord.meaning}</p>
            <div className="flex gap-2">
              <button onClick={() => speakWord(selectedWord.word)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-headline font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">volume_up</span>
                Pronounce
              </button>
              <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-headline font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                {t('reading_mode.save_word')}
              </button>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
};

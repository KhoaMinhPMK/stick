import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { createLearningSession } from '../../services/api/endpoints';

interface ListeningContent {
  sentence: string;
  blanks: number[];
}

export const ListeningPracticePage: React.FC = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [content, setContent] = useState<ListeningContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionSavedRef = useRef(false);

  useEffect(() => {
    apiRequest<{ sentence?: string; content?: string }>('/ai/reading-content?topic=daily+conversation&level=intermediate')
      .then(res => {
        const sentence = res.sentence || res.content?.split('.')[0] || 'When you start a new habit, consistency is key.';
        const wordsArr = sentence.split(' ');
        // Pick 2 random words as blanks (length > 3)
        const eligible = wordsArr
          .map((w, i) => ({ w: w.replace(/[.,;!?]/g, ''), i }))
          .filter(x => x.w.length > 3);
        const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, Math.min(2, eligible.length));
        const blanks = shuffled.map(x => x.i).sort((a, b) => a - b);
        setContent({ sentence, blanks });
      })
      .catch(() => {
        const fallback = 'When you start a new habit, consistency is the most important key to long-term success.';
        setContent({ sentence: fallback, blanks: [5, 6] });
      })
      .finally(() => setLoading(false));
  }, []);

  const words = content ? content.sentence.split(' ') : [];

  const speak = useCallback(() => {
    if (!content) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(content.sentence);
    utt.lang = 'en-US';
    utt.rate = 0.85;
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    utteranceRef.current = utt;
    setIsPlaying(true);
    window.speechSynthesis.speak(utt);
  }, [content]);

  const stopSpeak = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleSubmitAnswer = () => {
    if (selectedBlank === null || !inputValue.trim()) return;
    setAnswers(prev => ({ ...prev, [selectedBlank]: inputValue.trim() }));
    setInputValue('');
    // Move to next blank
    const nextBlank = (content?.blanks || []).find(b => b !== selectedBlank && !answers[b]);
    setSelectedBlank(nextBlank ?? null);
  };

  const allFilled = content ? content.blanks.every(b => !!answers[b]) : false;

  const handleCheck = () => {
    setChecked(true);
    if (!sessionSavedRef.current && content) {
      sessionSavedRef.current = true;
      const wordsArr = content.sentence.split(' ');
      const correctCount = content.blanks.filter(b => {
        const expected = wordsArr[b]?.replace(/[.,;!?]/g, '').toLowerCase();
        return answers[b]?.toLowerCase() === expected;
      }).length;
      createLearningSession({
        type: 'listening',
        title: 'Listening Practice',
        summary: `${correctCount}/${content.blanks.length} blanks correct`,
        score: Math.round((correctCount / content.blanks.length) * 100),
      }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <AppLayout activePath="#library">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <p className="font-headline font-bold text-lg">Preparing listening exercise...</p>
        </div>
      </AppLayout>
    );
  }

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
          {/* Audio Visualization */}
          <div className="flex items-center justify-center gap-1 h-16 w-full max-w-xs mb-8">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div 
                key={i} 
                className="w-2 bg-on-surface-variant rounded-full origin-bottom transition-all" 
                style={{ 
                  height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                  transition: 'height 0.3s ease',
                }}
              />
            ))}
          </div>

          <button 
            onClick={isPlaying ? stopSpeak : speak}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
              isPlaying ? 'bg-primary text-white border-4 border-primary/20 sketch-border shadow-[4px_4px_0_0_#96753f]' : 'bg-secondary-container border-4 border-black sketch-border shadow-[4px_4px_0_0_#000]'
            }`}
          >
            <span className={`material-symbols-outlined text-4xl ${isPlaying ? '' : 'ml-1'}`}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          
          <p className="mt-4 font-body text-sm text-on-surface-variant">{t('listening.instruction', { defaultValue: 'Listen and fill in the missing words' })}</p>
        </div>

        {/* Fill in the blanks section */}
        <div className="mb-12 sketch-card border-none bg-secondary-container/20 p-6 md:p-8">
          <p className="font-headline text-2xl md:text-3xl leading-[2.5] tracking-wide text-center">
            {words.map((w, i) => {
              const isBlank = content?.blanks.includes(i);
              if (isBlank) {
                const answer = answers[i];
                const correctWord = w.replace(/[.,;!?]/g, '');
                const isCorrect = checked && answer?.toLowerCase() === correctWord.toLowerCase();
                const isWrong = checked && answer && answer.toLowerCase() !== correctWord.toLowerCase();
                return (
                  <React.Fragment key={i}>
                    <span 
                      onClick={() => { if (!checked) { setSelectedBlank(i); setInputValue(answers[i] || ''); } }}
                      className={`inline-block border-b-[3px] min-w-[80px] text-center mx-1 cursor-pointer transition-colors pb-1 ${
                        checked 
                          ? isCorrect ? 'border-primary text-primary bg-primary/10' : 'border-error text-error bg-error/10' 
                          : selectedBlank === i ? 'bg-primary/20 border-primary' : 'border-black border-dashed hover:bg-black/5'
                      }`}
                    >
                      {answer || (selectedBlank === i ? <span className="text-black font-black animate-pulse">_</span> : '\u00A0')}
                      {isWrong && <span className="block text-xs text-primary mt-1">{correctWord}</span>}
                    </span>
                    {' '}
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={i}>
                  <span className="font-medium text-stone-800">{w}</span>
                  {' '}
                </React.Fragment>
              );
            })}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-24">
          <button 
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline font-bold uppercase text-xs tracking-widest"
          >
            <span className="material-symbols-outlined text-lg">{showTranscript ? 'visibility_off' : 'visibility'}</span>
            {showTranscript ? t('listening.hide_transcript', { defaultValue: 'Hide Transcript' }) : t('listening.show_transcript', { defaultValue: 'Show Transcript' })}
          </button>
          {allFilled && !checked && (
            <button onClick={handleCheck} className="px-6 py-2 bg-black text-white rounded-full font-headline font-bold text-sm hover:bg-stone-800 active:scale-95">
              Check Answers
            </button>
          )}
        </div>

        {showTranscript && (
          <div className="sketch-card bg-surface-container p-6 mb-8 text-center">
            <p className="font-body text-lg text-stone-700">{content?.sentence}</p>
          </div>
        )}

        {/* Bottom Bar Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-black p-4 z-40">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <input 
              type="text"
              disabled={selectedBlank === null || checked}
              placeholder={selectedBlank !== null ? t('listening.type_word', { defaultValue: 'Type what you hear...' }) : t('listening.select_blank', { defaultValue: 'Select a blank to type' })}
              className="flex-1 sketch-input bg-surface-container-lowest p-4 font-headline text-lg disabled:opacity-50"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmitAnswer(); }}
            />
            <button 
              onClick={handleSubmitAnswer} 
              disabled={selectedBlank === null || !inputValue.trim() || checked} 
              className="w-14 h-14 bg-black text-white flex items-center justify-center rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
};

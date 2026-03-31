import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { createLearningSession } from '../../services/api/endpoints';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export const GrammarPracticePage: React.FC = () => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const sessionSavedRef = useRef(false);

  useEffect(() => {
    apiRequest<{ questions: QuizQuestion[] }>('/ai/grammar-quiz?count=5')
      .then(res => setQuestions(res.questions || []))
      .catch(err => console.error('Failed to load grammar quiz', err))
      .finally(() => setLoading(false));
  }, []);

  const current = questions[currentIndex];
  const isFinished = currentIndex >= questions.length && questions.length > 0;

  // Save learning session when quiz is completed
  useEffect(() => {
    if (isFinished && !sessionSavedRef.current) {
      sessionSavedRef.current = true;
      createLearningSession({
        type: 'grammar',
        title: 'Grammar Quiz',
        summary: `Score: ${score}/${questions.length}`,
        score: Math.round((score / questions.length) * 100),
      }).catch(() => {});
    }
  }, [isFinished, score, questions.length]);

  const handleCheck = () => {
    if (selected !== null && current) {
      setChecked(true);
      if (selected === current.correct) setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
    setSelected(null);
    setChecked(false);
  };

  const getOptionStyles = (index: number) => {
    if (!checked) {
      return selected === index 
        ? "border-2 border-black bg-secondary-container" 
        : "border-2 border-black/20 bg-surface-container-lowest hover:border-black/50";
    }
    if (index === current?.correct) return "border-2 border-primary bg-primary/10 text-primary";
    if (selected === index) return "border-2 border-error bg-error/10 text-error opacity-50";
    return "border-2 border-black/10 bg-surface-container-lowest opacity-50";
  };

  if (loading) {
    return (
      <AppLayout activePath="#library">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <p className="font-headline font-bold text-lg">Generating quiz...</p>
        </div>
      </AppLayout>
    );
  }

  if (isFinished) {
    return (
      <AppLayout activePath="#library">
        <div className="max-w-2xl mx-auto py-8 text-center">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">emoji_events</span>
          <h2 className="font-headline font-black text-3xl mb-4">Quiz Complete!</h2>
          <p className="text-xl mb-8">You scored <strong>{score}</strong> out of <strong>{questions.length}</strong></p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.hash = '#library'} className="px-6 py-3 sketch-border bg-surface-container font-headline font-bold">Back to Library</button>
            <button onClick={() => { setCurrentIndex(0); setScore(0); setSelected(null); setChecked(false); setLoading(true); apiRequest<{ questions: QuizQuestion[] }>('/ai/grammar-quiz?count=5').then(res => setQuestions(res.questions || [])).catch(() => {}).finally(() => setLoading(false)); }} className="px-6 py-3 sketch-border bg-black text-white font-headline font-bold">Try Again</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!current) {
    return (
      <AppLayout activePath="#library">
        <div className="text-center py-20">
          <p className="text-on-surface-variant">No questions available.</p>
          <button onClick={() => window.location.hash = '#library'} className="mt-4 text-primary underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="#library">
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="flex-1 max-w-xs mx-4 h-3 bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
            <div className="h-full bg-primary transition-all" style={{ width: `${((currentIndex) / questions.length) * 100}%` }}></div>
          </div>
          <span className="font-headline font-bold text-sm">{currentIndex + 1}/{questions.length}</span>
        </div>

        <h2 className="font-headline font-black text-2xl lg:text-3xl mb-8 text-center">{t('grammar_practice.title')}</h2>

        <div className="sketch-card bg-surface-container p-8 lg:p-12 mb-8 text-center min-h-[160px] flex items-center justify-center">
          <p className="font-body text-xl lg:text-2xl leading-relaxed text-stone-800">
            {current.question.includes('_____') ? current.question.split('_____').map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i === 0 && (
                  <span className={`inline-block border-b-2 px-4 mx-2 font-bold ${checked ? (selected === current.correct ? 'text-primary border-primary' : 'text-error border-error') : 'border-black'}`}>
                    {selected !== null ? current.options[selected] : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
                  </span>
                )}
              </React.Fragment>
            )) : current.question}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {current.options.map((opt, i) => (
            <button
              key={i}
              disabled={checked}
              onClick={() => setSelected(i)}
              className={`p-4 md:p-6 rounded-2xl font-headline font-bold text-lg transition-all active:scale-95 ${getOptionStyles(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {checked && current.explanation && (
          <div className="sketch-card bg-tertiary-container/30 p-6 mb-12">
            <p className="font-body text-on-surface-variant"><strong>💡</strong> {current.explanation}</p>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-black p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {checked ? (
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-3xl ${selected === current.correct ? 'text-primary' : 'text-error'}`}>
                  {selected === current.correct ? 'check_circle' : 'cancel'}
                </span>
                <p className={`font-headline font-bold ${selected === current.correct ? 'text-primary' : 'text-error'}`}>
                  {selected === current.correct ? t('grammar_practice.correct') : t('grammar_practice.incorrect')}
                </p>
              </div>
            ) : (
              <div></div>
            )}
            
            <button
              onClick={checked ? handleNext : handleCheck}
              disabled={!checked && selected === null}
              className={`px-8 py-3 rounded-full font-headline font-black text-lg transition-transform ${
                checked || selected !== null 
                  ? 'bg-primary text-white border-2 border-black shadow-[4px_4px_0_0_#000] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#000]'
                  : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
              }`}
            >
              {checked ? t('grammar_practice.continue') : t('grammar_practice.check')}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

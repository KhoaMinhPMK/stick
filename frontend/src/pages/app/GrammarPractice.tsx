import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const GrammarPracticePage: React.FC = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const question = "By the time the guests arrived, she _____ cooking dinner.";
  const options = [
    "finishes",
    "has finished",
    "had finished",
    "finished"
  ];
  const correctAnswer = 2; // "had finished" (Past Perfect)

  const handleCheck = () => {
    if (selected !== null) {
      setChecked(true);
    }
  };

  const getOptionStyles = (index: number) => {
    if (!checked) {
      return selected === index 
        ? "border-2 border-black bg-secondary-container" 
        : "border-2 border-black/20 bg-surface-container-lowest hover:border-black/50";
    }
    if (index === correctAnswer) return "border-2 border-primary bg-primary/10 text-primary";
    if (selected === index) return "border-2 border-error bg-error/10 text-error opacity-50";
    return "border-2 border-black/10 bg-surface-container-lowest opacity-50";
  };

  return (
    <AppLayout activePath="#library">
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="flex-1 max-w-xs mx-4 h-3 bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
            <div className="h-full bg-primary w-1/3"></div>
          </div>
          <span className="font-headline font-bold text-sm">3/10</span>
        </div>

        <h2 className="font-headline font-black text-2xl lg:text-3xl mb-8 text-center">{t('grammar_practice.title')}</h2>

        <div className="sketch-card bg-surface-container p-8 lg:p-12 mb-8 text-center min-h-[160px] flex items-center justify-center">
          <p className="font-body text-xl lg:text-2xl leading-relaxed text-stone-800">
            {question.split('_____').map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i === 0 && (
                  <span className={`inline-block border-b-2 px-4 mx-2 font-bold ${checked ? (selected === correctAnswer ? 'text-primary border-primary' : 'text-error border-error') : 'border-black'}`}>
                    {selected !== null ? options[selected] : '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {options.map((opt, i) => (
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

        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-black p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            {checked ? (
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-3xl ${selected === correctAnswer ? 'text-primary' : 'text-error'}`}>
                  {selected === correctAnswer ? 'check_circle' : 'cancel'}
                </span>
                <p className={`font-headline font-bold ${selected === correctAnswer ? 'text-primary' : 'text-error'}`}>
                  {selected === correctAnswer ? t('grammar_practice.correct') : t('grammar_practice.incorrect')}
                </p>
              </div>
            ) : (
              <div></div>
            )}
            
            <button
              onClick={checked ? () => { setChecked(false); setSelected(null); } : handleCheck}
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

import React, { useState, useCallback } from 'react';
import type { QuizQuestion } from '../../services/api/endpoints';

interface QuizModalProps {
  title: string;
  subtitle?: string;
  questions: QuizQuestion[];
  onComplete: (results: QuizResult) => void;
  onClose?: () => void;
}

export interface QuizResult {
  total: number;
  correct: number;
  answers: { questionIdx: number; selectedIdx: number; correct: boolean; vocabId?: string }[];
}

export const QuizModal: React.FC<QuizModalProps> = ({ title, subtitle, questions, onComplete, onClose }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [results, setResults] = useState<QuizResult['answers']>([]);

  const q = questions[currentQ];
  const isLast = currentQ === questions.length - 1;
  const isCorrect = selected === q?.correct;

  const handleConfirm = useCallback(() => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    setResults(prev => [
      ...prev,
      {
        questionIdx: currentQ,
        selectedIdx: selected,
        correct: selected === q.correct,
        vocabId: q.vocabId,
      },
    ]);
  }, [selected, confirmed, currentQ, q]);

  const handleNext = useCallback(() => {
    if (isLast) {
      const newResults = [
        ...results,
        ...(confirmed ? [] : [{
          questionIdx: currentQ,
          selectedIdx: selected ?? -1,
          correct: selected === q.correct,
          vocabId: q.vocabId,
        }]),
      ];
      const correctCount = newResults.filter(r => r.correct).length;
      onComplete({ total: questions.length, correct: correctCount, answers: newResults });
      return;
    }
    setCurrentQ(prev => prev + 1);
    setSelected(null);
    setConfirmed(false);
  }, [isLast, results, confirmed, currentQ, selected, q, questions.length, onComplete]);

  if (!q) return null;

  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg sketch-border shadow-[6px_6px_0_0_#000] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-headline font-black text-lg">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          {subtitle && <p className="text-xs text-on-surface-variant">{subtitle}</p>}
          
          {/* Progress */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-headline font-bold text-stone-400">{currentQ + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Question */}
        <div className="px-5 py-4">
          <p className="font-headline font-bold text-base mb-4 leading-snug">{q.question}</p>

          {/* Options */}
          <div className="space-y-2">
            {q.options.map((option, idx) => {
              let optionClass = 'border-stone-200 bg-white hover:border-stone-400';
              if (confirmed) {
                if (idx === q.correct) {
                  optionClass = 'border-green-500 bg-green-50 ring-2 ring-green-200';
                } else if (idx === selected && !isCorrect) {
                  optionClass = 'border-red-400 bg-red-50';
                } else {
                  optionClass = 'border-stone-200 bg-white opacity-50';
                }
              } else if (selected === idx) {
                optionClass = 'border-primary bg-primary-container/20 ring-2 ring-primary/30';
              }

              return (
                <button
                  key={idx}
                  onClick={() => { if (!confirmed) setSelected(idx); }}
                  disabled={confirmed}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${optionClass}`}
                >
                  <span className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black ${
                    confirmed && idx === q.correct
                      ? 'border-green-500 bg-green-500 text-white'
                      : confirmed && idx === selected && !isCorrect
                        ? 'border-red-400 bg-red-400 text-white'
                        : selected === idx
                          ? 'border-primary bg-primary text-white'
                          : 'border-stone-300 text-stone-500'
                  }`}>
                    {confirmed && idx === q.correct ? '✓' : confirmed && idx === selected && !isCorrect ? '✗' : String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation (after confirming) */}
          {confirmed && q.explanation && (
            <div className={`mt-4 p-3 rounded-xl border text-sm ${
              isCorrect
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base mt-0.5">
                  {isCorrect ? 'check_circle' : 'lightbulb'}
                </span>
                <p>{q.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={selected === null}
              className={`w-full py-3 rounded-xl font-headline font-bold text-sm transition-all ${
                selected !== null
                  ? 'bg-black text-white hover:bg-black/80 active:scale-[0.98] shadow-[3px_3px_0_0_#666]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl font-headline font-bold text-sm bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-[3px_3px_0_0_rgba(0,0,0,0.3)] transition-all"
            >
              {isLast ? 'Xem kết quả' : 'Câu tiếp theo →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

export const FeedbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  useEffect(() => {
    async function getFeedback() {
      if (!journalId) {
        window.location.hash = '#journal';
        return;
      }
      try {
        await apiRequest('/ai/feedback/text', {
          method: 'POST',
          body: { journalId },
        });
        window.location.hash = `#feedback-result?journalId=${journalId}`;
      } catch (err) {
        console.error('AI feedback failed', err);
        setError('Failed to generate feedback. Please try again.');
        setIsLoading(false);
      }
    }
    getFeedback();
  }, [journalId]);

  return (
    <AppLayout activePath="#journal">
      {isLoading ? (
        /* ========= LOADING STATE ========= */
        <div className="flex items-center justify-center py-8 md:py-12 animate-fade-in">
          <div className="max-w-4xl w-full">
            <div className="sketch-border bg-surface-container-lowest p-6 md:p-8 lg:p-12 flex flex-col items-center text-center shadow-[0_20px_40px_rgba(105,93,70,0.08)]">
              
              {/* Animated Brain Icon */}
              <div className="mb-6 md:mb-10 relative">
                <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center bg-surface-container rounded-full border-4 border-black border-dashed animate-pulse">
                  <span className="material-symbols-outlined text-4xl md:text-6xl text-primary">psychology</span>
                </div>
              </div>

              <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-black mb-2 md:mb-4 -rotate-1">
                {t('feedback_loading.title')}
              </h2>
              <p className="text-secondary font-medium text-sm md:text-base mb-8 md:mb-12">
                {t('feedback_loading.subtitle')}
              </p>

              {/* Bento Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full text-left">
                {/* Grammar & Flow Skeleton */}
                <div className="md:col-span-2 bg-surface-container-highest/60 border-2 border-black rounded-2xl p-4 md:p-6 h-32 md:h-48 flex flex-col gap-3 md:gap-4 opacity-60 animate-pulse">
                  <div className="h-5 md:h-6 w-1/3 bg-black/10 rounded-full" />
                  <div className="h-3 md:h-4 w-full bg-black/5 rounded-full" />
                  <div className="h-3 md:h-4 w-5/6 bg-black/5 rounded-full" />
                  <div className="h-3 md:h-4 w-4/6 bg-black/5 rounded-full mt-auto" />
                </div>
                {/* Vocabulary Skeleton */}
                <div className="bg-surface-container-highest/60 border-2 border-black rounded-2xl p-4 md:p-6 h-32 md:h-48 flex flex-col gap-3 md:gap-4 opacity-60 animate-pulse [animation-delay:0.3s]">
                  <div className="h-5 md:h-6 w-1/2 bg-black/10 rounded-full" />
                  <div className="flex gap-2 flex-wrap">
                    <div className="h-6 md:h-8 w-14 md:w-16 bg-black/5 rounded-full" />
                    <div className="h-6 md:h-8 w-16 md:w-20 bg-black/5 rounded-full" />
                    <div className="h-6 md:h-8 w-12 md:w-14 bg-black/5 rounded-full" />
                  </div>
                </div>
                {/* Sentiment Skeleton */}
                <div className="bg-surface-container-highest/60 border-2 border-black rounded-2xl p-4 md:p-6 h-28 md:h-40 flex flex-col items-center justify-center gap-2 md:gap-3 opacity-60 animate-pulse [animation-delay:0.6s]">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/5" />
                  <div className="h-3 md:h-4 w-1/2 bg-black/10 rounded-full" />
                </div>
                {/* Next Steps Skeleton */}
                <div className="md:col-span-2 bg-surface-container-highest/60 border-2 border-black rounded-2xl p-4 md:p-6 h-28 md:h-40 flex flex-col gap-3 md:gap-4 opacity-60 animate-pulse [animation-delay:0.9s]">
                  <div className="h-5 md:h-6 w-1/4 bg-black/10 rounded-full" />
                  <div className="flex gap-3 md:gap-4">
                    <div className="h-10 md:h-12 w-10 md:w-12 rounded-lg bg-black/5" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 md:h-4 w-full bg-black/5 rounded-full" />
                      <div className="h-3 md:h-4 w-3/4 bg-black/5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Encouragement Footer */}
              <div className="mt-10 md:mt-16 flex items-center gap-3 md:gap-4 text-tertiary">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="font-headline font-bold text-base md:text-lg italic">"{t('feedback_loading.quote')}"</span>
              </div>
            </div>

            {/* Subtle status text */}
            <div className="mt-8 md:mt-12 grid grid-cols-2 gap-6 md:gap-8 opacity-40 select-none">
              <div className="font-headline text-stone-400 italic text-xs md:text-sm">
                {t('feedback_loading.refining')}
              </div>
              <div className="font-headline text-stone-400 italic text-xs md:text-sm text-right">
                {t('feedback_loading.analyzing')}
              </div>
            </div>
          </div>
        </div>
      ) : (
      /* ========= ERROR / FALLBACK STATE ========= */
      <div className="flex items-center justify-center py-12 animate-fade-in">
        <div className="max-w-md text-center space-y-6">
          <span className="material-symbols-outlined text-6xl text-error/60">error_outline</span>
          <h2 className="font-headline font-black text-2xl">{t('feedback_loading.error_title', { defaultValue: 'Oops!' })}</h2>
          <p className="text-on-surface-variant">{error || t('feedback_loading.error_desc', { defaultValue: 'Something went wrong generating your feedback.' })}</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => window.location.hash = `#journal-workspace?journalId=${journalId}`} className="px-6 py-3 sketch-border bg-surface-container font-headline font-bold">
              {t('feedback_loading.back', { defaultValue: 'Back to Writing' })}
            </button>
            <button onClick={() => window.location.reload()} className="px-6 py-3 sketch-border bg-black text-white font-headline font-bold">
              {t('feedback_loading.retry', { defaultValue: 'Try Again' })}
            </button>
          </div>
        </div>
      </div>
      )}
    </AppLayout>
  );
};

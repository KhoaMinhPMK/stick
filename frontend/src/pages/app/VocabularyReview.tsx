import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

export const VocabularyReviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [vocabItems, setVocabItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  useEffect(() => {
    async function loadVocab() {
      try {
        const res = await apiRequest('/vocab/notebook') as any;
        setVocabItems(res.items || []);
      } catch (err) {
        console.error('Failed to load vocab', err);
      } finally {
        setLoading(false);
      }
    }
    loadVocab();
  }, []);

  const currentVocab = vocabItems[currentIndex];
  const isFinished = currentIndex >= vocabItems.length && !loading;

  const handleGotIt = async () => {
    if (!currentVocab || actionLoading) return;
    setActionLoading(true);
    try {
      await apiRequest(`/vocab/notebook/${currentVocab.id}`, {
        method: 'PATCH',
        body: { mastery: 'learning' },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleReviewLater = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleContinue = () => {
    const target = journalId ? `#speaking-intro?journalId=${journalId}` : '#speaking-intro';
    window.location.hash = target;
  };

  return (
    <AppLayout activePath="#journal">
      <div className="min-h-[calc(100vh-8rem)] pb-28 md:pb-32">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">

          {/* Header Instruction */}
          <section className="flex flex-col items-center text-center space-y-2 md:space-y-3 pt-2 md:pt-4">
            <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight -rotate-1 inline-block">
              {t('vocab_review.title')}
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base lg:text-lg max-w-xl">
              {t('vocab_review.subtitle')}
            </p>
          </section>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
            </div>
          ) : isFinished ? (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
              <span className="material-symbols-outlined text-6xl text-tertiary">celebration</span>
              <h2 className="font-headline text-2xl md:text-3xl font-bold">{vocabItems.length === 0 ? t('vocab_review.no_items', { defaultValue: 'Your notebook is empty!' }) : t('vocab_review.finished', { defaultValue: "You've reviewed all items!" })}</h2>
              <button onClick={handleContinue} className="px-6 py-3 bg-black text-white rounded-full font-bold mt-4">
                {t('vocab_review.continue_to_speaking')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 lg:gap-8">
              {/* Primary Phrase Card */}
              <div className="lg:col-span-7 bg-surface-container-lowest sketch-border p-6 md:p-8 lg:p-10 flex flex-col justify-between min-h-[320px] md:min-h-[380px]">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="bg-secondary-container text-on-secondary-container px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold border-2 border-black uppercase">
                      {t('vocab_review.phrase_tag')}
                    </span>
                    <span className="material-symbols-outlined text-2xl md:text-3xl lg:text-4xl text-secondary">lightbulb</span>
                  </div>
                  <h3 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black italic">
                    {currentVocab.word}
                  </h3>
                  <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t-2 border-dashed border-outline-variant">
                    <div>
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-secondary mb-1">{t('vocab_review.meaning')}</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-medium">{currentVocab.meaning || 'No meaning provided'}</p>
                    </div>
                    {currentVocab.example && (
                      <div>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-secondary mb-1">{t('vocab_review.example')}</p>
                        <p className="text-lg md:text-xl lg:text-2xl italic text-tertiary">
                          "{currentVocab.example}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4 mt-8 md:mt-10">
                  <button 
                    onClick={handleGotIt}
                    disabled={actionLoading}
                    className="flex-1 py-3 md:py-4 rounded-full border-[3px] border-black font-bold text-sm md:text-base lg:text-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-tertiary-container text-white hover:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">check_circle</span>
                    {actionLoading ? '...' : t('vocab_review.got_it')}
                  </button>
                  <button 
                    onClick={handleReviewLater}
                    disabled={actionLoading}
                    className="flex-1 py-3 md:py-4 rounded-full border-[3px] border-black font-bold text-sm md:text-base lg:text-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-surface-container-highest text-black hover:bg-secondary-container"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">replay</span>
                    {t('vocab_review.review_later')}
                  </button>
                </div>
              </div>

              {/* Pattern & Illustration Side Column */}
              <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6 lg:gap-8">
                {/* Pattern Card */}
                <div className="bg-surface-container-high sketch-border p-5 md:p-6 lg:p-8 flex-1">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <span className="material-symbols-outlined text-primary text-xl md:text-2xl lg:text-3xl">architecture</span>
                    <h4 className="font-headline text-lg md:text-xl lg:text-2xl font-bold">{t('vocab_review.sentence_pattern')}</h4>
                  </div>
                  <div className="bg-surface-container-lowest border-2 border-black rounded-xl p-4 md:p-5 lg:p-6 mb-3 md:mb-4">
                    <p className="text-xl md:text-2xl lg:text-3xl font-black font-headline tracking-tighter">I had [noun].</p>
                  </div>
                  <p className="text-on-surface-variant text-xs md:text-sm mb-4 md:mb-6">
                    {t('vocab_review.pattern_desc')}
                  </p>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-white/50 rounded-lg">
                      <span className="material-symbols-outlined text-tertiary text-lg md:text-xl">subdirectory_arrow_right</span>
                      <p className="font-medium text-sm md:text-base">I had <span className="text-tertiary font-bold">lunch</span>.</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-white/50 rounded-lg">
                      <span className="material-symbols-outlined text-tertiary text-lg md:text-xl">subdirectory_arrow_right</span>
                      <p className="font-medium text-sm md:text-base">I had <span className="text-tertiary font-bold">a dream</span>.</p>
                    </div>
                  </div>
                </div>

                {/* Illustration Card */}
                <div className="bg-white sketch-border p-4 md:p-6 flex flex-col items-center justify-center text-center">
                  <img 
                    className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain mb-3 md:mb-4 grayscale opacity-80" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSXxNWe4uThnM9rDfMBH524WHWR88VZTaYJO0Y0rLkqNdNrzrIF_brpriL2-rWTYzZy29RrBpC1LGuJeLrFXDRmH18cyi12DT8A3zK3ylFJRWcw8zkMzzv9_nFNrjF80EqJiZcyW2annn5XEBOVmw-vpu2S9ky81yeOhoA0856xr2UhdoZTcC3DPoDFmfTBVk160oSFeWcSbYjHsCYEZ3Zmm0x38Rh0ouRXyo0EwnwourWGaDKPzKNx_MQI05BDhsGO91XI18tb-9J" 
                    alt="Study illustration"
                  />
                  <p className="font-headline font-bold italic text-sm md:text-base">
                    "{t('vocab_review.illustration_quote')}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        {!isFinished && !loading && (
          <footer className="fixed bottom-0 left-0 md:left-[224px] lg:left-[256px] right-0 h-20 md:h-24 bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 z-30 border-t-2 border-black/5">
            <div className="flex flex-col">
              <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {t('vocab_review.step_of', { current: currentIndex + 1, total: vocabItems.length })}
              </p>
              <p className="font-headline font-bold text-sm md:text-base">Vocabulary Builder</p>
            </div>
            <button 
              onClick={handleContinue}
              className="px-6 md:px-10 lg:px-12 py-3 md:py-4 bg-black text-white rounded-full font-headline font-black text-sm md:text-base lg:text-lg flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform active:scale-95 sketch-border"
            >
              Skip
              <span className="material-symbols-outlined text-lg md:text-xl">fast_forward</span>
            </button>
          </footer>
        )}
      </div>
    </AppLayout>
  );
};

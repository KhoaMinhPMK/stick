import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

export const FeedbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [isPlayingModel, setIsPlayingModel] = useState(false);

  const id = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('id');
  }, []);

  useEffect(() => {
    async function getFeedback() {
      if (!id) {
        window.location.hash = '#journal-workspace';
        return;
      }
      try {
        await apiRequest('/ai/feedback/text', {
          method: 'POST',
          body: JSON.stringify({ journalId: id }),
        });
        window.location.hash = `#feedback-result?id=${id}`;
      } catch (err) {
        console.error('AI feedback failed', err);
        window.location.hash = `#history-detail?id=${id}`;
      }
    }
    getFeedback();
  }, [id]);

  // Example waveform data
  const waveform = [
    { h: 'h-6', opacity: 'opacity-20' },
    { h: 'h-10', opacity: 'opacity-40' },
    { h: 'h-14', opacity: 'opacity-100' },
    { h: 'h-8', opacity: 'opacity-100' },
    { h: 'h-12', opacity: 'opacity-60' },
    { h: 'h-4', opacity: 'opacity-20' },
    { h: 'h-10', opacity: 'opacity-100' },
    { h: 'h-16', opacity: 'opacity-100' },
    { h: 'h-12', opacity: 'opacity-40' },
    { h: 'h-6', opacity: 'opacity-20' },
    { h: 'h-14', opacity: 'opacity-100' },
    { h: 'h-10', opacity: 'opacity-80' },
    { h: 'h-4', opacity: 'opacity-30' },
    { h: 'h-12', opacity: 'opacity-100' },
    { h: 'h-16', opacity: 'opacity-50' },
  ];

  const handlePlayUser = () => {
    setIsPlayingUser(!isPlayingUser);
    if (isPlayingModel) setIsPlayingModel(false);
  };

  const handlePlayModel = () => {
    setIsPlayingModel(!isPlayingModel);
    if (isPlayingUser) setIsPlayingUser(false);
  };

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
      /* ========= FEEDBACK CONTENT ========= */
      <div className="flex items-center justify-center py-6 md:py-12 animate-fade-in">
        <div className="max-w-4xl w-full">
          {/* Central Feedback Card */}
          <div className="sketch-card bg-surface-container-lowest p-6 sm:p-8 md:p-12 relative mt-16 md:mt-0">
            {/* Floating Illustration */}
            <div className="absolute -top-20 -right-4 md:-top-16 md:-right-8 w-32 h-32 md:w-48 md:h-48 pointer-events-none z-10 drop-shadow-sm">
              <img 
                alt="Hand-drawn stick figure jumping for joy" 
                className="w-full h-full object-contain mix-blend-multiply rotate-6 hover:rotate-12 transition-transform duration-500 float-anim" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2FRNlfT_qXT0cZF9mjXPCsy0TejR4562mAbeMNrEkOxd-iwdN-Ju3p0SjC5pqwK500G4aQyBJq0G9-xKQ0u0AqKS8_-wLFKCN_OmX6F6ME4jMtlqbBv41FBypszbpA53tD606s5gNgafCi-NeKFLDU_rThpl38aQKbQ2jYBQdYZ3AVTOJzHlT3Yryzul1aJKOfeJ3fD77-tL43s-K7IX-Buf59KBBWT7uFBZU75vo2N9o4iu6ic0dPmfZv3F-VsNOwEIwZVQ0GEag" 
              />
            </div>

            <div className="space-y-10 md:space-y-12 relative z-20">
              
              {/* Heading Section */}
              <div className="space-y-3 md:space-y-4 max-w-[85%] md:max-w-full">
                <div className="inline-flex items-center justify-center px-3 py-1 mb-2 bg-secondary-container/50 border-2 border-primary rounded-full text-xs font-bold uppercase tracking-widest text-primary rotate-1">
                  AI Feedback
                </div>
                <h2 className="font-headline text-4xl md:text-5xl font-black italic tracking-tight wobble-text text-primary">
                  Nice try, Alex!
                </h2>
                <p className="text-lg md:text-xl text-on-surface-variant font-medium max-w-lg">
                  Your voice is sounding more natural every day. Here's how you did on that last passage.
                </p>
              </div>

              {/* Feedback Chips Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="sketch-border p-5 md:p-6 bg-tertiary-container/10 flex flex-col gap-2 md:gap-3 hover:-translate-y-1 transition-transform cursor-default bg-notebook-paper">
                  <span className="material-symbols-outlined text-tertiary text-3xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-headline font-bold text-base md:text-lg">Clear start</span>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed bg-white/80 p-2 rounded">Your opening was crisp and perfectly enunciated.</p>
                </div>
                
                <div className="sketch-border p-5 md:p-6 bg-surface-container flex flex-col gap-2 md:gap-3 hover:-translate-y-1 transition-transform cursor-default shadow-sm border-b-4 border-r-4">
                  <span className="material-symbols-outlined text-primary text-3xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>speed</span>
                  <span className="font-headline font-bold text-base md:text-lg">Good pace</span>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Steady rhythm, not too fast or slow. Just right.</p>
                </div>
                
                <div className="sketch-border-subtle p-5 md:p-6 border-dashed border-outline bg-surface-container-low flex flex-col gap-2 md:gap-3 hover:-translate-y-1 transition-transform cursor-default opacity-90 border-2">
                  <span className="material-symbols-outlined text-secondary text-3xl md:text-4xl">refresh</span>
                  <span className="font-headline font-bold text-base md:text-lg">Try again for flow</span>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">The middle section had a slight pause. Keep practicing!</p>
                </div>
              </div>

              {/* Audio Comparison Block */}
              <div className="bg-surface-container rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-between border-2 border-black/10 sketch-card hover:bg-surface-container-high transition-colors shadow-[4px_4px_0_0_#000000]">
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">graphic_eq</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary">Audio Analysis</span>
                  </div>
                  <div className="h-16 w-full flex items-center justify-center lg:justify-start gap-1.5 md:gap-2">
                    {/* Mock Waveform */}
                    {waveform.map((bar, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 md:w-2 ${bar.h} bg-primary rounded-full transition-all duration-300 ${bar.opacity} ${(isPlayingUser || isPlayingModel) ? 'animate-pulse' : ''}`}
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full lg:w-auto">
                  <button 
                    onClick={handlePlayUser}
                    className={`flex justify-center items-center gap-2 px-6 py-3.5 border-[3px] border-black rounded-full font-bold transition-all active:scale-95 w-full sm:w-auto shadow-[2px_2px_0_0_#000000] hover:shadow-[1px_1px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] ${isPlayingUser ? 'bg-secondary-container text-primary' : 'bg-surface hover:bg-secondary-container'}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isPlayingUser ? "'FILL' 1" : "'FILL' 0" }}>
                      {isPlayingUser ? 'pause_circle' : 'play_circle'}
                    </span>
                    {isPlayingUser ? 'Playing...' : 'Replay'}
                  </button>
                  <button 
                    onClick={handlePlayModel}
                    className={`flex justify-center items-center gap-2 px-6 py-3.5 border-[3px] border-black rounded-full font-bold transition-all active:scale-95 w-full sm:w-auto shadow-[2px_2px_0_0_#000000] hover:shadow-[1px_1px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] ${isPlayingModel ? 'bg-primary text-secondary-container' : 'bg-surface hover:bg-surface-container-highest'}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: isPlayingModel ? "'FILL' 1" : "'FILL' 0" }}>
                      {isPlayingModel ? 'stop_circle' : 'record_voice_over'}
                    </span>
                    {isPlayingModel ? 'Listening...' : 'Listen to AI'}
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 md:pt-8 flex flex-col-reverse sm:flex-row justify-end items-center gap-4 md:gap-6 border-t-2 border-dashed border-black/10">
                <button 
                  onClick={() => window.location.hash = '#journal-record'}
                  className="text-on-surface-variant font-bold hover:text-primary transition-colors hover:underline p-2 text-sm md:text-base flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Practice more like this
                </button>
                <button 
                  onClick={() => window.location.hash = '#completion'}
                  className="w-full sm:w-auto px-10 md:px-12 py-3.5 md:py-4 bg-primary text-secondary-container rounded-full font-headline font-extrabold text-lg md:text-xl flex justify-center items-center gap-3 hover:bg-stone-800 transition-all active:scale-95 shadow-[4px_4px_0_0_#e3d2b5] active:shadow-[0px_0px_0_0_#e3d2b5]"
                >
                  Continue
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contextual Help (Sketchy) */}
          <div className="mt-8 md:mt-12 flex justify-center animate-fade-in-up delay-[400ms]">
            <div className="max-w-md text-center space-y-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
              <p className="font-body italic font-medium text-sm md:text-base text-on-surface-variant px-4">
                "Mistakes are just pencil marks you haven't erased yet."
              </p>
              <div className="flex justify-center gap-1.5 opacity-50">
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="w-1 h-1 bg-black rounded-full mt-0.5"></div>
                <div className="w-0.5 h-0.5 bg-black rounded-full mt-1"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
      )}
    </AppLayout>
  );
};

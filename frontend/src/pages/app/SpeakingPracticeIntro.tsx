import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { trackAudioPlay } from '../../services/analytics/coreLoop';

export const SpeakingPracticeIntroPage: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sentence, setSentence] = useState('');
  const [loadingJournal, setLoadingJournal] = useState(false);
  const playCountRef = useRef(0);

  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  // Load journal to get enhanced sentence
  useEffect(() => {
    if (!journalId) return;
    setLoadingJournal(true);
    apiRequest<{ journal: { feedback: string | null; content: string } }>(`/journals/${journalId}`)
      .then(res => {
        const j = res.journal;
        try {
          const fb = typeof j.feedback === 'string' ? JSON.parse(j.feedback) : j.feedback;
          setSentence(fb?.enhancedText || j.content || '');
        } catch {
          setSentence(j.content || '');
        }
      })
      .catch(() => {/* non-blocking */})
      .finally(() => setLoadingJournal(false));
  }, [journalId]);

  const handleListen = () => {
    if (!sentence) return;
    if (!window.speechSynthesis) {
      return; // fallback: button just stays inactive
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(sentence);
    utt.lang = 'en-US';
    utt.onstart = () => {
      setIsPlaying(true);
      playCountRef.current += 1;
      trackAudioPlay({ journalId: journalId || undefined, playCount: playCountRef.current });
    };
    utt.onend = () => setIsPlaying(false);
    utt.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utt);
  };

  const handleRecord = () => {
    window.location.hash = journalId ? `#journal-record?journalId=${journalId}` : '#journal-record';
  };

  return (
    <AppLayout activePath="#journal">
      <div className="flex items-center justify-center py-8 md:py-12 animate-fade-in relative z-10">
        <div className="max-w-4xl w-full flex flex-col items-center">
          
          {/* Speaking Practice Intro Card */}
          <div className="sketch-card bg-surface-container-lowest p-8 md:p-12 w-full mt-16 md:mt-0 relative">
            
            {/* Illustration Section */}
            <div className="flex justify-center mb-8 md:mb-10">
              <div className="relative">
                {/* Simple Stick Figure Coach Illustration */}
                <div className="w-40 h-40 md:w-48 md:h-48 bg-surface border-2 border-black border-dashed rounded-full flex items-center justify-center p-4">
                  <span className="material-symbols-outlined text-[80px] md:text-[100px] text-primary/60 transition-transform hover:scale-105 duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
                </div>
                {/* Speech Bubble */}
                <div className="absolute -top-6 -right-10 md:-top-4 md:-right-16 bg-white sketch-border px-4 py-3 wobble-text shadow-sm z-10 pointer-events-none">
                  <p className="font-headline font-bold text-sm md:text-base text-black whitespace-nowrap">You got this!</p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="text-center space-y-8 md:space-y-10">
              <div className="space-y-3">
                <span className="font-headline text-tertiary font-bold tracking-widest text-xs md:text-sm uppercase py-1 px-3 bg-tertiary-container/10 border-2 border-tertiary rounded-full inline-block">
                  Next Step: Speak It
                </span>
                <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary wobble-text italic">
                  Ready to try aloud?
                </h2>
              </div>

              {/* The Target Sentence Card */}
              <div className="bg-surface-container p-6 md:p-10 sketch-border mx-auto max-w-2xl group transition-all hover:bg-surface-container-high shadow-[4px_4px_0_0_#000000]">
                <p className="font-headline text-stone-500 text-xs md:text-sm mb-3 md:mb-5 uppercase tracking-widest font-bold">Your improved sentence</p>
                {loadingJournal ? (
                  <span className="material-symbols-outlined animate-spin text-2xl text-stone-400">progress_activity</span>
                ) : sentence ? (
                  <p className="text-2xl md:text-4xl font-headline font-bold text-primary italic leading-tight group-hover:scale-105 transition-transform duration-300">
                    "{sentence}"
                  </p>
                ) : (
                  <p className="text-base text-stone-400 italic">No sentence available — go back and complete your journal first.</p>
                )}
              </div>

              <div className="font-body text-lg md:text-xl text-on-surface-variant max-w-lg mx-auto flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm md:text-base" style={{fontVariationSettings: "'FILL' 1"}}>tips_and_updates</span>
                <span className="italic font-medium text-primary">No pressure. Just try.</span>
              </div>

              {/* Primary Actions */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pt-4">
                {/* Listen Button */}
                <button 
                  onClick={handleListen}
                  disabled={!sentence || isPlaying}
                  className={`flex justify-center items-center gap-3 px-8 py-4 md:px-10 md:py-5 w-full md:w-auto border-[3px] border-black rounded-full font-headline font-bold text-lg md:text-xl transition-all active:scale-95 group shadow-[2px_2px_0_0_#000000] hover:shadow-[1px_1px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed ${isPlaying ? 'bg-secondary-container text-primary scale-105' : 'bg-surface hover:bg-secondary-container'}`}
                >
                  <span className={`material-symbols-outlined text-3xl transition-transform ${isPlaying ? 'animate-pulse' : 'group-hover:rotate-12'}`} style={{fontVariationSettings: isPlaying ? "'FILL' 1" : "'FILL' 0"}}>
                    {isPlaying ? 'volume_up' : 'volume_up'}
                  </span>
                  {isPlaying ? 'Playing...' : 'Listen first'}
                </button>
                
                {/* Record Button */}
                <button 
                  onClick={handleRecord}
                  className={`flex justify-center items-center gap-3 px-8 py-4 md:px-10 md:py-5 w-full md:w-auto text-secondary-container border-[3px] border-black rounded-full font-headline font-bold text-lg md:text-xl transition-all active:scale-95 group shadow-[4px_4px_0_0_#e3d2b5] active:shadow-[0px_0px_0_0_#e3d2b5] bg-tertiary-fixed hover:bg-tertiary`}
                >
                  <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                    mic
                  </span>
                  Record now
                </button>
              </div>
            </div>

            {/* Decorative Sketch Elements */}
            <div className="absolute bottom-6 left-6 md:left-8 opacity-[0.15] pointer-events-none hidden sm:block">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-primary" style={{fontVariationSettings: "'FILL' 1"}}>draw</span>
            </div>
            <div className="absolute top-10 md:top-12 right-6 md:right-12 opacity-10 pointer-events-none rotate-12 hidden sm:block delay-300 float-anim">
              <span className="material-symbols-outlined text-7xl md:text-8xl text-primary">text_fields</span>
            </div>
          </div>

          {/* Context Footer */}
          <div className="mt-8 md:mt-12 text-center text-on-surface-variant font-label space-y-3 animate-fade-in-up delay-[400ms]">
            <p className="font-medium text-sm md:text-base">This session focuses on past tense fluency.</p>
            {/* Progress indicators matching core loop */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-container opacity-50"></span>
              <span className="w-2 h-2 rounded-full bg-secondary-container opacity-50"></span>
              <span className="w-8 h-2 rounded-full bg-primary sketch-border"></span>
              <span className="w-2 h-2 rounded-full bg-surface-container border-2 border-black/20"></span>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

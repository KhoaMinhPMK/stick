import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
  minDelay?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, minDelay = 2000 }) => {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Lock body scroll when loading screen is visible
    document.body.style.overflow = 'hidden';

    const startTime = Date.now();
    
    const checkLoading = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (!isLoading && elapsed >= minDelay) {
        clearInterval(checkLoading);
        setFade(true);
        setTimeout(() => {
          setShow(false);
          // Restore user's body scroll
          document.body.style.overflow = 'unset';
        }, 500); // 500ms fade out transition
      }
    }, 100);

    return () => {
      clearInterval(checkLoading);
      document.body.style.overflow = 'unset';
    };
  }, [isLoading, minDelay]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[100] transition-opacity duration-500 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="bg-surface font-body text-on-surface overflow-hidden w-full h-[100dvh]">
        <main className="relative h-full w-full flex flex-col items-center justify-center p-4 md:p-8 bg-notebook-pattern">
          {/* Floating background elements */}
          <div className="absolute top-10 left-4 md:top-20 md:left-20 opacity-10 pointer-events-none animate-[float_6s_ease-in-out_infinite]">
            <span className="material-symbols-outlined text-5xl md:text-9xl text-primary">edit_note</span>
          </div>
          <div className="absolute bottom-20 right-4 md:bottom-40 md:right-40 opacity-10 pointer-events-none animate-[floatRotate_8s_ease-in-out_infinite]">
            <span className="material-symbols-outlined text-[6rem] md:text-[12rem] text-primary">chat_bubble_outline</span>
          </div>
          <div className="absolute top-1/4 right-10 md:right-1/4 opacity-10 pointer-events-none animate-[float_7s_ease-in-out_infinite_1s]">
            <span className="material-symbols-outlined text-5xl md:text-8xl text-primary rotate-6">menu_book</span>
          </div>

          {/* Center content */}
          <div className="flex flex-col items-center gap-6 md:gap-10 relative z-10 w-full max-w-full px-2">
            <div className="text-center w-full">
              <h1 className="font-headline text-[16vw] sm:text-[6rem] md:text-[8rem] font-black tracking-tighter text-primary italic leading-none wobble-text">
                STICK
              </h1>
              <p className="font-headline text-xs sm:text-sm md:text-2xl tracking-[0.2em] md:tracking-[0.4em] text-secondary mt-2 md:mt-4 font-bold">
                ENGLISH HABIT
              </p>
            </div>
            
            <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 border-[3px] md:border-4 border-primary sketch-border bg-surface-container-lowest opacity-50"></div>
              <span className="material-symbols-outlined text-[60px] sm:text-[80px] md:text-[120px] text-primary/60" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
            </div>

            <div className="flex flex-col items-center gap-3 md:gap-6 mt-2 md:mt-8 w-full">
              <div className="relative w-40 sm:w-48 md:w-64 h-3 md:h-4 border-[3px] md:border-4 border-black rounded-full overflow-hidden bg-surface-container">
                <div className="absolute top-0 left-0 h-full w-2/3 bg-secondary-container border-r-[3px] md:border-r-4 border-black animate-[slideRight_2s_ease-in-out_infinite]"></div>
              </div>
              <div className="flex items-center justify-center gap-2 md:gap-3 text-center">
                <span className="material-symbols-outlined text-primary animate-pulse text-base md:text-xl shrink-0">draw</span>
                <span className="font-headline text-xs sm:text-sm md:text-lg font-bold tracking-tight sm:tracking-wide uppercase truncate">
                  Sharpening pencils...
                </span>
              </div>
            </div>
          </div>

          {/* Bottom quote */}
          <div className="absolute bottom-6 w-full flex justify-center px-6">
            <div className="max-w-[280px] md:max-w-md text-center opacity-60">
              <p className="text-secondary font-medium italic text-[10px] sm:text-xs md:text-base leading-tight">
                "The secret of getting ahead is getting started."
              </p>
            </div>
          </div>
        </main>

        <div className="fixed top-0 left-0 w-20 h-20 md:w-32 md:h-32 pointer-events-none">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
            <path className="text-surface-container-highest" d="M0 0 L100 0 L0 100 Z" fill="currentColor"></path>
            <path d="M0 0 L90 0 L0 90 Z" fill="none" stroke="black" strokeDasharray="10 5" strokeWidth="2"></path>
          </svg>
        </div>
        <div className="fixed bottom-0 right-0 w-20 h-20 md:w-32 md:h-32 pointer-events-none rotate-180">
          <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
            <path className="text-surface-container-highest" d="M0 0 L100 0 L0 100 Z" fill="currentColor"></path>
            <path d="M0 0 L90 0 L0 90 Z" fill="none" stroke="black" strokeDasharray="10 5" strokeWidth="2"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

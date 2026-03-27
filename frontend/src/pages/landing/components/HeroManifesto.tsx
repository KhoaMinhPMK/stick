import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { SketchCard } from '../../../components/ui/SketchCard';

export const HeroManifesto: React.FC = () => {
  const { t } = useTranslation();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black font-headline leading-[0.9] tracking-tighter mb-4 md:mb-8">
            {t('hero.headline_part1')}<span className="ink-underline">{t('hero.headline_highlight')}</span><span dangerouslySetInnerHTML={{ __html: t('hero.headline_part2') }} />
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-on-surface-variant mb-6 md:mb-12 max-w-lg leading-relaxed">
            {t('hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="primary" 
              onClick={() => window.location.hash = '#onboarding'}
            >
              {t('hero.cta_primary')} →
            </Button>
            <Button variant="outline" onClick={() => setIsVideoOpen(true)}>{t('hero.cta_secondary')}</Button>
          </div>
        </div>
      
      <div className="relative">
        <SketchCard className="p-4 sm:p-6 md:p-8 rotate-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center">
              <Icon name="edit_note" />
            </div>
            <span className="font-headline font-bold">{t('hero.card_title')}</span>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low border-2 border-black/10 rounded-xl italic text-on-surface-variant font-medium">        
              "I am go to park today because weather was very good."
            </div>
            <div className="flex justify-start pl-6 -my-2 relative z-10">
              <div className="bg-white rounded-full p-1 border-2 border-black">
                <Icon name="arrow_downward" className="text-secondary" />
              </div>
            </div>
            <div className="p-4 bg-tertiary-container text-white rounded-xl font-bold shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black">
              "I went to the park today because the weather was lovely."
              <div className="text-xs mt-3 opacity-90 font-normal py-1 border-t border-white/20">{t('hero.card_insight')}</div>
            </div>
          </div>
        </SketchCard>
        
        <SketchCard className="absolute -bottom-8 -left-8 bg-secondary-container p-6 -rotate-2 hidden md:block w-48" hoverEffect={false}>
          <Icon name="trending_up" className="block mb-2" />
          <div className="text-sm font-bold">14 Day Streak!</div>
          <div className="text-xs opacity-70">Your brain is rewiring.</div>
        </SketchCard>
      </div>
    </section>

      {/* Video Modal */}
      {isVideoOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" 
          onClick={() => setIsVideoOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors border border-white/20"
              onClick={() => setIsVideoOpen(false)}
              aria-label="Close video"
            >
              <Icon name="close" />
            </button>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/FFgbbxpEJHI?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};
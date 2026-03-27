import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import logoUrl from '../../assets/logo.svg';

export const TopNavBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full border-b-4 border-black dark:border-stone-100 bg-[#fdf9f0]/95 backdrop-blur-sm z-50">
      <div className="flex justify-between items-center w-full px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto">
        <a 
          href="/"
          className="cursor-pointer flex items-center gap-3 hover:opacity-80 transition-opacity" 
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo(0, 0);
          }}
        >
          <img src={logoUrl} alt="STICK Logo" className="h-8 md:h-16 object-contain" />
          <span className="text-lg md:text-2xl font-black text-black tracking-widest uppercase font-headline mt-1">
            STICK
          </span>
        </a>
        
        <div className="hidden md:flex gap-8 items-center">
          <a className="text-stone-600 font-medium hover:skew-x-1 hover:text-black transition-transform font-headline tracking-tight" href="#why-stick">
            {t('nav.why_stick')}
          </a>
          <a className="text-stone-600 font-medium hover:skew-x-1 hover:text-black transition-transform font-headline tracking-tight" href="#features">
            {t('nav.features')}
          </a>
          <a className="text-stone-600 font-medium hover:skew-x-1 hover:text-black transition-transform font-headline tracking-tight" href="#validation">
            {t('nav.validation')}
          </a>
          <a className="text-stone-600 font-medium hover:skew-x-1 hover:text-black transition-transform font-headline tracking-tight" href="#pricing">
            {t('nav.pricing')}
          </a>
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          {mounted && (
            <button 
              onClick={toggleLanguage}
              className="font-bold flex items-center justify-center gap-1 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors min-w-[60px] md:min-w-[80px] text-sm md:text-base"
              title="Toggle Language"
            >
              <Icon name="language" className="text-[20px] leading-none block" />
              <span className="leading-none block mt-[2px]">{i18n.language.startsWith('vi') ? 'VI' : 'EN'}</span>
            </button>
          )}
          <Button 
            variant="sketch"
            onClick={() => window.location.hash = '#onboarding'}
          >
            {t('nav.start_free')}
          </Button>
        </div>
      </div>
    </nav>
  );
};
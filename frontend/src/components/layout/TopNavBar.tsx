import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';
import logoUrl from '../../assets/logo.svg';

export const TopNavBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('stick_access_token');

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('vi') ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const navLinks = [
    { href: '#why-stick', label: t('nav.why_stick') },
    { href: '#features', label: t('nav.features') },
    { href: '#validation', label: t('nav.validation') },
    { href: '#pricing', label: t('nav.pricing') },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
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
            setMobileMenuOpen(false);
          }}
        >
          <img src={logoUrl} alt="STICK Logo" className="h-8 md:h-16 object-contain" />
          <span className="text-lg md:text-2xl font-black text-black tracking-widest uppercase font-headline mt-1">
            STICK
          </span>
        </a>
        
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map(link => (
            <a key={link.href} className="text-stone-600 font-medium hover:skew-x-1 hover:text-black transition-transform font-headline tracking-tight" href={link.href} onClick={(e) => scrollToSection(e, link.href)}>
              {link.label}
            </a>
          ))}
        </div>
        
        <div className="flex items-center gap-2 md:gap-6">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-[24px]" />
          </button>

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
          {isLoggedIn ? (
            <Button 
              variant="sketch"
              onClick={() => window.location.hash = '#dashboard'}
              className="hidden sm:inline-flex"
            >
              {t('nav.go_dashboard', { defaultValue: 'Dashboard' })}
            </Button>
          ) : (
            <>
              <button
                onClick={() => window.location.hash = '#login'}
                className="hidden sm:inline-flex items-center font-bold font-headline text-sm md:text-base text-stone-700 hover:text-black transition-colors"
              >
                {t('nav.login', { defaultValue: 'Log in' })}
              </button>
              <Button 
                variant="sketch"
                onClick={() => window.location.hash = '#onboarding'}
                className="hidden sm:inline-flex"
              >
                {t('nav.start_free')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-[#fdf9f0] px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="block text-stone-700 font-medium font-headline py-2 hover:text-black transition-colors"
              onClick={(e) => scrollToSection(e, link.href)}
            >
              {link.label}
            </a>
          ))}
          {isLoggedIn ? (
            <Button 
              variant="sketch"
              onClick={() => { window.location.hash = '#dashboard'; setMobileMenuOpen(false); }}
              className="w-full sm:hidden"
            >
              {t('nav.go_dashboard', { defaultValue: 'Dashboard' })}
            </Button>
          ) : (
            <>
              <button
                onClick={() => { window.location.hash = '#login'; setMobileMenuOpen(false); }}
                className="block w-full text-left text-stone-700 font-medium font-headline py-2 hover:text-black transition-colors sm:hidden"
              >
                {t('nav.login', { defaultValue: 'Log in' })}
              </button>
              <Button 
                variant="sketch"
                onClick={() => { window.location.hash = '#onboarding'; setMobileMenuOpen(false); }}
                className="w-full sm:hidden"
              >
                {t('nav.start_free')}
              </Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
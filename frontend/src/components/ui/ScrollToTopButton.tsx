import React, { useState, useEffect } from 'react';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 p-4 bg-tertiary text-white rounded-full shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-black hover:-translate-y-2 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all flex items-center justify-center border-4 border-black"
      aria-label="Scroll to top"
    >
      <span className="material-symbols-outlined font-black">arrow_upward</span>
    </button>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';

export const ClosingCTASection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 bg-tertiary text-white relative overflow-hidden" id="login">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-black/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative z-10">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline mb-4 md:mb-6 tracking-tight">{t("closing.headline")}</h2>
        <p className="text-base md:text-xl mb-6 md:mb-12 text-surface-container-low max-w-2xl mx-auto opacity-90">
          {t("closing.desc")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => window.location.hash = localStorage.getItem('stick_access_token') ? '#dashboard' : '#onboarding'}
            className="group px-6 py-3 md:px-10 md:py-5 bg-white text-black font-bold rounded-full text-base md:text-lg hover:bg-black hover:text-white transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_10px_0_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[0_2px_0_rgba(0,0,0,1)] sketch-border flex items-center gap-3"
          >
            {t("closing.cta")}
            <span className="material-symbols-outlined text-xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </button>
        </div>

        <p className="mt-8 text-sm opacity-80">{t("closing.trial")}</p>
      </div>
    </section>
  );
};
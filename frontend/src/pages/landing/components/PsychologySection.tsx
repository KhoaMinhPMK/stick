import React from 'react';
import { useTranslation } from 'react-i18next';

export const PsychologySection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center mb-8 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline mb-4">{t("psychology.title")}</h2>
        <p className="text-on-surface-variant">{t("psychology.subtitle")}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        <div className="p-5 md:p-8 bg-surface-container sketch-border text-center transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-2 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
          <div className="text-2xl md:text-4xl font-black mb-3 md:mb-4">{t("psychology.f_title")}</div>
          <p className="text-sm">{t("psychology.f_desc")}</p>
        </div>

        <div className="p-5 md:p-8 bg-surface-container sketch-border text-center transition-all duration-300 transform hover:-translate-y-2 hover:rotate-2 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
          <div className="text-2xl md:text-4xl font-black mb-3 md:mb-4">{t("psychology.p_title")}</div>
          <p className="text-sm">{t("psychology.p_desc")}</p>
        </div>

        <div className="p-5 md:p-8 bg-surface-container sketch-border text-center transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-2 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
          <div className="text-2xl md:text-4xl font-black mb-3 md:mb-4">{t("psychology.r_title")}</div>
          <p className="text-sm">{t("psychology.r_desc")}</p>
        </div>

        <div className="p-5 md:p-8 bg-surface-container sketch-border text-center transition-all duration-300 transform hover:-translate-y-2 hover:rotate-2 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white cursor-default">
          <div className="text-2xl md:text-4xl font-black mb-3 md:mb-4">{t("psychology.rep_title")}</div>
          <p className="text-sm">{t("psychology.rep_desc")}</p>
        </div>
      </div>
    </section>
  );
};
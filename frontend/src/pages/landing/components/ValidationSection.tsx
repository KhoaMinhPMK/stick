import React from 'react';
import { useTranslation } from 'react-i18next';
import { NumberCounter } from '../../../components/ui/NumberCounter';

export const ValidationSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 bg-surface-container-high border-y-4 border-black" id="validation">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap justify-center gap-8 md:gap-20">
        
        <div className="text-center">
          <div className="text-4xl sm:text-5xl md:text-7xl font-black font-headline mb-2">
            <NumberCounter end={92} suffix="%" />
          </div>
          <div className="font-bold text-secondary uppercase tracking-widest">{t("validation.stat1")}</div>
        </div>
        
        <div className="text-center">
          <div className="text-4xl sm:text-5xl md:text-7xl font-black font-headline mb-2">
            <NumberCounter end={4.8} decimals={1} suffix="x" />
          </div>
          <div className="font-bold text-secondary uppercase tracking-widest">{t("validation.stat2")}</div>
        </div>
        
        <div className="text-center">
          <div className="text-4xl sm:text-5xl md:text-7xl font-black font-headline mb-2">
            <NumberCounter end={150} suffix="k+" />
          </div>
          <div className="font-bold text-secondary uppercase tracking-widest">{t("validation.stat3")}</div>
        </div>
        
      </div>
    </section>
  );
};
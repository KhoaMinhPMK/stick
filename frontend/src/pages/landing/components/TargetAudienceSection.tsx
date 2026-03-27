import React from 'react';
import { useTranslation } from 'react-i18next';
import { SketchCard } from '../../../components/ui/SketchCard';

export const TargetAudienceSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 max-w-7xl mx-auto px-4 md:px-8">
      <h2 className="text-2xl md:text-4xl font-black font-headline text-center mb-8 md:mb-16">{t("target.headline")}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        
        <SketchCard className="p-5 md:p-8 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] bg-surface-container-low hover:bg-white">
          <h4 className="font-bold text-xl mb-4">{t("target.group1_title")}</h4>
          <p className="text-sm text-on-surface-variant">{t("target.group1_desc")}</p>
        </SketchCard>
        
        <SketchCard className="p-5 md:p-8 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] bg-surface-container-low hover:bg-white">
          <h4 className="font-bold text-xl mb-4">{t("target.group2_title")}</h4>
          <p className="text-sm text-on-surface-variant">{t("target.group2_desc")}</p>
        </SketchCard>
        
        <SketchCard className="p-5 md:p-8 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] bg-surface-container-low hover:bg-white">
          <h4 className="font-bold text-xl mb-4">{t("target.group3_title")}</h4>
          <p className="text-sm text-on-surface-variant">{t("target.group3_desc")}</p>
        </SketchCard>
        
        <SketchCard className="p-5 md:p-8 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[8px_8px_0_rgba(0,0,0,1)] bg-surface-container-low hover:bg-white">
          <h4 className="font-bold text-xl mb-4">{t("target.group4_title")}</h4>
          <p className="text-sm text-on-surface-variant">{t("target.group4_desc")}</p>
        </SketchCard>
        
      </div>
    </section>
  );
};
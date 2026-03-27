import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../../components/ui/Icon';

export const MissionSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="bg-surface-container-low py-12 md:py-24" id="why-stick">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-10 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black font-headline mb-4">{t('mission.headline')}</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            {t('mission.sub')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 md:p-10 bg-white sketch-border transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-2 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-surface-container-low cursor-default">
            <Icon name="workspace_premium" className="text-4xl mb-6 block" />
            <h3 className="text-2xl font-bold font-headline mb-4">{t('mission.q_title')}</h3>
            <p className="text-on-surface-variant">{t('mission.q_desc')}</p>
          </div>
          
          <div className="p-6 md:p-10 bg-white sketch-border -rotate-1 transition-all duration-300 transform hover:-translate-y-2 hover:rotate-1 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-surface-container-low cursor-default">
            <Icon name="public" className="text-4xl mb-6 block" />
            <h3 className="text-2xl font-bold font-headline mb-4">{t('mission.a_title')}</h3>
            <p className="text-on-surface-variant">{t('mission.a_desc')}</p>
          </div>
          
          <div className="p-6 md:p-10 bg-white sketch-border rotate-1 transition-all duration-300 transform hover:-translate-y-2 hover:-rotate-1 hover:shadow-[6px_8px_0_rgba(0,0,0,1)] hover:bg-surface-container-low cursor-default">
            <Icon name="auto_graph" className="text-4xl mb-6 block" />
            <h3 className="text-2xl font-bold font-headline mb-4">{t('mission.s_title')}</h3>
            <p className="text-on-surface-variant">{t('mission.s_desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
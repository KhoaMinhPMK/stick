import React from 'react';
import { useTranslation } from 'react-i18next';

export const AboutUsSection: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section className="py-12 md:py-24 bg-surface-container-high border-b-4 border-black" id="about">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-black font-headline mb-4 md:mb-6">{t("about.badge")}</h2>
            <h3 className="text-2xl font-bold mb-8 text-secondary">
              {t("mission.headline")}
            </h3>
            <div className="space-y-4 md:space-y-6 text-on-surface-variant leading-relaxed text-sm md:text-lg">
              <p>
                {t("about.p1")}
              </p>
              <p>
                {t("about.p2_before")}<strong className="text-black">{t("about.p2_strong")}</strong>{t("about.p2_after")}
              </p>
              <p>
                {t("about.p3")}
              </p>
            </div>
          </div>
          <div className="relative">
            {/* Visual element representing the team */}
            <div className="aspect-square bg-tertiary rounded-3xl sketch-border transform rotate-2 hover:rotate-0 transition-transform duration-500 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
              {/* Decorative shapes behind */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-50 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary opacity-50 rounded-full blur-2xl"></div>
              
              <div className="text-center text-white relative z-10">
                <span className="material-symbols-outlined text-5xl md:text-8xl mb-4 md:mb-6">groups</span>
                <p className="text-xl md:text-3xl font-black font-headline" dangerouslySetInnerHTML={{ __html: t("about.headline") }}></p>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute top-[-20px] lg:top-10 right-[-10px] lg:-right-12 bg-secondary text-white font-bold py-3 px-8 rounded-full transform rotate-12 sketch-border hover:rotate-6 transition-transform shadow-[4px_4px_0_rgba(0,0,0,1)] z-20">
              {t("about.hello")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
import React from 'react';
import { useTranslation } from 'react-i18next';

interface StaticPageProps {
  type: 'terms' | 'privacy' | 'help' | 'about';
}

const pageConfig = {
  terms: {
    icon: 'gavel',
    titleKey: 'static_pages.terms_title',
    sections: [
      { heading: 'static_pages.terms_s1_title', content: 'static_pages.terms_s1_content' },
      { heading: 'static_pages.terms_s2_title', content: 'static_pages.terms_s2_content' },
      { heading: 'static_pages.terms_s3_title', content: 'static_pages.terms_s3_content' },
    ],
  },
  privacy: {
    icon: 'shield',
    titleKey: 'static_pages.privacy_title',
    sections: [
      { heading: 'static_pages.privacy_s1_title', content: 'static_pages.privacy_s1_content' },
      { heading: 'static_pages.privacy_s2_title', content: 'static_pages.privacy_s2_content' },
      { heading: 'static_pages.privacy_s3_title', content: 'static_pages.privacy_s3_content' },
    ],
  },
  help: {
    icon: 'help',
    titleKey: 'static_pages.help_title',
    sections: [
      { heading: 'static_pages.help_s1_title', content: 'static_pages.help_s1_content' },
      { heading: 'static_pages.help_s2_title', content: 'static_pages.help_s2_content' },
      { heading: 'static_pages.help_s3_title', content: 'static_pages.help_s3_content' },
    ],
  },
  about: {
    icon: 'info',
    titleKey: 'static_pages.about_title',
    sections: [
      { heading: 'static_pages.about_s1_title', content: 'static_pages.about_s1_content' },
      { heading: 'static_pages.about_s2_title', content: 'static_pages.about_s2_content' },
      { heading: 'static_pages.about_s3_title', content: 'static_pages.about_s3_content' },
    ],
  },
};

export const StaticPage: React.FC<StaticPageProps> = ({ type }) => {
  const { t } = useTranslation();
  const config = pageConfig[type];

  return (
    <div className="bg-surface text-on-surface min-h-[100dvh] w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-8 md:py-16">
        {/* Back */}
        <button onClick={() => window.history.back()} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-6 group">
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-headline font-bold text-xs md:text-sm">{t('static_pages.back')}</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <div className="w-12 h-12 md:w-14 md:h-14 sketch-border rounded-xl flex items-center justify-center bg-surface-container">
            <span className="material-symbols-outlined text-xl md:text-2xl">{config.icon}</span>
          </div>
          <h1 className="font-headline font-extrabold text-2xl md:text-4xl tracking-tight -rotate-1">{t(config.titleKey)}</h1>
        </div>

        {/* Last Updated */}
        <p className="text-on-surface-variant text-xs md:text-sm mb-8 border-b border-black/10 pb-4">
          {t('static_pages.last_updated', { date: 'March 2026' })}
        </p>

        {/* Content Sections */}
        <div className="space-y-8 md:space-y-10">
          {config.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-headline font-bold text-base md:text-xl mb-3 flex items-center gap-2">
                <span className="text-primary font-black text-lg md:text-2xl">{idx + 1}.</span>
                {t(section.heading)}
              </h3>
              <p className="text-on-surface-variant text-sm md:text-base leading-relaxed font-body">
                {t(section.content)}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 md:mt-16 pt-6 border-t border-black/10 text-center">
          <p className="text-xs md:text-sm text-on-surface-variant">
            {t('static_pages.contact')}: <a href="mailto:hello@stick.app" className="text-primary font-bold hover:underline">hello@stick.app</a>
          </p>
        </div>
      </div>
    </div>
  );
};

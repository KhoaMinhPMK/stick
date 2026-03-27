import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const ErrorPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppLayout activePath="">
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg md:max-w-2xl w-full text-center flex flex-col items-center">
          {/* Illustration */}
          <div className="mb-8 md:mb-12 relative">
            <div className="w-48 h-48 md:w-72 md:h-72 flex items-center justify-center">
              <div className="relative">
                <span className="material-symbols-outlined text-[80px] md:text-[120px] text-black/20">sentiment_stressed</span>
                <div className="absolute -top-2 -right-4 md:-top-4 md:-right-8">
                  <span className="material-symbols-outlined text-stone-400 text-3xl md:text-5xl opacity-50">question_mark</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Messaging */}
          <div className="space-y-3 md:space-y-6">
            <h2 className="font-headline font-black text-3xl md:text-5xl lg:text-6xl tracking-tight text-primary -rotate-[1.5deg]">
              {t('error_page.title')}
            </h2>
            <p className="font-body text-base md:text-xl text-stone-600 max-w-md mx-auto leading-relaxed px-4">
              {t('error_page.description')}
            </p>
          </div>

          {/* Recovery Actions */}
          <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 md:gap-6">
            <button
              onClick={() => window.location.reload()}
              className="group relative flex items-center gap-3 md:gap-4 px-8 md:px-12 py-3.5 md:py-5 bg-surface-container-highest border-3 md:border-4 border-black rounded-full font-headline font-extrabold text-lg md:text-2xl transition-all active:scale-95 hover:bg-secondary-container"
            >
              {t('error_page.retry')}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">refresh</span>
            </button>
            <a
              href="#app"
              className="font-headline font-bold text-base md:text-lg text-primary border-b-3 md:border-b-4 border-black pb-1 hover:text-stone-600 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base md:text-lg">arrow_back</span>
              {t('error_page.go_home')}
            </a>
          </div>

          {/* Error Code */}
          <div className="mt-12 md:mt-20 pt-6 md:pt-10 border-t-2 border-stone-200 border-dashed w-48 md:w-64 mx-auto">
            <p className="text-stone-400 font-label text-[10px] md:text-xs uppercase tracking-widest">Error Code: STICK_SMUDGE_404</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

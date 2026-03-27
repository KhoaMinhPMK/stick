import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const SkeletonLoadingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AppLayout activePath="#app">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
        {/* Page Title skeleton */}
        <div className="mb-4">
          <h2 className="font-headline font-bold text-xl md:text-2xl text-on-surface-variant/50">{t('skeleton.title')}</h2>
        </div>

        {/* Hero Skeleton */}
        <section className="w-full">
          <div className="sketch-card bg-surface-container-low p-6 md:p-10 h-40 md:h-64 flex flex-col justify-end space-y-3 md:space-y-4">
            <div className="h-8 md:h-10 w-1/3 bg-surface-container-highest rounded-full animate-pulse" />
            <div className="h-5 md:h-6 w-1/2 bg-surface-container-highest rounded-full animate-pulse opacity-60" />
          </div>
        </section>

        {/* Bento Grid Skeleton */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          {/* Large Card */}
          <div className="lg:col-span-8 sketch-card bg-surface-container-low p-5 md:p-8 h-64 md:h-96 flex flex-col space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-6 md:h-8 w-32 md:w-40 bg-surface-container-highest rounded-full animate-pulse" />
              <div className="h-6 md:h-8 w-6 md:w-8 bg-surface-container-highest rounded-full animate-pulse" />
            </div>
            <div className="flex-1 space-y-3 md:space-y-4">
              <div className="h-3 md:h-4 w-full bg-surface-container-highest rounded-full animate-pulse" />
              <div className="h-3 md:h-4 w-full bg-surface-container-highest rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="h-3 md:h-4 w-3/4 bg-surface-container-highest rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
            <div className="h-10 md:h-12 w-28 md:w-32 bg-secondary-container opacity-40 rounded-full sketch-border self-end" />
          </div>
          {/* Side Column */}
          <div className="lg:col-span-4 flex flex-col gap-4 md:gap-8">
            <div className="sketch-card bg-surface-container-low p-4 md:p-6 h-32 md:h-44 flex flex-col gap-3 md:gap-4">
              <div className="h-5 md:h-6 w-20 md:w-24 bg-surface-container-highest rounded-full animate-pulse" />
              <div className="flex-1 bg-surface-container-highest rounded-lg animate-pulse opacity-40 [animation-delay:0.3s]" />
            </div>
            <div className="sketch-card bg-surface-container-low p-4 md:p-6 h-32 md:h-44 flex flex-col gap-3 md:gap-4">
              <div className="h-5 md:h-6 w-20 md:w-24 bg-surface-container-highest rounded-full animate-pulse [animation-delay:0.5s]" />
              <div className="flex-1 bg-surface-container-highest rounded-lg animate-pulse opacity-40 [animation-delay:0.7s]" />
            </div>
          </div>
        </section>

        {/* List View Skeleton */}
        <section className="space-y-4 md:space-y-6">
          <h3 className="font-headline text-base md:text-xl font-bold -rotate-1 text-on-surface-variant/50">{t('skeleton.getting_ready')}</h3>
          <div className="space-y-3 md:space-y-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="p-4 md:p-6 rounded-lg bg-surface-container-low border-b-4 border-surface-container-highest flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`w-10 h-10 md:w-12 md:h-12 bg-surface-container-highest rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                  <div className="space-y-1.5 md:space-y-2">
                    <div className={`h-3 md:h-4 w-32 md:w-48 bg-surface-container-highest rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                    <div className={`h-2.5 md:h-3 w-24 md:w-32 bg-surface-container-highest rounded-full animate-pulse opacity-60`} style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
                  </div>
                </div>
                <div className={`h-6 md:h-8 w-16 md:w-20 bg-surface-container-highest rounded-full animate-pulse`} style={{ animationDelay: `${i * 0.3}s` }} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

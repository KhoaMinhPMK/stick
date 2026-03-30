import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api/client';
import { saveOnboardingState } from '../../services/api/onboarding';

export const LevelSelectionPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const levels = [
    { id: 'beginner', icon: 'child_care', titleKey: 'level_selection.levels.beginner.title', descKey: 'level_selection.levels.beginner.desc' },
    { id: 'elementary', icon: 'face', titleKey: 'level_selection.levels.elementary.title', descKey: 'level_selection.levels.elementary.desc' },
    { id: 'pre_intermediate', icon: 'directions_walk', titleKey: 'level_selection.levels.pre_intermediate.title', descKey: 'level_selection.levels.pre_intermediate.desc' },
    { id: 'intermediate', icon: 'directions_run', titleKey: 'level_selection.levels.intermediate.title', descKey: 'level_selection.levels.intermediate.desc' },
    { id: 'not_sure', icon: 'help_outline', titleKey: 'level_selection.levels.not_sure.title', descKey: 'level_selection.levels.not_sure.desc', isFullWidth: true },
  ];

  const handleContinue = async () => {
    if (!selectedLevel) return;

    setError('');
    setIsSaving(true);
    try {
      await saveOnboardingState({
        step: 1,
        level: selectedLevel,
      });
      window.location.hash = '#schedule';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to save level selection');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface h-[100dvh] w-full overflow-hidden flex flex-col relative">
      {/* Decorative Images (xl only) */}
      <div className="absolute top-16 left-8 hidden xl:block opacity-10 animate-fade-in delay-300 pointer-events-none z-0">
        <span className="material-symbols-outlined text-[60px] text-primary rotate-12">school</span>
      </div>
      <div className="absolute bottom-16 right-8 hidden xl:block opacity-10 animate-fade-in delay-500 pointer-events-none z-0">
        <span className="material-symbols-outlined text-[90px] text-primary">trending_up</span>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center px-4 sm:px-6 py-4 sm:py-6 md:py-8 relative z-10 min-h-0">
        
        {/* Header */}
        <div className="flex-shrink-0 w-full text-center mb-4 sm:mb-5 md:mb-8 z-10 relative animate-fade-in-up">
          <h1 className="font-headline font-extrabold text-xl sm:text-2xl md:text-4xl lg:text-5xl text-primary mb-1 md:mb-2 tracking-tight inline-block transform -rotate-1">
            {t('level_selection.title')}
          </h1>
          <p className="font-body text-[11px] sm:text-xs md:text-base text-secondary max-w-xl mx-auto font-medium leading-tight">
            {t('level_selection.subtitle')}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="w-full flex-1 flex flex-col justify-center min-h-0 animate-fade-in-up delay-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-2.5 md:gap-4 w-full">
            {levels.map((level) => {
              const isActive = selectedLevel === level.id;
              const isNotSure = level.id === 'not_sure';
              
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className={`sketch-border w-full flex text-left transition-all duration-300 relative group
                    p-2.5 sm:p-3 md:p-5
                    flex-row ${isNotSure ? 'md:flex-row md:justify-center' : 'md:flex-col'} items-center
                    gap-2.5 sm:gap-3 md:gap-3
                    ${isActive 
                      ? 'bg-secondary-container transform scale-[0.98] shadow-[2px_2px_0_rgba(0,0,0,1)] md:shadow-[3px_3px_0_rgba(0,0,0,1)] -rotate-1' 
                      : 'bg-surface-container-lowest hover:-translate-y-1 hover:-rotate-1 hover:shadow-[3px_4px_0_rgba(0,0,0,1)] md:hover:shadow-[4px_6px_0_rgba(0,0,0,1)]'
                    }
                    ${isNotSure ? 'md:col-span-2' : ''}
                  `}
                >
                  <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 md:w-auto md:h-auto 
                    bg-surface-container-high md:bg-transparent rounded-full md:rounded-none group-hover:scale-110 transition-transform`}>
                    <span className={`material-symbols-outlined text-primary ${isNotSure ? 'text-xl sm:text-2xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'}`}>
                      {level.icon}
                    </span>
                  </div>

                  <div className={`flex-1 min-w-0 flex flex-col justify-center ${isNotSure ? 'md:items-start md:text-left' : 'md:items-center md:text-center'}`}>
                    <h3 className="font-headline font-bold text-[13px] sm:text-sm md:text-lg text-primary leading-tight mb-0 md:mb-1 truncate md:whitespace-normal">
                      {t(level.titleKey)}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] md:text-xs text-on-surface-variant font-medium leading-snug line-clamp-2 md:line-clamp-none">
                      {t(level.descKey)}
                    </p>
                  </div>
                  
                  {isActive && (
                    <div className="flex-shrink-0 absolute right-2.5 md:right-auto md:static md:mt-1">
                      <span className="material-symbols-outlined text-primary text-lg md:text-2xl drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex-shrink-0 w-full flex justify-center mt-4 sm:mt-5 md:mt-6 pb-1 md:pb-2 animate-fade-in-up delay-400">
          <div className="max-w-3xl w-full flex items-center justify-center md:justify-between bg-surface-container-low border-2 border-primary rounded-full px-4 md:px-6 py-2 md:py-3 shadow-[3px_3px_0px_rgba(0,0,0,1)] md:shadow-xl">
            <div className="hidden md:flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              <span className="text-xs font-medium text-secondary">{t('level_selection.info')}</span>
            </div>
            
            <button 
              onClick={handleContinue}
              disabled={!selectedLevel || isSaving}
              className={`w-full md:w-auto px-6 md:px-8 py-2 md:py-2.5 rounded-full font-headline font-extrabold text-sm md:text-base flex items-center justify-center gap-2 transition-all 
                ${selectedLevel 
                  ? 'bg-primary text-on-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed border-2 border-dashed border-outline-variant'
                }
              `}
            >
              {t('level_selection.continue')}
              <span className="material-symbols-outlined text-base md:text-lg" style={{ fontVariationSettings: "'wght' 600" }}>arrow_forward</span>
            </button>
          </div>
          {error && (
            <p className="mt-3 text-error text-xs md:text-sm font-bold text-center">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
};

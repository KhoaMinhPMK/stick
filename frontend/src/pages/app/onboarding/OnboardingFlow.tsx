import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import logoUrl from '../../../assets/logo.svg';

type OnboardingFlowProps = {
  stepIndex: number;
};

const HASH_BY_STEP = ['#onboarding', '#onboarding-2', '#onboarding-3', '#onboarding-4'];
const TOTAL_STEPS = 4;

const clampStep = (value: number) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > TOTAL_STEPS - 1) return TOTAL_STEPS - 1;
  return value;
};

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ stepIndex }) => {
  const { t } = useTranslation();
  const safeStep = clampStep(stepIndex);
  const previousStepRef = useRef(safeStep);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    if (safeStep === previousStepRef.current) return;
    setDirection(safeStep > previousStepRef.current ? 'forward' : 'backward');
    previousStepRef.current = safeStep;
  }, [safeStep]);

  const stepLabel = useMemo(
    () => t('onboarding.step_of', { current: safeStep + 1, total: TOTAL_STEPS }),
    [safeStep, t],
  );
  const progressPercent = useMemo(() => ((safeStep + 1) / TOTAL_STEPS) * 100, [safeStep]);

  const goToStep = (nextStep: number) => {
    const normalized = clampStep(nextStep);
    window.location.hash = HASH_BY_STEP[normalized];
  };

  const handleNext = () => {
    if (safeStep >= TOTAL_STEPS - 1) {
      window.location.hash = '#level';
      return;
    }
    goToStep(safeStep + 1);
  };

  const handleBack = () => {
    if (safeStep <= 0) return;
    goToStep(safeStep - 1);
  };

  const handleSkip = () => {
    window.location.hash = '#level';
  };
  const handleGoToLanding = () => {
    window.location.hash = '';
  };

  const transitionClass = direction === 'forward' ? 'animate-onboarding-in-right' : 'animate-onboarding-in-left';

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <div className="h-full min-h-0 flex flex-col items-center justify-center text-center">
          <div className="w-full flex-1 min-h-0 flex items-center justify-center animate-fade-in-up delay-100 opacity-0-init">
            <img
              alt={t('onboarding.step1.illustration_alt')}
              className="w-auto h-auto max-h-[min(24vh,220px)] sm:max-h-[min(28vh,220px)] object-contain opacity-90"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCO27qxX-wAOvvSdlYzerH1sfC9D8lEbkR8x5KmVLCn6GnbmG6GbCw7ocmeRTeNCB0qEZmOULFAf9IkhvFKTkj0K8Y1s1LdQCSDRzUhh-XUZqlEnNxamIXuD3yXx0RoulpmQ9QwGr2OEM9Lnj6W3b4gyXhHK74XA-ghVW_ECEevfUNjcSOi_nuHP0K1kB0daZ3EztALh_b7e4ftUyO-MgCCIwEt_6UPl_voLe31gRiismjf3sR0ChRHPuQfm5-1FHCvZffmb9PuIaUy"
            />
          </div>
          <div className="space-y-2 md:space-y-4 animate-fade-in-up delay-200 opacity-0-init">
            <h1 className="font-headline font-extrabold text-[clamp(1.55rem,5.8vw,3rem)] text-primary tracking-tight px-2 transform -rotate-1 leading-tight">
              {t('onboarding.step1.title')}
            </h1>
            <p className="font-body text-[clamp(0.85rem,2.6vw,1.25rem)] text-on-surface-variant max-w-md mx-auto leading-snug sm:leading-relaxed px-4">
              {t('onboarding.step1.description')}
            </p>
          </div>
          <p className="mt-3 md:mt-5 font-label text-[11px] sm:text-xs md:text-sm text-on-surface-variant/60 flex items-center gap-1 md:gap-2">
            <span className="material-symbols-outlined text-[16px] md:text-[20px]">info</span>
            {t('onboarding.step1.info')}
          </p>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="w-full flex flex-col items-center justify-center relative min-h-[220px] md:min-h-0">
            <div className="relative w-[60vw] max-w-[200px] md:w-full md:max-w-sm aspect-square bg-surface-container-low rounded-full flex items-center justify-center border-2 border-dashed border-outline-variant">
              <div className="absolute top-0 md:top-4 -left-4 md:left-0 bg-surface-container-highest animate-fade-in-up delay-200 opacity-0-init p-2 md:p-4 border-2 border-primary rounded-lg transform -rotate-1 shadow-sm max-w-[120px] md:max-w-[200px] z-10">
                <p className="text-[12px] md:text-sm font-medium italic text-on-surface-variant">"{t('onboarding.step2.bad_example')}"</p>
              </div>

              <div className="flex flex-col items-center justify-center animate-fade-in delay-100 opacity-0-init">
                <span className="material-symbols-outlined text-[70px] md:text-[120px] text-primary">smart_toy</span>
              </div>

              <div className="absolute bottom-2 md:bottom-8 -right-4 md:-right-4 bg-tertiary-container animate-fade-in-up delay-400 opacity-0-init text-on-tertiary-container p-3 md:p-5 border-[2px] md:border-[3px] border-primary rounded-lg transform rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-[160px] md:max-w-[220px] z-10">
                <div className="flex items-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <span
                    className="material-symbols-outlined text-[10px] md:text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{t('onboarding.step2.natural_label')}</span>
                </div>
                <p className="text-sm md:text-lg animate-fade-in-up delay-300 opacity-0-init font-headline font-bold leading-tight">
                  "{t('onboarding.step2.natural_text')}"
                </p>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col justify-center min-h-0">
            <h2 className="font-headline text-3xl animate-fade-in-up delay-200 opacity-0-init md:text-4xl lg:text-5xl font-extrabold text-primary mb-3 md:mb-6 leading-none tracking-tight">
              {t('onboarding.step2.title')}
            </h2>
            <p className="text-sm md:text-lg lg:text-xl text-on-surface-variant leading-relaxed max-w-lg">
              {t('onboarding.step2.description')}
            </p>
            <div className="mt-5 md:mt-8 text-left">
              <p className="text-[10px] md:text-sm italic text-on-surface-variant/60">"{t('onboarding.step2.quote')}"</p>
            </div>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 mb-4 sm:mb-6 md:mb-8 flex items-center justify-center bg-surface-container-low rounded-full border-2 border-outline-variant/20 animate-fade-in-up delay-300 opacity-0-init shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary text-[60px] sm:text-[80px] md:text-[100px] opacity-10"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                person
              </span>
            </div>

            <div className="relative flex flex-col items-center transition-transform duration-300">
              <div className="mb-1.5 sm:mb-2 md:mb-3 bg-secondary-container p-2 sm:p-3 md:p-5 rounded-full border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl md:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mic
                </span>
              </div>

              <div className="flex gap-1 md:gap-1.5 items-center h-3 sm:h-4 md:h-6">
                <span className="w-1 md:w-1.5 h-1.5 sm:h-2 md:h-3 bg-primary rounded-full animate-progress-fill" style={{ animationDuration: '0.4s' }}></span>
                <span className="w-1 md:w-1.5 h-3 sm:h-4 md:h-6 bg-primary rounded-full animate-progress-fill delay-100" style={{ animationDuration: '0.5s' }}></span>
                <span className="w-1 md:w-1.5 h-2 sm:h-3 md:h-4 bg-primary rounded-full animate-progress-fill delay-200" style={{ animationDuration: '0.6s' }}></span>
                <span className="w-1 md:w-1.5 h-4 sm:h-5 md:h-7 bg-primary rounded-full animate-progress-fill delay-300" style={{ animationDuration: '0.5s' }}></span>
                <span className="w-1 md:w-1.5 h-2 sm:h-3 md:h-4 bg-primary rounded-full animate-progress-fill delay-100" style={{ animationDuration: '0.4s' }}></span>
                <span className="w-1 md:w-1.5 h-3 sm:h-4 md:h-5 bg-primary rounded-full animate-progress-fill delay-200" style={{ animationDuration: '0.6s' }}></span>
              </div>
            </div>
          </div>

          <div className="space-y-1 sm:space-y-2 md:space-y-4 max-w-lg animate-fade-in-up delay-400 opacity-0-init shrink-0">
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-primary tracking-tight inline-block transform -rotate-1">
              {t('onboarding.step3.title')}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-surface-variant leading-tight sm:leading-relaxed font-medium px-2">
              {t('onboarding.step3.description')}
            </p>
          </div>

          <div className="mt-4 sm:mt-6 md:mt-8 p-2 sm:p-3 bg-surface-container rounded-lg border-[1.5px] sm:border-2 border-dashed border-primary/30 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 w-[95%] sm:w-[90%] md:w-auto animate-fade-in-up delay-500 opacity-0-init shrink-0">
            <span className="material-symbols-outlined text-tertiary text-base sm:text-lg md:text-xl">lightbulb</span>
            <span className="text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant text-center">
              {t('onboarding.step3.tip')}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-sm mb-6 md:mb-10 flex justify-center shrink-0 animate-fade-in-up delay-300 opacity-0-init">
          <div className="relative w-48 h-36 md:w-64 md:h-48 border-b-[3px] border-primary flex items-end justify-between px-2 md:px-4">
            <div className="flex items-end gap-1.5 md:gap-2 w-full h-full relative">
              <div className="absolute bottom-1 left-[50%] md:left-[55%] flex flex-col items-center animate-fade-in-up delay-[600ms] opacity-0-init">
                <span className="material-symbols-outlined text-4xl md:text-5xl text-primary transform -rotate-12" style={{ fontVariationSettings: "'FILL' 0" }}>
                  directions_run
                </span>
              </div>

              <div className="absolute bottom-1 right-1 md:right-2 flex flex-col items-center animate-scale-in delay-[700ms] opacity-0-init z-10">
                <span className="material-symbols-outlined text-4xl md:text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  flag
                </span>
              </div>

              <div className="flex gap-1.5 md:gap-2 w-full items-end pb-1 overflow-hidden h-full">
                <div className="w-6 md:w-8 h-[20%] border-2 border-primary rounded-sm md:rounded-md bg-secondary-container animate-scale-in delay-[300ms] opacity-0-init"></div>
                <div className="w-6 md:w-8 h-[40%] border-2 border-primary rounded-sm md:rounded-md bg-secondary-container animate-scale-in delay-[400ms] opacity-0-init"></div>
                <div className="w-6 md:w-8 h-[30%] border-2 border-primary rounded-sm md:rounded-md bg-secondary-container animate-scale-in delay-[500ms] opacity-0-init"></div>
                <div className="w-6 md:w-8 h-[55%] border-2 border-primary rounded-sm md:rounded-md bg-secondary-container animate-scale-in delay-[600ms] opacity-0-init"></div>
                <div className="w-6 md:w-8 h-[50%] border-2 border-primary rounded-sm md:rounded-md bg-surface-variant opacity-50 animate-scale-in delay-[700ms] opacity-0-init"></div>
                <div className="w-6 md:w-8 h-[75%] border-2 border-primary rounded-sm md:rounded-md bg-surface-variant opacity-30 animate-scale-in delay-[800ms] opacity-0-init"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center max-w-lg mb-6 md:mb-8 shrink-0 animate-fade-in-up delay-[600ms] opacity-0-init space-y-2 md:space-y-4">
          <h2 className="font-headline font-extrabold text-3xl md:text-4xl lg:text-5xl text-primary tracking-tight leading-tight transform -rotate-1 inline-block">
            {t('onboarding.step4.title')}
          </h2>
          <p className="text-sm md:text-lg text-on-surface-variant leading-relaxed font-medium">
            {t('onboarding.step4.description_line1')}
            <br className="hidden md:block" />
            {t('onboarding.step4.description_line2_prefix')}{' '}
            <span className="text-primary font-bold underline decoration-4 decoration-secondary-container underline-offset-2 md:underline-offset-4">
              {t('onboarding.step4.description_highlight')}
            </span>{' '}
            {t('onboarding.step4.description_line2_suffix')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface font-body text-on-surface h-[100dvh] overflow-hidden relative">
      <header className="fixed top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-20 animate-fade-in-up opacity-0-init delay-100">
        <button
          type="button"
          onClick={handleGoToLanding}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          aria-label="Back to landing page"
        >
          <img src={logoUrl} alt="STICK Logo" className="h-7 md:h-10 object-contain" />
          <span className="font-headline font-black text-2xl md:text-3xl tracking-tighter italic">STICK</span>
        </button>
        <div className="flex items-center gap-3 md:gap-4">
          <span className="font-label text-xs md:text-sm text-on-surface-variant font-medium uppercase tracking-widest">
            {stepLabel}
          </span>
          <div className="w-24 md:w-36 h-2 md:h-3 bg-surface-container-highest rounded-full overflow-hidden border-[1.5px] md:border-2 border-primary">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      <main className="h-full flex flex-col items-center justify-center p-4 md:p-8 pt-20 md:pt-24 pb-4 relative">
        <div className="w-full max-w-5xl h-full max-h-[900px] flex flex-col min-h-0">
          <section
            className="w-full bg-surface-container-lowest border-[3px] border-primary rounded-[2rem] p-5 md:p-10 flex flex-col flex-1 min-h-0 overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            style={{ borderRadius: '2rem 1rem 2.2rem 1.2rem / 1.2rem 2.2rem 1rem 2rem' }}
          >
            <div key={safeStep} className={`w-full h-full flex flex-col min-h-0 ${transitionClass}`}>
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5 shrink-0">
                {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
                  const isActive = idx <= safeStep;
                  return (
                    <div
                      key={idx}
                      className={`h-2 rounded-full border-2 border-primary transition-all duration-300 ${
                        idx === safeStep ? 'w-10 md:w-12' : 'w-6 md:w-8'
                      } ${isActive ? 'bg-primary' : 'bg-surface-variant'}`}
                    ></div>
                  );
                })}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full onboarding-step-content-fit pr-1 md:pr-2">{renderStepContent(safeStep)}</div>
              </div>
            </div>
          </section>

          <div className="mt-4 md:mt-6 flex flex-col-reverse md:flex-row items-center justify-between gap-3 md:gap-4 px-1 md:px-2 animate-fade-in-up delay-400 opacity-0-init shrink-0">
            <div className="w-full md:w-auto flex items-center justify-start gap-2">
              {safeStep > 0 ? (
                <button
                  onClick={handleBack}
                  className="text-on-surface-variant font-label font-bold hover:text-primary transition-colors py-2 md:py-3 px-5 md:px-6 underline-offset-4 hover:underline w-full md:w-auto flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  {t('onboarding.actions.back')}
                </button>
              ) : (
                <div className="hidden md:block w-[96px]"></div>
              )}
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-center justify-end">
              <button
                onClick={handleSkip}
                className="w-full sm:w-auto py-2 md:py-3 px-5 md:px-6 text-on-surface-variant font-label font-bold hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {t('onboarding.actions.skip')}
              </button>
              <button
                onClick={handleNext}
                className="group w-full sm:w-auto min-w-[170px] px-7 md:px-10 py-2.5 md:py-3.5 bg-surface-container sketch-border flex justify-center items-center gap-2 text-center transition-all duration-300 transform hover:-translate-y-1 hover:-rotate-1 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-white active:translate-y-0 active:rotate-0"
              >
                <span className="font-headline font-black text-base md:text-xl text-primary uppercase tracking-tight">
                  {safeStep === TOTAL_STEPS - 1 ? t('onboarding.actions.continue') : t('onboarding.actions.next')}
                </span>
                <span className="material-symbols-outlined text-lg md:text-2xl text-primary group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

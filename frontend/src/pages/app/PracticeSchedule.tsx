import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api/client';
import { saveOnboardingState } from '../../services/api/onboarding';

interface TimeSlot {
  id: string;
  icon: string;
  titleKey: string;
  timeKey: string;
  filled?: boolean;
}

interface SessionLength {
  id: string;
  labelKey: string;
  tagKey: string;
}

export const PracticeSchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string>('10min');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const timeSlots: TimeSlot[] = [
    { id: 'morning', icon: 'light_mode', titleKey: 'schedule.times.morning.title', timeKey: 'schedule.times.morning.time' },
    { id: 'afternoon', icon: 'sunny', titleKey: 'schedule.times.afternoon.title', timeKey: 'schedule.times.afternoon.time' },
    { id: 'evening', icon: 'dark_mode', titleKey: 'schedule.times.evening.title', timeKey: 'schedule.times.evening.time', filled: true },
    { id: 'custom', icon: 'schedule', titleKey: 'schedule.times.custom.title', timeKey: 'schedule.times.custom.time' },
  ];

  const sessionLengths: SessionLength[] = [
    { id: '5min', labelKey: 'schedule.lengths.short.label', tagKey: 'schedule.lengths.short.tag' },
    { id: '10min', labelKey: 'schedule.lengths.standard.label', tagKey: 'schedule.lengths.standard.tag' },
    { id: 'flexible', labelKey: 'schedule.lengths.flexible.label', tagKey: 'schedule.lengths.flexible.tag' },
  ];

  const handleContinue = async () => {
    if (!selectedTime) return;

    setError('');
    setIsSaving(true);
    try {
      await saveOnboardingState({
        step: 2,
        schedule: `${selectedTime}:${selectedLength}`,
      });
      window.location.hash = '#goal';
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to save schedule');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-[100dvh] w-full overflow-x-hidden flex flex-col relative">
      {/* Background Decorative Elements */}
      <div className="fixed top-20 right-10 md:right-20 pointer-events-none opacity-10 md:opacity-20 z-0">
        <span className="material-symbols-outlined text-[80px] md:text-[200px] rotate-12">edit</span>
      </div>
      <div className="fixed bottom-20 left-10 md:left-20 pointer-events-none opacity-5 md:opacity-10 z-0">
        <span className="material-symbols-outlined text-[60px] md:text-[150px] -rotate-12">alarm</span>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 relative z-10">
        
        {/* Header */}
        <div className="w-full text-center mb-6 sm:mb-8 md:mb-12 animate-fade-in-up">
          <h2 className="font-headline text-xl sm:text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 md:mb-4 transform -rotate-1">
            {t('schedule.title')}
          </h2>
          <div className="flex items-center justify-center gap-2 md:gap-4 text-tertiary font-medium bg-tertiary-container/10 py-2 px-4 md:py-3 md:px-6 rounded-full inline-flex mx-auto border-2 border-tertiary-container">
            <span className="material-symbols-outlined text-base md:text-xl">info</span>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg leading-tight">{t('schedule.tip')}</p>
          </div>
        </div>

        {/* Time Slots */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full mb-8 sm:mb-10 md:mb-16 animate-fade-in-up delay-200">
          {timeSlots.map((slot) => {
            const isActive = selectedTime === slot.id;
            return (
              <button
                key={slot.id}
                onClick={() => setSelectedTime(slot.id)}
                className={`group relative sketch-border p-4 sm:p-5 md:p-8 flex flex-col items-center gap-2 sm:gap-3 md:gap-4 transition-all duration-300
                  ${isActive
                    ? 'bg-secondary-container ring-2 md:ring-4 ring-black ring-offset-2 md:ring-offset-4 -translate-y-1'
                    : 'bg-surface-container-lowest hover:bg-secondary-container hover:-translate-y-1'
                  }
                `}
              >
                <span
                  className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl"
                  style={slot.filled || isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {slot.icon}
                </span>
                <span className="font-headline text-sm sm:text-base md:text-xl font-bold">{t(slot.titleKey)}</span>
                <span className="text-[10px] sm:text-xs md:text-sm opacity-60">{t(slot.timeKey)}</span>
                
                {isActive && (
                  <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-black text-white rounded-full p-0.5 md:p-1">
                    <span className="material-symbols-outlined text-xs md:text-sm">check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Session Length */}
        <div className="w-full mb-8 sm:mb-10 md:mb-16 animate-fade-in-up delay-300">
          <h3 className="font-headline text-base sm:text-lg md:text-2xl font-bold mb-4 sm:mb-6 md:mb-8 text-center underline decoration-2 md:decoration-4 underline-offset-4 md:underline-offset-8">
            {t('schedule.session_title')}
          </h3>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-8">
            {sessionLengths.map((len) => {
              const isActive = selectedLength === len.id;
              return (
                <button
                  key={len.id}
                  onClick={() => setSelectedLength(len.id)}
                  className={`sketch-border-subtle px-5 sm:px-6 md:px-10 py-3 sm:py-4 md:py-6 flex flex-col items-center gap-1 md:gap-2 transition-all duration-300 cursor-pointer
                    ${isActive
                      ? 'bg-secondary-container scale-105'
                      : 'bg-surface-container hover:bg-secondary-container/50'
                    }
                  `}
                >
                  <span className="font-headline text-base sm:text-lg md:text-2xl font-black">{t(len.labelKey)}</span>
                  <span className="text-[9px] sm:text-[10px] md:text-xs uppercase tracking-widest opacity-60">{t(len.tagKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-16 animate-fade-in delay-400">
          <div className="relative w-48 md:w-64 h-24 md:h-32 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-80 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[80px] text-primary/20">schedule</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center animate-fade-in-up delay-500">
          <button
            onClick={handleContinue}
            disabled={!selectedTime || isSaving}
            className={`group flex items-center gap-2 md:gap-4 px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-6 rounded-full border-[3px] border-black transition-all active:scale-95
              ${selectedTime
                ? 'bg-surface-container-highest hover:bg-secondary-container hover:translate-x-1 md:hover:translate-x-2 cursor-pointer'
                : 'bg-surface-variant/50 cursor-not-allowed border-dashed opacity-60'
              }
            `}
          >
            <span className="font-headline text-lg sm:text-xl md:text-3xl font-black tracking-tight">{t('schedule.continue')}</span>
            <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl group-hover:translate-x-1 md:group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
          </button>
        </div>
        {error && (
          <p className="mt-3 text-error text-xs md:text-sm font-bold text-center">{error}</p>
        )}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const timeSlots = [
  { time: '08:00', labelKey: 'reminders.morning' },
  { time: '12:30', labelKey: 'reminders.lunch' },
  { time: '20:00', labelKey: 'reminders.evening' },
];

const tones = [
  { nameKey: 'reminders.tone_gentle', descKey: 'reminders.tone_gentle_desc' },
  { nameKey: 'reminders.tone_playful', descKey: 'reminders.tone_playful_desc' },
  { nameKey: 'reminders.tone_energetic', descKey: 'reminders.tone_energetic_desc' },
];

export const RemindersPage: React.FC = () => {
  const { t } = useTranslation();
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [selectedTime, setSelectedTime] = useState(1);
  const [selectedTone, setSelectedTone] = useState(0);
  const [showSaved, setShowSaved] = useState(false);

  const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      onClick={onChange}
      className={`w-12 md:w-14 h-6 md:h-7 rounded-full border-2 md:border-3 border-black relative transition-colors shrink-0 ${checked ? 'bg-tertiary-container' : 'bg-surface-container-highest'}`}
    >
      <div className={`w-4 h-4 md:w-[18px] md:h-[18px] rounded-full absolute top-[2px] transition-transform ${checked ? 'translate-x-6 md:translate-x-7 bg-white' : 'translate-x-[2px] bg-black'}`} />
    </button>
  );

  return (
    <>
    <AppLayout activePath="#profile">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-12">
          <button
            onClick={() => (window.location.hash = '#settings')}
            className="flex items-center gap-2 font-headline font-bold text-stone-500 hover:text-black transition-transform hover:scale-105 group mb-3 md:mb-4"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform text-sm md:text-base">arrow_back</span>
            <span className="text-xs md:text-sm">{t('reminders.back')}</span>
          </button>
          <h1 className="font-headline font-bold text-2xl md:text-3xl">{t('reminders.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Left Column: Toggles */}
          <div className="lg:col-span-5 flex flex-col gap-6 md:gap-10">
            <div className="sketch-border p-5 md:p-8 bg-surface-container-low">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h3 className="font-headline text-lg md:text-2xl font-bold -rotate-1 inline-block mb-0.5 md:mb-1">{t('reminders.daily_title')}</h3>
                  <p className="text-on-surface-variant text-xs md:text-sm">{t('reminders.daily_desc')}</p>
                </div>
                <Toggle checked={dailyEnabled} onChange={() => setDailyEnabled(!dailyEnabled)} />
              </div>
              <div className="mt-5 md:mt-8 pt-5 md:pt-8 border-t-2 border-black border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline text-base md:text-xl font-bold mb-0.5 md:mb-1">{t('reminders.weekly_title')}</h3>
                    <p className="text-on-surface-variant text-xs md:text-sm">{t('reminders.weekly_desc')}</p>
                  </div>
                  <Toggle checked={weeklyEnabled} onChange={() => setWeeklyEnabled(!weeklyEnabled)} />
                </div>
              </div>
            </div>

            {/* Illustration */}
            <div className="flex justify-center py-4 md:py-6">
              <div className="text-center">
                <span className="material-symbols-outlined text-[80px] md:text-[120px] text-black/15 block mb-3 md:mb-4">alarm</span>
                <p className="font-headline italic font-bold text-sm md:text-lg">"{t('reminders.quote')}"</p>
              </div>
            </div>
          </div>

          {/* Right Column: Time & Tone */}
          <div className="lg:col-span-7 flex flex-col gap-5 md:gap-8">
            {/* Time Selector */}
            <div className="sketch-border p-5 md:p-8 bg-surface-container">
              <h3 className="font-headline text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg md:text-2xl">schedule</span>
                {t('reminders.pick_time')}
              </h3>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {timeSlots.map((slot, i) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(i)}
                    className={`border-2 border-black rounded-lg p-3 md:p-4 text-center transition-all active:scale-95 ${
                      i === selectedTime
                        ? 'bg-secondary-container rotate-1 scale-105 border-[3px] md:border-[4px]'
                        : 'bg-surface-container-highest hover:bg-secondary-container'
                    }`}
                  >
                    <span className="block text-lg md:text-2xl font-bold font-headline">{slot.time}</span>
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">{t(slot.labelKey)}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 md:mt-6 text-center">
                <button className="text-xs md:text-sm font-bold underline underline-offset-4 decoration-2 hover:text-tertiary">
                  {t('reminders.custom_time')}
                </button>
              </div>
            </div>

            {/* Tone Selection */}
            <div className="sketch-border p-5 md:p-8 bg-surface-container-high">
              <h3 className="font-headline text-base md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg md:text-2xl">volume_up</span>
                {t('reminders.tone_title')}
              </h3>
              <div className="flex flex-col gap-3 md:gap-4">
                {tones.map((tone, i) => (
                  <label key={i} className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => setSelectedTone(i)}>
                    <div className={`w-5 h-5 md:w-6 md:h-6 border-2 md:border-3 border-black rounded-sm flex items-center justify-center shrink-0 ${i === selectedTone ? 'bg-black' : ''}`}>
                      {i === selectedTone && <span className="material-symbols-outlined text-white text-xs md:text-sm">check</span>}
                    </div>
                    <div className="flex-1 p-3 md:p-4 bg-surface-container-lowest border-2 border-black rounded-lg group-hover:-translate-y-0.5 md:group-hover:-translate-y-1 transition-transform">
                      <div className="flex justify-between items-center">
                        <span className="font-bold font-headline text-sm md:text-base">{t(tone.nameKey)}</span>
                        <span className="material-symbols-outlined text-stone-400 text-lg md:text-xl">play_circle</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-on-surface-variant">{t(tone.descKey)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-6 pt-2 md:pt-4">
              <button onClick={() => (window.location.hash = '#settings')} className="px-6 md:px-8 py-2 md:py-3 font-bold hover:underline transition-all text-sm md:text-base order-2 sm:order-1">
                {t('reminders.discard')}
              </button>
              <button onClick={() => { setShowSaved(true); setTimeout(() => setShowSaved(false), 2000); }} className="px-8 md:px-10 py-2.5 md:py-3 bg-black text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl text-sm md:text-base order-1 sm:order-2">
                {t('reminders.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
    {showSaved && (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-tertiary-container text-white px-6 py-3 rounded-full sketch-border shadow-xl z-[60] flex items-center gap-2 animate-fade-in-up font-headline font-bold">
        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        Preferences saved!
      </div>
    )}
    </>
  );
};

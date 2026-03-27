import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

export const JournalRecordPage: React.FC = () => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleFinish = () => {
    stopRecording();
    window.location.hash = '#feedback';
  };

  const cancelRecording = () => {
    stopRecording();
    setSeconds(0);
  };

  const retryRecording = () => {
    stopRecording();
    setSeconds(0);
    setTimeout(() => startRecording(), 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const mins = String(Math.floor(s / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleGoBack = () => {
    window.location.hash = '#speaking-intro';
  };

  return (
    <AppLayout activePath="#journal">
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-6 md:py-10 relative">
        
        {/* Back button */}
        <button 
          onClick={handleGoBack}
          className="absolute top-0 left-0 md:top-2 md:left-2 flex items-center gap-1 text-on-surface-variant hover:text-black transition-colors group"
        >
          <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm font-bold hidden sm:inline">{t('journal_record.back_to_journal')}</span>
        </button>

        {/* Recording Workspace */}
        <div className="max-w-3xl w-full flex flex-col items-center gap-8 md:gap-12 px-4">
          
          {/* The Sentence Canvas */}
          <div className="text-center space-y-3 md:space-y-4">
            <p className="text-secondary font-headline uppercase tracking-widest text-[10px] md:text-xs font-bold">
              {t('journal_record.repeat_after_me')}
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-headline font-extrabold leading-tight max-w-2xl mx-auto px-2">
              "The <span className="bg-gradient-to-r from-secondary-container to-secondary-container bg-no-repeat bg-[length:100%_0.3em] bg-[position:0_88%]">morning light</span> filtered through the curtains like gold ink."
            </h2>
          </div>

          {/* Central Recording Unit */}
          <div className="relative flex items-center justify-center py-6 md:py-10">
            {/* Progress/Waveform Ring */}
            <div className={`absolute w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full border-[4px] md:border-[6px] border-primary border-dashed transition-opacity duration-500 ${isRecording ? 'opacity-20' : 'opacity-5'}`}></div>
            <div className={`absolute w-[170px] h-[170px] md:w-[240px] md:h-[240px] rounded-full border-[3px] md:border-[4px] border-tertiary transition-opacity duration-500 ${isRecording ? 'opacity-40 animate-[spin_8s_linear_infinite]' : 'opacity-10'}`}></div>
            
            {/* Microphone Button */}
            <button 
              onClick={() => isRecording ? stopRecording() : startRecording()}
              className={`relative z-10 w-32 h-32 md:w-40 md:h-40 border-[4px] md:border-[5px] border-primary sketch-border flex flex-col items-center justify-center transition-all group active:scale-95 ${
                isRecording 
                  ? 'bg-error-container/30 hover:bg-error-container/50' 
                  : 'bg-surface-container-highest hover:bg-tertiary/10'
              }`}
            >
              <span className="material-symbols-outlined text-5xl md:text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isRecording ? 'stop' : 'mic'}
              </span>
              
              {/* Waveform animation when recording */}
              {isRecording && (
                <div className="mt-2 flex gap-[3px] items-end h-5">
                  <div className="w-[3px] bg-primary rounded-full h-2 animate-bounce"></div>
                  <div className="w-[3px] bg-primary rounded-full h-4 animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-[3px] bg-primary rounded-full h-5 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-[3px] bg-primary rounded-full h-4 animate-bounce [animation-delay:0.3s]"></div>
                  <div className="w-[3px] bg-primary rounded-full h-2 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </button>

            {/* Status Indicator - only when recording */}
            {isRecording && (
              <div className="absolute -bottom-2 md:-bottom-4 px-5 py-1.5 md:px-6 md:py-2 rounded-full font-bold text-xs md:text-sm tracking-widest uppercase bg-primary text-surface">
                {`${t('journal_record.recording')} ${formatTime(seconds)}`}
              </div>
            )}
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center gap-6 md:gap-8 pt-4 md:pt-6">
            {/* Cancel Button */}
            <button 
              onClick={cancelRecording}
              disabled={!isRecording && seconds === 0}
              className={`flex flex-col items-center gap-1.5 md:gap-2 group transition-transform active:scale-90 ${
                !isRecording && seconds === 0 ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-outline flex items-center justify-center group-hover:bg-error-container group-hover:border-error transition-colors">
                <span className="material-symbols-outlined text-lg md:text-base text-outline group-hover:text-error">cancel</span>
              </div>
              <span className="text-[10px] md:text-sm font-bold text-outline group-hover:text-error">{t('journal_record.cancel')}</span>
            </button>

            {/* Primary Action Button */}
            <button 
              onClick={() => {
                if (isRecording) {
                  handleFinish();
                } else if (seconds > 0) {
                  handleFinish();
                } else {
                  startRecording();
                }
              }}
              className="px-6 md:px-10 py-3 md:py-4 bg-primary text-surface rounded-full flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform active:scale-95 group sketch-border"
            >
              <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isRecording ? 'stop_circle' : seconds > 0 ? 'check_circle' : 'mic'}
              </span>
              <span className="text-base md:text-lg font-headline font-black tracking-wide">
                {isRecording ? t('journal_record.finish_recording') : seconds > 0 ? t('journal_record.submit_recording') : t('journal_record.start_recording')}
              </span>
            </button>

            {/* Retry Button */}
            <button 
              onClick={retryRecording}
              disabled={!isRecording && seconds === 0}
              className={`flex flex-col items-center gap-1.5 md:gap-2 group transition-transform active:scale-90 ${
                !isRecording && seconds === 0 ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-outline flex items-center justify-center group-hover:bg-secondary-container group-hover:border-secondary transition-colors">
                <span className="material-symbols-outlined text-lg md:text-base text-outline group-hover:text-secondary">replay</span>
              </div>
              <span className="text-[10px] md:text-sm font-bold text-outline group-hover:text-secondary">{t('journal_record.retry')}</span>
            </button>
          </div>

          {/* Pronunciation Tip Card (inline on mobile, floating on xl) */}
          <div className="w-full max-w-sm xl:fixed xl:right-10 xl:top-1/2 xl:-translate-y-1/2 xl:w-56 xl:max-w-none p-5 md:p-6 bg-surface-container-low border-3 border-primary sketch-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] xl:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mt-4 xl:mt-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-tertiary text-lg">lightbulb</span>
              <p className="font-bold text-xs md:text-sm">{t('journal_record.pronunciation_tip')}</p>
            </div>
            <p className="text-xs md:text-sm leading-relaxed text-on-surface-variant">
              {t('journal_record.tip_content')}
            </p>
          </div>

          {/* Footer Help (desktop only) */}
          <div className="hidden md:flex items-center gap-6 text-secondary/50 text-[10px] font-bold tracking-widest uppercase mt-4">
            <span>{t('journal_record.press')} <kbd className="px-2 py-0.5 bg-surface-container rounded border border-outline/30 text-[9px] font-mono">SPACE</kbd> {t('journal_record.to_toggle')}</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

type RecordState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'playing' | 'error';

export const JournalRecordPage: React.FC = () => {
  const { t } = useTranslation();
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [sentence, setSentence] = useState('');
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  useEffect(() => {
    if (!journalId) return;
    setLoadingJournal(true);
    apiRequest<{ journal: { feedback: string | null; content: string } }>(`/journals/${journalId}`)
      .then(res => {
        const j = res.journal;
        try {
          const fb = typeof j.feedback === 'string' ? JSON.parse(j.feedback) : j.feedback;
          setSentence(fb?.enhancedText || j.content || '');
        } catch {
          setSentence(j.content || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoadingJournal(false));
  }, [journalId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startTimer = () => {
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    setErrorMsg('');
    setRecordState('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Microphone not supported in this browser. You can skip this step.');
      setRecordState('error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setRecordState('recorded');
      };
      mr.start();
      setRecordState('recording');
      startTimer();
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. You can skip this step.'
        : 'Could not start recording. Please check mic access.';
      setErrorMsg(msg);
      setRecordState('error');
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePlayback = () => {
    if (!audioUrl || !audioRef.current) return;
    if (recordState === 'playing') {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setRecordState('recorded');
    } else {
      audioRef.current.play();
      setRecordState('playing');
    }
  };

  const handleRetry = () => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setErrorMsg('');
    setRecordState('idle');
  };

  const handleFinish = () => {
    stopRecording();
    window.location.hash = journalId ? `#completion?journalId=${journalId}` : '#completion';
  };

  const handleGoBack = () => {
    window.location.hash = journalId ? `#speaking-intro?journalId=${journalId}` : '#speaking-intro';
  };

  const formatTime = (s: number) => {
    const mins = String(Math.floor(s / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const isRecording = recordState === 'recording';
  const isRecorded = recordState === 'recorded' || recordState === 'playing';

  return (
    <AppLayout activePath="#journal">
      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setRecordState('recorded')}
          className="hidden"
        />
      )}
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
              {loadingJournal ? (
                <span className="material-symbols-outlined animate-spin text-2xl text-stone-400">progress_activity</span>
              ) : sentence ? (
                <>"{sentence}"</>
              ) : (
                <span className="text-stone-400 italic text-base">No sentence — go back and complete your journal first.</span>
              )}
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
              disabled={recordState === 'requesting'}
              className={`relative z-10 w-32 h-32 md:w-40 md:h-40 border-[4px] md:border-[5px] border-primary sketch-border flex flex-col items-center justify-center transition-all group active:scale-95 disabled:opacity-60 ${
                isRecording 
                  ? 'bg-error-container/30 hover:bg-error-container/50' 
                  : 'bg-surface-container-highest hover:bg-tertiary/10'
              }`}
            >
              <span className="material-symbols-outlined text-5xl md:text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {recordState === 'requesting' ? 'pending' : isRecording ? 'stop' : 'mic'}
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
          <div className="flex flex-col items-center gap-4 pt-4 md:pt-6">
            {/* Error state */}
            {recordState === 'error' && (
              <p className="text-sm text-red-500 font-medium text-center max-w-xs">{errorMsg}</p>
            )}

            <div className="flex items-center gap-6 md:gap-8">
              {/* Cancel/Retry Button */}
              <button 
                onClick={handleRetry}
                disabled={!isRecording && !isRecorded && recordState !== 'error'}
                className={`flex flex-col items-center gap-1.5 md:gap-2 group transition-transform active:scale-90 ${
                  !isRecording && !isRecorded && recordState !== 'error' ? 'opacity-30 pointer-events-none' : ''
                }`}
              >
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-full border-2 border-outline flex items-center justify-center group-hover:bg-error-container group-hover:border-error transition-colors">
                  <span className="material-symbols-outlined text-lg md:text-base text-outline group-hover:text-error">replay</span>
                </div>
                <span className="text-[10px] md:text-sm font-bold text-outline group-hover:text-error">{t('journal_record.retry')}</span>
              </button>

              {/* Primary Action Button */}
              <button 
                onClick={() => {
                  if (isRecording) stopRecording();
                  else if (isRecorded) handleFinish();
                  else startRecording();
                }}
                className="px-6 md:px-10 py-3 md:py-4 bg-primary text-surface rounded-full flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform active:scale-95 group sketch-border"
              >
                <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isRecording ? 'stop_circle' : isRecorded ? 'check_circle' : 'mic'}
                </span>
                <span className="text-base md:text-lg font-headline font-black tracking-wide">
                  {isRecording ? t('journal_record.finish_recording') : isRecorded ? t('journal_record.submit_recording') : t('journal_record.start_recording')}
                </span>
              </button>

              {/* Replay Button */}
              <button 
                onClick={handlePlayback}
                disabled={!isRecorded}
                className={`flex flex-col items-center gap-1.5 md:gap-2 group transition-transform active:scale-90 ${
                  !isRecorded ? 'opacity-30 pointer-events-none' : ''
                }`}
              >
                <div className={`w-11 h-11 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center transition-colors ${
                  recordState === 'playing' ? 'bg-secondary-container border-secondary' : 'border-outline group-hover:bg-secondary-container group-hover:border-secondary'
                }`}>
                  <span className={`material-symbols-outlined text-lg md:text-base ${
                    recordState === 'playing' ? 'text-secondary' : 'text-outline group-hover:text-secondary'
                  }`}>
                    {recordState === 'playing' ? 'pause' : 'play_arrow'}
                  </span>
                </div>
                <span className="text-[10px] md:text-sm font-bold text-outline group-hover:text-secondary">
                  {recordState === 'playing' ? 'Pause' : t('journal_record.retry')}
                </span>
              </button>
            </div>

            {/* Skip link */}
            <button
              onClick={handleFinish}
              className="text-xs text-on-surface-variant underline hover:text-black transition-colors mt-2"
            >
              Skip this step
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

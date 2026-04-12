import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { parseFeedback } from '../../types/dto/ai-feedback';
import { ttsSpeak } from '../../services/api/endpoints';

type RecordState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'playing' | 'error';

export const SpeakingPracticeOriginPage: React.FC = () => {
  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [enhancedText, setEnhancedText] = useState('');

  // TTS
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(() => {
    const s = localStorage.getItem('tts_speed');
    return s ? parseFloat(s) : 1;
  });
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Recording
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recSeconds, setRecSeconds] = useState(0);
  const [recError, setRecError] = useState('');
  const [recAudioUrl, setRecAudioUrl] = useState<string | null>(null);
  const [scoringState, setScoringState] = useState<'idle' | 'scoring' | 'done' | 'error'>('idle');
  const [wordScores, setWordScores] = useState<{ word: string; correct: boolean; comment?: string }[]>([]);

  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recAudioRef = useRef<HTMLAudioElement | null>(null);
  const journalContentRef = useRef('');

  // Load journal
  useEffect(() => {
    if (!journalId) {
      window.location.hash = '#journal';
      return;
    }
    (async () => {
      try {
        const res = await apiRequest(`/journals/${journalId}`) as any;
        const j = res.journal;
        const dto = parseFeedback(j.feedback);
        setJournalContent(j.content || '');
        setEnhancedText(dto.enhancedText || j.content || '');
        journalContentRef.current = j.content || '';
      } catch {
        setLoadError('Không tải được bài viết. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, [journalId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recAudioUrl) URL.revokeObjectURL(recAudioUrl);
      ttsAudioRef.current?.pause();
    };
  }, [recAudioUrl]);

  // ── TTS (uses journalContent — the original text) ──────────────────────────────────────────────
  const handlePlaySample = async () => {
    if (!journalContent) return;
    if (isPlaying) {
      ttsAudioRef.current?.pause();
      ttsAudioRef.current = null;
      setIsPlaying(false);
      return;
    }
    setTtsLoading(true);
    try {
      const base64 = await ttsSpeak(journalContent);
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audio.playbackRate = playbackSpeed;
      ttsAudioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); ttsAudioRef.current = null; };
      audio.onerror = () => { setIsPlaying(false); ttsAudioRef.current = null; };
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      setTtsLoading(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    localStorage.setItem('tts_speed', String(speed));
    if (ttsAudioRef.current) ttsAudioRef.current.playbackRate = speed;
  };

  // ── Recording (pronunciation target = journalContent) ─────────────────────────────────────────
  const handlePronunciation = async (blob: Blob) => {
    const target = journalContentRef.current;
    if (!target) return;
    setScoringState('scoring');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const res = await apiRequest('/pronunciation-check', {
        method: 'POST',
        body: { audio: base64, targetText: target },
      }) as { words: { word: string; correct: boolean; comment?: string }[] };
      setWordScores(res.words || []);
      setScoringState('done');
    } catch {
      setScoringState('error');
    }
  };

  const startRecording = async () => {
    setRecError('');
    setRecordState('requesting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecError('Thiết bị không hỗ trợ ghi âm.');
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
        setRecAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        setRecordState('recorded');
        handlePronunciation(blob);
      };
      mr.start();
      setRecordState('recording');
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(prev => prev + 1), 1000);
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Bạn chưa cho phép dùng microphone.'
        : 'Không thể bắt đầu ghi âm.';
      setRecError(msg);
      setRecordState('error');
    }
  };

  const stopRecording = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handlePlayback = () => {
    if (!recAudioUrl || !recAudioRef.current) return;
    if (recordState === 'playing') {
      recAudioRef.current.pause();
      recAudioRef.current.currentTime = 0;
      setRecordState('recorded');
    } else {
      recAudioRef.current.play();
      setRecordState('playing');
    }
  };

  const handleRetry = () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    if (recAudioUrl) URL.revokeObjectURL(recAudioUrl);
    setRecAudioUrl(null);
    setRecSeconds(0);
    setRecError('');
    setRecordState('idle');
    setScoringState('idle');
    setWordScores([]);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const isRecording = recordState === 'recording';
  const isRecorded = recordState === 'recorded' || recordState === 'playing';

  // ── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout activePath="#journal">
        <div className="flex items-center justify-center min-h-[60vh]">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      </AppLayout>
    );
  }

  if (loadError || !journalContent) {
    return (
      <AppLayout activePath="#journal">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <span className="material-symbols-outlined text-5xl text-error mb-4">error_outline</span>
          <p className="font-headline font-bold text-lg mb-2">{loadError || 'Không có nội dung để luyện nói.'}</p>
          <button
            onClick={() => window.location.hash = journalId ? `#speaking-practice?journalId=${journalId}` : '#journal'}
            className="mt-4 px-6 py-3 sketch-border bg-primary text-white font-headline font-bold text-sm active:scale-95 transition-all"
          >
            Quay lại
          </button>
        </div>
      </AppLayout>
    );
  }

  const correctCount = wordScores.filter(w => w.correct).length;
  const accuracy = wordScores.length > 0 ? Math.round((correctCount / wordScores.length) * 100) : null;

  return (
    <AppLayout activePath="#journal">
      <div className="max-w-2xl mx-auto pb-24">

        {/* ── Back ── */}
        <button
          onClick={() => window.location.hash = journalId ? `#speaking-practice?journalId=${journalId}` : '#journal'}
          className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-5 group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-headline font-bold text-xs">Quay lại bản tiếng Anh</span>
        </button>

        {/* ── Header ── */}
        <div className="mb-6">
          <h2 className="font-headline font-black text-2xl md:text-3xl tracking-tight -rotate-1 origin-left flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>record_voice_over</span>
            Luyện nói — Bài gốc
          </h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Bây giờ hãy đọc bài gốc của bạn. AI sẽ kiểm tra phát âm từng từ.
          </p>
        </div>

        {/* ── Step 1: Nghe mẫu ── */}
        <div className="sketch-card p-5 md:p-6 mb-4">
          <p className="text-[10px] font-headline font-black uppercase tracking-widest text-secondary mb-3 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[10px] font-black shrink-0">1</span>
            Nghe mẫu trước
          </p>

          {/* Text display — shows journalContent (original) */}
          <div className="p-4 bg-surface-container-low rounded-xl border-2 border-dashed border-black/20 mb-4">
            {scoringState === 'done' && wordScores.length > 0 ? (
              <div className="flex flex-wrap gap-x-1 gap-y-1 text-base md:text-lg leading-relaxed">
                {wordScores.map((ws, i) => (
                  <span
                    key={i}
                    title={!ws.correct && ws.comment ? ws.comment : undefined}
                    className={`relative group cursor-default rounded px-0.5 font-medium underline decoration-2 ${
                      ws.correct
                        ? 'text-emerald-700 decoration-emerald-500'
                        : 'text-red-600 decoration-red-400'
                    }`}
                  >
                    {ws.word}
                    {!ws.correct && ws.comment && (
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-stone-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {ws.comment}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-base md:text-lg font-medium leading-relaxed text-on-surface">{journalContent}</p>
            )}
          </div>

          {/* TTS controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handlePlaySample}
              disabled={ttsLoading}
              className={`flex items-center gap-2 px-4 py-2.5 sketch-border font-headline font-bold text-sm transition-all active:scale-95 disabled:opacity-50 ${
                isPlaying
                  ? 'bg-secondary text-white'
                  : 'bg-surface hover:bg-secondary/10 text-on-surface'
              }`}
            >
              {ttsLoading ? (
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'stop' : 'volume_up'}
                </span>
              )}
              {isPlaying ? 'Dừng' : 'Nghe mẫu'}
            </button>

            {/* Speed selector */}
            <div className="flex items-center gap-1">
              {[0.75, 1, 1.25].map(speed => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2.5 py-1.5 text-xs font-headline font-bold sketch-border transition-all active:scale-95 ${
                    playbackSpeed === speed ? 'bg-secondary text-white' : 'bg-surface text-on-surface-variant hover:bg-secondary/10'
                  }`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Step 2: Ghi âm ── */}
        <div className="sketch-card p-5 md:p-6 mb-4 bg-secondary-container/10">
          <p className="text-[10px] font-headline font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[10px] font-black shrink-0">2</span>
            Đọc to và ghi âm
          </p>

          {/* Enhanced text hint — shows AI version for comparison */}
          {enhancedText && (
            <p className="text-xs text-on-surface-variant bg-surface-container rounded-lg px-3 py-2 mb-4 italic">
              Bản AI: "{enhancedText.slice(0, 80)}{enhancedText.length > 80 ? '\u2026' : ''}"
            </p>
          )}

          {/* Hidden playback audio */}
          {recAudioUrl && (
            <audio ref={recAudioRef} src={recAudioUrl} onEnded={() => setRecordState('recorded')} className="hidden" />
          )}

          {/* Mic area */}
          <div className="flex flex-col items-center py-6">
            {/* Big mic button */}
            <button
              onClick={() => {
                if (isRecording) stopRecording();
                else if (isRecorded) handleRetry();
                else startRecording();
              }}
              disabled={recordState === 'requesting' || scoringState === 'scoring'}
              className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 mb-4 ${
                isRecording
                  ? 'border-error bg-error/10 animate-pulse'
                  : 'border-secondary bg-surface hover:bg-secondary/10'
              }`}
            >
              <span
                className={`material-symbols-outlined text-4xl md:text-5xl ${isRecording ? 'text-error' : 'text-secondary'}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {recordState === 'requesting'
                  ? 'pending'
                  : isRecording
                    ? 'stop'
                    : isRecorded
                      ? 'replay'
                      : 'mic'}
              </span>

              {/* Waveform */}
              {isRecording && (
                <div className="absolute -bottom-2 flex gap-[3px] items-end h-4">
                  {[1.5, 3, 2, 4, 2, 3, 1.5].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] bg-error rounded-full animate-bounce"
                      style={{ height: `${h * 4}px`, animationDelay: `${i * 0.08}s` }}
                    />
                  ))}
                </div>
              )}
            </button>

            {/* Status text */}
            {recordState === 'idle' && (
              <p className="text-sm text-on-surface-variant font-medium">Bấm để bắt đầu ghi âm</p>
            )}
            {recordState === 'requesting' && (
              <p className="text-sm text-on-surface-variant font-medium">Đang kết nối mic...</p>
            )}
            {isRecording && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                <span className="font-mono text-base font-black text-error">{formatTime(recSeconds)}</span>
                <span className="text-xs text-on-surface-variant">Bấm ■ để dừng</span>
              </div>
            )}
            {scoringState === 'scoring' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-sm animate-spin text-secondary">psychology</span>
                <span className="text-sm text-on-surface-variant">AI đang phân tích phát âm...</span>
              </div>
            )}
            {recordState === 'error' && (
              <p className="text-sm text-error font-medium text-center max-w-xs">{recError}</p>
            )}

            {/* After recording: play back + retry */}
            {isRecorded && (
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handlePlayback}
                  className="flex items-center gap-2 px-4 py-2 sketch-border bg-surface font-headline font-bold text-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">
                    {recordState === 'playing' ? 'stop' : 'play_arrow'}
                  </span>
                  {recordState === 'playing' ? 'Dừng' : 'Nghe lại'}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 sketch-border bg-surface-container font-headline font-bold text-sm active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Thử lại
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Kết quả phát âm ── */}
        {scoringState === 'done' && wordScores.length > 0 && (
          <div className="sketch-card p-5 md:p-6 mb-4 bg-surface-container-lowest">
            <p className="text-[10px] font-headline font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 text-white ${
                accuracy !== null && accuracy >= 80 ? 'bg-emerald-500' : accuracy !== null && accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}>3</span>
              Kết quả phát âm
            </p>

            {/* Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`px-5 py-3 rounded-2xl text-center ${
                accuracy !== null && accuracy >= 80
                  ? 'bg-emerald-100 border-2 border-emerald-300'
                  : accuracy !== null && accuracy >= 50
                    ? 'bg-amber-100 border-2 border-amber-300'
                    : 'bg-red-100 border-2 border-red-300'
              }`}>
                <p className="font-headline font-black text-3xl">{accuracy}%</p>
                <p className="text-[10px] font-bold text-stone-500">{correctCount}/{wordScores.length} từ</p>
              </div>
              <div className="flex-1">
                <p className="font-headline font-bold text-sm mb-1">
                  {accuracy !== null && accuracy >= 80
                    ? 'Phát âm rất tốt! 🎉'
                    : accuracy !== null && accuracy >= 50
                      ? 'Khá tốt, luyện thêm nhé!'
                      : 'Hãy nghe lại mẫu và thử lại 💪'}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Từ màu <span className="text-emerald-700 font-bold">xanh</span> = đúng •{' '}
                  Từ màu <span className="text-red-600 font-bold">đỏ</span> = cần luyện thêm
                </p>
              </div>
            </div>

            {/* Wrong words */}
            {wordScores.filter(w => !w.correct).length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-headline font-bold uppercase tracking-widest text-stone-400 mb-2">Từ cần luyện lại</p>
                <div className="flex flex-wrap gap-2">
                  {wordScores.filter(w => !w.correct).map((w, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs font-bold text-red-700">
                      {w.word}
                      {w.comment && <span className="font-normal opacity-70 ml-1">— {w.comment}</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Try again CTA */}
            <button
              onClick={handleRetry}
              className="mt-4 flex items-center gap-2 text-xs font-headline font-bold text-secondary hover:underline"
            >
              <span className="material-symbols-outlined text-sm">replay</span>
              Thử lại từ đầu
            </button>
          </div>
        )}

      </div>

      {/* Sticky Next footer — goes to vocab-review */}
      <footer className="fixed bottom-0 left-0 md:left-[224px] lg:left-[256px] right-0 h-20 md:h-24 bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 z-30 border-t-2 border-black/5">
        <div className="flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-widest">Luyện phát âm</p>
          <p className="font-headline font-bold text-sm md:text-base">Bài gốc</p>
        </div>
        <button
          onClick={() => window.location.hash = journalId ? `#vocab-review?journalId=${journalId}` : '#vocab-review'}
          className="px-6 md:px-10 py-3 md:py-4 bg-black text-white rounded-full font-headline font-black text-sm md:text-base flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform active:scale-95 sketch-border"
        >
          Tiếp theo
          <span className="material-symbols-outlined text-lg md:text-xl">arrow_forward</span>
        </button>
      </footer>
    </AppLayout>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getVocabNotebook, createVocabItem, updateVocabItem, deleteVocabItem, generateVocabQuiz, importFeedbackVocab, getProgressSummary, type VocabItem, type QuizQuestion } from '../../services/api/endpoints';
import { ApiError, apiRequest } from '../../services/api/client';
import { QuizModal, type QuizResult } from '../../components/quiz/QuizModal';
import { parseFeedback, type LearningCandidate } from '../../types/dto/ai-feedback';
import { trackReviewDone } from '../../services/analytics/coreLoop';

export const VocabularyReviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [words, setWords] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz state
  const [quizPhase, setQuizPhase] = useState<'idle' | 'loading' | 'active' | 'result'>('idle');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // ── Session feedback checklist ─────────────────────────────────────────────
  const journalId = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);
  const [sessionCandidates, setSessionCandidates] = useState<LearningCandidate[]>([]);
  const [sessionJournalId, setSessionJournalId] = useState<string | null>(null);
  const [savedSessionIndices, setSavedSessionIndices] = useState<Set<number>>(new Set());
  const [savingSessionIndex, setSavingSessionIndex] = useState<number | null>(null);
  // ──────────────────────────────────────────────────────────────────────────

  const handleStartQuiz = async () => {
    if (words.length < 3) { setError('Cần ít nhất 3 từ trong sổ để tạo quiz!'); return; }
    setQuizPhase('loading');
    try {
      const res = await generateVocabQuiz(undefined, 5);
      if (res.questions && res.questions.length > 0) { setQuizQuestions(res.questions); setQuizPhase('active'); }
      else { setError('Không tạo được quiz. Thử lại sau nhé!'); setQuizPhase('idle'); }
    } catch { setError('Không tạo được quiz. Thử lại sau nhé!'); setQuizPhase('idle'); }
  };

  const handleQuizComplete = async (result: QuizResult) => {
    setQuizResult(result);
    setQuizPhase('result');
    for (const ans of result.answers) {
      if (!ans.correct || !ans.vocabId) continue;
      const word = words.find(w => w.id === ans.vocabId);
      if (word && word.mastery !== 'mastered') {
        const next = word.mastery === 'new' ? 'learning' : 'mastered';
        try { await updateVocabItem(ans.vocabId, { mastery: next }); setWords(prev => prev.map(w => w.id === ans.vocabId ? { ...w, mastery: next } : w)); } catch { /* silent */ }
      }
    }
  };

  useEffect(() => { loadWords(); }, [masteryFilter]);

  async function loadWords() {
    try {
      setLoading(true); setError(null);
      const m = masteryFilter === 'all' ? undefined : masteryFilter;
      const res = await getVocabNotebook(m);
      setWords(res.items);
    } catch (err) {
      console.error('Failed to load vocab:', err);
      setError(t('vocab_notebook.error_load'));
    } finally { setLoading(false); }
  }

  // Load session candidates: from journalId in URL, or today's journal
  useEffect(() => {
    (async () => {
      try {
        let targetId = journalId;
        if (!targetId) { const summary = await getProgressSummary(); targetId = summary.todayJournalId; }
        if (!targetId) return;
        const res = await apiRequest(`/journals/${targetId}`) as any;
        const dto = parseFeedback(res.journal.feedback);
        if (dto.learningCandidates.length > 0) { setSessionCandidates(dto.learningCandidates); setSessionJournalId(targetId); }
      } catch { /* non-blocking */ }
    })();
  }, [journalId]);

  const handleSaveSessionWord = async (index: number, candidate: LearningCandidate) => {
    if (!sessionJournalId || savedSessionIndices.has(index) || savingSessionIndex !== null) return;
    setSavingSessionIndex(index);
    try {
      await importFeedbackVocab(sessionJournalId, [{ word: candidate.expression, meaning: candidate.meaning, example: candidate.example }]);
      setSavedSessionIndices(prev => new Set(prev).add(index));
    } catch { /* silent */ } finally { setSavingSessionIndex(null); }
  };

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    setAdding(true);
    try {
      const res = await createVocabItem({ word: newWord.trim(), meaning: newMeaning.trim() || undefined, example: newExample.trim() || undefined });
      setWords(prev => [res.item, ...prev]);
      setNewWord(''); setNewMeaning(''); setNewExample(''); setShowAdd(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError(t('vocab_notebook.error_duplicate', { defaultValue: 'Từ này đã có trong sổ của bạn.' }));
      else { console.error('Failed to add word:', err); setError(t('vocab_notebook.error_add')); }
    } finally { setAdding(false); }
  };

  const handleMasteryChange = async (id: string, newMastery: string) => {
    try { await updateVocabItem(id, { mastery: newMastery }); setWords(prev => prev.map(w => w.id === id ? { ...w, mastery: newMastery } : w)); }
    catch (err) { console.error('Failed to update mastery:', err); setError(t('vocab_notebook.error_update')); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteVocabItem(id); setWords(prev => prev.filter(w => w.id !== id)); }
    catch (err) { console.error('Failed to delete word:', err); setError(t('vocab_notebook.error_delete')); }
  };

  const handleNext = () => {
    trackReviewDone({ rememberedCount: words.filter(w => w.mastery === 'mastered').length, skipped: false });
    window.location.hash = journalId ? `#completion?journalId=${journalId}` : '#completion';
  };

  const masteryNum = (m: string) => m === 'mastered' ? 100 : m === 'learning' ? 50 : 10;
  const getMasteryColor = (m: string) => {
    switch (m) {
      case 'mastered': return 'bg-tertiary-container';
      case 'learning': return 'bg-secondary-container';
      default: return 'bg-error-container';
    }
  };

  const mastered = words.filter(w => w.mastery === 'mastered').length;

  return (
    <AppLayout activePath="#journal">
      <div className="max-w-5xl mx-auto pb-28 md:pb-32">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('vocab_notebook.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('vocab_notebook.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container border-2 border-error rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-on-error-container">{error}</span>
            <button onClick={() => { setError(null); loadWords(); }} className="text-sm font-headline font-bold text-error underline">{t('common.retry')}</button>
          </div>
        )}

        {/* Session Checklist */}
        {sessionCandidates.length > 0 && (
          <div className="sketch-card p-5 md:p-6 mb-6 md:mb-8 bg-secondary-container/10">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <h3 className="font-headline font-bold text-base md:text-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-lg md:text-2xl text-secondary">checklist</span>
                Hôm nay bạn dùng được gì?
              </h3>
              <button onClick={() => setSessionCandidates([])} className="text-on-surface-variant hover:text-primary transition-colors" title="Đóng">
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0" />
                  <span className="font-label font-bold text-[10px] md:text-xs uppercase tracking-widest text-tertiary">Dùng được ✓</span>
                </div>
                <div className="space-y-2">
                  {sessionCandidates.filter(c => c.candidateType === 'reinforce').length === 0
                    ? <p className="text-xs italic text-stone-400 px-1">Viết thêm tiếng Anh để có từ ở đây nhé!</p>
                    : sessionCandidates.map((c, idx) => c.candidateType === 'reinforce' ? (
                      <div key={idx} className="px-3 py-2 bg-tertiary/10 border border-tertiary/30 rounded-lg">
                        <span className="font-headline font-bold text-sm">{c.expression}</span>
                        {c.meaning && <p className="text-xs text-on-surface-variant italic mt-0.5">{c.meaning}</p>}
                      </div>
                    ) : null)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                  <span className="font-label font-bold text-[10px] md:text-xs uppercase tracking-widest text-primary">Từ cần học thêm</span>
                </div>
                <div className="space-y-3">
                  {sessionCandidates.map((c, idx) => c.candidateType !== 'reinforce' ? (
                    <div key={idx} className="p-3 bg-surface-container-lowest border-2 border-black/10 rounded-xl">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-headline font-bold text-sm md:text-base">{c.expression}</span>
                            {c.level && <span className="text-[10px] px-1.5 py-0.5 bg-black text-white rounded font-mono">{c.level}</span>}
                            {c.candidateType === 'upgrade' && <span className="text-[10px] px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded font-bold">nâng cấp</span>}
                          </div>
                          {c.meaningGap && <p className="text-[10px] text-stone-400 italic">Bạn muốn nói: &#8220;{c.meaningGap}&#8221;</p>}
                          {c.meaning && <p className="text-xs text-on-surface-variant mt-1">{c.meaning}</p>}
                          {c.example && <p className="text-xs italic text-stone-500 mt-0.5">&#8220;{c.example}&#8221;</p>}
                        </div>
                        <button
                          onClick={() => handleSaveSessionWord(idx, c)}
                          disabled={savedSessionIndices.has(idx) || savingSessionIndex !== null}
                          title={savedSessionIndices.has(idx) ? 'Đã lưu vào sổ' : 'Lưu vào sổ'}
                          className="shrink-0 mt-0.5 p-1.5 rounded hover:bg-black/10 transition-colors disabled:opacity-40 disabled:cursor-default"
                        >
                          {savingSessionIndex === idx
                            ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                            : savedSessionIndices.has(idx)
                              ? <span className="material-symbols-outlined text-base text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark_added</span>
                              : <span className="material-symbols-outlined text-base text-stone-400 hover:text-primary">bookmark_add</span>}
                        </button>
                      </div>
                    </div>
                  ) : null)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-primary">{words.length}</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.total')}</p>
          </div>
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-tertiary">
              {words.length > 0 ? Math.round(mastered / words.length * 100) : 0}%
            </p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.avg_mastery')}</p>
          </div>
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-secondary">{mastered}</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.mastered')}</p>
          </div>
        </div>

        {/* Quiz CTA */}
        {words.length >= 3 && (
          <button onClick={handleStartQuiz} disabled={quizPhase === 'loading'} className="w-full mb-6 md:mb-8 p-4 sketch-border bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 flex items-center gap-4 transition-all active:scale-[0.98] disabled:opacity-60">
            {quizPhase === 'loading' ? <span className="material-symbols-outlined animate-spin text-2xl text-primary">psychology</span> : <span className="material-symbols-outlined text-2xl text-primary">quiz</span>}
            <div className="text-left flex-1">
              <p className="font-headline font-bold text-sm">{quizPhase === 'loading' ? 'Đang tạo quiz...' : 'Kiểm tra từ vựng'}</p>
              <p className="text-xs text-on-surface-variant">AI tạo quiz từ các từ trong sổ của bạn</p>
            </div>
            <span className="material-symbols-outlined text-stone-400">arrow_forward</span>
          </button>
        )}

        {/* Quiz Result Summary */}
        {quizPhase === 'result' && quizResult && (
          <div className="mb-6 sketch-card p-5 bg-tertiary-container/20">
            <div className="flex items-center gap-4 mb-3">
              <div className={`px-4 py-2 rounded-xl text-center ${quizResult.correct >= quizResult.total * 0.7 ? 'bg-green-100 border border-green-300' : quizResult.correct >= quizResult.total * 0.5 ? 'bg-amber-100 border border-amber-300' : 'bg-red-100 border border-red-300'}`}>
                <p className="font-headline font-black text-2xl">{quizResult.correct}/{quizResult.total}</p>
                <p className="text-[10px] font-bold text-stone-500">câu đúng</p>
              </div>
              <div className="flex-1">
                <p className="font-headline font-bold text-sm">{quizResult.correct >= quizResult.total * 0.7 ? 'Giỏi lắm! 🎉' : quizResult.correct >= quizResult.total * 0.5 ? 'Khá tốt! Tiếp tục ôn nhé' : 'Hãy ôn lại từ vựng nhé 💪'}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Mastery đã được cập nhật cho các từ đúng</p>
              </div>
            </div>
            <button onClick={() => { setQuizPhase('idle'); setQuizResult(null); }} className="text-xs font-headline font-bold text-primary underline">Đóng</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6 md:mb-8">
          {['all', 'new', 'learning', 'mastered'].map(tag => (
            <button key={tag} onClick={() => setMasteryFilter(tag)} className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm transition-all active:scale-95 ${masteryFilter === tag ? 'bg-black text-white border-2 border-black' : 'bg-surface-container border-2 border-black/20 hover:border-black/50'}`}>
              {tag === 'all' ? t('vocab_notebook.tag_all') : t(`vocab_notebook.tag_${tag}`)}
            </button>
          ))}
        </div>

        {/* Word List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : words.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-stone-300 mb-4">dictionary</span>
            <p className="font-headline font-bold text-lg text-stone-400">{t('vocab_notebook.empty_title')}</p>
            <p className="text-sm text-stone-400 mt-2">{t('vocab_notebook.empty_desc')}</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {words.map((word, i) => (
              <div key={word.id} className={`sketch-card bg-surface-container-lowest overflow-hidden transition-all ${i % 2 === 0 ? 'hover:rotate-[0.2deg]' : 'hover:-rotate-[0.2deg]'}`}>
                <div onClick={() => setExpandedId(expandedId === word.id ? null : word.id)} className="p-4 md:p-6 cursor-pointer flex items-center gap-3 md:gap-5">
                  <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e8e4dc" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={word.mastery === 'mastered' ? '#a8d5a2' : word.mastery === 'learning' ? '#e3d2b5' : '#e57373'} strokeWidth="3" strokeDasharray={`${masteryNum(word.mastery) * 0.9425} 94.25`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-headline font-black">{masteryNum(word.mastery)}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-bold text-base md:text-xl">{word.word}</h4>
                    <p className="text-on-surface-variant text-xs md:text-sm line-clamp-1">{word.meaning || t('vocab_notebook.no_definition')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border border-black/10 ${getMasteryColor(word.mastery)}`}>{word.mastery}</span>
                  <span className={`material-symbols-outlined text-sm md:text-base transition-transform ${expandedId === word.id ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
                {expandedId === word.id && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-black/10">
                    <div className="pt-3 md:pt-4 space-y-3">
                      {word.meaning && <div><p className="font-headline font-bold text-xs md:text-sm text-primary mb-1">{t('vocab_notebook.definition')}</p><p className="text-sm md:text-base">{word.meaning}</p></div>}
                      {word.example && <div><p className="font-headline font-bold text-xs md:text-sm text-primary mb-1">{t('vocab_notebook.example')}</p><p className="text-sm md:text-base italic text-on-surface-variant">&ldquo;{word.example}&rdquo;</p></div>}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        {['new', 'learning', 'mastered'].map(m => (
                          <button key={m} onClick={() => handleMasteryChange(word.id, m)} className={`px-3 py-1.5 rounded-full font-headline font-bold text-xs transition-all active:scale-95 ${word.mastery === m ? 'bg-black text-white' : 'border-2 border-black/20 hover:border-black'}`}>
                            {t(`vocab_notebook.tag_${m}`)}
                          </button>
                        ))}
                        <button onClick={() => handleDelete(word.id)} className="px-3 py-1.5 rounded-full font-headline font-bold text-xs border-2 border-error/30 text-error hover:bg-error/10 transition-all active:scale-95 ml-auto">{t('common.delete')}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add FAB — shifted up to clear sticky footer */}
      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 md:bottom-28 right-6 md:right-8 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl border-[3px] border-white hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Sticky Next footer */}
      <footer className="fixed bottom-0 left-0 md:left-[224px] lg:left-[256px] right-0 h-20 md:h-24 bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 z-30 border-t-2 border-black/5">
        <div className="flex flex-col">
          <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ôn từ vựng</p>
          <p className="font-headline font-bold text-sm md:text-base">{mastered} từ đã thuộc</p>
        </div>
        <button onClick={handleNext} className="px-6 md:px-10 lg:px-12 py-3 md:py-4 bg-black text-white rounded-full font-headline font-black text-sm md:text-base lg:text-lg flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform active:scale-95 sketch-border">
          Hoàn thành ngày học
          <span className="material-symbols-outlined text-lg md:text-xl">celebration</span>
        </button>
      </footer>

      {/* Add Word Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest sketch-card p-6 md:p-8 max-w-md w-full">
            <h3 className="font-headline font-bold text-lg md:text-xl mb-4">{t('vocab_notebook.add_title')}</h3>
            <div className="space-y-3">
              <input type="text" value={newWord} onChange={e => setNewWord(e.target.value)} placeholder={t('vocab_notebook.word_placeholder')} className="w-full px-4 py-2.5 border-2 border-black rounded-xl font-body text-sm bg-white focus:outline-none" />
              <input type="text" value={newMeaning} onChange={e => setNewMeaning(e.target.value)} placeholder={t('vocab_notebook.meaning_placeholder')} className="w-full px-4 py-2.5 border-2 border-black/30 rounded-xl font-body text-sm bg-white focus:outline-none" />
              <input type="text" value={newExample} onChange={e => setNewExample(e.target.value)} placeholder={t('vocab_notebook.example_placeholder')} className="w-full px-4 py-2.5 border-2 border-black/30 rounded-xl font-body text-sm bg-white focus:outline-none" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 sketch-border bg-surface-container font-headline font-bold text-sm active:scale-95">{t('common.cancel')}</button>
              <button onClick={handleAdd} disabled={adding || !newWord.trim()} className="flex-1 py-2.5 sketch-border bg-black text-white font-headline font-bold text-sm active:scale-95 disabled:opacity-50">{adding ? t('vocab_notebook.adding') : t('vocab_notebook.add_word')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Vocab Quiz Modal */}
      {quizPhase === 'active' && quizQuestions.length > 0 && (
        <QuizModal title="Vocab Quiz" subtitle="Kiểm tra từ vựng của bạn" questions={quizQuestions} onComplete={handleQuizComplete} onClose={() => { setQuizPhase('idle'); setQuizQuestions([]); }} />
      )}
    </AppLayout>
  );
};

  useEffect(() => {
    async function loadVocab() {
      try {
        if (journalId) {
          // Load session-specific vocab from journal feedback
          const res = await apiRequest(`/journals/${journalId}/review-items`) as any;
          setVocabItems(res.items || []);
        } else {
          // SRS: load due items for spaced repetition
          const res = await getDueVocab(20);
          setVocabItems(res.items || []);
        }
      } catch (err) {
        console.error('Failed to load vocab', err);
      } finally {
        setLoading(false);
      }
    }
    loadVocab();
  }, [journalId]);

  const currentVocab = vocabItems[currentIndex];
  const isFinished = currentIndex >= vocabItems.length && !loading;

  const handleGotIt = async () => {
    if (!currentVocab || actionLoading) return;
    setActionLoading(true);
    try {
      if (currentVocab.id) {
        // SRS review: quality 5 = perfect recall
        await reviewVocabItem(currentVocab.id, 5);
      }
      setRememberedCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleReviewLater = async () => {
    if (!currentVocab || actionLoading) return;
    setActionLoading(true);
    try {
      if (currentVocab.id) {
        // SRS review: quality 1 = forgot / needs review
        await reviewVocabItem(currentVocab.id, 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleContinue = (skipped = false) => {
    trackReviewDone({ rememberedCount, skipped });
    const target = journalId ? `#completion?journalId=${journalId}` : '#completion';
    window.location.hash = target;
  };

  return (
    <AppLayout activePath="#journal">
      <div className="min-h-[calc(100vh-8rem)] pb-28 md:pb-32">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">

          {/* Header Instruction */}
          <section className="flex flex-col items-center text-center space-y-2 md:space-y-3 pt-2 md:pt-4">
            <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight -rotate-1 inline-block">
              {t('vocab_review.title')}
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base lg:text-lg max-w-xl">
              {t('vocab_review.subtitle')}
            </p>
          </section>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
            </div>
          ) : isFinished ? (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
              <span className="material-symbols-outlined text-6xl text-tertiary">celebration</span>
              <h2 className="font-headline text-2xl md:text-3xl font-bold">{vocabItems.length === 0 ? t('vocab_review.no_items', { defaultValue: 'Your notebook is empty!' }) : t('vocab_review.finished', { defaultValue: "You've reviewed all items!" })}</h2>
              <button onClick={() => handleContinue()} className="px-6 py-3 bg-black text-white rounded-full font-bold mt-4">
                {t('vocab_review.finish')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 lg:gap-8">
              {/* Primary Phrase Card */}
              <div className="lg:col-span-7 bg-surface-container-lowest sketch-border p-6 md:p-8 lg:p-10 flex flex-col justify-between min-h-[320px] md:min-h-[380px]">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="bg-secondary-container text-on-secondary-container px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-bold border-2 border-black uppercase">
                      {t('vocab_review.phrase_tag')}
                    </span>
                    <span className="material-symbols-outlined text-2xl md:text-3xl lg:text-4xl text-secondary">lightbulb</span>
                  </div>
                  <h3 className="font-headline text-4xl md:text-5xl lg:text-6xl font-black italic">
                    {currentVocab.word}
                  </h3>
                  <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t-2 border-dashed border-outline-variant">
                    <div>
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-secondary mb-1">{t('vocab_review.meaning')}</p>
                      <p className="text-lg md:text-xl lg:text-2xl font-medium">{currentVocab.meaning || 'No meaning provided'}</p>
                    </div>
                    {currentVocab.example && (
                      <div>
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-secondary mb-1">{t('vocab_review.example')}</p>
                        <p className="text-lg md:text-xl lg:text-2xl italic text-tertiary">
                          "{currentVocab.example}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 md:gap-4 mt-8 md:mt-10">
                  <button 
                    onClick={handleGotIt}
                    disabled={actionLoading}
                    className="flex-1 py-3 md:py-4 rounded-full border-[3px] border-black font-bold text-sm md:text-base lg:text-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-tertiary-container text-white hover:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">check_circle</span>
                    {actionLoading ? '...' : t('vocab_review.got_it')}
                  </button>
                  <button 
                    onClick={handleReviewLater}
                    disabled={actionLoading}
                    className="flex-1 py-3 md:py-4 rounded-full border-[3px] border-black font-bold text-sm md:text-base lg:text-lg transition-all flex items-center justify-center gap-2 active:scale-95 bg-surface-container-highest text-black hover:bg-secondary-container"
                  >
                    <span className="material-symbols-outlined text-lg md:text-xl">replay</span>
                    {t('vocab_review.review_later')}
                  </button>
                </div>
              </div>

              {/* Pattern & Illustration Side Column */}
              <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6 lg:gap-8">
                {/* Pattern Card */}
                <div className="bg-surface-container-high sketch-border p-5 md:p-6 lg:p-8 flex-1">
                  <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <span className="material-symbols-outlined text-primary text-xl md:text-2xl lg:text-3xl">architecture</span>
                    <h4 className="font-headline text-lg md:text-xl lg:text-2xl font-bold">{t('vocab_review.sentence_pattern')}</h4>
                  </div>
                  <div className="bg-surface-container-lowest border-2 border-black rounded-xl p-4 md:p-5 lg:p-6 mb-3 md:mb-4">
                    <p className="text-xl md:text-2xl lg:text-3xl font-black font-headline tracking-tighter">I had [noun].</p>
                  </div>
                  <p className="text-on-surface-variant text-xs md:text-sm mb-4 md:mb-6">
                    {t('vocab_review.pattern_desc')}
                  </p>
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-white/50 rounded-lg">
                      <span className="material-symbols-outlined text-tertiary text-lg md:text-xl">subdirectory_arrow_right</span>
                      <p className="font-medium text-sm md:text-base">I had <span className="text-tertiary font-bold">lunch</span>.</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-white/50 rounded-lg">
                      <span className="material-symbols-outlined text-tertiary text-lg md:text-xl">subdirectory_arrow_right</span>
                      <p className="font-medium text-sm md:text-base">I had <span className="text-tertiary font-bold">a dream</span>.</p>
                    </div>
                  </div>
                </div>

                {/* Illustration Card */}
                <div className="bg-white sketch-border p-4 md:p-6 flex flex-col items-center justify-center text-center">
                  <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center mb-3 md:mb-4">
                    <span className="material-symbols-outlined text-[80px] md:text-[100px] lg:text-[120px] text-primary/30">auto_stories</span>
                  </div>
                  <p className="font-headline font-bold italic text-sm md:text-base">
                    "{t('vocab_review.illustration_quote')}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        {!isFinished && !loading && (
          <footer className="fixed bottom-0 left-0 md:left-[224px] lg:left-[256px] right-0 h-20 md:h-24 bg-surface-container-highest/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 lg:px-12 z-30 border-t-2 border-black/5">
            <div className="flex flex-col">
              <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {t('vocab_review.step_of', { current: currentIndex + 1, total: vocabItems.length })}
              </p>
              <p className="font-headline font-bold text-sm md:text-base">Vocabulary Builder</p>
            </div>
            <button 
              onClick={() => handleContinue(true)}
              className="px-6 md:px-10 lg:px-12 py-3 md:py-4 bg-black text-white rounded-full font-headline font-black text-sm md:text-base lg:text-lg flex items-center gap-2 md:gap-3 hover:scale-105 transition-transform active:scale-95 sketch-border"
            >
              Skip
              <span className="material-symbols-outlined text-lg md:text-xl">fast_forward</span>
            </button>
          </footer>
        )}
      </div>
    </AppLayout>
  );
};

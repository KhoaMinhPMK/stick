import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';
import { createVocabItem } from '../../services/api/endpoints';
import { trackSessionStart, trackSubmissionSent } from '../../services/analytics/coreLoop';

const QUICK_PROMPTS = [
  { icon: 'lightbulb', key: 'prompt_meal' },
  { icon: 'mood', key: 'prompt_smile' },
  { icon: 'rocket_launch', key: 'prompt_goals' },
];

export const JournalWorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [showHelper, setShowHelper] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [journalId, setJournalId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const sessionTrackedRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  // Track session start once
  useEffect(() => {
    if (!sessionTrackedRef.current) {
      trackSessionStart({});
      sessionTrackedRef.current = true;
    }
  }, []);

  const journalIdFromUrl = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('journalId');
  }, []);

  // Load existing draft if journalId is in URL
  useEffect(() => {
    if (!journalIdFromUrl) return;
    setIsLoadingDraft(true);
    setJournalId(journalIdFromUrl);
    apiRequest<{ journal: { content: string } }>(`/journals/${journalIdFromUrl}`)
      .then(res => setText(res.journal.content || ''))
      .catch(err => console.error('Failed to load draft', err))
      .finally(() => setIsLoadingDraft(false));
  }, [journalIdFromUrl]);

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const targetWords = 50;
  const progress = Math.min(wordCount / targetWords, 1);
  const canSubmit = wordCount >= 10;

  const [vocabSaved, setVocabSaved] = useState(false);

  const handleAddVocabToLibrary = async () => {
    try {
      for (const item of vocabulary) {
        await createVocabItem({ word: item.word, meaning: item.meaning });
      }
      setVocabSaved(true);
      setTimeout(() => setVocabSaved(false), 2500);
    } catch (err) {
      console.error('Failed to add vocab to library', err);
    }
  };

  const quickStarters = [
    t('journal_workspace.quick_start_1'),
    t('journal_workspace.quick_start_2'),
    t('journal_workspace.quick_start_3'),
  ];

  const vocabulary = [
    { word: 'Exhausted', meaning: t('journal_workspace.vocab_suggest.exhausted') },
    { word: 'Productive', meaning: t('journal_workspace.vocab_suggest.productive') },
    { word: 'Hang out', meaning: t('journal_workspace.vocab_suggest.hang_out') },
  ];

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      let id = journalId;
      if (!id) {
        const res = await apiRequest<{ journal: { id: string } }>('/journals', {
          method: 'POST',
          body: { title: 'Daily Journal', content: text, status: 'draft', language: 'en' },
        });
        id = res.journal.id;
      } else {
        await apiRequest(`/journals/${id}`, {
          method: 'PATCH',
          body: { content: text },
        });
      }
      window.location.hash = `#feedback?journalId=${id}`;
      trackSubmissionSent({ wordCount, typingTimeMs: Date.now() - startTimeRef.current });
    } catch (err) {
      console.error('Failed to submit journal', err);
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!text.trim() || isSaving) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      if (!journalId) {
        const res = await apiRequest<{ journal: { id: string } }>('/journals', {
          method: 'POST',
          body: { title: 'Daily Journal', content: text, status: 'draft', language: 'en' },
        });
        setJournalId(res.journal.id);
        window.history.replaceState(null, '', `#journal-workspace?journalId=${res.journal.id}`);
      } else {
        await apiRequest(`/journals/${journalId}`, {
          method: 'PATCH',
          body: { content: text },
        });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save draft', err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const insertStarter = (starter: string) => {
    setText(prev => prev + (prev.length > 0 ? ' ' : '') + starter);
  };

  const insertPrompt = (key: string) => {
    const promptText = t(`journal_workspace.${key}`);
    setText(prev => prev + (prev.length > 0 ? ' ' : '') + promptText);
  };

  // Generate notebook lines
  const notebookLines = Array.from({ length: 11 }, (_, i) => i);

  return (
    <AppLayout activePath="#journal">
      {isLoadingDraft ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      ) : (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-5 md:gap-8 lg:gap-10">
        
        {/* Editor Column */}
        <div className="flex-1 space-y-5 md:space-y-6 lg:space-y-8">
          {/* Main Editor Card */}
          <div className="sketch-border bg-surface-container-lowest p-5 md:p-7 lg:p-10 min-h-[350px] md:min-h-[450px] lg:min-h-[600px] flex flex-col relative">
            
            {/* Decorative Notebook Lines */}
            <div className="absolute inset-x-0 top-28 md:top-32 bottom-16 md:bottom-20 flex flex-col pointer-events-none px-5 md:px-10">
              {notebookLines.map(i => (
                <div key={i} className="h-8 md:h-10 border-b border-black/5" />
              ))}
            </div>

            {/* Header */}
            <div className="mb-6 md:mb-10 lg:mb-12 relative z-10">
              <h2 className="font-headline text-2xl md:text-3xl lg:text-4xl font-extrabold -rotate-1 origin-left">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <p className="font-body text-on-surface-variant italic mt-1 md:mt-2 text-sm md:text-base">
                {t('journal_workspace.topic_label')}: {t('journal_workspace.prompt_title')}
              </p>
              {wordCount > 0 && (
                <span className="inline-block mt-2 text-[10px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 bg-tertiary-container/20 text-tertiary font-bold rounded-full border border-tertiary/20">
                  {t('journal_workspace.draft_saved')}
                </span>
              )}
            </div>

            {/* Text Area */}
            <div className="relative flex-1 z-10">
              <textarea
                className="w-full h-full min-h-[150px] md:min-h-[250px] bg-transparent border-none focus:ring-0 text-lg md:text-xl lg:text-2xl font-body leading-relaxed text-black/90 font-medium placeholder:text-stone-300 resize-none selection:bg-secondary-container"
                placeholder={t('journal_workspace.placeholder')}
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Bottom Bar */}
            <div className="mt-6 md:mt-10 lg:mt-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-t-2 border-black/10 pt-4 md:pt-6 lg:pt-8 relative z-10">
              <div className="flex gap-4 md:gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-on-surface-variant">{t('journal_workspace.word_count')}</span>
                  <span className="text-xl md:text-2xl lg:text-3xl font-black font-headline">{wordCount} / {targetWords}</span>
                </div>
              </div>
              <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                <button 
                  onClick={handleSaveDraft}
                  disabled={wordCount === 0 || isSaving}
                  className="flex-1 sm:flex-none px-4 md:px-6 lg:px-8 py-2 md:py-3 rounded-full border-2 border-black font-bold text-sm md:text-base hover:bg-surface-container transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? '...' : saveStatus === 'saved' ? '\u2713 Saved' : saveStatus === 'error' ? 'Error' : t('journal_workspace.save_draft')}
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className={`flex-1 sm:flex-none px-5 md:px-8 lg:px-10 py-2 md:py-3 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all ${
                    canSubmit && !isSubmitting
                      ? 'bg-black text-white hover:scale-105 active:scale-95'
                      : 'bg-surface-dim text-stone-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isSubmitting ? '...' : t('journal_workspace.submit')}
                  {!isSubmitting && <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Prompts (Bento Style) */}
          {wordCount < 5 && (
            <div className="space-y-3">
              <p className="font-label font-bold text-stone-500 uppercase tracking-widest text-[10px] md:text-xs">
                {t('journal_workspace.stuck_label')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => insertPrompt(prompt.key)}
                    className="sketch-border p-4 md:p-5 lg:p-6 bg-surface-container-low flex flex-col justify-between text-left hover:-rotate-1 transition-transform cursor-pointer active:scale-95"
                  >
                    <span className="material-symbols-outlined text-2xl md:text-3xl lg:text-4xl text-black mb-2 md:mb-4">{prompt.icon}</span>
                    <p className="font-bold text-sm md:text-base lg:text-lg">{t(`journal_workspace.${prompt.key}`)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inline starter chips */}
          {wordCount === 0 && (
            <div className="flex flex-wrap gap-2 md:gap-3">
              {quickStarters.map((starter, i) => (
                <button 
                  key={i}
                  onClick={() => insertStarter(starter)}
                  className="px-4 md:px-6 py-2 md:py-3 bg-surface-container-low border-2 border-black rounded-full text-sm md:text-base font-medium hover:bg-secondary-container transition-colors active:scale-95"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}

          {/* Motivation Block */}
          <div className="bg-tertiary-container/10 border-2 border-dashed border-tertiary-container p-4 md:p-6 rounded-lg flex items-center gap-3 md:gap-6">
            <div className="bg-tertiary text-on-tertiary p-2 md:p-3 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined text-lg md:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-tertiary text-sm md:text-base">{t('journal_workspace.motivation_title')}</h4>
              <p className="text-stone-600 text-xs md:text-sm">{t('journal_workspace.motivation_desc', { target: targetWords })}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Helper Column */}
        <aside className={`w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4 md:space-y-6 lg:space-y-8 ${showHelper ? '' : 'hidden'}`}>
          
          {/* Learning Assistant — Stick says */}
          <div className="sketch-border bg-surface-container-high p-5 md:p-6 lg:p-8 flex flex-col items-center text-center lg:sticky lg:top-24">
            <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 mb-4 md:mb-6 bg-white rounded-full border-2 border-black flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-4xl md:text-5xl lg:text-6xl text-black/60">sentiment_satisfied</span>
            </div>
            <h3 className="font-headline text-base md:text-lg lg:text-xl font-bold mb-2 md:mb-3">{t('journal_workspace.stick_says')}</h3>
            <p className="text-xs md:text-sm leading-relaxed mb-4 md:mb-6">
              {wordCount > 0
                ? t('journal_workspace.stick_feedback_typing', { count: wordCount, target: targetWords })
                : t('journal_workspace.stick_feedback_empty')
              }
            </p>
            <div className="w-full bg-white border-2 border-black rounded-full h-3 md:h-4 relative overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-tertiary-container border-r-2 border-black transition-all duration-500" 
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[10px] md:text-xs font-bold mt-1 md:mt-2">
              {t('journal_workspace.daily_goal_progress')}: {Math.round(progress * 100)}%
            </span>
          </div>

          {/* Vocabulary Suggestions */}
          <div className="sketch-border bg-secondary-container/30 p-5 md:p-6 lg:p-8">
            <h3 className="font-headline text-base md:text-lg font-extrabold mb-3 md:mb-4 border-b-2 border-black pb-2">{t('journal_workspace.useful_vocab')}</h3>
            <ul className="space-y-3 md:space-y-4">
              {vocabulary.map((item, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-bold text-black text-base md:text-lg">{item.word}</span>
                  <span className="text-[10px] md:text-xs text-on-surface-variant italic">{item.meaning}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleAddVocabToLibrary}
              disabled={vocabSaved}
              className="mt-4 md:mt-6 lg:mt-8 w-full py-1.5 md:py-2 border-2 border-dashed border-black rounded-lg font-bold text-xs md:text-sm hover:bg-white transition-colors active:scale-95 disabled:opacity-50"
            >
              {vocabSaved ? '✓ Saved!' : `+ ${t('journal_workspace.add_to_library')}`}
            </button>
          </div>

          {/* Contextual Tip */}
          <div className="p-4 md:p-5 lg:p-6 bg-tertiary/5 rounded-xl border-l-4 border-tertiary italic text-xs md:text-sm">
            {t('journal_workspace.tip')}
          </div>
        </aside>

        {/* Mobile toggle for helper panel */}
        {!showHelper && (
          <button 
            onClick={() => setShowHelper(true)}
            className="fixed bottom-20 right-4 w-12 h-12 bg-secondary-container border-2 border-black rounded-full flex items-center justify-center shadow-lg active:scale-95 z-30"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
          </button>
        )}
      </div>
      )}
    </AppLayout>
  );
};

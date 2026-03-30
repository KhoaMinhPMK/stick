import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

export const HistoryDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const id = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('id');
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiRequest(`/journals/${id}`) as any;
        setJournal(res.journal);
      } catch (err) {
        console.error('Failed to load journal detail', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppLayout activePath="#history">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      </AppLayout>
    );
  }

  if (!journal) {
    return (
      <AppLayout activePath="#history">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">error_outline</span>
          <p className="font-headline font-bold text-xl">{t('history_detail.not_found', { defaultValue: 'Journal not found' })}</p>
          <button onClick={() => window.location.hash = '#progress'} className="mt-4 text-blue-500 underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  let parsedFeedback: any = null;
  try {
    if (typeof journal.feedback === 'string' && journal.feedback) {
      parsedFeedback = JSON.parse(journal.feedback);
    } else if (typeof journal.feedback === 'object') {
      parsedFeedback = journal.feedback;
    }
  } catch (e) {
    console.error('Failed to parse feedback', e);
  }

  const enhancedText = parsedFeedback?.enhancedText || parsedFeedback?.enhancedContent || "Feedback not generated yet.";
  const vocabBoosters = parsedFeedback?.vocabularyBoosters || [];
  const sentencePatterns = parsedFeedback?.sentencePattern ? [parsedFeedback.sentencePattern] : (parsedFeedback?.sentencePatterns || []);
  const score = journal.score;

  return (
    <AppLayout activePath="#history">
      <div className="max-w-7xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => (window.location.hash = '#progress')}
          className="flex items-center gap-2 font-headline font-bold text-stone-500 hover:text-black hover:scale-105 transition-transform group mb-4 md:mb-6"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="text-sm md:text-base">{t('history_detail.return')}</span>
        </button>

        {/* Header Section */}
        <section className="mb-8 md:mb-12 lg:mb-16">
          <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <span className="bg-surface-container-highest px-2 md:px-3 py-0.5 md:py-1 rounded-full border-2 border-black font-label text-[10px] md:text-sm font-bold uppercase">{t('history_detail.journal_entry')}</span>
            <div className="flex items-center gap-1 md:gap-2 text-tertiary font-bold">
              <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="font-label uppercase tracking-widest text-[10px] md:text-xs">{t('history_detail.speaking_completed')}</span>
            </div>
          </div>
          <h2 className="font-headline text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight mb-3 md:mb-4 leading-tight">
            {new Date(journal.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} — <span className="italic text-secondary">"{journal.title}"</span>
          </h2>
          <div className="w-20 md:w-32 h-1.5 md:h-2 bg-primary rounded-full" />
        </section>

        {/* The Comparison Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 flex flex-col gap-5 md:gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Original Text */}
              <div className="sketch-card bg-surface-container-low p-5 md:p-8 relative">
                <span className="absolute -top-3 md:-top-4 left-4 md:left-6 bg-surface px-3 md:px-4 font-headline font-bold border-2 border-black rounded-full text-[10px] md:text-sm">{t('history_detail.your_draft')}</span>
                <p className="text-sm md:text-base leading-relaxed text-on-surface-variant font-medium mt-2 whitespace-pre-wrap">
                  {journal.content}
                </p>
              </div>

              {/* Enhanced Version */}
              <div className="sketch-card bg-surface-container-highest p-5 md:p-8 relative shadow-[4px_4px_0_0_#000] md:shadow-[8px_8px_0_0_#000]">
                <span className="absolute -top-3 md:-top-4 left-4 md:left-6 bg-secondary-container px-3 md:px-4 font-headline font-bold border-2 border-black rounded-full text-[10px] md:text-sm">{t('history_detail.enhanced_version')}</span>
                <p className="text-sm md:text-base leading-relaxed text-black font-bold mt-2 whitespace-pre-wrap">
                  {enhancedText}
                </p>
                <div className="mt-4 md:mt-8 flex justify-between items-center">
                  <button className="material-symbols-outlined text-black bg-white rounded-full p-1.5 md:p-2 border-2 border-black hover:scale-110 transition-transform text-lg md:text-2xl">volume_up</button>
                  <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest opacity-40">AI-Grammar Polish</span>
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="sketch-card bg-white p-5 md:p-8 lg:p-10">
              <h3 className="font-headline text-lg md:text-2xl font-black mb-5 md:mb-8 flex items-center gap-2 md:gap-3">
                <span className="material-symbols-outlined text-xl md:text-3xl">auto_awesome</span>
                {t('history_detail.session_insights')}
              </h3>
              <div className="space-y-6 md:space-y-12">
                {/* Vocabulary Boosters */}
                {vocabBoosters.length > 0 && (
                  <div>
                    <p className="font-label uppercase tracking-widest text-[10px] md:text-xs font-black text-secondary mb-3 md:mb-4">{t('history_detail.vocab_boosters')}</p>
                    <div className="flex flex-wrap gap-3 md:gap-4">
                      {vocabBoosters.map((v: any, i: number) => (
                        <div
                          key={i}
                          className="bg-surface-container p-3 md:p-4 rounded-xl border-2 border-black hover:-rotate-2 transition-transform cursor-help"
                          title={v.context || v.meaning}
                        >
                          <span className="font-bold block text-sm md:text-lg italic">{v.word}</span>
                          <span className="text-[10px] md:text-sm opacity-70">{v.meaning || v.translation || t(v.meaning)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentence Pattern */}
                {sentencePatterns.length > 0 && sentencePatterns.map((pat: any, idx: number) => (
                  <div key={idx} className="bg-secondary-container/30 p-4 md:p-6 rounded-2xl border-2 border-dashed border-black/30 mt-4">
                    <p className="font-label uppercase tracking-widest text-[10px] md:text-xs font-black text-secondary mb-3 md:mb-4">{t('history_detail.sentence_pattern')}</p>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-black text-white rounded-lg flex items-center justify-center font-bold text-sm md:text-base">?</div>
                      <div>
                        <h4 className="font-bold text-base md:text-xl mb-1 md:mb-2">"{pat.pattern}"</h4>
                        <p className="text-on-surface-variant italic text-xs md:text-sm">{pat.example}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4 md:space-y-6 lg:space-y-8">
            {/* Speaking Score */}
            <div className="sketch-card bg-tertiary-container text-white p-5 md:p-6 lg:p-8">
              <h4 className="font-headline font-bold text-base md:text-xl mb-4 md:mb-6">{t('history_detail.speaking_score', { defaultValue: 'Writing Score' })}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl lg:text-6xl font-black">{score || '--'}</span>
                {score != null && <span className="text-lg md:text-2xl font-bold opacity-60">/100</span>}
              </div>
              <p className="mt-3 md:mt-4 text-xs md:text-sm opacity-80 leading-snug">{t('history_detail.score_feedback')}</p>
              {score != null && (
                <div className="mt-5 md:mt-8 space-y-2 md:space-y-3">
                  <div className="h-1.5 md:h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all" style={{ width: `${score}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] md:text-xs font-bold tracking-widest">
                    <span>{t('history_detail.accuracy')}</span>
                    <span>{score}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Reflection Note */}
            <div className="sketch-card bg-surface-container p-4 md:p-6">
              <p className="font-label uppercase tracking-widest text-[10px] md:text-xs font-black mb-3 md:mb-4">{t('history_detail.personal_note')}</p>
              <p className="italic font-medium leading-relaxed text-xs md:text-sm">
                "I should remember the word 'sprinting' next time I talk about animals. It sounds more natural than just 'running fast'."
              </p>
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-black/10 flex items-center gap-2 md:gap-3">
                <span className="material-symbols-outlined text-stone-400 text-sm md:text-base">calendar_today</span>
                <span className="text-[10px] md:text-sm font-bold opacity-50 uppercase">{t('history_detail.saved_to_favorites')}</span>
              </div>
            </div>

            {/* Encouragement */}
            <div className="flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 opacity-40">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-black/30 mb-3 md:mb-4">emoji_events</span>
              <p className="font-headline italic font-bold text-sm md:text-base text-center">{t('history_detail.encouragement')}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

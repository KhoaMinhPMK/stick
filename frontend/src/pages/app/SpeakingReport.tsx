import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

interface FeedbackData {
  rewrittenVersion?: string;
  corrections?: Array<{ original: string; corrected: string; explanation: string }>;
  patterns?: Array<{ pattern: string; example: string }>;
  score?: number;
}

export const SpeakingReportPage: React.FC = () => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load latest journal feedback
    apiRequest<{ journals: Array<{ id: string; status: string }> }>('/journals?limit=5')
      .then(async (res) => {
        const completed = res.journals?.find(j => j.status === 'completed') || res.journals?.[0];
        if (completed) {
          const detail = await apiRequest<{ journal: { aiFeedback?: string } }>(`/journals/${completed.id}`);
          if (detail.journal?.aiFeedback) {
            try {
              const parsed = JSON.parse(detail.journal.aiFeedback);
              setFeedback({
                rewrittenVersion: parsed.rewritten_version || parsed.rewrittenVersion,
                corrections: parsed.corrections || [],
                patterns: parsed.useful_patterns || parsed.patterns || [],
                score: parsed.score,
              });
            } catch {
              setFeedback(null);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const overallScore = feedback?.score || 0;
  const correctionCount = feedback?.corrections?.length || 0;
  const patternCount = feedback?.patterns?.length || 0;
  // Derive sub-scores from correction patterns
  const grammarScore = correctionCount === 0 ? 95 : Math.max(60, 95 - correctionCount * 8);
  const vocabScore = patternCount > 0 ? Math.min(90, 70 + patternCount * 5) : 75;
  const fluencyScore = feedback?.rewrittenVersion ? Math.min(90, 70 + (feedback.rewrittenVersion.split(' ').length > 10 ? 15 : 5)) : 70;

  if (loading) {
    return (
      <AppLayout activePath="#library">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <p className="font-headline font-bold text-lg">Loading report...</p>
        </div>
      </AppLayout>
    );
  }

  if (!feedback) {
    return (
      <AppLayout activePath="#library">
        <div className="max-w-3xl mx-auto py-8 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">assignment</span>
          <h2 className="font-headline font-black text-2xl mb-3">No report yet</h2>
          <p className="text-on-surface-variant mb-6">Complete a journal entry to see your writing analysis report.</p>
          <button onClick={() => window.location.hash = '#journal'} className="px-6 py-3 bg-black text-white sketch-border font-headline font-bold">Start Writing</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="#library">
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-headline font-bold">{t('speaking.back', { defaultValue: 'Back to Library' })}</span>
          </button>
          <div className="bg-primary text-white font-headline font-black px-4 py-1.5 rounded-full text-sm uppercase tracking-widest sketch-border shadow-[2px_2px_0_0_#000]">
            AI Analysis
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="font-headline font-black text-4xl md:text-5xl mb-3 tracking-tighter">Writing Report</h1>
          <p className="text-on-surface-variant font-body md:text-lg">Latest Journal Analysis</p>
        </div>

        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center mb-12 relative">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-surface-container" />
            <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="502" strokeDashoffset={502 - (502 * (overallScore || grammarScore)) / 100} className="text-primary transition-all duration-1000" strokeLinecap="round" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-headline font-black text-6xl text-primary">{overallScore || grammarScore}</span>
            <span className="font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant">Overall</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          <div className="sketch-card p-4 text-center bg-surface-container-lowest">
            <span className="material-symbols-outlined text-3xl mb-2 text-green-500">spellcheck</span>
            <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Grammar</h4>
            <p className="font-black text-2xl">{grammarScore}</p>
          </div>
          <div className="sketch-card p-4 text-center bg-surface-container-lowest">
            <span className="material-symbols-outlined text-3xl mb-2 text-blue-500">dictionary</span>
            <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Vocabulary</h4>
            <p className="font-black text-2xl">{vocabScore}</p>
          </div>
          <div className="sketch-card p-4 text-center bg-surface-container-lowest">
            <span className="material-symbols-outlined text-3xl mb-2 text-orange-500">record_voice_over</span>
            <h4 className="font-headline font-bold text-sm text-stone-600 mb-1 tracking-widest uppercase">Fluency</h4>
            <p className="font-black text-2xl">{fluencyScore}</p>
          </div>
        </div>

        <h3 className="font-headline font-black text-2xl mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">feedback</span>
          Detailed Feedback
        </h3>

        {/* Feedback List */}
        <div className="space-y-4 mb-12">
          {feedback.corrections && feedback.corrections.length > 0 ? feedback.corrections.map((c, i) => (
            <div key={i} className="sketch-card bg-error/10 border-error p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-error mt-0.5">warning</span>
                <div>
                  <h4 className="font-headline font-bold text-error text-lg mb-1">
                    <s className="opacity-60">{c.original}</s> → {c.corrected}
                  </h4>
                  <p className="font-body text-stone-800">{c.explanation}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="sketch-card bg-primary/10 p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                <div>
                  <h4 className="font-headline font-bold text-primary text-lg">Great writing!</h4>
                  <p className="font-body text-stone-600">No major corrections needed. Keep it up!</p>
                </div>
              </div>
            </div>
          )}
          {feedback.patterns && feedback.patterns.length > 0 && feedback.patterns.map((p, i) => (
            <div key={`p-${i}`} className="sketch-card bg-surface-container p-5">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-warning mt-0.5">lightbulb</span>
                <div>
                  <h4 className="font-headline font-bold text-stone-800 text-lg mb-1">{p.pattern}</h4>
                  <p className="font-body text-stone-600">{p.example}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => window.history.back()} className="flex-1 sketch-border bg-surface-container-highest hover:bg-surface-container-lowest py-4 font-headline font-bold text-lg transition-colors text-center">
            {t('speaking.done', { defaultValue: 'Done Reviewing' })}
          </button>
          <button onClick={() => window.location.hash = '#journal'} className="flex-1 sketch-border bg-black text-white hover:bg-stone-800 py-4 font-headline font-bold text-lg transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">edit_note</span>
            Write Again
          </button>
        </div>

      </div>
    </AppLayout>
  );
};

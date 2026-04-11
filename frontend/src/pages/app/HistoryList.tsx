import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { apiRequest } from '../../services/api/client';

interface JournalEntry {
  id: string;
  content: string;
  mood: string | null;
  tags: string | null;
  wordCount: number;
  score: number | null;
  createdAt: string;
}

export const HistoryListPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest<{ items: JournalEntry[]; total: number; totalWords: number }>('/journals?limit=50');
        setEntries(res.items || []);
        setTotalWords(res.totalWords || res.items.reduce((s: number, e: JournalEntry) => s + (e.wordCount || 0), 0));
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = entries.filter(entry => {
    if (!search) return true;
    return entry.content.toLowerCase().includes(search.toLowerCase()) ||
      (entry.tags && entry.tags.toLowerCase().includes(search.toLowerCase()));
  });

  const avgScore = entries.length > 0
    ? Math.round(entries.filter(e => e.score != null).reduce((s, e) => s + (e.score || 0), 0) / Math.max(entries.filter(e => e.score != null).length, 1))
    : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t('history_list.today');
    if (diff === 1) return t('history_list.yesterday');
    if (diff < 7) return t('history_list.days_ago', { count: diff });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-on-surface-variant';
    if (score >= 90) return 'text-tertiary';
    if (score >= 75) return 'text-primary';
    return 'text-on-surface-variant';
  };

  const getMoodIcon = (mood: string | null) => {
    switch (mood) {
      case 'happy': return 'sentiment_satisfied';
      case 'sad': return 'sentiment_dissatisfied';
      case 'neutral': return 'sentiment_neutral';
      default: return 'sentiment_neutral';
    }
  };

  const getTitle = (content: string) => {
    const first = content.split('\n')[0].replace(/[#*]/g, '').trim();
    return first.length > 60 ? first.slice(0, 57) + '...' : first;
  };

  return (
    <AppLayout activePath="#progress">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button onClick={() => (window.location.hash = '#progress')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('progress.title', { defaultValue: 'Progress' })}</span>
          </button>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('history_list.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('history_list.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg md:text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('history_list.search_placeholder')}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 md:border-3 border-black rounded-full font-body text-sm md:text-base bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 md:gap-6 mb-6 md:mb-8 text-xs md:text-sm">
          <div className="flex items-center gap-1.5 md:gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm md:text-base">history_edu</span>
            <span className="font-bold">{entries.length} {t('history_list.total_entries')}</span>
          </div>
          {avgScore > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 text-tertiary">
              <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <span className="font-bold">{t('history_list.avg_score', { score: avgScore })}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 md:gap-2 text-secondary">
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <span className="font-bold">{t('history_list.total_words', { count: totalWords })}</span>
          </div>
        </div>

        {/* Entry List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-stone-300 mb-4">{entries.length === 0 ? 'edit_note' : 'search_off'}</span>
            <p className="font-headline font-bold text-lg md:text-xl text-stone-400">
              {entries.length === 0 ? 'No journal entries yet' : t('history_list.no_results')}
            </p>
            {entries.length === 0 && (
              <button onClick={() => (window.location.hash = '#journal')} className="mt-4 px-6 py-2.5 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95">
                Write your first journal
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filtered.map((entry, i) => (
              <div
                key={entry.id}
                onClick={() => (window.location.hash = `#history-detail?id=${entry.id}`)}
                className={`group sketch-card bg-surface-container-lowest p-4 md:p-6 cursor-pointer hover:shadow-[4px_4px_0_0_#000] transition-all active:scale-[0.99] ${
                  i % 2 === 0 ? 'hover:rotate-[0.3deg]' : 'hover:-rotate-[0.3deg]'
                }`}
              >
                <div className="flex items-start gap-3 md:gap-5">
                  {/* Date Column */}
                  <div className="flex flex-col items-center shrink-0 w-14 md:w-20">
                    <span className="text-2xl md:text-4xl font-headline font-black text-primary">
                      {new Date(entry.createdAt).getDate()}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-[10px] md:text-xs text-stone-400 mt-0.5">{formatDate(entry.createdAt)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-headline font-bold text-sm md:text-base lg:text-lg line-clamp-1">
                        {getTitle(entry.content)}
                      </h4>
                      <span className={`material-symbols-outlined text-lg md:text-xl shrink-0 ${getScoreColor(entry.score)}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {getMoodIcon(entry.mood)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      {entry.tags && entry.tags.split(',').map(tag => (
                        <span key={tag} className="bg-surface-container-highest px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold border border-black/10">
                          #{tag.trim()}
                        </span>
                      ))}
                      <span className="text-[10px] md:text-xs text-on-surface-variant font-medium ml-auto">
                        {entry.wordCount} {t('history_list.words')}
                        {entry.score != null && ` · ${t('history_list.score')}: ${entry.score}%`}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center">
                    <span className="material-symbols-outlined text-sm md:text-base">arrow_forward</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 md:mt-16 flex flex-col items-center text-center opacity-50">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-black/20 mb-2 md:mb-3">history_edu</span>
          <p className="font-headline italic font-bold text-xs md:text-sm">"{t('history_list.footer_quote')}"</p>
        </div>
      </div>
    </AppLayout>
  );
};

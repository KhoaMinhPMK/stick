import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const mockEntries = [
  { id: '1', date: '2026-03-26', title: 'history_list.entry_park', tags: ['Nature', 'Reflective'], wordCount: 180, mood: 'sentiment_satisfied', score: 85 },
  { id: '2', date: '2026-03-25', title: 'history_list.entry_coffee', tags: ['Daily Life', 'Vocabulary'], wordCount: 145, mood: 'sentiment_satisfied', score: 78 },
  { id: '3', date: '2026-03-24', title: 'history_list.entry_movie', tags: ['Entertainment', 'Opinion'], wordCount: 210, mood: 'sentiment_neutral', score: 92 },
  { id: '4', date: '2026-03-22', title: 'history_list.entry_cooking', tags: ['Food', 'Instructions'], wordCount: 165, mood: 'sentiment_satisfied', score: 88 },
  { id: '5', date: '2026-03-21', title: 'history_list.entry_dream', tags: ['Creative', 'Abstract'], wordCount: 195, mood: 'sentiment_dissatisfied', score: 70 },
  { id: '6', date: '2026-03-20', title: 'history_list.entry_friend', tags: ['Social', 'Memory'], wordCount: 220, mood: 'sentiment_satisfied', score: 95 },
  { id: '7', date: '2026-03-18', title: 'history_list.entry_weather', tags: ['Nature', 'Daily Life'], wordCount: 130, mood: 'sentiment_neutral', score: 75 },
  { id: '8', date: '2026-03-17', title: 'history_list.entry_childhood', tags: ['Memory', 'Creative'], wordCount: 250, mood: 'sentiment_satisfied', score: 90 },
];

type FilterType = 'all' | 'week' | 'month';

export const HistoryListPage: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = mockEntries.filter(entry => {
    if (search) {
      return t(entry.title).toLowerCase().includes(search.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return t('history_list.today');
    if (diff === 1) return t('history_list.yesterday');
    if (diff < 7) return t('history_list.days_ago', { count: diff });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-tertiary';
    if (score >= 75) return 'text-primary';
    return 'text-on-surface-variant';
  };

  return (
    <AppLayout activePath="#history">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('history_list.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('history_list.subtitle')}</p>
        </div>

        {/* Search + Filters */}
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
          <div className="flex gap-2">
            {(['all', 'week', 'month'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm whitespace-nowrap transition-all active:scale-95 ${
                  filter === f
                    ? 'bg-black text-white border-2 border-black'
                    : 'bg-surface-container border-2 border-black/20 hover:border-black/50 text-on-surface-variant'
                }`}
              >
                {t(`history_list.filter_${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 md:gap-6 mb-6 md:mb-8 text-xs md:text-sm">
          <div className="flex items-center gap-1.5 md:gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm md:text-base">history_edu</span>
            <span className="font-bold">{mockEntries.length} {t('history_list.total_entries')}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-tertiary">
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            <span className="font-bold">{t('history_list.avg_score', { score: 84 })}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-secondary">
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
            <span className="font-bold">{t('history_list.total_words', { count: 1495 })}</span>
          </div>
        </div>

        {/* Entry List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-stone-300 mb-4">search_off</span>
            <p className="font-headline font-bold text-lg md:text-xl text-stone-400">{t('history_list.no_results')}</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filtered.map((entry, i) => (
              <div
                key={entry.id}
                onClick={() => (window.location.hash = '#history-detail')}
                className={`group sketch-card bg-surface-container-lowest p-4 md:p-6 cursor-pointer hover:shadow-[4px_4px_0_0_#000] transition-all active:scale-[0.99] ${
                  i % 2 === 0 ? 'hover:rotate-[0.3deg]' : 'hover:-rotate-[0.3deg]'
                }`}
              >
                <div className="flex items-start gap-3 md:gap-5">
                  {/* Date Column */}
                  <div className="flex flex-col items-center shrink-0 w-14 md:w-20">
                    <span className="text-2xl md:text-4xl font-headline font-black text-primary">
                      {new Date(entry.date).getDate()}
                    </span>
                    <span className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-[10px] md:text-xs text-stone-400 mt-0.5">{formatDate(entry.date)}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-headline font-bold text-sm md:text-base lg:text-lg line-clamp-1">
                        {t(entry.title)}
                      </h4>
                      <span className={`material-symbols-outlined text-lg md:text-xl shrink-0 ${getScoreColor(entry.score)}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {entry.mood}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      {entry.tags.map(tag => (
                        <span key={tag} className="bg-surface-container-highest px-2 md:px-3 py-0.5 rounded-full text-[10px] md:text-xs font-bold border border-black/10">
                          #{tag}
                        </span>
                      ))}
                      <span className="text-[10px] md:text-xs text-on-surface-variant font-medium ml-auto">
                        {entry.wordCount} {t('history_list.words')} · {t('history_list.score')}: {entry.score}%
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

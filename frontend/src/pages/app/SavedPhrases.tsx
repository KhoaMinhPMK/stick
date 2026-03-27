import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const mockPhrases = [
  { id: '1', phrase: 'Break the ice', meaning: 'saved_phrases.m_break_ice', source: 'Journal #12', date: '2026-03-25', category: 'idiom' },
  { id: '2', phrase: 'On the other hand', meaning: 'saved_phrases.m_other_hand', source: 'Lesson: Connectors', date: '2026-03-24', category: 'connector' },
  { id: '3', phrase: 'As a matter of fact', meaning: 'saved_phrases.m_matter_fact', source: 'Journal #10', date: '2026-03-23', category: 'expression' },
  { id: '4', phrase: 'Take it for granted', meaning: 'saved_phrases.m_take_granted', source: 'Feedback', date: '2026-03-22', category: 'idiom' },
  { id: '5', phrase: 'In the long run', meaning: 'saved_phrases.m_long_run', source: 'Journal #8', date: '2026-03-21', category: 'expression' },
  { id: '6', phrase: 'Nevertheless', meaning: 'saved_phrases.m_nevertheless', source: 'Lesson: Formal Writing', date: '2026-03-20', category: 'connector' },
  { id: '7', phrase: 'Hit the nail on the head', meaning: 'saved_phrases.m_nail_head', source: 'Feedback', date: '2026-03-18', category: 'idiom' },
  { id: '8', phrase: 'Not only... but also', meaning: 'saved_phrases.m_not_only', source: 'Lesson: Advanced Grammar', date: '2026-03-17', category: 'connector' },
];

type CategoryFilter = 'all' | 'idiom' | 'connector' | 'expression';

export const SavedPhrasesPage: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const filtered = mockPhrases.filter(p => {
    if (removedIds.includes(p.id)) return false;
    if (filter !== 'all' && p.category !== filter) return false;
    if (search) return p.phrase.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const handleRemove = (id: string) => {
    setRemovedIds(prev => [...prev, id]);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'idiom': return 'bg-tertiary-container text-on-tertiary-container';
      case 'connector': return 'bg-secondary-container text-on-secondary-container';
      case 'expression': return 'bg-primary-container text-on-primary-container';
      default: return 'bg-surface-container';
    }
  };

  return (
    <AppLayout activePath="#library">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button onClick={() => (window.location.hash = '#profile')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 md:mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('saved_phrases.back')}</span>
          </button>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('saved_phrases.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('saved_phrases.subtitle')}</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg md:text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('saved_phrases.search_placeholder')}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 md:border-3 border-black rounded-full font-body text-sm md:text-base bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'idiom', 'connector', 'expression'] as CategoryFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm whitespace-nowrap transition-all active:scale-95 ${
                  filter === f
                    ? 'bg-black text-white border-2 border-black'
                    : 'bg-surface-container border-2 border-black/20 hover:border-black/50 text-on-surface-variant'
                }`}
              >
                {t(`saved_phrases.filter_${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 md:gap-6 mb-6 text-xs md:text-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
            {filtered.length} {t('saved_phrases.phrases')}
          </span>
        </div>

        {/* Phrases List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-stone-300 mb-4">bookmark_border</span>
            <p className="font-headline font-bold text-lg md:text-xl text-stone-400">{t('saved_phrases.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {filtered.map((phrase, i) => (
              <div
                key={phrase.id}
                className={`group sketch-card bg-surface-container-lowest p-4 md:p-6 transition-all hover:shadow-[3px_3px_0_0_#000] ${
                  i % 2 === 0 ? 'hover:rotate-[0.2deg]' : 'hover:-rotate-[0.2deg]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3 mb-1.5">
                      <h4 className="font-headline font-bold text-base md:text-lg">&ldquo;{phrase.phrase}&rdquo;</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border border-black/10 ${getCategoryColor(phrase.category)}`}>
                        {phrase.category}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-xs md:text-sm mb-2">{t(phrase.meaning)}</p>
                    <div className="flex items-center gap-3 text-[10px] md:text-xs text-stone-400">
                      <span>{phrase.source}</span>
                      <span>·</span>
                      <span>{new Date(phrase.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(phrase.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-error/10 rounded-lg transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-sm text-error">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 md:mt-16 flex flex-col items-center text-center opacity-50">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-black/20 mb-2 md:mb-3">auto_stories</span>
          <p className="font-headline italic font-bold text-xs md:text-sm">&ldquo;{t('saved_phrases.footer_quote')}&rdquo;</p>
        </div>
      </div>
    </AppLayout>
  );
};

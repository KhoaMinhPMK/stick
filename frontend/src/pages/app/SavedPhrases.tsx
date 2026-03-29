import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getPhrases, createPhrase, deletePhrase, type SavedPhrase } from '../../services/api/endpoints';

type CategoryFilter = 'all' | 'idiom' | 'connector' | 'expression' | 'general';

export const SavedPhrasesPage: React.FC = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [phrases, setPhrases] = useState<SavedPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPhrase, setNewPhrase] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPhrases();
  }, [filter]);

  async function loadPhrases() {
    try {
      setLoading(true);
      const cat = filter === 'all' ? undefined : filter;
      const res = await getPhrases(cat, search || undefined);
      setPhrases(res.items);
    } catch (err) {
      console.error('Failed to load phrases:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await deletePhrase(id);
      setPhrases(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete phrase:', err);
    }
  };

  const handleAdd = async () => {
    if (!newPhrase.trim()) return;
    setAdding(true);
    try {
      const res = await createPhrase({
        phrase: newPhrase.trim(),
        meaning: newMeaning.trim() || undefined,
        category: newCategory,
      });
      setPhrases(prev => [res.phrase, ...prev]);
      setNewPhrase('');
      setNewMeaning('');
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to add phrase:', err);
    } finally {
      setAdding(false);
    }
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
              onKeyDown={e => e.key === 'Enter' && loadPhrases()}
              placeholder={t('saved_phrases.search_placeholder')}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 md:border-3 border-black rounded-full font-body text-sm md:text-base bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'general', 'idiom', 'connector', 'expression'] as CategoryFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm whitespace-nowrap transition-all active:scale-95 ${
                  filter === f
                    ? 'bg-black text-white border-2 border-black'
                    : 'bg-surface-container border-2 border-black/20 hover:border-black/50 text-on-surface-variant'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 md:gap-6 mb-6 text-xs md:text-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
            {phrases.length} {t('saved_phrases.phrases')}
          </span>
        </div>

        {/* Phrases List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : phrases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-stone-300 mb-4">bookmark_border</span>
            <p className="font-headline font-bold text-lg md:text-xl text-stone-400">{t('saved_phrases.empty')}</p>
            <p className="text-sm text-stone-400 mt-2">Tap + to add your first phrase!</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {phrases.map((phrase, i) => (
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
                    {phrase.meaning && (
                      <p className="text-on-surface-variant text-xs md:text-sm mb-2">{phrase.meaning}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] md:text-xs text-stone-400">
                      <span>{new Date(phrase.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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

      {/* Add FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl border-[3px] border-white hover:scale-110 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Add Phrase Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest sketch-card p-6 md:p-8 max-w-md w-full">
            <h3 className="font-headline font-bold text-lg md:text-xl mb-4">Add New Phrase</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newPhrase}
                onChange={e => setNewPhrase(e.target.value)}
                placeholder="Enter phrase..."
                className="w-full px-4 py-2.5 border-2 border-black rounded-xl font-body text-sm bg-white focus:outline-none"
              />
              <input
                type="text"
                value={newMeaning}
                onChange={e => setNewMeaning(e.target.value)}
                placeholder="Meaning (optional)"
                className="w-full px-4 py-2.5 border-2 border-black/30 rounded-xl font-body text-sm bg-white focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/30 rounded-xl font-body text-sm bg-white focus:outline-none"
              >
                <option value="general">General</option>
                <option value="idiom">Idiom</option>
                <option value="connector">Connector</option>
                <option value="expression">Expression</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 sketch-border bg-surface-container font-headline font-bold text-sm active:scale-95">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={adding || !newPhrase.trim()} className="flex-1 py-2.5 sketch-border bg-black text-white font-headline font-bold text-sm active:scale-95 disabled:opacity-50">
                {adding ? 'Adding...' : 'Add Phrase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

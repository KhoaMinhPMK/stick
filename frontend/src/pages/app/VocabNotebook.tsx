import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getVocabNotebook, createVocabItem, updateVocabItem, deleteVocabItem, type VocabItem } from '../../services/api/endpoints';

export const VocabNotebookPage: React.FC = () => {
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

  useEffect(() => {
    loadWords();
  }, [masteryFilter]);

  async function loadWords() {
    try {
      setLoading(true);
      const m = masteryFilter === 'all' ? undefined : masteryFilter;
      const res = await getVocabNotebook(m);
      setWords(res.items);
    } catch (err) {
      console.error('Failed to load vocab:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    setAdding(true);
    try {
      const res = await createVocabItem({
        word: newWord.trim(),
        meaning: newMeaning.trim() || undefined,
        example: newExample.trim() || undefined,
      });
      setWords(prev => [res.item, ...prev]);
      setNewWord('');
      setNewMeaning('');
      setNewExample('');
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to add word:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleMasteryChange = async (id: string, newMastery: string) => {
    try {
      await updateVocabItem(id, { mastery: newMastery });
      setWords(prev => prev.map(w => w.id === id ? { ...w, mastery: newMastery } : w));
    } catch (err) {
      console.error('Failed to update mastery:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVocabItem(id);
      setWords(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      console.error('Failed to delete word:', err);
    }
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
    <AppLayout activePath="#library">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button onClick={() => (window.location.hash = '#app')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 md:mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('vocab_notebook.back')}</span>
          </button>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('vocab_notebook.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('vocab_notebook.subtitle')}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-primary">{words.length}</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.total')}</p>
          </div>
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-tertiary">
              {words.length > 0 ? Math.round(words.filter(w => w.mastery === 'mastered').length / words.length * 100) : 0}%
            </p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.avg_mastery')}</p>
          </div>
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-secondary">{mastered}</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.mastered')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6 md:mb-8">
          {['all', 'new', 'learning', 'mastered'].map(tag => (
            <button
              key={tag}
              onClick={() => setMasteryFilter(tag)}
              className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm transition-all active:scale-95 ${
                masteryFilter === tag ? 'bg-black text-white border-2 border-black' : 'bg-surface-container border-2 border-black/20 hover:border-black/50'
              }`}
            >
              {tag === 'all' ? 'All' : tag.charAt(0).toUpperCase() + tag.slice(1)}
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
            <p className="font-headline font-bold text-lg text-stone-400">No words yet</p>
            <p className="text-sm text-stone-400 mt-2">Tap + to add your first word!</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {words.map((word, i) => (
              <div
                key={word.id}
                className={`sketch-card bg-surface-container-lowest overflow-hidden transition-all ${
                  i % 2 === 0 ? 'hover:rotate-[0.2deg]' : 'hover:-rotate-[0.2deg]'
                }`}
              >
                <div
                  onClick={() => setExpandedId(expandedId === word.id ? null : word.id)}
                  className="p-4 md:p-6 cursor-pointer flex items-center gap-3 md:gap-5"
                >
                  {/* Mastery Indicator */}
                  <div className="shrink-0 w-10 h-10 md:w-14 md:h-14 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e8e4dc" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={word.mastery === 'mastered' ? '#a8d5a2' : word.mastery === 'learning' ? '#e3d2b5' : '#e57373'} strokeWidth="3" strokeDasharray={`${masteryNum(word.mastery) * 0.9425} 94.25`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-headline font-black">{masteryNum(word.mastery)}%</span>
                  </div>

                  {/* Word */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-bold text-base md:text-xl">{word.word}</h4>
                    <p className="text-on-surface-variant text-xs md:text-sm line-clamp-1">{word.meaning || 'No definition'}</p>
                  </div>

                  {/* Tag */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border border-black/10 ${getMasteryColor(word.mastery)}`}>
                    {word.mastery}
                  </span>
                  <span className={`material-symbols-outlined text-sm md:text-base transition-transform ${expandedId === word.id ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>

                {/* Expanded */}
                {expandedId === word.id && (
                  <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-black/10">
                    <div className="pt-3 md:pt-4 space-y-3">
                      {word.meaning && (
                        <div>
                          <p className="font-headline font-bold text-xs md:text-sm text-primary mb-1">{t('vocab_notebook.definition')}</p>
                          <p className="text-sm md:text-base">{word.meaning}</p>
                        </div>
                      )}
                      {word.example && (
                        <div>
                          <p className="font-headline font-bold text-xs md:text-sm text-primary mb-1">{t('vocab_notebook.example')}</p>
                          <p className="text-sm md:text-base italic text-on-surface-variant">&ldquo;{word.example}&rdquo;</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        {['new', 'learning', 'mastered'].map(m => (
                          <button
                            key={m}
                            onClick={() => handleMasteryChange(word.id, m)}
                            className={`px-3 py-1.5 rounded-full font-headline font-bold text-xs transition-all active:scale-95 ${
                              word.mastery === m ? 'bg-black text-white' : 'border-2 border-black/20 hover:border-black'
                            }`}
                          >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </button>
                        ))}
                        <button
                          onClick={() => handleDelete(word.id)}
                          className="px-3 py-1.5 rounded-full font-headline font-bold text-xs border-2 border-error/30 text-error hover:bg-error/10 transition-all active:scale-95 ml-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 md:bottom-8 right-6 md:right-8 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-xl border-[3px] border-white hover:scale-110 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Add Word Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest sketch-card p-6 md:p-8 max-w-md w-full">
            <h3 className="font-headline font-bold text-lg md:text-xl mb-4">Add New Word</h3>
            <div className="space-y-3">
              <input type="text" value={newWord} onChange={e => setNewWord(e.target.value)} placeholder="Word..." className="w-full px-4 py-2.5 border-2 border-black rounded-xl font-body text-sm bg-white focus:outline-none" />
              <input type="text" value={newMeaning} onChange={e => setNewMeaning(e.target.value)} placeholder="Meaning (optional)" className="w-full px-4 py-2.5 border-2 border-black/30 rounded-xl font-body text-sm bg-white focus:outline-none" />
              <input type="text" value={newExample} onChange={e => setNewExample(e.target.value)} placeholder="Example sentence (optional)" className="w-full px-4 py-2.5 border-2 border-black/30 rounded-xl font-body text-sm bg-white focus:outline-none" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 sketch-border bg-surface-container font-headline font-bold text-sm active:scale-95">Cancel</button>
              <button onClick={handleAdd} disabled={adding || !newWord.trim()} className="flex-1 py-2.5 sketch-border bg-black text-white font-headline font-bold text-sm active:scale-95 disabled:opacity-50">
                {adding ? 'Adding...' : 'Add Word'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

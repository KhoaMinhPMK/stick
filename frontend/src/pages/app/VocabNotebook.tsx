import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const mockWords = [
  { id: '1', word: 'Eloquent', phonetic: '/ˈeləkwənt/', meaning: 'vocab_notebook.def_eloquent', example: 'vocab_notebook.ex_eloquent', mastery: 90, tag: 'adjective' },
  { id: '2', word: 'Procrastinate', phonetic: '/prəˈkræstɪneɪt/', meaning: 'vocab_notebook.def_procrastinate', example: 'vocab_notebook.ex_procrastinate', mastery: 65, tag: 'verb' },
  { id: '3', word: 'Serendipity', phonetic: '/ˌserənˈdɪpɪti/', meaning: 'vocab_notebook.def_serendipity', example: 'vocab_notebook.ex_serendipity', mastery: 40, tag: 'noun' },
  { id: '4', word: 'Ubiquitous', phonetic: '/juːˈbɪkwɪtəs/', meaning: 'vocab_notebook.def_ubiquitous', example: 'vocab_notebook.ex_ubiquitous', mastery: 75, tag: 'adjective' },
  { id: '5', word: 'Resilient', phonetic: '/rɪˈzɪliənt/', meaning: 'vocab_notebook.def_resilient', example: 'vocab_notebook.ex_resilient', mastery: 85, tag: 'adjective' },
  { id: '6', word: 'Contemplate', phonetic: '/ˈkɒntəmpleɪt/', meaning: 'vocab_notebook.def_contemplate', example: 'vocab_notebook.ex_contemplate', mastery: 55, tag: 'verb' },
];

export const VocabNotebookPage: React.FC = () => {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string>('all');

  const filtered = tagFilter === 'all' ? mockWords : mockWords.filter(w => w.tag === tagFilter);
  const avgMastery = Math.round(mockWords.reduce((s, w) => s + w.mastery, 0) / mockWords.length);

  const getMasteryColor = (m: number) => {
    if (m >= 80) return 'bg-tertiary-container';
    if (m >= 50) return 'bg-secondary-container';
    return 'bg-error-container';
  };

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
            <p className="font-headline font-black text-2xl md:text-3xl text-primary">{mockWords.length}</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.total')}</p>
          </div>
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-tertiary">{avgMastery}%</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.avg_mastery')}</p>
          </div>
          <div className="sketch-card p-4 md:p-5 text-center">
            <p className="font-headline font-black text-2xl md:text-3xl text-secondary">{mockWords.filter(w => w.mastery >= 80).length}</p>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase">{t('vocab_notebook.mastered')}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6 md:mb-8">
          {['all', 'noun', 'verb', 'adjective'].map(tag => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm transition-all active:scale-95 ${
                tagFilter === tag ? 'bg-black text-white border-2 border-black' : 'bg-surface-container border-2 border-black/20 hover:border-black/50'
              }`}
            >
              {t(`vocab_notebook.tag_${tag}`)}
            </button>
          ))}
        </div>

        {/* Word List */}
        <div className="space-y-3 md:space-y-4">
          {filtered.map((word, i) => (
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
                    <circle cx="18" cy="18" r="15" fill="none" stroke={word.mastery >= 80 ? '#a8d5a2' : word.mastery >= 50 ? '#e3d2b5' : '#e57373'} strokeWidth="3" strokeDasharray={`${word.mastery * 0.9425} 94.25`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-headline font-black">{word.mastery}%</span>
                </div>

                {/* Word */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 md:gap-3">
                    <h4 className="font-headline font-bold text-base md:text-xl">{word.word}</h4>
                    <span className="text-on-surface-variant text-xs md:text-sm font-body">{word.phonetic}</span>
                  </div>
                  <p className="text-on-surface-variant text-xs md:text-sm line-clamp-1">{t(word.meaning)}</p>
                </div>

                {/* Tag + Expand */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold border border-black/10 ${getMasteryColor(word.mastery)}`}>
                  {word.tag}
                </span>
                <span className={`material-symbols-outlined text-sm md:text-base transition-transform ${expandedId === word.id ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>

              {/* Expanded */}
              {expandedId === word.id && (
                <div className="px-4 md:px-6 pb-4 md:pb-6 pt-0 border-t border-black/10">
                  <div className="pt-3 md:pt-4 space-y-3">
                    <div>
                      <p className="font-headline font-bold text-xs md:text-sm text-primary mb-1">{t('vocab_notebook.definition')}</p>
                      <p className="text-sm md:text-base">{t(word.meaning)}</p>
                    </div>
                    <div>
                      <p className="font-headline font-bold text-xs md:text-sm text-primary mb-1">{t('vocab_notebook.example')}</p>
                      <p className="text-sm md:text-base italic text-on-surface-variant">&ldquo;{t(word.example)}&rdquo;</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => (window.location.hash = '#vocab-review')} className="px-4 py-2 bg-primary text-white rounded-full font-headline font-bold text-xs active:scale-95 transition-all flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">fitness_center</span>
                        {t('vocab_notebook.practice')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 md:mt-12 text-center">
          <button onClick={() => (window.location.hash = '#vocab-review')} className="px-8 py-3 md:py-4 bg-primary text-white rounded-full sketch-border font-headline font-bold text-sm md:text-base hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto">
            <span className="material-symbols-outlined">fitness_center</span>
            {t('vocab_notebook.review_all')}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

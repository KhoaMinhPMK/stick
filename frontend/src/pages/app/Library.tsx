import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getLessons, type LessonSummary } from '../../services/api/endpoints';

const categories = ['all', 'grammar', 'vocabulary', 'reading', 'listening', 'speaking'] as const;

const levelColors: Record<string, string> = {
  beginner: 'bg-secondary-container',
  intermediate: 'bg-tertiary-container text-white',
  advanced: 'bg-primary text-white',
};

const levelLabels: Record<string, string> = {
  beginner: 'A2',
  intermediate: 'B1',
  advanced: 'C1',
};

const categoryIcons: Record<string, string> = {
  grammar: 'menu_book',
  vocabulary: 'translate',
  reading: 'article',
  listening: 'headphones',
  speaking: 'record_voice_over',
};

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>('all');
  const [search, setSearch] = useState('');
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const cat = activeCategory === 'all' ? undefined : activeCategory;
        const res = await getLessons(cat);
        setLessons(res.items);
      } catch (err) {
        console.error('Failed to load lessons:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeCategory]);

  const filtered = lessons.filter(l => {
    if (!search) return true;
    return l.title.toLowerCase().includes(search.toLowerCase()) ||
           l.description.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AppLayout activePath="#library">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
            {t('library.title')}
          </h2>
          <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{t('library.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-stone-400 text-lg md:text-xl">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('library.search_placeholder')}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border-2 md:border-3 border-black rounded-full font-body text-sm md:text-base bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 md:gap-3 mb-6 md:mb-8 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm whitespace-nowrap transition-all active:scale-95 ${
                activeCategory === cat
                  ? 'bg-black text-white border-2 border-black'
                  : 'bg-surface-container border-2 border-black/20 hover:border-black/50 text-on-surface-variant'
              }`}
            >
              {t(`library.cat_${cat}`)}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 md:gap-6 mb-6 md:mb-8 text-xs md:text-sm">
          <div className="flex items-center gap-1.5 md:gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm md:text-base">library_books</span>
            <span className="font-bold">{lessons.length} {t('library.total_lessons')}</span>
          </div>
        </div>

        {/* Lesson Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-stone-300 mb-4">search_off</span>
            <p className="font-headline font-bold text-lg md:text-xl text-stone-400">{t('library.no_results')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((lesson, i) => (
              <div
                key={lesson.id}
                onClick={() => (window.location.hash = `#lesson-detail?id=${lesson.id}`)}
                className={`group sketch-card bg-surface-container-lowest p-4 md:p-6 flex flex-col hover:shadow-[4px_4px_0_0_#000] transition-all cursor-pointer active:scale-[0.98] ${
                  i % 3 === 1 ? 'hover:rotate-1' : 'hover:-rotate-1'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-container rounded-xl border-2 border-black flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg md:text-xl">{categoryIcons[lesson.category] || 'menu_book'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] md:text-xs font-black rounded-md border border-black/20 ${levelColors[lesson.level] || 'bg-surface-container'}`}>
                      {levelLabels[lesson.level] || lesson.level}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h4 className="font-headline font-bold text-sm md:text-base mb-1 md:mb-2 leading-snug line-clamp-2">
                  {lesson.title}
                </h4>
                <p className="text-on-surface-variant text-[10px] md:text-xs leading-relaxed mb-3 md:mb-4 flex-1 line-clamp-2">
                  {lesson.description}
                </p>

                {/* Duration */}
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="font-bold">{lesson.duration} min</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 md:mt-16 flex flex-col items-center text-center opacity-50">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-black/20 mb-2 md:mb-3">local_library</span>
          <p className="font-headline italic font-bold text-xs md:text-sm">"{t('library.footer_quote')}"</p>
        </div>
      </div>
    </AppLayout>
  );
};

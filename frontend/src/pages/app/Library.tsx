import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';

const categories = ['all', 'grammar', 'vocabulary', 'phrases', 'reading'] as const;

const lessons = [
  { id: 1, icon: 'menu_book', titleKey: 'library.lesson_tenses', descKey: 'library.lesson_tenses_desc', level: 'A2', category: 'grammar', progress: 100, saved: true },
  { id: 2, icon: 'translate', titleKey: 'library.lesson_idioms', descKey: 'library.lesson_idioms_desc', level: 'B1', category: 'phrases', progress: 65, saved: false },
  { id: 3, icon: 'auto_stories', titleKey: 'library.lesson_daily', descKey: 'library.lesson_daily_desc', level: 'A2', category: 'vocabulary', progress: 40, saved: true },
  { id: 4, icon: 'article', titleKey: 'library.lesson_news', descKey: 'library.lesson_news_desc', level: 'B2', category: 'reading', progress: 20, saved: false },
  { id: 5, icon: 'record_voice_over', titleKey: 'library.lesson_pronun', descKey: 'library.lesson_pronun_desc', level: 'B1', category: 'grammar', progress: 80, saved: false },
  { id: 6, icon: 'chat_bubble', titleKey: 'library.lesson_convo', descKey: 'library.lesson_convo_desc', level: 'A2', category: 'phrases', progress: 0, saved: false },
  { id: 7, icon: 'psychology', titleKey: 'library.lesson_advanced', descKey: 'library.lesson_advanced_desc', level: 'C1', category: 'grammar', progress: 10, saved: true },
  { id: 8, icon: 'local_cafe', titleKey: 'library.lesson_travel', descKey: 'library.lesson_travel_desc', level: 'A2', category: 'vocabulary', progress: 55, saved: false },
];

const levelColors: Record<string, string> = {
  A2: 'bg-secondary-container',
  B1: 'bg-tertiary-container text-white',
  B2: 'bg-primary text-white',
  C1: 'bg-error text-white',
};

export const LibraryPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]>('all');
  const [search, setSearch] = useState('');

  const filtered = lessons.filter(l => {
    const matchCat = activeCategory === 'all' || l.category === activeCategory;
    const matchSearch = search === '' || t(l.titleKey).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
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

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          {/* Search */}
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
          <div className="flex items-center gap-1.5 md:gap-2 text-tertiary">
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="font-bold">{lessons.filter(l => l.progress === 100).length} {t('library.completed')}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-secondary">
            <span className="material-symbols-outlined text-sm md:text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
            <span className="font-bold">{lessons.filter(l => l.saved).length} {t('library.saved')}</span>
          </div>
        </div>

        {/* Lesson Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
            <span className="material-symbols-outlined text-5xl md:text-6xl text-stone-300 mb-4">search_off</span>
            <p className="font-headline font-bold text-lg md:text-xl text-stone-400">{t('library.no_results')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((lesson, i) => (
              <div
                key={lesson.id}
                onClick={() => (window.location.hash = '#lesson-detail')}
                className={`group sketch-card bg-surface-container-lowest p-4 md:p-6 flex flex-col hover:shadow-[4px_4px_0_0_#000] transition-all cursor-pointer active:scale-[0.98] ${
                  i % 3 === 1 ? 'hover:rotate-1' : 'hover:-rotate-1'
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-container rounded-xl border-2 border-black flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg md:text-xl">{lesson.icon}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] md:text-xs font-black rounded-md border border-black/20 ${levelColors[lesson.level] || 'bg-surface-container'}`}>
                      {lesson.level}
                    </span>
                    {lesson.saved && (
                      <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h4 className="font-headline font-bold text-sm md:text-base mb-1 md:mb-2 leading-snug line-clamp-2">
                  {t(lesson.titleKey)}
                </h4>
                <p className="text-on-surface-variant text-[10px] md:text-xs leading-relaxed mb-3 md:mb-4 flex-1 line-clamp-2">
                  {t(lesson.descKey)}
                </p>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] md:text-xs font-bold text-on-surface-variant">
                      {lesson.progress === 100 ? t('library.done') : lesson.progress === 0 ? t('library.new') : `${lesson.progress}%`}
                    </span>
                    {lesson.progress === 100 && (
                      <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    )}
                  </div>
                  <div className="h-1.5 md:h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${lesson.progress === 100 ? 'bg-tertiary' : 'bg-black'}`}
                      style={{ width: `${Math.max(lesson.progress, 2)}%` }}
                    />
                  </div>
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

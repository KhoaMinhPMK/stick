import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getLessonDetail, type LessonDetail } from '../../services/api/endpoints';

const lessonSections = [
  { type: 'intro', titleKey: 'lesson_detail.section_intro', content: 'lesson_detail.intro_content', icon: 'info' },
  { type: 'example', titleKey: 'lesson_detail.section_examples', content: 'lesson_detail.examples_content', icon: 'format_quote' },
  { type: 'practice', titleKey: 'lesson_detail.section_practice', content: 'lesson_detail.practice_content', icon: 'fitness_center' },
  { type: 'summary', titleKey: 'lesson_detail.section_summary', content: 'lesson_detail.summary_content', icon: 'summarize' },
];

const quizQuestions = [
  { question: 'lesson_detail.quiz_q1', options: ['lesson_detail.quiz_q1_a', 'lesson_detail.quiz_q1_b', 'lesson_detail.quiz_q1_c'], correct: 1 },
  { question: 'lesson_detail.quiz_q2', options: ['lesson_detail.quiz_q2_a', 'lesson_detail.quiz_q2_b', 'lesson_detail.quiz_q2_c'], correct: 0 },
];

export const LessonDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [saved, setSaved] = useState(false);

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
        const res = await getLessonDetail(id);
        setLesson(res.lesson);
      } catch (err) {
        console.error('Failed to load lesson detail', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  let sectionsToRender = lessonSections;
  if (lesson?.content) {
    try {
      const parsed = JSON.parse(lesson.content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sectionsToRender = parsed;
      }
    } catch (e) {
      // Not JSON, ignore and use mock
    }
  }

  const progress = Math.round((completedSections.length / sectionsToRender.length) * 100);

  const toggleSection = (idx: number) => {
    setCompletedSections(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleAnswer = () => {
    setShowResult(true);
  };

  const nextQuiz = () => {
    if (currentQuiz < quizQuestions.length - 1) {
      setCurrentQuiz(c => c + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activePath="#library">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
        </div>
      </AppLayout>
    );
  }

  if (!lesson) {
    return (
      <AppLayout activePath="#library">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">error_outline</span>
          <p className="font-headline font-bold text-xl">{t('lesson_detail.not_found', { defaultValue: 'Lesson not found' })}</p>
          <button onClick={() => window.location.hash = '#library'} className="mt-4 text-primary underline">Go back</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="#library">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button onClick={() => (window.location.hash = '#library')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-3 md:mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-xs md:text-sm">{t('lesson_detail.back')}</span>
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-headline font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight -rotate-1 origin-left">
                {lesson.title}
              </h2>
              <p className="text-on-surface-variant font-medium text-xs md:text-sm mt-1">{lesson.description}</p>
              <div className="flex gap-2 mt-3">
                <span className="bg-surface-container-high px-2 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase border border-black/10">{lesson.category}</span>
                <span className="bg-surface-container-highest px-2 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase border border-black/10">{lesson.level}</span>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase border border-primary/20">{lesson.duration} min</span>
              </div>
            </div>
            <button onClick={() => setSaved(!saved)} className="shrink-0 p-2 md:p-3 border-2 border-black rounded-lg hover:bg-secondary-container transition-colors active:scale-95">
              <span className="material-symbols-outlined text-lg md:text-xl" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
                bookmark
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-4 md:space-y-6">
            {/* Progress Bar */}
            <div className="sketch-card p-4 md:p-6 bg-surface-container">
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <span className="font-headline font-bold text-sm md:text-base">{t('lesson_detail.progress')}</span>
                <span className="font-headline font-black text-sm md:text-base">{progress}%</span>
              </div>
              <div className="h-2.5 md:h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
                <div className="h-full bg-tertiary-container rounded-full transition-all duration-500" style={{ width: `${Math.max(progress, 2)}%` }} />
              </div>
            </div>

            {/* Lesson Sections */}
            {sectionsToRender.map((section: any, idx: number) => (
              <div key={idx} className={`sketch-card p-5 md:p-8 transition-all ${completedSections.includes(idx) ? 'bg-tertiary-container/10 border-tertiary' : 'bg-surface-container-lowest'}`}>
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${completedSections.includes(idx) ? 'bg-tertiary-container' : 'bg-surface-container'}`}>
                    <span className={`material-symbols-outlined text-sm md:text-base ${completedSections.includes(idx) ? 'text-white' : ''}`}>
                      {completedSections.includes(idx) ? 'check' : section.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-base md:text-xl mb-2 md:mb-3">{section.titleKey ? t(section.titleKey) : section.title}</h3>
                    <p className="text-on-surface-variant text-xs md:text-sm leading-relaxed mb-3 md:mb-4 whitespace-pre-wrap">
                      {section.contentKey ? t(section.contentKey) : section.content}
                    </p>
                    <button
                      onClick={() => toggleSection(idx)}
                      className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full font-headline font-bold text-xs md:text-sm transition-all active:scale-95 border-2 border-black ${
                        completedSections.includes(idx) ? 'bg-tertiary-container text-white' : 'bg-surface-container hover:bg-secondary-container'
                      }`}
                    >
                      {completedSections.includes(idx) ? t('lesson_detail.completed') : t('lesson_detail.mark_done')}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Mini Quiz */}
            <div className="sketch-card p-5 md:p-8 bg-secondary-container/20">
              <h3 className="font-headline font-bold text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg md:text-2xl">quiz</span>
                {t('lesson_detail.quick_quiz')}
              </h3>
              <div className="space-y-3 md:space-y-4">
                <p className="font-body font-medium text-sm md:text-base">{t(quizQuestions[currentQuiz].question)}</p>
                {quizQuestions[currentQuiz].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedAnswer(i); setShowResult(false); }}
                    className={`w-full text-left p-3 md:p-4 rounded-lg border-2 transition-all text-sm md:text-base ${
                      selectedAnswer === i
                        ? showResult
                          ? i === quizQuestions[currentQuiz].correct ? 'border-tertiary bg-tertiary-container/20' : 'border-error bg-error/10'
                          : 'border-black bg-surface-container-highest'
                        : 'border-black/20 hover:border-black/50 bg-surface-container-lowest'
                    }`}
                  >
                    {t(opt)}
                  </button>
                ))}
                <div className="flex gap-3 pt-2">
                  {!showResult ? (
                    <button onClick={handleAnswer} disabled={selectedAnswer === null} className="px-6 py-2 bg-black text-white rounded-full font-headline font-bold text-sm disabled:opacity-40 active:scale-95 transition-all">
                      {t('lesson_detail.check')}
                    </button>
                  ) : (
                    <>
                      <p className={`font-headline font-bold text-sm ${selectedAnswer === quizQuestions[currentQuiz].correct ? 'text-tertiary' : 'text-error'}`}>
                        {selectedAnswer === quizQuestions[currentQuiz].correct ? t('lesson_detail.correct') : t('lesson_detail.incorrect')}
                      </p>
                      {currentQuiz < quizQuestions.length - 1 && (
                        <button onClick={nextQuiz} className="px-6 py-2 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95 transition-all ml-auto">
                          {t('lesson_detail.next_question')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6">
            {/* Lesson Info */}
            <div className="sketch-card p-5 md:p-6 bg-surface-container">
              <h4 className="font-headline font-bold text-base md:text-lg mb-3 md:mb-4">{t('lesson_detail.info_title')}</h4>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('lesson_detail.level')}</span>
                  <span className="font-bold px-2 py-0.5 bg-secondary-container rounded text-[10px] md:text-xs border border-black/20">A2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('lesson_detail.duration')}</span>
                  <span className="font-bold">~15 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('lesson_detail.category')}</span>
                  <span className="font-bold">{t('library.cat_grammar')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('lesson_detail.sections')}</span>
                  <span className="font-bold">{completedSections.length}/{lessonSections.length}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => (window.location.hash = '#journal-workspace')}
                className="w-full py-3 md:py-4 sketch-border bg-primary text-white font-headline font-bold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors active:scale-95"
              >
                {t('lesson_detail.practice_writing')}
                <span className="material-symbols-outlined text-sm md:text-base">edit_note</span>
              </button>
              <button
                onClick={() => (window.location.hash = '#speaking-intro')}
                className="w-full py-3 md:py-4 sketch-border bg-surface-container font-headline font-bold text-sm md:text-base flex items-center justify-center gap-2 hover:bg-secondary-container transition-colors active:scale-95"
              >
                {t('lesson_detail.practice_speaking')}
                <span className="material-symbols-outlined text-sm md:text-base">mic</span>
              </button>
            </div>

            {/* Related Lessons */}
            <div className="sketch-card p-5 md:p-6 bg-surface-container-lowest">
              <h4 className="font-headline font-bold text-base md:text-lg mb-3 md:mb-4">{t('lesson_detail.related')}</h4>
              <div className="space-y-2 md:space-y-3">
                {['lesson_detail.related_1', 'lesson_detail.related_2'].map((key, i) => (
                  <div key={i} onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-3 p-2 md:p-3 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">
                    <span className="material-symbols-outlined text-sm md:text-base text-on-surface-variant">menu_book</span>
                    <span className="text-xs md:text-sm font-medium">{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

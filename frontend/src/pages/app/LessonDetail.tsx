import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import { getLessonDetail, completeLessonProgress, type LessonDetail } from '../../services/api/endpoints';

interface VocabItem {
  word: string;
  meaning: string;
  example?: string;
}

interface LessonSection {
  type: string;
  icon: string;
  title: string;
  content: string;
  items?: (string | VocabItem)[];
  exercises?: FillBlankExercise[];
  examples?: string[];
  speakers?: string[];
  lines?: string[];
}

interface FillBlankExercise {
  prompt: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

export const LessonDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Step-by-step section state
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSections, setDoneSections] = useState<Set<number>>(new Set());

  // Fill-in-blank state: key = `${sectionIdx}-${exIdx}`
  const [exAnswers, setExAnswers] = useState<Record<string, number>>({});
  const [exFeedback, setExFeedback] = useState<Record<string, boolean>>({});

  // Quiz state
  const [inQuiz, setInQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const [saved, setSaved] = useState(false);
  const completionSentRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  const id = useMemo(() => {
    return new URLSearchParams(window.location.hash.split('?')[1] || '').get('id');
  }, []);

  useEffect(() => {
    async function load() {
      if (!id) { setLoading(false); return; }
      try {
        const res = await getLessonDetail(id);
        setLesson(res.lesson);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Build sections: from lesson.content JSON or fallback with real translated strings
  const sections: LessonSection[] = useMemo(() => {
    if (lesson?.content) {
      try {
        const parsed = JSON.parse(lesson.content);
        let rawSections: Record<string, unknown>[] = [];
        if (Array.isArray(parsed) && parsed.length > 0) rawSections = parsed;
        else if (parsed.sections && Array.isArray(parsed.sections)) rawSections = parsed.sections;

        if (rawSections.length > 0) {
          const typeMap: Record<string, { icon: string; title: string }> = {
            text: { icon: 'info', title: t('lesson_detail.section_intro', 'Introduction') },
            vocabulary: { icon: 'translate', title: t('lesson_detail.section_vocabulary', 'Vocabulary') },
            grammar_rule: { icon: 'school', title: t('lesson_detail.section_grammar', 'Grammar') },
            practice: { icon: 'fitness_center', title: t('lesson_detail.section_practice', 'Practice') },
            dialogue: { icon: 'forum', title: t('lesson_detail.section_dialogue', 'Dialogue') },
          };
          return rawSections.map((s) => {
            const sType = (s.type as string) || 'text';
            const mapped = typeMap[sType] || { icon: 'article', title: sType };
            return {
              type: sType,
              icon: (s.icon as string) || mapped.icon,
              title: (s.title as string) || mapped.title,
              content: (s.content as string) || (s.prompt as string) || (s.rule as string) || '',
              items: s.items as LessonSection['items'],
              exercises: s.exercises as FillBlankExercise[],
              examples: s.examples as string[],
              speakers: s.speakers as string[],
              lines: s.lines as string[],
            };
          });
        }
      } catch { /* not JSON */ }
    }
    return [
      {
        type: 'intro', icon: 'info',
        title: t('lesson_detail.section_intro'),
        content: t('lesson_detail.intro_content'),
      },
      {
        type: 'example', icon: 'format_quote',
        title: t('lesson_detail.section_examples'),
        content: t('lesson_detail.examples_content'),
        items: [
          "I walk to school every day.  →  thói quen (Simple Present)",
          "I walked to school yesterday.  →  đã xảy ra (Simple Past)",
          "I will walk to school tomorrow.  →  kế hoạch (Simple Future)",
        ],
      },
      {
        type: 'practice', icon: 'fitness_center',
        title: t('lesson_detail.section_practice'),
        content: t('lesson_detail.practice_content'),
        exercises: [
          { prompt: 'She ___ to school every day.', options: ['walked', 'walks', 'will walk'], correct: 1, explanation: '"every day" → thói quen → Simple Present: walks' },
          { prompt: 'They ___ the movie last night.', options: ['watch', 'watches', 'watched'], correct: 2, explanation: '"last night" → đã kết thúc → Simple Past: watched' },
          { prompt: 'I ___ my homework tomorrow.', options: ['do', 'did', 'will do'], correct: 2, explanation: '"tomorrow" → kế hoạch → Simple Future: will do' },
        ],
      },
      {
        type: 'summary', icon: 'summarize',
        title: t('lesson_detail.section_summary'),
        content: t('lesson_detail.summary_content'),
        items: [
          'Simple Present  →  thói quen  (every day, usually, always)',
          'Simple Past  →  đã kết thúc  (yesterday, last night, ago)',
          'Simple Future  →  kế hoạch  (tomorrow, next week, will)',
        ],
      },
    ];
  }, [lesson, t]);

  // Quiz questions (resolved strings, not raw keys)
  const quizItems: QuizQuestion[] = useMemo(() => [
    {
      question: t('lesson_detail.quiz_q1'),
      options: [t('lesson_detail.quiz_q1_a'), t('lesson_detail.quiz_q1_b'), t('lesson_detail.quiz_q1_c')],
      correct: 1,
      explanation: '"every day" = thói quen → Simple Present: walks',
    },
    {
      question: t('lesson_detail.quiz_q2'),
      options: [t('lesson_detail.quiz_q2_a'), t('lesson_detail.quiz_q2_b'), t('lesson_detail.quiz_q2_c')],
      correct: 0,
      explanation: '"last night" = đã kết thúc → Simple Past: watched',
    },
  ], [t]);

  const allSectionsDone = doneSections.size >= sections.length;
  const progress = quizDone
    ? 100
    : Math.round(((doneSections.size / sections.length) * (inQuiz ? 0.9 : 0.8)) * 100);

  // Send completion when quiz done
  useEffect(() => {
    if (quizDone && id && !completionSentRef.current) {
      completionSentRef.current = true;
      const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      completeLessonProgress(id, durationSec).catch(() => { completionSentRef.current = false; });
    }
  }, [quizDone, id]);

  const markSection = (idx: number) => {
    setDoneSections(prev => { const s = new Set(prev); s.add(idx); return s; });
    if (idx < sections.length - 1) setCurrentStep(idx + 1);
  };

  const handleExercise = (sectionIdx: number, exIdx: number, optIdx: number, ex: FillBlankExercise) => {
    const key = `${sectionIdx}-${exIdx}`;
    if (exFeedback[key] !== undefined) return;
    setExAnswers(p => ({ ...p, [key]: optIdx }));
    setExFeedback(p => ({ ...p, [key]: optIdx === ex.correct }));
  };

  const handleQuizSelect = (i: number) => {
    if (quizFeedback) return;
    setQuizSelected(i);
    setQuizFeedback(true);
    if (i === quizItems[quizStep].correct) setQuizCorrect(c => c + 1);
  };

  const nextQuizStep = () => {
    if (quizStep < quizItems.length - 1) {
      setQuizStep(s => s + 1);
      setQuizSelected(null);
      setQuizFeedback(false);
    } else {
      setQuizDone(true);
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
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="material-symbols-outlined text-gray-400 text-6xl">error_outline</span>
          <p className="font-headline font-bold text-xl">{t('lesson_detail.not_found', { defaultValue: 'Lesson not found' })}</p>
          <button onClick={() => { window.location.hash = '#library'; }} className="text-primary underline font-headline font-bold">← Quay lại</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="#library">
      <div className="max-w-2xl mx-auto pb-14">

        {/* ── Header ── */}
        <div className="mb-5">
          <button onClick={() => { window.location.hash = '#library'; }} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-sm">{t('lesson_detail.back')}</span>
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight -rotate-1 origin-left">{lesson.title}</h2>
              <p className="text-on-surface-variant text-sm mt-1">{lesson.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-black/10">{lesson.category}</span>
                <span className="bg-surface-container-highest px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-black/10">{lesson.level}</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-primary/20">{lesson.duration} min</span>
              </div>
            </div>
            <button onClick={() => setSaved(s => !s)} className="shrink-0 p-2.5 border-2 border-black rounded-xl hover:bg-secondary-container transition-colors active:scale-95">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            </button>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-headline font-bold mb-1.5">
            <span>{t('lesson_detail.progress')}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.max(progress, 2)}%` }} />
          </div>
          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-3">
            {sections.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-all duration-300 ${
                doneSections.has(i) ? 'bg-primary scale-110' : i === currentStep && !inQuiz ? 'bg-secondary-container' : 'bg-surface-container-highest'
              }`} />
            ))}
            {/* quiz dot */}
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-all duration-300 ${
              quizDone ? 'bg-primary scale-110' : inQuiz ? 'bg-secondary-container' : 'bg-surface-container-highest'
            }`} />
          </div>
        </div>

        {/* ══════════════════════════════════
             COMPLETION CARD
        ══════════════════════════════════ */}
        {quizDone && (
          <div className="sketch-card p-8 bg-tertiary-container/20 text-center">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 className="font-headline font-black text-2xl mb-2">Hoàn thành bài học!</h3>
            <p className="text-on-surface-variant mb-1">
              Điểm quiz: <strong className="text-primary">{quizCorrect}/{quizItems.length}</strong>
            </p>
            <p className="text-on-surface-variant text-sm mb-6">
              +{lesson.duration * 2} XP đã được cộng vào tài khoản
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => { window.location.hash = '#journal-workspace'; }}
                className="px-6 py-3 sketch-border bg-primary text-white font-headline font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
                {t('lesson_detail.practice_writing')}
                <span className="material-symbols-outlined text-sm">edit_note</span>
              </button>
              <button onClick={() => { window.location.hash = '#library'; }}
                className="px-6 py-3 sketch-border bg-surface-container font-headline font-bold text-sm active:scale-95 transition-all">
                {t('lesson_detail.related')} →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
             QUIZ
        ══════════════════════════════════ */}
        {inQuiz && !quizDone && (
          <div className="sketch-card p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-xl">quiz</span>
              <h3 className="font-headline font-bold text-lg">{t('lesson_detail.quick_quiz')}</h3>
              <span className="ml-auto text-xs font-headline font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full border border-black/20">
                {quizStep + 1} / {quizItems.length}
              </span>
            </div>

            <p className="font-body font-semibold text-base md:text-lg mb-5 leading-snug">{quizItems[quizStep].question}</p>

            <div className="space-y-3">
              {quizItems[quizStep].options.map((opt, i) => {
                let cls = 'border-black/30 bg-surface-container-lowest hover:border-black hover:bg-surface-container-high';
                if (quizFeedback) {
                  if (i === quizItems[quizStep].correct) cls = 'border-green-500 bg-green-50';
                  else if (i === quizSelected) cls = 'border-red-400 bg-red-50';
                  else cls = 'border-black/10 bg-surface-container-lowest opacity-40';
                } else if (quizSelected === i) {
                  cls = 'border-black bg-surface-container-highest';
                }
                return (
                  <button key={i} onClick={() => handleQuizSelect(i)} disabled={quizFeedback}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-body text-sm md:text-base flex items-center gap-3 cursor-pointer disabled:cursor-default ${cls}`}>
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 ${
                      quizFeedback && i === quizItems[quizStep].correct ? 'border-green-500 text-green-600 bg-green-100' :
                      quizFeedback && i === quizSelected ? 'border-red-400 text-red-500 bg-red-100' : 'border-current'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {quizFeedback && i === quizItems[quizStep].correct && (
                      <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                    )}
                    {quizFeedback && i === quizSelected && i !== quizItems[quizStep].correct && (
                      <span className="material-symbols-outlined text-red-400 text-base">cancel</span>
                    )}
                  </button>
                );
              })}
            </div>

            {quizFeedback && (
              <div className={`mt-4 p-4 rounded-xl border-2 ${quizSelected === quizItems[quizStep].correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <p className={`font-headline font-bold text-sm mb-1 ${quizSelected === quizItems[quizStep].correct ? 'text-green-700' : 'text-red-600'}`}>
                  {quizSelected === quizItems[quizStep].correct ? t('lesson_detail.correct') : t('lesson_detail.incorrect')}
                </p>
                {quizItems[quizStep].explanation && (
                  <p className="text-sm text-on-surface-variant">{quizItems[quizStep].explanation}</p>
                )}
                <button onClick={nextQuizStep}
                  className="mt-3 px-6 py-2 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95 transition-all">
                  {quizStep < quizItems.length - 1 ? t('lesson_detail.next_question') : 'Xem kết quả →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
             SECTIONS (step-by-step)
        ══════════════════════════════════ */}
        {!inQuiz && !quizDone && (
          <div className="space-y-3">
            {sections.map((section, idx) => {
              const isDone = doneSections.has(idx);
              const isActive = idx === currentStep;
              const isLocked = !isDone && idx > currentStep;
              const allExDone = !section.exercises || section.exercises.every((_, ei) => exFeedback[`${idx}-${ei}`] !== undefined);

              return (
                <div key={idx} className={`sketch-card transition-all duration-300 overflow-hidden ${
                  isDone ? 'opacity-75' : isActive ? 'ring-2 ring-black' : ''
                } ${isLocked ? 'opacity-50' : ''}`}>

                  {/* Section header */}
                  <div
                    className={`flex items-center gap-3 p-5 ${!isLocked ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => { if (!isLocked && !isActive) setCurrentStep(idx); }}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-primary' : isActive ? 'bg-secondary-container' : 'bg-surface-container'}`}>
                      <span className="material-symbols-outlined text-sm" style={{ color: isDone ? 'white' : undefined }}>
                        {isDone ? 'check' : section.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-bold text-base">{section.title}</h3>
                      {isDone && <span className="text-xs text-primary font-headline font-bold">Completed ✓</span>}
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">
                      {isLocked ? 'lock' : isActive ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>

                  {/* Section body */}
                  {isActive && (
                    <div className="px-5 pb-6 space-y-4 border-t border-black/10">
                      <p className="text-on-surface-variant text-sm md:text-base leading-relaxed whitespace-pre-wrap pt-4">{section.content}</p>

                      {/* Bullet items / Vocabulary cards */}
                      {section.items && section.items.length > 0 && (
                        <ul className="space-y-2 pl-1">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              {typeof item === 'string' ? (
                                <span>{item}</span>
                              ) : (
                                <div>
                                  <span className="font-bold">{item.word}</span>
                                  <span className="text-on-surface-variant"> — {item.meaning}</span>
                                  {item.example && <p className="text-on-surface-variant text-xs mt-0.5 italic">"{item.example}"</p>}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Grammar examples */}
                      {section.examples && section.examples.length > 0 && (
                        <div className="space-y-1.5 pl-1">
                          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">Examples</p>
                          {section.examples.map((ex, i) => (
                            <p key={i} className="text-sm pl-3 border-l-2 border-primary/40 text-on-surface-variant italic">{ex}</p>
                          ))}
                        </div>
                      )}

                      {/* Dialogue */}
                      {section.lines && section.lines.length > 0 && (
                        <div className="space-y-2 pl-1">
                          {section.lines.map((line, i) => (
                            <div key={i} className={`flex gap-2 text-sm ${i % 2 === 0 ? '' : 'pl-6'}`}>
                              {section.speakers && (
                                <span className="font-bold text-primary shrink-0">{section.speakers[i % section.speakers.length]}:</span>
                              )}
                              <span className="text-on-surface-variant italic">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fill-in-blank exercises */}
                      {section.exercises && section.exercises.length > 0 && (
                        <div className="space-y-4 pt-1">
                          <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">Điền vào chỗ trống</p>
                          {section.exercises.map((ex, exIdx) => {
                            const key = `${idx}-${exIdx}`;
                            const answered = exFeedback[key] !== undefined;
                            const correct = exFeedback[key];
                            const selectedOpt = exAnswers[key];
                            return (
                              <div key={exIdx} className={`p-4 rounded-xl border-2 transition-colors ${
                                answered ? (correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50') : 'border-black/20 bg-surface-container-lowest'
                              }`}>
                                <p className="font-body text-sm md:text-base font-semibold mb-3">
                                  {ex.prompt.replace('___', answered ? `【${ex.options[ex.correct]}】` : '___')}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {ex.options.map((opt, optIdx) => {
                                    let btnCls = 'border-black/40 bg-white hover:border-black hover:bg-surface-container-high';
                                    if (answered) {
                                      if (optIdx === ex.correct) btnCls = 'border-green-500 bg-green-100 text-green-700';
                                      else if (optIdx === selectedOpt) btnCls = 'border-red-400 bg-red-100 text-red-600 line-through';
                                      else btnCls = 'border-black/10 opacity-30';
                                    }
                                    return (
                                      <button key={optIdx} onClick={() => handleExercise(idx, exIdx, optIdx, ex)} disabled={answered}
                                        className={`px-4 py-1.5 border-2 rounded-full font-headline font-bold text-sm transition-all active:scale-95 disabled:cursor-default ${btnCls}`}>
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                                {answered && ex.explanation && (
                                  <p className={`mt-2 text-xs md:text-sm font-medium ${correct ? 'text-green-700' : 'text-red-600'}`}>
                                    {correct ? '✓ ' : '✗ '}{ex.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Advance button */}
                      <div className="pt-1">
                        <button
                          onClick={() => markSection(idx)}
                          disabled={!allExDone}
                          className="px-6 py-2.5 bg-primary text-white rounded-full font-headline font-bold text-sm border-2 border-black active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {!allExDone
                            ? 'Trả lời hết để tiếp tục'
                            : idx < sections.length - 1
                            ? 'Đã hiểu, tiếp theo →'
                            : 'Xong! Vào quiz →'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Start Quiz CTA — after all sections done */}
            {allSectionsDone && (
              <button
                onClick={() => setInQuiz(true)}
                className="w-full py-4 sketch-border bg-secondary-container font-headline font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-primary hover:text-white mt-2"
              >
                <span className="material-symbols-outlined">quiz</span>
                {t('lesson_detail.quick_quiz')} →
              </button>
            )}
          </div>
        )}

      </div>
    </AppLayout>
  );
};


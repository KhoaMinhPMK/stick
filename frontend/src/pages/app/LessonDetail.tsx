import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../layouts/AppLayout';
import {
  getLessonDetail,
  completeLessonProgress,
  validateExercise,
  type LessonDetail,
  type LessonContentSection,
  type LessonExerciseItem,
} from '../../services/api/endpoints';

// ─── Types ───────────────────────────────────────────

interface ExerciseState {
  answered: boolean;
  correct: boolean;
  answer: string | string[] | [string, string][];
  pointsEarned: number;
  explanation?: string;
}

// ─── Main Page ───────────────────────────────────────

export const LessonDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Step navigation
  const [currentStep, setCurrentStep] = useState(0);
  const [doneSections, setDoneSections] = useState<Set<number>>(new Set());

  // Exercise state
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [validating, setValidating] = useState<string | null>(null);

  // Scoring
  const [totalScore, setTotalScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Completion
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState<{
    score: number; starRating: number; xpEarned: number; comboMax: number; isReview: boolean;
    bestScore: number; totalAttempts: number;
  } | null>(null);
  const completionSentRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  const [saved, setSaved] = useState(false);

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

  // Parse sections from lesson content
  const sections: LessonContentSection[] = useMemo(() => {
    if (!lesson?.content) return [];
    try {
      let parsed: { sections?: LessonContentSection[] } | LessonContentSection[];
      if (typeof lesson.content === 'string') {
        parsed = JSON.parse(lesson.content);
      } else {
        parsed = lesson.content;
      }
      if (Array.isArray(parsed)) return parsed;
      if (parsed && 'sections' in parsed && Array.isArray(parsed.sections)) return parsed.sections;
    } catch { /* not valid JSON */ }

    if (typeof lesson.content === 'string') {
      return [{ type: 'text' as const, title: 'Content', content: lesson.content }];
    }
    return [];
  }, [lesson]);

  // Count total exercises across all sections
  const allExercises = useMemo(() => {
    const result: { sectionIdx: number; exIdx: number; exercise: LessonExerciseItem; globalIdx: number }[] = [];
    let globalIdx = 0;
    sections.forEach((section, sIdx) => {
      if (section.exercises) {
        section.exercises.forEach((ex, eIdx) => {
          result.push({ sectionIdx: sIdx, exIdx: eIdx, exercise: ex, globalIdx });
          globalIdx++;
        });
      }
    });
    return result;
  }, [sections]);

  const totalPoints = useMemo(() => allExercises.reduce((sum, e) => sum + e.exercise.points, 0), [allExercises]);

  const allExercisesDone = useMemo(() => {
    return allExercises.every(e => {
      const key = `${e.sectionIdx}-${e.exIdx}`;
      return exerciseStates[key]?.answered;
    });
  }, [allExercises, exerciseStates]);

  const allSectionsDone = doneSections.size >= sections.length;

  const progress = completed
    ? 100
    : sections.length === 0
    ? 0
    : Math.round((doneSections.size / sections.length) * 100);

  // ─── Exercise Validation ───────────────────────────

  const handleValidateExercise = useCallback(async (
    sectionIdx: number,
    exIdx: number,
    answer: string | string[] | [string, string][],
    globalExerciseIdx: number
  ) => {
    if (!id) return;
    const key = `${sectionIdx}-${exIdx}`;
    if (exerciseStates[key]?.answered) return;

    setValidating(key);
    try {
      const result = await validateExercise(id, globalExerciseIdx, answer);
      setExerciseStates(prev => ({
        ...prev,
        [key]: {
          answered: true,
          correct: result.correct,
          answer,
          // P0-E: BE now returns pointsEarned (not points)
          pointsEarned: result.pointsEarned ?? 0,
          explanation: result.explanation,
        },
      }));
      setTotalScore(prev => prev + (result.pointsEarned ?? 0));
      if (result.correct) {
        setCombo(prev => {
          const newCombo = prev + 1;
          setMaxCombo(mc => Math.max(mc, newCombo));
          return newCombo;
        });
      } else {
        setCombo(0);
      }
    } catch {
      setExerciseStates(prev => ({
        ...prev,
        [key]: { answered: true, correct: false, answer, pointsEarned: 0 },
      }));
      setCombo(0);
    } finally {
      setValidating(null);
    }
  }, [id, exerciseStates]);

  // ─── Completion ────────────────────────────────────

  const handleComplete = useCallback(async () => {
    if (!id || completionSentRef.current) return;
    completionSentRef.current = true;
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);

    const answers = allExercises.map(e => {
      const key = `${e.sectionIdx}-${e.exIdx}`;
      const state = exerciseStates[key];
      return {
        exerciseIndex: e.globalIdx,
        correct: state?.correct ?? false,
        pointsEarned: state?.pointsEarned ?? 0,
      };
    });

    try {
      const result = await completeLessonProgress(id, {
        score: totalScore,
        totalPoints,
        maxCombo,
        answers,
        duration: durationSec,
      });
      setCompletionResult({
        score: result.attempt.score,
        starRating: result.attempt.starRating,
        xpEarned: result.attempt.xpEarned,
        comboMax: result.attempt.comboMax,
        isReview: result.attempt.isReview,
        bestScore: result.progress.bestScore,
        totalAttempts: result.progress.totalAttempts,
      });
    } catch {
      // P0-H: No local fallback XP — if server fails, show error state instead of fake success
      setCompletionResult({
        score: 0,
        starRating: 0,
        xpEarned: 0,
        comboMax: maxCombo,
        isReview: false,
        bestScore: 0,
        totalAttempts: 0,
      });
    }
    setCompleted(true);
  }, [id, allExercises, exerciseStates, totalScore, totalPoints, maxCombo, lesson]);

  // ─── Section Navigation ────────────────────────────

  const markSection = (idx: number) => {
    setDoneSections(prev => { const s = new Set(prev); s.add(idx); return s; });
    if (idx < sections.length - 1) {
      setCurrentStep(idx + 1);
    }
  };

  // Auto-complete when all sections done and all exercises done
  useEffect(() => {
    if (allSectionsDone && allExercisesDone && !completed && !completionSentRef.current) {
      handleComplete();
    }
  }, [allSectionsDone, allExercisesDone, completed, handleComplete]);

  // ─── Render ────────────────────────────────────────

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
          <button onClick={() => { window.location.hash = '#library'; }} className="text-primary underline font-headline font-bold">
            {t('lesson_detail.back', { defaultValue: 'Back' })}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="#library">
      <div className="max-w-2xl mx-auto pb-14">

        {/* Header */}
        <div className="mb-5">
          <button onClick={() => { window.location.hash = '#library'; }} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors mb-4 group">
            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="font-headline font-bold text-sm">{t('lesson_detail.back', { defaultValue: 'Back' })}</span>
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight -rotate-1 origin-left">{lesson.title}</h2>
              {lesson.titleVi && <p className="text-on-surface-variant text-xs mt-0.5">{lesson.titleVi}</p>}
              <p className="text-on-surface-variant text-sm mt-1">{lesson.description}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-black/10">{lesson.category}</span>
                <span className="bg-surface-container-highest px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-black/10">{lesson.level}</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-primary/20">{lesson.duration} min</span>
                <span className="bg-secondary-container px-2 py-0.5 rounded-full text-xs font-bold uppercase border border-secondary/20">{lesson.xpReward} XP</span>
              </div>
            </div>
            <button onClick={() => setSaved(s => !s)} className="shrink-0 p-2.5 border-2 border-black rounded-xl hover:bg-secondary-container transition-colors active:scale-95">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            </button>
          </div>
        </div>

        {/* Combo / Score Bar */}
        {allExercises.length > 0 && !completed && (
          <div className="flex items-center gap-4 mb-3 px-2">
            <div className="flex items-center gap-1 text-xs font-headline">
              <span className="material-symbols-outlined text-[16px] text-primary">local_fire_department</span>
              <span className="font-bold">{combo}x</span>
              <span className="text-outline">combo</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-headline">
              <span className="material-symbols-outlined text-[16px] text-secondary">stars</span>
              <span className="font-bold">{totalScore}</span>
              <span className="text-outline">/ {totalPoints} pts</span>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-headline font-bold mb-1.5">
            <span>{t('lesson_detail.progress', { defaultValue: 'Progress' })}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-black/20">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.max(progress, 2)}%` }} />
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {sections.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 border-black transition-all duration-300 ${
                doneSections.has(i) ? 'bg-primary scale-110' : i === currentStep ? 'bg-secondary-container' : 'bg-surface-container-highest'
              }`} />
            ))}
          </div>
        </div>

        {/* Completion Card */}
        {completed && completionResult && (
          <CompletionCard
            result={completionResult}
            lessonTitle={lesson.title}
            onRetry={() => {
              setCompleted(false);
              setCompletionResult(null);
              completionSentRef.current = false;
              setExerciseStates({});
              setTotalScore(0);
              setCombo(0);
              setMaxCombo(0);
              setDoneSections(new Set());
              setCurrentStep(0);
              startTimeRef.current = Date.now();
            }}
          />
        )}

        {/* Sections (step-by-step) */}
        {!completed && (
          <div className="space-y-3">
            {sections.map((section, idx) => {
              const isDone = doneSections.has(idx);
              const isActive = idx === currentStep;
              const isLocked = !isDone && idx > currentStep;

              const sectionExercisesDone = !section.exercises || section.exercises.every((_, ei) => {
                const key = `${idx}-${ei}`;
                return exerciseStates[key]?.answered;
              });

              return (
                <div key={idx} className={`sketch-card transition-all duration-300 overflow-hidden ${
                  isDone ? 'opacity-75' : isActive ? 'ring-2 ring-black' : ''
                } ${isLocked ? 'opacity-50' : ''}`}>

                  {/* Section header */}
                  <div
                    className={`flex items-center gap-3 p-5 ${!isLocked ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => { if (!isLocked && !isActive) setCurrentStep(idx); }}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 transition-colors ${
                      isDone ? 'bg-primary' : isActive ? 'bg-secondary-container' : 'bg-surface-container'
                    }`}>
                      <span className="material-symbols-outlined text-sm" style={{ color: isDone ? 'white' : undefined }}>
                        {isDone ? 'check' : SECTION_ICONS[section.type] || 'article'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-headline font-bold text-base">{section.title}</h3>
                      {isDone && <span className="text-xs text-primary font-headline font-bold">Completed</span>}
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">
                      {isLocked ? 'lock' : isActive ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>

                  {/* Section body */}
                  {isActive && (
                    <div className="px-5 pb-6 space-y-4 border-t border-black/10">
                      {section.content && (
                        <p className="text-on-surface-variant text-sm md:text-base leading-relaxed whitespace-pre-wrap pt-4">{section.content}</p>
                      )}

                      {/* Vocab items */}
                      {section.type === 'vocab' && section.items && section.items.length > 0 && (
                        <ul className="space-y-2 pl-1 pt-2">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              <div>
                                <span className="font-bold">{item.word}</span>
                                {item.phonetic && <span className="text-outline text-xs ml-1">/{item.phonetic}/</span>}
                                <span className="text-on-surface-variant"> — {item.meaning}</span>
                                {item.example && <p className="text-on-surface-variant text-xs mt-0.5 italic">"{item.example}"</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Grammar */}
                      {section.type === 'grammar' && (
                        <div className="space-y-2 pt-2">
                          {section.pattern && (
                            <div className="px-4 py-2 bg-secondary-container/30 rounded-lg border border-secondary/20">
                              <p className="font-headline font-bold text-sm">{section.pattern}</p>
                            </div>
                          )}
                          {section.examples && section.examples.length > 0 && (
                            <div className="space-y-1.5 pl-1">
                              <p className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant">Examples</p>
                              {section.examples.map((ex, i) => (
                                <p key={i} className="text-sm pl-3 border-l-2 border-primary/40 text-on-surface-variant italic">{ex}</p>
                              ))}
                            </div>
                          )}
                          {section.notes && (
                            <p className="text-xs text-outline italic mt-1">{section.notes}</p>
                          )}
                        </div>
                      )}

                      {/* Exercises */}
                      {section.exercises && section.exercises.length > 0 && (
                        <div className="space-y-4 pt-1">
                          {section.exercises.map((ex, exIdx) => {
                            const key = `${idx}-${exIdx}`;
                            const globalIdx = allExercises.find(e => e.sectionIdx === idx && e.exIdx === exIdx)?.globalIdx ?? 0;
                            const state = exerciseStates[key];
                            const isVld = validating === key;

                            return (
                              <ExerciseRenderer
                                key={key}
                                exercise={ex}
                                state={state}
                                isValidating={isVld}
                                onAnswer={(answer) => handleValidateExercise(idx, exIdx, answer, globalIdx)}
                              />
                            );
                          })}
                        </div>
                      )}

                      {/* Summary items */}
                      {section.type === 'summary' && section.items && (
                        <ul className="space-y-2 pl-1 pt-2">
                          {section.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-tertiary shrink-0" />
                              <span><strong>{item.word}</strong> — {item.meaning}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Advance button */}
                      <div className="pt-1">
                        <button
                          onClick={() => markSection(idx)}
                          disabled={!sectionExercisesDone}
                          className="px-6 py-2.5 bg-primary text-white rounded-full font-headline font-bold text-sm border-2 border-black active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {!sectionExercisesDone
                            ? t('lesson_detail.answer_all', { defaultValue: 'Answer all to continue' })
                            : idx < sections.length - 1
                            ? t('lesson_detail.next_section', { defaultValue: 'Next section' }) + ' \u2192'
                            : t('lesson_detail.finish', { defaultValue: 'Finish' }) + ' \u2192'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
};

// ─── Section Icons ───────────────────────────────────

const SECTION_ICONS: Record<string, string> = {
  text: 'article',
  vocab: 'translate',
  vocabulary: 'translate',
  grammar: 'school',
  grammar_rule: 'school',
  exercises: 'fitness_center',
  practice: 'fitness_center',
  summary: 'summarize',
  dialogue: 'forum',
};

// ─── Exercise Renderer ───────────────────────────────

interface ExerciseRendererProps {
  exercise: LessonExerciseItem;
  state?: ExerciseState;
  isValidating: boolean;
  onAnswer: (answer: string | string[] | [string, string][]) => void;
}

const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({ exercise, state, isValidating, onAnswer }) => {
  switch (exercise.type) {
    case 'multiple_choice':
      return <MultipleChoiceExercise exercise={exercise} state={state} isValidating={isValidating} onAnswer={onAnswer} />;
    case 'fill_blank':
      return <FillBlankExercise exercise={exercise} state={state} isValidating={isValidating} onAnswer={onAnswer} />;
    case 'match':
      return <MatchExercise exercise={exercise} state={state} isValidating={isValidating} onAnswer={onAnswer} />;
    case 'reorder':
      return <ReorderExercise exercise={exercise} state={state} isValidating={isValidating} onAnswer={onAnswer} />;
    default:
      return null;
  }
};

// ─── Multiple Choice ─────────────────────────────────

const MultipleChoiceExercise: React.FC<ExerciseRendererProps> = ({ exercise, state, isValidating, onAnswer }) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={`p-4 rounded-xl border-2 transition-colors ${
      state?.answered
        ? state.correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
        : 'border-black/20 bg-surface-container-lowest'
    }`}>
      <p className="font-body font-semibold text-sm md:text-base mb-3">{exercise.question}</p>
      <div className="space-y-2">
        {exercise.options?.map((opt, i) => {
          let cls = 'border-black/30 bg-white hover:border-black hover:bg-surface-container-high';
          if (state?.answered) {
            if (opt === exercise.correctAnswer) cls = 'border-green-500 bg-green-100 text-green-700';
            else if (selected === i) cls = 'border-red-400 bg-red-100 text-red-600';
            else cls = 'border-black/10 opacity-30';
          } else if (selected === i) {
            cls = 'border-black bg-surface-container-highest';
          }
          return (
            <button key={i} onClick={() => { if (!state?.answered && !isValidating) setSelected(i); }} disabled={!!state?.answered}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all font-body text-sm flex items-center gap-3 ${cls}`}>
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0 ${
                state?.answered && opt === exercise.correctAnswer ? 'border-green-500 text-green-600 bg-green-100' :
                state?.answered && selected === i ? 'border-red-400 text-red-500 bg-red-100' : 'border-current'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
      {!state?.answered && (
        <button onClick={() => { if (selected !== null) onAnswer(exercise.options![selected]); }}
          disabled={selected === null || isValidating}
          className="mt-3 px-5 py-2 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95 transition-all disabled:opacity-40">
          {isValidating ? 'Checking...' : 'Check'}
        </button>
      )}
      {state?.answered && <ExerciseFeedback correct={state.correct} explanation={state.explanation} points={state.pointsEarned} />}
    </div>
  );
};

// ─── Fill Blank ──────────────────────────────────────

const FillBlankExercise: React.FC<ExerciseRendererProps> = ({ exercise, state, isValidating, onAnswer }) => {
  const [input, setInput] = useState('');

  return (
    <div className={`p-4 rounded-xl border-2 transition-colors ${
      state?.answered
        ? state.correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
        : 'border-black/20 bg-surface-container-lowest'
    }`}>
      <p className="font-body font-semibold text-sm md:text-base mb-3">
        {exercise.question?.replace('___', state?.answered ? `[${exercise.correctAnswer}]` : '___')}
      </p>
      {!state?.answered ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) onAnswer(input.trim()); }}
            placeholder="Type your answer..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border-2 border-black/20 focus:border-primary outline-none"
            disabled={isValidating}
          />
          <button onClick={() => onAnswer(input.trim())} disabled={!input.trim() || isValidating}
            className="px-5 py-2 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95 transition-all disabled:opacity-40">
            {isValidating ? 'Checking...' : 'Check'}
          </button>
        </div>
      ) : (
        <ExerciseFeedback correct={state.correct} explanation={state.explanation} points={state.pointsEarned} />
      )}
    </div>
  );
};

// ─── Match Exercise ──────────────────────────────────

const MatchExercise: React.FC<ExerciseRendererProps> = ({ exercise, state, isValidating, onAnswer }) => {
  const pairs = exercise.correctPairs || [];
  const leftItems = pairs.map(p => p[0]);
  const [rightItems] = useState(() => pairs.map(p => p[1]).sort(() => Math.random() - 0.5));
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  return (
    <div className={`p-4 rounded-xl border-2 transition-colors ${
      state?.answered
        ? state.correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
        : 'border-black/20 bg-surface-container-lowest'
    }`}>
      <p className="font-body font-semibold text-sm mb-3">{exercise.instruction || 'Match the items'}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {leftItems.map(item => (
            <button
              key={item}
              onClick={() => { if (!state?.answered && !isValidating) setSelectedLeft(item); }}
              disabled={!!state?.answered}
              className={`w-full text-left p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                selectedLeft === item ? 'border-primary bg-primary/10' :
                matches[item] ? 'border-green-300 bg-green-50' :
                'border-black/20 hover:border-black'
              }`}
            >
              {item}
              {matches[item] && <span className="text-green-600 ml-1">= {matches[item]}</span>}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rightItems.map(item => {
            const isUsed = Object.values(matches).includes(item);
            return (
              <button
                key={item}
                onClick={() => {
                  if (!state?.answered && !isValidating && selectedLeft) {
                    setMatches(prev => ({ ...prev, [selectedLeft]: item }));
                    setSelectedLeft(null);
                  }
                }}
                disabled={!!state?.answered || isUsed}
                className={`w-full text-left p-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                  isUsed ? 'border-black/10 opacity-40' : 'border-black/20 hover:border-primary'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
      {!state?.answered && (
        <button onClick={() => {
          const answer: [string, string][] = leftItems.map(left => [left, matches[left]]);
          onAnswer(answer);
        }}
          disabled={Object.keys(matches).length < leftItems.length || isValidating}
          className="mt-3 px-5 py-2 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95 transition-all disabled:opacity-40">
          {isValidating ? 'Checking...' : 'Check'}
        </button>
      )}
      {state?.answered && <ExerciseFeedback correct={state.correct} explanation={state.explanation} points={state.pointsEarned} />}
    </div>
  );
};

// ─── Reorder Exercise ────────────────────────────────

const ReorderExercise: React.FC<ExerciseRendererProps> = ({ exercise, state, isValidating, onAnswer }) => {
  const [items, setItems] = useState<string[]>(() => [...(exercise.words || [])]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleMove = (from: number, to: number) => {
    if (state?.answered || isValidating) return;
    setItems(prev => {
      const arr = [...prev];
      const [removed] = arr.splice(from, 1);
      arr.splice(to, 0, removed);
      return arr;
    });
  };

  return (
    <div className={`p-4 rounded-xl border-2 transition-colors ${
      state?.answered
        ? state.correct ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
        : 'border-black/20 bg-surface-container-lowest'
    }`}>
      <p className="font-body font-semibold text-sm mb-3">{exercise.instruction || 'Put in the correct order'}</p>
      <div className="flex flex-wrap gap-2 min-h-[40px] p-3 rounded-lg bg-surface-container border border-black/10">
        {items.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            draggable={!state?.answered}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragIdx !== null) handleMove(dragIdx, idx); setDragIdx(null); }}
            className={`px-3 py-1.5 rounded-full border-2 text-xs font-bold select-none transition-all ${
              state?.answered
                ? 'border-black/20'
                : 'border-black cursor-grab active:cursor-grabbing hover:bg-primary/10'
            }`}
          >
            {item}
            {!state?.answered && (
              <span className="inline-flex gap-0.5 ml-1">
                {idx > 0 && <button onClick={() => handleMove(idx, idx - 1)} className="text-[10px] text-outline hover:text-primary">&lt;</button>}
                {idx < items.length - 1 && <button onClick={() => handleMove(idx, idx + 1)} className="text-[10px] text-outline hover:text-primary">&gt;</button>}
              </span>
            )}
          </div>
        ))}
      </div>
      {state?.answered && exercise.correctOrder && (
        <p className="text-xs text-outline mt-2">Correct: {exercise.correctOrder.join(' ')}</p>
      )}
      {!state?.answered && (
        <button onClick={() => onAnswer(items)} disabled={isValidating}
          className="mt-3 px-5 py-2 bg-black text-white rounded-full font-headline font-bold text-sm active:scale-95 transition-all disabled:opacity-40">
          {isValidating ? 'Checking...' : 'Check'}
        </button>
      )}
      {state?.answered && <ExerciseFeedback correct={state.correct} explanation={state.explanation} points={state.pointsEarned} />}
    </div>
  );
};

// ─── Exercise Feedback ───────────────────────────────

const ExerciseFeedback: React.FC<{
  correct: boolean;
  explanation?: string;
  points: number;
}> = ({ correct, explanation, points }) => (
  <div className={`mt-3 p-3 rounded-lg ${correct ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
    <div className="flex items-center gap-2">
      <span className={`material-symbols-outlined text-base ${correct ? 'text-green-600' : 'text-red-500'}`}>
        {correct ? 'check_circle' : 'cancel'}
      </span>
      <span className={`font-headline font-bold text-sm ${correct ? 'text-green-700' : 'text-red-600'}`}>
        {correct ? 'Correct!' : 'Incorrect'}
      </span>
      {points > 0 && <span className="text-xs text-green-600 font-bold ml-auto">+{points} pts</span>}
    </div>
    {explanation && <p className="text-xs text-on-surface-variant mt-1">{explanation}</p>}
  </div>
);

// ─── Completion Card ─────────────────────────────────

interface CompletionCardProps {
  result: {
    score: number; starRating: number; xpEarned: number; comboMax: number;
    isReview: boolean; bestScore: number; totalAttempts: number;
  };
  lessonTitle: string;
  onRetry: () => void;
}

const CompletionCard: React.FC<CompletionCardProps> = ({ result, lessonTitle, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="sketch-card p-8 bg-tertiary-container/20 text-center">
      {/* Star display */}
      <div className="flex justify-center gap-1 mb-4">
        {[1, 2, 3].map(star => (
          <span
            key={star}
            className={`material-symbols-outlined text-4xl transition-all ${
              star <= result.starRating ? 'text-yellow-500' : 'text-black/10'
            }`}
            style={{ fontVariationSettings: star <= result.starRating ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        ))}
      </div>

      <h3 className="font-headline font-black text-2xl mb-2">
        {result.starRating >= 3
          ? t('lesson_detail.perfect', { defaultValue: 'Perfect!' })
          : result.starRating >= 2
          ? t('lesson_detail.great', { defaultValue: 'Great job!' })
          : result.starRating >= 1
          ? t('lesson_detail.good', { defaultValue: 'Good effort!' })
          : t('lesson_detail.try_again_msg', { defaultValue: 'Keep practicing!' })}
      </h3>

      <p className="text-on-surface-variant text-sm mb-4">{lessonTitle}</p>

      {/* Stats */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="text-center">
          <p className="font-headline font-black text-2xl text-primary">{result.score}%</p>
          <p className="text-[10px] text-outline">Score</p>
        </div>
        <div className="text-center">
          <p className="font-headline font-black text-2xl text-secondary">+{result.xpEarned}</p>
          <p className="text-[10px] text-outline">XP</p>
        </div>
        <div className="text-center">
          <p className="font-headline font-black text-2xl text-tertiary">{result.comboMax}x</p>
          <p className="text-[10px] text-outline">Max Combo</p>
        </div>
      </div>

      {result.isReview && (
        <p className="text-xs text-outline mb-3">Review mode (50% XP)</p>
      )}
      {result.totalAttempts > 1 && (
        <p className="text-xs text-outline mb-3">Best: {result.bestScore}% ({result.totalAttempts} attempts)</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={() => { window.location.hash = '#journal'; }}
          className="px-6 py-3 sketch-border bg-primary text-white font-headline font-bold text-sm flex items-center gap-2 active:scale-95 transition-all">
          {t('lesson_detail.practice_writing', { defaultValue: 'Practice Writing' })}
          <span className="material-symbols-outlined text-sm">edit_note</span>
        </button>
        {result.starRating < 3 && (
          <button onClick={onRetry}
            className="px-6 py-3 sketch-border bg-secondary-container font-headline font-bold text-sm active:scale-95 transition-all">
            {t('lesson_detail.try_again', { defaultValue: 'Try Again' })}
          </button>
        )}
        <button onClick={() => { window.location.hash = '#library'; }}
          className="px-6 py-3 sketch-border bg-surface-container font-headline font-bold text-sm active:scale-95 transition-all">
          {t('lesson_detail.back_library', { defaultValue: 'Back to Library' })}
        </button>
      </div>
    </div>
  );
};


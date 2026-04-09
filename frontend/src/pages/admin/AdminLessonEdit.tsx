import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { getLesson, createLesson, updateLesson, aiGenerateLesson, aiGenerateExercises } from '../../services/api/admin.api';
import type { AdminLessonDetailDTO, LessonContentJSON, LessonSection, LessonExercise } from '../../types/dto/admin.dto';

const CATEGORIES = ['grammar', 'vocabulary', 'reading', 'listening', 'speaking'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const STATUSES = ['draft', 'review', 'published', 'archived'];

const EMPTY_CONTENT: LessonContentJSON = {
  sections: [
    { type: 'text', title: 'Introduction', content: '' },
  ],
};

export const AdminLessonEditPage: React.FC = () => {
  // Parse lesson ID from hash
  const hash = window.location.hash;
  const editId = hash.match(/#admin\/lesson-edit\/(.+)/)?.[1] || null;

  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('grammar');
  const [level, setLevel] = useState('beginner');
  const [status, setStatus] = useState('draft');
  const [xpReward, setXpReward] = useState(15);
  const [duration, setDuration] = useState(5);
  const [isPremium, setIsPremium] = useState(false);
  const [tags, setTags] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [content, setContent] = useState<LessonContentJSON>(EMPTY_CONTENT);

  // AI generation
  const [aiTopic, setAiTopic] = useState('');

  const loadLesson = useCallback(async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const res = await getLesson(editId);
      const l = res.lesson;
      setTitle(l.title);
      setTitleVi(l.titleVi || '');
      setDescription(l.description);
      setCategory(l.category);
      setLevel(l.level);
      setStatus(l.status);
      setXpReward(l.xpReward);
      setDuration(l.duration);
      setIsPremium(l.isPremium);
      setTags(Array.isArray(l.tags) ? l.tags.join(', ') : '');
      setOrderIndex(l.orderIndex);
      if (l.content && typeof l.content === 'object' && 'sections' in l.content) {
        setContent(l.content as LessonContentJSON);
      } else if (typeof l.content === 'string') {
        try {
          setContent(JSON.parse(l.content as unknown as string));
        } catch {
          setContent({ sections: [{ type: 'text', title: 'Content', content: l.content as unknown as string }] });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }, [editId]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }

    setSaving(true);
    setError('');
    setSuccess('');

    const data = {
      title: title.trim(),
      titleVi: titleVi.trim() || undefined,
      description: description.trim(),
      category,
      level,
      status,
      xpReward,
      duration,
      isPremium,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      orderIndex,
      content,
    };

    try {
      if (editId) {
        await updateLesson(editId, data);
        setSuccess('Lesson updated');
      } else {
        const res = await createLesson(data);
        setSuccess('Lesson created');
        window.location.hash = `#admin/lesson-edit/${res.lesson.id}`;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) { setError('Enter a topic for AI generation'); return; }
    setGenerating(true);
    setError('');
    try {
      const res = await aiGenerateLesson({ topic: aiTopic.trim(), level, category });
      const gen = res.lesson;
      if (gen.title) setTitle(gen.title);
      if (gen.titleVi) setTitleVi(gen.titleVi);
      if (gen.description) setDescription(gen.description);
      if (gen.sections) setContent({ sections: gen.sections });
      setSuccess(`AI generated lesson in ${res.latencyMs}ms`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleAiExercises = async () => {
    if (!aiTopic.trim() && !title.trim()) { setError('Enter a topic or title first'); return; }
    setGenerating(true);
    setError('');
    try {
      const res = await aiGenerateExercises({
        topic: aiTopic.trim() || title.trim(),
        level,
        category,
        exerciseCount: 5,
      });
      // Add exercises as a new section
      const newSection: LessonSection = {
        type: 'exercises',
        title: 'Practice',
        exercises: res.exercises as LessonExercise[],
      };
      setContent(prev => ({ sections: [...prev.sections.filter(s => s.type !== 'exercises'), newSection] }));
      setSuccess(`AI generated ${res.exercises?.length || 0} exercises in ${res.latencyMs}ms`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Exercise generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Section management
  const addSection = (type: LessonSection['type']) => {
    const section: LessonSection = { type, title: '' };
    switch (type) {
      case 'text': section.title = 'New Section'; section.content = ''; break;
      case 'vocab': section.title = 'Vocabulary'; section.items = []; break;
      case 'grammar': section.title = 'Grammar'; section.pattern = ''; section.examples = []; break;
      case 'exercises': section.title = 'Practice'; section.exercises = []; break;
      case 'summary': section.title = 'Quick Review'; section.content = ''; break;
    }
    setContent(prev => ({ sections: [...prev.sections, section] }));
  };

  const updateSection = (index: number, updates: Partial<LessonSection>) => {
    setContent(prev => ({
      sections: prev.sections.map((s, i) => i === index ? { ...s, ...updates } : s),
    }));
  };

  const removeSection = (index: number) => {
    setContent(prev => ({ sections: prev.sections.filter((_, i) => i !== index) }));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= content.sections.length) return;
    setContent(prev => {
      const sections = [...prev.sections];
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      return { sections };
    });
  };

  if (loading) {
    return (
      <AdminLayout activePath="lessons">
        <div className="flex items-center justify-center py-12 text-outline">Loading lesson...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePath="lessons">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <a href="#admin/lessons" className="p-1 rounded hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </a>
          <h2 className="font-headline font-bold text-lg">{editId ? 'Edit Lesson' : 'New Lesson'}</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 rounded-xl bg-tertiary-container text-on-tertiary-container text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content (left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-3">
            <h3 className="font-headline font-semibold text-sm">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-outline mb-1">Title (EN)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
                  placeholder="Lesson title in English"
                />
              </div>
              <div>
                <label className="block text-[10px] text-outline mb-1">Title (VI)</label>
                <input
                  type="text"
                  value={titleVi}
                  onChange={e => setTitleVi(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
                  placeholder="Ten bai hoc tieng Viet"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-outline mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant resize-none"
                placeholder="Short description of what this lesson covers"
              />
            </div>
          </div>

          {/* AI Generation */}
          <div className="p-4 rounded-xl bg-secondary-container/30 border border-secondary/20 space-y-3">
            <h3 className="font-headline font-semibold text-sm">AI Content Generation</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
                placeholder="Enter topic (e.g., ordering food at a restaurant)"
              />
              <button
                onClick={handleAiGenerate}
                disabled={generating}
                className="px-3 py-2 text-xs rounded-lg bg-secondary text-on-secondary font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                {generating ? 'Generating...' : 'Generate Lesson'}
              </button>
              <button
                onClick={handleAiExercises}
                disabled={generating}
                className="px-3 py-2 text-xs rounded-lg bg-tertiary text-on-tertiary font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                Add Exercises
              </button>
            </div>
          </div>

          {/* Sections Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-semibold text-sm">Content Sections ({content.sections.length})</h3>
              <div className="flex gap-1">
                {(['text', 'vocab', 'grammar', 'exercises', 'summary'] as LessonSection['type'][]).map(type => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="px-2 py-1 text-[10px] rounded-lg bg-surface-container-highest hover:bg-primary/10 transition-colors capitalize"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>

            {content.sections.map((section, idx) => (
              <SectionEditor
                key={idx}
                section={section}
                index={idx}
                total={content.sections.length}
                onChange={updates => updateSection(idx, updates)}
                onRemove={() => removeSection(idx)}
                onMove={dir => moveSection(idx, dir)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar (right col) */}
        <div className="space-y-4">
          {/* Settings */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-3">
            <h3 className="font-headline font-semibold text-sm">Settings</h3>

            <div>
              <label className="block text-[10px] text-outline mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-outline mb-1">Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
              >
                {LEVELS.map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-outline mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-outline mb-1">XP Reward</label>
                <input
                  type="number"
                  value={xpReward}
                  onChange={e => setXpReward(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
                />
              </div>
              <div>
                <label className="block text-[10px] text-outline mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  min={1}
                  max={60}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-outline mb-1">Order Index</label>
              <input
                type="number"
                value={orderIndex}
                onChange={e => setOrderIndex(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
              />
            </div>

            <div>
              <label className="block text-[10px] text-outline mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-surface border border-outline-variant"
                placeholder="present tense, daily routine"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={e => setIsPremium(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs">Premium content</span>
            </label>
          </div>

          {/* Content JSON Preview */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant">
            <h3 className="font-headline font-semibold text-sm mb-2">Content JSON</h3>
            <pre className="text-[10px] text-outline overflow-auto max-h-60 whitespace-pre-wrap break-all">
              {JSON.stringify(content, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

// ─── Section Editor Component ────────
interface SectionEditorProps {
  section: LessonSection;
  index: number;
  total: number;
  onChange: (updates: Partial<LessonSection>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

const SECTION_ICONS: Record<string, string> = {
  text: 'article',
  vocab: 'dictionary',
  grammar: 'rule',
  exercises: 'quiz',
  summary: 'summarize',
};

const SectionEditor: React.FC<SectionEditorProps> = ({ section, index, total, onChange, onRemove, onMove }) => {
  return (
    <div className="p-4 rounded-xl bg-surface-container border border-outline-variant">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline">{SECTION_ICONS[section.type] || 'article'}</span>
          <span className="text-[10px] font-medium text-outline uppercase">{section.type}</span>
          <input
            type="text"
            value={section.title}
            onChange={e => onChange({ title: e.target.value })}
            className="px-2 py-1 text-xs rounded bg-surface border border-outline-variant font-headline font-semibold"
            placeholder="Section title"
          />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-0.5 rounded hover:bg-surface-container-highest disabled:opacity-30">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-0.5 rounded hover:bg-surface-container-highest disabled:opacity-30">
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          </button>
          <button onClick={onRemove} className="p-0.5 rounded hover:bg-error-container text-error">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      </div>

      {/* Type-specific editor */}
      {(section.type === 'text' || section.type === 'summary') && (
        <textarea
          value={section.content || ''}
          onChange={e => onChange({ content: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-outline-variant resize-y"
          placeholder="Section content..."
        />
      )}

      {section.type === 'vocab' && (
        <VocabSectionEditor
          items={section.items || []}
          onChange={items => onChange({ items })}
        />
      )}

      {section.type === 'grammar' && (
        <div className="space-y-2">
          <div>
            <label className="block text-[10px] text-outline mb-1">Pattern</label>
            <input
              type="text"
              value={section.pattern || ''}
              onChange={e => onChange({ pattern: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant"
              placeholder="e.g., S + V + O"
            />
          </div>
          <div>
            <label className="block text-[10px] text-outline mb-1">Examples (one per line)</label>
            <textarea
              value={(section.examples || []).join('\n')}
              onChange={e => onChange({ examples: e.target.value.split('\n').filter(Boolean) })}
              rows={3}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant resize-y"
              placeholder="I go to school.&#10;She goes to work."
            />
          </div>
          <div>
            <label className="block text-[10px] text-outline mb-1">Notes (Vietnamese ok)</label>
            <input
              type="text"
              value={section.notes || ''}
              onChange={e => onChange({ notes: e.target.value })}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant"
            />
          </div>
        </div>
      )}

      {section.type === 'exercises' && (
        <ExercisesSectionEditor
          exercises={section.exercises || []}
          onChange={exercises => onChange({ exercises })}
        />
      )}
    </div>
  );
};

// ─── Vocab Section Editor ────────────
interface VocabSectionEditorProps {
  items: NonNullable<LessonSection['items']>;
  onChange: (items: NonNullable<LessonSection['items']>) => void;
}

const VocabSectionEditor: React.FC<VocabSectionEditorProps> = ({ items, onChange }) => {
  const addItem = () => {
    onChange([...items, { word: '', meaning: '', example: '' }]);
  };

  const updateItem = (idx: number, updates: Partial<typeof items[0]>) => {
    onChange(items.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <input
            type="text"
            value={item.word}
            onChange={e => updateItem(idx, { word: e.target.value })}
            className="flex-1 px-2 py-1 text-xs rounded bg-surface border border-outline-variant"
            placeholder="Word/phrase"
          />
          <input
            type="text"
            value={item.meaning}
            onChange={e => updateItem(idx, { meaning: e.target.value })}
            className="flex-1 px-2 py-1 text-xs rounded bg-surface border border-outline-variant"
            placeholder="Meaning"
          />
          <input
            type="text"
            value={item.example || ''}
            onChange={e => updateItem(idx, { example: e.target.value })}
            className="flex-[2] px-2 py-1 text-xs rounded bg-surface border border-outline-variant"
            placeholder="Example sentence"
          />
          <button onClick={() => removeItem(idx)} className="p-0.5 text-error hover:bg-error-container rounded">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      ))}
      <button onClick={addItem} className="text-[10px] text-primary hover:underline">
        + Add vocabulary item
      </button>
    </div>
  );
};

// ─── Exercises Section Editor ────────
interface ExercisesSectionEditorProps {
  exercises: LessonExercise[];
  onChange: (exercises: LessonExercise[]) => void;
}

const ExercisesSectionEditor: React.FC<ExercisesSectionEditorProps> = ({ exercises, onChange }) => {
  const addExercise = (type: LessonExercise['type']) => {
    const base: LessonExercise = { type, points: 10 };
    switch (type) {
      case 'multiple_choice':
        base.question = '';
        base.options = ['', '', '', ''];
        base.correctAnswer = '';
        base.explanation = '';
        break;
      case 'fill_blank':
        base.question = '';
        base.correctAnswer = '';
        base.acceptableAnswers = [];
        base.explanation = '';
        break;
      case 'match':
        base.instruction = 'Match the words with their meanings';
        base.correctPairs = [['', '']];
        base.explanation = '';
        break;
      case 'reorder':
        base.instruction = 'Put the words in the correct order';
        base.words = [];
        base.correctOrder = [];
        base.explanation = '';
        break;
    }
    onChange([...exercises, base]);
  };

  const updateExercise = (idx: number, updates: Partial<LessonExercise>) => {
    onChange(exercises.map((ex, i) => i === idx ? { ...ex, ...updates } : ex));
  };

  const removeExercise = (idx: number) => {
    onChange(exercises.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {exercises.map((ex, idx) => (
        <div key={idx} className="p-3 rounded-lg bg-surface border border-outline-variant space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase text-outline">#{idx + 1} {ex.type.replace('_', ' ')}</span>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-outline">Points:</label>
              <input
                type="number"
                value={ex.points}
                onChange={e => updateExercise(idx, { points: Number(e.target.value) })}
                className="w-12 px-1 py-0.5 text-[10px] rounded bg-surface-container border border-outline-variant text-center"
                min={0}
                max={50}
              />
              <button onClick={() => removeExercise(idx)} className="p-0.5 text-error hover:bg-error-container rounded">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </div>

          {ex.type === 'multiple_choice' && (
            <>
              <input
                type="text"
                value={ex.question || ''}
                onChange={e => updateExercise(idx, { question: e.target.value })}
                className="w-full px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                placeholder="Question"
              />
              {(ex.options || []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={`ex-${idx}-correct`}
                    checked={opt === ex.correctAnswer}
                    onChange={() => updateExercise(idx, { correctAnswer: opt })}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOpts = [...(ex.options || [])];
                      newOpts[oi] = e.target.value;
                      updateExercise(idx, { options: newOpts });
                    }}
                    className="flex-1 px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                    placeholder={`Option ${oi + 1}`}
                  />
                </div>
              ))}
              <input
                type="text"
                value={ex.explanation || ''}
                onChange={e => updateExercise(idx, { explanation: e.target.value })}
                className="w-full px-2 py-1 text-[10px] rounded bg-surface-container border border-outline-variant"
                placeholder="Explanation (shown after answer)"
              />
            </>
          )}

          {ex.type === 'fill_blank' && (
            <>
              <input
                type="text"
                value={ex.question || ''}
                onChange={e => updateExercise(idx, { question: e.target.value })}
                className="w-full px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                placeholder="Sentence with ___ for the blank"
              />
              <input
                type="text"
                value={ex.correctAnswer || ''}
                onChange={e => updateExercise(idx, { correctAnswer: e.target.value })}
                className="w-full px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                placeholder="Correct answer"
              />
              <input
                type="text"
                value={(ex.acceptableAnswers || []).join(', ')}
                onChange={e => updateExercise(idx, { acceptableAnswers: e.target.value.split(',').map(a => a.trim()).filter(Boolean) })}
                className="w-full px-2 py-1 text-[10px] rounded bg-surface-container border border-outline-variant"
                placeholder="Other acceptable answers (comma-separated)"
              />
              <input
                type="text"
                value={ex.explanation || ''}
                onChange={e => updateExercise(idx, { explanation: e.target.value })}
                className="w-full px-2 py-1 text-[10px] rounded bg-surface-container border border-outline-variant"
                placeholder="Explanation"
              />
            </>
          )}

          {ex.type === 'match' && (
            <>
              <input
                type="text"
                value={ex.instruction || ''}
                onChange={e => updateExercise(idx, { instruction: e.target.value })}
                className="w-full px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                placeholder="Instruction"
              />
              {(ex.correctPairs || []).map((pair, pi) => (
                <div key={pi} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={pair[0]}
                    onChange={e => {
                      const newPairs = [...(ex.correctPairs || [])];
                      newPairs[pi] = [e.target.value, pair[1]];
                      updateExercise(idx, { correctPairs: newPairs });
                    }}
                    className="flex-1 px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                    placeholder="Left item"
                  />
                  <span className="text-xs text-outline">-</span>
                  <input
                    type="text"
                    value={pair[1]}
                    onChange={e => {
                      const newPairs = [...(ex.correctPairs || [])];
                      newPairs[pi] = [pair[0], e.target.value];
                      updateExercise(idx, { correctPairs: newPairs });
                    }}
                    className="flex-1 px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                    placeholder="Right item"
                  />
                  <button onClick={() => {
                    const newPairs = (ex.correctPairs || []).filter((_, i) => i !== pi);
                    updateExercise(idx, { correctPairs: newPairs });
                  }} className="p-0.5 text-error">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateExercise(idx, { correctPairs: [...(ex.correctPairs || []), ['', '']] })}
                className="text-[10px] text-primary hover:underline"
              >
                + Add pair
              </button>
            </>
          )}

          {ex.type === 'reorder' && (
            <>
              <input
                type="text"
                value={ex.instruction || ''}
                onChange={e => updateExercise(idx, { instruction: e.target.value })}
                className="w-full px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant"
                placeholder="Instruction"
              />
              <div>
                <label className="text-[10px] text-outline">Correct order (one word/phrase per line)</label>
                <textarea
                  value={(ex.correctOrder || []).join('\n')}
                  onChange={e => {
                    const order = e.target.value.split('\n').filter(Boolean);
                    updateExercise(idx, { correctOrder: order, words: [...order].sort(() => Math.random() - 0.5) });
                  }}
                  rows={3}
                  className="w-full px-2 py-1 text-xs rounded bg-surface-container border border-outline-variant resize-y"
                />
              </div>
              <input
                type="text"
                value={ex.explanation || ''}
                onChange={e => updateExercise(idx, { explanation: e.target.value })}
                className="w-full px-2 py-1 text-[10px] rounded bg-surface-container border border-outline-variant"
                placeholder="Explanation"
              />
            </>
          )}
        </div>
      ))}

      <div className="flex gap-1">
        {(['multiple_choice', 'fill_blank', 'match', 'reorder'] as LessonExercise['type'][]).map(type => (
          <button
            key={type}
            onClick={() => addExercise(type)}
            className="px-2 py-1 text-[10px] rounded-lg bg-surface-container-highest hover:bg-primary/10 transition-colors"
          >
            + {type.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
};

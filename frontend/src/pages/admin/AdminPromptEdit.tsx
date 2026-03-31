import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getPrompt, createPrompt, updatePrompt } from '../../services/api/admin.api';
import type { CreatePromptDTO } from '../../types/dto/admin.dto';

function getQueryParam(key: string): string | null {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex < 0) return null;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return params.get(key);
}

const LEVELS = ['basic', 'intermediate', 'advanced'] as const;

export const AdminPromptEditPage: React.FC = () => {
  const editId = getQueryParam('id');
  const isEdit = Boolean(editId);

  const [form, setForm] = useState<CreatePromptDTO>({
    publishDate: new Date().toISOString().slice(0, 10),
    internalTitle: '',
    promptVi: '',
    promptEn: '',
    followUp: '',
    level: 'basic',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    getPrompt(editId)
      .then((res) => {
        const p = res.prompt;
        setForm({
          publishDate: p.publishDate,
          internalTitle: p.internalTitle,
          promptVi: p.promptVi,
          promptEn: p.promptEn,
          followUp: p.followUp || '',
          level: p.level,
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load prompt'))
      .finally(() => setLoading(false));
  }, [editId]);

  const handleChange = (field: keyof CreatePromptDTO, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSave = async (asDraft = true) => {
    setError('');
    setSuccess('');

    if (!form.internalTitle.trim()) {
      setError('Internal title is required');
      return;
    }
    if (!form.promptEn.trim()) {
      setError('English prompt is required');
      return;
    }
    if (!form.publishDate) {
      setError('Publish date is required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && editId) {
        await updatePrompt(editId, {
          ...form,
          status: asDraft ? 'draft' : 'scheduled',
        });
        setSuccess('Prompt updated');
      } else {
        const res = await createPrompt(form);
        if (!asDraft) {
          const { publishPrompt } = await import('../../services/api/admin.api');
          await publishPrompt(res.prompt.id, 'scheduled');
        }
        setSuccess('Prompt created');
        setTimeout(() => {
          window.location.hash = '#admin/prompts';
        }, 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout activePath="prompts">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 w-48 bg-surface-container-highest rounded" />
          <div className="h-10 bg-surface-container-highest rounded-xl" />
          <div className="h-10 bg-surface-container-highest rounded-xl" />
          <div className="h-24 bg-surface-container-highest rounded-xl" />
          <div className="h-24 bg-surface-container-highest rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePath="prompts">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a
            href="#admin/prompts"
            className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </a>
          <h2 className="font-headline font-bold text-lg">{isEdit ? 'Edit Prompt' : 'New Prompt'}</h2>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-tertiary-container text-on-tertiary-container text-sm rounded-lg">{success}</div>
        )}

        {/* Form */}
        <div className="border-2 border-black rounded-2xl p-5 bg-surface-container-lowest space-y-5">
          {/* Date + Level row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">
                Publish Date
              </label>
              <input
                type="date"
                value={form.publishDate}
                onChange={(e) => handleChange('publishDate', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">
                Level
              </label>
              <select
                value={form.level}
                onChange={(e) => handleChange('level', e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l} className="capitalize">{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Internal Title */}
          <div>
            <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">
              Internal Title <span className="text-outline font-normal">(admin only)</span>
            </label>
            <input
              type="text"
              value={form.internalTitle}
              onChange={(e) => handleChange('internalTitle', e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
              placeholder="e.g. Topic về đồ ăn sáng"
            />
          </div>

          {/* Prompt VN */}
          <div>
            <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">
              Prompt Tiếng Việt
            </label>
            <textarea
              value={form.promptVi}
              onChange={(e) => handleChange('promptVi', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors resize-none"
              placeholder="Sáng nay bạn ăn gì?"
            />
          </div>

          {/* Prompt EN */}
          <div>
            <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">
              Prompt English
            </label>
            <textarea
              value={form.promptEn}
              onChange={(e) => handleChange('promptEn', e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors resize-none"
              placeholder="What did you have for breakfast?"
            />
          </div>

          {/* Follow-up */}
          <div>
            <label className="block text-xs font-headline font-bold mb-1.5 text-on-surface-variant">
              Follow-up / Gợi ý <span className="text-outline font-normal">(optional)</span>
            </label>
            <textarea
              value={form.followUp || ''}
              onChange={(e) => handleChange('followUp', e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors resize-none"
              placeholder="Từ vựng mồi, gợi ý cách viết..."
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-5 gap-3">
          <a
            href="#admin/prompts"
            className="px-4 py-2.5 text-sm font-headline text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-colors"
          >
            Cancel
          </a>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2.5 border-2 border-outline-variant text-sm font-headline font-bold rounded-xl hover:bg-surface-container-highest disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2.5 bg-primary text-on-primary-container text-sm font-headline font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving...' : 'Save & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

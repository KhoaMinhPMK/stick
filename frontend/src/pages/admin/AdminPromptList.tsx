import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getPrompts, deletePrompt, publishPrompt } from '../../services/api/admin.api';
import type { DailyPromptDTO, PromptFilterParams } from '../../types/dto/admin.dto';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-surface-container-highest text-on-surface-variant',
  scheduled: 'bg-secondary-container text-on-secondary-container',
  published: 'bg-tertiary-container text-on-tertiary-container',
};

export const AdminPromptListPage: React.FC = () => {
  const [prompts, setPrompts] = useState<DailyPromptDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 15;

  const loadPrompts = async (params?: Partial<PromptFilterParams>) => {
    setLoading(true);
    setError('');
    try {
      const res = await getPrompts({
        status: params?.status ?? statusFilter,
        page: String(params?.page ?? page),
        limit: String(limit),
      });
      setPrompts(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete prompt "${title}"?`)) return;
    try {
      await deletePrompt(id);
      loadPrompts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handlePublish = async (id: string, status: 'scheduled' | 'published') => {
    try {
      await publishPrompt(id, status);
      loadPrompts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Publish failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout activePath="prompts">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-headline font-bold text-lg">Daily Prompts</h2>
          <p className="text-xs text-outline">{total} prompts total</p>
        </div>
        <a
          href="#admin/prompt-edit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Prompt
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['all', 'draft', 'scheduled', 'published'].map((s) => (
          <button
            key={s}
            onClick={() => { setPage(1); setStatusFilter(s); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-headline font-bold capitalize transition-colors ${
              statusFilter === s
                ? 'bg-primary text-on-primary-container'
                : 'bg-surface-container-highest text-on-surface-variant hover:bg-outline-variant'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">{error}</div>
      )}

      {/* Table */}
      <div className="border-2 border-black rounded-2xl overflow-hidden bg-surface-container-lowest">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left font-headline text-xs">
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Title</th>
                <th className="px-4 py-3 font-bold hidden lg:table-cell">Prompt (EN)</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant animate-pulse">
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-32 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-5 w-40 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-surface-container-highest rounded ml-auto" /></td>
                  </tr>
                ))
              ) : prompts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-outline">No prompts found</td>
                </tr>
              ) : (
                prompts.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold font-headline uppercase px-2 py-0.5 rounded-full ${STATUS_BADGE[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-headline">{p.publishDate}</td>
                    <td className="px-4 py-3 font-bold text-sm max-w-[200px] truncate">{p.internalTitle}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant hidden lg:table-cell max-w-[250px] truncate">{p.promptEn}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`#admin/prompt-edit?id=${p.id}`}
                          className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </a>
                        {p.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(p.id, 'scheduled')}
                            className="p-1.5 hover:bg-secondary-container rounded-lg transition-colors"
                            title="Schedule"
                          >
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                          </button>
                        )}
                        {(p.status === 'draft' || p.status === 'scheduled') && (
                          <button
                            onClick={() => handlePublish(p.id, 'published')}
                            className="p-1.5 hover:bg-tertiary-container rounded-lg transition-colors"
                            title="Publish now"
                          >
                            <span className="material-symbols-outlined text-[18px]">publish</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p.id, p.internalTitle)}
                          className="p-1.5 hover:bg-error-container rounded-lg transition-colors text-error"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
            <p className="text-[11px] text-outline">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 text-xs font-headline rounded-lg hover:bg-surface-container-highest disabled:opacity-30 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 text-xs font-headline rounded-lg hover:bg-surface-container-highest disabled:opacity-30 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

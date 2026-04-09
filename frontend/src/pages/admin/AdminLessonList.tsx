import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getLessons, deleteLesson, duplicateLesson, updateLesson } from '../../services/api/admin.api';
import type { AdminLessonDTO, LessonFilterParams } from '../../types/dto/admin.dto';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-surface-container-highest text-on-surface-variant',
  review: 'bg-secondary-container text-on-secondary-container',
  published: 'bg-tertiary-container text-on-tertiary-container',
  archived: 'bg-error-container text-on-error-container',
};

const CATEGORY_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const AdminLessonListPage: React.FC = () => {
  const [lessons, setLessons] = useState<AdminLessonDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const loadLessons = async (params?: Partial<LessonFilterParams>) => {
    setLoading(true);
    setError('');
    try {
      const res = await getLessons({
        status: params?.status ?? statusFilter,
        category: params?.category ?? categoryFilter,
        level: params?.level ?? levelFilter,
        search: params?.search !== undefined ? params.search : search,
        page: String(params?.page ?? page),
        limit: String(limit),
      });
      setLessons(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, categoryFilter, levelFilter]);

  const handleSearch = () => {
    setPage(1);
    loadLessons({ search, page: '1' });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"?`)) return;
    try {
      await deleteLesson(id);
      loadLessons();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateLesson(id);
      loadLessons();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await updateLesson(id, { status: newStatus });
      loadLessons();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout activePath="lessons">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-headline font-bold text-lg">Lessons</h2>
          <p className="text-xs text-outline">{total} lessons total</p>
        </div>
        <a
          href="#admin/lesson-edit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-sm rounded-xl hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Lesson
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-xs rounded-lg bg-surface-container border border-outline-variant"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-xs rounded-lg bg-surface-container border border-outline-variant"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={levelFilter}
          onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 text-xs rounded-lg bg-surface-container border border-outline-variant"
        >
          <option value="all">All Levels</option>
          {Object.entries(LEVEL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="flex gap-1 ml-auto">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search lessons..."
            className="px-3 py-1.5 text-xs rounded-lg bg-surface-container border border-outline-variant w-48"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 text-xs rounded-lg bg-surface-container-highest hover:bg-primary/10 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full text-xs">
          <thead className="bg-surface-container-highest">
            <tr>
              <th className="text-left px-3 py-2 font-headline">#</th>
              <th className="text-left px-3 py-2 font-headline">Title</th>
              <th className="text-left px-3 py-2 font-headline">Category</th>
              <th className="text-left px-3 py-2 font-headline">Level</th>
              <th className="text-left px-3 py-2 font-headline">Status</th>
              <th className="text-center px-3 py-2 font-headline">XP</th>
              <th className="text-center px-3 py-2 font-headline">Attempts</th>
              <th className="text-right px-3 py-2 font-headline">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-outline">Loading...</td></tr>
            ) : lessons.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-outline">No lessons found</td></tr>
            ) : lessons.map((lesson, idx) => (
              <tr key={lesson.id} className="border-t border-outline-variant hover:bg-surface-container/50 transition-colors">
                <td className="px-3 py-2 text-outline">{(page - 1) * limit + idx + 1}</td>
                <td className="px-3 py-2">
                  <a href={`#admin/lesson-edit/${lesson.id}`} className="font-headline font-semibold text-primary hover:underline">
                    {lesson.title}
                  </a>
                  {lesson.titleVi && <p className="text-[10px] text-outline mt-0.5">{lesson.titleVi}</p>}
                  {lesson.isPremium && <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-warning-container text-on-warning-container rounded-full">PRO</span>}
                  {lesson.aiGenerated && <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-full">AI</span>}
                </td>
                <td className="px-3 py-2">{CATEGORY_LABELS[lesson.category] || lesson.category}</td>
                <td className="px-3 py-2">{LEVEL_LABELS[lesson.level] || lesson.level}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[lesson.status] || STATUS_BADGE.draft}`}>
                    {lesson.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">{lesson.xpReward}</td>
                <td className="px-3 py-2 text-center">{lesson._count?.attempts ?? 0}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleTogglePublish(lesson.id, lesson.status)}
                      title={lesson.status === 'published' ? 'Unpublish' : 'Publish'}
                      className="p-1 rounded hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {lesson.status === 'published' ? 'unpublished' : 'publish'}
                      </span>
                    </button>
                    <a
                      href={`#admin/lesson-edit/${lesson.id}`}
                      title="Edit"
                      className="p-1 rounded hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </a>
                    <button
                      onClick={() => handleDuplicate(lesson.id)}
                      title="Duplicate"
                      className="p-1 rounded hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button
                      onClick={() => handleDelete(lesson.id, lesson.title)}
                      title="Delete"
                      className="p-1 rounded hover:bg-error-container transition-colors text-error"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-outline">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs rounded-lg bg-surface-container-highest hover:bg-primary/10 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs rounded-lg bg-surface-container-highest hover:bg-primary/10 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

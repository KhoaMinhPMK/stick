import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getUsers } from '../../services/api/admin.api';
import type { AdminUserDTO } from '../../types/dto/admin.dto';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const loadUsers = async (params?: { page?: number; search?: string; sort?: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await getUsers({
        search: params?.search ?? search,
        page: String(params?.page ?? page),
        limit: String(limit),
        sort: params?.sort ?? sort,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers({ page: 1, search });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout activePath="users">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-headline font-bold text-lg">Users Explorer</h2>
          <p className="text-xs text-outline">{total} users total</p>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2 border-2 border-outline-variant rounded-xl text-xs font-headline bg-surface focus:border-primary focus:outline-none"
        >
          <option value="recent">Newest first</option>
          <option value="streak">Highest streak</option>
          <option value="active">Most active</option>
        </select>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
            placeholder="Search by email or name..."
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary text-on-primary-container text-sm font-headline font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
        </div>
      </form>

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
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3 font-bold text-right">Days</th>
                <th className="px-4 py-3 font-bold text-right">Streak</th>
                <th className="px-4 py-3 font-bold text-right hidden md:table-cell">Journals</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant animate-pulse">
                    <td className="px-4 py-3"><div className="h-5 w-32 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-5 w-20 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-8 bg-surface-container-highest rounded ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-8 bg-surface-container-highest rounded ml-auto" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-5 w-8 bg-surface-container-highest rounded ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-surface-container-highest rounded ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-outline">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-outline-variant hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center text-[11px] font-bold font-headline shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">
                            {u.name}
                            {u.isPremium && <span className="ml-1.5 text-[10px] font-bold font-headline uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 align-middle">★</span>}
                          </p>
                          <p className="text-[11px] text-outline truncate">{u.email || 'Guest'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-headline hidden sm:table-cell">
                      {u.createdAt.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-xs font-headline text-right">{u.stats.totalDays}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold font-headline ${u.stats.currentStreak > 0 ? 'text-tertiary' : 'text-outline'}`}>
                        {u.stats.currentStreak}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-headline text-right hidden md:table-cell">{u.stats.totalJournals}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`#admin/user-detail?id=${u.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-headline font-bold hover:bg-surface-container-highest rounded-lg transition-colors"
                      >
                        View
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                      </a>
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

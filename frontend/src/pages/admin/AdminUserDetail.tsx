import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getUser, patchUser } from '../../services/api/admin.api';
import type { AdminUserDetailDTO } from '../../types/dto/admin.dto';

function getQueryParam(key: string): string | null {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex < 0) return null;
  const params = new URLSearchParams(hash.slice(qIndex + 1));
  return params.get(key);
}

export const AdminUserDetailPage: React.FC = () => {
  const userId = getQueryParam('id');
  const [data, setData] = useState<AdminUserDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const handlePatch = async (patch: { role?: string; status?: string; isPremium?: boolean }) => {
    if (!userId) return;
    setActionLoading(true);
    setActionMsg('');
    try {
      const res = await patchUser(userId, patch);
      // Update local state
      setData((prev) => prev ? {
        ...prev,
        user: {
          ...prev.user,
          role: res.user.role,
          status: res.user.status,
          isPremium: res.user.isPremium,
          premiumSince: res.user.premiumSince,
          premiumUntil: res.user.premiumUntil,
        },
      } : prev);
      setActionMsg('Updated successfully');
      setTimeout(() => setActionMsg(''), 2000);
    } catch (err: unknown) {
      setActionMsg(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }
    getUser(userId)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <AdminLayout activePath="users">
        <div className="animate-pulse space-y-4 max-w-3xl">
          <div className="h-8 w-48 bg-surface-container-highest rounded" />
          <div className="h-32 bg-surface-container-highest rounded-2xl" />
          <div className="h-48 bg-surface-container-highest rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout activePath="users">
        <div className="text-center py-20">
          <p className="text-error font-headline font-bold">{error || 'User not found'}</p>
          <a href="#admin/users" className="mt-4 text-sm underline inline-block">← Back to users</a>
        </div>
      </AdminLayout>
    );
  }

  const { user, recentJournals } = data;

  return (
    <AdminLayout activePath="users">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a
            href="#admin/users"
            className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </a>
          <h2 className="font-headline font-bold text-lg">User Detail</h2>
        </div>

        {/* Profile Card */}
        <div className="border-2 border-black rounded-2xl p-5 bg-surface-container-lowest mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-lg font-bold font-headline shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline font-bold text-base">{user.name}</h3>
              <p className="text-xs text-outline">{user.email || 'Guest account'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.isGuest && (
                  <span className="text-[10px] font-bold font-headline uppercase px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
                    Guest
                  </span>
                )}
                <span className="text-[10px] font-bold font-headline uppercase px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                  {user.role}
                </span>
                {user.status === 'banned' && (
                  <span className="text-[10px] font-bold font-headline uppercase px-2 py-0.5 rounded-full bg-error-container text-on-error-container">
                    Banned
                  </span>
                )}
                {user.isPremium && (
                  <span className="text-[10px] font-bold font-headline uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900">
                    ★ Premium
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-4 pt-4 border-t border-outline-variant grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] font-headline text-outline uppercase">Joined</p>
              <p className="text-sm font-bold font-headline">{user.createdAt.slice(0, 10)}</p>
            </div>
            <div>
              <p className="text-[10px] font-headline text-outline uppercase">Language</p>
              <p className="text-sm font-bold font-headline">{user.nativeLanguage || '—'}</p>
            </div>
            {user.onboarding && (
              <>
                <div>
                  <p className="text-[10px] font-headline text-outline uppercase">Level</p>
                  <p className="text-sm font-bold font-headline">{user.onboarding.level || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-headline text-outline uppercase">Goal</p>
                  <p className="text-sm font-bold font-headline">{user.onboarding.goal || '—'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {user.status !== 'banned' ? (
            <button
              onClick={() => { if (confirm('Ban this user? They will not be able to use the app.')) handlePatch({ status: 'banned' }); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-error text-error font-headline font-bold text-xs rounded-xl hover:bg-error-container disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">block</span>
              Ban User
            </button>
          ) : (
            <button
              onClick={() => handlePatch({ status: 'active' })}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-tertiary text-tertiary font-headline font-bold text-xs rounded-xl hover:bg-tertiary-container disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Unban User
            </button>
          )}
          {user.role === 'user' ? (
            <button
              onClick={() => { if (confirm('Promote this user to admin?')) handlePatch({ role: 'admin' }); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-primary text-primary font-headline font-bold text-xs rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">shield_person</span>
              Make Admin
            </button>
          ) : (
            <button
              onClick={() => { if (confirm('Remove admin privileges?')) handlePatch({ role: 'user' }); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-outline-variant text-on-surface-variant font-headline font-bold text-xs rounded-xl hover:bg-surface-container-highest disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              Demote to User
            </button>
          )}
          {/* Premium Toggle */}
          {user.isPremium ? (
            <button
              onClick={() => { if (confirm('Remove premium access for this user?')) handlePatch({ isPremium: false }); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-amber-400 text-amber-700 font-headline font-bold text-xs rounded-xl hover:bg-amber-50 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">star_off</span>
              Remove Premium
            </button>
          ) : (
            <button
              onClick={() => { if (confirm('Grant premium access to this user?')) handlePatch({ isPremium: true }); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-amber-500 text-amber-600 font-headline font-bold text-xs rounded-xl hover:bg-amber-50 disabled:opacity-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              Grant Premium
            </button>
          )}
          {actionMsg && (
            <span className={`text-xs font-headline font-bold ${actionMsg.includes('success') ? 'text-tertiary' : 'text-error'}`}>
              {actionMsg}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Days', value: user.stats.totalDays },
            { label: 'Streak', value: user.stats.currentStreak },
            { label: 'Journals', value: user.stats.totalJournals },
            { label: 'Words Learned', value: user.stats.totalWordsLearned },
          ].map((s) => (
            <div key={s.label} className="border-2 border-black rounded-2xl p-3 bg-surface-container-lowest text-center">
              <p className="text-[10px] font-headline text-outline uppercase">{s.label}</p>
              <p className="text-xl font-black font-headline mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Journals */}
        <div className="border-2 border-black rounded-2xl overflow-hidden bg-surface-container-lowest">
          <div className="px-5 py-3 border-b-2 border-black">
            <h3 className="font-headline font-bold text-sm">Recent Journals</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {recentJournals.length === 0 ? (
              <div className="px-5 py-8 text-center text-outline text-sm">No journals yet</div>
            ) : (
              recentJournals.map((j) => (
                <div key={j.id} className="px-5 py-3 hover:bg-surface-container transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{j.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{j.content}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-outline">{j.createdAt.slice(0, 10)}</p>
                      <span className={`text-[10px] font-bold font-headline uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                        j.status === 'submitted'
                          ? 'bg-tertiary-container text-on-tertiary-container'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {j.status}
                      </span>
                      {j.score !== null && (
                        <p className="text-xs font-bold font-headline mt-1">{j.score}/100</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getUser, patchUser, getAdminUserStreakFreezes, grantStreakFreeze, revokeStreakFreeze, adjustUserStats } from '../../services/api/admin.api';
import type { AdminStreakFreeze } from '../../services/api/admin.api';
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

  // Streak freezes state
  const [freezes, setFreezes] = useState<{ available: AdminStreakFreeze[]; used: AdminStreakFreeze[]; expired: AdminStreakFreeze[]; availableCount: number } | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [grantCount, setGrantCount] = useState(1);
  const [grantNote, setGrantNote] = useState('');
  const [grantExpiry, setGrantExpiry] = useState('');
  const [freezeMsg, setFreezeMsg] = useState('');
  const [freezeError, setFreezeError] = useState('');

  // Stats editing state
  const [xpInput, setXpInput] = useState('');
  const [streakInput, setStreakInput] = useState('');
  const [bestStreakInput, setBestStreakInput] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsMsg, setStatsMsg] = useState('');
  const [statsError, setStatsError] = useState('');

  const loadFreezes = async () => {
    if (!userId) return;
    try {
      const res = await getAdminUserStreakFreezes(userId);
      setFreezes(res);
    } catch {
      // non-critical — fail silently
    }
  };

  const handleGrantFreeze = async () => {
    if (!userId) return;
    setFreezeLoading(true);
    setFreezeMsg('');
    setFreezeError('');
    try {
      await grantFreeze(userId, grantCount, grantNote || undefined, grantExpiry || undefined);
      setFreezeMsg(`Granted ${grantCount} freeze${grantCount > 1 ? 's' : ''}`);
      setGrantNote('');
      setGrantExpiry('');
      await loadFreezes();
      setTimeout(() => setFreezeMsg(''), 3000);
    } catch (err: unknown) {
      setFreezeError(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleRevokeFreeze = async (freezeId: string) => {
    if (!userId || !confirm('Revoke this streak freeze?')) return;
    setFreezeLoading(true);
    try {
      await revokeFreeze(userId, freezeId);
      await loadFreezes();
    } catch (err: unknown) {
      setFreezeError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setFreezeLoading(false);
    }
  };

  // Aliases to avoid name collision with imported functions
  const grantFreeze = grantStreakFreeze;
  const revokeFreeze = revokeStreakFreeze;

  const handleAdjustStats = async () => {
    if (!userId) return;
    const payload: { xpAdjustment?: number; setCurrentStreak?: number; setBestStreak?: number } = {};
    if (xpInput.trim() !== '') {
      const xp = parseInt(xpInput.trim());
      if (isNaN(xp)) { setStatsError('XP must be a number'); return; }
      payload.xpAdjustment = xp;
    }
    if (streakInput.trim() !== '') {
      const s = parseInt(streakInput.trim());
      if (isNaN(s) || s < 0) { setStatsError('Streak must be a non-negative number'); return; }
      payload.setCurrentStreak = s;
    }
    if (bestStreakInput.trim() !== '') {
      const b = parseInt(bestStreakInput.trim());
      if (isNaN(b) || b < 0) { setStatsError('Best streak must be a non-negative number'); return; }
      payload.setBestStreak = b;
    }
    if (Object.keys(payload).length === 0) { setStatsError('Enter at least one value'); return; }

    setStatsLoading(true);
    setStatsMsg('');
    setStatsError('');
    try {
      const res = await adjustUserStats(userId, payload);
      const s = res.stats;
      setStatsMsg(`Updated — XP: ${s.totalXp} | Streak: ${s.currentStreak} | Best: ${s.bestStreak}`);
      setXpInput('');
      setStreakInput('');
      setBestStreakInput('');
      // refresh user data
      const fresh = await getUser(userId);
      setData(fresh);
      setTimeout(() => setStatsMsg(''), 4000);
    } catch (err: unknown) {
      setStatsError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setStatsLoading(false);
    }
  };

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
    loadFreezes();
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
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-headline shrink-0 overflow-hidden ${user.isPremium ? 'ring-2 ring-amber-400 ring-offset-2' : 'bg-secondary-container'}`}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className={user.isPremium ? 'bg-amber-100 w-full h-full flex items-center justify-center' : ''}>
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
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
            {user.isPremium && (
              <>
                <div>
                  <p className="text-[10px] font-headline text-outline uppercase">Premium Since</p>
                  <p className="text-sm font-bold font-headline">{user.premiumSince ? user.premiumSince.slice(0, 10) : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-headline text-outline uppercase">Premium Until</p>
                  <p className="text-sm font-bold font-headline text-amber-600">{user.premiumUntil ? user.premiumUntil.slice(0, 10) : 'Lifetime'}</p>
                </div>
              </>
            )}
            {user.onboarding && !user.isPremium && (
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Days', value: user.stats.totalDays },
            { label: 'Streak', value: user.stats.currentStreak },
            { label: 'Journals', value: user.stats.totalJournals },
            { label: 'Words', value: user.stats.totalWordsLearned },
            { label: 'Total XP', value: user.stats.totalXp ?? 0 },
            { label: 'Minutes', value: user.stats.totalMinutes ?? 0 },
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

        {/* Streak Freeze Management */}
        <div className="border-2 border-black rounded-2xl overflow-hidden bg-surface-container-lowest mt-6">
          <div className="px-5 py-3 border-b-2 border-black flex items-center justify-between">
            <h3 className="font-headline font-bold text-sm flex items-center gap-2">
              <span>🛡️</span> Streak Freezes
              {freezes !== null && (
                <span className="text-xs font-normal text-on-surface-variant">
                  ({freezes.availableCount} available)
                </span>
              )}
            </h3>
          </div>

          {/* Grant Form */}
          <div className="px-5 py-4 border-b border-outline-variant bg-surface-container">
            <p className="text-xs font-headline font-bold text-outline uppercase mb-3">Grant Freezes</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-[10px] font-headline uppercase text-outline block mb-1">Count</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={grantCount}
                  onChange={(e) => setGrantCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 border-2 border-outline-variant rounded-lg px-2 py-1.5 text-sm font-headline font-bold text-center focus:border-primary outline-none"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-[10px] font-headline uppercase text-outline block mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value.slice(0, 200))}
                  placeholder="e.g. Compensation for outage"
                  className="w-full border-2 border-outline-variant rounded-lg px-3 py-1.5 text-sm focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-headline uppercase text-outline block mb-1">Expires (optional)</label>
                <input
                  type="date"
                  value={grantExpiry}
                  onChange={(e) => setGrantExpiry(e.target.value)}
                  className="border-2 border-outline-variant rounded-lg px-2 py-1.5 text-sm focus:border-primary outline-none"
                />
              </div>
              <button
                onClick={handleGrantFreeze}
                disabled={freezeLoading}
                className="flex items-center gap-1.5 px-4 py-2 border-2 border-primary text-primary font-headline font-bold text-xs rounded-xl hover:bg-primary-container disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Grant
              </button>
            </div>
            {freezeMsg && <p className="mt-2 text-xs font-bold text-tertiary">{freezeMsg}</p>}
            {freezeError && <p className="mt-2 text-xs font-bold text-error">{freezeError}</p>}
          </div>

          {/* Available Freezes List */}
          <div className="divide-y divide-outline-variant">
            {freezes === null ? (
              <div className="px-5 py-4 text-xs text-outline">Loading freezes...</div>
            ) : freezes.available.length === 0 && freezes.used.length === 0 ? (
              <div className="px-5 py-4 text-xs text-outline text-center">No streak freezes for this user</div>
            ) : (
              <>
                {freezes.available.map((f) => (
                  <div key={f.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-surface-container transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-headline font-bold uppercase px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">Available</span>
                        <span className="text-xs text-outline">Granted {f.grantedAt.slice(0, 10)}</span>
                        {f.expiresAt && <span className="text-xs text-orange-600">Expires {f.expiresAt.slice(0, 10)}</span>}
                      </div>
                      {f.note && <p className="text-xs text-on-surface-variant mt-0.5">{f.note}</p>}
                    </div>
                    <button
                      onClick={() => handleRevokeFreeze(f.id)}
                      disabled={freezeLoading}
                      className="text-[10px] font-headline font-bold text-error border border-error px-2 py-0.5 rounded-lg hover:bg-error-container disabled:opacity-50 transition-colors shrink-0"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
                {freezes.used.slice(0, 5).map((f) => (
                  <div key={f.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-container transition-colors opacity-60">
                    <span className="text-[10px] font-headline font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant shrink-0">Used</span>
                    <span className="text-xs text-outline">
                      Protected {f.usedForDate ? f.usedForDate.slice(0, 10) : '—'} · Used {f.usedAt ? f.usedAt.slice(0, 10) : '—'}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Stats Edit ── */}
        <div className="bg-surface-container rounded-2xl p-5 mt-4">
          <h3 className="font-headline font-bold text-base mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">edit_note</span>
            Edit Stats (XP / Streak)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant block mb-1">XP Adjustment (+/-)</label>
              <input
                type="number"
                value={xpInput}
                onChange={(e) => setXpInput(e.target.value)}
                placeholder="e.g. 100 or -50"
                className="w-full border border-outline/30 rounded-lg px-3 py-2 text-sm bg-surface"
              />
            </div>
            <div>
              <label className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Set Current Streak</label>
              <input
                type="number"
                min="0"
                value={streakInput}
                onChange={(e) => setStreakInput(e.target.value)}
                placeholder="e.g. 7"
                className="w-full border border-outline/30 rounded-lg px-3 py-2 text-sm bg-surface"
              />
            </div>
            <div>
              <label className="text-[10px] font-headline font-bold uppercase tracking-widest text-on-surface-variant block mb-1">Set Best Streak</label>
              <input
                type="number"
                min="0"
                value={bestStreakInput}
                onChange={(e) => setBestStreakInput(e.target.value)}
                placeholder="e.g. 14"
                className="w-full border border-outline/30 rounded-lg px-3 py-2 text-sm bg-surface"
              />
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant mb-3">Setting current streak will backfill ProgressDaily records for the last N days.</p>
          <button
            onClick={handleAdjustStats}
            disabled={statsLoading}
            className="bg-primary text-white text-xs font-headline font-bold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {statsLoading ? 'Saving...' : 'Apply Changes'}
          </button>
          {statsMsg && <p className="mt-2 text-xs font-bold text-tertiary">{statsMsg}</p>}
          {statsError && <p className="mt-2 text-xs font-bold text-error">{statsError}</p>}
        </div>

      </div>
    </AdminLayout>
  );
};

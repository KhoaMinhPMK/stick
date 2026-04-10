import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getAbuseFlags, reviewAbuseFlag, type AbuseFlagItem } from '../../services/api/admin.api';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-50 text-red-700',
  reviewed: 'bg-blue-50 text-blue-700',
  dismissed: 'bg-stone-100 text-stone-600',
  confirmed: 'bg-red-100 text-red-800',
};

export const AdminAbuseFlagsPage: React.FC = () => {
  const [items, setItems] = useState<AbuseFlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadFlags = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAbuseFlags(statusFilter, severityFilter || undefined);
      setItems(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load abuse flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFlags(); }, [statusFilter, severityFilter]);

  const handleReview = async (id: string, status: 'reviewed' | 'dismissed' | 'confirmed') => {
    setReviewingId(id);
    try {
      await reviewAbuseFlag(id, status);
      setItems(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update flag');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <AdminLayout activePath="abuse-flags">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-headline font-bold text-lg">Abuse Flags</h2>
          <p className="text-xs text-outline mt-0.5">{items.length} flags matching filters</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border-2 border-outline-variant rounded-xl text-xs bg-surface focus:border-primary focus:outline-none font-headline font-bold"
          >
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
            <option value="confirmed">Confirmed</option>
          </select>
          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border-2 border-outline-variant rounded-xl text-xs bg-surface focus:border-primary focus:outline-none font-headline font-bold"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-xs underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-2 border-outline-variant rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-48 bg-surface-container-highest rounded mb-3" />
              <div className="h-3 w-full bg-surface-container-highest rounded mb-2" />
              <div className="h-3 w-3/4 bg-surface-container-highest rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="border-2 border-outline-variant rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-outline mb-2 block">verified_user</span>
          <h3 className="font-headline font-bold text-base mb-1">No flags found</h3>
          <p className="text-sm text-outline">No abuse flags match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(flag => (
            <div key={flag.id} className="border-2 border-black rounded-2xl bg-surface-container-lowest overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant">
                <span className={`px-2 py-0.5 text-[10px] font-bold font-headline rounded-lg border ${SEVERITY_COLORS[flag.severity] || 'bg-stone-100 text-stone-700'}`}>
                  {flag.severity.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold font-headline rounded-lg ${STATUS_COLORS[flag.status] || ''}`}>
                  {flag.status}
                </span>
                <code className="text-xs font-mono text-on-surface-variant">{flag.code}</code>
                <span className="text-[10px] text-outline ml-auto">{new Date(flag.createdAt).toLocaleString()}</span>
              </div>

              {/* Body */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                  <span className="text-sm font-headline font-bold">{flag.name}</span>
                  {flag.email && <span className="text-[11px] text-outline">{flag.email}</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] mb-3">
                  <div>
                    <span className="text-outline">Scope:</span>
                    <span className="ml-1 font-bold">{flag.scope}</span>
                  </div>
                  <div>
                    <span className="text-outline">Day:</span>
                    <span className="ml-1 font-bold">{flag.dayKey}</span>
                  </div>
                  <div>
                    <span className="text-outline">User ID:</span>
                    <span className="ml-1 font-mono">{flag.userId.slice(0, 8)}…</span>
                  </div>
                  {flag.sourceId && (
                    <div>
                      <span className="text-outline">Source:</span>
                      <span className="ml-1 font-mono">{flag.sourceId.slice(0, 8)}…</span>
                    </div>
                  )}
                </div>

                {flag.details && (
                  <div className="px-3 py-2 bg-surface-container rounded-xl mb-3">
                    <p className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap break-all">{flag.details}</p>
                  </div>
                )}

                {/* Actions */}
                {flag.status === 'open' && (
                  <div className="flex gap-2 pt-2 border-t border-outline-variant">
                    <button
                      onClick={() => handleReview(flag.id, 'dismissed')}
                      disabled={reviewingId === flag.id}
                      className="px-3 py-1.5 text-xs font-headline font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-xl transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleReview(flag.id, 'reviewed')}
                      disabled={reviewingId === flag.id}
                      className="px-3 py-1.5 text-xs font-headline font-bold text-primary hover:bg-primary-container rounded-xl transition-colors disabled:opacity-50"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleReview(flag.id, 'confirmed')}
                      disabled={reviewingId === flag.id}
                      className="px-3 py-1.5 text-xs font-headline font-bold text-error hover:bg-error-container rounded-xl transition-colors disabled:opacity-50"
                    >
                      Confirm Abuse
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

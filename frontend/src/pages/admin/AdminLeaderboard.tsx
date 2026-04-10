import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { adminFinalizeLeaderboard, adminExpireGrants, getRewardLedger, type RewardLedgerItem } from '../../services/api/admin.api';

export const AdminLeaderboardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Reward Ledger audit
  const [ledgerUserId, setLedgerUserId] = useState('');
  const [ledgerDayKey, setLedgerDayKey] = useState('');
  const [ledgerItems, setLedgerItems] = useState<RewardLedgerItem[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const handleFinalize = async (dayKey?: string) => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await adminFinalizeLeaderboard(dayKey);
      setResult(`Finalize: ${res.status} — period: ${res.periodKey}${res.grantedCount ? `, grants: ${res.grantedCount}` : ''}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  };

  const handleExpire = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await adminExpireGrants();
      setResult(`Expired ${res.expired} premium grants.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  };

  const handleLoadLedger = async () => {
    setLedgerLoading(true); setError('');
    try {
      const res = await getRewardLedger({ userId: ledgerUserId || undefined, dayKey: ledgerDayKey || undefined, limit: 50 });
      setLedgerItems(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLedgerLoading(false); }
  };

  return (
    <AdminLayout activePath="leaderboard-ops">
      <h2 className="font-headline font-bold text-lg mb-5">Leaderboard Ops</h2>

      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-xs underline">Dismiss</button>
        </div>
      )}
      {result && (
        <div className="mb-4 p-3 bg-tertiary-container text-on-tertiary-container text-sm rounded-lg font-mono">
          {result}
        </div>
      )}

      {/* Finalization Controls */}
      <div className="border-2 border-black rounded-2xl bg-surface-container-lowest p-5 mb-6">
        <h3 className="font-headline font-bold text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">event</span>
          Daily Finalization
        </h3>
        <p className="text-xs text-outline mb-4">
          Snapshot yesterday's leaderboard, grant Premium Day Pass to top 3, and expire old grants.
          This normally runs via cron at 00:05 VN time.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleFinalize()}
            disabled={loading}
            className="px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Running…' : 'Finalize Yesterday'}
          </button>
          <button
            onClick={handleExpire}
            disabled={loading}
            className="px-4 py-2 bg-surface-container-highest text-on-surface font-headline font-bold text-xs rounded-xl hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Expire Old Grants
          </button>
        </div>
      </div>

      {/* Reward Ledger Audit */}
      <div className="border-2 border-black rounded-2xl bg-surface-container-lowest p-5">
        <h3 className="font-headline font-bold text-sm mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Reward Ledger Audit
        </h3>
        <div className="flex gap-3 flex-wrap mb-4">
          <input
            type="text"
            placeholder="User ID (optional)"
            value={ledgerUserId}
            onChange={e => setLedgerUserId(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none font-mono"
          />
          <input
            type="text"
            placeholder="Day key (e.g. 2026-04-09)"
            value={ledgerDayKey}
            onChange={e => setLedgerDayKey(e.target.value)}
            className="w-40 px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none font-mono"
          />
          <button
            onClick={handleLoadLedger}
            disabled={ledgerLoading}
            className="px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {ledgerLoading ? 'Loading…' : 'Search'}
          </button>
        </div>

        {ledgerItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-2 px-2 font-headline font-bold">Event</th>
                  <th className="py-2 px-2 font-headline font-bold">Bucket</th>
                  <th className="py-2 px-2 font-headline font-bold">XP</th>
                  <th className="py-2 px-2 font-headline font-bold">Day</th>
                  <th className="py-2 px-2 font-headline font-bold">Integrity</th>
                  <th className="py-2 px-2 font-headline font-bold">Time</th>
                </tr>
              </thead>
              <tbody>
                {ledgerItems.map(item => (
                  <tr key={item.id} className="border-b border-outline-variant">
                    <td className="py-2 px-2 font-mono">{item.eventType}</td>
                    <td className="py-2 px-2">{item.bucket}</td>
                    <td className="py-2 px-2 font-bold">{item.amount}</td>
                    <td className="py-2 px-2 font-mono">{item.dayKey}</td>
                    <td className="py-2 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.integrityStatus === 'clear' ? 'bg-green-100 text-green-700' :
                        item.integrityStatus === 'excluded' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.integrityStatus}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-outline">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ledgerItems.length === 0 && !ledgerLoading && (
          <p className="text-xs text-outline text-center py-4">No ledger entries found. Use the filters above to search.</p>
        )}
      </div>
    </AdminLayout>
  );
};

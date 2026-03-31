import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getAILogs, getAILog } from '../../services/api/admin.api';
import type { AILogDTO, AILogFilterParams } from '../../types/dto/admin.dto';

export const AdminAILogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AILogDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<AILogDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 20;

  const loadLogs = async (params?: Partial<AILogFilterParams & { page: string }>) => {
    setLoading(true);
    setError('');
    try {
      const res = await getAILogs({
        status: params?.status ?? statusFilter,
        page: String(params?.page ?? page),
        limit: String(limit),
        from: params?.from ?? dateFrom,
        to: params?.to ?? dateTo,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load AI logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadLogs({ status: statusFilter, from: dateFrom, to: dateTo, page: '1' });
  };

  const handleReset = () => {
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    loadLogs({ status: '', from: '', to: '', page: '1' });
  };

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await getAILog(id);
      setSelectedLog(res.log);
    } catch {
      // Fallback to the row data already in the list
      const found = logs.find((l) => l.id === id);
      if (found) setSelectedLog(found);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Stats from current page context
  const todayErrors = logs.filter((l) => l.statusCode >= 400).length;
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.latencyMs, 0) / logs.length) : 0;

  return (
    <AdminLayout activePath="ai-logs">
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-headline font-bold text-lg">AI Logs</h2>
        <p className="text-xs text-outline mt-0.5">
          {total} requests total · {todayErrors} errors on this page · Avg {avgLatency}ms
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-[10px] font-headline font-bold text-on-surface-variant mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border-2 border-outline-variant rounded-xl text-xs bg-surface focus:border-primary focus:outline-none transition-colors"
          >
            <option value="">All</option>
            <option value="200">Success (200)</option>
            <option value="500">Error (500)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-headline font-bold text-on-surface-variant mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border-2 border-outline-variant rounded-xl text-xs bg-surface focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-headline font-bold text-on-surface-variant mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border-2 border-outline-variant rounded-xl text-xs bg-surface focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
        >
          Filter
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 text-xs font-headline text-on-surface-variant underline hover:text-on-surface transition-colors"
        >
          Reset
        </button>
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
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold hidden md:table-cell">Input (Draft)</th>
                <th className="px-4 py-3 font-bold text-center">Status</th>
                <th className="px-4 py-3 font-bold text-right">Latency</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant animate-pulse">
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-5 w-40 bg-surface-container-highest rounded" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-10 bg-surface-container-highest rounded mx-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-surface-container-highest rounded ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-12 bg-surface-container-highest rounded ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-outline">
                    <span className="material-symbols-outlined text-3xl mb-2 block">smart_toy</span>
                    No AI logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-outline-variant hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3 text-xs font-headline whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs truncate max-w-[120px]">{log.userName}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant hidden md:table-cell max-w-[300px] truncate">
                      {log.inputText}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold font-headline px-2 py-0.5 rounded-full ${
                        log.statusCode >= 400
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-tertiary-container text-on-tertiary-container'
                      }`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs text-right font-headline font-bold ${log.latencyMs > 2000 ? 'text-error' : ''}`}>
                      {log.latencyMs}ms
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewDetail(log.id)}
                        className="px-2.5 py-1 text-xs font-headline font-bold text-primary hover:bg-primary-container rounded-lg transition-colors"
                      >
                        View
                      </button>
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
            <p className="text-[11px] text-outline">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
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

      {/* Detail Modal */}
      {selectedLog && (
        <AILogDetailModal
          log={selectedLog}
          loading={detailLoading}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </AdminLayout>
  );
};

// ─── Detail Modal ────────────────────
interface AILogDetailModalProps {
  log: AILogDTO;
  loading: boolean;
  onClose: () => void;
}

const AILogDetailModal: React.FC<AILogDetailModalProps> = ({ log, loading, onClose }) => {
  // Try to parse output as JSON for pretty display
  let parsedOutput: Record<string, unknown> | null = null;
  if (log.outputText) {
    try {
      parsedOutput = JSON.parse(log.outputText);
    } catch {
      // not JSON, show raw
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border-2 border-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading && (
          <div className="absolute inset-0 bg-surface/80 flex items-center justify-center rounded-2xl z-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black">
          <div>
            <h3 className="font-headline font-bold text-base">AI Log Detail</h3>
            <p className="text-[11px] text-outline mt-0.5">
              {formatDateTime(log.createdAt)} · {log.model}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status + Meta Row */}
          <div className="flex flex-wrap gap-3">
            <span className={`text-xs font-bold font-headline px-3 py-1 rounded-full ${
              log.statusCode >= 400
                ? 'bg-error-container text-on-error-container'
                : 'bg-tertiary-container text-on-tertiary-container'
            }`}>
              Status {log.statusCode}
            </span>
            <span className={`text-xs font-headline px-3 py-1 rounded-full bg-surface-container-highest ${
              log.latencyMs > 2000 ? 'text-error font-bold' : 'text-on-surface-variant'
            }`}>
              {log.latencyMs}ms
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-headline">User:</span>
            <span className="text-xs font-bold">{log.userName}</span>
            {log.userId && (
              <a
                href={`#admin/user-detail?id=${log.userId}`}
                className="text-[11px] text-primary underline ml-1"
              >
                View user →
              </a>
            )}
          </div>

          {/* Error Message */}
          {log.errorMessage && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl text-sm">
              <p className="text-xs font-headline font-bold mb-1">Error</p>
              <p className="font-mono text-xs">{log.errorMessage}</p>
            </div>
          )}

          {/* Input */}
          <div>
            <p className="text-xs font-headline font-bold text-on-surface-variant mb-1.5">Input (User Draft)</p>
            <div className="p-3 bg-surface-container-highest rounded-xl text-sm font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
              {log.inputText}
            </div>
          </div>

          {/* Output */}
          {log.outputText && (
            <div>
              <p className="text-xs font-headline font-bold text-on-surface-variant mb-1.5">Output (AI Response)</p>
              {parsedOutput ? (
                <div className="space-y-3">
                  {renderParsedFeedback(parsedOutput)}
                </div>
              ) : (
                <div className="p-3 bg-surface-container-highest rounded-xl text-sm font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
                  {log.outputText}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Helpers ─────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm} ${dd}/${mo}`;
}

function renderParsedFeedback(obj: Record<string, unknown>): React.ReactNode {
  const sections: React.ReactNode[] = [];

  // Common feedback fields from STICK AI
  const fieldLabels: Record<string, string> = {
    enhancedText: 'Enhanced Text',
    enhanced_text: 'Enhanced Text',
    corrections: 'Corrections',
    vocabBoosters: 'Vocab Boosters',
    vocab_boosters: 'Vocab Boosters',
    sentencePatterns: 'Sentence Patterns',
    sentence_patterns: 'Sentence Patterns',
    encouragement: 'Encouragement',
    score: 'Score',
  };

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (obj[key] !== undefined && obj[key] !== null) {
      const value = obj[key];
      sections.push(
        <div key={key} className="p-3 bg-surface-container-highest rounded-xl">
          <p className="text-[10px] font-headline font-bold text-on-surface-variant uppercase mb-1">{label}</p>
          {typeof value === 'string' ? (
            <p className="text-sm whitespace-pre-wrap">{value}</p>
          ) : Array.isArray(value) ? (
            <ul className="text-sm space-y-1">
              {value.map((item, i) => (
                <li key={i} className="text-sm">
                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                </li>
              ))}
            </ul>
          ) : typeof value === 'number' ? (
            <p className="text-lg font-black font-headline">{value}</p>
          ) : (
            <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
          )}
        </div>
      );
    }
  }

  // If we didn't match any known fields, show raw JSON
  if (sections.length === 0) {
    return (
      <div className="p-3 bg-surface-container-highest rounded-xl text-sm font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto">
        {JSON.stringify(obj, null, 2)}
      </div>
    );
  }

  return sections;
}

import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getMetricCards, getMetricFunnel, getRetention, getAIHealth } from '../../services/api/admin.api';
import type { MetricCardsDTO, FunnelStepDTO, CohortDTO, AIHealthDayDTO } from '../../types/dto/admin.dto';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function MetricCard({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`border-2 rounded-2xl p-4 ${alert ? 'border-error bg-error-container/30' : 'border-black bg-surface-container-lowest'}`}>
      <p className="text-xs font-headline text-on-surface-variant font-bold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black font-headline mt-1">{value}</p>
      {sub && <p className="text-[11px] text-outline mt-0.5">{sub}</p>}
    </div>
  );
}

function FunnelChart({ steps }: { steps: FunnelStepDTO[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.step} className="flex items-center gap-3">
          <span className="text-[11px] font-headline w-28 text-right text-on-surface-variant truncate">{s.step}</span>
          <div className="flex-1 h-6 bg-surface-container-highest rounded-lg overflow-hidden">
            <div
              className="h-full bg-primary rounded-lg transition-all"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold w-10">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

function RetentionTable({ cohorts }: { cohorts: CohortDTO[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-headline">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-2 pr-3 font-bold">Cohort</th>
            <th className="py-2 px-3 font-bold text-right">Users</th>
            <th className="py-2 px-3 font-bold text-right">D1</th>
            <th className="py-2 px-3 font-bold text-right">D2</th>
            <th className="py-2 px-3 font-bold text-right">D3</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.registeredDate} className="border-b border-outline-variant">
              <td className="py-2 pr-3">{c.registeredDate}</td>
              <td className="py-2 px-3 text-right">{c.totalUsers}</td>
              <td className="py-2 px-3 text-right">{c.d1}%</td>
              <td className="py-2 px-3 text-right">{c.d2}%</td>
              <td className="py-2 px-3 text-right">{c.d3}%</td>
            </tr>
          ))}
          {cohorts.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-outline">No cohort data yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AIHealthChart({ daily }: { daily: AIHealthDayDTO[] }) {
  const maxLatency = Math.max(...daily.map((d) => d.avgLatencyMs), 1);
  return (
    <div className="space-y-2">
      {daily.map((d) => (
        <div key={d.date} className="flex items-center gap-3">
          <span className="text-[11px] font-headline w-16 text-right text-on-surface-variant">{d.date.slice(5)}</span>
          <div className="flex-1 h-5 bg-surface-container-highest rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all ${d.errorCount > 0 ? 'bg-error' : 'bg-tertiary-container'}`}
              style={{ width: `${(d.avgLatencyMs / maxLatency) * 100}%` }}
            />
          </div>
          <span className="text-[11px] w-16 text-right">{d.avgLatencyMs}ms</span>
          {d.errorCount > 0 && <span className="text-[10px] text-error font-bold">{d.errorCount}err</span>}
        </div>
      ))}
      {daily.length === 0 && <p className="text-xs text-outline text-center py-4">No AI data yet</p>}
    </div>
  );
}

export const AdminDashboardPage: React.FC = () => {
  const [cards, setCards] = useState<MetricCardsDTO | null>(null);
  const [funnel, setFunnel] = useState<FunnelStepDTO[]>([]);
  const [cohorts, setCohorts] = useState<CohortDTO[]>([]);
  const [aiHealth, setAIHealth] = useState<AIHealthDayDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [cardsRes, funnelRes, retentionRes, aiRes] = await Promise.all([
          getMetricCards(todayStr()),
          getMetricFunnel(daysAgoStr(7), todayStr()),
          getRetention(daysAgoStr(14), todayStr()),
          getAIHealth(7),
        ]);
        setCards(cardsRes);
        setFunnel(funnelRes.steps);
        setCohorts(retentionRes.cohorts);
        setAIHealth(aiRes.daily);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout activePath="dashboard">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-surface-container-highest rounded-2xl" />)}
          </div>
          <div className="h-64 bg-surface-container-highest rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout activePath="dashboard">
        <div className="text-center py-20">
          <p className="text-error font-headline font-bold">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm underline">Retry</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePath="dashboard">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Today Sessions"
          value={String(cards?.todaySessions ?? 0)}
          sub={`Yesterday: ${cards?.yesterdaySessions ?? 0}`}
        />
        <MetricCard
          label="Completion Rate"
          value={`${(cards?.completionRate ?? 0).toFixed(0)}%`}
          sub={`${(cards?.completionRateChange ?? 0) >= 0 ? '+' : ''}${(cards?.completionRateChange ?? 0).toFixed(1)}% vs yesterday`}
        />
        <MetricCard
          label="AI Error Rate"
          value={`${(cards?.aiErrorRate ?? 0).toFixed(1)}%`}
          sub={`${cards?.aiErrorCount ?? 0} errors today`}
          alert={(cards?.aiErrorRate ?? 0) > 5}
        />
        <MetricCard
          label="D1 Return Rate"
          value={`${(cards?.day1ReturnRate ?? 0).toFixed(0)}%`}
          sub={`Target: ≥ 60%`}
          alert={(cards?.day1ReturnRate ?? 0) < 60}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border-2 border-black rounded-2xl p-5 bg-surface-container-lowest">
          <h3 className="font-headline font-bold text-sm mb-4">Core Funnel (7 days)</h3>
          <FunnelChart steps={funnel} />
        </div>

        <div className="border-2 border-black rounded-2xl p-5 bg-surface-container-lowest">
          <h3 className="font-headline font-bold text-sm mb-4">Cohort Retention</h3>
          <RetentionTable cohorts={cohorts} />
        </div>

        <div className="border-2 border-black rounded-2xl p-5 bg-surface-container-lowest lg:col-span-2">
          <h3 className="font-headline font-bold text-sm mb-4">AI Latency & Errors (7 days)</h3>
          <AIHealthChart daily={aiHealth} />
        </div>
      </div>
    </AdminLayout>
  );
};

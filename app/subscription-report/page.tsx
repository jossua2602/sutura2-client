'use client';

import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MonthReport {
  label: string;
  subscriptions: number;
  revenue: number;
}

interface PlanReport {
  plan: string;
  subscriptions: number;
  revenue: number;
}

interface RegistrationTrend {
  label: string;
  approved: number;
  rejected: number;
  approval_rate: number;
}

interface RegistrationReport {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  approval_rate: number;
  trend: RegistrationTrend[];
}

interface Report {
  active_subscriptions: number;
  total_revenue: number;
  monthly_revenue: MonthReport[];
  by_plan: PlanReport[];
  registrations: RegistrationReport;
  generated_at: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const money = (value: number) => `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

export default function SubscriptionReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    async function loadReport() {
      try {
        const response = await fetch(`${apiUrl}/admin/subscription-report`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin-login');
          return;
        }
        if (!response.ok) throw new Error('Could not load subscription report.');
        setReport(await response.json());
        setError('');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load subscription report.');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
    const timer = window.setInterval(loadReport, 3000);
    return () => window.clearInterval(timer);
  }, [router]);

  const maxRevenue = Math.max(...(report?.monthly_revenue.map((item) => item.revenue) ?? [1]), 1);
  const maxPlanRevenue = Math.max(...(report?.by_plan.map((item) => item.revenue) ?? [1]), 1);
  const revenuePoints = report?.monthly_revenue.map((month, index, months) => {
    const x = months.length === 1 ? 50 : 8 + (index / (months.length - 1)) * 84;
    const y = 88 - (month.revenue / maxRevenue) * 76;
    return `${x},${y}`;
  }).join(' ') ?? '';
  const firstRevenue = report?.monthly_revenue[0]?.revenue ?? 0;
  const latestRevenue = report?.monthly_revenue.at(-1)?.revenue ?? 0;
  const revenueRising = latestRevenue >= firstRevenue;

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div>
            <p className="text-eyebrow text-eyebrow-accent">Sutura analytics</p>
            <h1 className="text-display mt-2 text-4xl text-text-ink">Subscription report</h1>
            <p className="mt-2 text-sm text-text-ink-muted">Live activity and revenue generated from approved subscriptions.</p>
          </div>

        </div>

        {loading && <p className="mt-8 text-sm text-text-ink-muted">Generating report...</p>}
        {error && <p className="mt-8 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}

        {!loading && report && !error && (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <section className="border border-border-line bg-bg-taupe p-6 text-white"><p className="text-eyebrow text-white/70">Total revenue</p><p className="text-figure mt-5 text-4xl">{money(report.total_revenue)}</p><p className="mt-2 text-sm text-white/70">Recorded subscription value</p></section>
              <section className="border border-border-line bg-bg-surface p-6"><p className="text-eyebrow">Active subscriptions</p><p className="text-figure mt-5 text-4xl text-text-ink">{report.active_subscriptions}</p><p className="mt-2 text-sm text-text-ink-muted">Currently active plans</p></section>
              <section className="border border-border-line bg-bg-surface p-6"><p className="text-eyebrow">Approval rate</p><p className="text-figure mt-5 text-4xl text-text-ink">{report.registrations.approval_rate}%</p><p className="mt-2 text-sm text-text-ink-muted">{report.registrations.approved} approved · {report.registrations.rejected} rejected</p></section>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <section className="border border-border-line bg-bg-surface p-6 sm:p-8">
                <div className="flex items-start justify-between"><div><p className="text-eyebrow text-eyebrow-accent">Six-month view</p><h2 className="text-display mt-2 text-2xl text-text-ink">Revenue activity</h2></div><div className="flex items-center gap-2 text-sm font-medium" style={{ color: revenueRising ? 'var(--text-sage)' : 'var(--text-danger)' }}>{revenueRising ? <ArrowUpRight size={19} aria-hidden="true" /> : <ArrowDownRight size={19} aria-hidden="true" />}{revenueRising ? 'Trending up' : 'Trending down'}</div></div>
                <div className="relative mt-8 h-64 border-b border-border-line">
                  <svg className="pointer-events-none absolute inset-0 h-[calc(100%-2rem)] w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline points={revenuePoints} fill="none" stroke="var(--bg-taupe)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                    {report.monthly_revenue.map((month, index, months) => {
                      const x = months.length === 1 ? 50 : 8 + (index / (months.length - 1)) * 84;
                      const y = 88 - (month.revenue / maxRevenue) * 76;
                      return <circle key={`${month.label}-point`} cx={x} cy={y} r="2" fill="var(--bg-taupe)" stroke="var(--bg-surface)" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
                    })}
                  </svg>
                  <div className="relative flex h-full items-end gap-2 sm:gap-4">
                  {report.monthly_revenue.map((month) => (
                    <div key={month.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-[11px] text-text-ink-muted">{month.revenue ? money(month.revenue) : '₱0'}</span>
                      <div className="w-full max-w-12 bg-bg-sunken transition-all" style={{ height: `${Math.max((month.revenue / maxRevenue) * 78, month.revenue ? 8 : 2)}%` }} title={`${month.label}: ${money(month.revenue)}`}><div className="h-full w-1/2 bg-bg-taupe" /></div>
                      <span className="truncate text-[11px] text-text-ink-faint">{month.label}</span>
                    </div>
                  ))}
                  </div>
                </div>
              </section>

              <section className="border border-border-line bg-bg-surface p-6 sm:p-8">
                <p className="text-eyebrow text-eyebrow-accent">Registration funnel</p>
                <h2 className="text-display mt-2 text-2xl text-text-ink">Approval activity</h2>
                <div className="mt-6 grid grid-cols-3 divide-x divide-border-line border-y border-border-line py-4 text-center">
                  <div><p className="text-figure text-2xl text-text-ink">{report.registrations.total}</p><p className="mt-1 text-xs text-text-ink-muted">Total</p></div>
                  <div><p className="text-figure text-2xl text-text-sage">{report.registrations.approved}</p><p className="mt-1 text-xs text-text-ink-muted">Approved</p></div>
                  <div><p className="text-figure text-2xl text-text-danger">{report.registrations.pending}</p><p className="mt-1 text-xs text-text-ink-muted">Pending</p></div>
                </div>
                <div className="mt-7 space-y-4">
                  {report.registrations.trend.map((month) => (
                    <div key={month.label}>
                      <div className="flex justify-between gap-3 text-xs"><span className="text-text-ink-muted">{month.label}</span><span className="font-medium text-text-ink">{month.approval_rate}%</span></div>
                      <div className="mt-2 h-2 bg-bg-sunken"><div className="h-full bg-text-sage" style={{ width: `${month.approval_rate}%` }} /></div>
                      <p className="mt-1 text-[11px] text-text-ink-faint">{month.approved} approved · {month.rejected} rejected</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-border-line bg-bg-surface p-6 sm:p-8">
                <p className="text-eyebrow text-eyebrow-accent">Mix</p><h2 className="text-display mt-2 text-2xl text-text-ink">Revenue by plan</h2>
                <div className="mt-8 space-y-6">
                  {report.by_plan.map((item) => (
                    <div key={item.plan}><div className="flex justify-between gap-3 text-sm"><span className="text-text-ink-body">{item.plan}</span><span className="font-medium text-text-ink">{money(item.revenue)}</span></div><div className="mt-2 h-2 bg-bg-sunken"><div className="h-full bg-bg-taupe" style={{ width: `${(item.revenue / maxPlanRevenue) * 100}%` }} /></div><p className="mt-1 text-xs text-text-ink-faint">{item.subscriptions} subscription{item.subscriptions === 1 ? '' : 's'}</p></div>
                  ))}
                  {!report.by_plan.length && <p className="text-sm text-text-ink-muted">No subscription activity yet.</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

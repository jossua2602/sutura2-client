'use client';

import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';

interface MonthReport { label: string; subscriptions: number; revenue: number; }
interface ShopDetails { shop_name: string; owner_name: string; email: string; billing_cycle: string; }
interface PlanReport { plan: string; subscriptions: number; revenue: number; shops: ShopDetails[]; }
interface RegistrationTrend { label: string; approved: number; rejected: number; approval_rate: number; }
interface RegistrationReport { total: number; approved: number; rejected: number; pending: number; approval_rate: number; trend: RegistrationTrend[]; }
interface Report { active_subscriptions: number; total_revenue: number; monthly_revenue: MonthReport[]; by_plan: PlanReport[]; registrations: RegistrationReport; generated_at: string; }

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const money = (v: number) => `₱${v.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <Card className={`p-5 ${accent ? 'border-bg-taupe/20 bg-bg-taupe text-white' : ''}`}>
      <p className={`text-eyebrow ${accent ? 'text-white/60' : ''}`}>{label}</p>
      <p className={`text-figure mt-4 text-4xl leading-tight ${accent ? '' : 'text-text-ink'}`}>{value}</p>
      {sub && <p className={`mt-1.5 text-xs ${accent ? 'text-white/60' : 'text-text-ink-muted'}`}>{sub}</p>}
    </Card>
  );
}

export function SubscriptionReportView() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanReport | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }

    async function loadReport() {
      try {
        const res = await fetch(`${apiUrl}/admin/subscription-report`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return; }
        if (!res.ok) throw new Error('Could not load subscription report.');
        setReport(await res.json()); setError('');
      } catch (err) { setError(err instanceof Error ? err.message : 'Could not load report.'); }
      finally { setLoading(false); }
    }

    loadReport();
    const t = window.setInterval(loadReport, 3000);
    return () => window.clearInterval(t);
  }, [router]);

  const maxRevenue = Math.max(...(report?.monthly_revenue.map((m) => m.revenue) ?? [1]), 1);
  const maxPlanRevenue = Math.max(...(report?.by_plan.map((p) => p.revenue) ?? [1]), 1);
  const firstRevenue = report?.monthly_revenue[0]?.revenue ?? 0;
  const latestRevenue = report?.monthly_revenue.at(-1)?.revenue ?? 0;
  const revenueRising = latestRevenue >= firstRevenue;

  const chartPoints = report?.monthly_revenue.map((m, i, arr) => {
    const x = arr.length === 1 ? 50 : 5 + (i / (arr.length - 1)) * 90;
    const y = 90 - (m.revenue / maxRevenue) * 78;
    return `${x},${y}`;
  }).join(' ') ?? '';

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura analytics</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Subscription report</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Live revenue and registration activity.</p>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
          <div className="skeleton h-64" />
        </div>
      )}

      {error && <div className="border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}

      {!loading && report && !error && (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total revenue" value={money(report.total_revenue)} sub="Recorded subscription value" accent />
            <StatCard label="Active subscriptions" value={report.active_subscriptions} sub="Currently active plans" />
            <StatCard label="Approval rate" value={`${report.registrations.approval_rate}%`} sub={`${report.registrations.approved} approved · ${report.registrations.rejected} rejected`} />
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            {/* Revenue chart */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-eyebrow text-eyebrow-accent">Six-month view</p>
                  <h2 className="text-display mt-1.5 text-2xl text-text-ink">Revenue activity</h2>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: revenueRising ? 'var(--text-sage)' : 'var(--text-danger)' }}>
                  {revenueRising ? <ArrowUpRight size={18} aria-hidden="true" /> : <ArrowDownRight size={18} aria-hidden="true" />}
                  {revenueRising ? 'Trending up' : 'Trending down'}
                </div>
              </div>

              <div className="relative mt-8 h-56">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pb-8">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border-t border-border-line" />
                  ))}
                </div>

                {/* SVG line chart */}
                <svg className="absolute inset-0 h-[calc(100%-2rem)] w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {/* Fill under line */}
                  <defs>
                    <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--bg-taupe)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--bg-taupe)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {report.monthly_revenue.length > 1 && (
                    <polygon
                      points={`${chartPoints} ${report.monthly_revenue.length === 1 ? '50,90' : `${5 + ((report.monthly_revenue.length - 1) / (report.monthly_revenue.length - 1)) * 90},90 5,90`}`}
                      fill="url(#revenue-grad)"
                    />
                  )}
                  <polyline points={chartPoints} fill="none" stroke="var(--bg-taupe)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  {report.monthly_revenue.map((m, i, arr) => {
                    const x = arr.length === 1 ? 50 : 5 + (i / (arr.length - 1)) * 90;
                    const y = 90 - (m.revenue / maxRevenue) * 78;
                    return <circle key={m.label} cx={x} cy={y} r="2.2" fill="var(--bg-taupe)" stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 flex w-full items-end justify-between px-[2%]">
                  {report.monthly_revenue.map((m) => (
                    <span key={m.label} className="text-[10px] text-text-ink-faint">{m.label}</span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Funnel */}
            <Card className="p-6 sm:p-8">
              <p className="text-eyebrow text-eyebrow-accent">Registration funnel</p>
              <h2 className="text-display mt-1.5 text-2xl text-text-ink">Approval activity</h2>
              <div className="mt-5 grid grid-cols-3 divide-x divide-border-line border-y border-border-line py-4 text-center">
                <div><p className="text-figure text-2xl text-text-ink">{report.registrations.total}</p><p className="mt-0.5 text-xs text-text-ink-muted">Total</p></div>
                <div><p className="text-figure text-2xl text-text-sage">{report.registrations.approved}</p><p className="mt-0.5 text-xs text-text-ink-muted">Approved</p></div>
                <div><p className="text-figure text-2xl text-text-danger">{report.registrations.pending}</p><p className="mt-0.5 text-xs text-text-ink-muted">Pending</p></div>
              </div>
              <div className="mt-6 space-y-5">
                {report.registrations.trend.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-ink-muted">{m.label}</span>
                      <span className="font-semibold text-text-ink">{m.approval_rate}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-sunken">
                      <div className="h-full rounded-full bg-text-sage transition-all" style={{ width: `${m.approval_rate}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-text-ink-faint">{m.approved} approved · {m.rejected} rejected</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* By plan */}
          <Card className="mt-6 p-6 sm:p-8">
            <p className="text-eyebrow text-eyebrow-accent">Revenue mix</p>
            <h2 className="text-display mt-1.5 text-2xl text-text-ink">Revenue by plan</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {report.by_plan.map((item) => (
                <Card 
                  key={item.plan} 
                  className="p-5 cursor-pointer transition-colors hover:border-bg-taupe/40"
                  onClick={() => setSelectedPlan(item)}
                  role="button"
                  tabIndex={0}
                >
                  <p className="text-sm font-semibold text-text-ink">{item.plan}</p>
                  <p className="text-figure mt-2 text-2xl text-text-ink">{money(item.revenue)}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-sunken">
                    <div className="h-full rounded-full bg-bg-taupe" style={{ width: `${(item.revenue / maxPlanRevenue) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-text-ink-faint">{item.subscriptions} subscription{item.subscriptions !== 1 ? 's' : ''}</p>
                </Card>
              ))}
              {!report.by_plan.length && (
                <div className="col-span-full mt-4 flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-sunken text-bg-taupe">
                    <BarChart3 size={32} aria-hidden="true" />
                  </div>
                  <p className="text-lg font-semibold text-text-ink">No subscription activity yet</p>
                  <p className="mt-2 text-sm text-text-ink-muted">Revenue data will populate once shops subscribe to plans.</p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <Modal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title={`${selectedPlan?.plan} Subscriptions`}
      >
        <div className="divide-y divide-border-line -mx-4 md:-mx-5 -mt-5">
          {selectedPlan?.shops?.length ? (
            selectedPlan.shops.map((shop, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4 md:px-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-bg-sunken">
                  <Store size={18} className="text-text-ink-muted" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-ink">{shop.shop_name}</p>
                    <span className="badge badge-muted capitalize">{shop.billing_cycle}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-text-ink-body">{shop.owner_name}</p>
                  <p className="text-xs text-text-ink-muted">{shop.email}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="px-6 py-10 text-center text-sm text-text-ink-muted">No active shops on this plan.</p>
          )}
        </div>
      </Modal>

    </div>
  );
}

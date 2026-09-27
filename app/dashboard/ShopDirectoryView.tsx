'use client';

import { useEffect, useState } from 'react';
import { Search, Store, SearchX, GitBranch, ShoppingBag, CreditCard, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card } from '../components/Card';
import { Modal } from '../components/Modal';

interface Shop {
  id: number;
  shop_name: string;
  address: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  account_status: 'active' | 'suspended';
  visibility: 'public' | 'hidden' | 'featured';
  owner_name: string | null;
  owner_email: string | null;
  plan_name: string | null;
  start_date: string | null;
  end_date: string | null;
  billing_cycle: string | null;
  subscription_amount: number;
  branch_count: number;
  order_revenue: number;
  created_at: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const money = (v: number) => `₱${Number(v).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

function formatDate(v: string | null) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(v));
}

function daysRemaining(end: string | null): string {
  if (!end) return '—';
  const diff = Math.ceil((new Date(end).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'Expired';
  if (diff === 0) return 'Expires today';
  return `${diff}d left`;
}

interface SubscriptionRecord {
  id: number;
  plan_name: string;
  billing_cycle: string;
  amount: number;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
}

interface ShopHistory {
  shop_name: string;
  subscriptions: SubscriptionRecord[];
  order_revenue: number;
  branch_count: number;
}

type ModalType = 'order' | 'subscription' | 'branches' | 'expiry' | null;

const verificationBadge: Record<Shop['verification_status'], string> = {
  verified: 'badge badge-sage',
  pending: 'badge badge-warning',
  rejected: 'badge badge-danger',
};

const visibilityBadge: Record<Shop['visibility'], string> = {
  public: 'badge badge-sage',
  hidden: 'badge badge-muted',
  featured: 'badge badge-taupe',
};

const statusBadge: Record<string, string> = {
  active: 'badge badge-sage',
  expired: 'badge badge-danger',
  cancelled: 'badge badge-muted',
};

function SkeletonRow() {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-44" />
          <div className="skeleton h-3 w-60" />
          <div className="skeleton h-3 w-32" />
        </div>
      </div>
    </Card>
  );
}

export function ShopDirectoryView() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState('');
  const [verification, setVerification] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [visibility, setVisibility] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [modalShop, setModalShop] = useState<Shop | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [history, setHistory] = useState<ShopHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [customFrom, setCustomFrom] = useState<{ month: number; year: number } | null>(null);
  const [customTo, setCustomTo] = useState<{ month: number; year: number } | null>(null);
  const [customFromYear, setCustomFromYear] = useState(new Date().getFullYear());
  const [customToYear, setCustomToYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const router = useRouter();

  async function loadShops() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (verification) params.set('verification_status', verification);
    if (accountStatus) params.set('account_status', accountStatus);
    if (visibility) params.set('visibility', visibility);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/shops?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return; }
      if (!res.ok) throw new Error('Could not load shop directory.');
      setShops(await res.json()); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load shop directory.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = window.setTimeout(loadShops, 250);
    return () => window.clearTimeout(t);
  }, [search, verification, accountStatus, visibility]);

  async function openHistory(shop: Shop, type: ModalType) {
    setModalShop(shop);
    setModalType(type);
    setHistory(null);
    setHistoryLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${apiUrl}/admin/shops/${shop.id}/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  }

  function closeModal() {
    setModalShop(null); setModalType(null); setHistory(null);
    setRevenuePeriod('monthly'); setPickerYear(new Date().getFullYear());
    setSelectedMonth(null); setCustomFrom(null); setCustomTo(null);
    setCustomFromYear(new Date().getFullYear()); setCustomToYear(new Date().getFullYear());
    setSelectedYear(null);
  }

  async function updateShop(shop: Shop, changes: Partial<Pick<Shop, 'account_status' | 'visibility'>>) {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    setSavingId(shop.id);
    try {
      const res = await fetch(`${apiUrl}/admin/shops/${shop.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update shop.');
      setShops((curr) => curr.map((item) => item.id === shop.id ? { ...item, ...data } : item));
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update shop.'); }
    finally { setSavingId(null); }
  }

  const selectClass = 'min-h-10 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none transition-colors focus:border-bg-taupe';

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Shop directory</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Govern verification, access status, visibility, and subscription context for every shop.</p>
      </div>

      {/* Filter bar */}
      <Card className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ink-muted" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shop or owner" className="min-h-10 w-full border border-border-line bg-bg-canvas pl-9 pr-3 text-sm outline-none focus:border-bg-taupe" />
        </label>
        <select value={verification} onChange={(e) => setVerification(e.target.value)} aria-label="Filter verification" className={selectClass}>
          <option value="">All verification</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={accountStatus} onChange={(e) => setAccountStatus(e.target.value)} aria-label="Filter account status" className={selectClass}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} aria-label="Filter visibility" className={selectClass}>
          <option value="">All visibility</option>
          <option value="public">Public</option>
          <option value="hidden">Hidden</option>
          <option value="featured">Featured</option>
        </select>
      </Card>

      {error && <div className="mt-4 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}

      {loading && (
        <div className="mt-4 space-y-3">
          <SkeletonRow /><SkeletonRow /><SkeletonRow />
        </div>
      )}
      {!loading && !error && shops.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-sunken text-bg-taupe">
            <SearchX size={32} aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-text-ink">No shops found</p>
          <p className="mt-2 text-sm text-text-ink-muted">Try adjusting the filters or search term above.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {shops.map((shop) => (
          <Card key={shop.id} className="p-5 transition-shadow hover:border-bg-taupe/40">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-bg-sunken">
                  <Store size={20} className="text-text-ink-muted" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-display text-xl text-text-ink">{shop.shop_name}</h2>
                    <span className={verificationBadge[shop.verification_status]}>{shop.verification_status}</span>
                    <span className={visibilityBadge[shop.visibility]}>{shop.visibility}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-text-ink-body">{shop.owner_name || '—'} <span className="text-text-ink-faint px-1">·</span> {shop.owner_email || '—'}</p>
                  <p className="mt-0.5 text-sm text-text-ink-muted">{shop.address || 'No address recorded'}</p>
                  <p className="mt-1.5 text-xs text-text-ink-faint">Added {formatDate(shop.created_at)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[34rem] xl:grid-cols-3">
                <div className="border border-border-line bg-bg-sunken p-3">
                  <p className="text-eyebrow">Subscription</p>
                  <p className="mt-1.5 text-sm font-medium text-text-ink-body">{shop.plan_name || 'No active plan'}</p>
                  <p className="mt-0.5 text-xs text-text-ink-muted">{formatDate(shop.start_date)} – {formatDate(shop.end_date)}</p>
                </div>
                <label className="text-xs font-medium text-text-ink-muted">
                  Account status
                  <select disabled={savingId === shop.id} value={shop.account_status} onChange={(e) => updateShop(shop, { account_status: e.target.value as Shop['account_status'] })} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body outline-none focus:border-bg-taupe transition-colors">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-text-ink-muted">
                  Visibility
                  <select disabled={savingId === shop.id} value={shop.visibility} onChange={(e) => updateShop(shop, { visibility: e.target.value as Shop['visibility'] })} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body outline-none focus:border-bg-taupe transition-colors">
                    <option value="public">Public</option>
                    <option value="hidden">Hidden</option>
                    <option value="featured">Featured</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Clickable performance metrics strip */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border-line pt-4 sm:grid-cols-4">
              <button type="button" onClick={() => openHistory(shop, 'order')} className="flex items-center gap-2.5 rounded bg-bg-sunken px-3 py-2.5 text-left transition-colors hover:bg-bg-taupe/10 hover:ring-1 hover:ring-bg-taupe/30">
                <ShoppingBag size={14} className="shrink-0 text-text-ink-muted" aria-hidden="true" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-ink-faint">Order revenue</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-ink">{money(shop.order_revenue)}</p>
                </div>
              </button>
              <button type="button" onClick={() => openHistory(shop, 'subscription')} className="flex items-center gap-2.5 rounded bg-bg-sunken px-3 py-2.5 text-left transition-colors hover:bg-bg-taupe/10 hover:ring-1 hover:ring-bg-taupe/30">
                <CreditCard size={14} className="shrink-0 text-text-ink-muted" aria-hidden="true" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-ink-faint">Subscription value</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-ink">{money(shop.subscription_amount)}</p>
                </div>
              </button>
              <button type="button" onClick={() => openHistory(shop, 'branches')} className="flex items-center gap-2.5 rounded bg-bg-sunken px-3 py-2.5 text-left transition-colors hover:bg-bg-taupe/10 hover:ring-1 hover:ring-bg-taupe/30">
                <GitBranch size={14} className="shrink-0 text-text-ink-muted" aria-hidden="true" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-ink-faint">Branches</p>
                  <p className="mt-0.5 text-sm font-semibold text-text-ink">{shop.branch_count}</p>
                </div>
              </button>
              <button type="button" onClick={() => openHistory(shop, 'expiry')} className="flex items-center gap-2.5 rounded bg-bg-sunken px-3 py-2.5 text-left transition-colors hover:bg-bg-taupe/10 hover:ring-1 hover:ring-bg-taupe/30">
                <Clock size={14} className="shrink-0 text-text-ink-muted" aria-hidden="true" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-ink-faint">Plan expiry</p>
                  <p className={`mt-0.5 text-sm font-semibold ${
                    daysRemaining(shop.end_date) === 'Expired' || daysRemaining(shop.end_date) === 'Expires today'
                      ? 'text-text-danger' : 'text-text-ink'
                  }`}>{daysRemaining(shop.end_date)}</p>
                </div>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Track history modal */}
      <Modal
        isOpen={!!modalType}
        onClose={closeModal}
        title={
          modalType === 'order'        ? `Order Revenue — ${modalShop?.shop_name}` :
          modalType === 'subscription' ? `Subscription History — ${modalShop?.shop_name}` :
          modalType === 'branches'     ? `Branch History — ${modalShop?.shop_name}` :
          `Plan Expiry History — ${modalShop?.shop_name}`
        }
      >
        {historyLoading ? (
          <div className="space-y-3 py-2">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-16 w-full" />
          </div>
        ) : (
          <>
            {/* Order revenue — interactive date picker */}
            {modalType === 'order' && (() => {
              const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

              const pickerLabel = (p: typeof revenuePeriod) =>
                p === 'monthly' ? 'Monthly' : p === 'annual' ? 'Annual' : 'Custom Range';

              const selectedLabel = () => {
                if (revenuePeriod === 'monthly' && selectedMonth !== null)
                  return `${MONTHS_FULL[selectedMonth]} ${pickerYear}`;
                if (revenuePeriod === 'annual' && selectedYear !== null)
                  return `Year ${selectedYear}`;
                if (revenuePeriod === 'custom' && customFrom && customTo)
                  return `${MONTHS[customFrom.month]} ${customFrom.year} – ${MONTHS[customTo.month]} ${customTo.year}`;
                return null;
              };

              const monthBtn = (
                isFrom: boolean,
                idx: number,
                activeYear: number,
                selected: { month: number; year: number } | null,
                setSelected: (v: { month: number; year: number }) => void
              ) => {
                const isActive = selected?.month === idx && selected?.year === activeYear;
                return (
                  <button key={idx} type="button"
                    onClick={() => setSelected({ month: idx, year: activeYear })}
                    className={`rounded py-1.5 text-xs font-medium transition-colors ${
                      isActive ? 'bg-bg-taupe text-white' : 'bg-bg-sunken text-text-ink-body hover:bg-bg-taupe/20'
                    }`}>
                    {MONTHS[idx]}
                  </button>
                );
              };

              return (
                <div>
                  {/* Period mode tabs */}
                  <div className="-mx-4 mb-5 flex border-b border-border-line md:-mx-5">
                    {(['monthly', 'annual', 'custom'] as const).map((p) => (
                      <button key={p} type="button"
                        onClick={() => {
                          setRevenuePeriod(p);
                          setSelectedMonth(null); setCustomFrom(null); setCustomTo(null); setSelectedYear(null);
                        }}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                          revenuePeriod === p ? 'border-b-2 border-bg-taupe text-text-ink' : 'text-text-ink-muted hover:text-text-ink'
                        }`}>
                        {pickerLabel(p)}
                      </button>
                    ))}
                  </div>

                  {/* Monthly — year nav + 12-month grid */}
                  {revenuePeriod === 'monthly' && (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <button type="button" onClick={() => setPickerYear((y) => y - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink">‹</button>
                        <span className="text-sm font-semibold text-text-ink">{pickerYear}</span>
                        <button type="button" onClick={() => setPickerYear((y) => y + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink">›</button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {MONTHS.map((m, i) => (
                          <button key={m} type="button"
                            onClick={() => setSelectedMonth(i)}
                            className={`rounded py-2 text-sm font-medium transition-colors ${
                              selectedMonth === i ? 'bg-bg-taupe text-white' : 'bg-bg-sunken text-text-ink-body hover:bg-bg-taupe/20'
                            }`}>{m}</button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Custom Range — From / To month pickers */}
                  {revenuePeriod === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* From */}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">From</p>
                        <div className="mb-2 flex items-center justify-between">
                          <button type="button" onClick={() => setCustomFromYear((y) => y - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink text-sm">‹</button>
                          <span className="text-xs font-semibold text-text-ink">{customFromYear}</span>
                          <button type="button" onClick={() => setCustomFromYear((y) => y + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink text-sm">›</button>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {MONTHS.map((_, i) => monthBtn(true, i, customFromYear, customFrom, setCustomFrom))}
                        </div>
                      </div>
                      {/* To */}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">To</p>
                        <div className="mb-2 flex items-center justify-between">
                          <button type="button" onClick={() => setCustomToYear((y) => y - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink text-sm">‹</button>
                          <span className="text-xs font-semibold text-text-ink">{customToYear}</span>
                          <button type="button" onClick={() => setCustomToYear((y) => y + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink text-sm">›</button>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {MONTHS.map((_, i) => monthBtn(false, i, customToYear, customTo, setCustomTo))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Annual — year grid */}
                  {revenuePeriod === 'annual' && (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <button type="button" onClick={() => setPickerYear((y) => y - 3)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink">‹</button>
                        <span className="text-xs text-text-ink-muted">Select a year</span>
                        <button type="button" onClick={() => setPickerYear((y) => y + 3)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border-line text-text-ink-muted hover:text-text-ink">›</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[-2,-1,0,1,2,3].map((offset) => {
                          const y = pickerYear + offset - 1;
                          return (
                            <button key={y} type="button"
                              onClick={() => setSelectedYear(y)}
                              className={`rounded py-3 text-sm font-medium transition-colors ${
                                selectedYear === y ? 'bg-bg-taupe text-white' : 'bg-bg-sunken text-text-ink-body hover:bg-bg-taupe/20'
                              }`}>{y}</button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Revenue result */}
                  {selectedLabel() && (
                    <div className="mt-5 flex flex-col items-center justify-center rounded border border-border-line bg-bg-sunken py-7 text-center">
                      <p className="text-xs uppercase tracking-wide text-text-ink-faint">{selectedLabel()}</p>
                      <p className="mt-2 text-4xl font-semibold text-text-ink">₱0.00</p>
                      <p className="mt-1.5 text-xs text-text-ink-muted">No order revenue for this period.</p>
                      <p className="mt-0.5 text-[11px] text-text-ink-faint">Available after shop-side system integration.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Subscription history */}
            {(modalType === 'subscription' || modalType === 'expiry') && (
              <div className="-mx-4 md:-mx-5">
                {history?.subscriptions?.length ? (
                  <div className="divide-y divide-border-line">
                    {history.subscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-start gap-4 px-4 py-4 md:px-5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-bg-sunken">
                          <Calendar size={16} className="text-text-ink-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-text-ink">{sub.plan_name}</p>
                            <span className={statusBadge[sub.status] ?? 'badge badge-muted'}>{sub.status}</span>
                            <span className="badge badge-muted capitalize">{sub.billing_cycle}</span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-text-ink-body">{money(sub.amount)}</p>
                          <p className="mt-0.5 text-xs text-text-ink-muted">{formatDate(sub.start_date)} – {formatDate(sub.end_date)}</p>
                        </div>
                        {modalType === 'expiry' && (
                          <p className={`shrink-0 text-xs font-semibold ${
                            daysRemaining(sub.end_date) === 'Expired' || daysRemaining(sub.end_date) === 'Expires today'
                              ? 'text-text-danger' : 'text-text-sage'
                          }`}>{daysRemaining(sub.end_date)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-6 py-12 text-center text-sm text-text-ink-muted">No subscription records found.</p>
                )}
              </div>
            )}

            {/* Branches — empty state */}
            {modalType === 'branches' && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-sunken">
                  <GitBranch size={26} className="text-text-ink-muted" />
                </div>
                <p className="text-3xl font-semibold text-text-ink">0</p>
                <p className="mt-2 text-sm text-text-ink-muted">No branch records available.</p>
                <p className="mt-1 text-xs text-text-ink-faint">Branch data will be available after integration with the shop-side system.</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Search, Store, SearchX } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card } from '../components/Card';

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
  created_at: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function formatDate(v: string | null) {
  if (!v) return '—';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(v));
}

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
          </Card>
        ))}
      </div>
    </div>
  );
}

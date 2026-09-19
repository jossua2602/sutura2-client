'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

function formatDate(value: string | null) {
  if (!value) return 'Not subscribed';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(value));
}

export default function ShopsPage() {
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
    if (!token) {
      router.push('/admin-login');
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (verification) params.set('verification_status', verification);
    if (accountStatus) params.set('account_status', accountStatus);
    if (visibility) params.set('visibility', visibility);

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/shops?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin-login');
        return;
      }
      if (!response.ok) throw new Error('Could not load shop directory.');
      setShops(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load shop directory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadShops, 250);
    return () => window.clearTimeout(timer);
  }, [search, verification, accountStatus, visibility]);

  async function updateShop(shop: Shop, changes: Partial<Pick<Shop, 'account_status' | 'visibility'>>) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    setSavingId(shop.id);
    try {
      const response = await fetch(`${apiUrl}/admin/shops/${shop.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update shop.');
      setShops((current) => current.map((item) => item.id === shop.id ? { ...item, ...data } : item));
      setError('');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update shop.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div><p className="text-eyebrow text-eyebrow-accent">Sutura administration</p><h1 className="text-display mt-2 text-4xl text-text-ink">Shop directory</h1><p className="mt-2 text-sm text-text-ink-muted">Govern verification, access status, visibility, and subscription context for every shop.</p></div>

        </div>

        <div className="mt-6 grid gap-3 border border-border-line bg-bg-surface p-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="relative"><span className="sr-only">Search shops</span><Search size={17} className="absolute left-3 top-3 text-text-ink-muted" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shop or owner" className="min-h-11 w-full border border-border-line bg-bg-canvas pl-10 pr-3 text-sm outline-none" /></label>
          <select value={verification} onChange={(event) => setVerification(event.target.value)} aria-label="Filter verification status" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body"><option value="">All verification states</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select>
          <select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value)} aria-label="Filter account status" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body"><option value="">All account statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)} aria-label="Filter visibility" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body"><option value="">All visibility</option><option value="public">Public</option><option value="hidden">Hidden</option><option value="featured">Featured</option></select>
        </div>

        {error && <p className="mt-4 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-sm text-text-ink-muted">Loading shops...</p>}
        {!loading && !error && shops.length === 0 && <p className="mt-6 text-sm text-text-ink-muted">No shops match the current filters.</p>}

        <div className="mt-6 space-y-3">
          {shops.map((shop) => (
            <article key={shop.id} className="border border-border-line bg-bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex items-start gap-3"><Store size={19} className="mt-1 text-bg-taupe" aria-hidden="true" /><div><h2 className="text-display text-2xl text-text-ink">{shop.shop_name}</h2><p className="mt-1 text-sm text-text-ink-body">{shop.owner_name || 'No owner name'} · {shop.owner_email || 'No owner email'}</p><p className="mt-2 text-sm text-text-ink-muted">{shop.address || 'No address recorded'}</p><p className="mt-2 text-xs text-text-ink-faint">Added {formatDate(shop.created_at)} · Verification: {shop.verification_status}</p></div></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[34rem] xl:grid-cols-3">
                  <div className="border border-border-line bg-bg-sunken p-3"><p className="text-eyebrow">Subscription</p><p className="mt-2 text-sm text-text-ink-body">{shop.plan_name || 'No active plan'}</p><p className="mt-1 text-xs text-text-ink-muted">{formatDate(shop.start_date)} – {formatDate(shop.end_date)}</p></div>
                  <label className="text-xs text-text-ink-muted">Account status<select disabled={savingId === shop.id} value={shop.account_status} onChange={(event) => updateShop(shop, { account_status: event.target.value as Shop['account_status'] })} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body"><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
                  <label className="text-xs text-text-ink-muted">Customer visibility<select disabled={savingId === shop.id} value={shop.visibility} onChange={(event) => updateShop(shop, { visibility: event.target.value as Shop['visibility'] })} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body"><option value="public">Public</option><option value="hidden">Hidden</option><option value="featured">Featured</option></select></label>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

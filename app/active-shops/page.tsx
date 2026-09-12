'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ActiveShop {
  subscription_id: number;
  shop_id: number;
  shop_name: string;
  owner_name: string;
  address: string | null;
  plan_name: string;
  price: string;
  start_date: string;
  end_date: string | null;
  visibility: 'public' | 'hidden';
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(value));
}

export default function ActiveShopsPage() {
  const [shops, setShops] = useState<ActiveShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    fetch(`${apiUrl}/admin/active-shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin-login');
          return [];
        }
        if (!response.ok) throw new Error('Failed to load active shops');
        return response.json();
      })
      .then(setShops)
      .catch(() => setError('Could not load active shops. Is php artisan serve running?'))
      .finally(() => setLoading(false));
  }, [router]);

  async function toggleVisibility(shop: ActiveShop) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    const visible = shop.visibility !== 'public';
    setSavingId(shop.subscription_id);
    try {
      const response = await fetch(`${apiUrl}/admin/shops/${shop.shop_id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ visible }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update payment grace.');
      setShops((current) => current.map((item) => item.subscription_id === shop.subscription_id
        ? { ...item, visibility: data.visible ? 'public' : 'hidden' }
        : item));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not update payment grace.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div>
            <p className="text-eyebrow text-eyebrow-accent">Sutura operations</p>
            <h1 className="text-display mt-2 text-4xl text-text-ink">Active shops</h1>
            <p className="mt-2 text-sm text-text-ink-muted">Review subscription dates and control which shops customers can find.</p>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className="inline-flex min-h-11 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-ink-body hover:bg-bg-sunken">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </button>
        </div>

        {loading && <p className="mt-8 text-sm text-text-ink-muted">Loading active shops...</p>}
        {error && <p className="mt-8 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {!loading && !error && shops.length === 0 && <p className="mt-8 text-sm text-text-ink-muted">No active shops yet.</p>}

        <div className="mt-8 space-y-4">
          {shops.map((shop) => (
            <article key={shop.subscription_id} className="border border-border-line bg-bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-text-sage" aria-hidden="true" />
                    <h2 className="text-display text-2xl text-text-ink">{shop.shop_name}</h2>
                  </div>
                  <p className="mt-2 text-sm text-text-ink-body">Owner: {shop.owner_name}</p>
                  {shop.address && <p className="mt-1 text-sm text-text-ink-muted">{shop.address}</p>}
                </div>
                <div className="border border-border-line-strong bg-bg-sunken px-4 py-2 text-right">
                  <p className="text-eyebrow text-eyebrow-accent">{shop.plan_name}</p>
                  <p className="text-figure mt-1 text-xl text-text-ink">₱{Number(shop.price).toLocaleString('en-PH')}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-y border-border-line py-4 sm:grid-cols-2">
                <div className="flex items-start gap-3"><CalendarDays size={18} className="mt-0.5 text-text-ink-muted" aria-hidden="true" /><div><p className="text-eyebrow">Started</p><p className="mt-1 text-sm text-text-ink-body">{formatDate(shop.start_date)}</p></div></div>
                <div><p className="text-eyebrow">Ends</p><p className="mt-1 text-sm text-text-ink-body">{formatDate(shop.end_date)}</p></div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text-ink">Visible in customer search</p>
                  <p className="mt-1 text-xs text-text-ink-muted">Show or hide this shop when customers search for a shop.</p>
                  <p className={`mt-1 text-xs ${shop.visibility === 'public' ? 'text-text-sage' : 'text-text-danger'}`}>
                    {shop.visibility === 'public' ? 'Customers can see this shop.' : 'Hidden from customer search.'}
                  </p>
                </div>
                <button type="button" role="switch" aria-checked={shop.visibility === 'public'} aria-label={`Toggle customer visibility for ${shop.shop_name}`} disabled={savingId === shop.subscription_id} onClick={() => toggleVisibility(shop)} className={`relative h-8 w-16 rounded-full border p-1 transition-colors disabled:opacity-50 ${shop.visibility === 'public' ? 'border-bg-taupe bg-bg-taupe' : 'border-border-line-strong bg-bg-sunken'}`}>
                  <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${shop.visibility === 'public' ? 'translate-x-8' : 'translate-x-0'}`} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

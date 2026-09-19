'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, CheckCircle, ShieldCheck, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card } from '../components/Card';

/* ── Toast ──────────────────────────────────────────────────────────────────── */
type ToastKind = 'success' | 'error';
interface Toast { id: number; kind: ToastKind; title: string; message?: string; exiting?: boolean; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  }, []);
  const showToast = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, kind, title, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);
  return { toasts, showToast, dismiss };
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const isSuccess = toast.kind === 'success';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 border bg-bg-surface px-4 py-3.5 ${
        toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
      } ${isSuccess ? 'border-l-4 border-border-line border-l-text-sage' : 'border-l-4 border-border-line border-l-text-danger'}`}
    >
      {isSuccess
        ? <CheckCircle size={18} className="mt-0.5 shrink-0 text-text-sage" aria-hidden="true" />
        : <XCircle    size={18} className="mt-0.5 shrink-0 text-text-danger" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-ink">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs leading-5 text-text-ink-muted">{toast.message}</p>}
      </div>
      <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="shrink-0 text-text-ink-faint transition-colors hover:text-text-ink">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

interface ActiveShop {
  subscription_id: number;
  shop_id: number;
  shop_name: string;
  owner_name: string;
  address: string | null;
  plan_name: string;
  account_status: string;
  price: string;
  start_date: string;
  end_date: string | null;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function formatDate(value: string | null) {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(value));
}

function SkeletonCard() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-3 w-56" />
        </div>
        <div className="skeleton h-14 w-32" />
      </div>
    </Card>
  );
}

export function ActiveShopsView() {
  const [shops, setShops] = useState<ActiveShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toasts, showToast, dismiss } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }

    fetch(`${apiUrl}/admin/active-shops`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return []; }
        if (!res.ok) throw new Error('Failed to load active shops');
        return res.json();
      })
      .then(setShops)
      .catch(() => setError('Could not load active shops. Is php artisan serve running?'))
      .finally(() => setLoading(false));
  }, [router]);



  const isExpiringSoon = (endDate: string | null) => {
    if (!endDate) return false;
    const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 14;
  };

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura operations</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Active shops</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Review subscription dates and control which shops customers can find.</p>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && <div className="border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}
      {!loading && !error && shops.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-sunken text-bg-taupe">
            <ShieldCheck size={32} aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-text-ink">No active shops yet</p>
          <p className="mt-2 text-sm text-text-ink-muted">Approved shops with active subscriptions will appear here.</p>
        </div>
      )}

      <div className="space-y-4">
        {shops.map((shop) => (
          <Card key={shop.subscription_id} className="p-5 sm:p-6 transition-shadow hover:border-bg-taupe/40">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldCheck size={18} className="text-text-sage shrink-0" aria-hidden="true" />
                  <h2 className="text-display text-2xl text-text-ink">{shop.shop_name}</h2>
                  {shop.account_status === 'suspended' && (
                    <span className="badge badge-danger">Suspended</span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-text-ink-body">Owner: {shop.owner_name}</p>
                {shop.address && <p className="mt-0.5 text-sm text-text-ink-muted">{shop.address}</p>}
              </div>
              <div className="border border-border-line bg-bg-sunken px-4 py-3 text-right">
                <p className="text-eyebrow text-eyebrow-accent">{shop.plan_name}</p>
                <p className="text-figure mt-1 text-2xl text-text-ink">₱{Number(shop.price).toLocaleString('en-PH')}</p>
                <p className="mt-0.5 text-xs text-text-ink-muted">per month</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 border-t border-border-line pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-text-ink-muted" aria-hidden="true" />
                <div>
                  <p className="text-eyebrow">Started</p>
                  <p className="mt-1 text-sm text-text-ink-body">{formatDate(shop.start_date)}</p>
                </div>
              </div>
              <div>
                <p className="text-eyebrow">Ends</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-text-ink-body">{formatDate(shop.end_date)}</p>
                  {isExpiringSoon(shop.end_date) && (
                    <span className="badge badge-warning">Expiring soon</span>
                  )}
                </div>
              </div>
            </div>


          </Card>
        ))}
      </div>

      {/* Toast portal */}
      {toasts.length > 0 && (
        <div aria-label="Notifications" className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
          {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
        </div>
      )}
    </div>
  );
}

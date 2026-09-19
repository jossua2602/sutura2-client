'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle, ChevronRight, Search, Tag, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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
      className={`flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 border bg-bg-surface px-4 py-3.5 ${toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
        } ${isSuccess ? 'border-l-4 border-border-line border-l-text-sage' : 'border-l-4 border-border-line border-l-text-danger'}`}
    >
      {isSuccess
        ? <CheckCircle size={18} className="mt-0.5 shrink-0 text-text-sage" aria-hidden="true" />
        : <XCircle size={18} className="mt-0.5 shrink-0 text-text-danger" aria-hidden="true" />}
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

/* ── Types ──────────────────────────────────────────────────────────────────── */
interface CategoryRequest {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  registration: { shop_name: string; email: string } | null;
  shop: { shop_name: string } | null;
}

interface ShopGroup {
  shopName: string;
  email: string;
  categories: CategoryRequest[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const statusBadge: Record<CategoryRequest['status'], string> = {
  pending: 'badge badge-warning',
  approved: 'badge badge-sage',
  rejected: 'badge badge-danger',
};

function getShopName(cat: CategoryRequest) {
  return cat.registration?.shop_name || cat.shop?.shop_name || 'Unknown shop';
}
function getEmail(cat: CategoryRequest) {
  return cat.registration?.email || '';
}

function Initials({ name }: { name: string }) {
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const hues = [23, 140, 200, 280, 340];
  const hue = hues[name.charCodeAt(0) % hues.length];
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: `hsl(${hue} 35% 52%)` }}
      aria-hidden="true"
    >
      {letters || '?'}
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-3 w-28" />
        </div>
      </div>
    </Card>
  );
}

export function ApparelCategoriesView() {
  const [categories, setCategories] = useState<CategoryRequest[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The shop group currently open in the drawer
  const [activeShop, setActiveShop] = useState<ShopGroup | null>(null);
  // Per-category rejection state inside drawer
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [bulkApproving, setBulkApproving] = useState(false);
  const router = useRouter();
  const { toasts, showToast, dismiss } = useToast();

  async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    const params = new URLSearchParams({ status });
    if (search) params.set('search', search);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/apparel-categories?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not load apparel categories.');
      const data: CategoryRequest[] = await res.json();
      setCategories(data);
      setError('');
      // Sync active drawer with fresh data
      if (activeShop) {
        const fresh = data.filter((c) => getShopName(c) === activeShop.shopName);
        setActiveShop(fresh.length ? { ...activeShop, categories: fresh } : null);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load categories.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = window.setTimeout(loadCategories, 250);
    return () => window.clearTimeout(t);
  }, [status, search]);

  // Group flat category list by shop name
  const shopGroups: ShopGroup[] = (() => {
    const map = new Map<string, ShopGroup>();
    for (const cat of categories) {
      const name = getShopName(cat);
      if (!map.has(name)) map.set(name, { shopName: name, email: getEmail(cat), categories: [] });
      map.get(name)!.categories.push(cat);
    }
    return [...map.values()];
  })();

  function openShop(group: ShopGroup) {
    setActiveShop(group);
    setReasonId(null);
    setReason('');
  }

  async function updateCategory(category: CategoryRequest, nextStatus: CategoryRequest['status'], rejectReason?: string) {
    if (nextStatus === 'rejected' && !rejectReason?.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/admin/apparel-categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, rejection_reason: nextStatus === 'rejected' ? rejectReason : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update category.');
      // Remove from global list
      setCategories((curr) => curr.filter((item) => item.id !== category.id));
      // Update drawer
      setActiveShop((prev) => {
        if (!prev) return prev;
        const updated = prev.categories.filter((c) => c.id !== category.id);
        return updated.length ? { ...prev, categories: updated } : null;
      });
      setReasonId(null); setReason('');
      if (nextStatus === 'approved') {
        showToast('success', 'Category approved', `"${category.name}" is now live.`);
      } else {
        showToast('error', 'Category rejected', `"${category.name}" has been rejected.`);
      }
    } catch (err) {
      showToast('error', 'Action failed', err instanceof Error ? err.message : 'Could not update category.');
    }
  }

  // Approve all pending categories for the active shop
  async function approveAllPending() {
    if (!activeShop) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const pending = activeShop.categories.filter((c) => c.status === 'pending');
    if (!pending.length) return;
    setBulkApproving(true);
    const results = await Promise.allSettled(
      pending.map((cat) =>
        fetch(`${apiUrl}/admin/apparel-categories/${cat.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'approved', rejection_reason: null }),
        }).then(async (res) => { if (!res.ok) throw new Error(); return cat.id; })
      )
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<number>).value);
    const failed = results.filter((r) => r.status === 'rejected').length;
    setCategories((curr) => curr.filter((c) => !succeeded.includes(c.id)));
    setActiveShop((prev) => {
      if (!prev) return prev;
      const remaining = prev.categories.filter((c) => !succeeded.includes(c.id));
      return remaining.length ? { ...prev, categories: remaining } : null;
    });
    setBulkApproving(false);
    if (succeeded.length) {
      showToast('success', `${succeeded.length} categor${succeeded.length === 1 ? 'y' : 'ies'} approved`, failed ? `${failed} failed â€” try again.` : undefined);
    } else {
      showToast('error', 'Bulk approval failed', 'None of the categories could be approved.');
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Apparel validation</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Select a shop to review and approve its specializations.</p>
      </div>

      {/* Filter bar */}
      <Card className="flex flex-wrap gap-2 p-3">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ink-muted" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shop or category" className="min-h-10 w-full border border-border-line bg-bg-canvas pl-9 pr-3 text-sm outline-none focus:border-bg-taupe transition-colors" />
        </label>
        <div className="flex gap-1 rounded-sm border border-border-line bg-bg-canvas p-1">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={`min-h-8 px-3 text-xs font-semibold capitalize transition-colors ${status === s ? 'bg-bg-taupe text-white' : 'text-text-ink-muted hover:text-text-ink hover:bg-border-line'}`}>
              {s}
            </button>
          ))}
        </div>
      </Card>

      {error && <div className="mt-4 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}

      {loading && (
        <div className="mt-4 space-y-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {!loading && shopGroups.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <Tag size={30} className="mb-3 text-text-ink-faint" aria-hidden="true" />
          <p className="text-sm font-medium text-text-ink">No {status} categories</p>
          <p className="mt-1 text-sm text-text-ink-muted">No apparel category requests match this view.</p>
        </div>
      )}

      {/* Shop list */}
      <div className="mt-6 space-y-3">
        {shopGroups.map((group) => {
          const pendingCount = group.categories.filter((c) => c.status === 'pending').length;
          return (
            <Card
              key={group.shopName}
              onClick={() => openShop(group)}
              className="group flex w-full items-center gap-4 p-5 text-left transition-all"
            >
              <Initials name={group.shopName} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-ink">{group.shopName}</p>
                {group.email && <p className="mt-0.5 text-sm text-text-ink-muted">{group.email}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {status === 'pending' && pendingCount > 0 && (
                    <span className="badge badge-warning">{pendingCount} pending</span>
                  )}
                  <span className="badge badge-muted">{group.categories.length} total</span>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-text-ink" aria-hidden="true" />
            </Card>
          );
        })}
      </div>

      {/* Categories modal */}
      <Modal
        isOpen={!!activeShop}
        onClose={() => setActiveShop(null)}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-3">
            <Initials name={activeShop?.shopName || ''} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-ink-muted">Apparel categories</p>
              <span className="text-display block text-xl leading-none text-text-ink">{activeShop?.shopName}</span>
            </div>
          </div>
        }
        footer={
          status === 'pending' && activeShop?.categories.some((c) => c.status === 'pending') ? (
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-medium text-text-ink-muted">
                {activeShop.categories.filter((c) => c.status === 'pending').length} pending
              </p>
              <Button
                variant="primary"
                onClick={approveAllPending}
                isLoading={bulkApproving}
                leftIcon={<Check size={16} />}
              >
                Approve All
              </Button>
            </div>
          ) : undefined
        }
      >
        {activeShop && (
          <div className="divide-y divide-border-line -mx-4 md:-mx-5 -mt-5">
            {activeShop.categories.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-text-ink-muted">No categories to show.</p>
            )}
            {activeShop.categories.map((cat) => (
              <Card key={cat.id} className="flex flex-col p-5 sm:p-6 transition-shadow hover:border-bg-taupe/40">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="shrink-0 text-bg-taupe" aria-hidden="true" />
                      <span className="font-semibold text-text-ink">{cat.name}</span>
                      <span className={statusBadge[cat.status]}>{cat.status}</span>
                    </div>
                    {cat.status === 'rejected' && cat.rejection_reason && (
                      <p className="mt-1.5 text-xs text-text-danger">Reason: {cat.rejection_reason}</p>
                    )}
                  </div>
                  {/* Only show actions for pending */}
                  {cat.status === 'pending' && reasonId !== cat.id && (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="primary" size="sm" onClick={() => updateCategory(cat, 'approved')}>
                        <Check size={12} className="mr-1" /> Approve
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => { setReasonId(cat.id); setReason(''); }}>
                        <X size={12} className="mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>

                {/* Rejection form */}
                {reasonId === cat.id && (
                  <div className="mt-4 space-y-2">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder="Reason for rejection…"
                      className="w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none focus:border-bg-taupe transition-colors"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        disabled={!reason.trim()}
                        onClick={() => updateCategory(cat, 'rejected', reason)}
                        className="flex-1"
                      >
                        Confirm rejection
                      </Button>
                      <Button variant="ghost" onClick={() => { setReasonId(null); setReason(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* Toast portal */}
      {toasts.length > 0 && (
        <div aria-label="Notifications" className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
          {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
        </div>
      )}
    </div>
  );
}

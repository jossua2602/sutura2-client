'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle, ExternalLink, MapPin, Search, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface BranchRequest {
  id: number;
  branch_name: string;
  address: string;
  latitude: string;
  longitude: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  shop: { shop_name: string } | null;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const statusBadge: Record<BranchRequest['status'], string> = {
  pending: 'badge badge-warning',
  approved: 'badge badge-sage',
  rejected: 'badge badge-danger',
};

function SkeletonCard() {
  return (
    <Card className="p-5 space-y-2">
      <div className="skeleton h-5 w-48" />
      <div className="skeleton h-3 w-64" />
      <div className="skeleton h-3 w-40" />
    </Card>
  );
}

export function BranchMapView() {
  const [branches, setBranches] = useState<BranchRequest[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toasts, showToast, dismiss } = useToast();

  async function loadBranches() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    const params = new URLSearchParams({ status });
    if (search) params.set('search', search);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/shop-branches?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not load branch locations.');
      setBranches(await res.json()); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load branch locations.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = window.setTimeout(loadBranches, 250);
    return () => window.clearTimeout(t);
  }, [status, search]);

  async function updateBranch(branch: BranchRequest, nextStatus: BranchRequest['status']) {
    if (nextStatus === 'rejected' && !reason.trim()) { setError('A rejection reason is required.'); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/admin/shop-branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, rejection_reason: nextStatus === 'rejected' ? reason : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update branch.');
      setBranches((curr) => curr.filter((b) => b.id !== branch.id));
      setReasonId(null); setReason(''); setError('');
      if (nextStatus === 'approved') {
        showToast('success', 'Branch approved', `"${branch.branch_name}" location is now verified.`);
      } else {
        showToast('error', 'Branch rejected', `"${branch.branch_name}" has been rejected.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not update branch.';
      setError(msg);
      showToast('error', 'Action failed', msg);
    }
  }

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Branch map validation</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Verify that submitted shop branches point to legitimate locations.</p>
      </div>

      <Card className="flex flex-wrap gap-2 p-3">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ink-muted" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branch or address" className="min-h-10 w-full border border-border-line bg-bg-canvas pl-9 pr-3 text-sm outline-none focus:border-bg-taupe transition-colors" />
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
        <div className="mt-4 space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      )}

      {!loading && branches.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <MapPin size={30} className="mb-3 text-text-ink-faint" aria-hidden="true" />
          <p className="text-sm font-medium text-text-ink">No {status} branches</p>
          <p className="mt-1 text-sm text-text-ink-muted">No branch locations match this view.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="p-5 transition-shadow hover:border-bg-taupe/40">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <MapPin size={17} className="shrink-0 text-bg-taupe" aria-hidden="true" />
                  <h2 className="text-display text-xl text-text-ink">{branch.branch_name}</h2>
                  <span className={statusBadge[branch.status]}>{branch.status}</span>
                </div>
                <p className="mt-2 text-sm text-text-ink-muted">
                  {branch.shop?.shop_name ?? 'Shop unavailable'} <span className="text-text-ink-faint px-1">·</span> {branch.address}
                </p>
                <p className="mt-1 font-mono text-xs text-text-ink-body">{branch.latitude}, {branch.longitude}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-bg-taupe hover:text-taupe-hover transition-colors"
                >
                  Open in Google Maps
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              </div>
              {status === 'pending' && reasonId !== branch.id && (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => updateBranch(branch, 'approved')}>
                    <Check size={13} className="mr-1.5" /> Approve
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => { setReasonId(branch.id); setReason(''); setError(''); }}>
                    <X size={13} className="mr-1.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
            {reasonId === branch.id && (
              <div className="mt-4 space-y-2 border-t border-border-line pt-4">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for rejection…" className="w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none focus:border-bg-taupe transition-colors" />
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => updateBranch(branch, 'rejected')}>
                    Confirm rejection
                  </Button>
                  <Button variant="ghost" onClick={() => { setReasonId(null); setReason(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {branch.status === 'rejected' && branch.rejection_reason && (
              <p className="mt-4 border-t border-border-line pt-3 text-sm text-text-danger">Reason: {branch.rejection_reason}</p>
            )}
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

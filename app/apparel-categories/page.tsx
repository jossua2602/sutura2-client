'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CategoryRequest {
  id: number;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  registration: { shop_name: string; email: string } | null;
  shop: { shop_name: string } | null;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export default function ApparelCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRequest[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  async function loadCategories() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }
    const params = new URLSearchParams({ status });
    if (search) params.set('search', search);
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/apparel-categories?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not load apparel categories.');
      setCategories(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load apparel categories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadCategories, 250);
    return () => window.clearTimeout(timer);
  }, [status, search]);

  async function updateCategory(category: CategoryRequest, nextStatus: CategoryRequest['status']) {
    if (nextStatus === 'rejected' && !reason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/admin/apparel-categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, rejection_reason: nextStatus === 'rejected' ? reason : null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update category.');
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setReasonId(null);
      setReason('');
      setError('');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update category.');
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6"><div><p className="text-eyebrow text-eyebrow-accent">Sutura administration</p><h1 className="text-display mt-2 text-4xl text-text-ink">Apparel validation</h1><p className="mt-2 text-sm text-text-ink-muted">Review shop specializations before they appear in the platform.</p></div><button type="button" onClick={() => router.push('/dashboard')} className="inline-flex min-h-11 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-ink-body hover:bg-bg-sunken"><ArrowLeft size={16} aria-hidden="true" />Back to dashboard</button></div>
        <div className="mt-6 flex flex-wrap gap-3 border border-border-line bg-bg-surface p-4"><label className="relative min-w-64 flex-1"><Search size={17} className="absolute left-3 top-3 text-text-ink-muted" aria-hidden="true" /><span className="sr-only">Search categories</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search category" className="min-h-11 w-full border border-border-line bg-bg-canvas pl-10 pr-3 text-sm outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter category status" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        {error && <p className="mt-4 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-sm text-text-ink-muted">Loading category requests...</p>}
        {!loading && categories.length === 0 && <p className="mt-6 text-sm text-text-ink-muted">No category requests match this view.</p>}
        <div className="mt-6 space-y-3">{categories.map((category) => <article key={category.id} className="border border-border-line bg-bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-display text-2xl text-text-ink">{category.name}</p><p className="mt-2 text-sm text-text-ink-muted">{category.registration?.shop_name || category.shop?.shop_name || 'Shop unavailable'} · {category.registration?.email || 'Existing shop category'}</p></div>{status === 'pending' && <div className="flex gap-2"><button type="button" onClick={() => updateCategory(category, 'approved')} className="inline-flex min-h-10 items-center gap-2 bg-text-sage px-3 text-sm text-white"><Check size={16} aria-hidden="true" />Approve</button><button type="button" onClick={() => { setReasonId(category.id); setReason(''); setError(''); }} className="inline-flex min-h-10 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-danger"><X size={16} aria-hidden="true" />Reject</button></div>}</div>{reasonId === category.id && <div className="mt-4 space-y-3"><label className="block text-sm text-text-ink-body">Rejection reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none" /></label><button type="button" onClick={() => updateCategory(category, 'rejected')} className="min-h-10 bg-text-danger px-3 text-sm text-white">Confirm rejection</button></div>}{category.status === 'rejected' && <p className="mt-3 text-sm text-text-danger">{category.rejection_reason}</p>}</article>)}</div>
      </div>
    </main>
  );
}

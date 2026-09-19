'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ExternalLink, MapPin, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BranchRequest {
  id: number;
  branch_name: string;
  address: string;
  latitude: string;
  longitude: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  registration: { shop_name: string; email: string } | null;
  shop: { shop_name: string } | null;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export default function BranchMapValidationPage() {
  const [branches, setBranches] = useState<BranchRequest[]>([]);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [reasonId, setReasonId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  async function loadBranches() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }
    const params = new URLSearchParams({ status });
    if (search) params.set('search', search);
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/shop-branches?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not load branch locations.');
      setBranches(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load branch locations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadBranches, 250);
    return () => window.clearTimeout(timer);
  }, [status, search]);

  async function updateBranch(branch: BranchRequest, nextStatus: BranchRequest['status']) {
    if (nextStatus === 'rejected' && !reason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/admin/shop-branches/${branch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, rejection_reason: nextStatus === 'rejected' ? reason : null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update branch.');
      setBranches((current) => current.filter((item) => item.id !== branch.id));
      setReasonId(null);
      setReason('');
      setError('');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update branch.');
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6"><div><p className="text-eyebrow text-eyebrow-accent">Sutura administration</p><h1 className="text-display mt-2 text-4xl text-text-ink">Branch map validation</h1><p className="mt-2 text-sm text-text-ink-muted">Verify that submitted shop branches point to legitimate locations.</p></div></div>
        <div className="mt-6 flex flex-wrap gap-3 border border-border-line bg-bg-surface p-4"><label className="relative min-w-64 flex-1"><Search size={17} className="absolute left-3 top-3 text-text-ink-muted" aria-hidden="true" /><span className="sr-only">Search branches</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search branch or address" className="min-h-11 w-full border border-border-line bg-bg-canvas pl-10 pr-3 text-sm outline-none" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter branch status" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        {error && <p className="mt-4 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-sm text-text-ink-muted">Loading branch locations...</p>}
        {!loading && branches.length === 0 && <p className="mt-6 text-sm text-text-ink-muted">No branch locations match this view.</p>}
        <div className="mt-6 space-y-3">{branches.map((branch) => <article key={branch.id} className="border border-border-line bg-bg-surface p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><MapPin size={18} className="text-bg-taupe" aria-hidden="true" /><p className="text-display text-2xl text-text-ink">{branch.branch_name}</p></div><p className="mt-2 text-sm text-text-ink-muted">{branch.registration?.shop_name || branch.shop?.shop_name || 'Shop unavailable'} · {branch.address}</p><p className="mt-2 text-sm text-text-ink-body">Coordinates: {branch.latitude}, {branch.longitude}</p><a href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-bg-taupe hover:text-taupe-hover">Open in Google Maps <ExternalLink size={15} aria-hidden="true" /></a></div>{status === 'pending' && <div className="flex gap-2"><button type="button" onClick={() => updateBranch(branch, 'approved')} className="inline-flex min-h-10 items-center gap-2 bg-text-sage px-3 text-sm text-white"><Check size={16} aria-hidden="true" />Approve</button><button type="button" onClick={() => { setReasonId(branch.id); setReason(''); setError(''); }} className="inline-flex min-h-10 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-danger"><X size={16} aria-hidden="true" />Reject</button></div>}</div>{reasonId === branch.id && <div className="mt-4 space-y-3"><label className="block text-sm text-text-ink-body">Rejection reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none" /></label><button type="button" onClick={() => updateBranch(branch, 'rejected')} className="min-h-10 bg-text-danger px-3 text-sm text-white">Confirm rejection</button></div>}{branch.status === 'rejected' && <p className="mt-3 text-sm text-text-danger">{branch.rejection_reason}</p>}</article>)}</div>
      </div>
    </main>
  );
}

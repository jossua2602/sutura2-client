'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuditLogEntry {
  id: number;
  action_type: string;
  description: string;
  created_at: string;
  user: { id: number; name: string; email?: string } | null;
}

interface UserOption {
  id: number;
  name: string;
}

interface PaginatedLogs {
  data: AuditLogEntry[];
  current_page: number;
  last_page: number;
  total: number;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [actionType, setActionType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  function queryString(exportLogs = false) {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (userId) params.set('user_id', userId);
    if (actionType) params.set('action_type', actionType);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (exportLogs) params.set('export', '1');
    return params.toString();
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    fetch(`${apiUrl}/admin/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : [])
      .then(setUsers)
      .catch(() => undefined);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    fetch(`${apiUrl}/admin/audit-logs?${queryString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin-login');
          return null;
        }
        if (!response.ok) throw new Error('Could not load audit logs.');
        return response.json();
      })
      .then((data: PaginatedLogs | null) => {
        if (data) {
          setLogs(data.data);
          setLastPage(data.last_page);
          setTotal(data.total);
        }
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load audit logs.'))
      .finally(() => setLoading(false));
  }, [router, page, search, userId, actionType, from, to]);

  async function exportLogs() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const response = await fetch(`${apiUrl}/admin/audit-logs?${queryString(true)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      setError('Could not export audit logs.');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sutura-audit-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearch('');
    setUserId('');
    setActionType('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div><p className="text-eyebrow text-eyebrow-accent">Sutura administration</p><h1 className="text-display mt-2 text-4xl text-text-ink">Audit management</h1><p className="mt-2 text-sm text-text-ink-muted">Review, filter, and export platform activity.</p></div>

        </div>

        <div className="mt-6 grid gap-3 border border-border-line bg-bg-surface p-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="relative"><span className="sr-only">Search audit activity</span><Search size={17} className="absolute left-3 top-3 text-text-ink-muted" aria-hidden="true" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search action or description" className="min-h-11 w-full border border-border-line bg-bg-canvas pl-10 pr-3 text-sm outline-none" /></label>
          <select value={userId} onChange={(event) => { setUserId(event.target.value); setPage(1); }} aria-label="Filter by user" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body"><option value="">All users</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
          <input value={actionType} onChange={(event) => { setActionType(event.target.value); setPage(1); }} placeholder="Action type, e.g. SHOP_APPROVED" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm outline-none" />
          <label className="text-xs text-text-ink-muted">From<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body" /></label>
          <label className="text-xs text-text-ink-muted">To<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body" /></label>
          <div className="flex items-end gap-2"><button type="button" onClick={resetFilters} className="min-h-10 border border-border-line-strong px-3 text-sm text-text-ink-body hover:bg-bg-sunken">Reset</button><button type="button" onClick={exportLogs} className="inline-flex min-h-10 items-center gap-2 bg-bg-taupe px-3 text-sm font-medium text-white hover:bg-taupe-hover"><Download size={16} aria-hidden="true" />Export CSV</button></div>
        </div>

        {error && <p className="mt-4 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        <div className="mt-5 flex items-center justify-between text-sm text-text-ink-muted"><span>{total} matching log{total === 1 ? '' : 's'}</span>{loading && <span>Loading...</span>}</div>

        {!loading && !error && logs.length === 0 && <p className="mt-6 text-sm text-text-ink-muted">No activity matches these filters.</p>}
        {!loading && logs.length > 0 && <div className="mt-3 overflow-x-auto rounded-lg border border-border-line bg-bg-surface"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="bg-bg-sunken"><th className="px-4 py-3 font-medium text-text-ink-muted">Date</th><th className="px-4 py-3 font-medium text-text-ink-muted">Who</th><th className="px-4 py-3 font-medium text-text-ink-muted">Action</th><th className="px-4 py-3 font-medium text-text-ink-muted">Description</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-t border-border-line"><td className="px-4 py-3 text-text-ink-muted">{new Date(log.created_at).toLocaleString()}</td><td className="px-4 py-3 text-text-ink">{log.user?.name ?? 'Unknown'}<span className="mt-1 block text-xs text-text-ink-faint">{log.user?.email}</span></td><td className="px-4 py-3 text-xs font-medium text-bg-taupe">{log.action_type}</td><td className="px-4 py-3 text-text-ink-body">{log.description}</td></tr>)}</tbody></table></div>}

        {lastPage > 1 && <div className="mt-5 flex items-center justify-between"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="min-h-10 border border-border-line-strong px-3 text-sm text-text-ink-body disabled:opacity-40">Previous</button><span className="text-sm text-text-ink-muted">Page {page} of {lastPage}</span><button type="button" disabled={page === lastPage} onClick={() => setPage((current) => current + 1)} className="min-h-10 border border-border-line-strong px-3 text-sm text-text-ink-body disabled:opacity-40">Next</button></div>}
      </div>
    </main>
  );
}
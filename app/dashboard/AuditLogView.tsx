'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface AuditLogEntry {
  id: number;
  action_type: string;
  description: string;
  created_at: string;
  user: { id: number; name: string; email?: string } | null;
}

interface UserOption { id: number; name: string; }

interface PaginatedLogs {
  data: AuditLogEntry[];
  current_page: number;
  last_page: number;
  total: number;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

function SkeletonRow() {
  return (
    <tr className="border-t border-border-line">
      <td className="px-4 py-3"><div className="skeleton h-3 w-24" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-28" /></td>
      <td className="px-4 py-3"><div className="skeleton h-5 w-32 rounded-sm" /></td>
      <td className="px-4 py-3"><div className="skeleton h-3 w-48" /></td>
    </tr>
  );
}

export function AuditLogView() {
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

  function queryString(exportMode = false) {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (userId) params.set('user_id', userId);
    if (actionType) params.set('action_type', actionType);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (exportMode) params.set('export', '1');
    return params.toString();
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    fetch(`${apiUrl}/admin/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setUsers)
      .catch(() => undefined);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    fetch(`${apiUrl}/admin/audit-logs?${queryString()}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return null; }
        if (!res.ok) throw new Error('Could not load audit logs.');
        return res.json();
      })
      .then((data: PaginatedLogs | null) => {
        if (data) { setLogs(data.data); setLastPage(data.last_page); setTotal(data.total); setError(''); }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load audit logs.'))
      .finally(() => setLoading(false));
  }, [router, page, search, userId, actionType, from, to]);

  async function exportLogs() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`${apiUrl}/admin/audit-logs?${queryString(true)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setError('Could not export audit logs.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sutura-audit-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearch(''); setUserId(''); setActionType(''); setFrom(''); setTo(''); setPage(1);
  }

  const inputClass = 'min-h-10 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-bg-taupe';

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Audit log</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Review, filter, and export platform activity.</p>
      </div>

      {/* Filters */}
      <Card className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="relative">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ink-muted" aria-hidden="true" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search action or description" className={`pl-9 pr-3 w-full transition-colors ${inputClass}`} />
        </label>
        <select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} aria-label="Filter by user" className={`w-full transition-colors ${inputClass}`}>
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input value={actionType} onChange={(e) => { setActionType(e.target.value); setPage(1); }} placeholder="Action type e.g. SHOP_APPROVED" className={`w-full transition-colors ${inputClass}`} />
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
          From
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={`mt-1 w-full transition-colors ${inputClass}`} />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
          To
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={`mt-1 w-full transition-colors ${inputClass}`} />
        </label>
        <div className="flex items-end gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={resetFilters}>
            Reset
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={exportLogs}>
            <Download size={15} className="mr-1.5" aria-hidden="true" /> Export CSV
          </Button>
        </div>
      </Card>

      {error && <div className="mt-4 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}

      <div className="mt-4 flex items-center justify-between text-sm text-text-ink-muted">
        <span>{total.toLocaleString()} matching log{total === 1 ? '' : 's'}</span>
        {loading && <span className="text-xs">Loading…</span>}
      </div>

      {!loading && !error && logs.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <FileText size={30} className="mb-3 text-text-ink-faint" aria-hidden="true" />
          <p className="text-sm font-medium text-text-ink">No activity found</p>
          <p className="mt-1 text-sm text-text-ink-muted">No audit logs match these filters.</p>
        </div>
      )}

      {(loading || logs.length > 0) && (
        <Card className="mt-2 overflow-x-auto p-0 border-x-0 sm:border-x">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-line bg-bg-sunken">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Who</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Action</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`border-t border-border-line transition-colors hover:bg-bg-sunken ${index % 2 === 1 ? 'bg-[#faf7f4]' : ''}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-text-ink-muted">
                      {new Date(log.created_at).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text-ink">{log.user?.name ?? 'System'}</p>
                      {log.user?.email && <p className="text-xs text-text-ink-faint">{log.user.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <code className="inline-flex items-center rounded-sm bg-bg-sunken px-2 py-0.5 font-mono text-xs font-semibold text-bg-taupe">
                        {log.action_type}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-ink-body">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {lastPage > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <Button type="button" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </Button>
          <span className="text-sm text-text-ink-muted">Page {page} of {lastPage}</span>
          <Button type="button" variant="ghost" disabled={page === lastPage} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}

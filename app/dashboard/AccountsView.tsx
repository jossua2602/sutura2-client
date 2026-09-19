'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';

interface Account {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'shop_owner' | 'staff' | 'customer';
  status: 'active' | 'suspended';
  created_at: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const roleLabels: Record<Account['role'], string> = {
  admin: 'Administrator',
  shop_owner: 'Shop owner',
  staff: 'Tailoring staff',
  customer: 'Customer',
};

const roleBadge: Record<Account['role'], string> = {
  admin: 'badge badge-taupe',
  shop_owner: 'badge badge-muted',
  staff: 'badge badge-muted',
  customer: 'badge badge-muted',
};

const statusBadge: Record<Account['status'], string> = {
  active: 'badge badge-sage',
  suspended: 'badge badge-danger',
};

const avatarHues = [23, 140, 200, 280, 340];

function Avatar({ name, role }: { name: string; role: Account['role'] }) {
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const hue = role === 'admin' ? 23 : avatarHues[name.charCodeAt(0) % avatarHues.length];
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: `hsl(${hue} 35% 50%)` }}
      aria-hidden="true"
    >
      {letters || '?'}
    </div>
  );
}

function formatDate(v: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(v));
}

function SkeletonRow() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton h-3 w-52" />
        </div>
      </div>
    </Card>
  );
}

export function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  async function loadAccounts() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/accounts?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return; }
      if (!res.ok) throw new Error('Could not load accounts.');
      setAccounts(await res.json()); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load accounts.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = window.setTimeout(loadAccounts, 250);
    return () => window.clearTimeout(t);
  }, [search, role, status]);

  async function updateAccount(account: Account, changes: Partial<Pick<Account, 'role' | 'status'>>) {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    setSavingId(account.id); setError('');
    try {
      const res = await fetch(`${apiUrl}/admin/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update account.');
      setAccounts((curr) => curr.map((a) => a.id === account.id ? data : a));
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update account.'); }
    finally { setSavingId(null); }
  }

  const selectClass = 'mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body outline-none focus:border-bg-taupe';

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Account management</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Manage platform users, roles, and account access.</p>
      </div>

      {/* Filter bar */}
      <Card className="flex flex-col gap-3 p-4 md:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ink-muted" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="min-h-10 w-full border border-border-line bg-bg-canvas pl-9 pr-3 text-sm outline-none focus:border-bg-taupe transition-colors" />
        </label>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role" className="min-h-10 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-bg-taupe transition-colors">
          <option value="">All roles</option>
          <option value="admin">Administrator</option>
          <option value="shop_owner">Shop owner</option>
          <option value="staff">Tailoring staff</option>
          <option value="customer">Customer</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="min-h-10 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-bg-taupe transition-colors">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </Card>

      {error && <div className="mt-4 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}

      {loading && (
        <div className="mt-4 space-y-3"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-text-ink">No accounts found</p>
          <p className="mt-1 text-sm text-text-ink-muted">Try adjusting the filters above.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {accounts.map((account) => (
          <Card key={account.id} className="p-5 transition-shadow hover:border-bg-taupe/40">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar name={account.name} role={account.role} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-display text-xl text-text-ink">{account.name}</h2>
                    {account.role === 'admin' && <ShieldCheck size={15} className="text-bg-taupe" aria-label="Admin" />}
                    <span className={roleBadge[account.role]}>{roleLabels[account.role]}</span>
                    <span className={statusBadge[account.status]}>{account.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-ink-muted">{account.email}</p>
                  <p className="mt-1 text-xs text-text-ink-faint">Joined {formatDate(account.created_at)}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[26rem]">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                  Role
                  <select disabled={savingId === account.id} value={account.role} onChange={(e) => updateAccount(account, { role: e.target.value as Account['role'] })} className={`${selectClass} transition-colors`}>
                    <option value="admin">Administrator</option>
                    <option value="shop_owner">Shop owner</option>
                    <option value="staff">Tailoring staff</option>
                    <option value="customer">Customer</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                  Status
                  <select disabled={savingId === account.id} value={account.status} onChange={(e) => updateAccount(account, { status: e.target.value as Account['status'] })} className={`${selectClass} transition-colors`}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
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

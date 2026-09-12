'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Search, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(new Date(value));
}

export default function AccountsPage() {
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
    if (!token) {
      router.push('/admin-login');
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/accounts?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin-login');
        return;
      }
      if (!response.ok) throw new Error('Could not load accounts.');
      setAccounts(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load accounts.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadAccounts, 250);
    return () => window.clearTimeout(timer);
  }, [search, role, status]);

  async function updateAccount(account: Account, changes: Partial<Pick<Account, 'role' | 'status'>>) {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    setSavingId(account.id);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/admin/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(changes),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update account.');
      setAccounts((current) => current.map((item) => item.id === account.id ? data : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update account.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div>
            <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
            <h1 className="text-display mt-2 text-4xl text-text-ink">Account management</h1>
            <p className="mt-2 text-sm text-text-ink-muted">Manage platform users, roles, and account access.</p>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className="inline-flex min-h-11 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-ink-body hover:bg-bg-sunken">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 border border-border-line bg-bg-surface p-4 md:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search accounts</span>
            <Search size={17} className="absolute left-3 top-3 text-text-ink-muted" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="min-h-11 w-full border border-border-line bg-bg-canvas pl-10 pr-3 text-sm outline-none focus:border-border-line-strong" />
          </label>
          <select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter by role" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-border-line-strong"><option value="">All roles</option><option value="admin">Administrator</option><option value="shop_owner">Shop owner</option><option value="staff">Tailoring staff</option><option value="customer">Customer</option></select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-border-line-strong"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
        </div>

        {error && <p className="mt-4 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-sm text-text-ink-muted">Loading accounts...</p>}
        {!loading && !error && accounts.length === 0 && <p className="mt-6 text-sm text-text-ink-muted">No accounts match the current filters.</p>}

        <div className="mt-6 space-y-3">
          {accounts.map((account) => (
            <article key={account.id} className="border border-border-line bg-bg-surface p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  {account.role === 'admin' && <ShieldCheck size={19} className="mt-1 text-bg-taupe" aria-label="Administrator" />}
                  <div><h2 className="text-display text-xl text-text-ink">{account.name}</h2><p className="mt-1 text-sm text-text-ink-muted">{account.email}</p><p className="mt-2 text-xs text-text-ink-faint">Joined {formatDate(account.created_at)}</p></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[34rem] lg:grid-cols-3">
                  <label className="text-xs text-text-ink-muted">Role<select disabled={savingId === account.id} value={account.role} onChange={(event) => updateAccount(account, { role: event.target.value as Account['role'] })} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body outline-none"><option value="admin">Administrator</option><option value="shop_owner">Shop owner</option><option value="staff">Tailoring staff</option><option value="customer">Customer</option></select></label>
                  <label className="text-xs text-text-ink-muted">Status<select disabled={savingId === account.id} value={account.status} onChange={(event) => updateAccount(account, { status: event.target.value as Account['status'] })} className="mt-1 min-h-10 w-full border border-border-line bg-bg-canvas px-2 text-sm text-text-ink-body outline-none"><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
                  <div className="flex items-end"><span className={`inline-flex min-h-10 items-center px-3 text-sm ${account.status === 'active' ? 'bg-[#e8eee6] text-text-sage' : 'bg-bg-sunken text-text-danger'}`}>{roleLabels[account.role]} · {account.status}</span></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

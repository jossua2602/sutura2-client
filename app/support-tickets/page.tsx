'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CircleAlert, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TicketUser {
  name: string;
  email: string;
}

interface Ticket {
  id: number;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  user: TicketUser;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const priorityColor: Record<Ticket['priority'], string> = {
  low: 'text-text-ink-muted',
  normal: 'text-text-ink-body',
  high: 'text-text-danger',
  urgent: 'bg-text-danger text-white',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [nextStatus, setNextStatus] = useState<Ticket['status']>('open');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function loadTickets() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/support-tickets?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin-login');
        return;
      }
      if (!response.ok) throw new Error('Could not load support tickets.');
      setTickets(await response.json());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load support tickets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, [status, priority]);

  function openTicket(ticket: Ticket) {
    setSelected(ticket);
    setNextStatus(ticket.status);
    setNotes(ticket.resolution_notes ?? '');
    setError('');
  }

  async function saveTicket() {
    if (!selected) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/admin/support-tickets/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, resolution_notes: notes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not update ticket.');
      setTickets((current) => current.map((ticket) => ticket.id === selected.id ? data : ticket));
      setSelected(data);
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update ticket.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div><p className="text-eyebrow text-eyebrow-accent">Sutura administration</p><h1 className="text-display mt-2 text-4xl text-text-ink">Support tickets</h1><p className="mt-2 text-sm text-text-ink-muted">Respond to platform issues and feature requests from shop teams.</p></div>
          <button type="button" onClick={() => router.push('/dashboard')} className="inline-flex min-h-11 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-ink-body hover:bg-bg-sunken"><ArrowLeft size={16} aria-hidden="true" />Back to dashboard</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border border-border-line bg-bg-surface p-4">
          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by ticket status" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none"><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Filter by ticket priority" className="min-h-11 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none"><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
        </div>

        {error && <p className="mt-4 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {loading && <p className="mt-6 text-sm text-text-ink-muted">Loading tickets...</p>}
        {!loading && tickets.length === 0 && <p className="mt-6 text-sm text-text-ink-muted">No support tickets match these filters.</p>}

        <div className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <button key={ticket.id} type="button" onClick={() => openTicket(ticket)} className="block w-full border border-border-line bg-bg-surface p-5 text-left transition-colors hover:bg-bg-sunken">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><MessageSquare size={17} className="text-bg-taupe" aria-hidden="true" /><h2 className="text-display text-xl text-text-ink">{ticket.subject}</h2></div><p className="mt-2 text-sm text-text-ink-muted">{ticket.user.name} · {ticket.user.email}</p></div><div className="flex items-center gap-2 text-xs uppercase tracking-wide"><span className={`px-2 py-1 ${priorityColor[ticket.priority]}`}>{ticket.priority}</span><span className="border border-border-line-strong px-2 py-1 text-text-ink-muted">{ticket.status.replace('_', ' ')}</span></div></div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-text-ink-body">{ticket.description}</p><p className="mt-3 text-xs text-text-ink-faint">Submitted {formatDate(ticket.created_at)}</p>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-title">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border-line bg-bg-surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4"><div><p className="text-eyebrow text-eyebrow-accent">Ticket #{selected.id}</p><h2 id="ticket-title" className="text-display mt-2 text-3xl text-text-ink">{selected.subject}</h2></div><button type="button" onClick={() => setSelected(null)} className="min-h-11 border border-border-line-strong px-3 text-sm text-text-ink-muted hover:bg-bg-sunken">Close</button></div>
            <div className="mt-6 border-y border-border-line py-5"><p className="text-sm text-text-ink-body">{selected.description}</p><p className="mt-4 text-xs text-text-ink-muted">From {selected.user.name} · {selected.user.email}</p></div>
            <div className="mt-6 space-y-5"><label className="block text-sm text-text-ink-body">Status<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as Ticket['status'])} className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 text-sm outline-none"><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><label className="block text-sm text-text-ink-body">Resolution notes<span className="mt-1 block text-xs text-text-ink-muted">Required for resolved or closed tickets.</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none" /></label></div>
            <div className="mt-6 flex justify-end"><button type="button" disabled={saving} onClick={saveTicket} className="min-h-11 bg-bg-taupe px-4 text-sm font-medium text-white hover:bg-taupe-hover disabled:opacity-60">{saving ? 'Saving...' : 'Save ticket'}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}

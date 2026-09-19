'use client';

import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface TicketUser { name: string; email: string; }
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

const priorityBadge: Record<Ticket['priority'], string> = {
  urgent: 'badge badge-danger',
  high: 'badge badge-warning',
  normal: 'badge badge-muted',
  low: 'badge badge-muted',
};

const statusBadge: Record<Ticket['status'], string> = {
  open: 'badge badge-warning',
  in_progress: 'badge badge-taupe',
  resolved: 'badge badge-sage',
  closed: 'badge badge-muted',
};

// Left border accent by priority
const priorityBorder: Record<Ticket['priority'], string> = {
  urgent: 'border-l-[3px] border-l-text-danger',
  high: 'border-l-[3px] border-l-[#c08040]',
  normal: 'border-l-[3px] border-l-border-line-strong',
  low: 'border-l-[3px] border-l-border-line',
};

function formatDate(v: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v));
}

function SkeletonCard() {
  return (
    <Card className="p-5 space-y-2 border-l-[3px] border-l-border-line">
      <div className="skeleton h-4 w-56" />
      <div className="skeleton h-3 w-40" />
      <div className="skeleton h-3 w-full" />
    </Card>
  );
}

export function SupportTicketsView() {
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
    if (!token) { router.push('/admin-login'); return; }
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/support-tickets?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return; }
      if (!res.ok) throw new Error('Could not load support tickets.');
      setTickets(await res.json()); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load tickets.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTickets(); }, [status, priority]);

  function openTicket(ticket: Ticket) {
    setSelected(ticket);
    setNextStatus(ticket.status);
    setNotes(ticket.resolution_notes ?? '');
    setError('');
  }

  async function saveTicket() {
    if (!selected) return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/support-tickets/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, resolution_notes: notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not update ticket.');
      setTickets((curr) => curr.map((t) => t.id === selected.id ? data : t));
      setSelected(data); setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update ticket.'); }
    finally { setSaving(false); }
  }

  const inputClass = 'mt-1.5 min-h-10 w-full border border-border-line bg-bg-canvas px-3 text-sm text-text-ink outline-none focus:border-bg-taupe';

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura administration</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Support tickets</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Respond to platform issues and feature requests from shop teams.</p>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap gap-3 p-4">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="min-h-10 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-bg-taupe transition-colors">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority" className="min-h-10 border border-border-line bg-bg-canvas px-3 text-sm text-text-ink-body outline-none focus:border-bg-taupe transition-colors">
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </Card>

      {error && <div className="mt-4 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}

      {loading && (
        <div className="mt-4 space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      )}

      {!loading && tickets.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare size={30} className="mb-3 text-text-ink-faint" aria-hidden="true" />
          <p className="text-sm font-medium text-text-ink">No tickets found</p>
          <p className="mt-1 text-sm text-text-ink-muted">No support tickets match these filters.</p>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {tickets.map((ticket) => (
          <Card
            key={ticket.id}
            role="button"
            onClick={() => openTicket(ticket)}
            className={`block w-full p-5 text-left transition-all hover:border-bg-taupe/40 ${priorityBorder[ticket.priority]}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="shrink-0 text-bg-taupe" aria-hidden="true" />
                  <h2 className="text-display text-xl text-text-ink">{ticket.subject}</h2>
                </div>
                <p className="mt-1.5 text-sm text-text-ink-muted">{ticket.user.name} <span className="text-text-ink-faint px-1">·</span> {ticket.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={priorityBadge[ticket.priority]}>{ticket.priority}</span>
                <span className={statusBadge[ticket.status]}>{ticket.status.replace('_', ' ')}</span>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 text-sm leading-6 text-text-ink-body">{ticket.description}</p>
            <p className="mt-2 text-xs text-text-ink-faint">Submitted {formatDate(ticket.created_at)}</p>
          </Card>
        ))}
      </div>

      {/* Ticket modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.subject || ''}>
        {selected && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={priorityBadge[selected.priority]}>{selected.priority}</span>
              <span className={statusBadge[selected.status]}>{selected.status.replace('_', ' ')}</span>
            </div>
            <div className="mb-5 border-y border-border-line py-5">
              <p className="text-sm leading-6 text-text-ink-body">{selected.description}</p>
              <p className="mt-3 text-xs text-text-ink-muted">From {selected.user.name} <span className="text-text-ink-faint px-1">·</span> {selected.user.email}</p>
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                Status
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as Ticket['status'])} className={`${inputClass} transition-colors`}>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                Resolution notes
                <span className="ml-1 font-normal normal-case text-text-ink-faint">Required for resolved or closed tickets</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="mt-1.5 w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none focus:border-bg-taupe transition-colors" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button type="button" variant="primary" isLoading={saving} onClick={saveTicket}>
                Save ticket
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

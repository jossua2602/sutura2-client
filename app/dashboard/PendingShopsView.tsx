'use client';

import { createPortal } from 'react-dom';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, X, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

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
      } ${
        isSuccess ? 'border-l-4 border-border-line border-l-text-sage' : 'border-l-4 border-border-line border-l-text-danger'
      }`}
    >
      {isSuccess
        ? <CheckCircle size={18} className="mt-0.5 shrink-0 text-text-sage" aria-hidden="true" />
        : <XCircle    size={18} className="mt-0.5 shrink-0 text-text-danger" aria-hidden="true" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-ink">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs leading-5 text-text-ink-muted">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-text-ink-faint transition-colors hover:text-text-ink"
      >
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

interface Shop {
  id: number;
  shop_name: string;
  address: string | null;
  verification_status: string;
}

interface Registration {
  id: number;
  shop_name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  contact_number: string;
  address: string;
  apparel_categories?: string[];
  subscription_plan: string;
  billing_cycle: string;
  subscription_price: string;
  landmark_image_url: string | null;
  proof_document_urls: string[];
  dti_registration_url?: string | null;
  tin_id_url?: string | null;
  brgy_clearance_url?: string | null;
  government_id_url?: string | null;
  government_id_type?: string;
  payment_method?: string | null;
  payment_receipt_url?: string | null;
  birthday?: string | null;
  created_at: string;
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const letters = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const hues = [23, 140, 200, 280, 340];
  const hue = hues[name.charCodeAt(0) % hues.length];
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
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
      <div className="flex items-start gap-3">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-3 w-32" />
          <div className="skeleton h-3 w-64" />
        </div>
      </div>
    </Card>
  );
}

export function PendingShopsView() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectingRegistrationId, setRejectingRegistrationId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [approvedCredentials, setApprovedCredentials] = useState<{ shopName: string; email: string; password: string } | null>(null);
  const router = useRouter();
  const { toasts, showToast, dismiss } = useToast();

  function getToken() {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return null; }
    return token;
  }

  function loadShops() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/shops/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return null; }
        if (!res.ok) throw new Error('Failed to load shops');
        return res.json();
      })
      .then((data) => {
        if (data) { setShops(data.shops ?? []); setRegistrations(data.registrations ?? []); }
      })
      .catch(() => setError('Could not load pending shops. Is php artisan serve running?'))
      .finally(() => setLoading(false));
  }

  useEffect(loadShops, []);

  async function handleApprove(shopId: number) {
    const token = getToken(); if (!token) return;
    setActionError('');
    const shop = shops.find((s) => s.id === shopId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/shops/${shopId}/approve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({}),
    }).catch(() => null);
    if (!res?.ok) {
      showToast('error', 'Approval failed', 'Could not approve that shop. Try again.');
      setActionError('Could not approve that shop. Try again.');
      return;
    }
    setShops((prev) => prev.filter((s) => s.id !== shopId));
    showToast('success', 'Shop approved', `${shop?.shop_name ?? 'Shop'} is now active on the platform.`);
  }

  async function handleReject(shopId: number) {
    if (!reason.trim()) { setActionError('A rejection reason is required.'); return; }
    const token = getToken(); if (!token) return;
    setActionError('');
    const shop = shops.find((s) => s.id === shopId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/shops/${shopId}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }),
    }).catch(() => null);
    if (!res?.ok) {
      showToast('error', 'Rejection failed', 'Could not reject that shop. Try again.');
      setActionError('Could not reject that shop. Try again.');
      return;
    }
    setShops((prev) => prev.filter((s) => s.id !== shopId));
    setRejectingId(null); setReason('');
    showToast('error', 'Shop rejected', `${shop?.shop_name ?? 'Shop'} has been rejected.`);
  }

  async function handleApproveRegistration(registrationId: number) {
    const token = getToken(); if (!token) return;
    setActionError('');
    const reg = registrations.find((r) => r.id === registrationId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    try {
      const res = await fetch(`${apiUrl}/admin/shop-registrations/${registrationId}/approve`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { throw new Error(data.message || `Approval failed (${res.status}).`); }
      
      setRegistrations((prev) => prev.filter((r) => r.id !== registrationId));
      if (selectedRegistration?.id === registrationId) {
        setSelectedRegistration(null);
      }
      
      showToast('success', 'Registration approved', `${reg?.shop_name ?? 'Registration'} is now active.`);
      
      if (data.temporary_password) {
        setApprovedCredentials({
          shopName: reg?.shop_name || 'Shop',
          email: reg?.email || '',
          password: data.temporary_password,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not approve that registration.';
      setActionError(msg);
      showToast('error', 'Approval failed', msg);
    }
  }

  async function handleRejectRegistration(registrationId: number) {
    if (!reason.trim()) { setActionError('A rejection reason is required.'); return; }
    const token = getToken(); if (!token) return;
    setActionError('');
    const reg = registrations.find((r) => r.id === registrationId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
    try {
      const res = await fetch(`${apiUrl}/admin/shop-registrations/${registrationId}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `Rejection failed (${res.status}).`); }
      setRegistrations((prev) => prev.filter((r) => r.id !== registrationId));
      setRejectingRegistrationId(null); setReason('');
      
      if (selectedRegistration?.id === registrationId) {
        setSelectedRegistration(null);
      }
      
      showToast('error', 'Registration rejected', `${reg?.shop_name ?? 'Registration'} has been rejected.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reject that registration.';
      setActionError(msg);
      showToast('error', 'Rejection failed', msg);
    }
  }

  const inputClass = 'w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm text-text-ink outline-none transition-all focus:border-bg-taupe focus:shadow-[0_0_0_3px_rgb(154_128_115/0.12)]';

  return (
    <div className="mx-auto max-w-5xl">
      {/* Section header */}
      <header className="mb-8">
        <p className="text-eyebrow text-eyebrow-accent mb-2">Sutura administration</p>
        <h1 className="text-display text-[2.5rem] leading-tight text-text-ink">Pending Shops</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Review and approve or reject shop registrations.</p>
      </header>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="border-l-2 border-text-danger bg-[#f5e8e5] p-4 text-sm text-text-danger mb-6">
          <p className="font-semibold">Connection Error</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {actionError && (
        <div className="border-l-2 border-text-danger bg-[#f5e8e5] p-4 text-sm text-text-danger mb-6">
          {actionError}
        </div>
      )}

      {!loading && !error && shops.length === 0 && registrations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-bg-sunken text-bg-taupe">
            <Inbox size={32} />
          </div>
          <p className="text-lg font-semibold text-text-ink">No pending registrations</p>
          <p className="mt-2 text-sm text-text-ink-muted">All caught up! New shop applications will appear here.</p>
        </div>
      )}

      {/* New registrations */}
      {registrations.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-eyebrow text-text-ink-muted">New Registrations</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {registrations.map((reg) => (
              <Card key={`reg-${reg.id}`} className="flex flex-col p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <Initials name={reg.shop_name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-text-ink truncate">{reg.shop_name}</p>
                      <span className="badge badge-taupe capitalize whitespace-nowrap">{reg.subscription_plan}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-ink-muted truncate">
                      {reg.first_name} {reg.middle_name ? `${reg.middle_name} ` : ''}{reg.last_name}
                    </p>
                    <p className="mt-0.5 text-xs text-text-ink-faint truncate">{reg.email}</p>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  {rejectingRegistrationId !== reg.id ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setSelectedRegistration(reg)}>
                        Review Details
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="danger" className="px-3" onClick={() => { setRejectingRegistrationId(reg.id); setReason(''); setActionError(''); }}>
                          <X size={18} />
                        </Button>
                        <Button variant="primary" className="flex-1" onClick={() => handleApproveRegistration(reg.id)}>
                          Approve
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 border-t border-border-line pt-4">
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for rejection…" className={inputClass} />
                      <div className="flex gap-2">
                        <Button variant="danger" className="flex-1" onClick={() => handleRejectRegistration(reg.id)}>Confirm Rejection</Button>
                        <Button variant="ghost" onClick={() => { setRejectingRegistrationId(null); setReason(''); }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Existing pending shops */}
      {shops.length > 0 && (
        <section>
          <h2 className="mb-4 text-eyebrow text-text-ink-muted">Existing Pending Shops</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {shops.map((shop) => (
              <Card key={shop.id} className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <Initials name={shop.shop_name} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-ink truncate">{shop.shop_name}</p>
                    {shop.address && <p className="mt-1 text-sm text-text-ink-muted truncate">{shop.address}</p>}
                  </div>
                </div>
                
                <div className="mt-6">
                  {rejectingId !== shop.id ? (
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1" onClick={() => handleApprove(shop.id)}>Approve</Button>
                      <Button variant="danger" onClick={() => { setRejectingId(shop.id); setReason(''); setActionError(''); }}>Reject</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for rejection…" className={inputClass} />
                      <div className="flex gap-2">
                        <Button variant="danger" className="flex-1" onClick={() => handleReject(shop.id)}>Confirm Rejection</Button>
                        <Button variant="ghost" onClick={() => { setRejectingId(null); setReason(''); }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Detail modal */}
      <Modal
        isOpen={!!selectedRegistration}
        onClose={() => setSelectedRegistration(null)}
        maxWidth="2xl"
        title={
          <div className="flex items-center gap-3">
            <Initials name={selectedRegistration?.shop_name || ''} size="sm" />
            <div>
              <span className="text-display block text-xl leading-none text-text-ink">{selectedRegistration?.shop_name}</span>
            </div>
          </div>
        }
        footer={
          <>
            {rejectingRegistrationId !== selectedRegistration?.id ? (
              <>
                <Button variant="danger" onClick={() => { setRejectingRegistrationId(selectedRegistration!.id); setReason(''); setActionError(''); }}>
                  Reject Shop
                </Button>
                <Button variant="primary" onClick={() => handleApproveRegistration(selectedRegistration!.id)}>
                  Approve Registration
                </Button>
              </>
            ) : (
              <div className="w-full space-y-3">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for rejection…" className={inputClass} />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={() => { setRejectingRegistrationId(null); setReason(''); }}>Cancel</Button>
                  <Button variant="danger" onClick={() => handleRejectRegistration(selectedRegistration!.id)}>Confirm Rejection</Button>
                </div>
              </div>
            )}
          </>
        }
      >
        {selectedRegistration && (
          <div className="divide-y divide-border-line -mx-4 md:-mx-5 -mt-5">

            {/* ── Section 1: Shop & Owner Info ─── */}
            <div className="px-4 py-5 md:px-5">
              <p className="mb-4 text-eyebrow text-bg-taupe">Shop &amp; Owner Information</p>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-text-ink-muted">Owner name</dt>
                  <dd className="mt-1 font-medium text-text-ink">
                    {selectedRegistration.first_name}{selectedRegistration.middle_name ? ` ${selectedRegistration.middle_name}` : ''} {selectedRegistration.last_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-ink-muted">Date of Birth</dt>
                  <dd className="mt-1 font-medium text-text-ink">{selectedRegistration.birthday ? new Date(selectedRegistration.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-ink-muted">Subscription</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <span className="badge badge-taupe capitalize">{selectedRegistration.subscription_plan}</span>
                    <span className="text-sm font-medium text-text-ink">₱{Number(selectedRegistration.subscription_price).toLocaleString('en-PH')} / {selectedRegistration.billing_cycle}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-text-ink-muted">Registration date</dt>
                  <dd className="mt-1 font-medium text-text-ink">{new Date(selectedRegistration.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-ink-muted">Business email</dt>
                  <dd className="mt-1 font-medium text-text-ink">{selectedRegistration.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-ink-muted">Contact number</dt>
                  <dd className="mt-1 font-medium text-text-ink">{selectedRegistration.contact_number}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-text-ink-muted">Shop Location</dt>
                  <dd className="mt-1 font-medium text-text-ink">{selectedRegistration.address}</dd>
                </div>
                {selectedRegistration.apparel_categories && selectedRegistration.apparel_categories.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-text-ink-muted">Apparel specializations</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {selectedRegistration.apparel_categories.map((cat) => (
                        <span key={cat} className="badge badge-muted">{cat}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* ── Section 2: Business Documents ─── */}
            <div className="px-4 py-5 md:px-5">
              <p className="mb-4 text-eyebrow text-bg-taupe">Business Documents</p>
              <div className="grid gap-5 sm:grid-cols-2">

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-ink">Landmark Image</p>
                  {selectedRegistration.landmark_image_url ? (
                    <button type="button" onClick={() => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.landmark_image_url!) ? setPreviewImage(selectedRegistration.landmark_image_url!) : window.open(selectedRegistration.landmark_image_url!, '_blank')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                      {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.landmark_image_url)
                        ? <img src={selectedRegistration.landmark_image_url} alt="Landmark" className="aspect-video w-full rounded border border-border-line object-cover transition-opacity hover:opacity-80 bg-bg-sunken" />
                        : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-border-line bg-bg-sunken text-center text-xs font-medium text-text-ink-muted transition-colors hover:bg-border-line"><span className="text-2xl">📄</span><span>View Document</span></div>}
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded border border-dashed border-border-line bg-bg-sunken text-xs text-text-ink-muted">Not provided</div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-ink">DTI Registration Certificate</p>
                  {selectedRegistration.dti_registration_url ? (
                    <button type="button" onClick={() => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.dti_registration_url!) ? setPreviewImage(selectedRegistration.dti_registration_url!) : window.open(selectedRegistration.dti_registration_url!, '_blank')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                      {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.dti_registration_url)
                        ? <img src={selectedRegistration.dti_registration_url} alt="DTI" className="aspect-video w-full rounded border border-border-line object-cover transition-opacity hover:opacity-80 bg-bg-sunken" />
                        : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-border-line bg-bg-sunken text-center text-xs font-medium text-text-ink-muted transition-colors hover:bg-border-line"><span className="text-2xl">📄</span><span>View PDF</span></div>}
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded border border-dashed border-border-line bg-bg-sunken text-xs text-text-ink-muted">Not provided</div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-ink">TIN ID / BIR Certificate (Form 2303)</p>
                  {selectedRegistration.tin_id_url ? (
                    <button type="button" onClick={() => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.tin_id_url!) ? setPreviewImage(selectedRegistration.tin_id_url!) : window.open(selectedRegistration.tin_id_url!, '_blank')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                      {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.tin_id_url)
                        ? <img src={selectedRegistration.tin_id_url} alt="TIN" className="aspect-video w-full rounded border border-border-line object-cover transition-opacity hover:opacity-80 bg-bg-sunken" />
                        : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-border-line bg-bg-sunken text-center text-xs font-medium text-text-ink-muted transition-colors hover:bg-border-line"><span className="text-2xl">📄</span><span>View PDF</span></div>}
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded border border-dashed border-border-line bg-bg-sunken text-xs text-text-ink-muted">Not provided</div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-ink">{selectedRegistration.government_id_type || 'Government ID'}</p>
                  {selectedRegistration.government_id_url ? (
                    <button type="button" onClick={() => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.government_id_url!) ? setPreviewImage(selectedRegistration.government_id_url!) : window.open(selectedRegistration.government_id_url!, '_blank')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                      {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.government_id_url)
                        ? <img src={selectedRegistration.government_id_url} alt="Gov ID" className="aspect-video w-full rounded border border-border-line object-cover transition-opacity hover:opacity-80 bg-bg-sunken" />
                        : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-border-line bg-bg-sunken text-center text-xs font-medium text-text-ink-muted transition-colors hover:bg-border-line"><span className="text-2xl">📄</span><span>View PDF</span></div>}
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded border border-dashed border-border-line bg-bg-sunken text-xs text-text-ink-muted">Not provided</div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-ink">Barangay Clearance</p>
                  {selectedRegistration.brgy_clearance_url ? (
                    <button type="button" onClick={() => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.brgy_clearance_url!) ? setPreviewImage(selectedRegistration.brgy_clearance_url!) : window.open(selectedRegistration.brgy_clearance_url!, '_blank')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                      {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(selectedRegistration.brgy_clearance_url)
                        ? <img src={selectedRegistration.brgy_clearance_url} alt="Barangay Clearance" className="aspect-video w-full rounded border border-border-line object-cover transition-opacity hover:opacity-80 bg-bg-sunken" />
                        : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-border-line bg-bg-sunken text-center text-xs font-medium text-text-ink-muted transition-colors hover:bg-border-line"><span className="text-2xl">📄</span><span>View PDF</span></div>}
                    </button>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded border border-dashed border-border-line bg-bg-sunken text-xs text-text-ink-muted">Not provided</div>
                  )}
                </div>

                {selectedRegistration.proof_document_urls.length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-xs font-semibold text-text-ink">Business Permit(s)</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      {selectedRegistration.proof_document_urls.map((url, i) => (
                        <button type="button" key={url} onClick={() => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? setPreviewImage(url) : window.open(url, '_blank')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                          {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
                            ? <img src={url} alt={`Permit ${i + 1}`} className="aspect-video w-full rounded border border-border-line object-cover transition-opacity hover:opacity-80 bg-bg-sunken" />
                            : <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-border-line bg-bg-sunken text-center text-xs font-medium text-text-ink-muted transition-colors hover:bg-border-line"><span className="text-2xl">📄</span><span>Document {i + 1}</span></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 3: Payment ─── */}
            <div className="px-4 py-5 md:px-5">
              <p className="mb-4 text-eyebrow text-bg-taupe">Payment</p>
              <div className="mb-5 flex items-center gap-3">
                <p className="text-xs text-text-ink-muted">Method:</p>
                {selectedRegistration.payment_method ? (
                  <span className="badge badge-sage">
                    {selectedRegistration.payment_method.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-text-ink">Not provided</span>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-ink">Proof of Payment</p>
                {selectedRegistration.payment_receipt_url ? (
                  <button type="button" onClick={() => setPreviewImage(selectedRegistration.payment_receipt_url!)} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-bg-taupe">
                    <img
                      src={selectedRegistration.payment_receipt_url}
                      alt="Payment receipt"
                      className="max-h-80 w-full rounded border border-border-line object-contain object-top transition-opacity hover:opacity-80 bg-bg-sunken"
                    />
                  </button>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded border border-dashed border-border-line bg-bg-sunken text-xs text-text-ink-muted">
                    No receipt uploaded.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Toast portal */}
      {toasts.length > 0 && (
        <div aria-label="Notifications" className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}

      {/* Temporary Credentials Modal */}
      <Modal
        isOpen={!!approvedCredentials}
        onClose={() => setApprovedCredentials(null)}
        title="Temporary Credentials"
        footer={
          <Button onClick={() => setApprovedCredentials(null)}>Done</Button>
        }
      >
        <p className="text-sm text-text-ink-body">
          <span className="font-semibold text-text-ink">{approvedCredentials?.shopName}</span> has been approved. The shop owner needs these temporary credentials to log in for the first time:
        </p>
        <div className="mt-6 rounded border border-border-line bg-bg-sunken p-4">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-ink-muted">Email address</p>
            <p className="mt-1 font-mono text-sm font-semibold text-text-ink">{approvedCredentials?.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-ink-muted">Temporary Password</p>
            <p className="mt-1 font-mono text-sm font-semibold text-text-ink">{approvedCredentials?.password}</p>
          </div>
        </div>
      </Modal>

      {previewImage && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <button type="button" className="absolute right-4 top-4 rounded bg-black/50 p-2 text-white hover:bg-black/70 transition-colors" aria-label="Close preview">
            <X size={24} />
          </button>
          <img src={previewImage} alt="Preview" className="max-h-full max-w-full rounded object-contain" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </div>
  );
}

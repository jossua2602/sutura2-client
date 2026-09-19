'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
  subscription_plan: string;
  billing_cycle: string;
  subscription_price: string;
  landmark_image_url: string | null;
  proof_document_urls: string[];
}

export default function PendingShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectingRegistrationId, setRejectingRegistrationId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const router = useRouter();

  function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return null;
    }
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
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin-login');
          return null;
        }
        if (!res.ok) throw new Error('Failed to load shops');
        return res.json();
      })
      .then((data) => {
        if (data) {
          setShops(data.shops ?? []);
          setRegistrations(data.registrations ?? []);
        }
      })
      .catch(() => setError('Could not load pending shops. Is php artisan serve running?'))
      .finally(() => setLoading(false));
  }

  useEffect(loadShops, []);

  async function handleApprove(shopId: number) {
    const token = getToken();
    if (!token) return;
    setActionError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/shops/${shopId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) throw new Error('Approve failed');
      setShops((prev) => prev.filter((s) => s.id !== shopId));
    } catch {
      setActionError('Could not approve that shop. Try again.');
    }
  }

  async function handleReject(shopId: number) {
    if (!reason.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }
    const token = getToken();
    if (!token) return;
    setActionError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/shops/${shopId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        }
      );
      if (!res.ok) throw new Error('Reject failed');
      setShops((prev) => prev.filter((s) => s.id !== shopId));
      setRejectingId(null);
      setReason('');
    } catch {
      setActionError('Could not reject that shop. Try again.');
    }
  }

  async function handleApproveRegistration(registrationId: number) {
    const token = getToken();
    if (!token) return;
    setActionError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(
        `${apiUrl}/admin/shop-registrations/${registrationId}/approve`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Approval failed (${res.status}).`);
      }
      setRegistrations((prev) => prev.filter((registration) => registration.id !== registrationId));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not approve that registration. Try again.');
    }
  }

  async function handleRejectRegistration(registrationId: number) {
    if (!reason.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }
    const token = getToken();
    if (!token) return;
    setActionError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      const res = await fetch(
        `${apiUrl}/admin/shop-registrations/${registrationId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reason }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Rejection failed (${res.status}).`);
      }
      setRegistrations((prev) => prev.filter((registration) => registration.id !== registrationId));
      setRejectingRegistrationId(null);
      setReason('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not reject that registration. Try again.');
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-display text-2xl"
          style={{ color: 'var(--text-ink)' }}
        >
          Pending Shops
        </h1>

      </div>

      {loading && <p style={{ color: 'var(--text-ink-muted)' }}>Loading...</p>}

      {error && (
        <p
          className="text-sm p-3 rounded-lg mb-4"
          style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-sunken)' }}
        >
          {error}
        </p>
      )}

      {actionError && (
        <p
          className="text-sm p-3 rounded-lg mb-4"
          style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-sunken)' }}
        >
          {actionError}
        </p>
      )}

      {!loading && !error && shops.length === 0 && registrations.length === 0 && (
        <p style={{ color: 'var(--text-ink-muted)' }}>No shops waiting for approval.</p>
      )}

      {registrations.length > 0 && (
        <section className="mb-6">
          <p className="text-eyebrow text-eyebrow-accent">New registrations</p>
          <div className="mt-3 space-y-3">
            {registrations.map((registration) => (
              <div key={`registration-${registration.id}`} className="border border-border-line bg-bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-ink)' }}>{registration.shop_name}</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-ink-muted)' }}>
                      {registration.first_name} {registration.middle_name ? `${registration.middle_name} ` : ''}{registration.last_name}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-ink-muted)' }}>{registration.address}</p>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-ink-muted)' }}>{registration.email} · {registration.contact_number}</p>
                  </div>
                  <span className="border border-border-line-strong bg-bg-sunken px-3 py-1 text-xs capitalize" style={{ color: 'var(--text-ink-body)' }}>
                    {registration.subscription_plan} · {registration.billing_cycle} · ₱{Number(registration.subscription_price).toLocaleString('en-PH')}
                  </span>
                </div>
                <p className="mt-4 text-xs uppercase tracking-wide" style={{ color: 'var(--text-ink-faint)' }}>Awaiting verification</p>
                {rejectingRegistrationId !== registration.id && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRegistration(registration)}
                      className="min-h-10 border px-3 text-sm"
                      style={{ borderColor: 'var(--border-line-strong)', color: 'var(--text-ink-body)' }}
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveRegistration(registration.id)}
                      className="min-h-10 px-3 text-sm text-white"
                      style={{ backgroundColor: 'var(--text-sage)' }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRegistrationId(registration.id);
                        setReason('');
                        setActionError('');
                      }}
                      className="min-h-10 border px-3 text-sm"
                      style={{ borderColor: 'var(--border-line-strong)', color: 'var(--text-danger)' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {rejectingRegistrationId === registration.id && (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm font-medium" style={{ color: 'var(--text-ink-muted)' }}>
                      Reason for rejection
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full border px-3 py-2 text-sm outline-none"
                      style={{ borderColor: 'var(--border-line)', color: 'var(--text-ink)', backgroundColor: 'var(--bg-canvas)' }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectRegistration(registration.id)}
                        className="min-h-10 px-3 text-sm text-white"
                        style={{ backgroundColor: 'var(--text-danger)' }}
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingRegistrationId(null);
                          setReason('');
                        }}
                        className="min-h-10 border px-3 text-sm"
                        style={{ borderColor: 'var(--border-line-strong)', color: 'var(--text-ink-muted)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {shops.length > 0 && <p className="text-eyebrow text-eyebrow-accent">Existing pending shops</p>}
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="p-5 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-line)',
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-ink)' }}>
                  {shop.shop_name}
                </p>
                {shop.address && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-ink-muted)' }}>
                    {shop.address}
                  </p>
                )}
              </div>

              {rejectingId !== shop.id && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(shop.id)}
                    className="px-3 py-1.5 rounded-lg text-sm text-white"
                    style={{ backgroundColor: 'var(--sage)' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(shop.id);
                      setReason('');
                      setActionError('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      border: '1px solid var(--border-line-strong)',
                      color: 'var(--danger)',
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>

            {rejectingId === shop.id && (
              <div className="mt-4 space-y-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: 'var(--text-ink-muted)' }}
                >
                  Reason for rejection
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 outline-none text-sm"
                  style={{
                    border: '1px solid var(--border-line)',
                    color: 'var(--text-ink)',
                    backgroundColor: 'var(--bg-canvas)',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(shop.id)}
                    className="px-3 py-1.5 rounded-lg text-sm text-white"
                    style={{ backgroundColor: 'var(--danger)' }}
                  >
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => {
                      setRejectingId(null);
                      setReason('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      border: '1px solid var(--border-line-strong)',
                      color: 'var(--text-ink-muted)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedRegistration && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="registration-details-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-border-line bg-bg-surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-eyebrow text-eyebrow-accent">Registration details</p>
                <h2 id="registration-details-title" className="text-display mt-2 text-3xl" style={{ color: 'var(--text-ink)' }}>
                  {selectedRegistration.shop_name}
                </h2>
              </div>
              <button type="button" onClick={() => setSelectedRegistration(null)} className="min-h-11 border px-3 text-sm" style={{ borderColor: 'var(--border-line-strong)', color: 'var(--text-ink-muted)' }}>
                Close
              </button>
            </div>

            <dl className="mt-6 grid gap-4 border-y border-border-line py-5 sm:grid-cols-2">
              <div><dt className="text-eyebrow">Owner</dt><dd className="mt-1 text-sm" style={{ color: 'var(--text-ink-body)' }}>{selectedRegistration.first_name} {selectedRegistration.middle_name ? `${selectedRegistration.middle_name} ` : ''}{selectedRegistration.last_name}</dd></div>
              <div><dt className="text-eyebrow">Subscription</dt><dd className="mt-1 text-sm capitalize" style={{ color: 'var(--text-ink-body)' }}>{selectedRegistration.subscription_plan} · {selectedRegistration.billing_cycle} · ₱{Number(selectedRegistration.subscription_price).toLocaleString('en-PH')}</dd></div>
              <div><dt className="text-eyebrow">Email</dt><dd className="mt-1 text-sm" style={{ color: 'var(--text-ink-body)' }}>{selectedRegistration.email}</dd></div>
              <div><dt className="text-eyebrow">Contact number</dt><dd className="mt-1 text-sm" style={{ color: 'var(--text-ink-body)' }}>{selectedRegistration.contact_number}</dd></div>
              <div className="sm:col-span-2"><dt className="text-eyebrow">Address</dt><dd className="mt-1 text-sm" style={{ color: 'var(--text-ink-body)' }}>{selectedRegistration.address}</dd></div>
            </dl>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <section>
                <p className="text-eyebrow">Landmark image</p>
                {selectedRegistration.landmark_image_url ? (
                  <a href={selectedRegistration.landmark_image_url} target="_blank" rel="noreferrer">
                    <img src={selectedRegistration.landmark_image_url} alt={`${selectedRegistration.shop_name} landmark`} className="mt-3 aspect-video w-full border border-border-line object-cover" />
                  </a>
                ) : <p className="mt-3 text-sm text-text-ink-muted">No landmark image provided.</p>}
              </section>
              <section>
                <p className="text-eyebrow">Business permit and proof</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {selectedRegistration.proof_document_urls.map((url, index) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
                      { /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url) ? <img src={url} alt={`Proof document ${index + 1}`} className="aspect-square w-full border border-border-line object-cover" /> : <span className="flex aspect-square items-center justify-center border border-border-line bg-bg-sunken p-3 text-center text-xs text-text-ink-muted">Open proof document {index + 1}</span> }
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
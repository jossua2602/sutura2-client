'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Check, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Plan {
  id: number;
  plan_name: string;
  price: string;
  max_staff: number | null;
  max_branches: number | null;
  perks: string[] | null;
}

interface PlanForm {
  plan_name: string;
  price: string;
  max_staff: string;
  max_branches: string;
  perks: string;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const emptyForm: PlanForm = { plan_name: '', price: '', max_staff: '', max_branches: '', perks: '' };

function toForm(plan: Plan): PlanForm {
  return {
    plan_name: plan.plan_name,
    price: String(plan.price),
    max_staff: plan.max_staff == null ? '' : String(plan.max_staff),
    max_branches: plan.max_branches == null ? '' : String(plan.max_branches),
    perks: (plan.perks ?? []).join('\n'),
  };
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }
    fetch(`${apiUrl}/admin/subscription-plans`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin-login');
          return [];
        }
        if (!response.ok) throw new Error('Could not load subscription plans.');
        return response.json();
      })
      .then(setPlans)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load subscription plans.'))
      .finally(() => setLoading(false));
  }, [router]);

  function startEditing(plan: Plan) {
    setEditing(plan.id);
    setForm(toForm(plan));
    setError('');
    setSuccess('');
  }

  function updateForm(field: keyof PlanForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editing === null) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${apiUrl}/admin/subscription-plans/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan_name: form.plan_name,
          price: Number(form.price),
          max_staff: form.max_staff === '' ? null : Number(form.max_staff),
          max_branches: form.max_branches === '' ? null : Number(form.max_branches),
          perks: form.perks.split('\n').map((perk) => perk.trim()).filter(Boolean),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Could not save subscription plan.');
      setPlans((current) => current.map((plan) => plan.id === editing ? data : plan));
      setEditing(null);
      setSuccess('Subscription plan updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save subscription plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-line pb-6">
          <div>
            <p className="text-eyebrow text-eyebrow-accent">Sutura operations</p>
            <h1 className="text-display mt-2 text-4xl text-text-ink">Subscription plans</h1>
            <p className="mt-2 text-sm text-text-ink-muted">Manage plan pricing, limits, and customer-facing perks.</p>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className="inline-flex min-h-11 items-center gap-2 border border-border-line-strong px-3 text-sm text-text-ink-body hover:bg-bg-sunken">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </button>
        </div>

        {loading && <p className="mt-8 text-sm text-text-ink-muted">Loading plans...</p>}
        {error && <p className="mt-8 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
        {success && <p className="mt-8 border border-border-line bg-bg-sunken p-3 text-sm text-text-sage" role="status">{success}</p>}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => editing === plan.id ? (
            <form key={plan.id} onSubmit={savePlan} className="border border-bg-taupe bg-bg-surface p-6">
              <div className="flex items-center justify-between"><p className="text-eyebrow text-eyebrow-accent">Edit plan</p><button type="button" onClick={() => setEditing(null)} aria-label="Cancel editing" className="text-text-ink-muted hover:text-text-ink"><X size={18} /></button></div>
              <div className="mt-5 space-y-4">
                {([['plan_name', 'Plan name'], ['price', 'Monthly price (PHP)'], ['max_staff', 'Maximum staff'], ['max_branches', 'Maximum branches']] as const).map(([field, label]) => (
                  <label key={field} className="block text-sm text-text-ink-body">{label}<input value={form[field]} onChange={(event) => updateForm(field, event.target.value)} type={field === 'plan_name' ? 'text' : 'number'} min={field === 'plan_name' ? undefined : '0'} step={field === 'price' ? '0.01' : '1'} required={field === 'plan_name' || field === 'price'} className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 outline-none focus:border-border-line-strong" /></label>
                ))}
                <label className="block text-sm text-text-ink-body">Perks <span className="mt-1 block text-xs text-text-ink-muted">One perk per line</span><textarea value={form.perks} onChange={(event) => updateForm('perks', event.target.value)} rows={5} className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 outline-none focus:border-border-line-strong" /></label>
              </div>
              <button type="submit" disabled={saving} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-bg-taupe px-4 text-sm font-medium text-white hover:bg-taupe-hover disabled:opacity-60"><Check size={16} aria-hidden="true" />{saving ? 'Saving...' : 'Save changes'}</button>
            </form>
          ) : (
            <article key={plan.id} className="border border-border-line bg-bg-surface p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-eyebrow text-eyebrow-accent">{plan.plan_name}</p><p className="text-figure mt-3 text-4xl text-text-ink">₱{Number(plan.price).toLocaleString('en-PH')}</p><p className="mt-1 text-xs text-text-ink-muted">per month</p></div><button type="button" onClick={() => startEditing(plan)} aria-label={`Edit ${plan.plan_name} plan`} className="grid min-h-11 min-w-11 place-items-center border border-border-line-strong text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink"><Pencil size={16} /></button></div>
              <div className="mt-6 border-y border-border-line py-4 text-sm text-text-ink-body"><p>Staff: {plan.max_staff ?? 'Unlimited'}</p><p className="mt-1">Branches: {plan.max_branches ?? 'Unlimited'}</p></div>
              <ul className="mt-5 space-y-2 text-sm text-text-ink-muted">{(plan.perks ?? []).length ? plan.perks?.map((perk) => <li key={perk} className="flex gap-2"><span className="text-text-sage">✓</span>{perk}</li>) : <li>No perks configured.</li>}</ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

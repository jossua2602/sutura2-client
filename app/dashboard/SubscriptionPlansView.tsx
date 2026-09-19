'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

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

function SkeletonPlan() {
  return (
    <Card className="p-6 space-y-4">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-10 w-28" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-4/5" />
      <div className="skeleton h-3 w-3/5" />
    </Card>
  );
}

export function SubscriptionPlansView() {
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
    if (!token) { router.push('/admin-login'); return; }
    fetch(`${apiUrl}/admin/subscription-plans`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (res.status === 401) { localStorage.removeItem('token'); router.push('/admin-login'); return []; }
        if (!res.ok) throw new Error('Could not load subscription plans.');
        return res.json();
      })
      .then(setPlans)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load subscription plans.'))
      .finally(() => setLoading(false));
  }, [router]);

  function startEditing(plan: Plan) {
    setEditing(plan.id); setForm(toForm(plan)); setError(''); setSuccess('');
  }

  function updateForm(field: keyof PlanForm, value: string) {
    setForm((curr) => ({ ...curr, [field]: value }));
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editing === null) return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin-login'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${apiUrl}/admin/subscription-plans/${editing}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plan_name: form.plan_name,
          price: Number(form.price),
          max_staff: form.max_staff === '' ? null : Number(form.max_staff),
          max_branches: form.max_branches === '' ? null : Number(form.max_branches),
          perks: form.perks.split('\n').map((p) => p.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save plan.');
      setPlans((curr) => curr.map((p) => p.id === editing ? data : p));
      setEditing(null);
      setSuccess('Subscription plan updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save plan.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1.5 min-h-10 w-full border border-border-line bg-bg-canvas px-3 text-sm text-text-ink outline-none transition-all focus:border-bg-taupe focus:shadow-[0_0_0_3px_rgb(154_128_115/0.10)]';

  return (
    <div>
      <div className="mb-8 border-b border-border-line pb-6">
        <p className="text-eyebrow text-eyebrow-accent">Sutura operations</p>
        <h1 className="text-display mt-2 text-4xl text-text-ink">Subscription plans</h1>
        <p className="mt-2 text-sm text-text-ink-muted">Manage plan pricing, limits, and customer-facing perks.</p>
      </div>

      {error && <div className="mb-6 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">{error}</div>}
      {success && <div className="mb-6 border border-text-sage/30 bg-[#e2ebe0] px-4 py-3 text-sm text-text-sage" role="status">{success}</div>}

      <div className="grid gap-5 lg:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((i) => <SkeletonPlan key={i} />)
        ) : (
          plans.map((plan) =>
            editing === plan.id ? (
              <Card
                key={plan.id}
                className="p-6"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                <form onSubmit={savePlan}>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-eyebrow text-eyebrow-accent">Editing plan</p>
                    <button type="button" onClick={() => setEditing(null)} aria-label="Cancel" className="text-text-ink-muted hover:text-text-ink"><X size={18} /></button>
                  </div>
                  <div className="space-y-3">
                    {(['plan_name', 'price', 'max_staff', 'max_branches'] as const).map((field) => (
                      <label key={field} className="block text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                        {field === 'plan_name' ? 'Plan name' : field === 'price' ? 'Monthly price (₱)' : field === 'max_staff' ? 'Max staff' : 'Max branches'}
                        <input
                          value={form[field]}
                          onChange={(e) => updateForm(field, e.target.value)}
                          type={field === 'plan_name' ? 'text' : 'number'}
                          min={field === 'plan_name' ? undefined : '0'}
                          step={field === 'price' ? '0.01' : '1'}
                          required={field === 'plan_name' || field === 'price'}
                          className={inputClass}
                        />
                      </label>
                    ))}
                    <label className="block text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                      Perks <span className="normal-case font-normal text-text-ink-faint">(one per line)</span>
                      <textarea value={form.perks} onChange={(e) => updateForm('perks', e.target.value)} rows={5} className="mt-1.5 w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm outline-none focus:border-bg-taupe transition-colors" />
                    </label>
                  </div>
                  <Button type="submit" variant="primary" isLoading={saving} className="mt-5 w-full">
                    <Check size={15} className="mr-1.5" aria-hidden="true" />
                    Save changes
                  </Button>
                </form>
              </Card>
            ) : (
              <Card key={plan.id} className="p-6 transition-shadow hover:border-bg-taupe/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-eyebrow text-eyebrow-accent">{plan.plan_name}</p>
                    <p className="text-figure mt-3 text-5xl leading-none text-text-ink">₱{Number(plan.price).toLocaleString('en-PH')}</p>
                    <p className="mt-1.5 text-xs text-text-ink-muted">per month</p>
                  </div>
                  <button type="button" onClick={() => startEditing(plan)} aria-label={`Edit ${plan.plan_name}`} className="grid h-9 w-9 place-items-center border border-border-line text-text-ink-muted transition-colors hover:border-border-line-strong hover:bg-bg-sunken hover:text-text-ink">
                    <Pencil size={15} />
                  </button>
                </div>
                <div className="mt-5 border-y border-border-line py-4 text-sm text-text-ink-body space-y-1">
                  <p>Staff: <span className="font-medium">{plan.max_staff ?? 'Unlimited'}</span></p>
                  <p>Branches: <span className="font-medium">{plan.max_branches ?? 'Unlimited'}</span></p>
                </div>
                <ul className="mt-4 space-y-2">
                  {(plan.perks ?? []).length
                    ? plan.perks!.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-sm text-text-ink-muted">
                          <Check size={14} className="mt-0.5 shrink-0 text-text-sage" aria-hidden="true" />
                          {perk}
                        </li>
                      ))
                    : <li className="text-sm text-text-ink-faint">No perks configured.</li>}
                </ul>
              </Card>
            )
          )
        )}
      </div>
    </div>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';

type Plan = 'basic' | 'pro' | 'premium';
type BillingCycle = 'monthly' | 'yearly';

interface RegistrationDetails {
  shop_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  address: string;
  apparel_categories: string[];
}

const GOVERNMENT_ID_TYPES = [
  'Driver\'s License',
  'Passport',
  'PhilID / National ID',
  'UMID',
  'Postal ID',
  'PRC ID',
  'Voter\'s ID',
];

const APPAREL_OPTIONS = [
  'Barong Tagalog',
  'Filipiniana',
  'School Uniforms',
  'Corporate / Office Wear',
  'Wedding & Formal Gowns',
  'Alterations & Repairs',
  'Custom Suits & Blazers',
  'Traditional / Ethnic Wear',
  'Casual Wear',
  'Sports & Activewear',
  'Children\'s Clothing',
  'Embroidery & Embellishments',
  'Others',
];

const defaultPlans: Array<{ id: Plan; name: string; monthly: number; description: string }> = [
  { id: 'basic',   name: 'Basic',   monthly: 149, description: 'A simple start for a growing shop.' },
  { id: 'pro',     name: 'Pro',     monthly: 599, description: 'More room for your team and daily work.' },
  { id: 'premium', name: 'Premium', monthly: 899, description: 'The full Sutura workspace for busy shops.' },
];

const personalFields: Array<[string, string, boolean]> = [
  ['first_name',      'First name',      true],
  ['middle_name',     'Middle name',     false],
  ['last_name',       'Last name',       true],
  ['email',           'Email',           true],
  ['contact_number',  'Contact number',  true],
];

function formatPrice(price: number) {
  return `â‚±${price.toLocaleString('en-PH')}`;
}

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-8 flex items-center">
      {[1, 2].map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step <= current
                ? 'bg-bg-taupe text-white'
                : 'border border-border-line-strong bg-bg-sunken text-text-ink-muted'
            }`}
          >
            {step < current ? <Check size={14} /> : step}
          </div>
          <span
            className={`ml-2 text-xs font-medium uppercase tracking-wide ${
              step === current ? 'text-text-ink' : 'text-text-ink-muted'
            }`}
          >
            {step === 1 ? 'Shop details' : 'Subscription'}
          </span>
          {index < 1 && (
            <div
              className={`mx-4 h-px w-12 transition-colors ${
                current > 1 ? 'bg-bg-taupe' : 'bg-border-line-strong'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FileZone({
  name,
  label,
  hint,
  accept,
  multiple = false,
  required = false,
}: {
  name: string;
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-text-ink-body">{label}</p>
      <p className="mt-0.5 text-xs text-text-ink-muted">{hint}</p>
      <div className="mt-2 border border-dashed border-border-line-strong bg-bg-canvas p-4 transition-colors hover:border-bg-taupe hover:bg-bg-sunken">
        <input
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          required={required}
          className="block w-full cursor-pointer text-sm text-text-ink-muted file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-bg-taupe"
        />
      </div>
    </div>
  );
}

export default function ShopRegistrationPage() {
  const [plans, setPlans] = useState(defaultPlans);
  const [step, setStep] = useState<1 | 2>(1);
  const [plan, setPlan] = useState<Plan>('basic');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState<RegistrationDetails | null>(null);

  // File state
  const [landmarkFile, setLandmarkFile] = useState<File | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [dtiFile, setDtiFile] = useState<File | null>(null);
  const [tinFile, setTinFile] = useState<File | null>(null);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [govIdType, setGovIdType] = useState(GOVERNMENT_ID_TYPES[0]);

  // Checkbox state for apparel categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    details?.apparel_categories ?? []
  );
  const [otherCategory, setOtherCategory] = useState('');

  const selectedPlan = plans.find((item) => item.id === plan) ?? plans[0];
  const price = billingCycle === 'monthly' ? selectedPlan.monthly : selectedPlan.monthly * 12;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/plans`)
      .then((res) => res.ok ? res.json() : [])
      .then((managedPlans) => {
        if (Array.isArray(managedPlans) && managedPlans.length > 0) {
          setPlans(managedPlans.map((item: { plan_name: string; price: string }, index: number) => ({
            id: (item.plan_name.toLowerCase() as Plan) || defaultPlans[index]?.id,
            name: item.plan_name,
            monthly: Number(item.price),
            description: defaultPlans[index]?.description ?? 'A Sutura subscription plan.',
          })));
        }
      })
      .catch(() => undefined);
  }, []);

  function toggleCategory(category: string) {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function moveToSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Collect files from the native inputs
    const landmark = formData.get('landmark_image');
    const proofs   = formData.getAll('proof_documents[]');
    const dti      = formData.get('dti_registration');
    const tinImg   = formData.get('tin_id_image');
    const govId    = formData.get('government_id');
    const typeGovId = String(formData.get('government_id_type') ?? govIdType);

    if (landmark instanceof File && landmark.size > 0) setLandmarkFile(landmark);
    if (dti instanceof File && dti.size > 0) setDtiFile(dti);
    if (tinImg instanceof File && tinImg.size > 0) setTinFile(tinImg);
    if (govId instanceof File && govId.size > 0) setGovIdFile(govId);
    setGovIdType(typeGovId);

    const selectedProofs = proofs.filter((f): f is File => f instanceof File && f.size > 0);
    if (selectedProofs.length > 0) setProofFiles(selectedProofs);

    setDetails({
      shop_name:          String(formData.get('shop_name') ?? ''),
      first_name:         String(formData.get('first_name') ?? ''),
      middle_name:        String(formData.get('middle_name') ?? ''),
      last_name:          String(formData.get('last_name') ?? ''),
      email:              String(formData.get('email') ?? ''),
      contact_number:     String(formData.get('contact_number') ?? ''),
      address:            String(formData.get('address') ?? ''),
      apparel_categories: selectedCategories,
    });

    setError('');
    setStep(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

      if (!details || !landmarkFile || proofFiles.length === 0) {
        setError('Please return to the details step and add all required information and documents.');
        return;
      }

      const formData = new FormData();

      // Text fields
      Object.entries(details).forEach(([key, value]) => {
        if (Array.isArray(value)) return;
        formData.append(key, value);
      });

      // Apparel categories
      formData.delete('apparel_categories');
      details.apparel_categories.forEach((cat) => {
        if (cat === 'Others') {
          if (otherCategory.trim()) {
            formData.append('apparel_categories[]', otherCategory.trim());
          }
        } else {
          formData.append('apparel_categories[]', cat);
        }
      });

      // Files
      formData.append('landmark_image', landmarkFile);
      proofFiles.forEach((file) => formData.append('proof_documents[]', file));
      if (dtiFile)   formData.append('dti_registration', dtiFile);
      if (tinFile)   formData.append('tin_id_image', tinFile);
      if (govIdFile) {
        formData.append('government_id', govIdFile);
        formData.append('government_id_type', govIdType);
      }

      // Subscription
      formData.set('subscription_plan', plan);
      formData.set('billing_cycle', billingCycle);
      formData.set('subscription_price', String(price));

      const response = await fetch(`${apiUrl}/shop-registrations`, { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const validationErrors = data.errors
          ? Object.values(data.errors).flat().join(' ')
          : '';
        setError(validationErrors || data.message || `Registration failed (${response.status}).`);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Could not connect to the registration server. Make sure php artisan serve is running.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 text-sm text-text-ink outline-none transition-all duration-150 focus:border-bg-taupe focus:bg-bg-surface focus:shadow-[0_0_0_3px_rgb(154_128_115/0.12)]';
  const labelClass = 'block text-sm font-medium text-text-ink-body';

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin-login" className="text-sm text-text-ink-muted transition-colors hover:text-text-ink">
            â† Back to sign in
          </Link>
          <Image
            src="/sutura-logo-nobg.png"
            alt="Sutura"
            width={100}
            height={32}
            className="h-8 w-auto object-contain"
          />
        </div>

        <div
          className="animate-rise border border-border-line bg-bg-surface p-6 sm:p-10"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <p className="text-eyebrow text-eyebrow-accent">Shop registration</p>
          <h1 className="text-display mt-3 text-4xl text-text-ink">Register your shop</h1>
          <p className="mt-2 text-sm leading-6 text-text-ink-muted">
            {step === 1
              ? 'Tell us about your shop and upload your business documents.'
              : 'Choose the plan that fits your shop before submitting for review.'}
          </p>

          <div className="mt-8">
            <StepIndicator current={step} />
          </div>

          {/* â”€â”€ Confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {submitted ? (
            <section className="mt-2 border border-border-line bg-bg-sunken p-8 text-center" role="status">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e2ebe0]">
                <Check size={22} className="text-text-sage" aria-hidden="true" />
              </div>
              <p className="text-eyebrow text-eyebrow-accent">Registration received</p>
              <h2 className="text-display mt-3 text-2xl text-text-ink">Please wait for verification</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-ink-body">
                Your shop details, documents, and subscription choice have been submitted. An administrator will review them before you can sign in.
              </p>
              <Link
                href="/admin-login"
                className="mt-6 inline-flex min-h-11 items-center bg-bg-taupe px-5 text-sm font-semibold text-white transition-colors hover:bg-taupe-hover"
              >
                Return to sign in
              </Link>
            </section>

          ) : step === 1 ? (
            /* â”€â”€ Step 1: Shop details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
            <form onSubmit={moveToSubscription} className="mt-6 space-y-6" encType="multipart/form-data">
              {error && (
                <p className="border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">
                  {error}
                </p>
              )}

              {/* Shop name */}
              <label className={labelClass}>
                Shop name
                <input name="shop_name" defaultValue={details?.shop_name} required className={inputClass} />
              </label>

              {/* Owner info */}
              <div className="grid gap-5 sm:grid-cols-2">
                {personalFields.map(([name, label, required]) => (
                  <label key={name} className={labelClass}>
                    {label}
                    <input
                      name={name}
                      type={name === 'email' ? 'email' : 'text'}
                      defaultValue={details?.[name as keyof RegistrationDetails] as string}
                      required={required}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>

              {/* Address */}
              <label className={labelClass}>
                Shop address
                <textarea
                  name="address"
                  defaultValue={details?.address}
                  required
                  rows={3}
                  className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 text-sm text-text-ink outline-none transition-all duration-150 focus:border-bg-taupe focus:bg-bg-surface focus:shadow-[0_0_0_3px_rgb(154_128_115/0.12)]"
                />
              </label>

              {/* Apparel categories â€” checkboxes */}
              <fieldset>
                <legend className="text-sm font-medium text-text-ink-body">
                  Apparel specializations
                  <span className="ml-2 text-xs font-normal text-text-ink-muted">Select all that apply</span>
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {APPAREL_OPTIONS.map((option) => {
                    const checked = selectedCategories.includes(option);
                    return (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-3 border p-3 transition-colors ${
                          checked
                            ? 'border-bg-taupe/50 bg-bg-sunken'
                            : 'border-border-line bg-bg-canvas hover:border-border-line-strong hover:bg-bg-sunken'
                        }`}
                      >
                        {/* Custom checkbox */}
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center border transition-colors ${
                            checked
                              ? 'border-bg-taupe bg-bg-taupe'
                              : 'border-border-line-strong bg-bg-surface'
                          }`}
                        >
                          {checked && <Check size={12} className="text-white" aria-hidden="true" />}
                        </span>
                        <input
                          type="checkbox"
                          value={option}
                          checked={checked}
                          onChange={() => toggleCategory(option)}
                          className="sr-only"
                        />
                        <span className="text-sm text-text-ink-body">{option}</span>
                      </label>
                    );
                  })}
                </div>
                {selectedCategories.includes('Others') && (
                  <div className="mt-3">
                    <label className={labelClass}>
                      Please specify
                      <input
                        type="text"
                        value={otherCategory}
                        onChange={(e) => setOtherCategory(e.target.value)}
                        placeholder="E.g., Leather Goods, Costumes"
                        required={selectedCategories.includes('Others')}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}
                {selectedCategories.length === 0 && (
                  <p className="mt-2 text-xs text-text-ink-muted">
                    At least one specialization is recommended for faster verification.
                  </p>
                )}
                {selectedCategories.length > 0 && (
                  <p className="mt-2 text-xs text-text-sage">
                    {selectedCategories.length} specialization{selectedCategories.length > 1 ? 's' : ''} selected.
                  </p>
                )}
              </fieldset>

              {/* Document uploads */}
              <div className="border-t border-border-line pt-6">
                <p className="mb-4 text-sm font-semibold text-text-ink">Business documents & Identification</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FileZone
                    name="landmark_image"
                    label="Landmark image"
                    hint="JPG, PNG or WEBP Â· up to 5 MB"
                    accept="image/*"
                    required
                  />
                  <FileZone
                    name="proof_documents[]"
                    label="Business permit"
                    hint="PDF or image Â· up to 10 files"
                    accept="image/*,.pdf"
                    multiple
                    required
                  />
                  <FileZone
                    name="dti_registration"
                    label="DTI registration certificate"
                    hint="PDF or image Â· required"
                    accept="image/*,.pdf"
                    required
                  />
                  <FileZone
                    name="tin_id_image"
                    label="TIN ID or certificate"
                    hint="PDF or image Â· required"
                    accept="image/*,.pdf"
                    required
                  />
                  
                  <label className={labelClass}>
                    Government ID type
                    <span className="mt-1 block text-xs font-normal text-text-ink-muted">Select the ID you will upload</span>
                    <div className="relative mt-2">
                      <select
                        name="government_id_type"
                        value={govIdType}
                        onChange={(e) => setGovIdType(e.target.value)}
                        className="min-h-11 w-full appearance-none border border-border-line bg-bg-canvas px-3 text-sm text-text-ink outline-none transition-all focus:border-bg-taupe focus:shadow-[0_0_0_3px_rgb(154_128_115/0.12)]"
                      >
                        {GOVERNMENT_ID_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-ink-muted">
                        â–¼
                      </div>
                    </div>
                  </label>
                  
                  <FileZone
                    name="government_id"
                    label="Upload ID image"
                    hint="Clear photo or scan â€” front and back if applicable"
                    accept="image/*,.pdf"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 min-h-11 bg-bg-taupe px-6 text-sm font-semibold text-white transition-colors hover:bg-taupe-hover"
              >
                Continue to subscription â†’
              </button>
            </form>

          ) : (
            /* â”€â”€ Step 2: Subscription â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
            <form onSubmit={handleSubmit} className="mt-6" encType="multipart/form-data">
              {error && (
                <p className="mb-6 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3 text-sm text-text-danger" role="alert">
                  {error}
                </p>
              )}

              {/* Billing toggle */}
              <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-border-line pb-6">
                <p className="text-eyebrow">Billing cycle</p>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold text-text-ink' : 'text-text-ink-muted'}`}>Monthly</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={billingCycle === 'yearly'}
                    aria-label="Toggle yearly billing"
                    onClick={() => setBillingCycle((c) => c === 'monthly' ? 'yearly' : 'monthly')}
                    className={`relative h-8 w-14 rounded-full border p-1 transition-colors ${billingCycle === 'yearly' ? 'border-bg-taupe bg-bg-taupe' : 'border-border-line-strong bg-bg-sunken'}`}
                  >
                    <span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                  <span className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold text-text-ink' : 'text-text-ink-muted'}`}>Yearly</span>
                  <span className="badge badge-sage">Save ~17%</span>
                </div>
              </div>

              {/* Plans */}
              <fieldset>
                <legend className="text-eyebrow">Choose a plan</legend>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {plans.map((item) => (
                    <label
                      key={item.id}
                      className={`group relative cursor-pointer border p-5 transition-all duration-150 ${
                        plan === item.id
                          ? 'border-bg-taupe bg-bg-sunken shadow-[var(--shadow-sm)]'
                          : 'border-border-line bg-bg-surface hover:border-border-line-strong hover:shadow-[var(--shadow-xs)]'
                      }`}
                    >
                      <input type="radio" name="plan_choice" value={item.id} checked={plan === item.id} onChange={() => setPlan(item.id)} className="sr-only" />
                      {plan === item.id && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-bg-taupe">
                          <Check size={12} className="text-white" aria-hidden="true" />
                        </span>
                      )}
                      <span className="text-eyebrow text-eyebrow-accent">{item.name}</span>
                      <span className="text-figure mt-3 block text-3xl leading-tight text-text-ink">
                        {formatPrice(billingCycle === 'monthly' ? item.monthly : item.monthly * 12)}
                      </span>
                      <span className="mt-1 block text-xs text-text-ink-muted">per {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                      <span className="mt-4 block border-t border-border-line pt-4 text-sm leading-5 text-text-ink-body">{item.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-11 border border-border-line-strong px-4 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink"
                >
                  â† Back to details
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 bg-bg-taupe px-6 text-sm font-semibold text-white transition-colors hover:bg-taupe-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Submittingâ€¦' : 'Submit registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

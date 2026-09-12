<<<<<<< HEAD
'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

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
  branch_name: string;
  latitude: string;
  longitude: string;
}

const defaultPlans: Array<{ id: Plan; name: string; monthly: number; description: string }> = [
  { id: 'basic', name: 'Basic', monthly: 149, description: 'A simple start for a growing shop.' },
  { id: 'pro', name: 'Pro', monthly: 599, description: 'More room for your team and daily work.' },
  { id: 'premium', name: 'Premium', monthly: 899, description: 'The full Sutura workspace for busy shops.' },
];

const registrationFields: Array<[string, string, boolean]> = [
  ['first_name', 'First name', true],
  ['middle_name', 'Middle name', false],
  ['last_name', 'Last name', true],
  ['email', 'Email', true],
  ['contact_number', 'Contact number', true],
];

function formatPrice(price: number) {
  return `₱${price.toLocaleString('en-PH')}`;
}

export default function ShopRegistrationPage() {
  const [plans, setPlans] = useState(defaultPlans);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<Plan>('basic');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState<RegistrationDetails | null>(null);
  const [landmarkFile, setLandmarkFile] = useState<File | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);

  const selectedPlan = plans.find((item) => item.id === plan) ?? plans[0];
  const price = billingCycle === 'monthly' ? selectedPlan.monthly : selectedPlan.monthly * 12;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/plans`)
      .then((response) => response.ok ? response.json() : [])
      .then((managedPlans) => {
        if (Array.isArray(managedPlans) && managedPlans.length > 0) {
          setPlans(managedPlans.map((item: { plan_name: string; price: string }, index: number) => ({
            id: (item.plan_name.toLowerCase() as Plan) || defaultPlans[index]?.id,
            name: item.plan_name,
            monthly: Number(item.price),
            description: defaultPlans[index]?.description ?? 'A Sutura subscription plan for your shop.',
          })));
        }
      })
      .catch(() => undefined);
  }, []);

  function moveToSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const landmark = formData.get('landmark_image');
    const proofs = formData.getAll('proof_documents[]');
    setDetails({
      shop_name: String(formData.get('shop_name') ?? ''),
      first_name: String(formData.get('first_name') ?? ''),
      middle_name: String(formData.get('middle_name') ?? ''),
      last_name: String(formData.get('last_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      contact_number: String(formData.get('contact_number') ?? ''),
      address: String(formData.get('address') ?? ''),
      apparel_categories: String(formData.get('apparel_categories') ?? '').split('\n').map((category) => category.trim()).filter(Boolean),
      branch_name: String(formData.get('branch_name') ?? ''),
      latitude: String(formData.get('latitude') ?? ''),
      longitude: String(formData.get('longitude') ?? ''),
    });
    if (landmark instanceof File && landmark.size > 0) {
      setLandmarkFile(landmark);
    }
    const selectedProofs = proofs.filter((file): file is File => file instanceof File && file.size > 0);
    if (selectedProofs.length > 0) {
      setProofFiles(selectedProofs);
    }
    setError('');
    setStep(2);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      if (!details || !landmarkFile || proofFiles.length === 0) {
        setError('Please return to the details step and add all required information and documents.');
        return;
      }

      const formData = new FormData();
      Object.entries(details).forEach(([key, value]) => {
        if (Array.isArray(value)) return;
        formData.append(key, value);
      });
      formData.delete('apparel_categories');
      details.apparel_categories.forEach((category) => formData.append('apparel_categories[]', category));
      formData.append('landmark_image', landmarkFile);
      proofFiles.forEach((file) => formData.append('proof_documents[]', file));
      formData.set('subscription_plan', plan);
      formData.set('billing_cycle', billingCycle);
      formData.set('subscription_price', String(price));

      const response = await fetch(`${apiUrl}/shop-registrations`, {
        method: 'POST',
        body: formData,
      });
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
      setError('Could not connect to the registration server. Please make sure php artisan serve is running, then try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-canvas px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin-login" className="text-sm text-text-ink-muted hover:text-text-ink">
          Back to sign in
        </Link>
        <div className="mt-8 border border-border-line bg-bg-surface p-6 sm:p-10">
          <p className="text-eyebrow text-eyebrow-accent">Shop registration</p>
          <h1 className="text-display mt-3 text-4xl text-text-ink">Register your shop</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-text-ink-muted">
            {step === 1 ? 'Tell us about your shop and upload proof of legitimacy.' : 'Choose the plan that fits your shop before submitting for review.'}
          </p>

          {submitted ? (
            <section className="mt-8 border border-border-line bg-bg-sunken p-6" role="status">
              <p className="text-eyebrow text-eyebrow-accent">Registration received</p>
              <h2 className="text-display mt-3 text-2xl text-text-ink">Please wait for verification</h2>
              <p className="mt-3 text-sm leading-6 text-text-ink-body">
                Your shop details, proof documents, and subscription choice have been submitted. An administrator will review them before you can sign in.
              </p>
              <Link href="/admin-login" className="mt-6 inline-flex min-h-11 items-center bg-bg-taupe px-4 text-sm font-medium text-white hover:bg-taupe-hover">
                Return to sign in
              </Link>
            </section>
          ) : step === 1 ? (
            <form onSubmit={moveToSubscription} className="mt-8 space-y-6" encType="multipart/form-data">
              {error && <p className="border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
              <label className="block text-sm text-text-ink-body">
                Shop name
                <input name="shop_name" defaultValue={details?.shop_name} required className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 outline-none focus:border-border-line-strong" />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                {registrationFields.map(([name, label, required]) => (
                  <label key={name} className="block text-sm text-text-ink-body">
                    {label}
                    <input name={name} type={name === 'email' ? 'email' : 'text'} defaultValue={details?.[name as keyof RegistrationDetails]} required={required} className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 outline-none focus:border-border-line-strong" />
                  </label>
                ))}
              </div>
              <label className="block text-sm text-text-ink-body">
                Address
                <textarea name="address" defaultValue={details?.address} required rows={3} className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 outline-none focus:border-border-line-strong" />
              </label>
              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block text-sm text-text-ink-body">Branch name<input name="branch_name" defaultValue={details?.branch_name} required className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 outline-none focus:border-border-line-strong" /></label>
                <label className="block text-sm text-text-ink-body">Latitude<input name="latitude" type="number" step="any" min="-90" max="90" defaultValue={details?.latitude} required placeholder="7.1907" className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 outline-none focus:border-border-line-strong" /></label>
                <label className="block text-sm text-text-ink-body">Longitude<input name="longitude" type="number" step="any" min="-180" max="180" defaultValue={details?.longitude} required placeholder="125.4553" className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 outline-none focus:border-border-line-strong" /></label>
              </div>
              <p className="-mt-3 text-xs text-text-ink-muted">Enter the branch map coordinates so an administrator can verify the location.</p>
              <label className="block text-sm text-text-ink-body">
                Apparel categories or specializations
                <span className="mt-1 block text-xs text-text-ink-muted">One category per line. These are reviewed by an administrator.</span>
                <textarea name="apparel_categories" defaultValue={details?.apparel_categories?.join('\n')} rows={4} placeholder={'Barong Tagalog\nSchool Uniforms\nAlterations'} className="mt-2 w-full border border-border-line bg-bg-canvas px-3 py-2 outline-none focus:border-border-line-strong" />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-text-ink-body">
                  Landmark image
                  <span className="mt-1 block text-xs text-text-ink-muted">JPG, PNG, WEBP up to 5 MB</span>
                  <input name="landmark_image" type="file" accept="image/*" required className="mt-2 block min-h-11 w-full border border-border-line bg-bg-canvas p-2 text-sm" />
                </label>
                <label className="block text-sm text-text-ink-body">
                  Business permit and proof documents
                  <span className="mt-1 block text-xs text-text-ink-muted">PDF or image files, up to 10 files</span>
                  <input name="proof_documents[]" type="file" accept="image/*,.pdf" multiple required className="mt-2 block min-h-11 w-full border border-border-line bg-bg-canvas p-2 text-sm" />
                </label>
              </div>
              <button type="submit" className="min-h-11 bg-bg-taupe px-5 text-sm font-medium text-white hover:bg-taupe-hover">Continue to subscription</button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8" encType="multipart/form-data">
              {error && <p className="mb-6 border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">{error}</p>}
              <div className="mb-6 flex items-center justify-between border-b border-border-line pb-4">
                <p className="text-sm text-text-ink-muted">Step 2 of 2: subscription</p>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-text-ink-muted underline hover:text-text-ink">Back to details</button>
              </div>
              <div className="mb-8 flex flex-wrap items-center gap-4 border-b border-border-line pb-6">
                <p className="text-eyebrow">Billing cycle</p>
                <span className={`text-sm ${billingCycle === 'monthly' ? 'font-medium text-text-ink' : 'text-text-ink-muted'}`}>Monthly</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={billingCycle === 'yearly'}
                  aria-label="Toggle yearly billing"
                  onClick={() => setBillingCycle((current) => current === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative h-8 w-16 rounded-full border p-1 transition-colors ${billingCycle === 'yearly' ? 'border-bg-taupe bg-bg-taupe' : 'border-border-line-strong bg-bg-sunken'}`}
                >
                  <span className={`block h-6 w-6 rounded-full bg-white transition-transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`} />
                </button>
                <span className={`text-sm ${billingCycle === 'yearly' ? 'font-medium text-text-ink' : 'text-text-ink-muted'}`}>Yearly</span>
                <span className="text-xs text-text-sage">12 months</span>
              </div>
              <fieldset>
                <legend className="text-eyebrow">Choose a plan</legend>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {plans.map((item) => (
                    <label key={item.id} className={`cursor-pointer border p-5 transition-colors ${plan === item.id ? 'border-bg-taupe bg-bg-sunken' : 'border-border-line hover:border-border-line-strong'}`}>
                      <input type="radio" name="plan_choice" value={item.id} checked={plan === item.id} onChange={() => setPlan(item.id)} className="sr-only" />
                      <span className="text-eyebrow text-eyebrow-accent">{item.name}</span>
                      <span className="text-figure mt-3 block text-3xl text-text-ink">{formatPrice(billingCycle === 'monthly' ? item.monthly : item.monthly * 12)}</span>
                      <span className="mt-1 block text-xs text-text-ink-muted">per {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                      <span className="mt-4 block text-sm leading-5 text-text-ink-body">{item.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" disabled={loading} className="mt-8 min-h-11 bg-bg-taupe px-5 text-sm font-medium text-white hover:bg-taupe-hover disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Submitting registration...' : 'Submit registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
=======
"use client";



import { useState } from "react";



export default function ShopRegistrationForm() {

  const [formData, setFormData] = useState({

    username: "",

    email: "",

    password: "",

    shop_name: "",

    address: "",

  });

 

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");



const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

  setFormData({

    ...formData,

    [e.target.name]: e.target.value,

  });

};



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setLoading(true);

    setMessage("");



    try {

      const response = await fetch("http://127.0.0.1:8000/api/register-shop", {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Accept": "application/json",

        },

        body: JSON.stringify(formData),

      });



      const data = await response.json();



      if (response.ok) {

        setMessage("Success! Your shop application has been submitted and is pending review.");

        setFormData({ username: "", email: "", password: "", shop_name: "", address: "" }); // Reset form

      } else {

        setMessage(data.message || "Something went wrong. Please check your inputs.");

      }

    } catch (error) {

      setMessage("Cannot connect to the server. Please try again later.");

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="min-h-screen bg-[#F6F1ED] flex items-center justify-center p-6">

      <div className="bg-white max-w-xl w-full p-10 rounded-[32px] shadow-sm border border-[#D8CDC5]">

        <div className="text-center mb-10">

          <h1 className="text-3xl font-bold text-[#4A3F3A] mb-2">Partner with SUTURA</h1>

          <p className="text-[#8A7F78] text-sm">Register your tailoring business and reach more customers.</p>

        </div>



        {message && (

          <div className={`p-4 mb-6 rounded-xl text-sm ${message.includes('Success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>

            {message}

          </div>

        )}



        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Owner Account Details */}

          <div>

            <h2 className="text-sm font-bold text-[#4A3F3A] uppercase tracking-wider mb-4 border-b border-[#D8CDC5] pb-2">1. Account Details</h2>

            <div className="space-y-4">

              <div>

                <label className="block text-sm font-medium text-[#8A7F78] mb-1">Username</label>

                <input required type="text" name="username" value={formData.username} onChange={handleChange} className="w-full p-3 border border-[#D8CDC5] rounded-xl focus:ring-2 focus:ring-[#A88A7B] focus:outline-none" placeholder="johndoe123" />

              </div>

              <div>

                <label className="block text-sm font-medium text-[#8A7F78] mb-1">Email Address</label>

                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border border-[#D8CDC5] rounded-xl focus:ring-2 focus:ring-[#A88A7B] focus:outline-none" placeholder="john@example.com" />

              </div>

              <div>

                <label className="block text-sm font-medium text-[#8A7F78] mb-1">Password</label>

                <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-3 border border-[#D8CDC5] rounded-xl focus:ring-2 focus:ring-[#A88A7B] focus:outline-none" placeholder="••••••••" />

              </div>

            </div>

          </div>



          {/* Shop Details */}

          <div className="pt-4">

            <h2 className="text-sm font-bold text-[#4A3F3A] uppercase tracking-wider mb-4 border-b border-[#D8CDC5] pb-2">2. Business Details</h2>

            <div className="space-y-4">

              <div>

                <label className="block text-sm font-medium text-[#8A7F78] mb-1">Shop Name</label>

                <input required type="text" name="shop_name" value={formData.shop_name} onChange={handleChange} className="w-full p-3 border border-[#D8CDC5] rounded-xl focus:ring-2 focus:ring-[#A88A7B] focus:outline-none" placeholder="e.g. Imperial Tailors" />

              </div>

              <div>

                <label className="block text-sm font-medium text-[#8A7F78] mb-1">Shop Address</label>

                <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-3 border border-[#D8CDC5] rounded-xl focus:ring-2 focus:ring-[#A88A7B] focus:outline-none" placeholder="Complete physical address" />

              </div>

            </div>

          </div>



  

{/* Subscription & Billing Selection */}
<div className="grid grid-cols-2 gap-4 mt-4">
  {/* Dropdown: Plan Name */}
  <div>
    <label className="block text-sm font-semibold text-[#8A7F78] mb-2">Plan</label>
    <select 
      name="plan" 
      required 
      defaultValue="" 
      onChange={handleChange} 
      className="w-full p-3 border border-[#D8CDC5] rounded-xl text-sm focus:ring-2 focus:ring-[#A88A7B] focus:outline-none"
    >
      <option value="" disabled>-- Choose Plan --</option>
      <option value="Basic">Basic</option>
      <option value="Pro">Pro</option>
      <option value="Premium">Premium</option>
    </select>
  </div>

  {/* Dropdown: Billing Cycle */}
  <div>
    <label className="block text-sm font-semibold text-[#8A7F78] mb-2">Billing Cycle</label>
    <select 
      name="billing_cycle" 
      required 
      defaultValue="" 
      onChange={handleChange} 
      className="w-full p-3 border border-[#D8CDC5] rounded-xl text-sm focus:ring-2 focus:ring-[#A88A7B] focus:outline-none"
    >
      <option value="" disabled>-- Choose Cycle --</option>
      <option value="Monthly">Monthly</option>
      <option value="Yearly">Yearly</option>
    </select>
  </div>
</div>

          <button

            type="submit"

            disabled={loading}

            className="w-full py-4 mt-4 rounded-xl bg-[#A88A7B] text-white font-semibold hover:bg-[#8e7264] transition-colors disabled:opacity-50"

          >

            {loading ? "Submitting Application..." : "Submit Registration"}

          </button>

        </form>

      </div>

    </div>

  );

>>>>>>> ef6c2ef48e940b95ef3432baf1cc3d8c24b60bbb
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ShopLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid credentials. Please try again.');
        setShakeKey((k) => k + 1);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Could not reach the server. Is php artisan serve running?');
      setShakeKey((k) => k + 1);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-10">
      <div
        className="animate-rise grid w-full max-w-4xl overflow-hidden border border-border-line bg-bg-surface md:grid-cols-[0.9fr_1.1fr]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* ── Left panel ── */}
        <section
          className="relative hidden overflow-hidden bg-bg-taupe p-10 text-white md:flex md:flex-col md:justify-between"
          aria-hidden="true"
        >
          {/* Dot-grid texture */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Top content */}
          <div className="relative">
            <Image
              src="/sutura-logo-nobg.png"
              alt="Sutura"
              width={130}
              height={44}
              className="h-11 w-auto object-contain object-left brightness-0 invert"
              priority
            />
            <h1 className="text-display mt-14 max-w-[240px] text-5xl leading-[1.08] tracking-tight">
              Keep every order moving.
            </h1>
          </div>

          {/* Bottom content */}
          <div className="relative space-y-6">
            <p className="max-w-[220px] text-sm leading-6 text-white/70">
              A calm place to track your shop, your team, and the work on the floor.
            </p>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-white/40">
                Sutura Shop
              </span>
              <div className="h-px flex-1 bg-white/15" />
            </div>
          </div>
        </section>

        {/* ── Right panel ── */}
        <section className="flex flex-col justify-center p-8 sm:p-12">
          {/* Mobile logo */}
          <div className="mb-8 md:hidden">
            <Image
              src="/sutura-logo-nobg.png"
              alt="Sutura"
              width={110}
              height={36}
              className="h-9 w-auto object-contain object-left"
              priority
            />
          </div>

          <p className="text-eyebrow text-eyebrow-accent">Shop workspace</p>
          <h2 className="text-display mt-3 text-[2.2rem] leading-tight text-text-ink">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-ink-muted">
            Sign in to continue to your Sutura workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {/* Error */}
            {error && (
              <div
                key={shakeKey}
                className="animate-shake flex items-start gap-3 border border-text-danger/30 bg-[#f5e8e5] px-4 py-3"
                role="alert"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-text-danger" />
                <p className="text-sm text-text-danger">{error}</p>
              </div>
            )}

            {/* Email */}
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                <Mail size={13} aria-hidden="true" />
                Email address
              </span>
              <div className="relative mt-2">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="min-h-12 w-full border border-border-line bg-bg-canvas px-4 text-sm text-text-ink outline-none transition-all duration-150 focus:border-bg-taupe focus:bg-bg-surface focus:shadow-[0_0_0_3px_rgb(154_128_115/0.15)]"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-ink-muted">
                <Lock size={13} aria-hidden="true" />
                Password
              </span>
              <div className="relative mt-2">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="min-h-12 w-full border border-border-line bg-bg-canvas pr-12 pl-4 text-sm text-text-ink outline-none transition-all duration-150 focus:border-bg-taupe focus:bg-bg-surface focus:shadow-[0_0_0_3px_rgb(154_128_115/0.15)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-text-ink-muted transition-colors hover:text-text-ink"
                >
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            </label>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden bg-bg-taupe px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-taupe-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 00-8 8z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-text-ink-muted">
            Need a shop account?{' '}
            <Link
              href="/register"
              className="font-semibold text-bg-taupe underline underline-offset-2 hover:text-taupe-hover"
            >
              Register your shop
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
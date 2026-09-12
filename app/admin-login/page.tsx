'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Could not reach the server. Is php artisan serve running?');
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-8">
      <div className="animate-rise grid w-full max-w-4xl overflow-hidden border border-border-line bg-bg-surface md:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden bg-bg-taupe p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <Image src="/sutura-logo-nobg.png" alt="Sutura" width={140} height={48} className="h-12 w-auto object-contain object-left" priority />
            <h1 className="text-display mt-16 max-w-xs text-5xl leading-[1.05]">
              Keep every order moving.
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-6 text-white/75">
            A calm place to track your shop, your team, and the work on the floor.
          </p>
        </section>

        <section className="p-7 sm:p-10">
          <p className="text-eyebrow text-eyebrow-accent">Shop owner access</p>
          <h2 className="text-display mt-3 text-3xl text-text-ink">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-text-ink-muted">
            Sign in to continue to your Sutura workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <p className="border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">
                {error}
              </p>
            )}

            <label className="block text-sm text-text-ink-body">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 text-text-ink outline-none transition-colors focus:border-border-line-strong"
              />
            </label>

            <label className="block text-sm text-text-ink-body">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 min-h-11 w-full border border-border-line bg-bg-canvas px-3 text-text-ink outline-none transition-colors focus:border-border-line-strong"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="min-h-11 w-full bg-bg-taupe px-4 text-sm font-medium text-white transition-colors hover:bg-taupe-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-text-ink-muted">
            Need a shop account?{' '}
            <Link href="/register" className="font-medium text-bg-taupe hover:text-taupe-hover">
              Register your shop
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
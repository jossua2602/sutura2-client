<<<<<<< HEAD
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, BarChart3, Bell, ClipboardList, FileText, Headphones, LayoutDashboard, LogOut, Menu, Store, Tags, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  total_users: number;
  total_shops: number;
  active_subscriptions: number;
  pending_verifications: number;
  pending_registrations: number;
  notifications: NotificationItem[];
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin-login');
      return;
    }

    async function loadDashboard() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin-login');
          return;
        }
        if (!res.ok) throw new Error('Failed to load dashboard');
        setStats(await res.json());
      } catch {
        setError('Could not load dashboard. Is php artisan serve running?');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 3000);
    return () => window.clearInterval(refreshTimer);
  }, [router]);

  function signOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin-login');
  }

  const supportingStats = stats
    ? [
        { label: 'Total users', value: stats.total_users },
        { label: 'Active subscriptions', value: stats.active_subscriptions },
        { label: 'Pending registrations', value: stats.pending_registrations },
      ]
    : [];

  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <aside className="hidden w-60 shrink-0 border-r border-border-line bg-bg-surface p-5 lg:flex lg:flex-col">
        <Image src="/sutura-logo-nobg.png" alt="Sutura" width={180} height={64} className="h-16 w-auto object-contain object-left" priority />
        <nav className="mt-12 space-y-1" aria-label="Main navigation">
          <a className="flex min-h-11 items-center gap-3 bg-bg-sunken px-3 text-sm font-medium text-text-ink" href="/dashboard">
            <LayoutDashboard size={18} aria-hidden="true" />
            Overview
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/pending-shop">
            <ClipboardList size={18} aria-hidden="true" />
            Pending shops
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/active-shops">
            <Store size={18} aria-hidden="true" />
            Active shops
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/shops">
            <Store size={18} aria-hidden="true" />
            Shop directory
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/subscription-plans">
            <Tags size={18} aria-hidden="true" />
            Subscription plans
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/apparel-categories">
            <Tags size={18} aria-hidden="true" />
            Apparel validation
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/branch-map-validation">
            <Store size={18} aria-hidden="true" />
            Branch map validation
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/subscription-report">
            <BarChart3 size={18} aria-hidden="true" />
            Subscription report
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/accounts">
            <Users size={18} aria-hidden="true" />
            Accounts
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/support-tickets">
            <Headphones size={18} aria-hidden="true" />
            Support tickets
          </a>
          <a className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink" href="/audit-log">
            <FileText size={18} aria-hidden="true" />
            Audit log
          </a>
        </nav>
        <button onClick={signOut} className="mt-auto flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:text-text-danger">
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="relative flex h-full w-[min(18rem,85vw)] flex-col border-r border-border-line bg-bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <Image src="/sutura-logo-nobg.png" alt="Sutura" width={180} height={64} className="h-16 w-auto object-contain object-left" priority />
              </div>
              <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation" className="grid min-h-11 min-w-11 place-items-center text-text-ink-muted hover:text-text-ink">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="mt-10 space-y-1" aria-label="Mobile main navigation">
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 bg-bg-sunken px-3 text-sm font-medium text-text-ink" href="/dashboard">
                <LayoutDashboard size={18} aria-hidden="true" />
                Overview
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/pending-shop">
                <ClipboardList size={18} aria-hidden="true" />
                Pending shops
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/active-shops">
                <Store size={18} aria-hidden="true" />
                Active shops
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/shops">
                <Store size={18} aria-hidden="true" />
                Shop directory
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/subscription-plans">
                <Tags size={18} aria-hidden="true" />
                Subscription plans
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/apparel-categories">
                <Tags size={18} aria-hidden="true" />
                Apparel validation
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/branch-map-validation">
                <Store size={18} aria-hidden="true" />
                Branch map validation
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/subscription-report">
                <BarChart3 size={18} aria-hidden="true" />
                Subscription report
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/accounts">
                <Users size={18} aria-hidden="true" />
                Accounts
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/support-tickets">
                <Headphones size={18} aria-hidden="true" />
                Support tickets
              </a>
              <a onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:bg-bg-sunken hover:text-text-ink" href="/audit-log">
                <FileText size={18} aria-hidden="true" />
                Audit log
              </a>
            </nav>
            <button onClick={signOut} className="mt-auto flex min-h-11 items-center gap-3 px-3 text-sm text-text-ink-muted hover:text-text-danger">
              <LogOut size={18} aria-hidden="true" />
              Sign out
            </button>
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-border-line bg-bg-surface px-4 sm:px-6 lg:px-8">
          <div>
            <button type="button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation" className="mr-3 inline-grid min-h-11 min-w-11 place-items-center text-text-ink-muted hover:text-text-ink lg:hidden">
              <Menu size={20} aria-hidden="true" />
            </button>
            <p className="text-eyebrow text-eyebrow-accent">Sutura operations</p>
            <p className="text-sm text-text-ink-muted">Admin workspace</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
            <button
              onClick={() => setNotificationOpen((open) => !open)}
              className="relative grid min-h-11 min-w-11 place-items-center text-text-ink-muted hover:text-text-ink"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
            >
              <Bell size={19} aria-hidden="true" />
              {stats && stats.pending_registrations > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e41e3f] px-1 text-[10px] text-white">
                  {stats.pending_registrations > 9 ? '9+' : stats.pending_registrations}
                </span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute right-0 top-12 z-10 w-[min(22rem,calc(100vw-2rem))] border border-border-line bg-bg-surface p-4">
                <div className="flex items-center justify-between border-b border-border-line pb-3">
                  <p className="text-sm font-medium text-text-ink">Notifications</p>
                  <span className="text-xs text-text-ink-muted">{stats?.pending_registrations ?? 0} pending</span>
                </div>
                <div className="divide-y divide-border-line">
                  {stats?.notifications.length ? stats.notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => router.push('/pending-shop')}
                      className="block w-full py-3 text-left hover:bg-bg-sunken"
                    >
                      <p className="text-sm text-text-ink">{notification.title}</p>
                      <p className="mt-1 text-xs leading-5 text-text-ink-muted">{notification.message}</p>
                      <p className="mt-2 text-xs font-medium text-bg-taupe">Open pending shops</p>
                    </button>
                  )) : (
                    <p className="py-4 text-sm text-text-ink-muted">No new shop registrations.</p>
                  )}
                </div>
              </div>
            )}
            </div>
            <button onClick={signOut} className="text-sm text-text-ink-muted hover:text-text-ink lg:hidden">Sign out</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-rise mb-8">
            <p className="text-eyebrow">Overview</p>
            <h1 className="text-display mt-2 text-4xl text-text-ink">Good morning, admin.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text-ink-muted">A clear view of the shops and people moving through Sutura today.</p>
          </div>

          {loading && <p className="text-sm text-text-ink-muted">Loading your overview...</p>}

          {error && (
            <p className="border border-border-line-strong bg-bg-sunken p-3 text-sm text-text-danger" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && stats && (
            <div className="animate-rise space-y-6" style={{ animationDelay: '80ms' }}>
              <section className="border border-border-line bg-bg-taupe p-6 text-white sm:p-8">
                <p className="text-eyebrow text-white/70">Focal figure</p>
                <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/75">Shops in Sutura</p>
                    <p className="text-figure mt-1 text-6xl leading-none">{stats.total_shops}</p>
                  </div>
                  <p className="max-w-xs text-sm leading-6 text-white/75">The current network of tailoring businesses under your care.</p>
                </div>
              </section>

              <section className="border-y border-border-line bg-bg-surface" aria-label="Overview statistics">
                <div className="grid divide-y divide-border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {supportingStats.map((stat) => (
                    <div key={stat.label} className="p-5 sm:p-6">
                      <p className="text-eyebrow">{stat.label}</p>
                      <p className="text-figure mt-3 text-4xl text-text-ink">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border border-border-line bg-bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-eyebrow text-eyebrow-accent">Quick access</p>
                    <h2 className="text-display mt-2 text-2xl text-text-ink">Keep the platform moving</h2>
                  </div>
                  <p className="text-sm text-text-ink-muted">Choose an admin workflow</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { href: '/pending-shop', label: 'Review registrations', value: stats.pending_registrations, detail: 'Awaiting verification' },
                    { href: '/active-shops', label: 'Manage active shops', value: stats.total_shops, detail: 'Shop directory' },
                    { href: '/subscription-report', label: 'Open reports', value: 'Live', detail: 'Revenue and approval activity' },
                    { href: '/subscription-plans', label: 'Manage plans', value: 'Plans', detail: 'Pricing and perks' },
                    { href: '/accounts', label: 'Manage accounts', value: stats.total_users, detail: 'Users and roles' },
                    { href: '/support-tickets', label: 'Support tickets', value: 'Open', detail: 'Respond to shop teams' },
                  ].map((action) => (
                    <a key={action.href} href={action.href} className="group flex min-h-24 items-start justify-between border border-border-line p-4 transition-colors hover:border-border-line-strong hover:bg-bg-sunken">
                      <span><span className="block text-sm font-medium text-text-ink">{action.label}</span><span className="mt-1 block text-xs text-text-ink-muted">{action.detail}</span></span>
                      <span className="text-right"><span className="text-figure block text-xl text-text-ink">{action.value}</span><ArrowUpRight size={16} className="ml-auto mt-2 text-text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /></span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
=======
"use client";

import { useState, useEffect } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["600"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

interface DashboardStats {
  total_users: number;
  active_shops: number;
  pending_shops: number;
  total_revenue: number;
}

export default function AdminDashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/admin/dashboard-stats");
        const result = await response.json();
        
        if (result.status === 'success') {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className={`max-w-7xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 ${inter.className}`}>
      
      {/* Header Section - Responsive Flex */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
        <div>
          <h1 className={`${playfair.className} text-2xl sm:text-3xl text-[#4A3F3A] mb-1 sm:mb-2`}>
            Overview Dashboard
          </h1>
          <p className="text-[#8A7F78] text-xs sm:text-sm">
            Welcome back! Here's what's happening across the SUTURA platform today.
          </p>
        </div>
        <button className="w-full sm:w-auto px-5 py-2.5 bg-white border border-[#D8CDC5] text-[#4A3F3A] text-sm font-medium rounded-xl hover:bg-[#F6F1ED] transition-colors shadow-sm">
          Generate Report
        </button>
      </div>

      {/* Analytics Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1 */}
        <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <p className="text-[#8A7F78] text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">Total Users</p>
          <h2 className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl text-[#4A3F3A]`}>
            {isLoading ? "..." : stats?.total_users || 0}
          </h2>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <p className="text-[#8A7F78] text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">Active Shops</p>
          <h2 className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl text-emerald-600`}>
            {isLoading ? "..." : stats?.active_shops || 0}
          </h2>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <p className="text-[#8A7F78] text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">Pending Approvals</p>
          <div className="flex items-end gap-3">
            <h2 className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl text-amber-600`}>
              {isLoading ? "..." : stats?.pending_shops || 0}
            </h2>
            {stats?.pending_shops ? (
              <span className="mb-1 sm:mb-2 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-500"></span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-[#D8CDC5] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <p className="text-[#8A7F78] text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2">Platform Revenue</p>
          <h2 className={`${playfair.className} text-2xl sm:text-3xl lg:text-4xl text-blue-600`}>
            {isLoading ? "..." : `₱${stats?.total_revenue || 0}`}
          </h2>
        </div>

      </div>

      {/* Quick Action / Placeholder Section for Chart */}
      <div className="mt-8 bg-[#F6F1ED] rounded-[20px] sm:rounded-[24px] border border-[#D8CDC5] p-6 sm:p-8 flex items-center justify-center min-h-[250px] sm:min-h-[300px]">
         <div className="text-center">
            <h3 className={`${playfair.className} text-xl text-[#4A3F3A] mb-2`}>System Health</h3>
            <p className="text-sm text-[#8A7F78]">Dito natin ilalagay ang graphical chart o graph sa mga susunod na phase!</p>
         </div>
      </div>
      
>>>>>>> ef6c2ef48e940b95ef3432baf1cc3d8c24b60bbb
    </div>
  );
}
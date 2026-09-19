'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Headphones,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShoppingBag,
  Store,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { PendingShopsView } from './PendingShopsView';
import { ActiveShopsView } from './ActiveShopsView';
import { ShopDirectoryView } from './ShopDirectoryView';
import { SubscriptionPlansView } from './SubscriptionPlansView';
import { ApparelCategoriesView } from './ApparelCategoriesView';
import { BranchMapView } from './BranchMapView';
import { SubscriptionReportView } from './SubscriptionReportView';
import { AccountsView } from './AccountsView';
import { SupportTicketsView } from './SupportTicketsView';
import { AuditLogView } from './AuditLogView';

type ActiveView =
  | 'overview'
  | 'pending-shop'
  | 'active-shops'
  | 'shops'
  | 'subscription-plans'
  | 'apparel-categories'
  | 'branch-map-validation'
  | 'subscription-report'
  | 'accounts'
  | 'support-tickets'
  | 'audit-log';

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

const navItems: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
  { view: 'overview',              label: 'Overview',             icon: <LayoutDashboard size={17} /> },
  { view: 'pending-shop',          label: 'Pending shops',        icon: <ClipboardList size={17} /> },
  { view: 'active-shops',          label: 'Active shops',         icon: <ShoppingBag size={17} /> },
  { view: 'shops',                 label: 'Shop directory',       icon: <Store size={17} /> },
  { view: 'subscription-plans',    label: 'Subscription plans',   icon: <Tags size={17} /> },
  { view: 'apparel-categories',    label: 'Apparel validation',   icon: <Tags size={17} /> },
  { view: 'branch-map-validation', label: 'Branch map',           icon: <Map size={17} /> },
  { view: 'subscription-report',   label: 'Subscription report',  icon: <BarChart3 size={17} /> },
  { view: 'accounts',              label: 'Accounts',             icon: <Users size={17} /> },
  { view: 'support-tickets',       label: 'Support tickets',      icon: <Headphones size={17} /> },
  { view: 'audit-log',             label: 'Audit log',            icon: <FileText size={17} /> },
];

function NavButton({
  view,
  label,
  icon,
  active,
  isCollapsed,
  onClick,
}: {
  view: ActiveView;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group flex min-h-[2.5rem] w-full items-center gap-3 border-l-2 text-sm transition-all duration-150 ${
        isCollapsed ? 'justify-center px-0' : 'pl-3 pr-4'
      } ${
        active
          ? 'border-bg-taupe bg-bg-sunken font-semibold text-text-ink'
          : 'border-transparent text-text-ink-muted hover:border-border-line-strong hover:bg-bg-sunken hover:text-text-ink'
      }`}
    >
      <span className={`shrink-0 transition-colors ${active ? 'text-bg-taupe' : 'text-text-ink-muted group-hover:text-text-ink-body'}`} aria-hidden="true">
        {icon}
      </span>
      {!isCollapsed && <span>{label}</span>}
    </button>
  );
}

function Sidebar({
  activeView,
  isCollapsed,
  navigate,
  signOut,
}: {
  activeView: ActiveView;
  isCollapsed: boolean;
  navigate: (v: ActiveView) => void;
  signOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex items-center py-6 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
        {isCollapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-bg-taupe text-lg font-bold text-white">
            S
          </div>
        ) : (
          <Image
            src="/sutura-logo-nobg.png"
            alt="Sutura"
            width={160}
            height={52}
            className="h-10 w-auto object-contain object-left"
            priority
          />
        )}
      </div>

      {/* Divider */}
      <div className={`border-t border-border-line ${isCollapsed ? 'mx-2' : 'mx-5'}`} />

      {/* Nav */}
      <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto pb-4" aria-label="Main navigation">
        {navItems.map(({ view, label, icon }) => (
          <NavButton
            key={view}
            view={view}
            label={label}
            icon={icon}
            active={activeView === view}
            isCollapsed={isCollapsed}
            onClick={() => navigate(view)}
          />
        ))}
      </nav>

      {/* Sign out */}
      <div className="border-t border-border-line p-3">
        <button
          onClick={signOut}
          title={isCollapsed ? 'Sign out' : undefined}
          className={`flex w-full items-center gap-3 py-2 text-sm text-text-ink-muted transition-colors hover:text-text-danger ${
            isCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <LogOut size={18} aria-hidden="true" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const router = useRouter();

  // Load sidebar preference
  useEffect(() => {
    const pref = localStorage.getItem('sutura:admin:sidebar:collapsed');
    if (pref === 'true') setIsSidebarCollapsed(true);
  }, []);

  function toggleSidebar() {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sutura:admin:sidebar:collapsed', String(next));
      return next;
    });
  }

  const currentNavItem = navItems.find((n) => n.view === activeView);

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

  function navigate(view: ActiveView) {
    setActiveView(view);
    setMobileNavOpen(false);
    setNotificationOpen(false);
  }

  const quickActions: { view: ActiveView; label: string; value: string | number; detail: string }[] = stats
    ? [
        { view: 'pending-shop',       label: 'Review registrations',  value: stats.pending_registrations, detail: 'Awaiting admin approval' },
        { view: 'active-shops',       label: 'Active shops',          value: stats.active_subscriptions,  detail: 'Currently live on platform' },
        { view: 'subscription-report',label: 'Live reports',          value: 'View',                      detail: 'Revenue & approval activity' },
        { view: 'subscription-plans', label: 'Manage plans',          value: 'Plans',                     detail: 'Pricing and feature perks' },
        { view: 'accounts',           label: 'Account management',    value: stats.total_users,           detail: 'Users, roles and access' },
        { view: 'support-tickets',    label: 'Support tickets',       value: 'Open',                      detail: 'Respond to shop teams' },
      ]
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-bg-canvas">
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside
        className={`hidden shrink-0 border-r border-border-line bg-bg-surface transition-all duration-300 lg:block ${
          isSidebarCollapsed ? 'w-[4.5rem]' : 'w-56'
        }`}
      >
        <Sidebar activeView={activeView} isCollapsed={isSidebarCollapsed} navigate={navigate} signOut={signOut} />
      </aside>

      {/* ── Mobile nav overlay ─────────────────────────────────────────── */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside
            className="relative flex h-full w-[min(17rem,90vw)] flex-col border-r border-border-line bg-bg-surface"
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-4 grid h-9 w-9 place-items-center text-text-ink-muted hover:text-text-ink"
            >
              <X size={19} aria-hidden="true" />
            </button>
            <Sidebar activeView={activeView} isCollapsed={false} navigate={navigate} signOut={signOut} />
          </aside>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Sticky header */}
        <header
          className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center justify-between border-b border-border-line bg-bg-canvas/95 px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="mr-1 grid min-h-9 min-w-9 place-items-center text-text-ink-muted hover:text-text-ink lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden grid min-h-8 min-w-8 place-items-center text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink lg:grid"
            >
              <Menu size={18} aria-hidden="true" />
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-ink-faint hidden sm:block">
                Sutura Admin
              </p>
              <p className="text-sm font-semibold text-text-ink leading-tight">
                {currentNavItem?.label ?? 'Overview'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen((open) => !open)}
                aria-label="Notifications"
                aria-expanded={notificationOpen}
                className="relative grid min-h-9 min-w-9 place-items-center rounded-md text-text-ink-muted transition-colors hover:bg-bg-sunken hover:text-text-ink"
              >
                <Bell size={18} aria-hidden="true" />
                {stats && stats.pending_registrations > 0 && (
                  <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-text-danger px-1 text-[10px] font-bold text-white leading-none">
                    {stats.pending_registrations > 9 ? '9+' : stats.pending_registrations}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div
                  className="fixed inset-0 z-50 flex flex-col bg-bg-surface md:absolute md:inset-auto md:right-0 md:top-11 md:z-30 md:w-88 md:border md:border-border-line md:shadow-none animate-view"
                >
                  <div className="flex items-center justify-between border-b border-border-line px-4 py-4 md:py-3">
                    <p className="text-sm font-semibold text-text-ink">Notifications</p>
                    <div className="flex items-center gap-3">
                      <span className="badge badge-taupe">{stats?.pending_registrations ?? 0} pending</span>
                      <button onClick={() => setNotificationOpen(false)} aria-label="Close" className="md:hidden grid h-8 w-8 place-items-center text-text-ink-muted hover:text-text-ink">
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border-line md:max-h-80">
                    {stats?.notifications.length ? (
                      stats.notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => navigate('pending-shop')}
                          className="block w-full px-4 py-3 text-left transition-colors hover:bg-bg-sunken"
                        >
                          <p className="text-sm font-medium text-text-ink">{notification.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-text-ink-muted">{notification.message}</p>
                          <p className="mt-1.5 text-xs font-semibold text-bg-taupe">Open pending shops →</p>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-6 text-center text-sm text-text-ink-muted">No new registrations.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={signOut}
              className="hidden items-center gap-1.5 px-3 py-2 text-sm text-text-ink-muted transition-colors hover:text-text-ink lg:flex"
            >
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </header>

        {/* Page content — key forces re-mount → triggers animate-view */}
        <div key={activeView} className="animate-view mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 lg:px-8">

          {/* ── Overview ─────────────────────────────────────────────── */}
          {activeView === 'overview' && (
            <div className="mx-auto max-w-5xl">
              <header className="mb-8">
                <p className="text-eyebrow text-eyebrow-accent mb-2">Admin Workspace</p>
                <h1 className="text-display text-[2.5rem] leading-tight text-text-ink">
                  Platform Overview
                </h1>
                <p className="mt-2 text-sm text-text-ink-muted max-w-xl">
                  A high-level view of system health, active subscriptions, and pending tasks.
                </p>
              </header>

              {loading && (
                <div className="space-y-4">
                  <div className="skeleton h-48 w-full rounded" />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="skeleton h-32 rounded" />
                    <div className="skeleton h-32 rounded" />
                    <div className="skeleton h-32 rounded" />
                    <div className="skeleton h-32 rounded" />
                  </div>
                </div>
              )}

              {error && (
                <div className="border-l-2 border-text-danger bg-[#f5e8e5] p-4 text-sm text-text-danger">
                  <p className="font-semibold">Connection Error</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}

              {!loading && !error && stats && (
                <div className="space-y-6">
                  {/* Bento Grid layout */}
                  <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Focal point: Active Shops (Large Card) */}
                    <div className="md:col-span-2 border border-border-line bg-bg-surface p-6 sm:p-8 relative overflow-hidden group">
                      <div className="absolute inset-0 pointer-events-none bg-bg-taupe/5 transition-opacity opacity-0 group-hover:opacity-100" />
                      <p className="text-eyebrow">Total Shops in Sutura</p>
                      <div className="mt-4 flex items-baseline gap-4">
                        <span className="text-figure text-6xl md:text-[5.5rem] font-medium leading-none tracking-tight text-text-ink">
                          {stats.total_shops}
                        </span>
                        <span className="text-sm font-medium text-text-sage">registered</span>
                      </div>
                      <div className="mt-8 flex items-center justify-between border-t border-border-line pt-4">
                        <p className="text-sm text-text-ink-muted">Managing {stats.total_users} registered users</p>
                        <button onClick={() => navigate('active-shops')} className="text-sm font-semibold text-bg-taupe hover:text-taupe-hover">View directory &rarr;</button>
                      </div>
                    </div>

                    {/* Secondary focal: Action needed */}
                    <div className="border border-border-line bg-bg-surface p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <p className="text-eyebrow text-text-danger">Action Required</p>
                        <div className="mt-4 text-figure text-5xl font-medium text-text-ink">
                          {stats.pending_registrations}
                        </div>
                        <p className="mt-2 text-sm text-text-ink-muted">pending shop registrations</p>
                      </div>
                      <button 
                        onClick={() => navigate('pending-shop')}
                        className="mt-6 w-full bg-text-ink text-white py-2.5 px-4 text-sm font-semibold hover:bg-bg-taupe transition-colors"
                      >
                        Review now
                      </button>
                    </div>
                  </div>

                  {/* Stat Strip */}
                  <div className="grid grid-cols-2 gap-px bg-border-line border border-border-line lg:grid-cols-4">
                    {[
                      { label: 'Active Subs', value: stats.active_subscriptions, view: 'subscription-report' as ActiveView },
                      { label: 'Pending Verification', value: stats.pending_verifications, view: 'branch-map-validation' as ActiveView },
                      { label: 'Total Users', value: stats.total_users, view: 'accounts' as ActiveView },
                      { label: 'Support Tickets', value: 'Open', view: 'support-tickets' as ActiveView }
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => navigate(item.view)}
                        className="bg-bg-surface p-5 sm:p-6 cursor-pointer group transition-colors hover:bg-bg-sunken"
                      >
                        <p className="text-eyebrow mb-2">{item.label}</p>
                        <p className="text-figure text-2xl text-text-ink">{item.value}</p>
                        <p className="mt-2 text-xs font-semibold text-text-ink-faint group-hover:text-bg-taupe transition-colors">
                          View details &rarr;
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ── Section views ─────────────────────────────────────────── */}
          {activeView === 'pending-shop'          && <PendingShopsView />}
          {activeView === 'active-shops'          && <ActiveShopsView />}
          {activeView === 'shops'                 && <ShopDirectoryView />}
          {activeView === 'subscription-plans'    && <SubscriptionPlansView />}
          {activeView === 'apparel-categories'    && <ApparelCategoriesView />}
          {activeView === 'branch-map-validation' && <BranchMapView />}
          {activeView === 'subscription-report'   && <SubscriptionReportView />}
          {activeView === 'accounts'              && <AccountsView />}
          {activeView === 'support-tickets'       && <SupportTicketsView />}
          {activeView === 'audit-log'             && <AuditLogView />}
        </div>
      </main>
    </div>
  );
}
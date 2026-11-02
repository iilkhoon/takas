'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  Globe,
  Heart,
  Home,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Plus,
  Repeat2,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
  Wallet,
  Layers,
  Flame,
  Gem, Store as StoreIcon } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { formatQepik } from '@/lib/format';
import { Logo } from './Logo';
import { useAuth } from './Providers';
import { Avatar } from './ui';

const localeLabels: Record<string, string> = { az: 'AZ', en: 'EN', tr: 'TR', ru: 'RU' };
const localeNames: Record<string, string> = { az: 'Azərbaycan', en: 'English', tr: 'Türkçe', ru: 'Русский' };

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onOut]);
}

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={clsx('btn-icon w-auto gap-1 px-2.5 text-sm font-bold', compact && 'h-9')} aria-label="language">
        <Globe className="h-[18px] w-[18px]" />
        {localeLabels[locale]}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border-[2.5px] border-ink bg-white p-1.5 shadow-lift"
          >
            {routing.locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setOpen(false);
                  const search = typeof window !== 'undefined' ? window.location.search : '';
                  start(() => router.replace(`${pathname}${search}`, { locale: l }));
                }}
                className={clsx(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-cream',
                  l === locale && 'bg-cream text-nar-600',
                )}
              >
                {localeNames[l]}
                <span className="text-xs font-bold text-ink-mute">{localeLabels[l]}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <motion.span
      key={n}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-ink bg-nar-500 px-1 font-mono text-[10px] font-bold text-white"
    >
      {n > 99 ? '99+' : n}
    </motion.span>
  );
}

function SearchBar({ className }: { className?: string }) {
  const t = useTranslations('nav');
  const router = useRouter();
  const [q, setQ] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') setQ(new URLSearchParams(window.location.search).get('q') ?? '');
  }, []);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/listings?q=${encodeURIComponent(q.trim())}` : '/listings');
      }}
      className={clsx('group relative', className)}
      role="search"
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute transition group-focus-within:text-nar-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="h-12 w-full rounded-xl border-[2.5px] border-ink bg-white pl-12 pr-14 text-[15px] font-medium placeholder:text-ink-mute transition focus:shadow-[4px_4px_0_0_#0B0B0F] focus:outline-none"
      />
      <button
        type="submit"
        aria-label="search"
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border-2 border-ink bg-zefran-400 text-ink transition hover:bg-nar-500 hover:text-white"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

function UserMenu() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { me, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useClickOutside(ref, () => setOpen(false));
  if (!me) return null;
  const items = [
    { href: `/users/${me.id}`, icon: User, label: t('profile') },
    { href: '/my-listings', icon: Layers, label: t('myListings') },
    { href: '/store', icon: StoreIcon, label: me.store ? t('myStore') : t('openStore') },
    { href: '/offers', icon: Repeat2, label: t('offers') },
    { href: '/favorites', icon: Heart, label: t('favorites') },
    { href: '/matches', icon: Flame, label: t('matches') },
    { href: '/wallet', icon: Wallet, label: t('wallet') },
    { href: '/pricing', icon: Gem, label: t('pricing') },
    { href: '/settings', icon: Settings, label: t('settings') },
    ...(me.role !== 'USER' ? [{ href: '/admin', icon: Shield, label: t('admin') }] : []),
  ];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-2xl p-1 pr-2 transition hover:bg-ink/5" aria-label={t('menu')}>
        <Avatar name={me.name} url={me.avatarUrl} size={36} />
        <ChevronDown className={clsx('h-4 w-4 text-ink-mute transition', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-3xl border-[2.5px] border-ink bg-white shadow-lift"
          >
            <div className="flex items-center gap-3 border-b-[2.5px] border-ink bg-zefran-300 p-4">
              <Avatar name={me.name} url={me.avatarUrl} size={44} />
              <div className="min-w-0">
                <div className="truncate font-bold">{me.name}</div>
                <div className="flex items-center gap-2 text-xs text-ink-mute">
                  <span className="font-bold text-ink">{formatQepik(me.balance, locale)}</span>·
                  <span className="flex items-center gap-0.5">
                    <Sparkles className="h-3 w-3 text-zefran-500" />
                    {me.boostCredits}
                  </span>
                  {me.plan === 'PLUS' && <span className="badge bg-lale-500 py-0.5 text-white">Plus</span>}
                </div>
              </div>
            </div>
            <div className="p-1.5">
              {items.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-cream hover:text-ink"
                >
                  <it.icon className="h-[18px] w-[18px]" />
                  {it.label}
                </Link>
              ))}
              <button
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  router.push('/');
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-nar-600 transition hover:bg-nar-100"
              >
                <LogOut className="h-[18px] w-[18px]" />
                {t('logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const t = useTranslations('nav');
  const { me, counters, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={clsx('sticky top-0 z-40 border-b-[2.5px] border-ink transition-colors duration-200', scrolled ? 'bg-white' : 'bg-cream')}>
      <div className="container flex h-16 items-center gap-3 md:h-[72px] md:gap-5">
        <Link href="/" className="shrink-0" aria-label="Dəyiş">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          <Link href="/listings" className="btn btn-ghost btn-sm">
            <LayoutGrid className="h-4 w-4" />
            {t('explore')}
          </Link>
          <Link href="/discover" className="btn btn-ghost btn-sm">
            <Flame className="h-4 w-4 text-nar-500" />
            {t('discover')}
          </Link>
          <Link href="/stores" className="btn btn-ghost btn-sm">
            <StoreIcon className="h-4 w-4 text-lale-500" />
            {t('stores')}
          </Link>
        </nav>

        <SearchBar className="hidden flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageSwitcher />
          {me ? (
            <>
              <Link href="/messages" className="btn-icon relative hidden md:inline-flex" aria-label={t('messages')}>
                <MessageCircle className="h-[22px] w-[22px]" />
                <CountBadge n={counters.unreadMessages} />
              </Link>
              <Link href="/offers" className="btn-icon relative hidden md:inline-flex" aria-label={t('offers')}>
                <Repeat2 className="h-[22px] w-[22px]" />
                <CountBadge n={counters.pendingOffers} />
              </Link>
              <Link href="/notifications" className="btn-icon relative" aria-label={t('notifications')}>
                <Bell className="h-[22px] w-[22px]" />
                <CountBadge n={counters.unreadNotifications} />
              </Link>
              <div className="hidden md:block">
                <UserMenu />
              </div>
            </>
          ) : (
            !loading && (
              <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                {t('login')}
              </Link>
            )
          )}
          <Link href="/listings/new" className="btn btn-primary btn-sm ml-1 hidden md:inline-flex">
            <Plus className="h-4 w-4" strokeWidth={3} />
            {t('post')}
          </Link>
        </div>
      </div>
      <div className="container pb-3 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}

export function MobileNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { me, counters } = useAuth();
  const items = [
    { href: '/', icon: Home, label: t('home') },
    { href: '/discover', icon: Flame, label: t('discover') },
    { href: '/listings/new', icon: Plus, label: t('post'), primary: true },
    { href: '/messages', icon: MessageCircle, label: t('messages'), badge: counters.unreadMessages + counters.pendingOffers },
    { href: me ? '/account' : '/login', icon: User, label: me ? t('profile') : t('login') },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-ink bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid h-16 grid-cols-5">
        {items.map((it) => {
          const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href);
          if (it.primary)
            return (
              <Link key={it.href} href={it.href} className="flex items-center justify-center" aria-label={it.label}>
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-ink bg-zefran-400 text-ink shadow-[3px_3px_0_0_#0B0B0F] transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
                  <Plus className="h-7 w-7" strokeWidth={3} />
                </span>
              </Link>
            );
          return (
            <Link key={it.href} href={it.href} className={clsx('relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold', active ? 'text-ink' : 'text-ink-mute')}>
              <span className="relative">
                <it.icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                {!!it.badge && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-ink bg-nar-500 px-1 text-[9px] text-white">
                    {it.badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-1">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

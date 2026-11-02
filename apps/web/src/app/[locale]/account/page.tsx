'use client';

import { ChevronRight, Flame, Gem, Heart, Layers, LogOut, Repeat2, Settings, Shield, User, Wallet, Bell, LayoutGrid, Store as StoreIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { formatQepik } from '@/lib/format';
import { useAuth } from '@/components/Providers';
import { Avatar, LevelBadge } from '@/components/ui';

export default function AccountPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { me } = useRequireAuth();
  const { logout, counters } = useAuth();
  const router = useRouter();
  if (!me) return null;
  const items = [
    { href: `/users/${me.id}`, icon: User, label: t('profile') },
    { href: '/my-listings', icon: Layers, label: t('myListings') },
    { href: '/store', icon: StoreIcon, label: me.store ? t('myStore') : t('openStore') },
    { href: '/offers', icon: Repeat2, label: t('offers'), badge: counters.pendingOffers },
    { href: '/notifications', icon: Bell, label: t('notifications'), badge: counters.unreadNotifications },
    { href: '/favorites', icon: Heart, label: t('favorites') },
    { href: '/matches', icon: Flame, label: t('matches') },
    { href: '/listings', icon: LayoutGrid, label: t('explore') },
    { href: '/stores', icon: StoreIcon, label: t('stores') },
    { href: '/wallet', icon: Wallet, label: t('wallet') },
    { href: '/pricing', icon: Gem, label: t('pricing') },
    { href: '/settings', icon: Settings, label: t('settings') },
    ...(me.role !== 'USER' ? [{ href: '/admin', icon: Shield, label: t('admin') }] : []),
  ];
  return (
    <div className="container max-w-xl py-6">
      <div className="card flex items-center gap-4 p-5">
        <Avatar name={me.name} url={me.avatarUrl} size={60} />
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-bold">{me.name}</div>
          <div className="mt-1 flex items-center gap-2">
            <LevelBadge level={me.level} />
            <span className="text-sm font-bold">{formatQepik(me.balance, locale)}</span>
          </div>
        </div>
      </div>
      <div className="card mt-4 divide-y-2 divide-ink overflow-hidden">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="flex items-center gap-3 px-5 py-4 font-semibold transition hover:bg-cream">
            <it.icon className="h-5 w-5 text-ink-soft" />
            {it.label}
            {!!it.badge && <span className="ml-auto rounded-full border-2 border-ink bg-nar-500 px-2 py-0.5 font-mono text-xs font-bold text-white">{it.badge}</span>}
            <ChevronRight className={`h-4 w-4 text-ink-mute ${it.badge ? '' : 'ml-auto'}`} />
          </Link>
        ))}
        <button onClick={async () => { await logout(); router.push('/'); }} className="flex w-full items-center gap-3 px-5 py-4 font-semibold text-nar-600 transition hover:bg-nar-100">
          <LogOut className="h-5 w-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );
}

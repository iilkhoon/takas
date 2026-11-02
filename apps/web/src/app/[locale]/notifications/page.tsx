'use client';

import useSWR from 'swr';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks';
import { timeAgo } from '@/lib/format';
import { useAuth } from '@/components/Providers';
import { EmptyState, Emoji, Skeleton } from '@/components/ui';
import type { Notification } from '@/lib/types';

const ICON: Record<string, string> = {
  offer_received: 'wrapped_gift',
  offer_accepted: 'handshake',
  offer_rejected: 'locked',
  offer_countered: 'counterclockwise_arrows_button',
  offer_cancelled: 'locked',
  trade_completed: 'party_popper',
  confirm_requested: 'bell',
  review_received: 'star',
  message: 'speech_balloon',
  listing_favorited: 'red_heart',
  loyalty_reward: 'trophy',
  referral_reward: 'money_bag',
  listing_rejected: 'shield',
  welcome: 'waving_hand',
  match_found: 'fire',
};

function hrefFor(n: Notification) {
  const d = n.data as Record<string, string>;
  if (n.type === 'message' && d.conversationId) return `/messages/${d.conversationId}`;
  if (n.type.startsWith('offer') || n.type.startsWith('trade') || n.type === 'confirm_requested' || n.type === 'review_received') return '/offers';
  if ((n.type === 'listing_favorited' || n.type === 'listing_rejected') && d.listingId) return `/listings/${d.listingId}`;
  if (n.type === 'loyalty_reward' || n.type === 'referral_reward' || n.type === 'welcome') return '/wallet';
  return '/';
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const { ready } = useRequireAuth();
  const { refresh } = useAuth();
  const { data, mutate } = useSWR<{ items: Notification[] }>(ready ? '/notifications' : null);

  const markAll = async () => {
    await api('/notifications/read', { method: 'POST', body: {} });
    mutate();
    refresh();
  };

  return (
    <div className="container max-w-3xl py-6 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-black">{t('title')}</h1>
        {data?.items.some((n) => !n.readAt) && (
          <button onClick={markAll} className="btn btn-ghost btn-sm">
            <CheckCheck className="h-4 w-4" />
            {t('markAll')}
          </button>
        )}
      </div>
      <div className="mt-6 space-y-2">
        {!data ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-3xl" />)
        ) : data.items.length === 0 ? (
          <EmptyState emoji="bell" title={t('empty')} />
        ) : (
          data.items.map((n, i) => {
            const d = n.data as Record<string, string | number>;
            const text = t.has(`t.${n.type}`) ? t(`t.${n.type}`, { title: String(d.title ?? ''), rating: String(d.rating ?? ''), preview: String(d.preview ?? ''), boosts: String(d.boosts ?? '') }) : n.type;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
                <Link
                  href={hrefFor(n)}
                  onClick={() => !n.readAt && api('/notifications/read', { method: 'POST', body: { ids: [n.id] } }).then(() => refresh())}
                  className={clsx('flex items-center gap-4 rounded-3xl border p-4 transition hover:shadow-card', n.readAt ? 'border-line bg-white/60' : 'border-nar-200 bg-white')}
                >
                  <span className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', n.readAt ? 'bg-cream' : 'bg-nar-100')}>
                    <Emoji name={ICON[n.type] ?? 'bell'} size={30} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={clsx('text-sm', !n.readAt && 'font-bold')}>{text}</p>
                    <p className="mt-0.5 text-xs text-ink-mute">{timeAgo(n.createdAt, locale)}</p>
                  </div>
                  {!n.readAt && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-nar-500" />}
                </Link>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

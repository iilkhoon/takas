'use client';

import { useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { OfferCard } from '@/components/OfferCard';
import { EmptyState, Skeleton } from '@/components/ui';
import type { Offer } from '@/lib/types';

export default function OffersPage() {
  const t = useTranslations('offer');
  const tn = useTranslations('nav');
  const { ready } = useRequireAuth();
  const [box, setBox] = useState<'incoming' | 'outgoing'>('incoming');
  const [status, setStatus] = useState<'active' | 'closed'>('active');
  const { data, mutate, isLoading } = useSWR<{ items: Offer[] }>(ready ? `/offers?box=${box}&status=${status}` : null, { refreshInterval: 20000 });

  return (
    <div className="container max-w-4xl py-6 md:py-10">
      <h1 className="font-display text-3xl font-black">{tn('offers')}</h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-2xl bg-white p-1 ring-1 ring-line">
          {(['incoming', 'outgoing'] as const).map((b) => (
            <button key={b} onClick={() => setBox(b)} className={clsx('relative rounded-xl px-5 py-2.5 text-sm font-bold transition', box === b ? 'text-white' : 'text-ink-soft')}>
              {box === b && <motion.span layoutId="box" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <span className="relative">{t(b)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['active', 'closed'] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={clsx('chip', status === s && 'chip-active')}>
              {t(s)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {isLoading || !data ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
        ) : data.items.length === 0 ? (
          <EmptyState
            emoji="wrapped_gift"
            title={t('empty')}
            sub={t('emptySub')}
            action={
              <Link href="/matches" className="btn btn-primary">
                {tn('matches')}
              </Link>
            }
          />
        ) : (
          data.items.map((o) => <OfferCard key={o.id} offer={o} onChange={() => mutate()} />)
        )}
      </div>
    </div>
  );
}

'use client';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { formatAzn } from '@/lib/format';
import { EmptyState, Emoji, Skeleton, Avatar } from '@/components/ui';
import type { Category, Image, ListingCard } from '@/lib/types';

interface Match {
  score: number;
  twoWay: boolean;
  mine: { id: string; title: string; estimatedValue: number; image: Image | null; category: Category };
  theirs: ListingCard;
}

export default function MatchesPage() {
  const t = useTranslations('matches');
  const tn = useTranslations('nav');
  const locale = useLocale();
  const { ready } = useRequireAuth();
  const { data } = useSWR<{ items: Match[] }>(ready ? '/listings/matches' : null);

  return (
    <div className="container max-w-5xl py-6 md:py-10">
      <div className="flex items-center gap-3">
        <Emoji name="fire" size={44} />
        <div>
          <h1 className="font-display text-3xl font-black">{t('title')}</h1>
          <p className="text-ink-soft">{t('sub')}</p>
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {!data ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-3xl" />)
        ) : data.items.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState emoji="crystal_ball" title={t('empty')} sub={t('emptySub')} action={<Link href="/listings/new" className="btn btn-primary">{tn('post')}</Link>} />
          </div>
        ) : (
          data.items.map((m, i) => (
            <motion.div key={m.theirs.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04 }} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <Zap className="h-4 w-4 fill-zefran-400 text-zefran-500" />
                  {t('match', { score: m.score })}
                </span>
                {m.twoWay && <span className="badge bg-xezer-500 text-white">{t('twoWay')}</span>}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
                <Link href={`/listings/${m.mine.id}`} className="min-w-0 text-center">
                  <div className="mx-auto aspect-square w-full max-w-[120px] overflow-hidden rounded-2xl bg-cream">
                    {m.mine.image ? <img src={m.mine.image.thumbUrl} alt="" className="h-full w-full object-cover" /> : <Emoji name={m.mine.category.icon} size={80} />}
                  </div>
                  <div className="mt-2 text-[11px] font-extrabold uppercase text-ink-mute">{t('yours')}</div>
                  <div className="truncate text-sm font-bold">{m.mine.title}</div>
                  <div className="text-xs font-bold text-nar-600">{formatAzn(m.mine.estimatedValue, locale)}</div>
                </Link>
                <motion.span animate={{ rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                  <ArrowLeftRight className="h-5 w-5" />
                </motion.span>
                <Link href={`/listings/${m.theirs.id}`} className="min-w-0 text-center">
                  <div className="mx-auto aspect-square w-full max-w-[120px] overflow-hidden rounded-2xl bg-cream">
                    {m.theirs.image ? <img src={m.theirs.image.thumbUrl} alt="" className="h-full w-full object-cover" /> : <Emoji name={m.theirs.category.icon} size={80} />}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-extrabold uppercase text-ink-mute">
                    <Avatar name={m.theirs.owner.name} url={m.theirs.owner.avatarUrl} size={14} />
                    {m.theirs.owner.name.split(' ')[0]}
                  </div>
                  <div className="truncate text-sm font-bold">{m.theirs.title}</div>
                  <div className="text-xs font-bold text-nar-600">{formatAzn(m.theirs.estimatedValue, locale)}</div>
                </Link>
              </div>
              <div className="px-4 pb-4">
                <Link href={`/listings/${m.theirs.id}`} className="btn btn-primary btn-sm w-full">{t('offer')}</Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

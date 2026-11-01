'use client';

import { useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { Plus, Rocket, Sparkles, Eye, Heart, Repeat2, Pencil } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks';
import { formatAzn, timeAgo } from '@/lib/format';
import { useAuth, useErrorText, useMeta } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { EmptyState, Emoji, Skeleton, Spinner } from '@/components/ui';
import type { ListingCard } from '@/lib/types';

export default function MyListingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { ready } = useRequireAuth();
  const { me, refresh } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const errText = useErrorText();
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [busy, setBusy] = useState<string | null>(null);
  const { data, mutate } = useSWR<{ items: ListingCard[] }>(ready ? `/listings/mine?status=${tab}` : null);
  const { data: all } = useSWR<{ items: ListingCard[] }>(ready ? '/listings/mine?status=active' : null);

  const limit = me?.plan === 'PLUS' ? meta?.pricing.plusActiveListings : meta?.pricing.freeActiveListings;
  const action = async (id: string, kind: 'bump' | 'vip') => {
    setBusy(id + kind);
    try {
      await api(`/listings/${id}/${kind}`, { method: 'POST' });
      toast(kind === 'bump' ? t('listing.bumpOk') : t('listing.vipOk'));
      mutate();
      refresh();
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container max-w-5xl py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black">{t('myListings.title')}</h1>
          {me && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="badge bg-white normal-case tracking-normal text-ink-soft ring-1 ring-line">
                {t('myListings.limit', { count: all?.items.length ?? 0, limit: limit ?? '…' })}
              </span>
              <span className="badge bg-zefran-100 normal-case tracking-normal text-zefran-800">
                <Sparkles className="h-3 w-3" />
                {t('myListings.credits', { count: me.boostCredits })}
              </span>
            </div>
          )}
        </div>
        <Link href="/listings/new" className="btn btn-primary">
          <Plus className="h-4 w-4" strokeWidth={3} />
          {t('nav.post')}
        </Link>
      </div>
      <div className="mt-6 flex gap-2">
        {(['active', 'archived'] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={clsx('chip', tab === k && 'chip-active')}>
            {t(`myListings.${k}`)}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {!data ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)
        ) : data.items.length === 0 ? (
          <EmptyState emoji="package" title={t('myListings.empty')} sub={t('myListings.emptySub')} action={<Link href="/listings/new" className="btn btn-primary">{t('nav.post')}</Link>} />
        ) : (
          data.items.map((l) => (
            <div key={l.id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
              <Link href={`/listings/${l.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream">
                  {l.image ? <img src={l.image.thumbUrl} alt="" className="h-full w-full object-cover" /> : <Emoji name={l.category.icon} size={80} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {l.isVip && <span className="badge bg-zefran-400 text-ink">VIP</span>}
                    <span className={clsx('badge', l.status === 'ACTIVE' ? 'bg-xezer-50 text-xezer-700' : 'bg-ink/5 text-ink-mute')}>{t(`lstatus.${l.status}`)}</span>
                  </div>
                  <div className="mt-1 truncate font-bold">{l.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-ink-mute">
                    <span className="font-bold text-nar-600">{formatAzn(l.estimatedValue, locale)}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{l.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{l.favorites}</span>
                    <span className="flex items-center gap-1"><Repeat2 className="h-3.5 w-3.5" />{l.offers}</span>
                    <span>{timeAgo(l.bumpedAt, locale)}</span>
                  </div>
                </div>
              </Link>
              <div className="flex shrink-0 gap-2">
                <Link href={`/listings/${l.id}/edit`} className="btn btn-outline btn-sm" aria-label={t('common.edit')}>
                  <Pencil className="h-4 w-4" />
                </Link>
                {l.status === 'ACTIVE' && (
                  <>
                    <button className="btn btn-teal btn-sm" disabled={!!busy} onClick={() => action(l.id, 'bump')}>
                      {busy === l.id + 'bump' ? <Spinner className="h-4 w-4" /> : <Rocket className="h-4 w-4" />}
                      {t('listing.bump')}
                    </button>
                    <button className="btn btn-gold btn-sm" disabled={!!busy} onClick={() => action(l.id, 'vip')}>
                      {busy === l.id + 'vip' ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      VIP
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Check, Minus, Plus, Scale } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { formatAzn } from '@/lib/format';
import type { ListingCard, SwapType } from '@/lib/types';
import { SwapBadge } from './Tags';
import { useErrorText } from './Providers';
import { useToast } from './Toast';
import { Emoji, Spinner } from './ui';

export interface ComposerTarget {
  id: string;
  title: string;
  estimatedValue: number;
  acceptsCash: boolean;
  swapType?: SwapType;
  extraCash?: number;
  image: { thumbUrl: string } | null;
  icon: string;
}

export function FairnessMeter({ target, offered, perspective = 'offerer' }: { target: number; offered: number; perspective?: 'offerer' | 'receiver' }) {
  const t = useTranslations('offer');
  const locale = useLocale();
  const ratio = target > 0 ? offered / target : offered > 0 ? 2 : 1;
  const pos = Math.max(0, Math.min(1, ratio / 2)); // 0..2 → 0..1
  const fair = ratio >= 0.85 && ratio <= 1.2;
  const low = ratio < 0.85;
  const label =
    offered <= 0 ? t('fairEmpty') : fair ? t('fairGreat') : low === (perspective === 'offerer') ? t('fairLowYou') : t('fairHighYou');
  return (
    <div className="rounded-3xl border-[2.5px] border-ink bg-cream p-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-bold">
          <Scale className="h-4 w-4 text-lale-500" />
          {t('fairness')}
        </span>
        <span className={clsx('font-bold', offered <= 0 ? 'text-ink-mute' : fair ? 'text-xezer-600' : 'text-zefran-700')}>{label}</span>
      </div>
      <div className="relative mt-3 flex h-4 overflow-hidden rounded-full border-2 border-ink">
        <div className="h-full w-[42.5%] bg-nar-300" />
        <div className="h-full w-[17.5%] border-x-2 border-ink bg-xezer-400" />
        <div className="h-full flex-1 bg-zefran-300" />
      </div>
      <div className="relative -mt-4 h-4">
        <motion.div
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-white shadow-sm"
          animate={{ left: `${pos * 100}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-xs font-semibold text-ink-mute">
        <span>
          {t('valueOffered')}: <b className="text-ink">{formatAzn(offered, locale)}</b>
        </span>
        <span>
          {t('valueTarget')}: <b className="text-ink">{formatAzn(target, locale)}</b>
        </span>
      </div>
    </div>
  );
}

/**
 * Takas təklifi və ya əks-təklif hazırlamaq üçün forma.
 * - mode="new": mənim aktiv elanlarımdan seçirəm
 * - mode="counter": təklif edənin (fromUser) elanlarından seçilir
 */
export function OfferComposer({
  target,
  mode = 'new',
  offerId,
  fromUserId,
  isOfferer = true,
  initialItems = [],
  initialCash = 0,
  onDone,
}: {
  target: ComposerTarget;
  mode?: 'new' | 'counter';
  offerId?: string;
  fromUserId?: string;
  isOfferer?: boolean;
  initialItems?: string[];
  initialCash?: number;
  onDone: (res: { id: string; conversationId?: string }) => void;
}) {
  const t = useTranslations('offer');
  const tc = useTranslations('common');
  const locale = useLocale();
  const toast = useToast();
  const errText = useErrorText();
  const source = mode === 'new' ? '/listings/mine?status=active' : `/listings?owner=${fromUserId}&limit=48`;
  const { data, isLoading } = useSWR<{ items: ListingCard[] }>(source);
  const items = useMemo(() => (data?.items ?? []).filter((l) => l.status === 'ACTIVE' && l.id !== target.id), [data, target.id]);

  const [selected, setSelected] = useState<string[]>(initialItems);
  const swapType: SwapType = target.swapType ?? (target.acceptsCash ? 'ANY' : 'EVEN');
  // Elanın takas növünə görə icazə verilən pul istiqamətləri (müsbət = təklif edən əlavə edir)
  const allowed: ('none' | 'pos' | 'neg')[] =
    swapType === 'EVEN' ? ['none'] : swapType === 'WANT_EXTRA' ? ['none', 'pos'] : swapType === 'PAY_EXTRA' ? ['none', 'neg'] : ['none', 'pos', 'neg'];
  const defaultMode: 'none' | 'pos' | 'neg' =
    initialCash > 0 ? 'pos' : initialCash < 0 ? 'neg' : mode === 'new' && swapType === 'WANT_EXTRA' && target.extraCash ? 'pos' : mode === 'new' && swapType === 'PAY_EXTRA' && target.extraCash ? 'neg' : 'none';
  const [cashMode, setCashMode] = useState<'none' | 'pos' | 'neg'>(allowed.includes(defaultMode) ? defaultMode : 'none');
  const [cash, setCash] = useState(Math.abs(initialCash) || (mode === 'new' && defaultMode !== 'none' ? target.extraCash ?? 0 : 0));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const signedCash = cashMode === 'pos' ? cash : cashMode === 'neg' ? -cash : 0;
  const itemsValue = items.filter((i) => selected.includes(i.id)).reduce((s, i) => s + i.estimatedValue, 0);
  const offered = itemsValue + signedCash;

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 5 ? s : [...s, id]));

  const submit = async () => {
    setBusy(true);
    try {
      const body = { offeredListingIds: selected, cashAmount: signedCash, message };
      const res =
        mode === 'new'
          ? await api<{ id: string; conversationId: string }>('/offers', { method: 'POST', body: { ...body, listingId: target.id } })
          : await api<{ id: string }>(`/offers/${offerId}/counter`, { method: 'POST', body });
      toast(mode === 'new' ? t('sent') : t('counterSent'));
      onDone(res);
    } catch (e) {
      toast(errText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const posLabel = isOfferer ? t('iAdd') : t('theyAdd');
  const negLabel = isOfferer ? t('iAsk') : t('iAdd');

  return (
    <div className="space-y-5">
      {/* Hədəf */}
      <div className="flex items-center gap-3 rounded-3xl border-[2.5px] border-ink p-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream">
          {target.image ? <img src={target.image.thumbUrl} alt="" className="h-full w-full object-cover" /> : <Emoji name={target.icon} size={64} />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-mute">{isOfferer ? t('youGet') : t('youGive')}</div>
          <div className="truncate font-bold">{target.title}</div>
          <div className="text-sm font-bold text-nar-600">≈ {formatAzn(target.estimatedValue, locale)}</div>
        </div>
      </div>

      {/* Əşya seçimi */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label mb-0">{isOfferer ? t('youGive') : t('theyGive')}</span>
          <span className="text-xs font-semibold text-ink-mute">{t('pickItems')}</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton aspect-square" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border-[2.5px] border-dashed border-ink p-4 text-center text-sm text-ink-soft">
            {t('noItems')}
            {mode === 'new' && (
              <div className="mt-3">
                <Link href="/listings/new" className="btn btn-outline btn-sm">
                  <Plus className="h-4 w-4" /> {t('postFirst')}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((it) => {
              const on = selected.includes(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  className={clsx(
                    'group relative overflow-hidden rounded-2xl border-2 text-left transition',
                    on ? 'border-ink bg-zefran-300 shadow-sm -translate-y-0.5' : 'border-ink/25 hover:border-ink',
                  )}
                >
                  <div className="aspect-square bg-cream">
                    {it.image ? <img src={it.image.thumbUrl} alt="" className="h-full w-full object-cover" /> : <Emoji name={it.category.icon} size={60} className="m-auto" />}
                  </div>
                  <div className="p-1.5">
                    <div className="truncate text-[11px] font-bold">{it.title}</div>
                    <div className="text-[11px] font-bold text-nar-600">{formatAzn(it.estimatedValue, locale)}</div>
                  </div>
                  <span
                    className={clsx(
                      'absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
                      on ? 'border-ink bg-nar-500 text-white' : 'border-ink bg-white/80 text-transparent',
                    )}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pul fərqi */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="label mb-0">{t('addCash')}</span>
          <SwapBadge type={swapType} amount={target.extraCash ?? 0} />
        </div>
        {swapType === 'EVEN' ? (
          <p className="rounded-2xl border-[2.5px] border-ink bg-lale-100 px-4 py-3 text-sm font-semibold text-ink">{t('evenOnly')}</p>
        ) : (
          <>
            {swapType !== 'ANY' && (
              <p className="mb-2 text-xs font-semibold text-ink-mute">{t(swapType === 'WANT_EXTRA' ? (isOfferer ? 'hintWantExtra' : 'hintWantExtraOwner') : isOfferer ? 'hintPayExtra' : 'hintPayExtraOwner')}</p>
            )}
            <div className={clsx('grid gap-1 rounded-2xl border-[2.5px] border-ink bg-cream p-1', allowed.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
              {(
                [
                  ['none', t('noCash')],
                  ['pos', posLabel],
                  ['neg', negLabel],
                ] as const
              ).filter(([k]) => allowed.includes(k)).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCashMode(k)}
                  className={clsx('relative rounded-xl px-2 py-2 text-xs font-bold transition sm:text-sm', cashMode === k ? 'text-white' : 'text-ink-soft hover:text-ink')}
                >
                  {cashMode === k && <motion.span layoutId={`cash-${mode}`} className="absolute inset-0 rounded-xl bg-ink" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
            {cashMode !== 'none' && (
              <div className="mt-2 flex items-center gap-2">
                <button type="button" className="btn btn-outline btn-sm h-12 w-12 p-0" onClick={() => setCash((c) => Math.max(0, c - 10))} aria-label="-10">
                  <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={cash || ''}
                    onChange={(e) => setCash(Math.max(0, Math.min(1_000_000, Number(e.target.value) || 0)))}
                    className="input text-center font-display text-lg font-bold"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-ink-mute">₼</span>
                </div>
                <button type="button" className="btn btn-outline btn-sm h-12 w-12 p-0" onClick={() => setCash((c) => c + 10)} aria-label="+10">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <FairnessMeter target={target.estimatedValue} offered={offered} perspective={isOfferer ? 'offerer' : 'receiver'} />

      <div>
        <label className="label" htmlFor="offer-msg">
          {t('message')} <span className="font-normal text-ink-mute">({tc('optional')})</span>
        </label>
        <textarea id="offer-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} className="input resize-none" placeholder={t('messagePh')} />
      </div>

      <button onClick={submit} disabled={busy || (selected.length === 0 && signedCash <= 0)} className="btn btn-primary btn-lg w-full">
        {busy ? <Spinner /> : mode === 'new' ? t('send') : t('counter')}
      </button>
    </div>
  );
}

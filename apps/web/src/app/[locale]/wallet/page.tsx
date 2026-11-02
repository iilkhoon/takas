'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Copy, CreditCard, Gift, Sparkles, Trophy, Users, Wallet as WalletIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks';
import { formatDate, formatQepik } from '@/lib/format';
import { useAuth, useErrorText, useMeta } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { Emoji, Skeleton, Spinner } from '@/components/ui';
import type { Me } from '@/lib/types';

interface Tx { id: string; type: string; status: string; amount: number; provider: string; meta: Record<string, unknown>; createdAt: string }

function WalletInner() {
  const t = useTranslations('wallet');
  const tc = useTranslations('common');
  const tl = useTranslations('listing');
  const locale = useLocale();
  const { ready } = useRequireAuth();
  const { refresh } = useAuth();
  const meta = useMeta();
  const toast = useToast();
  const errText = useErrorText();
  const sp = useSearchParams();
  const router = useRouter();
  const { data, mutate } = useSWR<{ user: Me; transactions: Tx[]; loyalty: { every: number; progress: number; remaining: number } }>(ready ? '/wallet' : null);
  const { data: refs } = useSWR<{ items: { id: string; name: string; createdAt: string; referralRewarded: boolean }[] }>(ready ? '/users/me/referrals' : null);
  const [pack, setPack] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  // Test (mock) ödənişindən qayıdış
  useEffect(() => {
    const id = sp.get('mockPay');
    if (!ready || !id || handled.current) return;
    handled.current = true;
    toast(t('payingMock'), 'info');
    api('/wallet/mock-complete', { method: 'POST', body: { orderId: id } })
      .then(() => {
        toast(t('topupOk'));
        mutate();
        refresh();
      })
      .catch((e) => toast(errText(e), 'error'))
      .finally(() => router.replace('/wallet'));
  }, [sp, ready, toast, t, mutate, refresh, errText, router]);

  useEffect(() => {
    if (sp.get('paid') === '1') toast(t('topupOk'));
  }, [sp, toast, t]);

  const topup = async () => {
    if (!pack) return;
    setBusy(true);
    try {
      const r = await api<{ redirectUrl: string }>('/wallet/topup', { method: 'POST', body: { amount: pack } });
      window.location.href = r.redirectUrl;
    } catch (e) {
      toast(errText(e), 'error');
      setBusy(false);
    }
  };

  if (!data) return <div className="container max-w-4xl space-y-4 py-10"><Skeleton className="h-48 rounded-4xl" /><Skeleton className="h-64 rounded-4xl" /></div>;
  const u = data.user;
  const refLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${u.referralCode}` : '';

  return (
    <div className="container max-w-4xl py-6 md:py-10">
      <h1 className="font-display text-3xl font-black">{t('title')}</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="relative flex flex-col overflow-hidden rounded-4xl bg-ink p-6 text-white">
          <WalletIcon className="h-7 w-7 text-white/60" />
          <div className="mt-6 text-sm font-semibold text-white/60">{t('balance')}</div>
          <div className="font-display text-4xl font-black">{formatQepik(u.balance, locale)}</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-zefran-300" />
            {u.boostCredits} {t('credits')}
          </div>
          <div className="relative mt-auto grid grid-cols-2 gap-2 pt-6">
            <Link href="/my-listings" className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20">
              🚀 {tl('bump')} / VIP
            </Link>
            <Link href="/pricing" className="rounded-2xl bg-lale-500 px-4 py-3 text-sm font-bold transition hover:bg-lale-400">
              💎 Dəyiş Plus
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <CreditCard className="h-5 w-5 text-nar-500" />
            {t('topup')}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {meta?.pricing.topupPacks.map((p) => (
              <button key={p} onClick={() => setPack(p)} className={clsx('rounded-2xl border-2 py-3 font-display text-lg font-bold transition', pack === p ? 'border-nar-500 bg-nar-100 text-nar-600' : 'border-line hover:border-ink/20')}>
                {formatQepik(p, locale)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary mt-4 w-full" disabled={!pack || busy} onClick={topup}>
            {busy && <Spinner className="h-4 w-4" />}
            {t('pay')} {pack ? formatQepik(pack, locale) : ''}
          </button>
          <p className="hint text-center">{t('paymentMethods')}</p>
          {meta?.payments.provider === 'mock' && <p className="mt-2 rounded-xl bg-zefran-100 px-3 py-2 text-center text-xs font-semibold text-zefran-800">{tc('demoNotice')}</p>}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="h-5 w-5 text-zefran-500" />
            {t('loyaltyTitle')}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t('loyaltyText', { every: data.loyalty.every })}</p>
          <div className="mt-5 flex items-center gap-2">
            {Array.from({ length: data.loyalty.every + 1 }).map((_, i) => {
              const done = i < data.loyalty.progress;
              const gift = i === data.loyalty.every;
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: 'spring' }}
                  className={clsx(
                    'flex h-11 flex-1 items-center justify-center rounded-2xl text-sm font-black',
                    gift ? 'border-2 border-ink bg-zefran-400' : done ? 'bg-xezer-500 text-white' : 'bg-cream text-ink-mute',
                  )}
                >
                  {gift ? <Gift className="h-5 w-5" /> : done ? '✓' : i + 1}
                </motion.div>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-bold">{t('loyaltyProgress', { remaining: data.loyalty.remaining })}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <Users className="h-5 w-5 text-lale-500" />
            {t('referralTitle')}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{t('referralText', { boosts: meta?.pricing.referralBoosts ?? 2 })}</p>
          <div className="mt-4 flex gap-2">
            <div className="flex-1 rounded-2xl border-2 border-dashed border-lale-400 bg-lale-100 px-4 py-3 text-center font-display text-xl font-black tracking-[0.25em] text-lale-700">{u.referralCode}</div>
            <button
              className="btn btn-outline"
              onClick={async () => {
                await navigator.clipboard.writeText(refLink);
                toast(tc('copied'));
              }}
              aria-label="copy"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {refs && refs.items.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-bold uppercase text-ink-mute">{t('referrals')} ({refs.items.length})</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {refs.items.map((r) => (
                  <span key={r.id} className={clsx('badge normal-case tracking-normal', r.referralRewarded ? 'bg-xezer-100 text-xezer-700' : 'bg-cream text-ink-soft')}>
                    {r.name} {r.referralRewarded && '🎁'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="card mt-4 p-6">
        <h2 className="font-display text-lg font-bold">{t('history')}</h2>
        {data.transactions.length === 0 ? (
          <div className="py-8 text-center text-ink-mute">
            <Emoji name="coin" size={56} className="mx-auto" />
            <p className="mt-2">{t('noHistory')}</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.transactions.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="font-semibold">{t(`tx.${x.type}`)}{x.provider === 'credit' ? ' (bonus)' : ''}</div>
                  <div className="text-xs text-ink-mute">
                    {formatDate(x.createdAt)} · {t(`txStatus.${x.status}`)}
                  </div>
                </div>
                <span className={clsx('shrink-0 font-display font-bold', x.amount > 0 ? 'text-xezer-600' : x.amount < 0 ? 'text-ink' : 'text-zefran-700')}>
                  {x.amount === 0 ? (x.type === 'BUMP' ? '−1 ✨' : `+${String((x.meta as { boosts?: number }).boosts ?? 1)} ✨`) : `${x.amount > 0 ? '+' : ''}${formatQepik(x.amount, locale)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense>
      <WalletInner />
    </Suspense>
  );
}

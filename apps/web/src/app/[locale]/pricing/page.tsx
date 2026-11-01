'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Gem, Rocket, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatQepik } from '@/lib/format';
import { useAuth, useErrorText, useMeta } from '@/components/Providers';
import { useToast } from '@/components/Toast';
import { Emoji, Spinner } from '@/components/ui';

export default function PricingPage() {
  const t = useTranslations('pricing');
  const tw = useTranslations('wallet');
  const tn = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale();
  const meta = useMeta();
  const { me, refresh } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const errText = useErrorText();
  const [busy, setBusy] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const p = meta?.pricing;
  const plusActive = me?.plan === 'PLUS' && me.planUntil && new Date(me.planUntil) > new Date();

  const buyPlus = async () => {
    if (!me) return router.push('/login?next=/pricing');
    setBusy(true);
    try {
      await api('/wallet/plus', { method: 'POST' });
      toast(t('plusOk'));
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'insufficient_balance') {
        toast(tw('insufficient'), 'error');
        router.push('/wallet');
      } else toast(errText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const Feature = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <li className="flex items-start gap-3">
      <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', light ? 'bg-white text-lale-600' : 'bg-xezer-500 text-white')}>
        <Check className="h-3 w-3" strokeWidth={3.5} />
      </span>
      <span>{children}</span>
    </li>
  );

  return (
    <div className="container max-w-5xl py-8 md:py-14">
      <div className="text-center">
        <Emoji name="rocket" size={72} className="mx-auto animate-float" />
        <h1 className="mt-4 font-display text-3xl font-black sm:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-soft">{t('sub')}</p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="card flex flex-col p-8">
          <h2 className="font-display text-xl font-bold">{t('freeTitle')}</h2>
          <div className="mt-3 font-display text-4xl font-black">{t('freePrice')}</div>
          <ul className="mt-6 flex-1 space-y-3 text-ink-soft">
            <Feature>{t('freeF1', { limit: p?.freeActiveListings ?? 5 })}</Feature>
            <Feature>{t('freeF2')}</Feature>
            <Feature>{t('freeF3')}</Feature>
            <Feature>{t('freeF4')}</Feature>
          </ul>
          <Link href="/listings/new" className="btn btn-outline mt-8 w-full">{tn('post')}</Link>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-lale-500 to-lale-700 p-8 text-white shadow-lift">
          <span className="badge absolute right-5 top-5 bg-zefran-400 text-ink">{t('popular')}</span>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Gem className="h-5 w-5" /> {t('plusTitle')}
          </h2>
          <div className="mt-3 font-display text-4xl font-black">
            {p ? formatQepik(p.plusMonthly, locale) : '…'}
            <span className="text-lg font-bold text-white/70">{tc('perMonth')}</span>
          </div>
          <ul className="mt-6 flex-1 space-y-3 text-white/90">
            <Feature light>{t('plusF1', { limit: p?.plusActiveListings ?? 100 })}</Feature>
            <Feature light>{t('plusF2', { boosts: p?.plusMonthlyBoosts ?? 5 })}</Feature>
            <Feature light>{t('plusF3')}</Feature>
            <Feature light>{t('plusF4')}</Feature>
          </ul>
          {plusActive ? (
            <div className="mt-8 rounded-2xl bg-white/15 px-4 py-3 text-center font-bold">{t('plusActive', { date: formatDate(me!.planUntil!) })}</div>
          ) : null}
          <button className="btn btn-gold mt-3 w-full" disabled={busy} onClick={buyPlus}>
            {busy && <Spinner className="h-4 w-4" />}
            {t('plusCta')}
          </button>
        </div>
      </div>

      <h2 className="section-title mt-16 text-center">{t('boostsTitle')}</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Rocket, title: t('bumpTitle'), desc: t('bumpDesc'), price: p?.bump, c: 'bg-xezer-50 text-xezer-600' },
          { icon: Sparkles, title: t('vipTitle'), desc: t('vipDesc', { days: p?.vipDays ?? 7 }), price: p?.vip7, c: 'bg-zefran-100 text-zefran-700' },
        ].map((s) => (
          <div key={s.title} className="card flex items-center gap-5 p-6">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${s.c}`}>
              <s.icon className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{s.title}</div>
              <div className="text-sm text-ink-soft">{s.desc}</div>
            </div>
            <div className="shrink-0 font-display text-xl font-black">{s.price ? formatQepik(s.price, locale) : '…'}</div>
          </div>
        ))}
      </div>

      <h2 className="section-title mt-16 text-center">{t('faqTitle')}</h2>
      <div className="mx-auto mt-8 max-w-2xl space-y-3">
        {[1, 2, 3, 4].map((i, k) => (
          <div key={i} className="card overflow-hidden">
            <button className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-bold" onClick={() => setFaq(faq === k ? null : k)}>
              {t(`faq${i}q`)}
              <ChevronDown className={clsx('h-5 w-5 shrink-0 transition', faq === k && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {faq === k && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-6 pb-5 text-ink-soft">{t(`faq${i}a`)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Search, Store as StoreIcon, Check } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useAuth, useMeta } from '@/components/Providers';
import { Select } from '@/components/Select';
import { EmptyState, Emoji, Skeleton } from '@/components/ui';
import { StoreCard, type StoreListItem } from '@/components/StoreCard';
import type { Paged } from '@/lib/types';

function OpenStoreCta() {
  const t = useTranslations('stores');
  const meta = useMeta();
  const { me } = useAuth();
  return (
    <div className="relative overflow-hidden rounded-4xl border-[2.5px] border-ink bg-lale-500 p-6 text-white shadow-card sm:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="font-display text-2xl font-black sm:text-3xl">{t('openTitle')}</h2>
          <p className="mt-2 max-w-xl text-white/85">{t('openSub')}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {[t('b1', { count: meta?.pricing.storeActiveListings ?? 50 }), t('b2'), t('b3'), t('b4')].map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm font-bold">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-zefran-400 text-ink">
                  <Check className="h-3 w-3" strokeWidth={4} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <Link href={me?.store ? `/stores/${me.store.slug}` : '/store'} className="btn btn-gold btn-lg justify-self-start">
          <StoreIcon className="h-5 w-5" />
          {me?.store ? t('viewStore') : t('openCta')}
        </Link>
      </div>
    </div>
  );
}

function Stores() {
  const t = useTranslations();
  const locale = useLocale() as 'az';
  const meta = useMeta();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const city = sp.get('city') ?? '';

  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? p.set(k, v) : p.delete(k));
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Axtarış: yazmağı dayandırandan 300ms sonra
  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get('q') ?? '') !== q) set({ q: q || null });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const { data, isLoading } = useSWR<Paged<StoreListItem>>(`/stores?limit=24&${sp.toString()}`, { keepPreviousData: true });

  return (
    <div className="container py-6 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="badge bg-lale-500 text-white">
            <StoreIcon className="h-3 w-3" strokeWidth={3} /> {t('stores.tag')}
          </span>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">{t('stores.title')}</h1>
          <p className="mt-2 text-ink-soft">{t('stores.sub')}</p>
        </div>
        <Link href="/store" className="btn btn-dark">
          <Plus className="h-4 w-4" strokeWidth={3} />
          {t('nav.openStore')}
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-12" placeholder={t('stores.searchPh')} />
        </label>
        <Select value={city} onChange={(e) => set({ city: e.target.value || null })}>
          <option value="">{t('stores.allCities')}</option>
          {meta?.cities.map((c) => (
            <option key={c} value={c}>
              {t(`cities.${c}`)}
            </option>
          ))}
        </Select>
      </div>

      {meta && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
          {meta.categories.slice(0, 12).map((c) => {
            const on = sp.get('category') === c.slug;
            return (
              <button key={c.slug} onClick={() => set({ category: on ? null : c.slug })} className={clsx('chip shrink-0', on && 'chip-active')}>
                <Emoji name={c.icon} size={18} />
                {c.name[locale] ?? c.name.az}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        {isLoading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : data && data.items.length === 0 ? (
          <EmptyState emoji="shopping_bags" title={t('stores.empty')} sub={t('stores.emptySub')} action={<Link href="/store" className="btn btn-primary">{t('stores.openCta')}</Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data?.items.map((s, i) => (
              <StoreCard key={s.id} s={s} index={i} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-14">
        <OpenStoreCta />
      </div>
    </div>
  );
}

export default function StoresPage() {
  return (
    <Suspense fallback={<div className="container py-10" />}>
      <Stores />
    </Suspense>
  );
}

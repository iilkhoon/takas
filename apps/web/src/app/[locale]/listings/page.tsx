'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useMeta } from '@/components/Providers';
import { ListingGrid, ListingGridSkeleton } from '@/components/ListingCard';
import { AdSlot } from '@/components/AdSlot';
import { Select } from '@/components/Select';
import { EmptyState, Emoji } from '@/components/ui';
import type { ListingCard, Paged, Condition } from '@/lib/types';
import { formatNumber } from '@/lib/format';

const CONDITIONS: Condition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'FOR_PARTS'];

function Explore() {
  const t = useTranslations();
  const locale = useLocale() as 'az';
  const meta = useMeta();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const qs = sp.toString();
  const { data, isLoading } = useSWR<Paged<ListingCard> & { vip: ListingCard[] }>(`/listings?limit=24&${qs}`, { keepPreviousData: true });

  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') p.delete(k);
      else p.set(k, v);
    }
    if (!('page' in patch)) p.delete('page');
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const category = sp.get('category') ?? '';
  const activeCat = meta?.categories.find((c) => c.slug === category);
  const page = Number(sp.get('page') ?? 1);
  const activeFilters = ['city', 'condition', 'minValue', 'maxValue', 'wants', 'acceptsCash', 'canShip'].filter((k) => sp.get(k)).length;

  const title = useMemo(() => {
    if (sp.get('q')) return `“${sp.get('q')}”`;
    if (activeCat) return activeCat.name[locale] ?? activeCat.name.az;
    return t('explore.title');
  }, [sp, activeCat, locale, t]);

  const filters = (
    <div className="space-y-5">
      <div>
        <label className="label">{t('listing.city')}</label>
        <Select value={sp.get('city') ?? ''} onChange={(e) => set({ city: e.target.value })}>
          <option value="">{t('cities.allCities')}</option>
          {meta?.cities.map((c) => (
            <option key={c} value={c}>
              {t(`cities.${c}`)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="label">{t('listing.condition')}</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button key={c} onClick={() => set({ condition: sp.get('condition') === c ? null : c })} className={clsx('chip', sp.get('condition') === c && 'chip-active')}>
              {t(`cond.${c}`)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">{t('listing.estimated')}</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="input"
            placeholder={t('explore.minValue')}
            defaultValue={sp.get('minValue') ?? ''}
            onBlur={(e) => set({ minValue: e.target.value })}
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            className="input"
            placeholder={t('explore.maxValue')}
            defaultValue={sp.get('maxValue') ?? ''}
            onBlur={(e) => set({ maxValue: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="label">{t('explore.wantsFilter')}</label>
        <Select value={sp.get('wants') ?? ''} onChange={(e) => set({ wants: e.target.value })}>
          <option value="">{t('explore.wantsAny')}</option>
          {meta?.categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name[locale] ?? c.name.az}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        {(['acceptsCash', 'canShip'] as const).map((k) => (
          <label key={k} className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-3 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-nar-500" checked={sp.get(k) === '1'} onChange={(e) => set({ [k]: e.target.checked ? '1' : null })} />
            {t(`explore.${k}`)}
          </label>
        ))}
      </div>
      {activeFilters > 0 && (
        <button onClick={() => set({ city: null, condition: null, minValue: null, maxValue: null, wants: null, acceptsCash: null, canShip: null })} className="btn btn-ghost btn-sm w-full">
          <X className="h-4 w-4" />
          {t('common.reset')}
        </button>
      )}
    </div>
  );

  return (
    <div className="container py-6 md:py-10">
      {/* Kateqoriya çipləri */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none sm:mx-0 sm:px-0">
        <button onClick={() => set({ category: null })} className={clsx('chip shrink-0', !category && 'chip-active')}>
          {t('explore.allCategories')}
        </button>
        {meta?.categories.map((c) => (
          <button key={c.slug} onClick={() => set({ category: c.slug })} className={clsx('chip shrink-0', category === c.slug && 'chip-active')}>
            <Emoji name={c.icon} size={18} />
            {c.name[locale] ?? c.name.az}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-ink-mute">{data ? t('common.results', { count: formatNumber(data.total, locale) }) : t('common.loading')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawer(true)} className="btn btn-outline btn-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" />
            {t('common.filters')}
            {activeFilters > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nar-500 text-[11px] text-white">{activeFilters}</span>}
          </button>
          <Select value={sp.get('sort') ?? 'new'} onChange={(e) => set({ sort: e.target.value === 'new' ? null : e.target.value })} className="w-44">
            <option value="new">{t('explore.sortNew')}</option>
            <option value="popular">{t('explore.sortPopular')}</option>
            <option value="value_asc">{t('explore.sortValueAsc')}</option>
            <option value="value_desc">{t('explore.sortValueDesc')}</option>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-line bg-white p-5">{filters}</div>
        </aside>

        <div className="min-w-0">
          {data && data.vip.length > 0 && page === 1 && (
            <div className="mb-6 rounded-4xl bg-gradient-to-br from-zefran-100 to-zefran-50 p-4 ring-1 ring-zefran-200">
              <div className="mb-3 font-display text-sm font-bold">⭐ {t('explore.vipStrip')}</div>
              <ListingGrid items={data.vip} className="lg:grid-cols-3 xl:grid-cols-4" />
            </div>
          )}
          {isLoading && !data ? (
            <ListingGridSkeleton count={9} />
          ) : data && data.items.length === 0 ? (
            <EmptyState emoji="magnifying_glass_tilted_left" title={t('explore.noResults')} sub={t('explore.noResultsSub')} />
          ) : (
            data && (
              <>
                <ListingGrid items={data.items.slice(0, 12)} className="lg:grid-cols-3 xl:grid-cols-4" />
                {data.items.length > 12 && (
                  <>
                    <AdSlot placement="search_inline" className="my-6" />
                    <ListingGrid items={data.items.slice(12)} className="lg:grid-cols-3 xl:grid-cols-4" />
                  </>
                )}
              </>
            )
          )}

          {data && data.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => set({ page: String(page - 1) })} className="btn btn-outline btn-sm" aria-label="prev">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: data.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-2">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-ink-mute">…</span>}
                    <button onClick={() => set({ page: String(p) })} className={clsx('btn btn-sm min-w-10', p === page ? 'btn-dark' : 'btn-outline')}>
                      {p}
                    </button>
                  </span>
                ))}
              <button disabled={page >= data.pages} onClick={() => set({ page: String(page + 1) })} className="btn btn-outline btn-sm" aria-label="next">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobil filtr paneli */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-4xl bg-cream p-5 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/15" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">{t('common.filters')}</h2>
                <button onClick={() => setDrawer(false)} className="btn-icon" aria-label="close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filters}
              <button onClick={() => setDrawer(false)} className="btn btn-primary mt-6 w-full">
                {t('explore.showResults')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container py-10"><ListingGridSkeleton /></div>}>
      <Explore />
    </Suspense>
  );
}

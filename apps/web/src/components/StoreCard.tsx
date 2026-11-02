'use client';

import { motion } from 'framer-motion';
import { BadgeCheck, MapPin, Store as StoreIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Avatar } from './ui';
import type { PublicUser, Store } from '@/lib/types';

export type StoreListItem = Store & { owner: PublicUser; activeListings: number; preview: { id: string; thumbUrl: string | null }[] };

export function StoreCard({ s, index = 0 }: { s: StoreListItem; index?: number }) {
  const t = useTranslations();
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }}>
      <Link
        href={`/stores/${s.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border-[2.5px] border-ink bg-white shadow-card transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-lift"
      >
        <div className="relative h-20 border-b-[2.5px] border-ink bg-dots" style={{ backgroundColor: s.coverColor }}>
          <span className="badge absolute right-3 top-3 bg-lale-500 text-white">
            <StoreIcon className="h-3 w-3" strokeWidth={3} />
            {t('stores.tag')}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4">
          <div className="relative z-10 -mt-8 flex items-end gap-3">
            <Avatar name={s.name} url={s.logoUrl} size={64} square className="shadow-sm" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <h3 className="truncate font-display text-lg font-extrabold">{s.name}</h3>
            {s.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-lale-500" />}
          </div>
          {s.tagline && <p className="line-clamp-1 text-sm text-ink-soft">{s.tagline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-ink-mute">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {t(`cities.${s.city}`)}
            </span>
            <span className="font-mono">{t('stores.listingsCount', { count: s.activeListings })}</span>
          </div>
          <div className="mt-auto grid grid-cols-3 gap-2 pt-4">
            {[0, 1, 2].map((i) => {
              const p = s.preview[i];
              return (
                <div key={i} className="aspect-square overflow-hidden rounded-xl border-2 border-ink bg-cream">
                  {p?.thumbUrl ? <img src={p.thumbUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


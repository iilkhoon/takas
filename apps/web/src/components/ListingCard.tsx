'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MapPin, Repeat2, Sparkles, Truck, Banknote } from 'lucide-react';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { formatAzn, timeAgo } from '@/lib/format';
import type { ListingCard as TCard } from '@/lib/types';
import { useAuth, useMeta } from './Providers';
import { Avatar, Emoji, TrustBadges } from './ui';

export function FavoriteButton({ id, initial, className }: { id: string; initial: boolean; className?: string }) {
  const [fav, setFav] = useState(initial);
  const [burst, setBurst] = useState(0);
  const { me } = useAuth();
  const router = useRouter();
  const t = useTranslations('listing');
  return (
    <button
      type="button"
      aria-label={fav ? t('removeFavorite') : t('addFavorite')}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!me) return router.push('/login');
        const next = !fav;
        setFav(next);
        if (next) setBurst((b) => b + 1);
        try {
          const r = await api<{ isFavorite: boolean }>(`/listings/${id}/favorite`, { method: 'POST' });
          setFav(r.isFavorite);
        } catch {
          setFav(!next);
        }
      }}
      className={clsx(
        'relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-110 active:scale-95',
        className,
      )}
    >
      <motion.span key={burst} initial={burst ? { scale: 0.4 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
        <Heart className={clsx('h-5 w-5 transition-colors', fav ? 'fill-nar-500 text-nar-500' : 'text-ink')} />
      </motion.span>
    </button>
  );
}

export function ListingCard({ item, index = 0 }: { item: TCard; index?: number }) {
  const locale = useLocale();
  const t = useTranslations();
  const meta = useMeta();
  const wanted = item.wantedCategories
    .map((slug) => meta?.categories.find((c) => c.slug === slug))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link
        href={`/listings/${item.id}`}
        className={clsx(
          'group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift',
          item.isVip ? 'border-zefran-300 ring-2 ring-zefran-200' : 'border-line',
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
          {item.image ? (
            <img
              src={item.image.thumbUrl}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Emoji name={item.category.icon} size={72} />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {item.isVip && (
              <span className="badge bg-zefran-400 text-ink shadow-sm">
                <Sparkles className="h-3 w-3" /> VIP
              </span>
            )}
            {item.status === 'RESERVED' && <span className="badge bg-ink text-white">{t('lstatus.RESERVED')}</span>}
            {item.status === 'TRADED' && <span className="badge bg-xezer-500 text-white">{t('lstatus.TRADED')}</span>}
          </div>
          <FavoriteButton id={item.id} initial={item.isFavorite} className="absolute right-3 top-3" />
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink-soft shadow-sm backdrop-blur">
            {t(`cond.${item.condition}`)}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-h-[2.5rem] font-sans text-[15px] font-bold leading-tight tracking-normal text-ink">{item.title}</h3>
          </div>
          <p className="mt-1.5 font-display text-lg font-bold text-nar-600">≈ {formatAzn(item.estimatedValue, locale)}</p>

          <div className="mt-3 rounded-2xl bg-cream px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">
              <Repeat2 className="h-3.5 w-3.5 text-xezer-500" />
              {t('listing.wants')}
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-ink-soft">
              {item.openToAnything && !item.wantedText ? t('listing.openToAnything') : item.wantedText || '—'}
            </p>
            {wanted.length > 0 && (
              <div className="mt-1.5 flex -space-x-1.5">
                {wanted.map((c) => (
                  <span key={c!.slug} className="flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-cream" title={c!.name[locale as 'az']}>
                    <Emoji name={c!.icon} size={16} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-ink-mute">
            <span className="flex min-w-0 items-center gap-1.5">
              <Avatar name={item.owner.name} url={item.owner.avatarUrl} size={22} />
              <span className="truncate font-semibold text-ink-soft">{item.owner.name.split(' ')[0]}</span>
              <TrustBadges verified={item.owner.phoneVerified} plus={item.owner.plan === 'PLUS'} size={13} />
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {item.acceptsCash && <Banknote className="hidden h-3.5 w-3.5 text-xezer-500 sm:block" aria-label={t('listing.acceptsCash')} />}
              {item.canShip && <Truck className="hidden h-3.5 w-3.5 text-lale-500 sm:block" aria-label={t('listing.canShip')} />}
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {t(`cities.${item.city}`)}
              </span>
            </span>
          </div>
          <div className="mt-1 text-[11px] text-ink-mute">{timeAgo(item.bumpedAt, locale)}</div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ListingGrid({ items, className }: { items: TCard[]; className?: string }) {
  return (
    <div className={clsx('grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4', className)}>
      {items.map((it, i) => (
        <ListingCard key={it.id} item={it} index={i} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="skeleton aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-14 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

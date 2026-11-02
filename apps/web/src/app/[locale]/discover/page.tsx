'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { Heart, Info, MapPin, Repeat2, RotateCcw, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { formatAzn } from '@/lib/format';
import { useRequireAuth } from '@/lib/hooks';
import { useToast } from '@/components/Toast';
import { Avatar, EmptyState, Emoji, Spinner } from '@/components/ui';
import type { Image, ListingCard } from '@/lib/types';

type Card = ListingCard & { images: Image[]; description: string };

function SwipeCard({ card, onSwipe, active }: { card: Card; onSwipe: (liked: boolean) => void; active: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -30], [1, 0]);
  const [img, setImg] = useState(0);

  const fling = (liked: boolean) => {
    animate(x, liked ? 600 : -600, { duration: 0.32, ease: 'easeIn' }).then(() => onSwipe(liked));
  };

  // Klaviatura ilə idarə
  useEffect(() => {
    if (!active) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') fling(true);
      if (e.key === 'ArrowLeft') fling(false);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, zIndex: active ? 10 : 1 }}
      drag={active ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info: PanInfo) => {
        if (info.offset.x > 120 || info.velocity.x > 600) fling(true);
        else if (info.offset.x < -120 || info.velocity.x < -600) fling(false);
      }}
      initial={{ scale: 0.94, y: 16, opacity: 0 }}
      animate={{ scale: active ? 1 : 0.94, y: active ? 0 : 16, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
    >
      <div className="relative h-full cursor-grab select-none overflow-hidden rounded-4xl border-2 border-ink bg-white shadow-pop active:cursor-grabbing">
        <div className="relative h-[62%] bg-cream-deep">
          {card.images[img] && <img src={card.images[img].url} alt={card.title} className="pointer-events-none h-full w-full object-cover" draggable={false} />}
          {card.images.length > 1 && (
            <>
              <div className="absolute inset-x-3 top-3 flex gap-1">
                {card.images.map((_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-full ${i === img ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
              <button className="absolute inset-y-0 left-0 w-1/3" onClick={() => setImg((i) => Math.max(0, i - 1))} aria-label="prev" />
              <button className="absolute inset-y-0 right-0 w-1/3" onClick={() => setImg((i) => Math.min(card.images.length - 1, i + 1))} aria-label="next" />
            </>
          )}
          <motion.span style={{ opacity: likeOpacity }} className="absolute left-5 top-8 -rotate-12 rounded-2xl border-4 border-xezer-500 bg-white/80 px-4 py-1 font-display text-2xl font-black text-xezer-500">
            ❤ {t('discover.like')}
          </motion.span>
          <motion.span style={{ opacity: nopeOpacity }} className="absolute right-5 top-8 rotate-12 rounded-2xl border-4 border-nar-500 bg-white/80 px-4 py-1 font-display text-2xl font-black text-nar-500">
            ✕ {t('discover.skip')}
          </motion.span>
          <span className="absolute bottom-3 left-3 badge bg-white text-ink">{t(`cond.${card.condition}`)}</span>
        </div>
        <div className="flex h-[38%] flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 font-display text-lg font-bold leading-tight">{card.title}</h2>
            <span className="shrink-0 font-display text-lg font-black text-nar-500">{formatAzn(card.estimatedValue, locale)}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-2xl bg-xezer-100 px-3 py-2 text-sm text-xezer-800">
            <Repeat2 className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1 font-semibold">{card.wantedText || t('listing.openToAnything')}</span>
          </div>
          <div className="mt-auto flex items-center justify-between text-xs text-ink-mute">
            <span className="flex items-center gap-1.5">
              <Avatar name={card.owner.name} url={card.owner.avatarUrl} size={24} />
              <span className="font-semibold text-ink-soft">{card.owner.name}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {t(`cities.${card.city}`)}
            </span>
          </div>
        </div>
      </div>
      {active && (
        <div className="absolute -bottom-24 left-0 right-0 flex items-center justify-center gap-5">
          <button onClick={() => fling(false)} className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-white text-nar-500 shadow-pop transition active:translate-y-1 active:shadow-none" aria-label={t('discover.skip')}>
            <X className="h-8 w-8" strokeWidth={3} />
          </button>
          <Link href={`/listings/${card.id}`} className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-zefran-400 shadow-pop transition active:translate-y-1 active:shadow-none" aria-label={t('discover.details')}>
            <Info className="h-5 w-5" strokeWidth={2.5} />
          </Link>
          <button onClick={() => fling(true)} className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-nar-500 text-white shadow-pop transition active:translate-y-1 active:shadow-none" aria-label={t('discover.like')}>
            <Heart className="h-8 w-8 fill-white" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function DiscoverPage() {
  const t = useTranslations('discover');
  const { ready } = useRequireAuth();
  const toast = useToast();
  const { data, mutate, isLoading } = useSWR<{ items: Card[] }>(ready ? '/listings/discover' : null, { revalidateOnFocus: false });
  const [stack, setStack] = useState<Card[]>([]);

  useEffect(() => {
    if (data) setStack(data.items);
  }, [data]);

  const onSwipe = (card: Card, liked: boolean) => {
    setStack((s) => s.filter((c) => c.id !== card.id));
    api(`/listings/${card.id}/swipe`, { method: 'POST', body: { liked } }).catch(() => {});
    if (liked) toast(t('liked'));
    if (stack.length <= 2) setTimeout(() => mutate(), 400);
  };

  return (
    <div className="container flex flex-col items-center py-6 md:py-10">
      <h1 className="font-display text-3xl font-black">{t('title')} 🔥</h1>
      <p className="mt-1 text-ink-soft">{t('sub')}</p>
      <div className="relative mt-8 h-[520px] w-full max-w-[360px] sm:h-[560px]">
        {!ready || isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-8 w-8 text-nar-500" />
          </div>
        ) : stack.length === 0 ? (
          <div className="flex h-full items-center">
            <EmptyState
              emoji="party_popper"
              title={t('done')}
              sub={t('doneSub')}
              action={
                <button
                  className="btn btn-outline"
                  onClick={async () => {
                    await api('/listings/discover/reset', { method: 'POST' });
                    mutate();
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('restart')}
                </button>
              }
            />
          </div>
        ) : (
          <AnimatePresence>
            {stack
              .slice(0, 3)
              .reverse()
              .map((c, i, arr) => (
                <SwipeCard key={c.id} card={c} active={i === arr.length - 1} onSwipe={(liked) => onSwipe(c, liked)} />
              ))}
          </AnimatePresence>
        )}
      </div>
      <div className="h-28" />
      <div className="flex items-center gap-2 text-xs font-semibold text-ink-mute">
        <Emoji name="sparkles" size={18} /> ← → keyboard
      </div>
    </div>
  );
}

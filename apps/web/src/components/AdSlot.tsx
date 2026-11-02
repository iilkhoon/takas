'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { Megaphone } from 'lucide-react';
import clsx from 'clsx';
import { Link } from '@/i18n/navigation';

type Placement = 'home_top' | 'home_middle' | 'search_inline' | 'listing_sidebar';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * Reklam yeri. Prioritet:
 * 1) Birbaşa satılmış banner (admin paneldən idarə olunur)
 * 2) Google AdSense (NEXT_PUBLIC_ADSENSE_CLIENT təyin olunubsa)
 * 3) "Reklamınız burada" — reklamverən cəlb etmək üçün
 */
export function AdSlot({ placement, className }: { placement: Placement; className?: string }) {
  const t = useTranslations('ads');
  const tc = useTranslations('common');
  const { data, isLoading } = useSWR<{ ad: { id: string; title: string; imageUrl: string; advertiser: string } | null }>(`/ads?placement=${placement}`, {
    revalidateOnFocus: false,
  });
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!data || data.ad || !ADSENSE || !insRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [data]);

  if (isLoading) return <div className={clsx('skeleton h-28 rounded-3xl', className)} />;

  if (data?.ad) {
    return (
      <a href={`/api/v1/ads/${data.ad.id}/click`} target="_blank" rel="noopener sponsored" className={clsx('group relative block overflow-hidden rounded-3xl border-[2.5px] border-ink', className)}>
        <img src={data.ad.imageUrl} alt={data.ad.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink-mute">{tc('sponsored')}</span>
      </a>
    );
  }

  if (ADSENSE) {
    return (
      <div className={clsx('relative overflow-hidden rounded-3xl', className)}>
        <ins ref={insRef} className="adsbygoogle block" data-ad-client={ADSENSE} data-ad-format="auto" data-full-width-responsive="true" />
      </div>
    );
  }

  return (
    <Link
      href="/advertise"
      className={clsx(
        'group flex items-center gap-4 rounded-3xl border-[2.5px] border-dashed border-ink bg-zefran-100 px-5 py-5 transition hover:border-zefran-400',
        className,
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zefran-400 text-ink transition group-hover:rotate-[-8deg]">
        <Megaphone className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-sm font-bold">{t('yourAdHere')}</span>
        <span className="block text-xs text-ink-soft">{t('yourAdHereSub')}</span>
      </span>
      <span className="ml-auto hidden text-[10px] font-bold uppercase tracking-wider text-ink-mute sm:block">{tc('sponsored')}</span>
    </Link>
  );
}

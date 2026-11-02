'use client';

import { BadgeCheck, Store as StoreIcon } from 'lucide-react';
import { SWAP_STYLE } from '@/lib/swap';
export { SWAP_STYLE };
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatAzn } from '@/lib/format';
import type { StoreTagInfo, SwapType } from '@/lib/types';


/**
 * Takas növü nişanı:
 * EVEN → "Başa baş", PAY_EXTRA → "+50 ₼ verir", WANT_EXTRA → "+50 ₼ istəyir", ANY → "Pul fərqi olar"
 */
export function SwapBadge({ type, amount = 0, size = 'sm', className }: { type: SwapType; amount?: number; size?: 'sm' | 'lg'; className?: string }) {
  const t = useTranslations('swap');
  const locale = useLocale();
  const s = SWAP_STYLE[type];
  const Icon = s.icon;
  const label =
    type === 'PAY_EXTRA' && amount > 0
      ? t('paysAmount', { amount: formatAzn(amount, locale) })
      : type === 'WANT_EXTRA' && amount > 0
        ? t('wantsAmount', { amount: formatAzn(amount, locale) })
        : t(`short.${type}`);
  return (
    <span className={clsx('badge whitespace-nowrap', s.cls, size === 'lg' && 'px-3 py-1.5 text-xs', className)}>
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'} strokeWidth={3} />
      {label}
    </span>
  );
}

/** "MAĞAZA" teqi — mağaza hesablarının elanlarında görünür */
export function StoreTag({ store, link = false, className }: { store: StoreTagInfo; link?: boolean; className?: string }) {
  const t = useTranslations('stores');
  const inner = (
    <>
      <StoreIcon className="h-3 w-3" strokeWidth={3} />
      {t('tag')}
      {store.verified && <BadgeCheck className="h-3 w-3" strokeWidth={3} />}
    </>
  );
  const cls = clsx('badge bg-lale-500 text-white', className);
  if (link)
    return (
      <Link href={`/stores/${store.slug}`} className={clsx(cls, 'transition hover:-translate-y-0.5')} onClick={(e) => e.stopPropagation()}>
        {inner}
      </Link>
    );
  return <span className={cls}>{inner}</span>;
}

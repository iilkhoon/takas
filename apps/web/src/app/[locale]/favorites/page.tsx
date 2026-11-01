'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useRequireAuth } from '@/lib/hooks';
import { ListingGrid, ListingGridSkeleton } from '@/components/ListingCard';
import { EmptyState } from '@/components/ui';
import type { ListingCard } from '@/lib/types';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const tn = useTranslations('nav');
  const { ready } = useRequireAuth();
  const { data } = useSWR<{ items: ListingCard[] }>(ready ? '/users/me/favorites' : null);
  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-6 font-display text-3xl font-black">{t('title')} ❤️</h1>
      {!data ? (
        <ListingGridSkeleton />
      ) : data.items.length === 0 ? (
        <EmptyState emoji="red_heart" title={t('empty')} sub={t('emptySub')} action={<Link href="/discover" className="btn btn-primary">{tn('discover')}</Link>} />
      ) : (
        <ListingGrid items={data.items} />
      )}
    </div>
  );
}

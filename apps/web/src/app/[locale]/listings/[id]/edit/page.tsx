'use client';

import { use } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { ListingForm } from '@/components/ListingForm';
import { useRequireAuth } from '@/lib/hooks';
import { Spinner } from '@/components/ui';
import type { ListingDetail } from '@/lib/types';

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('form');
  const { ready } = useRequireAuth();
  const { data } = useSWR<{ listing: ListingDetail }>(ready ? `/listings/${id}` : null);
  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-6 font-display text-3xl font-black">{t('editTitle')}</h1>
      {data ? <ListingForm initial={data.listing} /> : <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-nar-500" /></div>}
    </div>
  );
}

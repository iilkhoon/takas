'use client';

import { useTranslations } from 'next-intl';
import { ListingForm } from '@/components/ListingForm';
import { useRequireAuth } from '@/lib/hooks';
import { Spinner } from '@/components/ui';

export default function NewListingPage() {
  const t = useTranslations('form');
  const { ready } = useRequireAuth();
  return (
    <div className="container py-6 md:py-10">
      <h1 className="mb-6 font-display text-3xl font-black">{t('createTitle')}</h1>
      {ready ? <ListingForm /> : <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-nar-500" /></div>}
    </div>
  );
}

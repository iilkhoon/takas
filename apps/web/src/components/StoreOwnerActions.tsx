'use client';

import { Plus, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from './Providers';
import { ProfileActions } from './ProfileActions';

/** Mağaza səhifəsində: sahibinə idarəetmə düymələri, digərlərinə "Mesaj yaz" */
export function StoreOwnerActions({ ownerId }: { ownerId: string }) {
  const t = useTranslations('stores');
  const { me } = useAuth();
  if (me?.id !== ownerId) return <ProfileActions userId={ownerId} />;
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/listings/new" className="btn btn-primary">
        <Plus className="h-4 w-4" strokeWidth={3} />
        {t('newListing')}
      </Link>
      <Link href="/store" className="btn btn-outline">
        <Settings2 className="h-4 w-4" />
        {t('manageTitle')}
      </Link>
    </div>
  );
}

'use client';

import { MessageCircle, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useAuth } from './Providers';

export function ProfileActions({ userId }: { userId: string }) {
  const t = useTranslations('profile');
  const { me } = useAuth();
  const router = useRouter();
  if (me?.id === userId)
    return (
      <Link href="/settings" className="btn btn-outline">
        <Pencil className="h-4 w-4" />
        {t('editProfile')}
      </Link>
    );
  return (
    <button
      className="btn btn-dark"
      onClick={async () => {
        if (!me) return router.push('/login');
        const r = await api<{ id: string }>('/conversations', { method: 'POST', body: { userId } });
        router.push(`/messages/${r.id}`);
      }}
    >
      <MessageCircle className="h-4 w-4" />
      {t('message')}
    </button>
  );
}
